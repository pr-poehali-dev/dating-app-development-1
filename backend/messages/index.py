"""
Сообщения в чате: получить историю, отправить сообщение
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

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM users WHERE id = (SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW() LIMIT 1)",
        (token,)
    )
    row = cur.fetchone()
    return {'id': row[0]} if row else None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    _raw = event.get('headers', {}).get('X-Authorization', '') or event.get('headers', {}).get('x-authorization', '')
    token = _raw.replace('Bearer ', '').strip()

    conn = get_conn()
    try:
        me = get_user_by_token(conn, token)
        if not me:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

        cur = conn.cursor()
        parts = path.rstrip('/').split('/')

        # GET /messages/:match_id
        if method == 'GET' and len(parts) >= 2 and parts[-1].isdigit():
            match_id = int(parts[-1])

            # Проверяем доступ
            cur.execute(
                f"SELECT id FROM matches WHERE id = {match_id} AND (user1_id = {me['id']} OR user2_id = {me['id']})"
            )
            if not cur.fetchone():
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

            cur.execute(
                "SELECT id, sender_id, text, created_at, read_at FROM messages WHERE match_id = %s ORDER BY created_at ASC",
                (match_id,)
            )
            rows = cur.fetchall()
            msgs = []
            for r in rows:
                msgs.append({
                    'id': r[0],
                    'sender_id': r[1],
                    'text': r[2],
                    'created_at': str(r[3]),
                    'out': r[1] == me['id'],
                    'read': r[4] is not None
                })

            # Помечаем прочитанными
            cur.execute(
                f"UPDATE messages SET read_at = NOW() WHERE match_id = {match_id} AND sender_id != {me['id']} AND read_at IS NULL"
            )
            conn.commit()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'messages': msgs})}

        # POST /messages/:match_id
        if method == 'POST' and len(parts) >= 2 and parts[-1].isdigit():
            match_id = int(parts[-1])
            body = json.loads(event.get('body') or '{}')
            text = body.get('text', '').strip()

            if not text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пустое сообщение'})}

            cur.execute(
                f"SELECT id FROM matches WHERE id = {match_id} AND (user1_id = {me['id']} OR user2_id = {me['id']})"
            )
            if not cur.fetchone():
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

            cur.execute(
                "INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                (match_id, me['id'], text)
            )
            row = cur.fetchone()
            conn.commit()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'id': row[0], 'sender_id': me['id'], 'text': text,
                'created_at': str(row[1]), 'out': True
            })}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()