import json
import os
import psycopg2


HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}


def handler(event: dict, context) -> dict:
    """
    Вебхук от ЮKassa — получает уведомление об успешной оплате и обновляет заказ.
    ЮKassa отправляет POST с JSON { type, event, object: { id, status, ... } }
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': '', 'isBase64Encoded': False}

    body = event.get('body', '{}') or '{}'
    data = json.loads(body)

    event_type = data.get('event', '')
    payment = data.get('object', {})
    payment_id = payment.get('id', '')
    status = payment.get('status', '')

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

    if event_type == 'payment.succeeded' and status == 'succeeded':
        cur.execute(
            "UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
            "WHERE order_number = %s RETURNING id",
            (payment_id,)
        )
    elif event_type == 'payment.canceled':
        cur.execute(
            "UPDATE orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP "
            "WHERE order_number = %s",
            (payment_id,)
        )

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({'ok': True}),
        'isBase64Encoded': False
    }
