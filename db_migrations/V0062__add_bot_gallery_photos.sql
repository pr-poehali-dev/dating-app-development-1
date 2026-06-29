-- Доп. фото в галерею для части ботов (несколько фото в профиле)
INSERT INTO t_p49767073_dating_app_developme.profile_photos (user_id, photo_url)
SELECT u.id, ph.url
FROM t_p49767073_dating_app_developme.users u
JOIN (
  VALUES
  ('bot_26@lovebloom.bot','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80'),
  ('bot_26@lovebloom.bot','https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80'),
  ('bot_27@lovebloom.bot','https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=600&q=80'),
  ('bot_27@lovebloom.bot','https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600&q=80'),
  ('bot_29@lovebloom.bot','https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80'),
  ('bot_29@lovebloom.bot','https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80'),
  ('bot_31@lovebloom.bot','https://images.unsplash.com/photo-1496360166961-10a51d5f367a?w=600&q=80'),
  ('bot_31@lovebloom.bot','https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=600&q=80'),
  ('bot_35@lovebloom.bot','https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&q=80'),
  ('bot_35@lovebloom.bot','https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80'),
  ('bot_41@lovebloom.bot','https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=600&q=80'),
  ('bot_41@lovebloom.bot','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80'),
  ('bot_49@lovebloom.bot','https://images.unsplash.com/photo-1554151228-14d9def656e4?w=600&q=80'),
  ('bot_49@lovebloom.bot','https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80'),
  ('bot_28@lovebloom.bot','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80'),
  ('bot_28@lovebloom.bot','https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80'),
  ('bot_38@lovebloom.bot','https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&q=80'),
  ('bot_38@lovebloom.bot','https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80'),
  ('bot_44@lovebloom.bot','https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&q=80'),
  ('bot_44@lovebloom.bot','https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80'),
  ('bot_54@lovebloom.bot','https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=600&q=80'),
  ('bot_54@lovebloom.bot','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80'),
  ('bot_61@lovebloom.bot','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80'),
  ('bot_61@lovebloom.bot','https://images.unsplash.com/photo-1502768040783-423da5fd5fa0?w=600&q=80'),
  ('bot_75@lovebloom.bot','https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600&q=80'),
  ('bot_75@lovebloom.bot','https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&q=80')
) AS ph(email, url) ON ph.email = u.email;