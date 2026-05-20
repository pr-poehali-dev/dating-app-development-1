import json
import os
import uuid
import hashlib
import psycopg2
import urllib.request
import urllib.parse
import base64
from datetime import datetime


HEADERS_CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Content-Type': 'application/json'
}


def handler(event: dict, context) -> dict:
    """
    Создаёт платёж через ЮKassa и возвращает ссылку на оплату.
    POST: { amount, description, user_email, return_url, metadata }
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS_CORS, 'body': '', 'isBase64Encoded': False}

    shop_id = os.environ.get('YOOKASSA_SHOP_ID')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY')

    if not shop_id or not secret_key:
        return {
            'statusCode': 500,
            'headers': HEADERS_CORS,
            'body': json.dumps({'error': 'Payment not configured'}),
            'isBase64Encoded': False
        }

    body = event.get('body', '{}') or '{}'
    data = json.loads(body)

    amount = data.get('amount')
    description = data.get('description', 'Оплата')
    user_email = data.get('user_email', '')
    return_url = data.get('return_url', '')
    metadata = data.get('metadata', {})

    if not amount or not return_url:
        return {
            'statusCode': 400,
            'headers': HEADERS_CORS,
            'body': json.dumps({'error': 'amount and return_url are required'}),
            'isBase64Encoded': False
        }

    idempotence_key = str(uuid.uuid4())

    payment_payload = {
        'amount': {
            'value': f'{float(amount):.2f}',
            'currency': 'RUB'
        },
        'confirmation': {
            'type': 'redirect',
            'return_url': return_url
        },
        'capture': True,
        'description': description,
        'metadata': metadata
    }

    if user_email:
        payment_payload['receipt'] = {
            'customer': {'email': user_email},
            'items': [{
                'description': description,
                'quantity': '1.00',
                'amount': {
                    'value': f'{float(amount):.2f}',
                    'currency': 'RUB'
                },
                'vat_code': '1',
                'payment_mode': 'full_payment',
                'payment_subject': 'service'
            }]
        }

    payload_bytes = json.dumps(payment_payload).encode('utf-8')
    credentials = base64.b64encode(f'{shop_id}:{secret_key}'.encode()).decode()

    req = urllib.request.Request(
        'https://api.yookassa.ru/v3/payments',
        data=payload_bytes,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Basic {credentials}',
            'Idempotence-Key': idempotence_key
        },
        method='POST'
    )

    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())

    payment_id = result['id']
    payment_url = result['confirmation']['confirmation_url']
    status = result['status']

    dsn = os.environ.get('DATABASE_URL')
    if dsn:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO orders (order_number, user_name, user_email, amount, status, payment_url, order_comment) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                payment_id,
                metadata.get('user_name', 'Пользователь'),
                user_email,
                float(amount),
                status,
                payment_url,
                description
            )
        )
        conn.commit()
        cur.close()
        conn.close()

    return {
        'statusCode': 200,
        'headers': HEADERS_CORS,
        'body': json.dumps({
            'payment_id': payment_id,
            'payment_url': payment_url,
            'status': status
        }),
        'isBase64Encoded': False
    }
