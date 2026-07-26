INSERT INTO t_p49767073_dating_app_developme.user_gifts
  (sender_id, recipient_id, gift_id, gift_name, gift_emoji, gift_category, gift_variant, gift_rarity, amount, payment_id)
SELECT 1, 1, 1, 'Сердечко', '🩷', 'heart', 0, 'common', 49.00, '31f7d8f0-000f-5001-9000-1d9fe1c1f3b4'
WHERE NOT EXISTS (
  SELECT 1 FROM t_p49767073_dating_app_developme.user_gifts
  WHERE payment_id = '31f7d8f0-000f-5001-9000-1d9fe1c1f3b4'
);