CREATE SEQUENCE IF NOT EXISTS robokassa_inv_seq START 1000;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'yookassa';

CREATE INDEX IF NOT EXISTS idx_orders_provider ON orders(provider);