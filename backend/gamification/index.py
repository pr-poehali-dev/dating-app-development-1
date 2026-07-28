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
