"""
Публичная конфигурация фронтенда: раздача публичных API-ключей (без авторизации).
"""
import json
import os

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    """Отдаёт публичные ключи (Яндекс.Карты, OneSignal) фронтенду. Без авторизации."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if action == 'yandex_maps_key':
        return resp(200, {'api_key': os.environ.get('YANDEX_MAPS_API_KEY', '')})

    if action == 'onesignal_app_id':
        return resp(200, {'app_id': os.environ.get('ONESIGNAL_APP_ID', '')})

    return resp(400, {'error': f'Неизвестное действие: {action}'})