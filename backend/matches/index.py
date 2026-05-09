"""
Матчи: list
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
            uid = me['id']
            cur.execute(f"""
                SELECT
                    m.id as match_id,
                    CASE WHEN m.user1_id = {uid} THEN m.user2_id ELSE m.user1_id END as partner_id,
                    u.name, u.age, u.photo_url, u.online,
                    (SELECT text FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_msg,
                    (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_msg_time,
                    (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND sender_id != {uid} AND read_at IS NULL) as unread_count,
                    m.created_at
                FROM matches m
                JOIN users u ON u.id = CASE WHEN m.user1_id = {uid} THEN m.user2_id ELSE m.user1_id END
                WHERE m.user1_id = {uid} OR m.user2_id = {uid}
                ORDER BY COALESCE(
                    (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1),
                    m.created_at
                ) DESC
            """)
            rows = cur.fetchall()
            cols = ['match_id', 'partner_id', 'name', 'age', 'photo_url', 'online', 'last_msg', 'last_msg_time', 'unread_count', 'created_at']
            matches = []
            for r in rows:
                item = dict(zip(cols, r))
                item['unread_count'] = int(item['unread_count'])
                matches.append(item)
            return resp(200, {'matches': matches})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()
