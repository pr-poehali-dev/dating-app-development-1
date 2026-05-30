"""
Авторизация: register / login / logout / me / reset_password
Роутинг через query-параметр ?action=...
"""
import json
import os
import hashlib
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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

def get_token(event: dict) -> str:
    raw = (event.get('headers') or {}).get('Authorization', '') or \
          (event.get('headers') or {}).get('authorization', '') or \
          (event.get('headers') or {}).get('X-Authorization', '') or \
          (event.get('headers') or {}).get('x-authorization', '')
    return raw.replace('Bearer ', '').strip()

def resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    token = get_token(event)
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    try:
        cur = conn.cursor()

        if action == 'register':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            name = body.get('name', '').strip()
            if not email or not password or not name:
                return resp(400, {'error': 'Заполни все поля'})
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return resp(400, {'error': 'Email уже занят'})
            cur.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
                (email, hash_password(password), name)
            )
            user_id = cur.fetchone()[0]
            username = f"LoveBloom_{user_id}"
            cur.execute("UPDATE users SET username = %s WHERE id = %s", (username, user_id))
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            conn.commit()
            cur.execute(
                "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium, u.username, u.height, u.weight, u.relationship_status, u.created_at, u.cover_url, u.show_age "
                "FROM users u WHERE u.id = %s", (user_id,)
            )
            urow = cur.fetchone()
            cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium', 'username', 'height', 'weight', 'relationship_status', 'created_at', 'cover_url', 'show_age']
            user = dict(zip(cols, urow))
            user['created_at'] = str(user['created_at']) if user['created_at'] else None
            user['followers'] = 0
            user['following'] = 0
            user['email_verified'] = False
            return resp(200, {'token': new_token, 'user': user})

        if action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            cur.execute("SELECT id, name, password_hash FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row or row[2] != hash_password(password):
                return resp(401, {'error': 'Неверный email или пароль'})
            user_id = row[0]
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            cur.execute("UPDATE users SET online = TRUE, last_seen = NOW() WHERE id = %s", (user_id,))
            conn.commit()
            cur.execute(
                "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium, u.username, u.height, u.weight, u.relationship_status, u.created_at, u.cover_url, u.show_age "
                "FROM users u WHERE u.id = %s", (user_id,)
            )
            urow = cur.fetchone()
            cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium', 'username', 'height', 'weight', 'relationship_status', 'created_at', 'cover_url', 'show_age']
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
                "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium, u.username, u.height, u.weight, u.relationship_status, u.created_at, u.cover_url, u.show_age "
                "FROM users u JOIN sessions s ON s.user_id = u.id "
                "WHERE s.token = %s AND s.expires_at > NOW()",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return resp(401, {'error': 'Не авторизован'})
            cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium', 'username', 'height', 'weight', 'relationship_status', 'created_at', 'cover_url', 'show_age']
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
                f"Твой новый пароль для LoveBloom:\n\n{new_password}\n\n"
                f"Войди и сразу смени его в настройках профиля.\n\n"
                f"С уважением,\nКоманда LoveBloom"
            )

            html_body = f"""\
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0e0a18;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e0a18;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#181225;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#FF2D78,#9B59B6);padding:36px 32px;text-align:center;">
              <div style="font-size:40px;line-height:1;">💖</div>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.5px;">LoveBloom</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 8px;">
              <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:700;">Привет, {name}!</h2>
              <p style="margin:0;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;">
                Ты запросил восстановление пароля. Вот твой новый пароль для входа:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <div style="background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.3);border-radius:16px;padding:20px;text-align:center;">
                <div style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Новый пароль</div>
                <div style="color:#ffffff;font-size:26px;font-weight:800;font-family:'Courier New',monospace;letter-spacing:2px;word-break:break-all;">{new_password}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;">
                🔒 Войди в приложение и сразу смени его в настройках профиля для безопасности.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;line-height:1.5;">
                Если ты не запрашивал восстановление — просто проигнорируй это письмо.<br>
                С любовью, команда LoveBloom 💕
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Восстановление пароля — LoveBloom'
            msg['From'] = smtp_user
            msg['To'] = email
            msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))
            with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
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
            # Обновляем last_seen и online пока пользователь активен
            cur.execute(
                "UPDATE users SET online = TRUE, last_seen = NOW() "
                "WHERE id = (SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW())",
                (token,)
            )
            conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()