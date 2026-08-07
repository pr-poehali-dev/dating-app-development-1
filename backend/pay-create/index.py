import json
import os
import uuid
import random
import hashlib
import psycopg2
import urllib.request
import urllib.parse
import base64
import datetime


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

    body = event.get('body', '{}') or '{}'
    data = json.loads(body)

    provider = (data.get('provider') or 'yookassa').strip().lower()
    if provider not in ('yookassa', 'robokassa'):
        provider = 'yookassa'

    shop_id = os.environ.get('YOOKASSA_SHOP_ID')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
    rk_login = os.environ.get('ROBOKASSA_MERCHANT_LOGIN')
    rk_pass1 = os.environ.get('ROBOKASSA_PASSWORD_1')

    if provider == 'robokassa' and (not rk_login or not rk_pass1):
        return {
            'statusCode': 500,
            'headers': HEADERS_CORS,
            'body': json.dumps({'error': 'Robokassa не настроена'}),
            'isBase64Encoded': False
        }

    if provider == 'yookassa' and (not shop_id or not secret_key):
        return {
            'statusCode': 500,
            'headers': HEADERS_CORS,
            'body': json.dumps({'error': 'Payment not configured'}),
            'isBase64Encoded': False
        }

    amount = data.get('amount')
    description = data.get('description', 'Оплата')
    user_email = data.get('user_email', '')
    return_url = data.get('return_url', '')
    metadata = data.get('metadata', {})
    promo_code = (metadata.get('promo_code') or '').strip().upper()

    if not amount or not return_url:
        return {
            'statusCode': 400,
            'headers': HEADERS_CORS,
            'body': json.dumps({'error': 'amount and return_url are required'}),
            'isBase64Encoded': False
        }

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return {
            'statusCode': 400,
            'headers': HEADERS_CORS,
            'body': json.dumps({'error': 'Некорректная сумма платежа'}),
            'isBase64Encoded': False
        }

    if amount < 10:
        return {
            'statusCode': 400,
            'headers': HEADERS_CORS,
            'body': json.dumps({'error': 'Минимальная сумма платежа — 10 ₽'}),
            'isBase64Encoded': False
        }

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    # ── Rate-limit создания платежей: не более 30 запросов с одного IP за
    #    10 минут (защита от флуда и перебора). ──
    client_ip = (event.get('requestContext') or {}).get('identity', {}).get('sourceIp', 'unknown')
    _rl_dsn = os.environ.get('DATABASE_URL')
    if _rl_dsn:
        try:
            _rc = psycopg2.connect(_rl_dsn, options=f"-c search_path={schema}")
            _rcur = _rc.cursor()
            _rcur.execute(
                "SELECT COUNT(*) FROM auth_attempts WHERE ip = %s AND action = 'pay_create' "
                "AND created_at > NOW() - INTERVAL '10 minutes'",
                (client_ip,)
            )
            _too_many = _rcur.fetchone()[0] >= 30
            _rcur.execute(
                "INSERT INTO auth_attempts (ip, action, success) VALUES (%s, 'pay_create', TRUE)",
                (client_ip,)
            )
            # Периодическая автоочистка старых записей журнала попыток
            if random.randint(0, 49) == 0:
                _rcur.execute("DELETE FROM auth_attempts WHERE created_at < NOW() - INTERVAL '24 hours'")
            _rc.commit()
            _rc.close()
            if _too_many:
                return {
                    'statusCode': 429,
                    'headers': HEADERS_CORS,
                    'body': json.dumps({'error': 'Слишком много запросов. Повторите позже.'}),
                    'isBase64Encoded': False
                }
        except Exception:
            pass

    # Проверяем промокод и пересчитываем сумму на сервере
    if promo_code:
        dsn_check = os.environ.get('DATABASE_URL')
        if dsn_check:
            conn_check = psycopg2.connect(dsn_check, options=f"-c search_path={schema}")
            cur_check = conn_check.cursor()
            cur_check.execute(
                "SELECT id, discount_percent, max_uses, used_count, expires_at, active "
                "FROM promo_codes WHERE code = %s", (promo_code,)
            )
            promo_row = cur_check.fetchone()
            user_id_int = int(metadata.get('user_id', 0) or 0)
            promo_valid = False
            promo_discount = 0
            promo_id_val = None
            if promo_row:
                p_id, p_disc, p_max, p_used, p_exp, p_active = promo_row
                now_utc = datetime.datetime.now(datetime.timezone.utc)
                expired = p_exp and p_exp.tzinfo and now_utc > p_exp
                if p_active and not expired and p_used < p_max:
                    if user_id_int:
                        cur_check.execute(
                            "SELECT id FROM promo_code_uses WHERE promo_code_id = %s AND user_id = %s",
                            (p_id, user_id_int)
                        )
                        already_used = cur_check.fetchone()
                    else:
                        already_used = None
                    if not already_used:
                        promo_valid = True
                        promo_discount = p_disc
                        promo_id_val = p_id
            conn_check.close()
            if not promo_valid:
                return {
                    'statusCode': 400,
                    'headers': HEADERS_CORS,
                    'body': json.dumps({'error': 'Промокод недействителен или уже использован'}),
                    'isBase64Encoded': False
                }
            # Применяем скидку
            amount = round(float(amount) * (1 - promo_discount / 100), 2)
            metadata['promo_id'] = promo_id_val
            metadata['promo_discount'] = promo_discount
            if amount < 10:
                amount = 10.0

    # ── Robokassa: формируем ссылку на оплату по номеру счёта ──
    if provider == 'robokassa':
        dsn_rk = os.environ.get('DATABASE_URL')
        if not dsn_rk:
            return {
                'statusCode': 500,
                'headers': HEADERS_CORS,
                'body': json.dumps({'error': 'DB not configured'}),
                'isBase64Encoded': False
            }
        conn_rk = psycopg2.connect(dsn_rk, options=f"-c search_path={schema}")
        cur_rk = conn_rk.cursor()
        cur_rk.execute("SELECT nextval('robokassa_inv_seq')")
        inv_id = int(cur_rk.fetchone()[0])

        out_sum = f'{float(amount):.2f}'
        receipt_json = json.dumps({
            'sno': 'usn_income',
            'items': [{
                'name': description[:128],
                'quantity': 1,
                'sum': float(out_sum),
                'payment_method': 'full_payment',
                'payment_object': 'service',
                'tax': 'none'
            }]
        }, ensure_ascii=False)
        receipt_enc = urllib.parse.quote(receipt_json, safe='')

        # Подпись: MerchantLogin:OutSum:InvId:Receipt:Password1:Shp_...
        sign_src = f'{rk_login}:{out_sum}:{inv_id}:{receipt_enc}:{rk_pass1}:Shp_order={inv_id}'
        signature = hashlib.md5(sign_src.encode('utf-8')).hexdigest()

        params = {
            'MerchantLogin': rk_login,
            'OutSum': out_sum,
            'InvId': str(inv_id),
            'Description': description[:100],
            'Receipt': receipt_json,
            'SignatureValue': signature,
            'Shp_order': str(inv_id),
            'Culture': 'ru',
            'Encoding': 'utf-8',
        }
        if user_email:
            params['Email'] = user_email
        if os.environ.get('ROBOKASSA_TEST_MODE') == '1':
            params['IsTest'] = '1'

        payment_url = 'https://auth.robokassa.ru/Merchant/Index.aspx?' + urllib.parse.urlencode(params)
        order_number = f'rk_{inv_id}'

        metadata['return_url'] = return_url
        cur_rk.execute(
            "INSERT INTO orders (order_number, user_name, user_email, amount, status, payment_url, "
            "order_comment, metadata, provider, robokassa_inv_id) "
            "VALUES (%s, %s, %s, %s, 'pending', %s, %s, %s::jsonb, 'robokassa', %s) "
            "ON CONFLICT (order_number) DO UPDATE SET payment_url = EXCLUDED.payment_url, "
            "metadata = EXCLUDED.metadata",
            (
                order_number,
                metadata.get('user_name', 'Пользователь'),
                user_email,
                float(amount),
                payment_url,
                description,
                json.dumps(metadata),
                inv_id
            )
        )
        conn_rk.commit()
        cur_rk.close()
        conn_rk.close()

        return {
            'statusCode': 200,
            'headers': HEADERS_CORS,
            'body': json.dumps({
                'payment_id': order_number,
                'payment_url': payment_url,
                'status': 'pending',
                'provider': 'robokassa'
            }),
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
            "INSERT INTO orders (order_number, user_name, user_email, amount, status, payment_url, order_comment, metadata) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb) "
            "ON CONFLICT (order_number) DO UPDATE SET status = EXCLUDED.status, payment_url = EXCLUDED.payment_url, metadata = EXCLUDED.metadata",
            (
                payment_id,
                metadata.get('user_name', 'Пользователь'),
                user_email,
                float(amount),
                status,
                payment_url,
                description,
                json.dumps(metadata)
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