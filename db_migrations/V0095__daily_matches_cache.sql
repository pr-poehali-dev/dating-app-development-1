-- Кэш «Знакомства дня»: подобранные кандидаты на каждый день
CREATE TABLE IF NOT EXISTS daily_matches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    match_date DATE NOT NULL DEFAULT CURRENT_DATE,
    candidate_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    reason VARCHAR(200),
    seen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, match_date, candidate_id)
);
CREATE INDEX IF NOT EXISTS idx_daily_matches_user_date ON daily_matches(user_id, match_date);