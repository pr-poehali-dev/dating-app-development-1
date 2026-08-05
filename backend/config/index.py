"""
Публичная конфигурация фронтенда: раздача публичных API-ключей и маркетинговых
баннеров (без авторизации).
"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def get_conn():
    return psycopg2.connect(
        os.environ['DATABASE_URL'],
        options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}"
    )

def resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False, default=str)}

def handler(event: dict, context) -> dict:
    """Отдаёт публичные ключи (Яндекс.Карты, OneSignal) и активные баннеры фронтенду. Без авторизации."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if action == 'yandex_maps_key':
        return resp(200, {'api_key': os.environ.get('YANDEX_MAPS_API_KEY', '')})

    if action == 'onesignal_app_id':
        return resp(200, {'app_id': os.environ.get('ONESIGNAL_APP_ID', '')})

    if action == 'active_banners':
        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT id, title, subtitle, color_from, color_to FROM admin_banners "
                "WHERE active = TRUE ORDER BY created_at DESC"
            )
            cols = ['id', 'title', 'subtitle', 'color_from', 'color_to']
            banners = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {'banners': banners})
        finally:
            conn.close()

    return resp(400, {'error': f'Неизвестное действие: {action}'})