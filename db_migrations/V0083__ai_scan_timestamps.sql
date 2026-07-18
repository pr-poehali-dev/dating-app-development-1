-- Метки времени проверки ИИ для ретроактивного сканирования существующего контента
ALTER TABLE profile_photos ADD COLUMN IF NOT EXISTS ai_checked_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_avatar_checked_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_cover_checked_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_cover_flagged BOOLEAN NOT NULL DEFAULT FALSE;
