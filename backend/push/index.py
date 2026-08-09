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


def web_link(url: str) -> str:
    """Полный веб-адрес для уведомления (OneSignal не принимает относительные).

    Пустая строка — значит адрес сайта не задан и поле отправлять не нужно.
    """
    if url.startswith('http'):
        return _idna(url)
    base = os.environ.get('APP_WEB_URL', '').strip().rstrip('/')
    if not base:
        return ''
    path = url if url.startswith('/') else '/' + url
    return _idna(base) + path


def _idna(full_url: str) -> str:
    """Переводит кириллический домен в технический вид (punycode).

    Сервис уведомлений принимает только латинские адреса, поэтому
    полуто-н.рф превращаем в xn----utbhbbdxh.xn--p1ai автоматически.
    """
    try:
        head, rest = full_url.split('://', 1)
        host, slash, tail = rest.partition('/')
        if host.isascii():
            return full_url
        return f"{head}://{host.encode('idna').decode()}{slash}{tail}"
    except Exception:
        return full_url


def deep_link(url: str) -> str:
    """Ссылка для перехода ВНУТРЬ приложения, а не в браузер.

    Схема приложения (APP_DEEPLINK_SCHEME, например `poluton`) регистрируется
    в обёртке приложения. Тогда нажатие на пуш открывает само приложение
    на нужном экране, а не веб-версию в браузере.
    """
    scheme = os.environ.get('APP_DEEPLINK_SCHEME', '').strip()
    if not scheme or not url:
        return url or '/'
    # Уже готовая deep-link ссылка — не трогаем
    if '://' in url and not url.startswith('http'):
        return url
    path = url
    if path.startswith('http'):
        # Вырезаем путь из полного адреса сайта
        parts = path.split('/', 3)
        path = '/' + (parts[3] if len(parts) > 3 else '')
    if not path.startswith('/'):
        path = '/' + path
    return f'{scheme}://open{path}'

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

def apply_links(payload: dict, url: str):
    """Проставляет ссылку открытия уведомления.

    Всегда даём обычную веб-ссылку: обёртка приложения открывает её ВНУТРИ
    приложения, а на телефоне без приложения — в браузере. Своя схема
    приложения идёт дополнительно, чтобы новые сборки открывали нужный экран.
    """
    web = web_link(url)
    if web:
        payload['url'] = web
    link = deep_link(url)
    if link and not link.startswith('http'):
        payload.setdefault('data', {})['deeplink'] = link


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
        'data': {'targetUrl': url, 'path': url, 'url': url},
    }
    apply_links(payload, url)
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
        errs = data.get('errors')
        if errs:
            msg = errs[0] if isinstance(errs, list) and errs else str(errs)
            low = str(msg).lower()
            if 'not subscribed' in low or "doesn't match" in low or 'no subscribers' in low:
                msg = 'Устройство пользователя не подписано на уведомления или не связано с аккаунтом'
            return {'ok': False, 'error': msg}
        return {'ok': True, 'result': data}
    except urllib.error.HTTPError as e:
        return {'ok': False, 'error': e.read().decode('utf-8', 'ignore'), 'status': e.code}


def remember_device(user_id: int, subscription_id: str = '', onesignal_id: str = ''):
    """Запоминает устройство пользователя, чтобы слать уведомления адресно."""
    if not subscription_id and not onesignal_id:
        return
    try:
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        sid = subscription_id.replace("'", "''")
        oid = onesignal_id.replace("'", "''")
        cur.execute(
            f"INSERT INTO {schema}.user_onesignal (user_id, onesignal_id, subscription_id, updated_at) "
            f"VALUES ({int(user_id)}, NULLIF('{oid}',''), NULLIF('{sid}',''), NOW()) "
            f"ON CONFLICT (user_id) DO UPDATE SET "
            f"onesignal_id = COALESCE(NULLIF('{oid}',''), {schema}.user_onesignal.onesignal_id), "
            f"subscription_id = COALESCE(NULLIF('{sid}',''), {schema}.user_onesignal.subscription_id), "
            f"updated_at = NOW()"
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[remember_device] user_id={user_id} error={e}")


def device_subscriptions(user_id: int) -> list:
    """Возвращает известные устройства пользователя для адресной отправки."""
    try:
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        cur.execute(
            f"SELECT subscription_id FROM {schema}.user_onesignal "
            f"WHERE user_id = {int(user_id)} AND subscription_id IS NOT NULL"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [r[0] for r in rows if r[0]]
    except Exception as e:
        print(f"[device_subscriptions] user_id={user_id} error={e}")
        return []


def onesignal_send_to_user(user_id: int, title: str, body_text: str, url: str = '/') -> dict:
    """Отправляет push конкретному пользователю через OneSignal по External ID."""
    app_id = os.environ.get('ONESIGNAL_APP_ID', '')
    api_key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
    if not app_id or not api_key:
        return {'ok': False, 'error': 'Не заданы ключи OneSignal'}
    subs = device_subscriptions(user_id)
    payload = {
        'app_id': app_id,
        'target_channel': 'push',
        'headings': {'en': title, 'ru': title},
        'contents': {'en': body_text, 'ru': body_text},
        # Данные для навигации внутри приложения — обёртка читает их и
        # открывает нужный экран, не выкидывая пользователя в браузер.
        # targetUrl — так обёртка приложения (Median) понимает, какой экран
        # открыть ВНУТРИ приложения вместо запуска браузера.
        'data': {'targetUrl': url, 'path': url, 'url': url},
    }
    # Адресуем напрямую устройству, если знаем его. Это надёжнее привязки
    # по аккаунту: она иногда слетает при переустановке приложения.
    if subs:
        payload['include_subscription_ids'] = subs
    else:
        payload['include_aliases'] = {'external_id': [str(user_id)]}
    apply_links(payload, url)
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
        print(f"[onesignal_send_to_user] user_id={user_id} response={json.dumps(data)[:300]}")
        errs = data.get('errors')
        # OneSignal может вернуть errors как list ["..."] либо как dict
        # {'invalid_aliases': {'external_id': ['77']}} — значит устройство не
        # привязано к этому аккаунту.
        if errs:
            if isinstance(errs, dict) and 'invalid_aliases' in errs:
                return {'ok': False, 'error': 'Устройство пользователя не связано с аккаунтом (нет привязки в OneSignal). Нужно, чтобы он зашёл в приложение с включёнными уведомлениями.', 'code': 'not_linked'}
            msg = errs[0] if isinstance(errs, list) and errs else str(errs)
            low = str(msg).lower()
            if 'not subscribed' in low or "doesn't match" in low or 'no subscribers' in low or 'invalid_aliases' in low:
                msg = 'Устройство пользователя не подписано на уведомления или не связано с аккаунтом'
            return {'ok': False, 'error': msg}
        # Успешный ответ, но 0 получателей — тоже значит «некому доставить»
        if data.get('recipients', 1) == 0:
            return {'ok': False, 'error': 'Нет получателей: устройство не подписано или не привязано к аккаунту', 'code': 'no_recipients'}
        return {'ok': True, 'result': data}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', 'ignore')
        print(f"[onesignal_send_to_user] user_id={user_id} HTTP {e.code}: {err_body[:300]}")
        return {'ok': False, 'error': err_body, 'status': e.code}


def onesignal_link_user(user_id: int, subscription_id: str = '', onesignal_id: str = '') -> dict:
    """Связывает устройство OneSignal с аккаунтом (external_id = наш user_id).

    Резервная серверная привязка: работает даже на старых сборках APK, где
    нативный мост не вызывает login(). Использует v2 API OneSignal.
    """
    app_id = os.environ.get('ONESIGNAL_APP_ID', '')
    api_key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
    if not app_id or not api_key:
        return {'ok': False, 'error': 'Не заданы ключи OneSignal'}
    scheme = 'Key' if api_key.startswith('os_v2_') else 'Basic'
    headers = {'Content-Type': 'application/json; charset=utf-8',
               'Authorization': f'{scheme} {api_key}'}
    base = f'https://api.onesignal.com/apps/{app_id}'

    def _req(method, url, payload=None):
        data = json.dumps(payload).encode('utf-8') if payload is not None else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status, json.loads(r.read().decode('utf-8') or '{}')
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', 'ignore')
            try:
                return e.code, json.loads(body)
            except Exception:
                return e.code, {'raw': body}

    ext = str(user_id)
    print(f"[onesignal_link] user_id={ext} onesignal_id={'yes' if onesignal_id else 'no'} subscription_id={'yes' if subscription_id else 'no'}")

    # Способ 1: если знаем onesignal_id устройства — добавляем ему alias external_id
    if onesignal_id:
        st, body = _req('PATCH', f'{base}/users/by/onesignal_id/{onesignal_id}/identity',
                        {'identity': {'external_id': ext}})
        print(f"[onesignal_link] method=onesignal_id status={st} body={json.dumps(body)[:300]}")
        if st in (200, 201):
            return {'ok': True, 'linked': 'onesignal_id'}
        # Резерв: создаём пользователя с external_id и alias onesignal_id
        st2, body2 = _req('POST', f'{base}/users', {
            'identity': {'external_id': ext, 'onesignal_id': onesignal_id},
        })
        print(f"[onesignal_link] method=onesignal_id_create status={st2} body={json.dumps(body2)[:300]}")
        if st2 in (200, 201):
            return {'ok': True, 'linked': 'onesignal_id_create'}

    # Способ 2: создаём/обновляем пользователя external_id и подключаем subscription
    if subscription_id:
        st, body = _req('POST', f'{base}/users', {
            'identity': {'external_id': ext},
            'subscriptions': [{'id': subscription_id, 'type': 'AndroidPush'}],
        })
        print(f"[onesignal_link] method=subscription status={st} body={json.dumps(body)[:300]}")
        if st in (200, 201):
            return {'ok': True, 'linked': 'subscription'}
        return {'ok': False, 'error': body}

    print(f"[onesignal_link] user_id={ext} — нет идентификаторов устройства")
    return {'ok': False, 'error': 'Нужен subscription_id или onesignal_id'}


def onesignal_user_status(user_id: int) -> dict:
    """Запрашивает у OneSignal состояние пользователя по External ID.

    Возвращает: привязано ли устройство, сколько push-подписок, подписаны ли они.
    """
    app_id = os.environ.get('ONESIGNAL_APP_ID', '')
    api_key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
    if not app_id or not api_key:
        return {'ok': False, 'error': 'Не заданы ключи OneSignal'}
    scheme = 'Key' if api_key.startswith('os_v2_') else 'Basic'
    headers = {'Content-Type': 'application/json; charset=utf-8',
               'Authorization': f'{scheme} {api_key}'}
    url = f'https://api.onesignal.com/apps/{app_id}/users/by/external_id/{user_id}'
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return {'ok': True, 'linked': False, 'devices': 0, 'subscribed': 0,
                    'message': 'Устройство не привязано к аккаунту (в OneSignal нет пользователя с этим External ID). Пользователь должен войти в аккаунт и включить уведомления.'}
        return {'ok': False, 'error': e.read().decode('utf-8', 'ignore'), 'status': e.code}
    except Exception as ex:
        return {'ok': False, 'error': str(ex)}

    subs = data.get('subscriptions') or []
    push_subs = [s for s in subs if str(s.get('type', '')).lower().endswith('push')]
    subscribed = [s for s in push_subs if s.get('enabled') and s.get('notification_types', 0) != 0]
    devices_info = []
    for s in push_subs:
        devices_info.append({
            'type': s.get('type'),
            'device': s.get('device_model') or s.get('device_os') or '—',
            'enabled': bool(s.get('enabled')),
            'notification_types': s.get('notification_types'),
        })
    return {
        'ok': True,
        'linked': True,
        'devices': len(push_subs),
        'subscribed': len(subscribed),
        'devices_info': devices_info,
        'message': (
            f'Устройство привязано. Активных push-подписок: {len(subscribed)} из {len(push_subs)}.'
            if subscribed else
            'Устройство привязано, но НЕ подписано на push (пользователь не разрешил уведомления или отключил их).'
        ),
    }


def handler(event: dict, context) -> dict:
    """Управление push-подписками."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # Проверка статуса привязки пользователя в OneSignal (админ-токен)
    if action == 'onesignal_status':
        admin = (event.get('headers') or {}).get('X-Admin-Token', '') or \
                (event.get('headers') or {}).get('x-admin-token', '')
        if not admin or admin != os.environ.get('ADMIN_TOKEN', ''):
            return resp(403, {'error': 'Нет доступа'})
        uid = int(params.get('user_id', 0))
        if not uid:
            return resp(400, {'error': 'user_id обязателен'})
        result = onesignal_user_status(uid)
        return resp(200 if result.get('ok') else 502, result)

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
            # «Знакомство дня» доступно только по Premium — шлём пуш только им.
            cur.execute(
                "SELECT id FROM users WHERE removed_at IS NULL AND premium = TRUE"
            )
            user_ids = [r[0] for r in cur.fetchall()]
            sent = 0
            for uid in user_ids:
                try:
                    # OneSignal — доходит даже при закрытом приложении
                    onesignal_send_to_user(uid, title, text, link)
                    # Web Push — резервный канал
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

        # Диагностика: устройство сообщает, что доступно в его обёртке.
        # Пишем в лог, чтобы понять, почему привязка не срабатывает.
        if action == 'onesignal_diag':
            body_raw = json.loads(event.get('body') or '{}')
            print(f"[onesignal_diag] user_id={me['id']} report={json.dumps(body_raw)[:800]}")
            return resp(200, {'ok': True})

        # Резервная серверная привязка устройства OneSignal к аккаунту
        if action == 'onesignal_link':
            body_raw = json.loads(event.get('body') or '{}')
            sub_id = (body_raw.get('subscription_id') or '').strip()
            os_id = (body_raw.get('onesignal_id') or '').strip()
            print(f"[onesignal_link] request user_id={me['id']} sub_id={'yes' if sub_id else 'no'} os_id={'yes' if os_id else 'no'}")
            if not sub_id and not os_id:
                return resp(400, {'error': 'Нужен subscription_id или onesignal_id'})
            remember_device(me['id'], sub_id, os_id)
            result = onesignal_link_user(me['id'], sub_id, os_id)
            return resp(200 if result['ok'] else 502, result)

        # Тестовый push (и Web Push, и OneSignal — что доступно)
        if action == 'test':
            send_push_to_user(cur, conn, me['id'], 'Полутон 💕', 'Push-уведомления работают! 🎉', '/')
            os_res = onesignal_send_to_user(me['id'], 'Полутон 💕', 'Push-уведомления работают! 🎉', '/')
            return resp(200, {'ok': True, 'onesignal': os_res})

        return resp(400, {'error': f'Неизвестное действие: {action}'})
    finally:
        conn.close()