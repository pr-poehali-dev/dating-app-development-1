"""
Уведомления: list (список), mark_read (пометить прочитанным), unread_count
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
            # Лайки
            cur.execute(
                "SELECT u.id, u.name, u.photo_url, l.created_at, l.is_super "
                "FROM likes l JOIN users u ON u.id = l.from_user_id "
                "WHERE l.to_user_id = %s ORDER BY l.created_at DESC LIMIT 30",
                (me['id'],)
            )
            likes = [{'type': 'super_like' if r[4] else 'like', 'from_user_id': r[0], 'name': r[1], 'photo_url': r[2], 'created_at': str(r[3])} for r in cur.fetchall()]

            # Новые сообщения (непрочитанные)
            cur.execute(
                "SELECT u.id, u.name, u.photo_url, m.text, m.created_at, mt.match_id "
                "FROM messages m "
                "JOIN matches mt ON mt.id = m.match_id "
                "JOIN users u ON u.id = m.sender_id "
                "WHERE (mt.user1_id = %s OR mt.user2_id = %s) "
                "AND m.sender_id != %s AND m.read_at IS NULL "
                "ORDER BY m.created_at DESC LIMIT 20",
                (me['id'], me['id'], me['id'])
            )
            msgs = [{'type': 'message', 'from_user_id': r[0], 'name': r[1], 'photo_url': r[2], 'text': r[3], 'created_at': str(r[4]), 'match_id': r[5]} for r in cur.fetchall()]

            # Просмотры профиля (из таблицы notifications если есть)
            cur.execute(
                "SELECT n.from_user_id, u.name, u.photo_url, n.created_at "
                "FROM notifications n JOIN users u ON u.id = n.from_user_id "
                "WHERE n.user_id = %s AND n.type = 'view' ORDER BY n.created_at DESC LIMIT 20",
                (me['id'],)
            )
            views = [{'type': 'view', 'from_user_id': r[0], 'name': r[1], 'photo_url': r[2], 'created_at': str(r[3])} for r in cur.fetchall()]

            # Новые фото от подписок
            cur.execute(
                "SELECT n.from_user_id, u.name, u.photo_url, n.created_at, n.ref_id "
                "FROM notifications n JOIN users u ON u.id = n.from_user_id "
                "WHERE n.user_id = %s AND n.type = 'new_photo' ORDER BY n.created_at DESC LIMIT 20",
                (me['id'],)
            )
            new_photos = [{'type': 'new_photo', 'from_user_id': r[0], 'name': r[1], 'photo_url': r[2], 'created_at': str(r[3]), 'ref_id': r[4]} for r in cur.fetchall()]

            # Новые подписчики
            cur.execute(
                "SELECT n.from_user_id, u.name, u.photo_url, n.created_at "
                "FROM notifications n JOIN users u ON u.id = n.from_user_id "
                "WHERE n.user_id = %s AND n.type = 'subscription' ORDER BY n.created_at DESC LIMIT 20",
                (me['id'],)
            )
            subscriptions = [{'type': 'subscription', 'from_user_id': r[0], 'name': r[1], 'photo_url': r[2], 'created_at': str(r[3])} for r in cur.fetchall()]

            all_notifs = sorted(likes + msgs + views + new_photos + subscriptions, key=lambda x: x['created_at'], reverse=True)

            # Считаем непрочитанные лайки и просмотры
            cur.execute(
                "SELECT COUNT(*) FROM notifications WHERE user_id = %s AND read = FALSE",
                (me['id'],)
            )
            unread_notifs = cur.fetchone()[0]
            unread_total = len(msgs) + unread_notifs

            return resp(200, {'notifications': all_notifs, 'unread_count': unread_total})

        if action == 'unread_count':
            cur.execute(
                "SELECT COUNT(*) FROM messages m "
                "JOIN matches mt ON mt.id = m.match_id "
                "WHERE (mt.user1_id = %s OR mt.user2_id = %s) "
                "AND m.sender_id != %s AND m.read_at IS NULL",
                (me['id'], me['id'], me['id'])
            )
            msg_count = cur.fetchone()[0]

            cur.execute(
                "SELECT COUNT(*) FROM likes WHERE to_user_id = %s AND created_at > NOW() - INTERVAL '7 days'",
                (me['id'],)
            )
            like_count = cur.fetchone()[0]

            return resp(200, {'unread_count': msg_count + like_count, 'messages': msg_count, 'likes': like_count})

        if action == 'track_view':
            body = json.loads(event.get('body') or '{}')
            target_id = body.get('user_id')
            if target_id and target_id != me['id']:
                cur.execute(
                    "INSERT INTO notifications (user_id, type, from_user_id) VALUES (%s, 'view', %s)",
                    (target_id, me['id'])
                )
                conn.commit()
            return resp(200, {'ok': True})

        if action == 'mark_read':
            cur.execute("UPDATE notifications SET read = TRUE WHERE user_id = %s", (me['id'],))
            conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()