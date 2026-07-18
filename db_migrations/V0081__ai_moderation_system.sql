-- AI-модерация: очередь проверок, флаги на контенте, доверие пользователей

CREATE TABLE IF NOT EXISTS ai_moderation_queue (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL,      -- 'message' | 'post' | 'profile_photo' | 'selfie' | 'bio'
    content_id INTEGER NULL,                -- id записи в исходной таблице (message id, post id, photo id...)
    user_id INTEGER NOT NULL,               -- автор контента
    text_snippet TEXT NULL,                 -- текст (если применимо)
    photo_url TEXT NULL,                    -- фото (если применимо)
    ai_verdict VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending' | 'safe' | 'suspicious' | 'violation'
    ai_score NUMERIC(5,2) NULL,             -- 0-100 степень уверенности в нарушении
    ai_categories TEXT NULL,                -- JSON список категорий нарушения (spam, abuse, nsfw, ...)
    ai_reason TEXT NULL,                    -- краткое объяснение от ИИ
    priority VARCHAR(10) NOT NULL DEFAULT 'low',  -- 'high' | 'medium' | 'low'
    status VARCHAR(20) NOT NULL DEFAULT 'queued', -- 'queued' | 'auto_resolved' | 'needs_review' | 'reviewed'
    action_taken VARCHAR(30) NULL,          -- 'auto_blocked' | 'auto_approved' | 'admin_approved' | 'admin_removed' | 'admin_banned'
    reviewed_by VARCHAR(20) NULL,           -- 'ai' | 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_queue_priority ON ai_moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_ai_queue_user ON ai_moderation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_queue_created ON ai_moderation_queue(created_at DESC);

-- Настройки AI-модерации (пороги чувствительности, вкл/выкл по типам)
CREATE TABLE IF NOT EXISTS ai_moderation_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO ai_moderation_settings (key, value) VALUES
    ('text_moderation_enabled', 'true'),
    ('photo_moderation_enabled', 'true'),
    ('selfie_verification_enabled', 'true'),
    ('auto_block_threshold', '85'),
    ('review_threshold', '40')
ON CONFLICT (key) DO NOTHING;

-- Флаги AI на исходном контенте (для быстрой фильтрации без JOIN очереди)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_flagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_flagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS ai_verdict VARCHAR(20) NULL;
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS ai_reason TEXT NULL;
ALTER TABLE profile_photos ADD COLUMN IF NOT EXISTS ai_flagged BOOLEAN NOT NULL DEFAULT FALSE;

-- Счётчик нарушений пользователя (для приоритизации повторных нарушителей)
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_violation_count INTEGER NOT NULL DEFAULT 0;
