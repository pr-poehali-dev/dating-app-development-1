"""
Авторизация и регистрация пользователей (register / login / logout / me)
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

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.email, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.gender, u.looking_for, u.premium "
        "FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    cols = ['id', 'email', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'gender', 'looking_for', 'premium']
    return dict(zip(cols, row))


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    _raw = event.get('headers', {}).get('X-Authorization', '') or event.get('headers', {}).get('x-authorization', '')
    token = _raw.replace('Bearer ', '').strip()

    conn = get_conn()

    try:
        # POST /register
        if method == 'POST' and path.endswith('/register'):
            body = json.loads(event.get('body') or '{}')
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            name = body.get('name', '').strip()

            if not email or not password or not name:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполни все поля'})}

            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Email уже занят'})}

            pw_hash = hash_password(password)
            cur.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
                (email, pw_hash, name)
            )
            user_id = cur.fetchone()[0]

            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {**CORS, 'X-Set-Cookie': f'auth_token={new_token}; Path=/; SameSite=None; Secure'},
                'body': json.dumps({'token': new_token, 'user': {'id': user_id, 'name': name, 'email': email}})
            }

        # POST /login
        if method == 'POST' and path.endswith('/login'):
            body = json.loads(event.get('body') or '{}')
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')

            cur = conn.cursor()
            cur.execute("SELECT id, name, password_hash FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row or row[2] != hash_password(password):
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

            user_id, name = row[0], row[1]
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            cur.execute("UPDATE users SET online = TRUE, last_seen = NOW() WHERE id = %s", (user_id,))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {**CORS, 'X-Set-Cookie': f'auth_token={new_token}; Path=/; SameSite=None; Secure'},
                'body': json.dumps({'token': new_token, 'user': {'id': user_id, 'name': name, 'email': email}})
            }

        # GET /me
        if method == 'GET' and path.endswith('/me'):
            user = get_user_by_token(conn, token)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        # POST /logout
        if method == 'POST' and path.endswith('/logout'):
            if token:
                cur = conn.cursor()
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                cur.execute("UPDATE users SET online = FALSE, last_seen = NOW() WHERE id = (SELECT user_id FROM sessions WHERE token = %s)", (token,))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()