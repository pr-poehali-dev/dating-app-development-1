-- Обновляем главные фото ботов на реалистичные ИИ-портреты (по полу, распределение по id)
UPDATE t_p49767073_dating_app_developme.users u
SET photo_url = CASE
  WHEN u.gender = 'female' THEN (ARRAY[
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/797facee-4aeb-4cc4-81fb-9f20947dffe5.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/28659216-7fd9-4d57-8719-ec810f28e8b3.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/166bbf78-385f-434b-b115-00e6239c0aeb.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/2ce236b1-9c52-4bc2-9f7d-2253cdeef17f.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/33e12270-9e85-4c22-af57-493877e8008b.jpg'
  ])[(u.id % 5) + 1]
  ELSE (ARRAY[
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a2a75612-f6f8-4624-a636-6c02a5a6a770.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4655d0fd-45c3-4b7d-9274-d02546c784b7.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/799ceb7b-a899-4eb8-a3d2-c3550eecf3e6.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ef8baf1b-45a7-491d-a1ee-c68c1dbc8f65.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/030f9818-b5de-483d-8d7b-4615b54a3e08.jpg'
  ])[(u.id % 5) + 1]
END
WHERE u.email LIKE 'bot_%@lovebloom.bot';

-- Обновляем галерейные фото на валидные ИИ-портреты (второе фото — другой ракурс)
UPDATE t_p49767073_dating_app_developme.profile_photos pp
SET photo_url = CASE
  WHEN u.gender = 'female' THEN (ARRAY[
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/166bbf78-385f-434b-b115-00e6239c0aeb.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/33e12270-9e85-4c22-af57-493877e8008b.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/2ce236b1-9c52-4bc2-9f7d-2253cdeef17f.jpg'
  ])[(pp.id % 3) + 1]
  ELSE (ARRAY[
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4655d0fd-45c3-4b7d-9274-d02546c784b7.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/799ceb7b-a899-4eb8-a3d2-c3550eecf3e6.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ef8baf1b-45a7-491d-a1ee-c68c1dbc8f65.jpg'
  ])[(pp.id % 3) + 1]
END
FROM t_p49767073_dating_app_developme.users u
WHERE pp.user_id = u.id AND u.email LIKE 'bot_%@lovebloom.bot';