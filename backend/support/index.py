import json
import os
import re
import base64
import uuid
import psycopg2
import boto3
from upload_guard import validate_upload


def get_db():
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={schema}")


def get_user(conn, token):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(
            """SELECT u.id, u.name FROM users u
               JOIN sessions s ON s.user_id = u.id
               WHERE s.token = %s AND s.expires_at > NOW() LIMIT 1""",
            (token,),
        )
        row = cur.fetchone()
        return {"id": row[0], "name": row[1]} if row else None


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
}


def resp(code, data):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}


ALLOWED_IMG = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif"}


def upload_image(image_b64: str) -> str:
    """Принимает data-URL или чистый base64 картинки, кладёт в S3, возвращает CDN-URL."""
    ext = "jpg"
    data_part = image_b64
    m = re.match(r"^data:image/(\w+);base64,(.*)$", image_b64, re.DOTALL)
    if m:
        ext = m.group(1).lower()
        data_part = m.group(2)
    if ext == "jpeg":
        ext = "jpg"
    if ext not in ALLOWED_IMG:
        raise ValueError("bad_format")

    raw = base64.b64decode(data_part)
    if len(raw) > 5 * 1024 * 1024:
        raise ValueError("too_big")

    # Проверяем реальное содержимое (magic bytes), а не заявленный формат
    _ok, real_ext, real_ct, _err = validate_upload(ALLOWED_IMG[ext], raw, 'image')
    if not _ok:
        raise ValueError("bad_format")

    key = f"support/{uuid.uuid4().hex}.{real_ext}"
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=real_ct)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """Обращение в поддержку: приём заявки от гостя или пользователя, сохранение в support_tickets."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}
    if event.get("httpMethod") != "POST":
        return resp(405, {"error": "method_not_allowed"})

    headers = event.get("headers") or {}
    token = headers.get("X-Authorization") or headers.get("Authorization", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    name = (body.get("name") or "").strip()[:100]
    login = (body.get("login") or "").strip()[:100]
    email = (body.get("email") or "").strip()[:150]
    message = (body.get("message") or "").strip()
    image_b64 = body.get("image") or ""

    if not message:
        return resp(400, {"error": "message_required"})
    if len(message) > 1000:
        return resp(400, {"error": "message_too_long"})
    if email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return resp(400, {"error": "bad_email"})

    image_url = None
    if image_b64:
        try:
            image_url = upload_image(image_b64)
        except ValueError as e:
            return resp(400, {"error": str(e)})

    conn = get_db()
    try:
        user = get_user(conn, token)
        user_id = user["id"] if user else 0
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO support_tickets
                       (user_id, message, status, guest_name, guest_login, guest_email, image_url, source)
                   VALUES (%s, %s, 'open', %s, %s, %s, %s, 'site')
                   RETURNING id""",
                (user_id, message, name or None, login or None, email or None, image_url),
            )
            tid = cur.fetchone()[0]
            conn.commit()
        return resp(200, {"ok": True, "id": tid})
    finally:
        conn.close()