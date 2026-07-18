"""
Хелпер AI-модерации: проверка текста через OpenAI Moderation API,
запись результатов в очередь ai_moderation_queue.
"""
import json
import os
import urllib.request

OPENAI_URL = 'https://api.openai.com/v1/moderations'


def _openai_key():
    return os.environ.get('OPENAI_API_KEY', '')


def get_setting(cur, key: str, default: str = '') -> str:
    try:
        cur.execute("SELECT value FROM ai_moderation_settings WHERE key = %s", (key,))
        row = cur.fetchone()
        return row[0] if row else default
    except Exception:
        return default


def moderate_text(text: str) -> dict:
    """Проверяет текст через OpenAI Moderation API. Возвращает {flagged, score, categories, error}."""
    key = _openai_key()
    if not key or not text:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'error': None}
    try:
        payload = json.dumps({'model': 'omni-moderation-latest', 'input': text}).encode()
        req = urllib.request.Request(OPENAI_URL, data=payload, method='POST', headers={
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode())
        result = data['results'][0]
        cat_scores = result.get('category_scores', {})
        flagged_cats = [c for c, v in cat_scores.items() if v > 0.3]
        max_score = max(cat_scores.values()) if cat_scores else 0.0
        return {'flagged': bool(result.get('flagged')), 'score': round(max_score * 100, 1), 'categories': flagged_cats, 'error': None}
    except Exception as e:
        return {'flagged': False, 'score': 0.0, 'categories': [], 'error': str(e)}


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
