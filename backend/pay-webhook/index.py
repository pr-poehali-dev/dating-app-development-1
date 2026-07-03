import json
import os
import datetime
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


def _create_gift_from_metadata(cur, payment_id: str, metadata: dict, amount: float) -> None:
    """Создаёт запись в user_gifts на основе metadata платежа."""
    if not metadata or metadata.get('kind') != 'gift':
        return

    recipient_id = _int(metadata.get('recipient_id'))
    gift_id = _int(metadata.get('gift_id'))
    if not recipient_id or not gift_id:
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


def _apply_promo_from_metadata(cur, metadata: dict, user_id: int) -> None:
    """Списывает промокод после успешной оплаты (если был передан)."""
    promo_id = metadata.get('promo_id')
    if not promo_id or not user_id:
        return
    try:
        promo_id = int(promo_id)
    except (TypeError, ValueError):
        return
    cur.execute(
        "SELECT id FROM promo_code_uses WHERE promo_code_id = %s AND user_id = %s LIMIT 1",
        (promo_id, user_id)
    )
    if cur.fetchone():
        return
    cur.execute(
        "INSERT INTO promo_code_uses (promo_code_id, user_id) VALUES (%s, %s)",
        (promo_id, user_id)
    )
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
        "UPDATE users SET premium = TRUE, premium_until = %s WHERE id = %s",
        (premium_until, user_id)
    )

    plan_labels = {'1month': '1 месяц', '3month': '3 месяца', '6month': '6 месяцев', '12month': '12 месяцев'}
    plan_label = plan_labels.get(plan, plan)
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
    LBLOOM_PHOTO = 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/38a015fd-cfd8-4bad-9fae-1106d60ea1d2.jpg'
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


def handler(event: dict, context) -> dict:
    """
    Вебхук от ЮKassa — получает уведомление об успешной оплате и обновляет заказ.
    ЮKassa отправляет POST с JSON { type, event, object: { id, status, metadata, ... } }
    При успешной оплате подарка — создаёт запись в user_gifts.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': '', 'isBase64Encoded': False}

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
            cur.execute(
                "UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
                "WHERE order_number = %s "
                "RETURNING metadata, amount",
                (payment_id,)
            )
            row = cur.fetchone()

            # Берём metadata в первую очередь из БД (она достовернее, заполнена при создании),
            # иначе — то, что прислала Yookassa в webhook.
            db_metadata = None
            db_amount = amount_value
            if row:
                db_metadata = row[0]
                if row[1] is not None:
                    try:
                        db_amount = float(row[1])
                    except (TypeError, ValueError):
                        pass

            effective_metadata = db_metadata if db_metadata else metadata

            _create_gift_from_metadata(cur, payment_id, effective_metadata, db_amount)
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