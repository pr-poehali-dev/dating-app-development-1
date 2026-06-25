import json, os, psycopg2

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
            (token,)
        )
        row = cur.fetchone()
        return {"id": row[0], "name": row[1]} if row else None

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
    """Feedback API: send user feedback/review"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = (event.get("headers") or {}).get("X-Authorization") or (event.get("headers") or {}).get("Authorization", "")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    text = (body.get("text") or "").strip()
    rating = body.get("rating")
    category = (body.get("category") or "general").strip()

    if not text:
        return err("text required")
    if len(text) > 2000:
        return err("text too long")

    conn = get_db()
    try:
        user = get_user(conn, token)
        user_id = user["id"] if user else None
        user_name = user["name"] if user else "Аноним"

        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO user_feedback (user_id, user_name, text, rating, category)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (user_id, user_name, text, rating, category)
            )
            fid = cur.fetchone()[0]
            conn.commit()

        return ok({"ok": True, "id": fid})
    finally:
        conn.close()
