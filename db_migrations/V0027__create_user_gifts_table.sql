CREATE TABLE user_gifts (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER,
    recipient_id INTEGER NOT NULL,
    gift_id INTEGER NOT NULL,
    gift_name VARCHAR(255) NOT NULL,
    gift_emoji VARCHAR(10) NOT NULL DEFAULT '🎁',
    gift_category VARCHAR(50) NOT NULL DEFAULT 'heart',
    gift_variant INTEGER NOT NULL DEFAULT 0,
    gift_rarity VARCHAR(20) NOT NULL DEFAULT 'common',
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_gifts_recipient ON user_gifts(recipient_id);
CREATE INDEX idx_user_gifts_sender ON user_gifts(sender_id);
