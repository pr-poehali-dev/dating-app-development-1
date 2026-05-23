ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB;
CREATE INDEX IF NOT EXISTS idx_user_gifts_recipient ON user_gifts (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_gifts_payment_id ON user_gifts (payment_id);