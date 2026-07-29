"""
Безопасная валидация загружаемых файлов.

Защищает от:
  - path traversal в ключе S3 (расширение берётся из белого списка, а не из
    пользовательского content_type, где могли быть символы «/», «..», «;»);
  - подмены типа файла (проверяем «магические байты» реального содержимого,
    а не доверяем присланному content_type);
  - слишком больших файлов (лимит размера по типу).

Использование:
    ok, ext, safe_ct, err = validate_upload(content_type, raw_bytes, 'image')
    if not ok:
        return resp(400, {'error': err})
    key = f"avatars/{user_id}/{uuid.uuid4()}.{ext}"
"""

# Белый список: сигнатура (magic bytes) -> (расширение, безопасный content_type)
_IMAGE_SIGS = [
    (b'\xff\xd8\xff',          'jpg',  'image/jpeg'),
    (b'\x89PNG\r\n\x1a\n',     'png',  'image/png'),
    (b'GIF87a',                'gif',  'image/gif'),
    (b'GIF89a',                'gif',  'image/gif'),
    (b'RIFF',                  'webp', 'image/webp'),   # webp: RIFF....WEBP
    (b'BM',                    'bmp',  'image/bmp'),
]

# Лимиты размера в байтах по типу
_LIMITS = {
    'image': 12 * 1024 * 1024,   # 12 МБ
    'audio': 20 * 1024 * 1024,   # 20 МБ
    'video': 60 * 1024 * 1024,   # 60 МБ
}

# Разрешённые расширения для аудио/видео (magic bytes для них ненадёжны из-за
# множества контейнеров, поэтому валидируем content_type по белому списку)
_AUDIO_TYPES = {
    'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/wav': 'wav',
    'audio/x-wav': 'wav', 'audio/mp3': 'mp3',
}
_VIDEO_TYPES = {
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
    'video/ogg': 'ogv',
}


def _detect_image(raw):
    for sig, ext, ct in _IMAGE_SIGS:
        if raw[:len(sig)] == sig:
            if ext == 'webp' and raw[8:12] != b'WEBP':
                continue
            return ext, ct
    return None, None


def validate_upload(content_type, raw_bytes, kind):
    """
    Возвращает (ok, ext, safe_content_type, error).
    kind: 'image' | 'audio' | 'video'.
    """
    if not raw_bytes:
        return False, None, None, 'Пустой файл'

    limit = _LIMITS.get(kind, 12 * 1024 * 1024)
    if len(raw_bytes) > limit:
        return False, None, None, f'Файл слишком большой (макс. {limit // (1024 * 1024)} МБ)'

    ct = (content_type or '').split(';')[0].strip().lower()

    if kind == 'image':
        ext, safe_ct = _detect_image(raw_bytes)
        if not ext:
            return False, None, None, 'Недопустимый формат изображения'
        return True, ext, safe_ct, None

    if kind == 'audio':
        ext = _AUDIO_TYPES.get(ct)
        if not ext:
            return False, None, None, 'Недопустимый формат аудио'
        return True, ext, ct, None

    if kind == 'video':
        ext = _VIDEO_TYPES.get(ct)
        if not ext:
            return False, None, None, 'Недопустимый формат видео'
        return True, ext, ct, None

    return False, None, None, 'Неизвестный тип загрузки'
