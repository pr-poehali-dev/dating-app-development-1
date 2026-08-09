"""
Сообщения: list / send / delete
Роутинг через query-параметр ?action=...
"""
import json
import os
import base64
import uuid
import urllib.request
import psycopg2
import boto3
from moderation import moderate_text, moderate_photo, score_to_priority, push_to_queue, get_setting
from upload_guard import validate_upload

def _link(path: str = '/') -> str:
    """Абсолютная ссылка на нужный экран для перехода по уведомлению."""
    base = (os.environ.get('APP_WEB_URL', '') or '').rstrip('/')
    if not base:
        return path
    return base + (path if path.startswith('/') else '/' + path)


def _onesignal_to_user(user_id: int, title: str, body_text: str, url: str = '/', urgent: bool = False):
    """Отправляет push конкретному пользователю через OneSignal по External ID.

    urgent=True — для звонков: максимальный приоритет доставки, чтобы пуш
    будил телефон немедленно даже при закрытом приложении.
    """
    try:
        app_id = os.environ.get('ONESIGNAL_APP_ID', '')
        api_key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
        if not app_id or not api_key:
            return
        payload = {
            'app_id': app_id,
            'include_aliases': {'external_id': [str(user_id)]},
            'target_channel': 'push',
            'headings': {'en': title, 'ru': title},
            'contents': {'en': body_text, 'ru': body_text},
            'url': _link(url),
            'data': {'targetUrl': url, 'path': url},
        }
        if urgent:
            payload['priority'] = 10
            payload['ttl'] = 45
            payload['android_visibility'] = 1
            call_channel = os.environ.get('ONESIGNAL_CALL_CHANNEL_ID', '').strip()
            if call_channel:
                payload['android_channel_id'] = call_channel
        scheme = 'Key' if api_key.startswith('os_v2_') else 'Basic'
        req = urllib.request.Request(
            'https://onesignal.com/api/v1/notifications',
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json; charset=utf-8',
                     'Authorization': f'{scheme} {api_key}'},
            method='POST',
        )
        urllib.request.urlopen(req, timeout=8).read()
    except Exception:
        pass

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

        # Персональные фразы-«ледоколы» для начала разговора
        if action == 'icebreakers':
            try:
                match_id = int(params.get('match_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный match_id'})
            cur.execute(
                "SELECT user1_id, user2_id FROM matches WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
                (match_id, me['id'], me['id'])
            )
            mrow = cur.fetchone()
            if not mrow:
                return resp(403, {'error': 'Нет доступа'})
            partner_id = mrow[1] if mrow[0] == me['id'] else mrow[0]
            # Не показываем ледоколы для системного бота
            cur.execute("SELECT name, city, tags, email FROM users WHERE id = %s", (partner_id,))
            prow = cur.fetchone()
            if not prow or prow[3] == 'system@lbloom.ru':
                return resp(200, {'icebreakers': []})
            p_name = (prow[0] or '').strip()
            p_city = (prow[1] or '').strip()
            p_tags = prow[2] if isinstance(prow[2], list) else []
            # Мои интересы — чтобы найти общее
            cur.execute("SELECT tags FROM users WHERE id = %s", (me['id'],))
            myrow = cur.fetchone()
            my_tags = myrow[0] if myrow and isinstance(myrow[0], list) else []
            my_low = [t.lower() for t in my_tags]
            common = [t for t in p_tags if t.lower() in my_low]

            try:
                variant = int(params.get('variant', 0))
            except (ValueError, TypeError):
                variant = 0

            lines = []
            hi = f'Привет, {p_name}!' if p_name else 'Привет!'
            # Фразы по общим интересам
            for ct in common:
                ci = ct.lstrip('🎌 ').strip()
                lines.append(f'{hi} Вижу, ты тоже увлекаешься «{ci}» — как давно?')
                lines.append(f'О, у нас общий интерес — «{ci}». Что посоветуешь?')
            # Фразы по интересам собеседника
            for pt in p_tags:
                pi = pt.lstrip('🎌 ').strip()
                lines.append(f'{hi} Заметил в профиле «{pi}» — расскажешь подробнее?')
                lines.append(f'{hi} А «{pi}» — это надолго или недавнее увлечение?')
            # Фразы по городу
            if p_city:
                lines.append(f'{hi} Ты из {p_city}? Какое любимое место в городе?')
                lines.append(f'{hi} Что посоветуешь посмотреть в {p_city}?')
            # Универсальные
            lines.append(f'{hi} Как проходит твой день?')
            lines.append(f'{hi} Что тебя вдохновляет в последнее время?')
            lines.append(f'{hi} Чем любишь заниматься на выходных?')
            lines.append(f'{hi} Кофе или чай? От ответа многое зависит :)')
            lines.append(f'{hi} Расскажи, что подняло тебе настроение сегодня?')

            # Уникализируем, сохраняя порядок
            seen = set()
            uniq = []
            for l in lines:
                if l not in seen:
                    seen.add(l)
                    uniq.append(l)
            # Сдвигаем набор по variant, чтобы «Обновить» давало другие фразы
            if uniq:
                shift = (variant * 4) % len(uniq)
                uniq = uniq[shift:] + uniq[:shift]
            return resp(200, {'icebreakers': uniq[:4]})

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
                "SELECT id, sender_id, text, created_at, read_at, reaction FROM messages WHERE match_id = %s ORDER BY created_at ASC",
                (match_id,)
            )
            msgs = []
            for r in cur.fetchall():
                msgs.append({
                    'id': r[0], 'sender_id': r[1], 'text': r[2],
                    'created_at': str(r[3]), 'out': r[1] == me['id'], 'read': r[4] is not None,
                    'reaction': r[5]
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

            # Результат видеозвонка (__VCALL__accepted/missed): обе стороны могут
            # попытаться записать его. Защищаемся от дублей — если в этом матче за
            # последнюю минуту уже есть запись о звонке, новую не создаём.
            if text.startswith('__VCALL__'):
                cur.execute(
                    "SELECT 1 FROM messages WHERE match_id = %s AND text LIKE '__VCALL__%%' "
                    "AND created_at >= NOW() - INTERVAL '60 seconds' LIMIT 1",
                    (match_id,)
                )
                if cur.fetchone():
                    return resp(200, {'ok': True, 'deduped': True})
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
            chat_link = f'/?open=chat&match={match_id}'
            _push_to_user(cur, conn, partner_id, push_title, preview[:80], chat_link)
            _onesignal_to_user(partner_id, push_title, preview[:80], chat_link)
            return resp(200, {'id': row[0], 'sender_id': me['id'], 'text': text, 'created_at': str(row[1]), 'out': True})

        # Отправить первое сообщение без матча — создаём матч автоматически
        if action == 'open_chat':
            body = json.loads(event.get('body') or '{}')
            to_user_id = int(body.get('to_user_id', 0))
            if not to_user_id or to_user_id == me['id']:
                return resp(400, {'error': 'Некорректный to_user_id'})
            cur.execute(
                "SELECT 1 FROM user_blocks WHERE (blocker_id=%s AND blocked_id=%s) OR (blocker_id=%s AND blocked_id=%s)",
                (me['id'], to_user_id, to_user_id, me['id'])
            )
            if cur.fetchone():
                return resp(403, {'error': 'Пользователь заблокирован'})
            u1, u2 = min(me['id'], to_user_id), max(me['id'], to_user_id)
            cur.execute("SELECT id FROM matches WHERE user1_id = %s AND user2_id = %s", (u1, u2))
            row = cur.fetchone()
            if row:
                match_id = row[0]
            else:
                cur.execute("INSERT INTO matches (user1_id, user2_id) VALUES (%s, %s) RETURNING id", (u1, u2))
                match_id = cur.fetchone()[0]
                conn.commit()
            return resp(200, {'ok': True, 'match_id': match_id})

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
            cur.execute("SELECT name FROM users WHERE id=%s", (me['id'],))
            sd = cur.fetchone()
            sd_name = sd[0] if sd else 'Новое сообщение'
            sd_preview = text if not text.startswith('__') else '💬 Сообщение'
            sd_link = f'/?open=chat&match={match_id}'
            _push_to_user(cur, conn, to_user_id, f'💬 {sd_name}', sd_preview[:80], sd_link)
            _onesignal_to_user(to_user_id, f'💬 {sd_name}', sd_preview[:80], sd_link)
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
            _ok, ext, content_type, _err = validate_upload(content_type, image_bytes, 'image')
            if not _ok:
                return resp(400, {'error': _err})
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

        # Глобальный поллинг входящих видеозвонков (на любой вкладке приложения).
        # Ищем свежий непотреблённый offer в любом матче пользователя, где offer
        # пришёл НЕ от него самого. Offer НЕ помечаем consumed — этим займётся
        # обычный signal_poll уже внутри экрана звонка.
        if action == 'incoming_call':
            cur.execute(
                """
                SELECT s.match_id, s.from_user_id, s.payload
                FROM webrtc_signals s
                JOIN matches ma ON ma.id = s.match_id
                WHERE s.signal_type = 'offer'
                  AND s.is_consumed = FALSE
                  AND s.from_user_id != %s
                  AND (ma.user1_id = %s OR ma.user2_id = %s)
                  AND s.created_at >= NOW() - INTERVAL '60 seconds'
                ORDER BY s.created_at DESC
                LIMIT 1
                """,
                (me['id'], me['id'], me['id'])
            )
            row = cur.fetchone()
            if not row:
                return resp(200, {'call': None})
            match_id, from_user_id, payload = row[0], row[1], row[2]
            # Имя и фото звонящего для экрана входящего звонка
            cur.execute("SELECT name, photo_url FROM users WHERE id = %s", (from_user_id,))
            u = cur.fetchone()
            caller_name = u[0] if u else 'Собеседник'
            caller_photo = u[1] if u else ''
            # Ранние ICE-кандидаты, пришедшие вместе с offer
            cur.execute(
                """
                SELECT payload FROM webrtc_signals
                WHERE match_id = %s AND from_user_id = %s AND signal_type = 'ice'
                  AND is_consumed = FALSE
                ORDER BY created_at ASC
                """,
                (match_id, from_user_id)
            )
            early_ice = [r[0] for r in cur.fetchall()]
            return resp(200, {'call': {
                'match_id': match_id,
                'from_user_id': from_user_id,
                'offer': payload,
                'early_ice': early_ice,
                'caller_name': caller_name,
                'caller_photo': caller_photo,
            }})

        # WebRTC сигналинг: отправить сигнал (offer/answer/ice)
        if action == 'signal_send':
            body = json.loads(event.get('body') or '{}')
            match_id = int(body.get('match_id', 0))
            signal_type = body.get('signal_type', '')
            payload = body.get('payload', '')
            if not match_id or not signal_type or not payload:
                return resp(400, {'error': 'match_id, signal_type, payload обязательны'})
            cur.execute(
                "SELECT user1_id, user2_id FROM matches WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
                (match_id, me['id'], me['id'])
            )
            mrow = cur.fetchone()
            if not mrow:
                return resp(403, {'error': 'Нет доступа'})
            callee_id = mrow[1] if mrow[0] == me['id'] else mrow[0]

            # При начале звонка (offer) проверяем, не заблокировал ли нас собеседник.
            # Две независимые блокировки: общая (user_blocks) и запрет видеочатов (video_blocks).
            # Если стоит любая — не даём инициировать звонок и сообщаем звонящему причину.
            if signal_type == 'offer':
                cur.execute(
                    "SELECT 1 FROM user_blocks WHERE blocker_id=%s AND blocked_id=%s",
                    (callee_id, me['id'])
                )
                if cur.fetchone():
                    return resp(403, {
                        'error': 'Пользователь вас заблокировал — позвонить ему нельзя',
                        'blocked': True,
                    })
                cur.execute(
                    "SELECT 1 FROM video_blocks WHERE blocker_id=%s AND blocked_id=%s",
                    (callee_id, me['id'])
                )
                if cur.fetchone():
                    return resp(403, {
                        'error': 'Пользователь запретил видеозвонки от вас — позвонить ему нельзя',
                        'blocked': True,
                    })

            cur.execute(
                "INSERT INTO webrtc_signals (match_id, from_user_id, signal_type, payload) VALUES (%s, %s, %s, %s) RETURNING id",
                (match_id, me['id'], signal_type, payload)
            )
            conn.commit()

            # При начале звонка (offer) шлём получателю push «Входящий видеозвонок»,
            # чтобы он увидел вызов даже если приложение свёрнуто или закрыто.
            if signal_type == 'offer':
                cur.execute("SELECT name FROM users WHERE id = %s", (me['id'],))
                cn = cur.fetchone()
                caller_name = cn[0] if cn else 'Кто-то'
                # OneSignal — будит телефон даже при закрытом приложении (приоритетно)
                _onesignal_to_user(
                    callee_id,
                    '📹 Входящий видеозвонок',
                    f'{caller_name} звонит вам',
                    f'/?call={match_id}',
                    urgent=True,
                )
                # Web Push — резервный канал (когда браузер открыт/в фоне)
                _push_to_user(
                    cur, conn, callee_id,
                    '📹 Входящий видеозвонок',
                    f'{caller_name} звонит вам',
                    f'/?call={match_id}'
                )
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
                "AND created_at <= NOW() - INTERVAL '60 seconds'",
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

        # Поставить/снять реакцию (эмодзи) на сообщение
        if action == 'react':
            body = json.loads(event.get('body') or '{}')
            try:
                msg_id = int(body.get('message_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный message_id'})
            reaction = (body.get('reaction') or '').strip()
            if len(reaction) > 16:
                return resp(400, {'error': 'Некорректная реакция'})
            # Проверяем доступ: сообщение из матча текущего пользователя
            cur.execute("""
                SELECT m.id FROM messages m
                JOIN matches ma ON ma.id = m.match_id
                WHERE m.id = %s AND (ma.user1_id = %s OR ma.user2_id = %s)
            """, (msg_id, me['id'], me['id']))
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа к этому сообщению'})
            new_val = reaction if reaction else None
            cur.execute("UPDATE messages SET reaction = %s WHERE id = %s", (new_val, msg_id))
            conn.commit()
            return resp(200, {'ok': True, 'message_id': msg_id, 'reaction': new_val})

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