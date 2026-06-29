-- Сторисы от 5 ботов. expires_at = теперь + 24 часа, видео — публичные lifestyle-ролики
INSERT INTO t_p49767073_dating_app_developme.stories (user_id, video_url, thumbnail_url, duration, views, created_at, expires_at)
VALUES
  -- Алина 26 — утро в Москве (лайфстайл, кофе)
  (26,
   'https://assets.mixkit.co/videos/preview/mixkit-woman-drinking-a-cup-of-coffee-while-looking-at-the-sea-42565-large.mp4',
   'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/eca35e19-628b-4fea-b7b8-e2aea586b526.jpg',
   8, 0, NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours'),
  -- Максим 28 — спорт/природа
  (28,
   'https://assets.mixkit.co/videos/preview/mixkit-man-running-in-forest-trail-4808-large.mp4',
   'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8920f738-a5db-4862-906c-9d6e2847eb59.jpg',
   10, 0, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '23 hours'),
  -- Карина 29 — танцы/музыка
  (29,
   'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-happily-in-a-field-at-sunset-41376-large.mp4',
   'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8c1b4c0b-7630-4c31-aa8c-0c460bee474f.jpg',
   7, 0, NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '23 hours 30 minutes'),
  -- Денис 32 — море/Сочи
  (32,
   'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
   'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c9aa53be-2f3a-4c29-9792-7b013a9cd928.jpg',
   9, 0, NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '23 hours 45 minutes'),
  -- Ольга 35 — город/путешествие
  (35,
   'https://assets.mixkit.co/videos/preview/mixkit-woman-walking-in-the-city-4810-large.mp4',
   'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a96dbebd-2a3e-444a-9915-c888d0cc2f50.jpg',
   8, 0, NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '23 hours 55 minutes');