-- Возраст всех ботов в диапазоне 18-24
UPDATE t_p49767073_dating_app_developme.users
SET age = 18 + (id % 7)
WHERE email LIKE 'bot_%@lovebloom.bot'
   OR email LIKE '%@test.com'
   OR email LIKE '%@test.ru';