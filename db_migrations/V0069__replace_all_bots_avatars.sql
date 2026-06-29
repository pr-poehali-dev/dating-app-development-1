-- Замена аватаров всех ботов (старых и новых) на новые ИИ-портреты по полу
UPDATE t_p49767073_dating_app_developme.users u
SET photo_url = CASE
  WHEN u.gender = 'female' THEN (ARRAY[
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d7a443ad-ab2a-45fa-8098-a11cd1d80c08.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/04aaba62-7184-4565-adcf-db5f1d731004.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/224d2f9d-2fd6-450a-ad3b-470ffdd6b052.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/8690363e-d7b3-4941-a880-0faa8311415d.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/3d63914e-ba88-4b6c-8e3c-778b84a0c9b0.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c685f597-336f-441f-b08a-983d86f3aab0.jpg'
  ])[(u.id % 6) + 1]
  ELSE (ARRAY[
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d4d2f7da-93ed-4345-b46f-102bf9c8ffe9.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/64498a6f-b554-4a40-b6c4-9cb78f4c6af8.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/f849e669-1268-4e03-86f2-a23fa6ffd253.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/aedb3456-8259-42e3-bd41-17b2c78fb4e7.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/542986c6-473e-4990-80c4-c43df86b8cd7.jpg',
    'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/875123ad-b854-4686-86b2-37a0409af137.jpg'
  ])[(u.id % 6) + 1]
END
WHERE u.email LIKE 'bot_%@lovebloom.bot'
   OR u.email LIKE '%@test.com'
   OR u.email LIKE '%@test.ru';