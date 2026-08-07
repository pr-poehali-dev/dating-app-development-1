import json
import os
import datetime
import base64
import hashlib
import urllib.request
import urllib.error
import urllib.parse
import psycopg2


HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}


def _int(v, default=0):
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def _verify_payment_with_yookassa(payment_id: str):
    """
    Запрашивает реальный статус платежа напрямую у ЮKassa по его id.
    Возвращает (status, amount, metadata) при успехе либо None, если платёж
    не подтверждён/не найден/учётные данные недоступны.

    Это защищает от поддельных вебхуков: злоумышленник не сможет подделать
    ответ официального API ЮKassa, так как для запроса нужны наши секретные
    ключи магазина.
    """
    shop_id = os.environ.get('YOOKASSA_SHOP_ID')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
    if not shop_id or not secret_key or not payment_id:
        return None

    credentials = base64.b64encode(f'{shop_id}:{secret_key}'.encode()).decode()
    req = urllib.request.Request(
        f'https://api.yookassa.ru/v3/payments/{urllib.parse.quote(payment_id)}',
        headers={'Authorization': f'Basic {credentials}'},
        method='GET'
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError):
        return None

    status = data.get('status', '')
    try:
        amount = float((data.get('amount') or {}).get('value') or 0)
    except (TypeError, ValueError):
        amount = 0.0
    metadata = data.get('metadata') or {}
    return status, amount, metadata


def _create_gift_from_metadata(cur, payment_id: str, metadata: dict, amount: float) -> None:
    """Создаёт запись в user_gifts на основе metadata платежа."""
    if not metadata or metadata.get('kind') != 'gift':
        return

    recipient_id = _int(metadata.get('recipient_id'))
    gift_id = _int(metadata.get('gift_id'))
    if not recipient_id or not gift_id:
        return

    # Получатель должен реально существовать (иначе — подделанные данные)
    cur.execute("SELECT 1 FROM users WHERE id = %s LIMIT 1", (recipient_id,))
    if not cur.fetchone():
        return

    # Защита от дубликатов: один платёж = один подарок
    cur.execute("SELECT id FROM user_gifts WHERE payment_id = %s LIMIT 1", (payment_id,))
    if cur.fetchone():
        return

    # Определяем sender_id по токену из metadata (если есть)
    sender_id = None
    sender_token = metadata.get('sender_token') or ''
    if sender_token:
        cur.execute(
            "SELECT user_id FROM sessions WHERE token = %s LIMIT 1",
            (sender_token,)
        )
        row = cur.fetchone()
        if row:
            sender_id = row[0]

    gift_name = metadata.get('gift_name') or 'Подарок'
    gift_emoji = metadata.get('gift_emoji') or '🎁'
    gift_category = metadata.get('gift_category') or 'heart'
    gift_variant = _int(metadata.get('gift_variant'))
    gift_rarity = metadata.get('gift_rarity') or 'common'

    cur.execute(
        "INSERT INTO user_gifts "
        "(sender_id, recipient_id, gift_id, gift_name, gift_emoji, gift_category, "
        " gift_variant, gift_rarity, amount, payment_id) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (
            sender_id, recipient_id, gift_id, gift_name, gift_emoji, gift_category,
            gift_variant, gift_rarity, amount, payment_id
        )
    )

    # Уведомление отправителю от бота
    if sender_id:
        sys_text = f"__GIFT_BOT__{gift_emoji}|{gift_name}"
        _send_bot_message(cur, sender_id, sys_text)


def _add_coins_from_metadata(cur, payment_id: str, metadata: dict, amount: float) -> None:
    """Начисляет монеты после оплаты пополнения (kind == 'coins'). 1 руб = 1 монета."""
    if not metadata or metadata.get('kind') != 'coins':
        return

    # Кому начислять: по токену сессии или по user_id из metadata
    user_id = _int(metadata.get('user_id'))
    token = metadata.get('sender_token') or metadata.get('token') or ''
    if not user_id and token:
        cur.execute("SELECT user_id FROM sessions WHERE token = %s LIMIT 1", (token,))
        r = cur.fetchone()
        if r:
            user_id = r[0]
    if not user_id:
        return

    # Кол-во монет = РЕАЛЬНО оплаченная сумма в рублях (курс 1 ₽ = 1 монета).
    # Берём сумму платежа, а не значение из metadata, чтобы нельзя было
    # оплатить мало, а получить много монет. Минимум пополнения — 500.
    coins = int(round(amount))
    if coins < 500:
        return

    # Защита от повторного начисления по одному платежу
    cur.execute(
        "SELECT 1 FROM coin_transactions WHERE reason = %s LIMIT 1",
        (f'topup:{payment_id}',)
    )
    if cur.fetchone():
        return

    cur.execute(
        "UPDATE users SET coins = COALESCE(coins,0) + %s WHERE id = %s RETURNING coins",
        (coins, user_id)
    )
    new_row = cur.fetchone()
    if not new_row:
        return
    new_balance = int(new_row[0])
    cur.execute(
        "INSERT INTO coin_transactions (user_id, amount, reason, balance_after) VALUES (%s,%s,%s,%s)",
        (user_id, coins, f'topup:{payment_id}', new_balance)
    )
    _send_bot_message(cur, user_id, f'__COINS_TOPUP__{coins}')


def _apply_promo_from_metadata(cur, metadata: dict, user_id: int) -> None:
    """Списывает промокод после успешной оплаты (если был передан)."""
    promo_id = metadata.get('promo_id')
    if not promo_id or not user_id:
        return
    try:
        promo_id = int(promo_id)
    except (TypeError, ValueError):
        return
    # Идемпотентно: уникальный индекс (promo_code_id, user_id) не даст списать
    # промокод дважды. Счётчик увеличиваем ТОЛЬКО если строка реально добавлена.
    cur.execute(
        "INSERT INTO promo_code_uses (promo_code_id, user_id) VALUES (%s, %s) "
        "ON CONFLICT (promo_code_id, user_id) DO NOTHING RETURNING id",
        (promo_id, user_id)
    )
    if cur.fetchone():
        cur.execute(
            "UPDATE promo_codes SET used_count = used_count + 1 WHERE id = %s",
            (promo_id,)
        )


def _create_premium_from_metadata(cur, payment_id: str, metadata: dict) -> None:
    """Активирует Premium после успешной оплаты подписки."""
    kind = metadata.get('kind', '') if metadata else ''
    if kind and kind not in ('', 'premium'):
        return  # gift/boost — не наш случай

    plan = metadata.get('plan', '') if metadata else ''
    if not plan:
        return  # Нет плана — не премиум-платёж

    user_id = _int(metadata.get('user_id'))
    if not user_id:
        return

    # Уровень подписки (start/plus/gold), по умолчанию gold для обратной совместимости
    tier = metadata.get('tier', '') if metadata else ''
    if tier not in ('start', 'plus', 'gold'):
        tier = 'gold'

    # Защита от дубликатов по payment_id
    cur.execute(
        "SELECT id FROM notifications WHERE user_id = %s AND type = 'premium_activated' AND text = %s LIMIT 1",
        (user_id, payment_id)
    )
    if cur.fetchone():
        return

    # Длительность по плану
    plan_months = {'1month': 1, '3month': 3, '6month': 6, '12month': 12}
    months = plan_months.get(plan, 1)

    # Текущая дата окончания (продлеваем если есть активная)
    cur.execute("SELECT premium_until FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    now = datetime.datetime.now()
    base = row[0] if row and row[0] and row[0] > now else now
    premium_until = base + datetime.timedelta(days=30 * months)

    # Активируем premium
    cur.execute(
        "UPDATE users SET premium = TRUE, premium_until = %s, premium_tier = %s WHERE id = %s",
        (premium_until, tier, user_id)
    )

    tier_labels = {'start': 'Старт', 'plus': 'Плюс', 'gold': 'Золото'}
    tier_label = tier_labels.get(tier, 'Premium')
    plan_labels = {'1month': '1 месяц', '3month': '3 месяца', '6month': '6 месяцев', '12month': '12 месяцев'}
    plan_label = f"{tier_label} — {plan_labels.get(plan, plan)}"
    until_str = premium_until.strftime('%d.%m.%Y')

    # Уведомление в колокольчик (text = payment_id для дедупликации, ref_id = месяцы)
    notif_text = f"{plan_label}|{until_str}"
    cur.execute(
        "INSERT INTO notifications (user_id, type, from_user_id, text) VALUES (%s, 'premium_activated', NULL, %s)",
        (user_id, notif_text)
    )

    sys_text = f"__PREMIUM__{plan_label}|{until_str}"
    _send_bot_message(cur, user_id, sys_text)


def _send_bot_message(cur, user_id: int, sys_text: str) -> None:
    """Отправляет системное сообщение от бота Полутон пользователю."""
    LBLOOM_EMAIL = 'system@lbloom.ru'
    LBLOOM_PHOTO = 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png'
    cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (LBLOOM_EMAIL,))
    bot_row = cur.fetchone()
    if not bot_row:
        cur.execute(
            "INSERT INTO users (name, email, password_hash, photo_url, verified) VALUES ('Полутон', %s, 'system_no_login', %s, TRUE) RETURNING id",
            (LBLOOM_EMAIL, LBLOOM_PHOTO)
        )
        bot_row = cur.fetchone()
    if not bot_row or bot_row[0] == user_id:
        return
    bot_id = bot_row[0]
    cur.execute(
        "SELECT id FROM matches WHERE (user1_id = %s AND user2_id = %s) OR (user1_id = %s AND user2_id = %s) LIMIT 1",
        (bot_id, user_id, user_id, bot_id)
    )
    match_row = cur.fetchone()
    if not match_row:
        cur.execute(
            "INSERT INTO matches (user1_id, user2_id) VALUES (%s, %s) RETURNING id",
            (bot_id, user_id)
        )
        match_row = cur.fetchone()
    if match_row:
        cur.execute(
            "INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s)",
            (match_row[0], bot_id, sys_text)
        )


def _create_boost_from_metadata(cur, payment_id: str, metadata: dict, amount: float) -> None:
    """Создаёт буст профиля после успешной оплаты и отправляет уведомление в чат."""
    if not metadata or metadata.get('kind') != 'boost':
        return

    boost_type = metadata.get('boost_type') or 'promote'
    sender_token = metadata.get('sender_token') or ''
    user_id = None
    if sender_token:
        cur.execute("SELECT user_id FROM sessions WHERE token = %s LIMIT 1", (sender_token,))
        row = cur.fetchone()
        if row:
            user_id = row[0]
    if not user_id:
        user_id = _int(metadata.get('user_id'))
    if not user_id:
        return

    cur.execute("SELECT id FROM profile_boosts WHERE payment_id = %s LIMIT 1", (payment_id,))
    if cur.fetchone():
        return

    expires_at = datetime.datetime.now() + datetime.timedelta(hours=1)
    expires_str = expires_at.strftime('%d.%m.%Y %H:%M')

    cur.execute(
        "INSERT INTO profile_boosts (user_id, boost_type, payment_id, amount, expires_at) "
        "VALUES (%s, %s, %s, %s, %s)",
        (user_id, boost_type, payment_id, amount, expires_at)
    )

    sys_text = f"__BOOST__{boost_type}|{expires_str}"
    _send_bot_message(cur, user_id, sys_text)


def _handle_robokassa(event: dict) -> dict:
    """
    Обрабатывает Result URL от Robokassa (GET/POST с OutSum, InvId, SignatureValue).
    Проверяет подпись по Паролю #2 и начисляет покупку. В ответ Robokassa
    ждёт строку вида OK{InvId}.
    """
    params = dict(event.get('queryStringParameters') or {})
    raw_body = event.get('body') or ''
    if raw_body and not raw_body.strip().startswith('{'):
        for k, v in urllib.parse.parse_qsl(raw_body):
            params.setdefault(k, v)

    norm = {k.lower(): v for k, v in params.items()}
    out_sum = norm.get('outsum') or ''
    inv_id = norm.get('invid') or ''
    signature = (norm.get('signaturevalue') or '').lower()
    pass2 = os.environ.get('ROBOKASSA_PASSWORD_2') or ''

    if not out_sum or not inv_id or not signature or not pass2:
        return {'statusCode': 400, 'headers': {**HEADERS, 'Content-Type': 'text/plain'},
                'body': 'bad request', 'isBase64Encoded': False}

    shp = sorted([(k, v) for k, v in params.items() if k.lower().startswith('shp_')])
    shp_str = ''.join(f':{k}={v}' for k, v in shp)
    expected = hashlib.md5(f'{out_sum}:{inv_id}:{pass2}{shp_str}'.encode('utf-8')).hexdigest().lower()

    if signature != expected:
        return {'statusCode': 403, 'headers': {**HEADERS, 'Content-Type': 'text/plain'},
                'body': 'bad sign', 'isBase64Encoded': False}

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {'statusCode': 200, 'headers': {**HEADERS, 'Content-Type': 'text/plain'},
                'body': f'OK{inv_id}', 'isBase64Encoded': False}

    order_number = f'rk_{int(inv_id)}'
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
            "WHERE order_number = %s AND status <> 'paid' RETURNING metadata, amount",
            (order_number,)
        )
        row = cur.fetchone()
        if row:
            meta = row[0] or {}
            try:
                paid_amount = float(out_sum)
            except (TypeError, ValueError):
                paid_amount = float(row[1] or 0)

            _create_gift_from_metadata(cur, order_number, meta, paid_amount)
            _add_coins_from_metadata(cur, order_number, meta, paid_amount)
            _create_boost_from_metadata(cur, order_number, meta, paid_amount)
            _create_premium_from_metadata(cur, order_number, meta)
            _apply_promo_from_metadata(cur, meta, _int(meta.get('user_id')))
        conn.commit()
    except Exception:
        conn.rollback()
    finally:
        cur.close()
        conn.close()

    return {'statusCode': 200, 'headers': {**HEADERS, 'Content-Type': 'text/plain'},
            'body': f'OK{inv_id}', 'isBase64Encoded': False}


def handler(event: dict, context) -> dict:
    """
    Вебхук от ЮKassa — получает уведомление об успешной оплате и обновляет заказ.
    ЮKassa отправляет POST с JSON { type, event, object: { id, status, metadata, ... } }
    При успешной оплате подарка — создаёт запись в user_gifts.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': '', 'isBase64Encoded': False}

    # Robokassa шлёт InvId/SignatureValue в query или form-body
    _qs = {k.lower(): v for k, v in (event.get('queryStringParameters') or {}).items()}
    _raw = event.get('body') or ''
    if 'signaturevalue' not in _qs and _raw and not _raw.strip().startswith('{'):
        _qs.update({k.lower(): v for k, v in urllib.parse.parse_qsl(_raw)})
    if 'signaturevalue' in _qs and 'invid' in _qs:
        return _handle_robokassa(event)

    body = event.get('body', '{}') or '{}'
    try:
        data = json.loads(body)
    except (ValueError, TypeError):
        data = {}

    event_type = data.get('event', '')
    payment = data.get('object', {}) or {}
    payment_id = payment.get('id', '')
    status = payment.get('status', '')
    metadata = payment.get('metadata', {}) or {}

    try:
        amount_value = float((payment.get('amount') or {}).get('value') or 0)
    except (TypeError, ValueError):
        amount_value = 0.0

    if not payment_id:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Missing payment id'}),
            'isBase64Encoded': False
        }

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}

    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    try:
        if event_type == 'payment.succeeded' and status == 'succeeded':
            # ── Шаг 1. Проверка подлинности платежа напрямую у ЮKassa ──
            # Не доверяем телу вебхука: запрашиваем реальный статус по нашим
            # секретным ключам. Подделать этот ответ злоумышленник не может.
            verified = _verify_payment_with_yookassa(payment_id)
            has_creds = bool(os.environ.get('YOOKASSA_SHOP_ID') and os.environ.get('YOOKASSA_SECRET_KEY'))

            if has_creds:
                # Ключи есть — платёж ОБЯЗАН подтвердиться реальным API.
                if not verified or verified[0] != 'succeeded':
                    return {
                        'statusCode': 200, 'headers': HEADERS,
                        'body': json.dumps({'ok': False, 'error': 'payment not verified'}),
                        'isBase64Encoded': False
                    }
                v_status, v_amount, v_metadata = verified
            else:
                # Ключей нет (тестовое окружение) — работаем по данным из тела,
                # но начисляем ТОЛЬКО если заказ реально существует в нашей БД.
                v_status, v_amount, v_metadata = status, amount_value, metadata

            # ── Шаг 2. Заказ должен существовать в нашей БД и ещё не быть оплачен ──
            # Условие status <> 'paid' защищает от повторного начисления (replay).
            cur.execute(
                "UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
                "WHERE order_number = %s AND status <> 'paid' "
                "RETURNING metadata, amount",
                (payment_id,)
            )
            row = cur.fetchone()

            if not row:
                # Заказ не найден (подделка) или уже был обработан ранее —
                # никаких начислений не производим.
                conn.commit()
                return {
                    'statusCode': 200, 'headers': HEADERS,
                    'body': json.dumps({'ok': True, 'skipped': 'unknown or already processed order'}),
                    'isBase64Encoded': False
                }

            # ── Шаг 3. Используем ТОЛЬКО серверные данные заказа ──
            # metadata берём из БД (заполнена при создании платежа), сумму —
            # из подтверждённой ЮKassa (или из заказа как запасной вариант).
            db_metadata = row[0]
            db_amount = v_amount
            if not db_amount and row[1] is not None:
                try:
                    db_amount = float(row[1])
                except (TypeError, ValueError):
                    db_amount = 0.0

            effective_metadata = db_metadata if db_metadata else v_metadata

            _create_gift_from_metadata(cur, payment_id, effective_metadata, db_amount)
            _add_coins_from_metadata(cur, payment_id, effective_metadata, db_amount)
            _create_boost_from_metadata(cur, payment_id, effective_metadata, db_amount)
            _create_premium_from_metadata(cur, payment_id, effective_metadata)
            _apply_promo_from_metadata(cur, effective_metadata, _int(effective_metadata.get('user_id')))

        elif event_type == 'payment.canceled':
            cur.execute(
                "UPDATE orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP "
                "WHERE order_number = %s",
                (payment_id,)
            )

        conn.commit()
    except Exception as exc:
        conn.rollback()
        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({'ok': False, 'error': str(exc)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({'ok': True}),
        'isBase64Encoded': False
    }