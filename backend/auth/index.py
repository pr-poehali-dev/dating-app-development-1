"""
Авторизация: register / login / logout / me / reset_password
Роутинг через query-параметр ?action=...
"""
import json
import os
import hashlib
import base64
import secrets
import smtplib
import urllib.request
import urllib.parse
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")

def hash_password(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()

def send_welcome_message(cur, user_id: int) -> None:
    """Приветственное сообщение от бота Полутон новому пользователю после регистрации."""
    bot_email = 'system@lbloom.ru'
    bot_photo = 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png'
    cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (bot_email,))
    bot_row = cur.fetchone()
    if not bot_row:
        cur.execute(
            "INSERT INTO users (name, email, password_hash, photo_url, verified) "
            "VALUES ('Полутон', %s, 'system_no_login', %s, TRUE) RETURNING id",
            (bot_email, bot_photo))
        bot_row = cur.fetchone()
    if not bot_row or bot_row[0] == user_id:
        return
    bot_id = bot_row[0]
    cur.execute(
        "SELECT id FROM matches WHERE (user1_id=%s AND user2_id=%s) OR (user1_id=%s AND user2_id=%s) LIMIT 1",
        (bot_id, user_id, user_id, bot_id))
    m = cur.fetchone()
    if not m:
        cur.execute("INSERT INTO matches (user1_id, user2_id) VALUES (%s, %s) RETURNING id", (bot_id, user_id))
        m = cur.fetchone()
    if not m:
        return
    text = (
        "Добро пожаловать в Полутон 💜\n\n"
        "Вот как получить максимум от приложения с первого дня!\n\n"
        "😍 Заполненный профиль = больше внимания. Открой свой профиль, добавь фото и расскажи о себе — так тебе будут чаще писать.\n\n"
        "📸 Верифицированный профиль = больше доверия. Пройди верификацию в профиле и получи постоянный значок «настоящий» — на такие анкеты откликаются охотнее.\n\n"
        "✨ «Знакомство дня» — каждый день ИИ подбирает для тебя людей по интересам. Загляни и найди свою пару! Функция доступна по подписке Premium.\n\n"
        "🔥 Хочешь ещё больше от Полутона? Загляни в раздел с пакетами подписки.\n\n"
        "🛡️ Будь в безопасности. Сообщай о нарушениях через функцию жалоб, а перед встречей проверяй собеседника по видеозвонку."
    )
    cur.execute("INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s)",
                (m[0], bot_id, text))

def hash_password_legacy(p: str) -> str:
    salt = os.environ.get('PASSWORD_SALT', 'lb_default_salt_v1')
    return hashlib.sha256(f"{salt}{p}".encode()).hexdigest()

def get_token(event: dict) -> str:
    raw = (event.get('headers') or {}).get('Authorization', '') or \
          (event.get('headers') or {}).get('authorization', '') or \
          (event.get('headers') or {}).get('X-Authorization', '') or \
          (event.get('headers') or {}).get('x-authorization', '')
    return raw.replace('Bearer ', '').strip()

def get_ip(event: dict) -> str:
    return (event.get('requestContext') or {}).get('identity', {}).get('sourceIp', 'unknown')

def get_ua(event: dict) -> str:
    h = event.get('headers') or {}
    return (h.get('User-Agent') or h.get('user-agent') or '')[:300]

def resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False, default=str)}

LOGO_URL = 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png'

def build_email_html(preheader: str, heading: str, intro: str, highlight_label: str, highlight_value: str, note: str, footer: str) -> str:
    """Единый брендированный HTML-шаблон писем Полутон (тёмная тема, розово-фиолетовый градиент)."""
    return f"""\
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Полутон</title>
</head>
<body style="margin:0;padding:0;background-color:#0e0a18;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e0a18;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#181225;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#FF2D78,#9B59B6);padding:32px 32px 28px;text-align:center;">
              <img src="{LOGO_URL}" width="64" height="64" alt="Полутон" style="border-radius:18px;display:block;margin:0 auto 14px;box-shadow:0 6px 20px rgba(0,0,0,0.25);">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.5px;">Полутон</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h2 style="margin:0 0 8px;color:#ffffff;font-size:19px;font-weight:700;">{heading}</h2>
              <p style="margin:0;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;">
                {intro}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;">
              <div style="background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.3);border-radius:16px;padding:20px;text-align:center;">
                <div style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">{highlight_label}</div>
                <div style="color:#ffffff;font-size:28px;font-weight:800;font-family:'Courier New',monospace;letter-spacing:3px;word-break:break-all;">{highlight_value}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 30px;">
              <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;">
                {note}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;line-height:1.5;">
                {footer}<br>
                С любовью, команда Полутон 💕
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:rgba(255,255,255,0.2);font-size:11px;">
          Это автоматическое письмо, отвечать на него не нужно.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""

def check_rate_limit(cur, ip: str, action: str, max_attempts: int, window_minutes: int) -> bool:
    """Возвращает True если лимит превышен"""
    cur.execute(
        "SELECT COUNT(*) FROM auth_attempts WHERE ip = %s AND action = %s AND success = FALSE "
        "AND created_at > NOW() - INTERVAL '%s minutes'",
        (ip, action, window_minutes)
    )
    count = cur.fetchone()[0]
    return count >= max_attempts

def cleanup_security_logs(cur):
    """Периодическая автоочистка журналов безопасности (вызывается с малой
    вероятностью, чтобы не нагружать каждый запрос). Записи попыток входа
    старше 24 часов бесполезны (окна rate-limit — минуты), журнал событий
    безопасности храним 90 дней."""
    try:
        cur.execute("DELETE FROM auth_attempts WHERE created_at < NOW() - INTERVAL '24 hours'")
        cur.execute("DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days'")
    except Exception:
        pass

def log_attempt(cur, ip: str, action: str, success: bool, email: str = None):
    cur.execute(
        "INSERT INTO auth_attempts (ip, action, success, email) VALUES (%s, %s, %s, %s)",
        (ip, action, success, email)
    )
    # ~2% запросов запускают уборку старых записей
    if secrets.randbelow(50) == 0:
        cleanup_security_logs(cur)

def audit(cur, event_type: str, severity: str, ip: str = None, user_id: int = None, email: str = None, details: dict = None):
    cur.execute(
        "INSERT INTO security_events (event_type, severity, ip, user_id, email, details) VALUES (%s, %s, %s, %s, %s, %s)",
        (event_type, severity, ip, user_id, email, json.dumps(details or {}))
    )

def is_ip_blocked(cur, ip: str) -> str:
    """Возвращает причину блокировки, если IP в чёрном списке, иначе None."""
    if not ip or ip == 'unknown':
        return None
    cur.execute("SELECT reason FROM blocked_ips WHERE ip_address = %s", (ip,))
    row = cur.fetchone()
    return row[0] if row else None

def build_user_dict(cur, user_id: int) -> dict:
    """Собирает полный объект пользователя (как в login)."""
    cur.execute(
        "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium, u.premium_tier, u.username, u.height, u.weight, u.relationship_status, u.created_at, u.cover_url, u.show_age, u.zodiac "
        "FROM users u WHERE u.id = %s", (user_id,)
    )
    urow = cur.fetchone()
    cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium', 'premium_tier', 'username', 'height', 'weight', 'relationship_status', 'created_at', 'cover_url', 'show_age', 'zodiac']
    user = dict(zip(cols, urow))
    user['created_at'] = str(user['created_at']) if user['created_at'] else None
    cur.execute("SELECT COUNT(*) FROM user_subscriptions WHERE target_id = %s", (user_id,))
    user['followers'] = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM user_subscriptions WHERE subscriber_id = %s", (user_id,))
    user['following'] = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM email_codes WHERE user_id = %s AND used = TRUE", (user_id,))
    user['email_verified'] = cur.fetchone()[0] > 0
    return user


def oauth_find_or_create(cur, provider: str, provider_uid: str, email: str, name: str, photo_url: str) -> int:
    """Находит или создаёт пользователя по данным OAuth. Возвращает user_id."""
    email = (email or '').strip().lower()
    # 1) Ищем по связке provider+uid
    cur.execute(
        "SELECT user_id FROM oauth_accounts WHERE provider = %s AND provider_uid = %s",
        (provider, str(provider_uid))
    )
    row = cur.fetchone()
    if row:
        return row[0]
    # 2) Если есть email — ищем существующего пользователя, привязываем
    user_id = None
    if email:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        r = cur.fetchone()
        if r:
            user_id = r[0]
    # 3) Создаём нового пользователя
    if not user_id:
        placeholder_email = email or f"{provider}_{provider_uid}@oauth.local"
        cur.execute(
            "INSERT INTO users (email, password_hash, name, photo_url, verified) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (placeholder_email, 'oauth_no_password', (name or 'Пользователь')[:50], photo_url or None, False)
        )
        user_id = cur.fetchone()[0]
        cur.execute("UPDATE users SET username = %s WHERE id = %s", (f"user_{user_id}", user_id))
    # Привязываем oauth-аккаунт
    cur.execute(
        "INSERT INTO oauth_accounts (user_id, provider, provider_uid, email) VALUES (%s, %s, %s, %s) "
        "ON CONFLICT (provider, provider_uid) DO NOTHING",
        (user_id, provider, str(provider_uid), email or None)
    )
    return user_id


def http_get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={'User-Agent': 'Polyuton/1.0'})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode('utf-8'))


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    token = get_token(event)
    body = json.loads(event.get('body') or '{}')
    ip = get_ip(event)
    ua = get_ua(event)

    conn = get_conn()
    try:
        cur = conn.cursor()

        if action == 'register':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            name = body.get('name', '').strip()
            if not email or not password or not name:
                return resp(400, {'error': 'Заполни все поля'})
            if len(password) < 6:
                return resp(400, {'error': 'Пароль должен быть не менее 6 символов'})
            if len(name) > 50:
                return resp(400, {'error': 'Имя слишком длинное'})
            if len(email) > 255 or '@' not in email:
                return resp(400, {'error': 'Некорректный email'})
            # AI-проверка имени на рекламу: рекламное имя заменяем на «ПОЛЬЗОВАТЕЛЬ»
            try:
                from moderation import moderate_name
                if moderate_name(name).get('is_ad'):
                    name = 'ПОЛЬЗОВАТЕЛЬ'
            except Exception:
                pass
            # Проверка чёрного списка IP
            block_reason = is_ip_blocked(cur, ip)
            if block_reason:
                audit(cur, 'register_blocked_ip', 'critical', ip=ip, email=email, details={'reason': block_reason})
                conn.commit()
                return resp(403, {'error': 'Доступ с этого IP-адреса ограничен'})
            # Rate limit: не более 5 регистраций с одного IP за 10 минут
            if check_rate_limit(cur, ip, 'register', 5, 10):
                audit(cur, 'register_rate_limit', 'warning', ip=ip, email=email)
                conn.commit()
                return resp(429, {'error': 'Слишком много попыток. Повтори через 10 минут.'})
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                log_attempt(cur, ip, 'register', False, email)
                conn.commit()
                return resp(400, {'error': 'Email уже занят'})
            cur.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
                (email, hash_password(password), name)
            )
            user_id = cur.fetchone()[0]
            username = f"user_{user_id}"
            cur.execute("UPDATE users SET username = %s WHERE id = %s", (username, user_id))
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token, ip, user_agent) VALUES (%s, %s, %s, %s)", (user_id, new_token, ip, ua))
            log_attempt(cur, ip, 'register', True, email)
            audit(cur, 'register', 'info', ip=ip, user_id=user_id, email=email)
            try:
                send_welcome_message(cur, user_id)
            except Exception:
                pass
            conn.commit()
            cur.execute(
                "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium, u.premium_tier, u.username, u.height, u.weight, u.relationship_status, u.created_at, u.cover_url, u.show_age "
                "FROM users u WHERE u.id = %s", (user_id,)
            )
            urow = cur.fetchone()
            cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium', 'premium_tier', 'username', 'height', 'weight', 'relationship_status', 'created_at', 'cover_url', 'show_age']
            user = dict(zip(cols, urow))
            user['created_at'] = str(user['created_at']) if user['created_at'] else None
            user['followers'] = 0
            user['following'] = 0
            user['email_verified'] = False
            return resp(200, {'token': new_token, 'user': user})

        if action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            # Проверка чёрного списка IP
            block_reason = is_ip_blocked(cur, ip)
            if block_reason:
                audit(cur, 'login_blocked_ip', 'critical', ip=ip, email=email, details={'reason': block_reason})
                conn.commit()
                return resp(403, {'error': 'Доступ с этого IP-адреса ограничен'})
            # Rate limit: не более 10 попыток с одного IP за 15 минут
            if check_rate_limit(cur, ip, 'login', 10, 15):
                audit(cur, 'login_rate_limit', 'warning', ip=ip, email=email)
                conn.commit()
                return resp(429, {'error': 'Слишком много попыток входа. Повтори через 15 минут.'})
            cur.execute("SELECT id, name, password_hash FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            stored_hash = row[2] if row else None
            new_hash = hash_password(password)
            legacy_hash = hash_password_legacy(password)
            if not row or (stored_hash != new_hash and stored_hash != legacy_hash):
                log_attempt(cur, ip, 'login', False, email)
                audit(cur, 'login_failed', 'warning', ip=ip, email=email)
                conn.commit()
                return resp(401, {'error': 'Неверный email или пароль'})
            user_id = row[0]
            # Проверка бана: забаненный пользователь не может войти
            cur.execute("SELECT reason FROM banned_users WHERE user_id = %s", (user_id,))
            ban = cur.fetchone()
            if ban:
                ban_reason = ban[0] or 'Нарушение правил сообщества'
                audit(cur, 'login_banned', 'warning', ip=ip, user_id=user_id, email=email)
                conn.commit()
                return resp(403, {'error': 'banned', 'banned': True, 'reason': ban_reason})
            # Миграция хеша: если хранился legacy — обновляем на основной
            if stored_hash == legacy_hash and stored_hash != new_hash:
                cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user_id))
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token, ip, user_agent) VALUES (%s, %s, %s, %s)", (user_id, new_token, ip, ua))
            cur.execute("UPDATE users SET online = TRUE, last_seen = NOW() WHERE id = %s", (user_id,))
            log_attempt(cur, ip, 'login', True, email)
            audit(cur, 'login_success', 'info', ip=ip, user_id=user_id, email=email)
            conn.commit()
            cur.execute(
                "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium, u.premium_tier, u.username, u.height, u.weight, u.relationship_status, u.created_at, u.cover_url, u.show_age, u.zodiac "
                "FROM users u WHERE u.id = %s", (user_id,)
            )
            urow = cur.fetchone()
            cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium', 'premium_tier', 'username', 'height', 'weight', 'relationship_status', 'created_at', 'cover_url', 'show_age', 'zodiac']
            user = dict(zip(cols, urow))
            user['created_at'] = str(user['created_at']) if user['created_at'] else None
            cur.execute("SELECT COUNT(*) FROM user_subscriptions WHERE target_id = %s", (user_id,))
            user['followers'] = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM user_subscriptions WHERE subscriber_id = %s", (user_id,))
            user['following'] = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM email_codes WHERE user_id = %s AND used = TRUE", (user_id,))
            user['email_verified'] = cur.fetchone()[0] > 0
            return resp(200, {'token': new_token, 'user': user})

        if action == 'me':
            cur.execute(
                "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium, u.premium_tier, u.username, u.height, u.weight, u.relationship_status, u.created_at, u.cover_url, u.show_age, u.zodiac "
                "FROM users u JOIN sessions s ON s.user_id = u.id "
                "WHERE s.token = %s AND s.expires_at > NOW()",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return resp(401, {'error': 'Не авторизован'})
            # Принудительный выход, если пользователь забанен во время активной сессии
            cur.execute("SELECT reason FROM banned_users WHERE user_id = %s", (row[0],))
            ban = cur.fetchone()
            if ban:
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                cur.execute("UPDATE users SET online = FALSE WHERE id = %s", (row[0],))
                conn.commit()
                return resp(403, {'error': 'banned', 'banned': True, 'reason': ban[0] or 'Нарушение правил сообщества'})
            cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium', 'premium_tier', 'username', 'height', 'weight', 'relationship_status', 'created_at', 'cover_url', 'show_age', 'zodiac']
            user = dict(zip(cols, row))
            user['created_at'] = str(user['created_at']) if user['created_at'] else None
            # Подписчики и подписки из user_subscriptions
            user_id = user['id']
            cur.execute("SELECT COUNT(*) FROM user_subscriptions WHERE target_id = %s", (user_id,))
            user['followers'] = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM user_subscriptions WHERE subscriber_id = %s", (user_id,))
            user['following'] = cur.fetchone()[0]
            # Email verification status
            cur.execute(
                "SELECT COUNT(*) FROM email_codes WHERE user_id = %s AND used = TRUE",
                (user_id,)
            )
            user['email_verified'] = cur.fetchone()[0] > 0
            return resp(200, {'user': user})

        if action == 'logout':
            if token:
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                cur.execute("UPDATE users SET online = FALSE, last_seen = NOW() WHERE id = (SELECT user_id FROM sessions WHERE token = %s)", (token,))
                conn.commit()
            return resp(200, {'ok': True})

        if action == 'delete_account':
            # Полное удаление аккаунта пользователя
            cur.execute("SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return resp(401, {'error': 'Не авторизован'})
            uid = sess[0]

            # Собираем URL всех файлов пользователя ДО удаления из БД (для очистки S3)
            file_urls = []
            cur.execute("SELECT photo_url, cover_url FROM users WHERE id = %s", (uid,))
            urow = cur.fetchone()
            if urow:
                file_urls.extend([urow[0], urow[1]])
            cur.execute("SELECT photo_url FROM profile_photos WHERE user_id = %s", (uid,))
            file_urls.extend([r[0] for r in cur.fetchall()])
            cur.execute("SELECT photo_url FROM private_photos WHERE user_id = %s", (uid,))
            file_urls.extend([r[0] for r in cur.fetchall()])
            cur.execute("SELECT photo_url FROM posts WHERE user_id = %s", (uid,))
            file_urls.extend([r[0] for r in cur.fetchall()])
            cur.execute("SELECT video_url, thumbnail_url FROM stories WHERE user_id = %s", (uid,))
            for r in cur.fetchall():
                file_urls.extend([r[0], r[1]])

            # Удаляем персональные и связанные данные
            cur.execute("DELETE FROM likes WHERE from_user_id = %s OR to_user_id = %s", (uid, uid))
            cur.execute("DELETE FROM user_blocks WHERE blocker_id = %s OR blocked_id = %s", (uid, uid))
            cur.execute("DELETE FROM user_subscriptions WHERE subscriber_id = %s OR target_id = %s", (uid, uid))
            cur.execute("DELETE FROM messages WHERE match_id IN (SELECT id FROM matches WHERE user1_id = %s OR user2_id = %s)", (uid, uid))
            cur.execute("DELETE FROM matches WHERE user1_id = %s OR user2_id = %s", (uid, uid))
            cur.execute("DELETE FROM post_likes WHERE user_id = %s OR post_id IN (SELECT id FROM posts WHERE user_id = %s)", (uid, uid))
            cur.execute("DELETE FROM post_comments WHERE user_id = %s OR post_id IN (SELECT id FROM posts WHERE user_id = %s)", (uid, uid))
            cur.execute("DELETE FROM posts WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM stories WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM profile_photos WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM private_photos WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM profile_boosts WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM notifications WHERE user_id = %s OR from_user_id = %s", (uid, uid))
            cur.execute("DELETE FROM push_subscriptions WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM oauth_accounts WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM user_streaks WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM user_gifts WHERE sender_id = %s OR recipient_id = %s", (uid, uid))
            cur.execute("DELETE FROM live_viewers WHERE user_id = %s OR stream_id IN (SELECT id FROM live_streams WHERE user_id = %s)", (uid, uid))
            cur.execute("DELETE FROM live_messages WHERE user_id = %s OR stream_id IN (SELECT id FROM live_streams WHERE user_id = %s)", (uid, uid))
            cur.execute("DELETE FROM live_streams WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM sessions WHERE user_id = %s", (uid,))

            # Анонимизируем и помечаем аккаунт удалённым (чтобы не показывался нигде)
            cur.execute(
                "UPDATE users SET removed_at = NOW(), online = FALSE, premium = FALSE, incognito = TRUE, "
                "email = %s, password_hash = 'deleted', name = 'Удалённый пользователь', username = %s, "
                "photo_url = NULL, cover_url = NULL, bio = NULL, city = NULL, country = NULL, "
                "age = NULL, tags = NULL, latitude = NULL, longitude = NULL "
                "WHERE id = %s",
                (f'removed_{uid}@removed.local', f'removed_{uid}', uid)
            )
            audit(cur, 'account_removed', 'warning', ip=ip, user_id=uid)
            conn.commit()

            # Удаляем файлы пользователя из S3-хранилища (после успешного commit)
            try:
                import boto3
                s3 = boto3.client(
                    's3', endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                )
                marker = '/bucket/'
                for url in file_urls:
                    if not url or marker not in url:
                        continue
                    key = url.split(marker, 1)[1].split('?', 1)[0]
                    if key:
                        try:
                            s3.delete_object(Bucket='files', Key=key)
                        except Exception:
                            pass
            except Exception:
                pass

            return resp(200, {'ok': True})

        if action == 'reset_password':
            email = body.get('email', '').strip().lower()
            if not email or '@' not in email:
                return resp(400, {'error': 'Введи корректный email'})
            cur.execute("SELECT id, name FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row:
                return resp(200, {'ok': True})
            user_id, name = row
            new_password = secrets.token_urlsafe(10)
            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hash_password(new_password), user_id))
            conn.commit()
            smtp_user = os.environ.get('SMTP_USER', '')
            smtp_password = os.environ.get('SMTP_PASSWORD', '')

            text_body = (
                f"Привет, {name}!\n\n"
                f"Твой новый пароль для Полутон:\n\n{new_password}\n\n"
                f"Войди и сразу смени его в настройках профиля.\n\n"
                f"С уважением,\nКоманда Полутон"
            )

            html_body = build_email_html(
                preheader=f"Твой новый пароль для входа в Полутон",
                heading=f"Привет, {name}!",
                intro="Ты запросил восстановление пароля. Вот твой новый пароль для входа:",
                highlight_label="Новый пароль",
                highlight_value=new_password,
                note="🔒 Войди в приложение и сразу смени его в настройках профиля для безопасности.",
                footer="Если ты не запрашивал восстановление — просто проигнорируй это письмо.",
            )

            msg = MIMEMultipart('alternative')
            msg['Subject'] = Header('Восстановление пароля — Полутон', 'utf-8')
            msg['From'] = formataddr((str(Header('Полутон', 'utf-8')), smtp_user))
            msg['To'] = email
            msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))
            with smtplib.SMTP_SSL('smtp.mail.ru', 465) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [email], msg.as_string())
            return resp(200, {'ok': True})

        if action == 'send_report':
            # Требует авторизации
            cur.execute("SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return resp(401, {'error': 'Не авторизован'})
            reporter_id = sess[0]
            reported_id = body.get('reported_id')
            reason = body.get('reason', 'other').strip()
            comment = body.get('comment', '').strip()[:500]
            if not reported_id:
                return resp(400, {'error': 'reported_id обязателен'})
            if reporter_id == reported_id:
                return resp(400, {'error': 'Нельзя пожаловаться на себя'})
            cur.execute(
                "INSERT INTO reports (reporter_id, reported_id, reason, comment) VALUES (%s, %s, %s, %s)",
                (reporter_id, reported_id, reason, comment)
            )
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'heartbeat':
            # Принудительный выход, если пользователь забанен во время активной сессии
            cur.execute(
                "SELECT b.reason FROM banned_users b "
                "JOIN sessions s ON s.user_id = b.user_id "
                "WHERE s.token = %s", (token,)
            )
            ban = cur.fetchone()
            if ban:
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
                return resp(403, {'error': 'banned', 'banned': True, 'reason': ban[0] or 'Нарушение правил сообщества'})
            cur.execute(
                "UPDATE users SET online = TRUE, last_seen = NOW() "
                "WHERE id = (SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW())",
                (token,)
            )
            cur.execute(
                "UPDATE sessions SET last_active = NOW() WHERE token = %s AND expires_at > NOW()",
                (token,)
            )
            conn.commit()
            return resp(200, {'ok': True})

        # ── Смена пароля ──────────────────────────────────────────────────────
        if action == 'change_password':
            cur.execute("SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return resp(401, {'error': 'Не авторизован'})
            user_id = sess[0]
            old_password = body.get('old_password', '')
            new_password = body.get('new_password', '')
            if not old_password or not new_password:
                return resp(400, {'error': 'Укажи текущий и новый пароль'})
            if len(new_password) < 6:
                return resp(400, {'error': 'Новый пароль должен быть не менее 6 символов'})
            cur.execute("SELECT password_hash, email FROM users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            stored = row[0] if row else None
            if not row or (stored != hash_password(old_password) and stored != hash_password_legacy(old_password)):
                audit(cur, 'change_password_failed', 'warning', ip=ip, user_id=user_id)
                conn.commit()
                return resp(400, {'error': 'Текущий пароль неверен'})
            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hash_password(new_password), user_id))
            # Инвалидируем все остальные сессии (кроме текущей)
            cur.execute(
                "UPDATE sessions SET expires_at = NOW() WHERE user_id = %s AND token != %s",
                (user_id, token)
            )
            audit(cur, 'change_password', 'info', ip=ip, user_id=user_id, email=row[1])
            conn.commit()
            return resp(200, {'ok': True})

        # ── Список активных сессий ────────────────────────────────────────────
        if action == 'list_sessions':
            cur.execute("SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return resp(401, {'error': 'Не авторизован'})
            user_id = sess[0]
            cur.execute(
                """SELECT id, token, ip, user_agent, created_at, last_active, expires_at
                   FROM sessions
                   WHERE user_id = %s AND expires_at > NOW()
                   ORDER BY last_active DESC NULLS LAST
                   LIMIT 20""",
                (user_id,)
            )
            sessions = []
            for r in cur.fetchall():
                sessions.append({
                    'id': r[0],
                    'is_current': r[1] == token,
                    'ip': r[2] or 'unknown',
                    'user_agent': r[3] or '',
                    'created_at': str(r[4]) if r[4] else None,
                    'last_active': str(r[5]) if r[5] else None,
                    'expires_at': str(r[6]) if r[6] else None,
                })
            return resp(200, {'sessions': sessions})

        # ── Завершить конкретную сессию ───────────────────────────────────────
        if action == 'end_session':
            cur.execute("SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return resp(401, {'error': 'Не авторизован'})
            user_id = sess[0]
            session_id = body.get('session_id')
            if not session_id:
                return resp(400, {'error': 'session_id обязателен'})
            # Можно завершить только свою сессию
            cur.execute(
                "UPDATE sessions SET expires_at = NOW() WHERE id = %s AND user_id = %s",
                (session_id, user_id)
            )
            audit(cur, 'session_ended', 'info', ip=ip, user_id=user_id, details={'session_id': session_id})
            conn.commit()
            return resp(200, {'ok': True})

        # ── Завершить все остальные сессии ────────────────────────────────────
        if action == 'end_all_sessions':
            cur.execute("SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return resp(401, {'error': 'Не авторизован'})
            user_id = sess[0]
            cur.execute(
                "UPDATE sessions SET expires_at = NOW() WHERE user_id = %s AND token != %s",
                (user_id, token)
            )
            audit(cur, 'all_sessions_ended', 'warning', ip=ip, user_id=user_id)
            conn.commit()
            return resp(200, {'ok': True})

        # ── OAuth: получить URL для редиректа ─────────────────────────────────
        if action == 'oauth_url':
            provider = (params.get('provider') or body.get('provider') or '').strip()
            redirect_uri = (params.get('redirect_uri') or body.get('redirect_uri') or '').strip()
            state = secrets.token_urlsafe(16)
            if provider == 'vk':
                client_id = os.environ.get('VK_CLIENT_ID', '')
                if not client_id:
                    return resp(400, {'error': 'Вход через ВКонтакте пока не настроен'})
                # VK ID (OAuth 2.1) требует PKCE: генерируем code_verifier / code_challenge
                code_verifier = secrets.token_urlsafe(64)[:128]
                digest = hashlib.sha256(code_verifier.encode('ascii')).digest()
                code_challenge = base64.urlsafe_b64encode(digest).decode('ascii').rstrip('=')
                url = 'https://id.vk.com/authorize?' + urllib.parse.urlencode({
                    'client_id': client_id,
                    'redirect_uri': redirect_uri,
                    'response_type': 'code',
                    'scope': 'email',
                    'state': state,
                    'code_challenge': code_challenge,
                    'code_challenge_method': 's256',
                })
                return resp(200, {'url': url, 'state': state, 'code_verifier': code_verifier})
            if provider == 'mailru':
                client_id = os.environ.get('MAILRU_CLIENT_ID', '')
                if not client_id:
                    return resp(400, {'error': 'Вход через Mail.ru пока не настроен'})
                url = 'https://oauth.mail.ru/login?' + urllib.parse.urlencode({
                    'client_id': client_id,
                    'redirect_uri': redirect_uri,
                    'response_type': 'code',
                    'scope': 'userinfo',
                    'state': state,
                })
                return resp(200, {'url': url, 'state': state})
            return resp(400, {'error': 'Неизвестный провайдер'})

        # ── OAuth: обмен кода на сессию ───────────────────────────────────────
        if action == 'oauth_callback':
            provider = (body.get('provider') or '').strip()
            code = (body.get('code') or '').strip()
            redirect_uri = (body.get('redirect_uri') or '').strip()
            if not code or not provider:
                return resp(400, {'error': 'Некорректный запрос'})

            provider_uid = None
            email = ''
            name = ''
            photo_url = ''

            if provider == 'vk':
                client_id = os.environ.get('VK_CLIENT_ID', '')
                if not client_id:
                    return resp(400, {'error': 'Вход через ВКонтакте пока не настроен'})
                code_verifier = (body.get('code_verifier') or '').strip()
                device_id = (body.get('device_id') or '').strip()
                if not code_verifier or not device_id:
                    return resp(400, {'error': 'Не удалось войти через ВКонтакте'})
                # VK ID (OAuth 2.1): обмен кода на токен через POST на id.vk.com
                token_body = urllib.parse.urlencode({
                    'grant_type': 'authorization_code',
                    'code': code,
                    'code_verifier': code_verifier,
                    'client_id': client_id,
                    'device_id': device_id,
                    'redirect_uri': redirect_uri,
                }).encode('utf-8')
                treq = urllib.request.Request(
                    'https://id.vk.com/oauth2/auth', data=token_body,
                    headers={'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Polyuton/1.0'}
                )
                try:
                    with urllib.request.urlopen(treq, timeout=10) as r:
                        tdata = json.loads(r.read().decode('utf-8'))
                except urllib.error.HTTPError as he:
                    tdata = json.loads(he.read().decode('utf-8'))
                if 'access_token' not in tdata:
                    return resp(400, {'error': 'Не удалось войти через ВКонтакте'})
                provider_uid = tdata.get('user_id')
                # Профиль пользователя через VK ID user_info
                info_body = urllib.parse.urlencode({
                    'client_id': client_id,
                    'access_token': tdata['access_token'],
                }).encode('utf-8')
                ireq = urllib.request.Request(
                    'https://id.vk.com/oauth2/user_info', data=info_body,
                    headers={'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Polyuton/1.0'}
                )
                try:
                    with urllib.request.urlopen(ireq, timeout=10) as r:
                        idata = json.loads(r.read().decode('utf-8'))
                except urllib.error.HTTPError as he:
                    idata = json.loads(he.read().decode('utf-8'))
                u = idata.get('user') or {}
                if not provider_uid:
                    provider_uid = u.get('user_id')
                email = u.get('email', '') or tdata.get('email', '')
                name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
                photo_url = u.get('avatar', '')

            elif provider == 'mailru':
                client_id = os.environ.get('MAILRU_CLIENT_ID', '')
                client_secret = os.environ.get('MAILRU_CLIENT_SECRET', '')
                if not client_id or not client_secret:
                    return resp(400, {'error': 'Вход через Mail.ru пока не настроен'})
                token_body = urllib.parse.urlencode({
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': redirect_uri,
                }).encode('utf-8')
                treq = urllib.request.Request(
                    'https://oauth.mail.ru/token', data=token_body,
                    headers={'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Polyuton/1.0'}
                )
                with urllib.request.urlopen(treq, timeout=10) as r:
                    tdata = json.loads(r.read().decode('utf-8'))
                if 'access_token' not in tdata:
                    return resp(400, {'error': 'Не удалось войти через Mail.ru'})
                info_url = 'https://oauth.mail.ru/userinfo?' + urllib.parse.urlencode({'access_token': tdata['access_token']})
                idata = http_get_json(info_url)
                provider_uid = idata.get('id')
                email = idata.get('email', '')
                name = idata.get('name', '') or idata.get('nickname', '')
                photo_url = idata.get('image', '')
            else:
                return resp(400, {'error': 'Неизвестный провайдер'})

            if not provider_uid:
                return resp(400, {'error': 'Не удалось получить данные аккаунта'})

            user_id = oauth_find_or_create(cur, provider, str(provider_uid), email, name, photo_url)
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token, ip, user_agent) VALUES (%s, %s, %s, %s)", (user_id, new_token, ip, ua))
            cur.execute("UPDATE users SET online = TRUE, last_seen = NOW() WHERE id = %s", (user_id,))
            audit(cur, f'oauth_{provider}_login', 'info', ip=ip, user_id=user_id, email=email)
            conn.commit()
            user = build_user_dict(cur, user_id)
            return resp(200, {'token': new_token, 'user': user})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()