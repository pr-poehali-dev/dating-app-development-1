import json
import os
from datetime import date, datetime
import psycopg2

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}

def handler(event: dict, context) -> dict:
    """Стрики активности пользователя — получить и обновить."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token", "")
    method = event.get("httpMethod", "GET")

    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Unauthorized"})}

    conn = get_db()
    try:
        cur = conn.cursor()

        # Получаем пользователя по токену
        cur.execute("SELECT id FROM sessions WHERE token = %s", (token,))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Unauthorized"})}
        user_id = row[0]

        today = date.today()

        # Убеждаемся что запись существует
        cur.execute("""
            INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_days, last_active_date)
            VALUES (%s, 0, 0, 0, NULL)
            ON CONFLICT (user_id) DO NOTHING
        """, (user_id,))
        conn.commit()

        if method == "POST":
            # Обновляем стрик (вызывается при любой активности)
            cur.execute("""
                SELECT current_streak, longest_streak, last_active_date, total_days, streak_frozen
                FROM user_streaks WHERE user_id = %s
            """, (user_id,))
            s = cur.fetchone()
            current, longest, last_active, total, frozen = s

            new_current = current
            new_total = total

            if last_active is None:
                # Первый вход
                new_current = 1
                new_total = 1
            elif last_active == today:
                # Уже заходили сегодня — ничего не меняем
                pass
            elif (today - last_active).days == 1:
                # Заход подряд
                new_current = current + 1
                new_total = total + 1
            else:
                # Пропустил день — сброс (если не заморожен)
                if frozen:
                    # Заморозка сохраняет стрик
                    new_current = current
                    new_total = total + 1
                else:
                    new_current = 1
                    new_total = total + 1

            new_longest = max(longest, new_current)

            cur.execute("""
                UPDATE user_streaks
                SET current_streak = %s, longest_streak = %s, total_days = %s,
                    last_active_date = %s, streak_frozen = FALSE, updated_at = NOW()
                WHERE user_id = %s
            """, (new_current, new_longest, new_total, today, user_id))
            conn.commit()

            current = new_current
            longest = new_longest
            total = new_total

        else:
            # GET — просто читаем
            cur.execute("""
                SELECT current_streak, longest_streak, last_active_date, total_days, streak_frozen
                FROM user_streaks WHERE user_id = %s
            """, (user_id,))
            s = cur.fetchone()
            current, longest, last_active, total, frozen = s

        # Вычисляем milestone и награду
        milestones = [3, 7, 14, 30, 60, 100, 365]
        next_milestone = next((m for m in milestones if m > current), None)
        reached_milestone = current in milestones

        # Проверяем активность сегодня
        cur.execute("SELECT last_active_date FROM user_streaks WHERE user_id = %s", (user_id,))
        row2 = cur.fetchone()
        active_today = row2 and row2[0] == today

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
                "milestones": milestones,
            })
        }
    finally:
        conn.close()
