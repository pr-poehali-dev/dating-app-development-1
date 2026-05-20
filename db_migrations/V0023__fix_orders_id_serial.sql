CREATE SEQUENCE IF NOT EXISTS orders_id_seq START WITH 1 INCREMENT BY 1;
ALTER TABLE orders ALTER COLUMN id SET DEFAULT nextval('orders_id_seq');
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders WHERE id > 0), 0) + 1, false);