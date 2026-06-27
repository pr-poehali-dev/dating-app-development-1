import json
import os
import random
import psycopg2

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

QUESTIONS = [
    {"text": "Какое идеальное свидание?", "options": ["Ужин в ресторане", "Прогулка в парке", "Кино дома", "Активный отдых"]},
    {"text": "Любимое время года?", "options": ["Весна", "Лето", "Осень", "Зима"]},
    {"text": "Предпочитаемый отдых?", "options": ["Пляж и море", "Горы и походы", "Город и музеи", "Дома с книгой"]},
    {"text": "Как провести пятничный вечер?", "options": ["Вечеринка с друзьями", "Тихий ужин вдвоём", "Фильм дома", "Ночная прогулка"]},
    {"text": "Какой жанр фильмов любишь?", "options": ["Комедия", "Триллер", "Романтика", "Фантастика"]},
    {"text": "Утром ты...?", "options": ["Встаю рано и бодро", "Долго просыпаюсь", "Сразу в телефон", "Зарядка и кофе"]},
    {"text": "Какой питомец ближе?", "options": ["Собака", "Кошка", "Нет питомцев", "Экзотика"]},
    {"text": "Как выражаешь чувства?", "options": ["Словами", "Действиями", "Подарками", "Объятиями"]},
    {"text": "Идеальная погода?", "options": ["Солнечно и тепло", "Пасмурно и прохладно", "Дождь за окном", "Снегопад"]},
    {"text": "Что важнее в отношениях?", "options": ["Доверие", "Страсть", "Юмор", "Общие интересы"]},
    {"text": "Ты в компании?", "options": ["Душа компании", "Наблюдатель", "Слушаю всех", "Общаюсь с близкими"]},
    {"text": "Любимая кухня?", "options": ["Итальянская", "Японская", "Домашняя", "Уличная еда"]},
    {"text": "Как справляешься со стрессом?", "options": ["Спорт", "Музыка", "Общение", "Одиночество"]},
    {"text": "Первое, что замечаешь в человеке?", "options": ["Глаза", "Улыбку", "Голос", "Манеры"]},
    {"text": "Мечтаешь о...?", "options": ["Путешествиях", "Карьере", "Семье", "Творчестве"]},
]

QUESTIONS_PER_GAME = 5


def handler(event: dict, context) -> dict:
    """Испытание совместимости — создать игру, ответить на вопросы, получить результат."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token", "")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Unauthorized"})}

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Unauthorized"})}
        user_id = row[0]

        # ── Создать игру ──────────────────────────────────────────────────────
        if action == "create":
            match_id = body.get("match_id")
            partner_id = body.get("partner_id")
            if not match_id or not partner_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "match_id and partner_id required"})}

            # Проверяем нет ли уже активной игры для этого матча
            cur.execute("""
                SELECT id FROM compatibility_games
                WHERE match_id = %s AND status IN ('waiting', 'answering')
                ORDER BY created_at DESC LIMIT 1
            """, (match_id,))
            existing = cur.fetchone()
            if existing:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"game_id": existing[0], "already_exists": True})}

            # Создаём игру
            cur.execute("""
                INSERT INTO compatibility_games (match_id, created_by, partner_id, status)
                VALUES (%s, %s, %s, 'waiting') RETURNING id
            """, (match_id, user_id, partner_id))
            game_id = cur.fetchone()[0]

            # Выбираем случайные вопросы
            chosen = random.sample(QUESTIONS, QUESTIONS_PER_GAME)
            for i, q in enumerate(chosen):
                cur.execute("""
                    INSERT INTO compatibility_questions (game_id, question_idx, question_text, options)
                    VALUES (%s, %s, %s, %s)
                """, (game_id, i, q["text"], json.dumps(q["options"])))

            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"game_id": game_id})}

        # ── Получить состояние игры ───────────────────────────────────────────
        elif action == "get":
            match_id = params.get("match_id")
            game_id = params.get("game_id")

            if game_id:
                cur.execute("SELECT id, match_id, created_by, partner_id, status, score_creator, score_partner, finished_at FROM compatibility_games WHERE id = %s", (int(game_id),))
            else:
                cur.execute("""
                    SELECT id, match_id, created_by, partner_id, status, score_creator, score_partner, finished_at
                    FROM compatibility_games WHERE match_id = %s
                    ORDER BY created_at DESC LIMIT 1
                """, (match_id,))

            game = cur.fetchone()
            if not game:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"game": None})}

            gid, gmatch, gcreator, gpartner, gstatus, gscore_c, gscore_p, gfinished = game

            cur.execute("""
                SELECT question_idx, question_text, options, creator_answer, partner_answer
                FROM compatibility_questions WHERE game_id = %s ORDER BY question_idx
            """, (gid,))
            questions = []
            for row in cur.fetchall():
                idx, text, opts, ca, pa = row
                q = {
                    "idx": idx,
                    "text": text,
                    "options": opts if isinstance(opts, list) else json.loads(opts),
                    "creator_answer": ca,
                    "partner_answer": pa,
                }
                # Не раскрываем ответ партнёра пока оба не ответили
                if gstatus != "finished":
                    if user_id == gcreator:
                        q["partner_answer"] = None
                    else:
                        q["creator_answer"] = None
                questions.append(q)

            is_creator = user_id == gcreator
            my_answered = all(
                (q["creator_answer"] is not None if is_creator else q["partner_answer"] is not None)
                for q in questions
            )

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "game": {
                    "id": gid,
                    "match_id": gmatch,
                    "created_by": gcreator,
                    "partner_id": gpartner,
                    "status": gstatus,
                    "score_creator": gscore_c,
                    "score_partner": gscore_p,
                    "finished_at": str(gfinished) if gfinished else None,
                    "is_creator": is_creator,
                    "my_answered": my_answered,
                },
                "questions": questions,
            })}

        # ── Ответить на вопросы ───────────────────────────────────────────────
        elif action == "answer":
            game_id = body.get("game_id")
            answers = body.get("answers", {})  # {question_idx: answer_idx}

            cur.execute("SELECT created_by, partner_id, status FROM compatibility_games WHERE id = %s", (game_id,))
            game = cur.fetchone()
            if not game:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Game not found"})}

            gcreator, gpartner, gstatus = game
            if gstatus == "finished":
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Game already finished"})}

            is_creator = user_id == gcreator

            for idx_str, ans in answers.items():
                idx = int(idx_str)
                if is_creator:
                    cur.execute("UPDATE compatibility_questions SET creator_answer = %s WHERE game_id = %s AND question_idx = %s", (ans, game_id, idx))
                else:
                    cur.execute("UPDATE compatibility_questions SET partner_answer = %s WHERE game_id = %s AND question_idx = %s", (ans, game_id, idx))

            # Обновляем статус игры
            cur.execute("SELECT creator_answer, partner_answer FROM compatibility_questions WHERE game_id = %s", (game_id,))
            qs = cur.fetchall()
            creator_done = all(r[0] is not None for r in qs)
            partner_done = all(r[1] is not None for r in qs)

            if creator_done and partner_done:
                # Подсчёт результатов
                matches = sum(1 for r in qs if r[0] == r[1])
                score_c = matches
                score_p = matches
                cur.execute("""
                    UPDATE compatibility_games SET status='finished', score_creator=%s, score_partner=%s, finished_at=NOW()
                    WHERE id=%s
                """, (score_c, score_p, game_id))
            elif creator_done or partner_done:
                cur.execute("UPDATE compatibility_games SET status='answering' WHERE id=%s", (game_id,))

            conn.commit()

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "ok": True,
                "finished": creator_done and partner_done,
            })}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Unknown action"})}

    finally:
        conn.close()
