"""
Лёгкая проверка имени на рекламу для регистрации.
Быстрый регэксп + опциональный ИИ (RouterAI) для замаскированных случаев.
"""
import json
import os
import re
import urllib.request

ROUTERAI_URL = 'https://routerai.ru/api/v1/chat/completions'
MODEL = 'openai/gpt-4o-mini'

_AD_NAME_PATTERNS = [
    re.compile(r'https?://', re.I),
    re.compile(r'\b[\w.-]+\.(ru|com|net|org|io|shop|store|online|site|club|xyz|рф|biz|info|me|app)\b', re.I),
    re.compile(r'(?<!\w)@[\w]{3,}', re.I),
    re.compile(r't\.me/|telegram|телеграм|вотсап|whatsapp|вайбер|viber', re.I),
    re.compile(r'\+?\d[\d\-\s()]{8,}\d'),
    re.compile(r'скидк|распродаж|акци|промокод|куп[ио]|заказ|доставк|casino|казино|ставк|букмекер|зараб|подписыв|подпишись|реклам', re.I),
]


def looks_like_ad_name(name: str) -> bool:
    if not name:
        return False
    for p in _AD_NAME_PATTERNS:
        if p.search(name):
            return True
    return False


def moderate_name(name: str) -> dict:
    """Возвращает {'is_ad': bool, 'reason': str}."""
    name = (name or '').strip()
    if not name:
        return {'is_ad': False, 'reason': ''}
    if looks_like_ad_name(name):
        return {'is_ad': True, 'reason': 'Реклама в имени'}
    key = os.environ.get('ROUTERAI_API_KEY', '')
    if not key:
        return {'is_ad': False, 'reason': ''}
    try:
        prompt = (
            "Ты модератор имён в приложении знакомств. Имя должно быть настоящим именем или ником человека. "
            "Определи, является ли это имя РЕКЛАМОЙ: название бренда/компании/сайта/магазина, домен, ссылка, "
            "номер телефона, ник телеграм-канала, призыв (скидка/акция/заработок/казино). "
            'Верни СТРОГО JSON: {"is_ad": true/false, "reason": "краткая причина на русском"}. '
            "Обычные человеческие имена и ники (Иван, Katya, Alex_2000, Солнышко) — is_ad=false. "
            "Имя: " + name[:200]
        )
        payload = json.dumps({
            'model': MODEL,
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 120,
            'response_format': {'type': 'json_object'},
        }).encode()
        req = urllib.request.Request(ROUTERAI_URL, data=payload, method='POST', headers={
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode())
        parsed = json.loads(data['choices'][0]['message']['content'])
        return {'is_ad': bool(parsed.get('is_ad')), 'reason': parsed.get('reason', 'Реклама в имени') or 'Реклама в имени'}
    except Exception:
        return {'is_ad': False, 'reason': ''}
