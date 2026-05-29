CREATE TABLE IF NOT EXISTS premium_plans (
    id SERIAL PRIMARY KEY,
    plan_key VARCHAR(20) UNIQUE NOT NULL,
    label VARCHAR(50) NOT NULL,
    price_per_month DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    duration_months INTEGER NOT NULL,
    popular BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO premium_plans (plan_key, label, price_per_month, total_amount, duration_months, popular, sort_order) VALUES
    ('1month',  '1 месяц',     699.00, 699.00,  1,  false, 1),
    ('3month',  '3 месяца',    449.00, 1347.00, 3,  true,  2),
    ('12month', '12 месяцев',  249.00, 2988.00, 12, false, 3)
ON CONFLICT (plan_key) DO NOTHING;