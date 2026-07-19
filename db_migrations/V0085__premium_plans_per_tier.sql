-- Добавляем тариф (tier) к planам премиум-подписки, чтобы у Старт/Плюс/Золото были разные цены
ALTER TABLE premium_plans ADD COLUMN IF NOT EXISTS tier VARCHAR(10) NOT NULL DEFAULT 'plus';

-- Снимаем старое ограничение уникальности только по plan_key (теперь ключ уникален в паре с tier)
ALTER TABLE premium_plans DROP CONSTRAINT IF EXISTS premium_plans_plan_key_key;
ALTER TABLE premium_plans ADD CONSTRAINT premium_plans_tier_plan_key UNIQUE (tier, plan_key);

-- Существующие 3 строки (699/449/249) относятся к тарифу "plus" — они уже используются в проде
UPDATE premium_plans SET tier = 'plus' WHERE tier IS NULL OR tier = '';

-- Добавляем тариф Старт (дешевле) и Золото (дороже)
INSERT INTO premium_plans (plan_key, tier, label, price_per_month, total_amount, duration_months, popular, sort_order) VALUES
    ('1month',  'start', '1 месяц',    499.00, 499.00,  1,  false, 1),
    ('3month',  'start', '3 месяца',   349.00, 1047.00, 3,  true,  2),
    ('12month', 'start', '12 месяцев', 179.00, 2148.00, 12, false, 3),
    ('1month',  'gold',  '1 месяц',    999.00, 999.00,  1,  false, 1),
    ('3month',  'gold',  '3 месяца',   649.00, 1947.00, 3,  true,  2),
    ('12month', 'gold',  '12 месяцев', 349.00, 4188.00, 12, false, 3)
ON CONFLICT (tier, plan_key) DO NOTHING;
