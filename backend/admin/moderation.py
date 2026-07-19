"""
Хелпер AI-модерации через RouterAI (OpenAI-совместимый API, routerai.ru).
Используется админкой для ручной перепроверки контента и теста подключения.
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
    if not key:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'error': 'ROUTERAI_API_KEY не задан'}
    if not text:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'error': None}
    try:
        prompt = (
            "Ты строгий модератор текста для приложения знакомств. Проанализируй сообщение и верни СТРОГО JSON без пояснений: "
            '{"spam": true/false, "abuse": true/false, "sexual": true/false, "scam": true/false, "score": 0-100, "reason": "краткая причина на русском"}. '
            "abuse = true, если в тексте есть мат, ругательства, нецензурная брань, оскорбления, унижения, "
            "гомофобные/расистские/сексистские оскорбления или слова агрессии, прямо направленные на человека "
            "(например «пошёл на***», «пид*р», «дебил», «сдохни» и любые подобные грубые/бранные выражения — "
            "даже одно короткое ругательство ИЛИ прямое оскорбление уже считается нарушением). "
            "score — степень уверенности что текст нарушает правила (0 = точно норм, 100 = точное нарушение). "
            "Любой мат или прямое оскорбление человека — это МИНИМУМ score 70, а грубая брань/угроза — score 90+. "
            "Сообщение: " + text[:2000]
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
        return {'flagged': score >= 40, 'score': round(score, 1), 'categories': cats, 'reason': parsed.get('reason', ''), 'error': None}
    except Exception as e:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'error': str(e)}


def moderate_photo(image_url: str, purpose: str = 'general') -> dict:
    key = _api_key()
    if not key:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'reason': '', 'has_face': True, 'error': 'ROUTERAI_API_KEY не задан'}
    if not image_url:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'reason': '', 'has_face': True, 'error': None}
    try:
        prompt = (
            "Ты модератор фото для приложения знакомств. Проанализируй изображение и верни СТРОГО JSON без пояснений: "
            '{"nsfw": true/false, "has_face": true/false, "violence": true/false, "score": 0-100, "reason": "краткая причина на русском"}. '
            "score — это степень уверенности что фото нарушает правила (0 = точно норм, 100 = точно нарушение)."
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