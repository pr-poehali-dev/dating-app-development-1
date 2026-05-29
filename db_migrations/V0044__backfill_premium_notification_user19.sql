INSERT INTO notifications (user_id, type, from_user_id, text)
VALUES (19, 'premium_activated', NULL, '1 месяц|28.06.2026')
ON CONFLICT DO NOTHING;