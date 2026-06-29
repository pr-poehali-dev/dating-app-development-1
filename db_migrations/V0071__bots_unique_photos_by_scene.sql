-- Уникальное фото каждому боту-девушке по порядку id
WITH female_bots AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM t_p49767073_dating_app_developme.users
  WHERE gender = 'female'
    AND (email LIKE 'bot_%@lovebloom.bot' OR email LIKE '%@test.com' OR email LIKE '%@test.ru')
),
female_photos(rn, url) AS (VALUES
  (1,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1b71734f-3024-48c8-8cd2-793feb0a86f5.jpg'),
  (2,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/34ecf387-f047-4195-946a-8a787efe17ca.jpg'),
  (3,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/82efa860-acbb-4ca6-9284-11bc4135d612.jpg'),
  (4,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/acde3bb7-df48-4898-aedc-b384278a7403.jpg'),
  (5,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a0457911-cac7-4093-957c-db2c21260b34.jpg'),
  (6,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4a3c688d-79a4-4e1a-be9f-b89bdc56cf40.jpg'),
  (7,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/7dd185ec-7565-4949-b268-da0f7095b560.jpg'),
  (8,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/48d0565d-3678-40a3-b3af-7434a92d908d.jpg'),
  (9,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/3c135eb5-f51c-413d-8a71-dd373e758ef2.jpg'),
  (10, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/eca35e19-628b-4fea-b7b8-e2aea586b526.jpg'),
  (11, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/541377d6-d1ce-4275-90cf-5d5291532266.jpg'),
  (12, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8c1b4c0b-7630-4c31-aa8c-0c460bee474f.jpg'),
  (13, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/be8e2b47-0cb9-44fb-bb31-fa2d5b22a796.jpg'),
  (14, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/44a0bbb1-44fe-4c15-9eab-2a35054cd88f.jpg'),
  (15, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a96dbebd-2a3e-444a-9915-c888d0cc2f50.jpg'),
  (16, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a7f1698c-e55c-478d-90da-7892820eb6f9.jpg'),
  (17, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d2834edb-159c-444f-910d-110f65f3de07.jpg'),
  (18, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/2ec78c36-c39d-4b60-acd7-e652d4759e30.jpg'),
  -- повтор для оставшихся 17 (35-18)
  (19, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1b71734f-3024-48c8-8cd2-793feb0a86f5.jpg'),
  (20, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/34ecf387-f047-4195-946a-8a787efe17ca.jpg'),
  (21, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/82efa860-acbb-4ca6-9284-11bc4135d612.jpg'),
  (22, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/acde3bb7-df48-4898-aedc-b384278a7403.jpg'),
  (23, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a0457911-cac7-4093-957c-db2c21260b34.jpg'),
  (24, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4a3c688d-79a4-4e1a-be9f-b89bdc56cf40.jpg'),
  (25, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/7dd185ec-7565-4949-b268-da0f7095b560.jpg'),
  (26, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/48d0565d-3678-40a3-b3af-7434a92d908d.jpg'),
  (27, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/3c135eb5-f51c-413d-8a71-dd373e758ef2.jpg'),
  (28, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/eca35e19-628b-4fea-b7b8-e2aea586b526.jpg'),
  (29, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/541377d6-d1ce-4275-90cf-5d5291532266.jpg'),
  (30, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8c1b4c0b-7630-4c31-aa8c-0c460bee474f.jpg'),
  (31, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/be8e2b47-0cb9-44fb-bb31-fa2d5b22a796.jpg'),
  (32, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/44a0bbb1-44fe-4c15-9eab-2a35054cd88f.jpg'),
  (33, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a96dbebd-2a3e-444a-9915-c888d0cc2f50.jpg'),
  (34, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a7f1698c-e55c-478d-90da-7892820eb6f9.jpg'),
  (35, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d2834edb-159c-444f-910d-110f65f3de07.jpg')
)
UPDATE t_p49767073_dating_app_developme.users u
SET photo_url = fp.url
FROM female_bots fb
JOIN female_photos fp ON fp.rn = fb.rn
WHERE u.id = fb.id;

-- Уникальное фото каждому боту-парню по порядку id
WITH male_bots AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM t_p49767073_dating_app_developme.users
  WHERE gender = 'male'
    AND (email LIKE 'bot_%@lovebloom.bot' OR email LIKE '%@test.com' OR email LIKE '%@test.ru')
),
male_photos(rn, url) AS (VALUES
  (1,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8ed1d5d0-70c3-4e32-9319-582c27573da6.jpg'),
  (2,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/86f9f5de-9ffe-4316-a1e3-7d35ae7fded0.jpg'),
  (3,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d778f602-e833-42db-888c-be744d5c09a5.jpg'),
  (4,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a1106892-bf20-4386-aa4d-a7072efa053a.jpg'),
  (5,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/9c22f0a3-0b61-4aae-aadd-39071d5a7b7d.jpg'),
  (6,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d4b81482-2b6f-48f2-95fc-cbd350c3c741.jpg'),
  (7,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8920f738-a5db-4862-906c-9d6e2847eb59.jpg'),
  (8,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/f218624d-7b2f-4f39-9074-2409ce5161a2.jpg'),
  (9,  'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c9aa53be-2f3a-4c29-9792-7b013a9cd928.jpg'),
  (10, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/2990c924-bd4a-4888-9394-05f7c16ca776.jpg'),
  (11, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ed7936e9-cf84-46bd-976c-35beb4605d9a.jpg'),
  (12, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4ff06226-c4c1-4736-a163-d8db8df93fa6.jpg'),
  (13, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ec880fce-e817-4550-9858-2c41213ccab3.jpg'),
  (14, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/afd899f9-d3e4-4d27-9756-09f0dec17723.jpg'),
  (15, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8a7201e6-304d-4928-850a-02c8b1d4779a.jpg'),
  -- повтор для оставшихся (30-15)
  (16, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8ed1d5d0-70c3-4e32-9319-582c27573da6.jpg'),
  (17, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/86f9f5de-9ffe-4316-a1e3-7d35ae7fded0.jpg'),
  (18, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d778f602-e833-42db-888c-be744d5c09a5.jpg'),
  (19, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a1106892-bf20-4386-aa4d-a7072efa053a.jpg'),
  (20, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/9c22f0a3-0b61-4aae-aadd-39071d5a7b7d.jpg'),
  (21, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d4b81482-2b6f-48f2-95fc-cbd350c3c741.jpg'),
  (22, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8920f738-a5db-4862-906c-9d6e2847eb59.jpg'),
  (23, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/f218624d-7b2f-4f39-9074-2409ce5161a2.jpg'),
  (24, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c9aa53be-2f3a-4c29-9792-7b013a9cd928.jpg'),
  (25, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/2990c924-bd4a-4888-9394-05f7c16ca776.jpg'),
  (26, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ed7936e9-cf84-46bd-976c-35beb4605d9a.jpg'),
  (27, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4ff06226-c4c1-4736-a163-d8db8df93fa6.jpg'),
  (28, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ec880fce-e817-4550-9858-2c41213ccab3.jpg'),
  (29, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/afd899f9-d3e4-4d27-9756-09f0dec17723.jpg'),
  (30, 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8a7201e6-304d-4928-850a-02c8b1d4779a.jpg')
)
UPDATE t_p49767073_dating_app_developme.users u
SET photo_url = mp.url
FROM male_bots mb
JOIN male_photos mp ON mp.rn = mb.rn
WHERE u.id = mb.id;

-- Обновляем фото постов на новый аватар автора
UPDATE t_p49767073_dating_app_developme.posts p
SET photo_url = u.photo_url
FROM t_p49767073_dating_app_developme.users u
WHERE p.user_id = u.id
  AND (u.email LIKE 'bot_%@lovebloom.bot' OR u.email LIKE '%@test.com' OR u.email LIKE '%@test.ru');