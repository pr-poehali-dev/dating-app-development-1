"""
Видеоистории: загрузка, получение и удаление сторис (24 часа).
"""
import json, os, base64, uuid, boto3, psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}
SCHEMA = "t_p49767073_dating_app_developme"


def resp(status, body):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(body, ensure_ascii=False, default=str)}


def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.name, u.photo_url FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    token = event.get("headers", {}).get("X-Auth-Token") or event.get("headers", {}).get("x-auth-token")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # DELETE — пометить историю как истёкшую (мягкое удаление)
    if method == "DELETE":
        user = get_user(cur, token)
        if not user:
            return resp(401, {"error": "Не авторизован"})
        body = json.loads(event.get("body") or "{}")
        story_id = body.get("story_id")
        if not story_id:
            return resp(400, {"error": "story_id обязателен"})
        cur.execute(f"SELECT id, user_id FROM {SCHEMA}.stories WHERE id = %s", (story_id,))
        row = cur.fetchone()
        if not row:
            return resp(404, {"error": "История не найдена"})
        if row[1] != user[0]:
            return resp(403, {"error": "Нет доступа"})
        cur.execute(f"UPDATE {SCHEMA}.stories SET expires_at = NOW() WHERE id = %s", (story_id,))
        conn.commit()
        return resp(200, {"ok": True})

    # POST — загрузить новую историю
    if method == "POST":
        user = get_user(cur, token)
        if not user:
            return resp(401, {"error": "Не авторизован"})
        body = json.loads(event.get("body") or "{}")
        video_b64 = body.get("video")
        content_type = body.get("content_type", "video/mp4")
        duration = body.get("duration", 0)
        if not video_b64:
            return resp(400, {"error": "video обязателен"})

        video_data = base64.b64decode(video_b64)
        ext = "mp4" if "mp4" in content_type else "webm"
        key = f"stories/{user[0]}/{uuid.uuid4()}.{ext}"

        s3 = boto3.client(
            "s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        )
        s3.put_object(Bucket="files", Key=key, Body=video_data, ContentType=content_type)
        video_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        cur.execute(
            f"INSERT INTO {SCHEMA}.stories (user_id, video_url, duration) VALUES (%s, %s, %s) RETURNING id, created_at, expires_at",
            (user[0], video_url, duration)
        )
        row = cur.fetchone()
        conn.commit()
        return resp(200, {"id": row[0], "video_url": video_url, "created_at": str(row[1]), "expires_at": str(row[2])})

    # GET — получить активные сторис
    params = event.get("queryStringParameters") or {}
    view_id = params.get("view")
    if view_id:
        cur.execute(f"UPDATE {SCHEMA}.stories SET views = views + 1 WHERE id = %s AND expires_at > NOW()", (view_id,))
        conn.commit()

    cur.execute(f"""
        SELECT s.id, s.user_id, s.video_url, s.duration, s.views, s.created_at, s.expires_at,
               u.name, u.photo_url
        FROM {SCHEMA}.stories s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        WHERE s.expires_at > NOW()
        ORDER BY s.created_at DESC
        LIMIT 100
    """)
    rows = cur.fetchall()

    users_map = {}
    for row in rows:
        uid = row[1]
        if uid not in users_map:
            users_map[uid] = {"user_id": uid, "user_name": row[7], "avatar": row[8], "stories": []}
        users_map[uid]["stories"].append({
            "id": row[0], "video_url": row[2], "duration": row[3],
            "views": row[4], "created_at": str(row[5]), "expires_at": str(row[6]),
        })

    return resp(200, {"groups": list(users_map.values())})
