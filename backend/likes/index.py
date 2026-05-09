"""
Лайки: send / liked_me
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
        "SELECT id, premium FROM users WHERE id = (SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW() LIMIT 1)",
        (token,)
    )
    row = cur.fetchone()
    return {'id': row[0], 'premium': row[1]} if row else None

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

        if action == 'send':
            body = json.loads(event.get('body') or '{}')
            to_id = body.get('to_user_id')
            is_super = bool(body.get('is_super', False))
            if not to_id:
                return resp(400, {'error': 'Укажи to_user_id'})

            cur.execute(
                "INSERT INTO likes (from_user_id, to_user_id, is_super) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (me['id'], to_id, is_super)
            )
            cur.execute("SELECT id FROM likes WHERE from_user_id = %s AND to_user_id = %s", (to_id, me['id']))
            mutual = cur.fetchone()
            match_id = None

            if mutual:
                u1, u2 = sorted([me['id'], to_id])
                cur.execute(
                    "INSERT INTO matches (user1_id, user2_id) VALUES (%s, %s) ON CONFLICT DO NOTHING RETURNING id",
                    (u1, u2)
                )
                row = cur.fetchone()
                if not row:
                    cur.execute("SELECT id FROM matches WHERE user1_id = %s AND user2_id = %s", (u1, u2))
                    row = cur.fetchone()
                match_id = row[0] if row else None

            conn.commit()
            return resp(200, {'ok': True, 'match': bool(mutual), 'match_id': match_id})

        if action == 'liked_me':
            cur.execute(
                "SELECT u.id, u.name, u.age, u.photo_url, u.verified, l.is_super, l.created_at "
                "FROM likes l JOIN users u ON u.id = l.from_user_id "
                "WHERE l.to_user_id = %s ORDER BY l.created_at DESC",
                (me['id'],)
            )
            rows = cur.fetchall()
            cols = ['id', 'name', 'age', 'photo_url', 'verified', 'is_super', 'created_at']
            liked_me = []
            for i, r in enumerate(rows):
                item = dict(zip(cols, r))
                item['created_at'] = str(item['created_at'])
                item['blurred'] = not me['premium'] and i > 0
                liked_me.append(item)
            return resp(200, {'liked_me': liked_me, 'total': len(liked_me)})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()
