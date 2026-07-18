"""
Хелпер AI-модерации через RouterAI (OpenAI-совместимый API, routerai.ru).
Фото анализируется через chat.completions с image_url (Vision), текст — та же модель с JSON-ответом.
Запись результатов в очередь ai_moderation_queue.
"""
import json
import os
import urllib.request

ROUTERAI_URL = 'https://routerai.ru/api/v1/chat/completions'
MODEL = 'openai/gpt-4o-mini'


def _api_key():
    return os.environ.get('ROUTERAI_API_KEY', '')


def get_setting(cur, key: str, default: str = '') -> str:
    try:
        cur.execute("SELECT value FROM ai_moderation_settings WHERE key = %s", (key,))
        row = cur.fetchone()
        return row[0] if row else default
    except Exception:
        return default


def moderate_text(text: str) -> dict:
    key = _api_key()
    if not key or not text:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'error': None}
    try:
        prompt = (
            "Ты модератор текста для приложения знакомств. Проанализируй сообщение и верни СТРОГО JSON без пояснений: "
            '{"spam": true/false, "abuse": true/false, "sexual": true/false, "scam": true/false, "score": 0-100, "reason": "краткая причина на русском"}. '
            "score — степень уверенности что текст нарушает правила (0 = точно норм, 100 = точное нарушение). Сообщение: " + text[:2000]
        )
        payload = json.dumps({
            'model': MODEL,
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 200,
            'response_format': {'type': 'json_object'},
        }).encode()
        req = urllib.request.Request(ROUTERAI_URL, data=payload, method='POST', headers={
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode())
        content = data['choices'][0]['message']['content']
        parsed = json.loads(content)
        score = float(parsed.get('score', 0))
        cats = [c for c in ('spam', 'abuse', 'sexual', 'scam') if parsed.get(c)]
        return {'flagged': score >= 40, 'score': round(score, 1), 'categories': cats, 'error': None}
    except Exception as e:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'error': str(e)}


def moderate_photo(image_url: str, purpose: str = 'general') -> dict:
    """
    Анализирует фото через RouterAI Vision (gpt-4o-mini).
    purpose: 'general' (пост/галерея) | 'selfie' (верификация)
    Возвращает {flagged, score(0-100), categories, reason, has_face, error}.
    """
    key = _api_key()
    if not key or not image_url:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'reason': '', 'has_face': True, 'error': None}
    try:
        prompt = (
            "Ты модератор фото для приложения знакомств. Проанализируй изображение и верни СТРОГО JSON без пояснений: "
            '{"nsfw": true/false, "has_face": true/false, "violence": true/false, "score": 0-100, "reason": "краткая причина на русском"}. '
            "score — это степень уверенности что фото нарушает правила (0 = точно норм, 100 = точно нарушение: откровенный контент, насилие, шок-контент)."
        )
        payload = json.dumps({
            'model': MODEL,
            'messages': [{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': prompt},
                    {'type': 'image_url', 'image_url': {'url': image_url}},
                ],
            }],
            'max_tokens': 200,
            'response_format': {'type': 'json_object'},
        }).encode()
        req = urllib.request.Request(ROUTERAI_URL, data=payload, method='POST', headers={
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
        content = data['choices'][0]['message']['content']
        parsed = json.loads(content)
        score = float(parsed.get('score', 0))
        cats = []
        if parsed.get('nsfw'):
            cats.append('nsfw')
        if parsed.get('violence'):
            cats.append('violence')
        return {
            'flagged': score >= 40, 'score': score, 'categories': cats,
            'reason': parsed.get('reason', ''), 'has_face': bool(parsed.get('has_face', True)), 'error': None,
        }
    except Exception as e:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'reason': '', 'has_face': True, 'error': str(e)}


def compare_faces(selfie_url: str, profile_photo_url: str) -> dict:
    """Сверяет селфи с основным фото профиля через RouterAI Vision. Возвращает {match, confidence, reason}."""
    key = _api_key()
    if not key or not selfie_url or not profile_photo_url:
        return {'match': True, 'confidence': 0, 'reason': 'skip', 'error': None}
    try:
        prompt = (
            "Сравни два фото: первое — селфи для верификации, второе — фото профиля пользователя. "
            "Это один и тот же человек? Верни СТРОГО JSON: "
            '{"same_person": true/false, "confidence": 0-100, "reason": "краткое пояснение на русском"}'
        )
        payload = json.dumps({
            'model': MODEL,
            'messages': [{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': prompt},
                    {'type': 'image_url', 'image_url': {'url': selfie_url}},
                    {'type': 'image_url', 'image_url': {'url': profile_photo_url}},
                ],
            }],
            'max_tokens': 150,
            'response_format': {'type': 'json_object'},
        }).encode()
        req = urllib.request.Request(ROUTERAI_URL, data=payload, method='POST', headers={
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
        content = data['choices'][0]['message']['content']
        parsed = json.loads(content)
        return {
            'match': bool(parsed.get('same_person', True)),
            'confidence': float(parsed.get('confidence', 0)),
            'reason': parsed.get('reason', ''), 'error': None,
        }
    except Exception as e:
        return {'match': True, 'confidence': 0, 'reason': '', 'error': str(e)}


def score_to_priority(score: float) -> str:
    if score >= 80:
        return 'high'
    if score >= 40:
        return 'medium'
    return 'low'


def push_to_queue(cur, content_type: str, content_id, user_id: int, text_snippet: str = None,
                   photo_url: str = None, ai_verdict: str = 'pending', ai_score: float = None,
                   ai_categories: list = None, ai_reason: str = None, priority: str = 'low',
                   status: str = 'queued', action_taken: str = None, reviewed_by: str = None):
    cur.execute(
        "INSERT INTO ai_moderation_queue "
        "(content_type, content_id, user_id, text_snippet, photo_url, ai_verdict, ai_score, "
        "ai_categories, ai_reason, priority, status, action_taken, reviewed_by, reviewed_at) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, CASE WHEN %s IS NOT NULL THEN NOW() ELSE NULL END)",
        (content_type, content_id, user_id, text_snippet, photo_url, ai_verdict, ai_score,
         json.dumps(ai_categories or [], ensure_ascii=False), ai_reason, priority, status, action_taken, reviewed_by, reviewed_by)
    )
