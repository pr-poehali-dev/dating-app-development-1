"""
Матчи и Live-трансляции: list / live_start / live_end / live_list / live_join / live_leave / live_heart / live_chat / live_poll
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
            cur.execute("""
                SELECT
                    m.id as match_id,
                    CASE WHEN m.user1_id = %s THEN m.user2_id ELSE m.user1_id END as partner_id,
                    u.name, u.age, u.photo_url, u.online, u.last_seen,
                    (SELECT text FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_msg,
                    (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_msg_time,
                    (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND sender_id != %s AND read_at IS NULL) as unread_count,
                    m.created_at
                FROM matches m
                JOIN users u ON u.id = CASE WHEN m.user1_id = %s THEN m.user2_id ELSE m.user1_id END
                WHERE (m.user1_id = %s OR m.user2_id = %s)
                AND CASE WHEN m.user1_id = %s THEN m.user2_id ELSE m.user1_id END NOT IN (
                    SELECT blocked_id FROM user_blocks WHERE blocker_id = %s
                )
                ORDER BY COALESCE(
                    (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1),
                    m.created_at
                ) DESC
            """, (uid, uid, uid, uid, uid, uid, uid))
            rows = cur.fetchall()
            cols = ['match_id', 'partner_id', 'name', 'age', 'photo_url', 'online', 'last_seen', 'last_msg', 'last_msg_time', 'unread_count', 'created_at']
            matches = []
            for r in rows:
                item = dict(zip(cols, r))
                item['unread_count'] = int(item['unread_count'])
                if item.get('last_seen'):
                    item['last_seen'] = str(item['last_seen'])
                matches.append(item)
            return resp(200, {'matches': matches})

        # ── LIVE ──────────────────────────────────────────────────────────────

        # Начать трансляцию
        if action == 'live_start':
            body = json.loads(event.get('body') or '{}')
            title = body.get('title', 'Моя трансляция').strip()[:200]
            # Завершаем предыдущие стримы этого пользователя
            cur.execute("UPDATE live_streams SET status='ended', ended_at=NOW() WHERE user_id=%s AND status='active'", (me['id'],))
            cur.execute(
                "INSERT INTO live_streams (user_id, title) VALUES (%s, %s) RETURNING id, started_at",
                (me['id'], title)
            )
            row = cur.fetchone()
            conn.commit()
            return resp(200, {'stream': {'id': row[0], 'title': title, 'started_at': str(row[1]), 'viewers_count': 0, 'hearts_count': 0}})

        # Завершить трансляцию
        if action == 'live_end':
            cur.execute("UPDATE live_streams SET status='ended', ended_at=NOW() WHERE user_id=%s AND status='active'", (me['id'],))
            conn.commit()
            return resp(200, {'ok': True})

        # Список активных трансляций
        if action == 'live_list':
            # Завершаем зависшие трансляции (автор офлайн или last_seen > 10 мин назад)
            cur.execute("""
                UPDATE live_streams SET status='ended', ended_at=NOW()
                WHERE status='active' AND user_id IN (
                    SELECT id FROM users
                    WHERE online = FALSE
                       OR last_seen < NOW() - INTERVAL '10 minutes'
                )
            """)
            conn.commit()
            cur.execute("""
                SELECT s.id, s.user_id, s.title, s.viewers_count, s.hearts_count, s.started_at,
                       u.name, u.photo_url
                FROM live_streams s JOIN users u ON u.id = s.user_id
                WHERE s.status = 'active'
                ORDER BY s.viewers_count DESC, s.started_at DESC
                LIMIT 20
            """)
            cols = ['id', 'user_id', 'title', 'viewers_count', 'hearts_count', 'started_at', 'author_name', 'author_photo']
            streams = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {'streams': streams})

        # Зайти в трансляцию (инкремент зрителей)
        if action == 'live_join':
            body = json.loads(event.get('body') or '{}')
            try:
                stream_id = int(body.get('stream_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный stream_id'})
            if not stream_id:
                return resp(400, {'error': 'stream_id обязателен'})
            cur.execute("UPDATE live_streams SET viewers_count = viewers_count + 1 WHERE id=%s AND status='active'", (stream_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # Выйти из трансляции
        if action == 'live_leave':
            body = json.loads(event.get('body') or '{}')
            try:
                stream_id = int(body.get('stream_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный stream_id'})
            if not stream_id:
                return resp(400, {'error': 'stream_id обязателен'})
            cur.execute("UPDATE live_streams SET viewers_count = GREATEST(viewers_count - 1, 0) WHERE id=%s AND status='active'", (stream_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # Отправить сердечко
        if action == 'live_heart':
            body = json.loads(event.get('body') or '{}')
            try:
                stream_id = int(body.get('stream_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный stream_id'})
            if not stream_id:
                return resp(400, {'error': 'stream_id обязателен'})
            cur.execute("UPDATE live_streams SET hearts_count = hearts_count + 1 WHERE id=%s AND status='active'", (stream_id,))
            cur.execute("SELECT hearts_count FROM live_streams WHERE id=%s", (stream_id,))
            row = cur.fetchone()
            conn.commit()
            return resp(200, {'hearts_count': int(row[0]) if row else 0})

        # Написать в чат трансляции
        if action == 'live_chat':
            body = json.loads(event.get('body') or '{}')
            try:
                stream_id = int(body.get('stream_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный stream_id'})
            if not stream_id:
                return resp(400, {'error': 'stream_id обязателен'})
            text = body.get('text', '').strip()[:200]
            if not text:
                return resp(400, {'error': 'Пустое сообщение'})
            cur.execute("SELECT id FROM live_streams WHERE id=%s AND status='active'", (stream_id,))
            if not cur.fetchone():
                return resp(404, {'error': 'Трансляция не найдена'})
            cur.execute(
                "INSERT INTO live_messages (stream_id, user_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                (stream_id, me['id'], text)
            )
            row = cur.fetchone()
            cur.execute("SELECT name, photo_url FROM users WHERE id=%s", (me['id'],))
            u = cur.fetchone()
            conn.commit()
            return resp(200, {'message': {
                'id': row[0], 'stream_id': stream_id, 'user_id': me['id'],
                'author_name': u[0], 'author_photo': u[1],
                'text': text, 'created_at': str(row[1])
            }})

        # Получить состояние трансляции + новые сообщения (polling)
        if action == 'live_poll':
            try:
                stream_id = int(params.get('stream_id', 0))
                since_id = int(params.get('since_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректные параметры'})
            cur.execute("SELECT id, status, viewers_count, hearts_count, title FROM live_streams WHERE id=%s", (stream_id,))
            srow = cur.fetchone()
            if not srow:
                return resp(404, {'error': 'Трансляция не найдена'})
            cur.execute("""
                SELECT m.id, m.user_id, m.text, m.created_at, u.name, u.photo_url
                FROM live_messages m JOIN users u ON u.id = m.user_id
                WHERE m.stream_id=%s AND m.id > %s
                ORDER BY m.created_at ASC LIMIT 50
            """, (stream_id, since_id))
            cols = ['id', 'user_id', 'text', 'created_at', 'author_name', 'author_photo']
            messages = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {
                'stream': {'id': srow[0], 'status': srow[1], 'viewers_count': int(srow[2]), 'hearts_count': int(srow[3]), 'title': srow[4]},
                'messages': messages
            })

        if action == 'delete':
            body = json.loads(event.get('body') or '{}')
            try:
                match_id = int(body.get('match_id', 0))
            except (ValueError, TypeError):
                return resp(400, {'error': 'Некорректный match_id'})
            if not match_id:
                return resp(400, {'error': 'match_id обязателен'})
            # Проверяем что пользователь участник матча
            cur.execute(
                "SELECT id FROM matches WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
                (match_id, me['id'], me['id'])
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа'})
            # Удаляем сообщения и матч
            cur.execute("DELETE FROM messages WHERE match_id = %s", (match_id,))
            cur.execute("DELETE FROM matches WHERE id = %s", (match_id,))
            conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()