"""
Видеоистории: загрузка, получение и удаление сторис (24 часа).
"""
import json, os, uuid, boto3, psycopg2, base64, re
import urllib.request, urllib.error

def _onesignal_to_user(user_id: int, title: str, body_text: str, url: str = '/'):
    """Отправляет push конкретному пользователю через OneSignal по External ID."""
    try:
        app_id = os.environ.get('ONESIGNAL_APP_ID', '')
        api_key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
        if not app_id or not api_key:
            return
        payload = {
            'app_id': app_id,
            'include_aliases': {'external_id': [str(user_id)]},
            'target_channel': 'push',
            'headings': {'en': title, 'ru': title},
            'contents': {'en': body_text, 'ru': body_text},
            'url': url,
        }
        scheme = 'Key' if api_key.startswith('os_v2_') else 'Basic'
        req = urllib.request.Request(
            'https://onesignal.com/api/v1/notifications',
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json; charset=utf-8',
                     'Authorization': f'{scheme} {api_key}'},
            method='POST',
        )
        urllib.request.urlopen(req, timeout=8).read()
    except Exception:
        pass

ALLOWED_CONTENT_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_FILE_SIZE = 200 * 1024 * 1024   # 200 МБ
MAX_CHUNK_SIZE = 10 * 1024 * 1024   # 10 МБ на чанк

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

        # Режим 1: инициализировать загрузку
        if action == "upload_init":
            content_type = body.get("content_type", "video/mp4")
            if content_type not in ALLOWED_CONTENT_TYPES:
                return resp(400, {"error": "Недопустимый тип файла. Разрешены: mp4, webm, mov"})
            upload_id = str(uuid.uuid4())
            key = f"stories/{user[0]}/{uuid.uuid4()}.{ext_for(content_type)}"
            tmp_path = f"/tmp/{upload_id}.bin"
            open(tmp_path, "wb").close()
            meta_path = f"/tmp/{upload_id}.meta"
            with open(meta_path, "w") as mf:
                json.dump({"key": key, "content_type": content_type, "user_id": user[0]}, mf)
            return resp(200, {"upload_id": upload_id, "key": key})

        # Режим 2: дописать чанк во временный файл
        if action == "upload_chunk":
            upload_id = body.get("upload_id", "")
            data_b64 = body.get("data", "")
            if not upload_id or not data_b64:
                return resp(400, {"error": "upload_id и data обязательны"})
            # Защита от Path Traversal
            if not re.match(r"^[a-f0-9\-]{36}$", upload_id):
                return resp(400, {"error": "Некорректный upload_id"})
            tmp_path = f"/tmp/{upload_id}.bin"
            if not os.path.exists(tmp_path):
                return resp(400, {"error": "Сессия загрузки не найдена, начни заново"})
            # Проверяем текущий размер
            if os.path.getsize(tmp_path) >= MAX_FILE_SIZE:
                return resp(413, {"error": "Размер файла превышен (макс. 200 МБ)"})
            try:
                chunk_bytes = base64.b64decode(data_b64)
            except Exception:
                return resp(400, {"error": "Некорректные данные base64"})
            if len(chunk_bytes) > MAX_CHUNK_SIZE:
                return resp(413, {"error": "Чанк слишком большой (макс. 10 МБ)"})
            if os.path.getsize(tmp_path) + len(chunk_bytes) > MAX_FILE_SIZE:
                return resp(413, {"error": "Размер файла превышен (макс. 200 МБ)"})
            with open(tmp_path, "ab") as f:
                f.write(chunk_bytes)
            return resp(200, {"ok": True})

        # Режим 3: завершить — загрузить в S3 и создать историю
        if action == "upload_complete":
            upload_id = body.get("upload_id", "")
            key = body.get("key", "")
            try:
                duration = int(body.get("duration", 0))
            except (ValueError, TypeError):
                duration = 0
            duration = max(0, min(duration, 3600))
            if not upload_id or not key:
                return resp(400, {"error": "upload_id и key обязательны"})
            # Защита от Path Traversal
            if not re.match(r"^[a-f0-9\-]{36}$", upload_id):
                return resp(400, {"error": "Некорректный upload_id"})
            tmp_path = f"/tmp/{upload_id}.bin"
            meta_path = f"/tmp/{upload_id}.meta"
            if not os.path.exists(tmp_path):
                return resp(400, {"error": "Файл не найден, начни загрузку заново"})
            content_type = "video/mp4"
            if os.path.exists(meta_path):
                with open(meta_path) as mf:
                    meta = json.load(mf)
                content_type = meta.get("content_type", content_type)
                # Проверяем что ключ принадлежит этому пользователю
                if meta.get("user_id") != user[0]:
                    return resp(403, {"error": "Нет доступа"})
            # Проверяем key соответствует ожидаемому формату stories/{user_id}/...
            if not re.match(r"^stories/\d+/[a-f0-9\-]+\.(mp4|webm|mov)$", key):
                return resp(400, {"error": "Некорректный key"})
            with open(tmp_path, "rb") as f:
                video_bytes = f.read()
            os.remove(tmp_path)
            if os.path.exists(meta_path):
                os.remove(meta_path)
            s3.put_object(Bucket="files", Key=key, Body=video_bytes, ContentType=content_type)
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
                    cur.execute("SELECT name FROM users WHERE id=%s", (viewer[0],))
                    _vr = cur.fetchone()
                    _vname = (_vr[0] if _vr and _vr[0] else 'Кто-то')
                    _onesignal_to_user(story_owner[0], '🎬 Просмотр истории', f'{_vname} посмотрел(а) вашу историю', '/')
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