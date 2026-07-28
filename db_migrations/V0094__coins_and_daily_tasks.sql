-- Баланс монет пользователя
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- История транзакций монет (начисления/траты)
CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,               -- + начисление, - трата
    reason VARCHAR(64) NOT NULL,           -- daily_checkin, task_like, task_message, spend_boost и т.д.
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON coin_transactions(user_id, created_at DESC);

-- Прогресс ежедневных заданий: одна строка на пользователя+задание+дату
CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_key VARCHAR(48) NOT NULL,         -- checkin, send_likes, send_message, view_profiles, open_daily_match
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    progress INTEGER DEFAULT 0,
    goal INTEGER NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,         -- награда выдана
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, task_key, task_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);