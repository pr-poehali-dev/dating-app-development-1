"""
Push-уведомления: сохранение подписок и отправка через Web Push (VAPID).
"""
import json
import os
import urllib.request
import urllib.error
import psycopg2
from pywebpush import webpush, WebPushException

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Admin-Token',
}

def get_conn():
    return psycopg2.connect(
        os.environ['DATABASE_URL'],
        options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}"
    )

def get_token(event: dict) -> str:
    raw = (event.get('headers') or {}).get('Authorization', '') or \
          (event.get('headers') or {}).get('authorization', '') or \
          (event.get('headers') or {}).get('X-Authorization', '') or \
          (event.get('headers') or {}).get('x-authorization', '')
    return raw.replace('Bearer ', '').strip()

def get_me(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM users WHERE id = (SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW() LIMIT 1)",
        (token,)
    )
    row = cur.fetchone()
    return {'id': row[0]} if row else None

def resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False)}

def send_push_to_user(cur, conn, user_id: int, title: str, body_text: str, url: str = '/'):
    """Отправляет push всем подпискам пользователя. Удаляет невалидные (410/404)."""
    vapid_private = os.environ.get('VAPID_PRIVATE_KEY', '')
    vapid_email   = os.environ.get('VAPID_EMAIL', 'mailto:push@polyuton.app')
    if not vapid_private:
        return
    cur.execute(
        "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=%s",
        (user_id,)
    )
    rows = cur.fetchall()
    payload = json.dumps({'title': title, 'body': body_text, 'url': url})
    bad_ids = []
    for row_id, endpoint, p256dh, auth_key in rows:
        try:
            webpush(
                subscription_info={'endpoint': endpoint, 'keys': {'p256dh': p256dh, 'auth': auth_key}},
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims={'sub': vapid_email},
            )
        except WebPushException as e:
            status = getattr(e.response, 'status_code', 0) if e.response else 0
            if status in (404, 410):
                bad_ids.append(row_id)
    if bad_ids:
        cur.execute("DELETE FROM push_subscriptions WHERE id = ANY(%s)", (bad_ids,))
        conn.commit()

def onesignal_send(title: str, body_text: str, url: str, segment: str = 'Subscribed Users') -> dict:
    """Отправляет push через OneSignal REST API всем подписчикам сегмента."""
    app_id = os.environ.get('ONESIGNAL_APP_ID', '')
    api_key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
    if not app_id or not api_key:
        return {'ok': False, 'error': 'Не заданы ключи OneSignal'}
    payload = {
        'app_id': app_id,
        'included_segments': [segment],
        'headings': {'en': title, 'ru': title},
        'contents': {'en': body_text, 'ru': body_text},
        'url': url,
    }
    scheme = 'Key' if api_key.startswith('os_v2_') else 'Basic'
    req = urllib.request.Request(
        'https://onesignal.com/api/v1/notifications',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': f'{scheme} {api_key}',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            data = json.loads(r.read().decode('utf-8'))
        return {'ok': True, 'result': data}
    except urllib.error.HTTPError as e:
        return {'ok': False, 'error': e.read().decode('utf-8', 'ignore'), 'status': e.code}


def onesignal_send_to_user(user_id: int, title: str, body_text: str, url: str = '/') -> dict:
    """Отправляет push конкретному пользователю через OneSignal по External ID."""
    app_id = os.environ.get('ONESIGNAL_APP_ID', '')
    api_key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
    if not app_id or not api_key:
        return {'ok': False, 'error': 'Не заданы ключи OneSignal'}
    payload = {
        'app_id': app_id,
        'include_aliases': {'external_id': [str(user_id)]},
        'target_channel': 'push',
        'headings': {'en': title, 'ru': title},
        'contents': {'en': body_text, 'ru': body_text},
        'url': url,
    }
    scheme = 'Key' if api_key.startswith('os_v2_') else 'Basic'
    req = urllib.request.Request(
        'https://onesignal.com/api/v1/notifications',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json; charset=utf-8',
                 'Authorization': f'{scheme} {api_key}'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            data = json.loads(r.read().decode('utf-8'))
        return {'ok': True, 'result': data}
    except urllib.error.HTTPError as e:
        return {'ok': False, 'error': e.read().decode('utf-8', 'ignore'), 'status': e.code}


def handler(event: dict, context) -> dict:
    """Управление push-подписками."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # Тестовая отправка конкретному пользователю через OneSignal (админ-токен)
    if action == 'onesignal_test':
        admin = (event.get('headers') or {}).get('X-Admin-Token', '') or \
                (event.get('headers') or {}).get('x-admin-token', '')
        if not admin or admin != os.environ.get('ADMIN_TOKEN', ''):
            return resp(403, {'error': 'Нет доступа'})
        b = json.loads(event.get('body') or '{}')
        uid = int(b.get('user_id', 0))
        if not uid:
            return resp(400, {'error': 'user_id обязателен'})
        title = (b.get('title') or 'Полутон 💕').strip()
        text = (b.get('body') or 'Тестовое уведомление работает! 🎉').strip()
        result = onesignal_send_to_user(uid, title, text, '/')
        return resp(200 if result['ok'] else 502, result)

    # Отправка уведомления через OneSignal (только с админ-токеном)
    if action == 'onesignal_send':
        admin = (event.get('headers') or {}).get('X-Admin-Token', '') or \
                (event.get('headers') or {}).get('x-admin-token', '')
        if not admin or admin != os.environ.get('ADMIN_TOKEN', ''):
            return resp(403, {'error': 'Нет доступа'})
        b = json.loads(event.get('body') or '{}')
        title = (b.get('title') or 'Полутон 💕').strip()
        text = (b.get('body') or '').strip()
        link = (b.get('url') or '/').strip()
        if not text:
            return resp(400, {'error': 'Пустой текст уведомления'})
        result = onesignal_send(title, text, link)
        return resp(200 if result['ok'] else 502, result)

    # Утренняя рассылка «Знакомство дня» — вызывается по расписанию (cron).
    # Защита: секрет ADMIN_TOKEN в query (?key=) или заголовке X-Admin-Token.
    if action == 'daily_match_broadcast':
        key = params.get('key', '') or \
              (event.get('headers') or {}).get('X-Admin-Token', '') or \
              (event.get('headers') or {}).get('x-admin-token', '')
        if not key or key != os.environ.get('ADMIN_TOKEN', ''):
            return resp(403, {'error': 'Нет доступа'})

        title = 'Полутон 💜'
        text = 'Твоё «Знакомство дня» готово — посмотри, кого подобрал ИИ!'
        link = '/?daily_match=1'

        conn = get_conn()
        try:
            cur = conn.cursor()
            # Все пользователи с активной подпиской на пуши (не удалённые)
            cur.execute(
                "SELECT DISTINCT ps.user_id FROM push_subscriptions ps "
                "JOIN users u ON u.id = ps.user_id "
                "WHERE u.removed_at IS NULL"
            )
            user_ids = [r[0] for r in cur.fetchall()]
            sent = 0
            for uid in user_ids:
                try:
                    send_push_to_user(cur, conn, uid, title, text, link)
                    sent += 1
                except Exception:
                    pass
            return resp(200, {'ok': True, 'recipients': len(user_ids), 'sent': sent})
        finally:
            conn.close()

    # Публичный VAPID-ключ — без авторизации
    if action == 'vapid_public_key':
        return resp(200, {'public_key': os.environ.get('VAPID_PUBLIC_KEY', '')})

    # Одноразовая генерация VAPID-ключей
    if action == 'generate_vapid':
        import base64
        from py_vapid import Vapid
        from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, PrivateFormat, NoEncryption
        v = Vapid()
        v.generate_keys()
        priv = base64.urlsafe_b64encode(
            v.private_key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
        ).decode().rstrip('=')
        pub = base64.urlsafe_b64encode(
            v.public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
        ).decode().rstrip('=')
        return resp(200, {
            'VAPID_PRIVATE_KEY': priv,
            'VAPID_PUBLIC_KEY': pub,
            'note': 'Save to secrets, then do not call this again'
        })

    conn = get_conn()
    try:
        cur = conn.cursor()
        token = get_token(event)
        me = get_me(conn, token)
        if not me:
            return resp(401, {'error': 'Не авторизован'})

        # Сохранить подписку
        if action == 'subscribe':
            body_raw = json.loads(event.get('body') or '{}')
            endpoint = body_raw.get('endpoint', '').strip()
            p256dh   = body_raw.get('keys', {}).get('p256dh', '').strip()
            auth_key = body_raw.get('keys', {}).get('auth', '').strip()
            if not endpoint or not p256dh or not auth_key:
                return resp(400, {'error': 'Неполные данные подписки'})
            cur.execute(
                """INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
                   VALUES (%s, %s, %s, %s)
                   ON CONFLICT (user_id, endpoint) DO UPDATE
                   SET p256dh=EXCLUDED.p256dh, auth=EXCLUDED.auth""",
                (me['id'], endpoint, p256dh, auth_key)
            )
            conn.commit()
            return resp(200, {'ok': True})

        # Тестовый push
        if action == 'test':
            send_push_to_user(cur, conn, me['id'], 'Полутон 💕', 'Push-уведомления работают! 🎉', '/')
            return resp(200, {'ok': True})

        return resp(400, {'error': f'Неизвестное действие: {action}'})
    finally:
        conn.close()