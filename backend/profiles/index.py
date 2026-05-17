"""
Профили: discover / update_me / upload_photo / verify_*
Роутинг через query-параметр ?action=...
"""
import json
import os
import base64
import uuid
import random
import smtplib
import ssl
import boto3
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-Authorization, X-Admin-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")

def get_me(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT id, premium, name FROM users WHERE id = (SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW() LIMIT 1)",
        (token,)
    )
    row = cur.fetchone()
    return {'id': row[0], 'premium': row[1], 'name': row[2]} if row else None

def send_verify_email(to_email: str, code: str, name: str):
    host = os.environ.get('SMTP_HOST', '')
    port = int(os.environ.get('SMTP_PORT', 465))
    user = os.environ.get('SMTP_USER', '')
    password = os.environ.get('SMTP_PASS', '')
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Код подтверждения LoveBloom'
    msg['From'] = f'LoveBloom <{user}>'
    msg['To'] = to_email
    html = f"""<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#1a1625;border-radius:16px;padding:32px;">
      <h1 style="color:#FF2D78;font-size:28px;margin:0 0 8px">LoveBloom 🌸</h1>
      <p style="color:#ccc;margin:0 0 24px">Привет, {name}!</p>
      <p style="color:#ccc;margin:0 0 16px">Твой код подтверждения:</p>
      <div style="background:#2d2540;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
        <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#FF2D78">{code}</span>
      </div>
      <p style="color:#888;font-size:13px">Код действителен 10 минут.</p>
    </div>"""
    msg.attach(MIMEText(html, 'html'))
    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL(host, port, context=ctx) as server:
        server.login(user, password)
        server.sendmail(user, to_email, msg.as_string())

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
    headers = event.get('headers') or {}
    admin_token_hdr = headers.get('X-Admin-Token', '') or headers.get('x-admin-token', '')

    conn = get_conn()
    try:
        cur = conn.cursor()

        # ── ADMIN: верификация ─────────────────────────────────────────────────
        if action.startswith('admin_verify'):
            real_admin = os.environ.get('ADMIN_TOKEN', '')
            if not real_admin or admin_token_hdr != real_admin:
                return resp(403, {'error': 'Нет доступа'})

            if action == 'admin_verify_list':
                cur.execute("""
                    SELECT vr.id, vr.user_id, vr.selfie_url, vr.status, vr.email_verified,
                           vr.created_at, u.name, u.age, u.photo_url, vr.reject_reason
                    FROM verification_requests vr
                    JOIN users u ON u.id = vr.user_id
                    WHERE vr.status = 'pending'
                    ORDER BY vr.created_at ASC
                """)
                cols = ['id','user_id','selfie_url','status','email_verified','created_at','name','age','photo_url','reject_reason']
                return resp(200, {'requests': [dict(zip(cols, r)) for r in cur.fetchall()]})

            if action == 'admin_verify_approve':
                body = json.loads(event.get('body') or '{}')
                req_id = int(body.get('request_id', 0))
                cur.execute("SELECT user_id FROM verification_requests WHERE id=%s", (req_id,))
                row = cur.fetchone()
                if not row:
                    return resp(404, {'error': 'Заявка не найдена'})
                cur.execute("UPDATE verification_requests SET status='approved', reviewed_at=NOW() WHERE id=%s", (req_id,))
                cur.execute("UPDATE users SET verified=TRUE WHERE id=%s", (row[0],))
                conn.commit()
                return resp(200, {'ok': True})

            if action == 'admin_verify_reject':
                body = json.loads(event.get('body') or '{}')
                req_id = int(body.get('request_id', 0))
                reason = body.get('reason', '').strip()[:200]
                cur.execute("UPDATE verification_requests SET status='rejected', reviewed_at=NOW(), reject_reason=%s WHERE id=%s", (reason or None, req_id))
                conn.commit()
                return resp(200, {'ok': True})

            return resp(400, {'error': 'Неизвестное admin действие'})

        # ── USER endpoints ─────────────────────────────────────────────────────
        me = get_me(conn, token)
        if not me:
            return resp(401, {'error': 'Не авторизован'})

        cur = conn.cursor()

        if action == 'discover':
            age_max = int(params.get('age_max', 99))
            age_min = int(params.get('age_min', 18))
            looking_for = params.get('looking_for', 'all')
            search = params.get('search', '').strip()
            city_filter_val = params.get('city', '').strip()
            country_filter_val = params.get('country', '').strip()
            lat = params.get('lat', '')
            lon = params.get('lon', '')
            radius_km = int(params.get('radius_km', 0))
            online_only = params.get('online_only', '') == '1'

            conditions = [f"u.id != {me['id']}",
                          f"(u.age IS NULL OR u.age BETWEEN {age_min} AND {age_max})",
                          f"u.id NOT IN (SELECT to_user_id FROM likes WHERE from_user_id = {me['id']})"]

            if looking_for == 'female':
                conditions.append("u.gender = 'female'")
            elif looking_for == 'male':
                conditions.append("u.gender = 'male'")

            if search:
                safe = search.replace("'", "''")
                if search.startswith('@'):
                    uname = safe.lstrip('@')
                    conditions.append(f"u.username ILIKE '%{uname}%'")
                else:
                    conditions.append(f"(u.name ILIKE '%{safe}%' OR u.username ILIKE '%{safe}%')")

            if city_filter_val:
                safe_city = city_filter_val.replace("'", "''")
                conditions.append(f"u.city ILIKE '%{safe_city}%'")

            if country_filter_val:
                safe_country = country_filter_val.replace("'", "''")
                conditions.append(f"u.country ILIKE '%{safe_country}%'")

            if online_only:
                conditions.append("u.online = TRUE")

            geo_select = ""
            geo_order = "u.last_seen DESC"
            if lat and lon and radius_km > 0:
                try:
                    lat_f, lon_f = float(lat), float(lon)
                    geo_select = f", (6371 * acos(cos(radians({lat_f})) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians({lon_f})) + sin(radians({lat_f})) * sin(radians(u.latitude)))) AS distance_km"
                    conditions.append(f"u.latitude IS NOT NULL AND u.longitude IS NOT NULL")
                    conditions.append(f"(6371 * acos(cos(radians({lat_f})) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians({lon_f})) + sin(radians({lat_f})) * sin(radians(u.latitude)))) <= {radius_km}")
                    geo_order = "distance_km ASC"
                except Exception:
                    pass

            where_clause = " AND ".join(conditions)
            cur.execute(f"""
                SELECT u.id, u.name, u.age, u.city, u.country, u.bio, u.photo_url, u.tags, u.verified, u.online, u.username{geo_select}
                FROM users u
                WHERE {where_clause}
                ORDER BY {geo_order}
                LIMIT 60
            """)
            rows = cur.fetchall()
            cols = ['id', 'name', 'age', 'city', 'country', 'bio', 'photo_url', 'tags', 'verified', 'online', 'username']
            if geo_select:
                cols.append('distance_km')
            profiles_list = []
            for r in rows:
                item = dict(zip(cols, r))
                if 'distance_km' in item and item['distance_km'] is not None:
                    item['distance_km'] = round(float(item['distance_km']), 1)
                profiles_list.append(item)
            return resp(200, {'profiles': profiles_list})

        # Сохранить геолокацию
        if action == 'update_geo':
            body = json.loads(event.get('body') or '{}')
            lat_v = float(body.get('lat', 0))
            lon_v = float(body.get('lon', 0))
            country_v = body.get('country', '').strip()[:100]
            city_v = body.get('city', '').strip()[:100]
            cur.execute("UPDATE users SET latitude=%s, longitude=%s, country=%s, city=COALESCE(NULLIF(%s,''), city) WHERE id=%s",
                        (lat_v, lon_v, country_v or None, city_v or None, me['id']))
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'update_me':
            body = json.loads(event.get('body') or '{}')
            scalar = ['name', 'age', 'city', 'country', 'bio', 'photo_url', 'gender', 'looking_for', 'height', 'weight', 'relationship_status']
            fields, values = [], []
            for key in scalar:
                if key in body:
                    fields.append(f"{key} = %s")
                    values.append(body[key])
            # tags — передаём как PostgreSQL text[]
            if 'tags' in body:
                tags_val = body['tags']
                if isinstance(tags_val, list):
                    # Строим литерал вида ARRAY['a','b']
                    safe_tags = [str(t).replace("'", "''") for t in tags_val]
                    arr_literal = "ARRAY[" + ",".join(f"'{t}'" for t in safe_tags) + "]" if safe_tags else "ARRAY[]::text[]"
                    fields.append(f"tags = {arr_literal}")
                else:
                    fields.append("tags = %s")
                    values.append(tags_val)
            # username — отдельно с проверкой уникальности
            if 'username' in body:
                uname = body['username'].strip().lower()[:50]
                if uname:
                    import re
                    if not re.match(r'^[a-z0-9_.]{3,50}$', uname):
                        return resp(400, {'error': 'Имя пользователя: только буквы, цифры, _ и . (3-50 символов)'})
                    cur.execute("SELECT id FROM users WHERE username=%s AND id != %s", (uname, me['id']))
                    if cur.fetchone():
                        return resp(400, {'error': 'Это имя пользователя уже занято'})
                    fields.append("username = %s")
                    values.append(uname)
            if fields:
                values.append(me['id'])
                try:
                    cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", values)
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    print(f"[update_me error] {e}")
                    return resp(500, {'error': f'Ошибка сохранения: {str(e)}'})
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
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute("UPDATE users SET photo_url = %s WHERE id = %s", (cdn_url, me['id']))
            conn.commit()
            return resp(200, {'ok': True, 'photo_url': cdn_url})

        # Фото галереи другого пользователя
        if action == 'user_profile_photos':
            uid = int(params.get('user_id', 0))
            cur.execute("SELECT id, photo_url FROM profile_photos WHERE user_id = %s AND is_hidden = FALSE ORDER BY created_at DESC", (uid,))
            rows = cur.fetchall()
            photos = [{'id': r[0], 'photo_url': r[1]} for r in rows]
            return resp(200, {'ok': True, 'photos': photos})

        # Список фото галереи профиля
        if action == 'profile_photos_list':
            cur.execute("SELECT id, photo_url, created_at FROM profile_photos WHERE user_id = %s AND is_hidden = FALSE ORDER BY created_at DESC", (me['id'],))
            rows = cur.fetchall()
            photos = [{'id': r[0], 'photo_url': r[1], 'created_at': str(r[2])} for r in rows]
            return resp(200, {'ok': True, 'photos': photos})

        # Добавить фото в галерею профиля
        if action == 'profile_photo_add':
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
            cur.execute("SELECT COUNT(*) FROM profile_photos WHERE user_id = %s AND is_hidden = FALSE", (me['id'],))
            if cur.fetchone()[0] >= 9:
                return resp(400, {'error': 'Максимум 9 фото в галерее'})
            ext = 'jpg' if 'jpeg' in content_type else content_type.split('/')[-1]
            key = f"gallery/{me['id']}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute("INSERT INTO profile_photos (user_id, photo_url) VALUES (%s, %s) RETURNING id, created_at", (me['id'], cdn_url))
            row = cur.fetchone()
            conn.commit()
            return resp(200, {'ok': True, 'photo': {'id': row[0], 'photo_url': cdn_url, 'created_at': str(row[1])}})

        # Удалить фото из галереи профиля (мягкое удаление)
        if action == 'profile_photo_delete':
            body = json.loads(event.get('body') or '{}')
            photo_id = int(body.get('photo_id', 0))
            cur.execute("SELECT id FROM profile_photos WHERE id = %s AND user_id = %s AND is_hidden = FALSE", (photo_id, me['id']))
            if not cur.fetchone():
                return resp(404, {'error': 'Фото не найдено'})
            cur.execute("UPDATE profile_photos SET is_hidden = TRUE WHERE id = %s AND user_id = %s", (photo_id, me['id']))
            conn.commit()
            return resp(200, {'ok': True})

        # Профиль пользователя по id
        if action == 'user_profile':
            uid = int(params.get('user_id', 0))
            cur.execute("""
                SELECT id, name, age, city, bio, photo_url, tags, verified, online, created_at
                FROM users WHERE id = %s
            """, (uid,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Пользователь не найден'})
            cols = ['id', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'created_at']
            profile = dict(zip(cols, row))
            profile['created_at'] = str(profile['created_at'])
            # Подписчики = кто лайкнул, подписки = кого лайкнул
            cur.execute("SELECT COUNT(*) FROM likes WHERE liked_id = %s", (uid,))
            followers = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM likes WHERE liker_id = %s", (uid,))
            following = cur.fetchone()[0]
            profile['followers'] = followers
            profile['following'] = following
            cur.execute("""
                SELECT id, photo_url, caption, created_at,
                       (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id) as likes_count,
                       (SELECT COUNT(*) FROM post_comments WHERE post_id = posts.id) as comments_count
                FROM posts WHERE user_id = %s ORDER BY created_at DESC LIMIT 30
            """, (uid,))
            pcols = ['id', 'photo_url', 'caption', 'created_at', 'likes_count', 'comments_count']
            posts = [dict(zip(pcols, r)) for r in cur.fetchall()]
            return resp(200, {'profile': profile, 'posts': posts})

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
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
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

        # Удалить пост
        if action == 'post_delete':
            body = json.loads(event.get('body') or '{}')
            post_id = int(body.get('post_id', 0))
            if not post_id:
                return resp(400, {'error': 'post_id обязателен'})
            cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Пост не найден'})
            if row[0] != me['id']:
                return resp(403, {'error': 'Нельзя удалить чужой пост'})
            cur.execute("DELETE FROM post_comments WHERE post_id = %s", (post_id,))
            cur.execute("DELETE FROM post_likes WHERE post_id = %s", (post_id,))
            cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # Пожаловаться на пост
        if action == 'report_post':
            body = json.loads(event.get('body') or '{}')
            post_id = int(body.get('post_id', 0))
            reason = body.get('reason', 'other')[:100]
            if not post_id:
                return resp(400, {'error': 'post_id обязателен'})
            cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Пост не найден'})
            reported_user_id = row[0]
            cur.execute(
                "SELECT id FROM reports WHERE reporter_id=%s AND post_id=%s",
                (me['id'], post_id)
            )
            if cur.fetchone():
                return resp(200, {'ok': True, 'already': True})
            cur.execute(
                "INSERT INTO reports (reporter_id, reported_id, post_id, reason) VALUES (%s, %s, %s, %s)",
                (me['id'], reported_user_id, post_id, reason)
            )
            conn.commit()
            return resp(200, {'ok': True})

        # ── ВЕРИФИКАЦИЯ (user) ─────────────────────────────────────────────────

        if action == 'verify_status':
            cur.execute("SELECT verified, email FROM users WHERE id=%s", (me['id'],))
            urow = cur.fetchone()
            cur.execute("SELECT status, email_verified, reject_reason FROM verification_requests WHERE user_id=%s", (me['id'],))
            vrow = cur.fetchone()
            return resp(200, {
                'verified': bool(urow[0]) if urow else False,
                'email': urow[1] if urow else None,
                'selfie_status': vrow[0] if vrow else None,
                'email_verified': bool(vrow[1]) if vrow else False,
                'reject_reason': vrow[2] if vrow else None,
            })

        if action == 'verify_email_send':
            body = json.loads(event.get('body') or '{}')
            email = body.get('email', '').strip().lower()
            if not email or '@' not in email:
                return resp(400, {'error': 'Некорректный email'})
            cur.execute("SELECT id FROM users WHERE email=%s AND id != %s", (email, me['id']))
            if cur.fetchone():
                return resp(400, {'error': 'Этот email уже используется'})
            code = str(random.randint(100000, 999999))
            cur.execute("UPDATE email_codes SET used=TRUE WHERE user_id=%s AND used=FALSE", (me['id'],))
            cur.execute("INSERT INTO email_codes (user_id, email, code) VALUES (%s, %s, %s)", (me['id'], email, code))
            conn.commit()
            try:
                send_verify_email(email, code, me['name'])
            except Exception as e:
                return resp(500, {'error': f'Ошибка отправки письма: {str(e)}'})
            return resp(200, {'ok': True})

        if action == 'verify_email_confirm':
            body = json.loads(event.get('body') or '{}')
            email = body.get('email', '').strip().lower()
            code = body.get('code', '').strip()
            cur.execute("""
                SELECT id FROM email_codes
                WHERE user_id=%s AND email=%s AND code=%s AND used=FALSE AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            """, (me['id'], email, code))
            row = cur.fetchone()
            if not row:
                return resp(400, {'error': 'Неверный или истёкший код'})
            cur.execute("UPDATE email_codes SET used=TRUE WHERE id=%s", (row[0],))
            cur.execute("UPDATE users SET email=%s WHERE id=%s", (email, me['id']))
            cur.execute("UPDATE verification_requests SET email_verified=TRUE WHERE user_id=%s", (me['id'],))
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'verify_selfie':
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
            key = f"selfies/{me['id']}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute("SELECT id FROM verification_requests WHERE user_id=%s", (me['id'],))
            if cur.fetchone():
                cur.execute("UPDATE verification_requests SET selfie_url=%s, status='pending', reviewed_at=NULL, reject_reason=NULL WHERE user_id=%s",
                            (cdn_url, me['id']))
            else:
                cur.execute("INSERT INTO verification_requests (user_id, selfie_url) VALUES (%s, %s)", (me['id'], cdn_url))
            conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()