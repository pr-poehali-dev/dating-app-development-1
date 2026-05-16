"""
Сообщения: list / send / delete
Роутинг через query-параметр ?action=...
"""
import json
import os
import psycopg2

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
            match_id = int(params.get('match_id', 0))
            cur.execute(
                f"SELECT id FROM matches WHERE id = {match_id} AND (user1_id = {me['id']} OR user2_id = {me['id']})"
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
                f"UPDATE messages SET read_at = NOW() WHERE match_id = {match_id} AND sender_id != {me['id']} AND read_at IS NULL"
            )
            conn.commit()
            return resp(200, {'messages': msgs})

        if action == 'send':
            body = json.loads(event.get('body') or '{}')
            match_id = int(body.get('match_id', 0))
            text = body.get('text', '').strip()
            if not text:
                return resp(400, {'error': 'Пустое сообщение'})
            cur.execute(
                f"SELECT id FROM matches WHERE id = {match_id} AND (user1_id = {me['id']} OR user2_id = {me['id']})"
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа'})
            cur.execute(
                "INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                (match_id, me['id'], text)
            )
            row = cur.fetchone()
            conn.commit()
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