import json, os, psycopg2
from datetime import datetime, timezone

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(conn, token):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, photo_url FROM users WHERE session_token = %s", (token,))
        row = cur.fetchone()
        if row:
            return {"id": row[0], "name": row[1], "photo_url": row[2]}
    return None

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
}

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}

def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg})}

def handler(event: dict, context) -> dict:
    """Live streaming API: list, start, end, join, leave, heart, chat, poll, signal_send, signal_poll"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    action = (event.get("queryStringParameters") or {}).get("action", "")
    token = (event.get("headers") or {}).get("X-Authorization") or (event.get("headers") or {}).get("Authorization", "")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_db()
    try:
        user = get_user(conn, token)

        # ── list ──────────────────────────────────────────────────────────────
        if action == "list":
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT ls.id, ls.user_id, ls.title, ls.status,
                           ls.viewers_count, ls.hearts_count, ls.started_at,
                           u.name, u.photo_url
                    FROM live_streams ls
                    JOIN users u ON u.id = ls.user_id
                    WHERE ls.status = 'active'
                    ORDER BY ls.viewers_count DESC, ls.started_at DESC
                    LIMIT 50
                """)
                rows = cur.fetchall()
            streams = []
            for r in rows:
                streams.append({
                    "id": r[0], "user_id": r[1], "title": r[2], "status": r[3],
                    "viewers_count": r[4], "hearts_count": r[5],
                    "started_at": r[6].isoformat() if r[6] else None,
                    "author_name": r[7], "author_photo": r[8],
                })
            return ok({"streams": streams})

        # ── start ─────────────────────────────────────────────────────────────
        if action == "start":
            if not user:
                return err("Unauthorized", 401)
            title = (body.get("title") or "").strip()
            if not title:
                return err("Title required")
            with conn.cursor() as cur:
                # Завершаем предыдущие активные стримы пользователя
                cur.execute(
                    "UPDATE live_streams SET status='ended', ended_at=NOW() WHERE user_id=%s AND status='active'",
                    (user["id"],)
                )
                cur.execute(
                    """INSERT INTO live_streams (user_id, title, status, viewers_count, hearts_count)
                       VALUES (%s, %s, 'active', 0, 0) RETURNING id, started_at""",
                    (user["id"], title)
                )
                sid, started_at = cur.fetchone()
                conn.commit()
            stream = {
                "id": sid, "user_id": user["id"], "title": title, "status": "active",
                "viewers_count": 0, "hearts_count": 0,
                "started_at": started_at.isoformat(),
                "author_name": user["name"], "author_photo": user["photo_url"],
            }
            return ok({"stream": stream})

        # ── end ───────────────────────────────────────────────────────────────
        if action == "end":
            if not user:
                return err("Unauthorized", 401)
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE live_streams SET status='ended', ended_at=NOW() WHERE user_id=%s AND status='active'",
                    (user["id"],)
                )
                conn.commit()
            return ok({"ok": True})

        # ── join ──────────────────────────────────────────────────────────────
        if action == "join":
            if not user:
                return err("Unauthorized", 401)
            stream_id = int(body.get("stream_id") or (event.get("queryStringParameters") or {}).get("stream_id", 0))
            if not stream_id:
                return err("stream_id required")
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO live_viewers (stream_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (stream_id, user["id"])
                )
                cur.execute(
                    "UPDATE live_streams SET viewers_count = (SELECT COUNT(*) FROM live_viewers WHERE stream_id=%s) WHERE id=%s",
                    (stream_id, stream_id)
                )
                conn.commit()
            return ok({"ok": True})

        # ── leave ─────────────────────────────────────────────────────────────
        if action == "leave":
            if not user:
                return err("Unauthorized", 401)
            stream_id = int(body.get("stream_id") or (event.get("queryStringParameters") or {}).get("stream_id", 0))
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM live_viewers WHERE stream_id=%s AND user_id=%s",
                    (stream_id, user["id"])
                )
                if stream_id:
                    cur.execute(
                        "UPDATE live_streams SET viewers_count = (SELECT COUNT(*) FROM live_viewers WHERE stream_id=%s) WHERE id=%s",
                        (stream_id, stream_id)
                    )
                conn.commit()
            return ok({"ok": True})

        # ── heart ─────────────────────────────────────────────────────────────
        if action == "heart":
            stream_id = int(body.get("stream_id") or (event.get("queryStringParameters") or {}).get("stream_id", 0))
            if not stream_id:
                return err("stream_id required")
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE live_streams SET hearts_count = hearts_count + 1 WHERE id=%s RETURNING hearts_count",
                    (stream_id,)
                )
                row = cur.fetchone()
                conn.commit()
            return ok({"hearts_count": row[0] if row else 0})

        # ── chat ──────────────────────────────────────────────────────────────
        if action == "chat":
            if not user:
                return err("Unauthorized", 401)
            stream_id = int(body.get("stream_id") or 0)
            text = (body.get("text") or "").strip()
            if not stream_id or not text:
                return err("stream_id and text required")
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO live_messages (stream_id, user_id, text, author_name, author_photo)
                       VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at""",
                    (stream_id, user["id"], text[:300], user["name"], user["photo_url"])
                )
                mid, created_at = cur.fetchone()
                conn.commit()
            msg = {
                "id": mid, "stream_id": stream_id, "user_id": user["id"],
                "text": text, "author_name": user["name"], "author_photo": user["photo_url"],
                "created_at": created_at.isoformat(),
            }
            return ok({"message": msg})

        # ── poll ──────────────────────────────────────────────────────────────
        if action == "poll":
            stream_id = int((event.get("queryStringParameters") or {}).get("stream_id", 0))
            last_msg_id = int((event.get("queryStringParameters") or {}).get("last_msg_id", 0))
            if not stream_id:
                return err("stream_id required")
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, status, viewers_count, hearts_count FROM live_streams WHERE id=%s",
                    (stream_id,)
                )
                row = cur.fetchone()
                if not row:
                    return err("Stream not found", 404)
                stream_info = {"id": row[0], "status": row[1], "viewers_count": row[2], "hearts_count": row[3]}
                cur.execute(
                    """SELECT id, user_id, text, author_name, author_photo, created_at
                       FROM live_messages WHERE stream_id=%s AND id > %s
                       ORDER BY id ASC LIMIT 30""",
                    (stream_id, last_msg_id)
                )
                msgs = []
                for r in cur.fetchall():
                    msgs.append({
                        "id": r[0], "stream_id": stream_id, "user_id": r[1],
                        "text": r[2], "author_name": r[3], "author_photo": r[4],
                        "created_at": r[5].isoformat() if r[5] else None,
                    })
            return ok({"stream": stream_info, "messages": msgs})

        # ── signal_send ───────────────────────────────────────────────────────
        if action == "signal_send":
            if not user:
                return err("Unauthorized", 401)
            stream_id = int(body.get("stream_id") or 0)
            signal_type = body.get("signal_type", "")
            payload = body.get("payload", "")
            to_user_id = body.get("to_user_id")
            if not stream_id or not signal_type:
                return err("stream_id and signal_type required")
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO live_signals (stream_id, from_user_id, to_user_id, signal_type, payload)
                       VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                    (stream_id, user["id"], to_user_id, signal_type, payload)
                )
                conn.commit()
            return ok({"ok": True})

        # ── signal_poll ───────────────────────────────────────────────────────
        if action == "signal_poll":
            if not user:
                return err("Unauthorized", 401)
            stream_id = int((event.get("queryStringParameters") or {}).get("stream_id", 0))
            last_id = int((event.get("queryStringParameters") or {}).get("last_id", 0))
            if not stream_id:
                return err("stream_id required")
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id, from_user_id, to_user_id, signal_type, payload
                       FROM live_signals
                       WHERE stream_id=%s AND id > %s
                         AND (to_user_id IS NULL OR to_user_id=%s)
                         AND from_user_id != %s
                       ORDER BY id ASC LIMIT 20""",
                    (stream_id, last_id, user["id"], user["id"])
                )
                signals = []
                for r in cur.fetchall():
                    signals.append({
                        "id": r[0], "from_user_id": r[1], "to_user_id": r[2],
                        "signal_type": r[3], "payload": r[4],
                    })
            return ok({"signals": signals})

        return err("Unknown action")

    finally:
        conn.close()