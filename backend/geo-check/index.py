import json
import urllib.request

# Украина + 32 страны-члена НАТО (ISO 3166-1 alpha-2)
BLOCKED_COUNTRIES = {
    'UA',  # Украина
    # НАТО:
    'AL',  # Албания
    'BE',  # Бельгия
    'BG',  # Болгария
    'CA',  # Канада
    'HR',  # Хорватия
    'CZ',  # Чехия
    'DK',  # Дания
    'EE',  # Эстония
    'FI',  # Финляндия
    'FR',  # Франция
    'DE',  # Германия
    'GR',  # Греция
    'HU',  # Венгрия
    'IS',  # Исландия
    'IT',  # Италия
    'LV',  # Латвия
    'LT',  # Литва
    'LU',  # Люксембург
    'ME',  # Черногория
    'NL',  # Нидерланды
    'MK',  # Северная Македония
    'NO',  # Норвегия
    'PL',  # Польша
    'PT',  # Португалия
    'RO',  # Румыния
    'SK',  # Словакия
    'SI',  # Словения
    'ES',  # Испания
    'SE',  # Швеция
    'TR',  # Турция
    'GB',  # Великобритания
    'US',  # США
}

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def _client_ip(event: dict) -> str:
    headers = event.get('headers') or {}
    xff = headers.get('X-Forwarded-For') or headers.get('x-forwarded-for') or ''
    if xff:
        return xff.split(',')[0].strip()
    real = headers.get('X-Real-Ip') or headers.get('x-real-ip')
    if real:
        return real.strip()
    ident = (event.get('requestContext') or {}).get('identity') or {}
    return (ident.get('sourceIp') or '').strip()


def _lookup_country(ip: str) -> str:
    """Определяет ISO-код страны по IP через бесплатный ip-api.com. '' если не удалось."""
    if not ip:
        return ''
    try:
        url = f'http://ip-api.com/json/{ip}?fields=status,countryCode'
        req = urllib.request.Request(url, headers={'User-Agent': 'geo-check/1.0'})
        with urllib.request.urlopen(req, timeout=4) as r:
            data = json.loads(r.read().decode())
        if data.get('status') == 'success':
            return (data.get('countryCode') or '').upper()
    except Exception:
        return ''
    return ''


def handler(event: dict, context) -> dict:
    """Гео-проверка доступа: блокирует Украину и страны НАТО по IP-адресу посетителя."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    ip = _client_ip(event)
    country = _lookup_country(ip)
    blocked = country in BLOCKED_COUNTRIES

    return {
        'statusCode': 200,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps({
            'blocked': blocked,
            'country': country,
        }),
    }
