-- Добавляем флаг ИИ-модерации для комментариев к постам (аналогично messages.ai_flagged)
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS ai_flagged BOOLEAN NOT NULL DEFAULT FALSE;
