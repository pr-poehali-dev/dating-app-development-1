import json
import os
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
