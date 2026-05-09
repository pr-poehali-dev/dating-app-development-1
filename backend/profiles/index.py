"""
Профили: discover / update_me / upload_photo
Роутинг через query-параметр ?action=...
"""
import json
import os
import base64
import uuid
import boto3
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

        if action == 'discover':
            age_max = int(params.get('age_max', 60))
            age_min = int(params.get('age_min', 18))
            looking_for = params.get('looking_for', 'all')
            gender_filter = ""
            if looking_for == 'female':
                gender_filter = "AND u.gender = 'female'"
            elif looking_for == 'male':
                gender_filter = "AND u.gender = 'male'"

            cur.execute(f"""
                SELECT u.id, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online
                FROM users u
                WHERE u.id != {me['id']}
                  AND (u.age IS NULL OR u.age BETWEEN {age_min} AND {age_max})
                  {gender_filter}
                  AND u.id NOT IN (SELECT to_user_id FROM likes WHERE from_user_id = {me['id']})
                ORDER BY u.last_seen DESC
                LIMIT 20
            """)
            rows = cur.fetchall()
            cols = ['id', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online']
            return resp(200, {'profiles': [dict(zip(cols, r)) for r in rows]})

        if action == 'update_me':
            body = json.loads(event.get('body') or '{}')
            allowed = ['name', 'age', 'city', 'bio', 'photo_url', 'tags', 'gender', 'looking_for']
            fields, values = [], []
            for key in allowed:
                if key in body:
                    fields.append(f"{key} = %s")
                    values.append(body[key])
            if fields:
                values.append(me['id'])
                cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", values)
                conn.commit()
            return resp(200, {'ok': True})

        if action == 'upload_photo':
            body = json.loads(event.get('body') or '{}')
            image_data = body.get('image', '')
            content_type = body.get('content_type', 'image/jpeg')
            if not image_data:
                return resp(400, {'error': 'Нет изображения'})
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)
            if len(image_bytes) > 10 * 1024 * 1024:
                return resp(400, {'error': 'Файл слишком большой (макс. 10 МБ)'})
            ext = 'jpg' if 'jpeg' in content_type else content_type.split('/')[-1]
            key = f"avatars/{me['id']}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"
            cur.execute("UPDATE users SET photo_url = %s WHERE id = %s", (cdn_url, me['id']))
            conn.commit()
            return resp(200, {'ok': True, 'photo_url': cdn_url})

        # Загрузить фото-пост
        if action == 'post_create':
            body = json.loads(event.get('body') or '{}')
            image_data = body.get('image', '')
            content_type = body.get('content_type', 'image/jpeg')
            caption = body.get('caption', '').strip()
            if not image_data:
                return resp(400, {'error': 'Нет изображения'})
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)
            if len(image_bytes) > 10 * 1024 * 1024:
                return resp(400, {'error': 'Файл слишком большой (макс. 10 МБ)'})
            ext = 'jpg' if 'jpeg' in content_type else content_type.split('/')[-1]
            key = f"posts/{me['id']}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"
            cur.execute(
                "INSERT INTO posts (user_id, photo_url, caption) VALUES (%s, %s, %s) RETURNING id, created_at",
                (me['id'], cdn_url, caption or None)
            )
            row = cur.fetchone()
            conn.commit()
            return resp(200, {'ok': True, 'post': {'id': row[0], 'photo_url': cdn_url, 'caption': caption, 'created_at': str(row[1])}})

        # Лента постов всех пользователей
        if action == 'posts_feed':
            cur.execute(f"""
                SELECT p.id, p.user_id, p.photo_url, p.caption, p.created_at,
                       u.name, u.photo_url as author_photo,
                       (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
                       (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = {me['id']}) as liked_by_me,
                       (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count
                FROM posts p
                JOIN users u ON u.id = p.user_id
                ORDER BY p.created_at DESC
                LIMIT 30
            """)
            rows = cur.fetchall()
            cols = ['id', 'user_id', 'photo_url', 'caption', 'created_at', 'author_name', 'author_photo', 'likes_count', 'liked_by_me', 'comments_count']
            posts = []
            for r in rows:
                item = dict(zip(cols, r))
                item['liked_by_me'] = int(item['liked_by_me']) > 0
                item['likes_count'] = int(item['likes_count'])
                item['comments_count'] = int(item['comments_count'])
                posts.append(item)
            return resp(200, {'posts': posts})

        # Лайк/анлайк поста
        if action == 'post_like':
            body = json.loads(event.get('body') or '{}')
            post_id = int(body.get('post_id', 0))
            cur.execute("SELECT id FROM post_likes WHERE post_id = %s AND user_id = %s", (post_id, me['id']))
            if cur.fetchone():
                cur.execute("DELETE FROM post_likes WHERE post_id = %s AND user_id = %s", (post_id, me['id']))
                liked = False
            else:
                cur.execute("INSERT INTO post_likes (post_id, user_id) VALUES (%s, %s)", (post_id, me['id']))
                liked = True
            cur.execute("SELECT COUNT(*) FROM post_likes WHERE post_id = %s", (post_id,))
            count = int(cur.fetchone()[0])
            conn.commit()
            return resp(200, {'liked': liked, 'likes_count': count})

        # Добавить комментарий
        if action == 'post_comment':
            body = json.loads(event.get('body') or '{}')
            post_id = int(body.get('post_id', 0))
            text = body.get('text', '').strip()
            if not text:
                return resp(400, {'error': 'Пустой комментарий'})
            cur.execute(
                "INSERT INTO post_comments (post_id, user_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                (post_id, me['id'], text)
            )
            row = cur.fetchone()
            conn.commit()
            cur.execute("SELECT name, photo_url FROM users WHERE id = %s", (me['id'],))
            u = cur.fetchone()
            return resp(200, {'comment': {'id': row[0], 'post_id': post_id, 'user_id': me['id'],
                'author_name': u[0], 'author_photo': u[1], 'text': text, 'created_at': str(row[1])}})

        # Получить комментарии к посту
        if action == 'post_comments':
            post_id = int(params.get('post_id', 0))
            cur.execute("""
                SELECT c.id, c.post_id, c.user_id, c.text, c.created_at, u.name, u.photo_url
                FROM post_comments c JOIN users u ON u.id = c.user_id
                WHERE c.post_id = %s ORDER BY c.created_at ASC
            """, (post_id,))
            cols = ['id', 'post_id', 'user_id', 'text', 'created_at', 'author_name', 'author_photo']
            comments = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {'comments': comments})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()