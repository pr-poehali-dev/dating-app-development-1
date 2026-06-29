-- Исправляем битую подпись поста
UPDATE t_p49767073_dating_app_developme.posts
SET caption = 'Новый день — новые возможности 🌅'
WHERE caption LIKE 'Новый день — новые возможности%';