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
    host = os.environ.get('SMTP_HOST', 'smtp.mail.ru')
    port = int(os.environ.get('SMTP_PORT', 465))
    user = os.environ.get('SMTP_USER', '')
    password = os.environ.get('SMTP_PASSWORD', '')
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Код подтверждения Полутон'
    msg['From'] = f'Полутон <{user}>'
    msg['To'] = to_email
    html = f"""<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#1a1625;border-radius:16px;padding:32px;">
      <h1 style="color:#FF2D78;font-size:28px;margin:0 0 8px">Полутон 🌸</h1>
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

        # ── Публичный: тарифы премиума ────────────────────────────────────────
        if action == 'get_premium_plans':
            cur.execute("""
                SELECT plan_key, label, price_per_month, total_amount, duration_months, popular
                FROM premium_plans WHERE active = TRUE ORDER BY sort_order
            """)
            cols = ['plan', 'label', 'price_per_month', 'total_amount', 'duration_months', 'popular']
            plans = []
            for r in cur.fetchall():
                d = dict(zip(cols, r))
                d['price_per_month'] = float(d['price_per_month'])
                d['total_amount']    = float(d['total_amount'])
                plans.append(d)
            return resp(200, {'plans': plans})

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
            new_only = params.get('new_only', '') == '1'
            zodiac_filter_val = params.get('zodiac', '').strip()

            conditions = [
                "(u.age IS NULL OR u.age BETWEEN %s AND %s)",
                "u.id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = %s)",
                "u.id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = %s)",
                "u.incognito = FALSE",
            ]
            q_params = [age_min, age_max, me['id'], me['id']]

            if looking_for == 'female':
                conditions.append("u.gender = 'female'")
            elif looking_for == 'male':
                conditions.append("u.gender = 'male'")

            if search:
                if search.startswith('@'):
                    conditions.append("u.username ILIKE %s")
                    q_params.append(f'%{search.lstrip("@")}%')
                else:
                    conditions.append("(u.name ILIKE %s OR u.username ILIKE %s)")
                    q_params.extend([f'%{search}%', f'%{search}%'])

            if city_filter_val:
                conditions.append("u.city ILIKE %s")
                q_params.append(f'%{city_filter_val}%')

            if country_filter_val:
                conditions.append("u.country ILIKE %s")
                q_params.append(f'%{country_filter_val}%')

            if zodiac_filter_val:
                conditions.append("u.zodiac = %s")
                q_params.append(zodiac_filter_val)

            if online_only:
                conditions.append("u.last_seen > NOW() - INTERVAL '5 minutes'")

            if new_only:
                conditions.append("u.created_at > NOW() - INTERVAL '7 days'")

            geo_select = ""
            geo_order = "u.created_at DESC" if new_only else "u.last_seen DESC"
            lat_f, lon_f = None, None
            if lat and lon and radius_km > 0:
                try:
                    lat_f = round(float(lat), 4)
                    lon_f = round(float(lon), 4)
                    geo_select = ", (6371 * acos(LEAST(1.0, cos(radians(%s)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(%s)) + sin(radians(%s)) * sin(radians(u.latitude))))) AS distance_km"
                    conditions.append("u.latitude IS NOT NULL AND u.longitude IS NOT NULL")
                    conditions.append("(6371 * acos(LEAST(1.0, cos(radians(%s)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(%s)) + sin(radians(%s)) * sin(radians(u.latitude))))) <= %s")
                    geo_order = "distance_km ASC"
                except Exception:
                    geo_select = ""
                    lat_f = lon_f = None

            where_clause = " AND ".join(conditions)
            if lat_f is not None:
                all_params = [lat_f, lon_f, lat_f] + q_params + [lat_f, lon_f, lat_f, radius_km]
            else:
                all_params = q_params
            cur.execute(f"""
                SELECT u.id, u.name, u.age, u.city, u.country, u.bio, u.photo_url, u.tags, u.verified, u.online, u.username, u.premium, u.height, u.weight, u.relationship_status, u.last_seen, u.show_age, u.zodiac,
                       (EXISTS (SELECT 1 FROM profile_boosts pb WHERE pb.user_id = u.id AND pb.expires_at > NOW())) AS boosted{geo_select}
                FROM users u
                WHERE {where_clause}
                ORDER BY boosted DESC, {geo_order}
                LIMIT 60
            """, all_params)
            rows = cur.fetchall()
            cols = ['id', 'name', 'age', 'city', 'country', 'bio', 'photo_url', 'tags', 'verified', 'online', 'username', 'premium', 'height', 'weight', 'relationship_status', 'last_seen', 'show_age', 'zodiac', 'boosted']
            if geo_select:
                cols.append('distance_km')
            profiles_list = []
            for r in rows:
                item = dict(zip(cols, r))
                if 'distance_km' in item and item['distance_km'] is not None:
                    item['distance_km'] = round(float(item['distance_km']), 1)
                if item.get('last_seen'):
                    item['last_seen'] = str(item['last_seen'])
                # Скрыть возраст если пользователь отключил его показ
                if not item.get('show_age', True):
                    item['age'] = None
                profiles_list.append(item)
            return resp(200, {'profiles': profiles_list})

        # Сохранить геолокацию
        # ── Инкогнито ──────────────────────────────────────────────────────────
        if action == 'toggle_incognito':
            # Только для premium-пользователей
            cur.execute("SELECT premium FROM users WHERE id = %s", (me['id'],))
            row = cur.fetchone()
            if not row or not row[0]:
                return resp(403, {'error': 'Режим инкогнито доступен только с Premium-подпиской'})
            cur.execute("UPDATE users SET incognito = NOT incognito WHERE id = %s RETURNING incognito", (me['id'],))
            new_val = cur.fetchone()[0]
            conn.commit()
            return resp(200, {'ok': True, 'incognito': new_val})

        if action == 'get_incognito':
            cur.execute("SELECT incognito FROM users WHERE id = %s", (me['id'],))
            row = cur.fetchone()
            return resp(200, {'incognito': row[0] if row else False})

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
            scalar = ['name', 'age', 'city', 'country', 'bio', 'photo_url', 'gender', 'looking_for', 'height', 'weight', 'relationship_status', 'zodiac']
            fields, values = [], []
            for key in scalar:
                if key in body:
                    fields.append(f"{key} = %s")
                    values.append(body[key])
            # tags — передаём как PostgreSQL text[]
            # boolean fields
            for bool_key in ['show_age']:
                if bool_key in body:
                    fields.append(f"{bool_key} = %s")
                    values.append(bool(body[bool_key]))
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
                    return resp(500, {'error': 'Ошибка сохранения данных'})
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

        if action == 'upload_audio':
            body = json.loads(event.get('body') or '{}')
            audio_data = body.get('audio', '')
            content_type = body.get('content_type', 'audio/webm')
            if not audio_data:
                return resp(400, {'error': 'Нет аудио'})
            if ',' in audio_data:
                audio_data = audio_data.split(',', 1)[1]
            audio_bytes = base64.b64decode(audio_data)
            if len(audio_bytes) > 5 * 1024 * 1024:
                return resp(400, {'error': 'Файл слишком большой (макс. 5 МБ)'})
            ext = content_type.split('/')[-1].split(';')[0] or 'webm'
            key = f"voice/{me['id']}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=audio_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            return resp(200, {'ok': True, 'url': cdn_url})

        if action == 'upload_video_circle':
            body = json.loads(event.get('body') or '{}')
            video_data = body.get('video', '')
            content_type = body.get('content_type', 'video/webm')
            if not video_data:
                return resp(400, {'error': 'Нет видео'})
            if ',' in video_data:
                video_data = video_data.split(',', 1)[1]
            video_bytes = base64.b64decode(video_data)
            if len(video_bytes) > 20 * 1024 * 1024:
                return resp(400, {'error': 'Видео слишком большое (макс. 20 МБ)'})
            ext = content_type.split('/')[-1].split(';')[0] or 'webm'
            key = f"videocircle/{me['id']}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=video_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            return resp(200, {'ok': True, 'url': cdn_url})

        if action == 'upload_cover':
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
            key = f"covers/{me['id']}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute("UPDATE users SET cover_url = %s WHERE id = %s", (cdn_url, me['id']))
            conn.commit()
            return resp(200, {'ok': True, 'cover_url': cdn_url})

        if action == 'delete_cover':
            cur.execute("UPDATE users SET cover_url = NULL WHERE id = %s", (me['id'],))
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'delete_photo':
            cur.execute("UPDATE users SET photo_url = NULL WHERE id = %s", (me['id'],))
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'activate_promo':
            body = json.loads(event.get('body') or '{}')
            code = body.get('code', '').strip().upper()
            if not code:
                return resp(400, {'error': 'Введи промокод'})
            cur.execute("""
                SELECT id, discount_percent, max_uses, used_count, expires_at, active
                FROM promo_codes WHERE code = %s
            """, (code,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Промокод не найден'})
            promo_id, discount, max_uses, used_count, expires_at, active = row
            if not active:
                return resp(400, {'error': 'Промокод недействителен'})
            if expires_at and expires_at.tzinfo:
                import datetime
                if datetime.datetime.now(datetime.timezone.utc) > expires_at:
                    return resp(400, {'error': 'Срок действия промокода истёк'})
            if used_count >= max_uses:
                return resp(400, {'error': 'Промокод уже исчерпан'})
            cur.execute("SELECT id FROM promo_code_uses WHERE promo_code_id = %s AND user_id = %s", (promo_id, me['id']))
            if cur.fetchone():
                return resp(400, {'error': 'Ты уже использовал этот промокод'})
            # Промокод не списываем здесь — он будет применён при оплате
            return resp(200, {'ok': True, 'discount_percent': discount, 'code': code})

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
            # Уведомить подписчиков
            cur.execute("SELECT subscriber_id FROM user_subscriptions WHERE target_id=%s", (me['id'],))
            subs = [r[0] for r in cur.fetchall()]
            for sub_id in subs:
                cur.execute(
                    "INSERT INTO notifications (user_id, type, from_user_id, ref_id) VALUES (%s, %s, %s, %s)",
                    (sub_id, 'new_photo', me['id'], row[0])
                )
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

        # Список приватных фото
        if action == 'private_photos_list':
            cur.execute(
                "SELECT id, photo_url, created_at FROM private_photos WHERE user_id = %s AND is_hidden = FALSE ORDER BY created_at DESC",
                (me['id'],)
            )
            photos = [{'id': r[0], 'photo_url': r[1], 'created_at': str(r[2])} for r in cur.fetchall()]
            return resp(200, {'ok': True, 'photos': photos})

        # Приватные фото партнёра (только если он дал доступ через __GRANT_PHOTO__)
        if action == 'partner_private_photos':
            partner_id = int(event.get('queryStringParameters', {}).get('partner_id', 0))
            if not partner_id:
                return resp(400, {'error': 'Нет partner_id'})
            cur.execute(
                "SELECT id, photo_url FROM private_photos WHERE user_id = %s AND is_hidden = FALSE ORDER BY created_at DESC",
                (partner_id,)
            )
            photos = [{'id': r[0], 'photo_url': r[1]} for r in cur.fetchall()]
            return resp(200, {'ok': True, 'photos': photos})

        # Добавить приватное фото (лимит: 1 бесплатно, 2 с подпиской)
        if action == 'private_photo_add':
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
            # Проверка лимита
            cur.execute("SELECT COUNT(*) FROM private_photos WHERE user_id = %s AND is_hidden = FALSE", (me['id'],))
            count = cur.fetchone()[0]
            limit = 2 if me['premium'] else 1
            if count >= limit:
                return resp(403, {'error': 'limit', 'limit': limit, 'premium': me['premium']})
            ext = 'jpg' if 'jpeg' in content_type else content_type.split('/')[-1]
            key = f"private_photos/{me['id']}/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute("INSERT INTO private_photos (user_id, photo_url) VALUES (%s, %s) RETURNING id, created_at", (me['id'], cdn_url))
            row = cur.fetchone()
            conn.commit()
            return resp(200, {'ok': True, 'photo': {'id': row[0], 'photo_url': cdn_url, 'created_at': str(row[1])}})

        # Удалить приватное фото
        if action == 'private_photo_delete':
            body = json.loads(event.get('body') or '{}')
            photo_id = int(body.get('photo_id', 0))
            cur.execute("SELECT id FROM private_photos WHERE id = %s AND user_id = %s AND is_hidden = FALSE", (photo_id, me['id']))
            if not cur.fetchone():
                return resp(404, {'error': 'Фото не найдено'})
            cur.execute("UPDATE private_photos SET is_hidden = TRUE WHERE id = %s AND user_id = %s", (photo_id, me['id']))
            conn.commit()
            return resp(200, {'ok': True})

        # Мои подписчики (кто подписан на меня)
        if action == 'my_followers':
            cur.execute(
                "SELECT u.id, u.name, u.age, u.photo_url, u.verified, u.online, u.last_seen "
                "FROM user_subscriptions s JOIN users u ON u.id = s.subscriber_id "
                "WHERE s.target_id = %s ORDER BY s.created_at DESC",
                (me['id'],)
            )
            cols = ['id', 'name', 'age', 'photo_url', 'verified', 'online', 'last_seen']
            users = [dict(zip(cols, r)) for r in cur.fetchall()]
            for u in users:
                if u.get('last_seen'):
                    u['last_seen'] = str(u['last_seen'])
            return resp(200, {'ok': True, 'users': users})

        # Мои подписки (на кого я подписан)
        if action == 'my_following':
            cur.execute(
                "SELECT u.id, u.name, u.age, u.photo_url, u.verified, u.online, u.last_seen "
                "FROM user_subscriptions s JOIN users u ON u.id = s.target_id "
                "WHERE s.subscriber_id = %s ORDER BY s.created_at DESC",
                (me['id'],)
            )
            cols = ['id', 'name', 'age', 'photo_url', 'verified', 'online', 'last_seen']
            users = [dict(zip(cols, r)) for r in cur.fetchall()]
            for u in users:
                if u.get('last_seen'):
                    u['last_seen'] = str(u['last_seen'])
            return resp(200, {'ok': True, 'users': users})

        # Подписчики другого пользователя (публично)
        if action == 'user_followers':
            uid = int(params.get('user_id', 0))
            cur.execute(
                "SELECT u.id, u.name, u.age, u.photo_url, u.verified, u.online, u.last_seen "
                "FROM user_subscriptions s JOIN users u ON u.id = s.subscriber_id "
                "WHERE s.target_id = %s ORDER BY s.created_at DESC",
                (uid,)
            )
            cols = ['id', 'name', 'age', 'photo_url', 'verified', 'online', 'last_seen']
            users = [dict(zip(cols, r)) for r in cur.fetchall()]
            for u in users:
                if u.get('last_seen'):
                    u['last_seen'] = str(u['last_seen'])
            return resp(200, {'ok': True, 'users': users})

        # Отправить тикет в поддержку
        if action == 'support_send':
            body = json.loads(event.get('body') or '{}')
            message = body.get('message', '').strip()
            if not message or len(message) < 5:
                return resp(400, {'error': 'Сообщение слишком короткое'})
            if len(message) > 2000:
                return resp(400, {'error': 'Сообщение слишком длинное (макс. 2000 символов)'})
            cur.execute(
                "INSERT INTO support_tickets (user_id, message) VALUES (%s, %s) RETURNING id, created_at",
                (me['id'], message)
            )
            row = cur.fetchone()
            conn.commit()
            return resp(200, {'ok': True, 'ticket_id': row[0], 'created_at': str(row[1])})

        # Мои тикеты поддержки
        if action == 'support_my_tickets':
            cur.execute(
                "SELECT id, message, reply, status, created_at, replied_at "
                "FROM support_tickets WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
                (me['id'],)
            )
            cols = ['id', 'message', 'reply', 'status', 'created_at', 'replied_at']
            tickets = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {'ok': True, 'tickets': tickets})

        # Закрыть/удалить свой тикет поддержки
        if action == 'support_delete':
            body = json.loads(event.get('body') or '{}')
            ticket_id = int(body.get('ticket_id', 0))
            if not ticket_id:
                return resp(400, {'error': 'ticket_id обязателен'})
            cur.execute("SELECT id FROM support_tickets WHERE id = %s AND user_id = %s", (ticket_id, me['id']))
            if not cur.fetchone():
                return resp(404, {'error': 'Тикет не найден'})
            cur.execute("DELETE FROM support_tickets WHERE id = %s AND user_id = %s", (ticket_id, me['id']))
            conn.commit()
            return resp(200, {'ok': True})

        # Подписаться / отписаться на обновления пользователя
        if action == 'subscribe_toggle':
            body = json.loads(event.get('body') or '{}')
            target_id = int(body.get('target_id', 0))
            if not target_id or target_id == me['id']:
                return resp(400, {'error': 'Некорректный target_id'})
            cur.execute("SELECT id FROM user_subscriptions WHERE subscriber_id=%s AND target_id=%s", (me['id'], target_id))
            if cur.fetchone():
                cur.execute("DELETE FROM user_subscriptions WHERE subscriber_id=%s AND target_id=%s", (me['id'], target_id))
                subscribed = False
            else:
                cur.execute("INSERT INTO user_subscriptions (subscriber_id, target_id) VALUES (%s, %s)", (me['id'], target_id))
                subscribed = True
                # Уведомление о новом подписчике
                cur.execute(
                    "INSERT INTO notifications (user_id, type, from_user_id) VALUES (%s, 'subscription', %s)",
                    (target_id, me['id'])
                )
            conn.commit()
            # Push о подписке
            if subscribed:
                try:
                    from pywebpush import webpush, WebPushException
                    vapid_private = os.environ.get('VAPID_PRIVATE_KEY', '')
                    vapid_email   = os.environ.get('VAPID_EMAIL', 'mailto:push@lovebloom.app')
                    if vapid_private:
                        cur.execute("SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=%s", (target_id,))
                        subs = cur.fetchall()
                        payload = json.dumps({'title': f'⭐ {me["name"] or "Кто-то"} подписался на вас', 'body': 'Новый подписчик в LoveBloom', 'url': '/'})
                        bad = []
                        for rid, ep, p256, auth in subs:
                            try:
                                webpush(subscription_info={'endpoint': ep, 'keys': {'p256dh': p256, 'auth': auth}},
                                        data=payload, vapid_private_key=vapid_private, vapid_claims={'sub': vapid_email})
                            except WebPushException as e:
                                st = getattr(e.response, 'status_code', 0) if e.response else 0
                                if st in (404, 410): bad.append(rid)
                        if bad:
                            cur.execute("DELETE FROM push_subscriptions WHERE id = ANY(%s)", (bad,))
                            conn.commit()
                except Exception:
                    pass
            return resp(200, {'ok': True, 'subscribed': subscribed})

        # Проверить статус подписки
        if action == 'subscription_status':
            target_id = int(params.get('target_id', 0))
            cur.execute("SELECT id FROM user_subscriptions WHERE subscriber_id=%s AND target_id=%s", (me['id'], target_id))
            return resp(200, {'subscribed': cur.fetchone() is not None})

        # Профиль пользователя по id
        if action == 'user_profile':
            uid = int(params.get('user_id', 0))
            cur.execute("""
                SELECT u.id, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online, u.last_seen, u.created_at,
                       u.username, u.premium, u.cover_url, u.gender, u.height, u.weight, u.relationship_status,
                       (EXISTS (SELECT 1 FROM profile_boosts pb WHERE pb.user_id = u.id AND pb.expires_at > NOW())) AS boosted
                FROM users u WHERE u.id = %s
            """, (uid,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Пользователь не найден'})
            cols = ['id', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online', 'last_seen', 'created_at',
                    'username', 'premium', 'cover_url', 'gender', 'height', 'weight', 'relationship_status', 'boosted']
            profile = dict(zip(cols, row))
            profile['created_at'] = str(profile['created_at'])
            profile['last_seen'] = str(profile['last_seen']) if profile['last_seen'] else None
            # Подписчики и подписки из user_subscriptions
            cur.execute("SELECT COUNT(*) FROM user_subscriptions WHERE target_id = %s", (uid,))
            profile['followers'] = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM user_subscriptions WHERE subscriber_id = %s", (uid,))
            profile['following'] = cur.fetchone()[0]
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
            cur.execute("""
                SELECT p.id, p.user_id, p.photo_url, p.caption, p.created_at,
                       u.name, u.photo_url as author_photo, u.zodiac as author_zodiac,
                       (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
                       (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = %s) as liked_by_me,
                       (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count
                FROM posts p
                JOIN users u ON u.id = p.user_id
                ORDER BY p.created_at DESC
                LIMIT 30
            """, (me['id'],))
            rows = cur.fetchall()
            cols = ['id', 'user_id', 'photo_url', 'caption', 'created_at', 'author_name', 'author_photo', 'author_zodiac', 'likes_count', 'liked_by_me', 'comments_count']
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
            if len(text) > 1000:
                return resp(400, {'error': 'Комментарий слишком длинный (макс. 1000 символов)'})
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

        # Редактировать пост (caption)
        if action == 'post_edit':
            body = json.loads(event.get('body') or '{}')
            post_id = int(body.get('post_id', 0))
            caption = body.get('caption', '')
            if not post_id:
                return resp(400, {'error': 'post_id обязателен'})
            cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Пост не найден'})
            if row[0] != me['id']:
                return resp(403, {'error': 'Нельзя редактировать чужой пост'})
            cur.execute("UPDATE posts SET caption = %s WHERE id = %s", (caption, post_id))
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
                "SELECT id FROM reports WHERE reporter_id=%s AND post_id=%s AND status='pending'",
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
            except Exception:
                return resp(500, {'error': 'Ошибка отправки письма. Проверь email и попробуй позже.'})
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

        # ── БЛОКИРОВКИ ─────────────────────────────────────────────────────────

        # Список заблокированных
        if action == 'blocks_list':
            cur.execute("""
                SELECT b.blocked_id, u.name, u.photo_url, u.age, b.created_at
                FROM user_blocks b
                JOIN users u ON u.id = b.blocked_id
                WHERE b.blocker_id = %s
                ORDER BY b.created_at DESC
            """, (me['id'],))
            cols = ['id', 'name', 'photo_url', 'age', 'blocked_at']
            return resp(200, {'blocks': [dict(zip(cols, r)) for r in cur.fetchall()]})

        # Заблокировать пользователя
        if action == 'block_user':
            body = json.loads(event.get('body') or '{}')
            target_id = int(body.get('user_id', 0))
            if not target_id or target_id == me['id']:
                return resp(400, {'error': 'Неверный user_id'})
            cur.execute(
                "INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (me['id'], target_id)
            )
            conn.commit()
            return resp(200, {'ok': True})

        # Разблокировать пользователя
        if action == 'unblock_user':
            body = json.loads(event.get('body') or '{}')
            target_id = int(body.get('user_id', 0))
            if not target_id:
                return resp(400, {'error': 'Неверный user_id'})
            cur.execute(
                "DELETE FROM user_blocks WHERE blocker_id = %s AND blocked_id = %s",
                (me['id'], target_id)
            )
            conn.commit()
            return resp(200, {'ok': True})

        # ── ПОДАРКИ ─────────────────────────────────────────────────────────────

        # Мои полученные подарки
        if action == 'my_gifts':
            cur.execute("""
                SELECT g.id, g.sender_id, g.gift_id, g.gift_name, g.gift_emoji,
                       g.gift_category, g.gift_variant, g.gift_rarity, g.amount, g.created_at,
                       u.name as sender_name, u.photo_url as sender_photo
                FROM user_gifts g
                LEFT JOIN users u ON u.id = g.sender_id
                WHERE g.recipient_id = %s
                ORDER BY g.created_at DESC
                LIMIT 50
            """, (me['id'],))
            cols = ['id', 'sender_id', 'gift_id', 'gift_name', 'gift_emoji',
                    'gift_category', 'gift_variant', 'gift_rarity', 'amount', 'created_at',
                    'sender_name', 'sender_photo']
            gifts = [dict(zip(cols, r)) for r in cur.fetchall()]
            for g in gifts:
                g['created_at'] = str(g['created_at'])
            return resp(200, {'ok': True, 'gifts': gifts})

        # Подарки любого пользователя по user_id
        if action == 'user_gifts':
            target_id = int(params.get('user_id', 0) or 0)
            if not target_id:
                return resp(400, {'error': 'user_id обязателен'})
            cur.execute("""
                SELECT g.id, g.sender_id, g.gift_id, g.gift_name, g.gift_emoji,
                       g.gift_category, g.gift_variant, g.gift_rarity, g.amount, g.created_at,
                       u.name as sender_name, u.photo_url as sender_photo
                FROM user_gifts g
                LEFT JOIN users u ON u.id = g.sender_id
                WHERE g.recipient_id = %s
                ORDER BY g.created_at DESC
                LIMIT 50
            """, (target_id,))
            cols = ['id', 'sender_id', 'gift_id', 'gift_name', 'gift_emoji',
                    'gift_category', 'gift_variant', 'gift_rarity', 'amount', 'created_at',
                    'sender_name', 'sender_photo']
            gifts = [dict(zip(cols, r)) for r in cur.fetchall()]
            for g in gifts:
                g['created_at'] = str(g['created_at'])
            return resp(200, {'ok': True, 'gifts': gifts})

        # ── Настройки уведомлений ──────────────────────────────────────────────
        if action == 'get_notif_settings':
            cur.execute(
                "SELECT notif_matches, notif_messages, notif_likes, notif_promo FROM users WHERE id=%s",
                (me['id'],)
            )
            row = cur.fetchone()
            return resp(200, {
                'matches': bool(row[0]) if row else True,
                'messages': bool(row[1]) if row else True,
                'likes': bool(row[2]) if row else True,
                'promo': bool(row[3]) if row else False,
            })

        if action == 'update_notif_settings':
            body = json.loads(event.get('body') or '{}')
            fields, values = [], []
            for key in ('matches', 'messages', 'likes', 'promo'):
                if key in body:
                    fields.append(f"notif_{key} = %s")
                    values.append(bool(body[key]))
            if fields:
                values.append(me['id'])
                cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=%s", values)
                conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()