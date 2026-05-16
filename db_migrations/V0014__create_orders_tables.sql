CREATE TABLE IF NOT EXISTS t_p49767073_dating_app_developme.orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    robokassa_inv_id INTEGER UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    payment_url TEXT,
    plan VARCHAR(20) DEFAULT '1month',
    order_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p49767073_dating_app_developme.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES t_p49767073_dating_app_developme.orders(id),
    product_id VARCHAR(100),
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_robokassa_inv_id ON t_p49767073_dating_app_developme.orders(robokassa_inv_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON t_p49767073_dating_app_developme.orders(status);