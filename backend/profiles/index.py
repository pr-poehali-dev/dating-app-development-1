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

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()
