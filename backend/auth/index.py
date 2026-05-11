"""
Авторизация: register / login / logout / me
Роутинг через query-параметр ?action=...
"""
import json
import os
import hashlib
import secrets
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
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            conn.commit()
            return resp(200, {'token': new_token, 'user': {'id': user_id, 'name': name, 'email': email}})

        if action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            cur.execute("SELECT id, name, password_hash FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row or row[2] != hash_password(password):
                return resp(401, {'error': 'Неверный email или пароль'})
            user_id, name = row[0], row[1]
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            cur.execute("UPDATE users SET online = TRUE, last_seen = NOW() WHERE id = %s", (user_id,))
            conn.commit()
            return resp(200, {'token': new_token, 'user': {'id': user_id, 'name': name, 'email': email}})

        if action == 'me':
            cur.execute(
                "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium, u.username "
                "FROM users u JOIN sessions s ON s.user_id = u.id "
                "WHERE s.token = %s AND s.expires_at > NOW()",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return resp(401, {'error': 'Не авторизован'})
            cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium', 'username']
            return resp(200, {'user': dict(zip(cols, row))})

        if action == 'logout':
            if token:
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                cur.execute("UPDATE users SET online = FALSE, last_seen = NOW() WHERE id = (SELECT user_id FROM sessions WHERE token = %s)", (token,))
                conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()