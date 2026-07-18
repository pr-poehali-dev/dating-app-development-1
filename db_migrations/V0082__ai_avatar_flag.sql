-- Флаг ИИ-проверки для основного аватара пользователя (для ретроактивной массовой проверки)
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_avatar_flagged BOOLEAN NOT NULL DEFAULT FALSE;
