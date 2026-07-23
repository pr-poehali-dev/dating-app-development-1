"""
Сообщения: list / send / delete
Роутинг через query-параметр ?action=...
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3
from moderation import moderate_text, moderate_photo, score_to_priority, push_to_queue, get_setting

def _push_to_user(cur, conn, user_id: int, title: str, body_text: str, url: str = '/'):
    """Отправляет Web Push всем подпискам пользователя."""
    try:
        from pywebpush import webpush, WebPushException
        vapid_private = os.environ.get('VAPID_PRIVATE_KEY', '')
        vapid_email   = os.environ.get('VAPID_EMAIL', 'mailto:push@polyuton.app')
        if not vapid_private:
            return
        cur.execute("SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=%s", (user_id,))
        rows = cur.fetchall()
        payload = json.dumps({'title': title, 'body': body_text, 'url': url})
        bad = []
        for rid, ep, p256, auth in rows:
            try:
                webpush(
                    subscription_info={'endpoint': ep, 'keys': {'p256dh': p256, 'auth': auth}},
                    data=payload, vapid_private_key=vapid_private,
                    vapid_claims={'sub': vapid_email},
                )
            except WebPushException as e:
                st = getattr(e.response, 'status_code', 0) if e.response else 0
                if st in (404, 410):
                    bad.append(rid)
        if bad:
            cur.execute("DELETE FROM push_subscriptions WHERE id = ANY(%s)", (bad,))
            conn.commit()
    except Exception:
        pass

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")

def get_me(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM users WHERE id = (SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW() LIMIT 1)",
        (token,)
    )
    row = cur.fetchone()
    return {'id': row[0]} if row else None

def get_token(event: dict) -> str:
    raw = (event.get('headers') or {}).get('Authorization', '') or \
          (event.get('headers') or {}).get('authorization', '') or \
          (event.get('headers') or {}).get('X-Authorization', '') or \
          (event.get('headers') or {}).get('x-authorization', '')
    return raw.replace('Bearer ', '').strip()

def resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False, default=str)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    token = get_token(event)

    conn = get_conn()
    try:
        me = get_me(conn, token)
        if not me:
            return resp(401, {'error': 'Не авторизован'})

        cur = conn.cursor()

        if action == 'list':
            try:
                match_id = int(params.get('match_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный match_id'})
            cur.execute(
                "SELECT id FROM matches WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
                (match_id, me['id'], me['id'])
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа'})

            cur.execute(
                "SELECT id, sender_id, text, created_at, read_at FROM messages WHERE match_id = %s ORDER BY created_at ASC",
                (match_id,)
            )
            msgs = []
            for r in cur.fetchall():
                msgs.append({
                    'id': r[0], 'sender_id': r[1], 'text': r[2],
                    'created_at': str(r[3]), 'out': r[1] == me['id'], 'read': r[4] is not None
                })
            cur.execute(
                "UPDATE messages SET read_at = NOW() WHERE match_id = %s AND sender_id != %s AND read_at IS NULL",
                (match_id, me['id'])
            )
            conn.commit()
            return resp(200, {'messages': msgs})

        if action == 'send':
            body = json.loads(event.get('body') or '{}')
            try:
                match_id = int(body.get('match_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный match_id'})
            text = body.get('text', '').strip()
            if not text:
                return resp(400, {'error': 'Пустое сообщение'})
            if len(text) > 5000:
                return resp(400, {'error': 'Сообщение слишком длинное (макс. 5000 символов)'})
            cur.execute(
                "SELECT id, user1_id, user2_id FROM matches WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
                (match_id, me['id'], me['id'])
            )
            match_row = cur.fetchone()
            if not match_row:
                return resp(403, {'error': 'Нет доступа'})
            partner_id = match_row[2] if match_row[1] == me['id'] else match_row[1]
            # Нельзя писать системному боту «Полутон» — это односторонний канал
            cur.execute("SELECT 1 FROM users WHERE id = %s AND email = 'system@lbloom.ru'", (partner_id,))
            if cur.fetchone():
                return resp(403, {'error': 'Это официальный аккаунт Полутон — отвечать нельзя'})
            cur.execute(
                "SELECT 1 FROM user_blocks WHERE (blocker_id=%s AND blocked_id=%s) OR (blocker_id=%s AND blocked_id=%s)",
                (me['id'], partner_id, partner_id, me['id'])
            )
            if cur.fetchone():
                return resp(403, {'error': 'Пользователь заблокирован'})

            # ── AI-модерация текста (пропускаем служебные сообщения __AUDIO__/__GIFT__/... ) ──
            ai_flag = False
            if not text.startswith('__') and get_setting(cur, 'text_moderation_enabled', 'true') == 'true':
                mod = moderate_text(text)
                if mod['score'] > 0:
                    block_th = float(get_setting(cur, 'auto_block_threshold', '85'))
                    review_th = float(get_setting(cur, 'review_threshold', '40'))
                    if mod['score'] >= block_th:
                        push_to_queue(cur, 'message', None, me['id'], text_snippet=text[:500],
                                      ai_verdict='violation', ai_score=mod['score'], ai_categories=mod['categories'],
                                      ai_reason='Автоблокировка: ' + ', '.join(mod['categories']),
                                      priority='high', status='auto_resolved', action_taken='auto_blocked', reviewed_by='ai')
                        cur.execute("UPDATE users SET ai_violation_count = ai_violation_count + 1 WHERE id = %s", (me['id'],))
                        conn.commit()
                        return resp(403, {'error': 'Сообщение заблокировано автоматической модерацией'})
                    if mod['score'] >= review_th:
                        ai_flag = True
                        push_to_queue(cur, 'message', None, me['id'], text_snippet=text[:500],
                                      ai_verdict='suspicious', ai_score=mod['score'], ai_categories=mod['categories'],
                                      ai_reason='На проверку: ' + ', '.join(mod['categories']),
                                      priority=score_to_priority(mod['score']), status='needs_review', reviewed_by='ai')

            cur.execute(
                "INSERT INTO messages (match_id, sender_id, text, ai_flagged) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                (match_id, me['id'], text, ai_flag)
            )
            row = cur.fetchone()
            conn.commit()
            # Push получателю
            cur.execute("SELECT name FROM users WHERE id=%s", (me['id'],))
            sn = cur.fetchone()
            sender_name = sn[0] if sn else 'Новое сообщение'
            preview = text if not text.startswith('__') else ('🎤 Голосовое' if text.startswith('__AUDIO__') else '📷 Фото' if text.startswith('__VANISH__') else '🎁 Подарок' if text.startswith('__GIFT__') else '📍 Локация' if text.startswith('__LOC__') else '🎨 Стикер' if text.startswith('__STICKER__') else '📵 Пропущенный видеозвонок' if text.startswith('__VCALL__missed') else '💬 Сообщение')
            push_title = f'📵 {sender_name}' if text.startswith('__VCALL__missed') else f'💬 {sender_name}'
            _push_to_user(cur, conn, partner_id, push_title, preview[:80], '/')
            return resp(200, {'id': row[0], 'sender_id': me['id'], 'text': text, 'created_at': str(row[1]), 'out': True})

        # Отправить первое сообщение без матча — создаём матч автоматически
        if action == 'send_direct':
            body = json.loads(event.get('body') or '{}')
            to_user_id = int(body.get('to_user_id', 0))
            text = body.get('text', '').strip()
            if not text or not to_user_id:
                return resp(400, {'error': 'to_user_id и text обязательны'})
            if to_user_id == me['id']:
                return resp(400, {'error': 'Нельзя писать самому себе'})
            # Проверяем блокировку
            cur.execute(
                "SELECT 1 FROM user_blocks WHERE (blocker_id=%s AND blocked_id=%s) OR (blocker_id=%s AND blocked_id=%s)",
                (me['id'], to_user_id, to_user_id, me['id'])
            )
            if cur.fetchone():
                return resp(403, {'error': 'Пользователь заблокирован'})
            # Ищем существующий матч
            u1, u2 = min(me['id'], to_user_id), max(me['id'], to_user_id)
            cur.execute("SELECT id FROM matches WHERE user1_id = %s AND user2_id = %s", (u1, u2))
            row = cur.fetchone()
            if row:
                match_id = row[0]
            else:
                cur.execute("INSERT INTO matches (user1_id, user2_id) VALUES (%s, %s) RETURNING id", (u1, u2))
                match_id = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                (match_id, me['id'], text)
            )
            row = cur.fetchone()
            conn.commit()
            return resp(200, {'ok': True, 'match_id': match_id, 'id': row[0], 'sender_id': me['id'], 'text': text, 'created_at': str(row[1])})

        # Загрузить фото для чата (vanish или обычное)
        if action == 'upload_chat_photo':
            body = json.loads(event.get('body') or '{}')
            image_data = body.get('image', '')
            content_type = body.get('content_type', 'image/jpeg')
            match_id = int(body.get('match_id', 0))
            if not image_data or not match_id:
                return resp(400, {'error': 'image и match_id обязательны'})
            cur.execute(
                "SELECT id FROM matches WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
                (match_id, me['id'], me['id'])
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа'})
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)
            if len(image_bytes) > 10 * 1024 * 1024:
                return resp(400, {'error': 'Файл слишком большой (макс. 10 МБ)'})
            ext = 'jpg' if 'jpeg' in content_type else content_type.split('/')[-1]
            key = f"chat_photos/{match_id}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

            # ── AI-модерация фото в чате ──
            if get_setting(cur, 'photo_moderation_enabled', 'true') == 'true':
                mod = moderate_photo(cdn_url, purpose='general')
                if mod['score'] > 0:
                    block_th = float(get_setting(cur, 'auto_block_threshold', '85'))
                    review_th = float(get_setting(cur, 'review_threshold', '40'))
                    if mod['score'] >= block_th:
                        push_to_queue(cur, 'message', None, me['id'], photo_url=cdn_url,
                                      ai_verdict='violation', ai_score=mod['score'], ai_categories=mod['categories'],
                                      ai_reason=mod['reason'] or 'Автоблокировка фото в чате',
                                      priority='high', status='auto_resolved', action_taken='auto_blocked', reviewed_by='ai')
                        cur.execute("UPDATE users SET ai_violation_count = ai_violation_count + 1 WHERE id = %s", (me['id'],))
                        conn.commit()
                        return resp(403, {'error': 'Фото не прошло автоматическую модерацию: ' + (mod['reason'] or 'нарушение правил')})
                    if mod['score'] >= review_th:
                        push_to_queue(cur, 'message', None, me['id'], photo_url=cdn_url,
                                      ai_verdict='suspicious', ai_score=mod['score'], ai_categories=mod['categories'],
                                      ai_reason=mod['reason'] or 'На проверку', priority=score_to_priority(mod['score']),
                                      status='needs_review', reviewed_by='ai')

            return resp(200, {'ok': True, 'photo_url': cdn_url})

        # WebRTC сигналинг: отправить сигнал (offer/answer/ice)
        if action == 'signal_send':
            body = json.loads(event.get('body') or '{}')
            match_id = int(body.get('match_id', 0))
            signal_type = body.get('signal_type', '')
            payload = body.get('payload', '')
            if not match_id or not signal_type or not payload:
                return resp(400, {'error': 'match_id, signal_type, payload обязательны'})
            cur.execute(
                "SELECT id FROM matches WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
                (match_id, me['id'], me['id'])
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа'})
            cur.execute(
                "INSERT INTO webrtc_signals (match_id, from_user_id, signal_type, payload) VALUES (%s, %s, %s, %s) RETURNING id",
                (match_id, me['id'], signal_type, payload)
            )
            conn.commit()
            return resp(200, {'ok': True})

        # WebRTC сигналинг: получить новые сигналы (polling)
        if action == 'signal_poll':
            try:
                match_id = int(params.get('match_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный match_id'})
            cur.execute(
                "SELECT id FROM matches WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
                (match_id, me['id'], me['id'])
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа'})

            # Просроченные offer-сигналы (никто не открыл чат и не ответил дольше 20 сек)
            # считаем неактуальными — помечаем потреблёнными, чтобы старый звонок не
            # «оживал» в виде входящего вызова спустя долгое время после того как
            # звонивший уже положил трубку.
            cur.execute(
                "UPDATE webrtc_signals SET is_consumed = TRUE "
                "WHERE match_id = %s AND signal_type = 'offer' AND is_consumed = FALSE "
                "AND created_at <= NOW() - INTERVAL '20 seconds'",
                (match_id,)
            )

            cur.execute(
                "SELECT id, from_user_id, signal_type, payload FROM webrtc_signals WHERE match_id = %s AND from_user_id != %s AND is_consumed = FALSE ORDER BY created_at ASC",
                (match_id, me['id'])
            )
            rows = cur.fetchall()
            signals = [{'id': r[0], 'from_user_id': r[1], 'signal_type': r[2], 'payload': r[3]} for r in rows]
            if rows:
                ids = [r[0] for r in rows]
                cur.execute(
                    "UPDATE webrtc_signals SET is_consumed = TRUE WHERE id = ANY(%s)",
                    (ids,)
                )
            # Чистим старые потреблённые сигналы, чтобы таблица не росла бесконечно
            cur.execute(
                "DELETE FROM webrtc_signals WHERE match_id = %s AND is_consumed = TRUE AND created_at <= NOW() - INTERVAL '1 hour'",
                (match_id,)
            )
            conn.commit()
            return resp(200, {'signals': signals})

        if action == 'delete':
            body = json.loads(event.get('body') or '{}')
            msg_id = int(body.get('message_id', 0))
            # Проверяем что сообщение принадлежит матчу, в котором участвует текущий пользователь
            cur.execute("""
                SELECT m.id FROM messages m
                JOIN matches ma ON ma.id = m.match_id
                WHERE m.id = %s AND (ma.user1_id = %s OR ma.user2_id = %s)
            """, (msg_id, me['id'], me['id']))
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа к этому сообщению'})
            cur.execute("DELETE FROM messages WHERE id = %s", (msg_id,))
            conn.commit()
            return resp(200, {'ok': True, 'message_id': msg_id})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()