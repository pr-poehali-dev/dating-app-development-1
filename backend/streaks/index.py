import json
import os
from datetime import date
import psycopg2

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}

MILESTONES = [3, 7, 14, 30, 60, 100, 365]

def build_response(current, longest, total, active_today):
    next_milestone = next((m for m in MILESTONES if m > current), None)
    reached_milestone = current in MILESTONES
    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "current_streak": current,
            "longest_streak": longest,
            "total_days": total,
            "active_today": bool(active_today),
            "streak_frozen": False,
            "next_milestone": next_milestone,
            "reached_milestone": reached_milestone,
            "milestones": MILESTONES,
        })
    }

def handler(event: dict, context) -> dict:
    """Стрики активности пользователя — получить (GET) и обновить (POST).
    GET ?user_id=N — публичный стрик другого пользователя."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token", "")
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    target_user_id = params.get("user_id")

    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Unauthorized"})}

    conn = get_db()
    try:
        cur = conn.cursor()

        # Получаем user_id из сессии
        cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Unauthorized"})}
        user_id = row[0]

        # Если запрашиваем чужой стрик — просто читаем и возвращаем
        if method == "GET" and target_user_id and int(target_user_id) != user_id:
            cur.execute("""
                SELECT current_streak, longest_streak, last_active_date, total_days
                FROM user_streaks WHERE user_id = %s
            """, (int(target_user_id),))
            r = cur.fetchone()
            if not r:
                return build_response(0, 0, 0, False)
            c, l, la, t = r
            today_d = date.today()
            return build_response(c, l, t, la == today_d)

        today = date.today()

        # Читаем текущее состояние стрика
        cur.execute("""
            SELECT current_streak, longest_streak, last_active_date, total_days
            FROM user_streaks WHERE user_id = %s
        """, (user_id,))
        existing = cur.fetchone()

        if existing is None:
            # Первый раз — создаём запись
            current, longest, last_active, total = 0, 0, None, 0
        else:
            current, longest, last_active, total = existing

        active_today = (last_active == today)

        if method == "POST" and not active_today:
            # Считаем новый стрик
            if last_active is None:
                new_current = 1
                new_total = 1
            elif (today - last_active).days == 1:
                new_current = current + 1
                new_total = total + 1
            else:
                # Пропустил день — сброс
                new_current = 1
                new_total = total + 1

            new_longest = max(longest, new_current)

            if existing is None:
                cur.execute("""
                    INSERT INTO user_streaks
                        (user_id, current_streak, longest_streak, total_days, last_active_date, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """, (user_id, new_current, new_longest, new_total, today))
            else:
                cur.execute("""
                    UPDATE user_streaks
                    SET current_streak = %s, longest_streak = %s, total_days = %s,
                        last_active_date = %s, updated_at = NOW()
                    WHERE user_id = %s
                """, (new_current, new_longest, new_total, today, user_id))

            conn.commit()
            return build_response(new_current, new_longest, new_total, True)

        # GET или уже отметился сегодня
        return build_response(current, longest, total, active_today)

    finally:
        conn.close()