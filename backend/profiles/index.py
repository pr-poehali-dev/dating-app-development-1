"""
Профили пользователей: получить анкеты для свайпа, обновить свой профиль, загрузить фото
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

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT id, premium FROM users WHERE id = (SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW() LIMIT 1)",
        (token,)
    )
    row = cur.fetchone()
    return {'id': row[0], 'premium': row[1]} if row else None


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

        # GET /profiles — анкеты для свайпа
        if method == 'GET' and '/profiles' in path and not path.endswith('/me'):
            params = event.get('queryStringParameters') or {}
            age_max = int(params.get('age_max', 60))
            age_min = int(params.get('age_min', 18))
            distance = int(params.get('distance', 100))
            looking_for = params.get('looking_for', 'all')

            gender_filter = ""
            if looking_for == 'female':
                gender_filter = "AND u.gender = 'female'"
            elif looking_for == 'male':
                gender_filter = "AND u.gender = 'male'"

            cur = conn.cursor()
            cur.execute(f"""
                SELECT u.id, u.name, u.age, u.city, u.bio, u.photo_url, u.tags, u.verified, u.online
                FROM users u
                WHERE u.id != {me['id']}
                  AND (u.age IS NULL OR u.age BETWEEN {age_min} AND {age_max})
                  {gender_filter}
                  AND u.id NOT IN (
                    SELECT to_user_id FROM likes WHERE from_user_id = {me['id']}
                  )
                ORDER BY u.last_seen DESC
                LIMIT 20
            """)
            rows = cur.fetchall()
            cols = ['id', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online']
            profiles = [dict(zip(cols, r)) for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'profiles': profiles})}

        # PUT /profiles/me — обновить профиль
        if method == 'PUT' and path.endswith('/me'):
            body = json.loads(event.get('body') or '{}')
            fields = []
            values = []
            allowed = ['name', 'age', 'city', 'bio', 'photo_url', 'tags', 'gender', 'looking_for']
            for key in allowed:
                if key in body:
                    fields.append(f"{key} = %s")
                    values.append(body[key] if key != 'tags' else body[key])

            if fields:
                values.append(me['id'])
                cur = conn.cursor()
                cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", values)
                conn.commit()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # GET /profiles/:id — профиль конкретного юзера
        parts = path.rstrip('/').split('/')
        if method == 'GET' and parts[-1].isdigit():
            uid = int(parts[-1])
            cur = conn.cursor()
            cur.execute(
                "SELECT id, name, age, city, bio, photo_url, tags, verified, online FROM users WHERE id = %s",
                (uid,)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Не найден'})}
            cols = ['id', 'name', 'age', 'city', 'bio', 'photo_url', 'tags', 'verified', 'online']
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'profile': dict(zip(cols, row))})}

        # POST /profiles/photo — загрузить фото профиля
        if method == 'POST' and path.endswith('/photo'):
            body = json.loads(event.get('body') or '{}')
            image_data = body.get('image', '')
            content_type = body.get('content_type', 'image/jpeg')

            if not image_data:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет изображения'})}

            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)

            if len(image_bytes) > 10 * 1024 * 1024:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Файл слишком большой (макс. 10 МБ)'})}

            ext = 'jpg' if 'jpeg' in content_type else content_type.split('/')[-1]
            key = f"avatars/{me['id']}/{uuid.uuid4()}.{ext}"

            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)

            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"

            cur = conn.cursor()
            cur.execute("UPDATE users SET photo_url = %s WHERE id = %s", (cdn_url, me['id']))
            conn.commit()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'photo_url': cdn_url})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()