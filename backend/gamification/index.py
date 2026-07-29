"""
Геймификация: монеты + ежедневные задания.
Действия (query ?action= или body.action):
  - state            GET  — баланс монет + список сегодняшних заданий
  - progress         POST — увеличить прогресс задания {task_key, step?}
  - claim            POST — забрать награду за выполненное задание {task_key}
  - spend            POST — списать монеты {amount, reason}
  - history          GET  — последние транзакции
Авторизация: заголовок X-Auth-Token (сессия).
"""
import json
import os
from datetime import date
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

# Определение ежедневных заданий: ключ -> (заголовок, цель, награда монет)
TASK_DEFS = {
    'checkin':          {'title': 'Зайти в приложение',        'goal': 1,  'reward': 20, 'icon': 'CalendarCheck'},
    'send_likes':       {'title': 'Поставить 5 лайков',         'goal': 5,  'reward': 15, 'icon': 'Heart'},
    'send_message':     {'title': 'Написать сообщение',         'goal': 1,  'reward': 15, 'icon': 'MessageCircle'},
    'view_profiles':    {'title': 'Посмотреть 10 анкет',        'goal': 10, 'reward': 10, 'icon': 'Users'},
    'open_daily_match': {'title': 'Открыть «Знакомство дня»',   'goal': 1,  'reward': 25, 'icon': 'Sparkles'},
}
TASK_ORDER = ['checkin', 'open_daily_match', 'send_likes', 'send_message', 'view_profiles']


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'],
                            options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")


def resp(status, body):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(body, ensure_ascii=False)}


def _balance(cur, user_id):
    cur.execute("SELECT COALESCE(coins, 0) FROM users WHERE id = %s", (user_id,))
    r = cur.fetchone()
    return int(r[0]) if r else 0


def _add_coins(cur, user_id, amount, reason):
    cur.execute("UPDATE users SET coins = COALESCE(coins,0) + %s WHERE id = %s RETURNING coins", (amount, user_id))
    new_balance = int(cur.fetchone()[0])
    cur.execute(
        "INSERT INTO coin_transactions (user_id, amount, reason, balance_after) VALUES (%s,%s,%s,%s)",
        (user_id, amount, reason, new_balance))
    return new_balance


def _gift_coins_price(ruble_price: int) -> int:
    """Цена подарка в монетах — та же формула, что на фронте (единый источник)."""
    value = 180 + ruble_price * 0.12
    if value < 500:
        return round(value / 10) * 10
    if value < 2000:
        return round(value / 50) * 50
    return round(value / 100) * 100


def _bot_message(cur, user_id: int, sys_text: str) -> None:
    """Системное сообщение от бота Полутон (напр. уведомление о подарке)."""
    bot_email = 'system@lbloom.ru'
    bot_photo = 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png'
    cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (bot_email,))
    bot_row = cur.fetchone()
    if not bot_row:
        cur.execute(
            "INSERT INTO users (name, email, password_hash, photo_url, verified) "
            "VALUES ('Полутон', %s, 'system_no_login', %s, TRUE) RETURNING id",
            (bot_email, bot_photo))
        bot_row = cur.fetchone()
    if not bot_row or bot_row[0] == user_id:
        return
    bot_id = bot_row[0]
    cur.execute(
        "SELECT id FROM matches WHERE (user1_id=%s AND user2_id=%s) OR (user1_id=%s AND user2_id=%s) LIMIT 1",
        (bot_id, user_id, user_id, bot_id))
    m = cur.fetchone()
    if not m:
        cur.execute("INSERT INTO matches (user1_id, user2_id) VALUES (%s, %s) RETURNING id", (bot_id, user_id))
        m = cur.fetchone()
    if m:
        cur.execute("INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s)",
                    (m[0], bot_id, sys_text))


def _ensure_today_rows(cur, user_id):
    today = date.today()
    for key in TASK_ORDER:
        cur.execute(
            "INSERT INTO daily_tasks (user_id, task_key, task_date, progress, goal) "
            "VALUES (%s,%s,%s,0,%s) ON CONFLICT (user_id, task_key, task_date) DO NOTHING",
            (user_id, key, today, TASK_DEFS[key]['goal']))


def _tasks_state(cur, user_id):
    today = date.today()
    _ensure_today_rows(cur, user_id)
    cur.execute(
        "SELECT task_key, progress, goal, claimed FROM daily_tasks WHERE user_id=%s AND task_date=%s",
        (user_id, today))
    by_key = {row[0]: row for row in cur.fetchall()}
    out = []
    for key in TASK_ORDER:
        row = by_key.get(key)
        progress = int(row[1]) if row else 0
        goal = int(row[2]) if row else TASK_DEFS[key]['goal']
        claimed = bool(row[3]) if row else False
        d = TASK_DEFS[key]
        out.append({
            'key': key, 'title': d['title'], 'icon': d['icon'], 'reward': d['reward'],
            'progress': min(progress, goal), 'goal': goal,
            'done': progress >= goal, 'claimed': claimed,
        })
    return out


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
    if not token:
        return resp(401, {'error': 'Unauthorized'})

    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}
    action = params.get('action') or body.get('action') or 'state'

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
        row = cur.fetchone()
        if not row:
            return resp(401, {'error': 'Unauthorized'})
        user_id = row[0]

        if action == 'state':
            tasks = _tasks_state(cur, user_id)
            conn.commit()
            return resp(200, {'coins': _balance(cur, user_id), 'tasks': tasks})

        if action == 'progress':
            task_key = body.get('task_key', '')
            step = int(body.get('step', 1) or 1)
            if task_key not in TASK_DEFS:
                return resp(400, {'error': 'Неизвестное задание'})
            today = date.today()
            goal = TASK_DEFS[task_key]['goal']
            _ensure_today_rows(cur, user_id)
            cur.execute(
                "UPDATE daily_tasks SET progress = LEAST(progress + %s, %s), updated_at = NOW() "
                "WHERE user_id=%s AND task_key=%s AND task_date=%s AND claimed = FALSE "
                "RETURNING progress",
                (step, goal, user_id, task_key, today))
            cur.fetchone()
            conn.commit()
            return resp(200, {'coins': _balance(cur, user_id), 'tasks': _tasks_state(cur, user_id)})

        if action == 'claim':
            task_key = body.get('task_key', '')
            if task_key not in TASK_DEFS:
                return resp(400, {'error': 'Неизвестное задание'})
            today = date.today()
            _ensure_today_rows(cur, user_id)
            cur.execute(
                "SELECT progress, goal, claimed FROM daily_tasks "
                "WHERE user_id=%s AND task_key=%s AND task_date=%s",
                (user_id, task_key, today))
            r = cur.fetchone()
            if not r:
                return resp(400, {'error': 'Задание не найдено'})
            progress, goal, claimed = int(r[0]), int(r[1]), bool(r[2])
            if claimed:
                return resp(400, {'error': 'Награда уже получена'})
            if progress < goal:
                return resp(400, {'error': 'Задание ещё не выполнено'})
            reward = TASK_DEFS[task_key]['reward']
            cur.execute(
                "UPDATE daily_tasks SET claimed = TRUE, updated_at = NOW() "
                "WHERE user_id=%s AND task_key=%s AND task_date=%s",
                (user_id, task_key, today))
            new_balance = _add_coins(cur, user_id, reward, f'task_{task_key}')
            conn.commit()
            return resp(200, {'coins': new_balance, 'reward': reward, 'tasks': _tasks_state(cur, user_id)})

        if action == 'spend':
            amount = int(body.get('amount', 0) or 0)
            reason = (body.get('reason') or 'spend')[:64]
            if amount <= 0:
                return resp(400, {'error': 'Некорректная сумма'})
            balance = _balance(cur, user_id)
            if balance < amount:
                return resp(400, {'error': 'Недостаточно монет', 'coins': balance})
            new_balance = _add_coins(cur, user_id, -amount, reason)
            conn.commit()
            return resp(200, {'coins': new_balance, 'ok': True})

        if action == 'buy_gift':
            recipient_id = int(body.get('recipient_id', 0) or 0)
            gift_id = int(body.get('gift_id', 0) or 0)
            ruble_price = int(body.get('ruble_price', 0) or 0)
            gift_name = (body.get('gift_name') or 'Подарок')[:255]
            gift_emoji = (body.get('gift_emoji') or '🎁')[:10]
            gift_category = (body.get('gift_category') or 'heart')[:50]
            gift_variant = int(body.get('gift_variant', 0) or 0)
            gift_rarity = (body.get('gift_rarity') or 'common')[:20]

            if not recipient_id or not gift_id:
                return resp(400, {'error': 'Не указан подарок или получатель'})
            # Подарки за монеты — только «Особые» (не маркет)
            if gift_category == 'market':
                return resp(400, {'error': 'Этот подарок покупается только за рубли'})

            cost = _gift_coins_price(ruble_price)
            balance = _balance(cur, user_id)
            if balance < cost:
                return resp(400, {'error': 'Недостаточно монет', 'coins': balance, 'need': cost})

            new_balance = _add_coins(cur, user_id, -cost, f'gift_{gift_id}')
            cur.execute(
                "INSERT INTO user_gifts "
                "(sender_id, recipient_id, gift_id, gift_name, gift_emoji, gift_category, "
                " gift_variant, gift_rarity, amount, payment_id) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (user_id, recipient_id, gift_id, gift_name, gift_emoji, gift_category,
                 gift_variant, gift_rarity, cost, f'coins:{user_id}:{gift_id}'))
            _bot_message(cur, user_id, f'__GIFT_BOT__{gift_emoji}|{gift_name}')
            conn.commit()
            return resp(200, {'ok': True, 'coins': new_balance, 'spent': cost})

        if action == 'history':
            cur.execute(
                "SELECT amount, reason, balance_after, created_at FROM coin_transactions "
                "WHERE user_id=%s ORDER BY created_at DESC LIMIT 30", (user_id,))
            items = [{'amount': int(a), 'reason': rs, 'balance_after': int(b), 'created_at': str(c)}
                     for a, rs, b, c in cur.fetchall()]
            return resp(200, {'items': items, 'coins': _balance(cur, user_id)})

        return resp(400, {'error': 'Неизвестное действие'})
    finally:
        conn.close()