"""
Видеоистории: загрузка, получение и удаление сторис (24 часа).
"""
import json, os, uuid, boto3, psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization, X-Auth-Token",
}


def resp(status, body):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(body, ensure_ascii=False, default=str)}


def get_token(event: dict) -> str:
    h = event.get("headers") or {}
    raw = (h.get("X-Authorization") or h.get("x-authorization") or
           h.get("Authorization") or h.get("authorization") or
           h.get("X-Auth-Token") or h.get("x-auth-token") or "")
    return raw.replace("Bearer ", "").strip()


def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.id, u.name, u.photo_url FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    token = get_token(event)
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={schema}")
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
        cur.execute("SELECT id, user_id FROM stories WHERE id = %s", (story_id,))
        row = cur.fetchone()
        if not row:
            return resp(404, {"error": "История не найдена"})
        if row[1] != user[0]:
            return resp(403, {"error": "Нет доступа"})
        cur.execute("UPDATE stories SET expires_at = NOW() WHERE id = %s", (story_id,))
        conn.commit()
        return resp(200, {"ok": True})

    # POST — два режима: presign (получить URL для загрузки) и create (создать запись после загрузки)
    if method == "POST":
        user = get_user(cur, token)
        if not user:
            return resp(401, {"error": "Не авторизован"})
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")

        s3 = boto3.client(
            "s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        )

        def ext_for(ct):
            return "mp4" if "mp4" in ct else ("webm" if "webm" in ct else "mov")

        # Режим 1: инициализировать multipart upload
        if action == "upload_init":
            import base64
            content_type = body.get("content_type", "video/mp4")
            key = f"stories/{user[0]}/{uuid.uuid4()}.{ext_for(content_type)}"
            mp = s3.create_multipart_upload(Bucket="files", Key=key, ContentType=content_type)
            return resp(200, {"upload_id": mp["UploadId"], "key": key})

        # Режим 2: загрузить один чанк
        if action == "upload_chunk":
            import base64
            upload_id = body.get("upload_id", "")
            key = body.get("key", "")
            part_number = int(body.get("part_number", 1))
            data_b64 = body.get("data", "")
            if not all([upload_id, key, data_b64]):
                return resp(400, {"error": "upload_id, key, data обязательны"})
            chunk_bytes = base64.b64decode(data_b64)
            part = s3.upload_part(
                Bucket="files", Key=key,
                UploadId=upload_id, PartNumber=part_number, Body=chunk_bytes
            )
            return resp(200, {"etag": part["ETag"], "part_number": part_number})

        # Режим 3: завершить multipart upload и создать историю
        if action == "upload_complete":
            upload_id = body.get("upload_id", "")
            key = body.get("key", "")
            parts = body.get("parts", [])
            duration = body.get("duration", 0)
            if not all([upload_id, key, parts]):
                return resp(400, {"error": "upload_id, key, parts обязательны"})
            s3.complete_multipart_upload(
                Bucket="files", Key=key, UploadId=upload_id,
                MultipartUpload={"Parts": [{"ETag": p["etag"], "PartNumber": p["part_number"]} for p in parts]}
            )
            video_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute(
                "INSERT INTO stories (user_id, video_url, duration) VALUES (%s, %s, %s) RETURNING id, created_at, expires_at",
                (user[0], video_url, duration)
            )
            row = cur.fetchone()
            conn.commit()
            return resp(200, {"id": row[0], "video_url": video_url, "created_at": str(row[1]), "expires_at": str(row[2])})

        # Режим 4 (legacy): создать запись в БД после прямой загрузки
        if action == "create":
            key = body.get("key") or ""
            duration = body.get("duration", 0)
            if not key:
                return resp(400, {"error": "key обязателен"})
            video_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute(
                "INSERT INTO stories (user_id, video_url, duration) VALUES (%s, %s, %s) RETURNING id, created_at, expires_at",
                (user[0], video_url, duration)
            )
            row = cur.fetchone()
            conn.commit()
            return resp(200, {"id": row[0], "video_url": video_url, "created_at": str(row[1]), "expires_at": str(row[2])})

        return resp(400, {"error": "Укажи action: presign или create"})

    # GET — получить активные сторис
    params = event.get("queryStringParameters") or {}
    view_id = params.get("view")
    if view_id:
        cur.execute("UPDATE stories SET views = views + 1 WHERE id = %s AND expires_at > NOW()", (view_id,))
        viewer = get_user(cur, token)
        if viewer:
            cur.execute("SELECT user_id FROM stories WHERE id = %s AND expires_at > NOW()", (view_id,))
            story_owner = cur.fetchone()
            if story_owner and story_owner[0] != viewer[0]:
                cur.execute(
                    "SELECT id FROM notifications WHERE user_id = %s AND type = 'story_view' "
                    "AND from_user_id = %s AND created_at > NOW() - INTERVAL '1 hour'",
                    (story_owner[0], viewer[0])
                )
                if not cur.fetchone():
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, from_user_id, ref_id) VALUES (%s, 'story_view', %s, %s)",
                        (story_owner[0], viewer[0], view_id)
                    )
        conn.commit()

    cur.execute("""
        SELECT s.id, s.user_id, s.video_url, s.duration, s.views, s.created_at, s.expires_at,
               u.name, u.photo_url
        FROM stories s
        JOIN users u ON u.id = s.user_id
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