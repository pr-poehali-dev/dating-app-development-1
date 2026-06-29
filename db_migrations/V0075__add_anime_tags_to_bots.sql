-- Добавляем аниме-теги ботам для демонстрации в ленте поиска
UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 Demon Slayer')
WHERE id = 26 AND NOT ('🎌 Demon Slayer' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 Naruto')
WHERE id = 28 AND NOT ('🎌 Naruto' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 One Piece')
WHERE id = 29 AND NOT ('🎌 One Piece' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 Attack on Titan')
WHERE id = 32 AND NOT ('🎌 Attack on Titan' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 Jujutsu Kaisen')
WHERE id = 35 AND NOT ('🎌 Jujutsu Kaisen' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 My Hero Academia')
WHERE id = 30 AND NOT ('🎌 My Hero Academia' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 Аниме-фанат')
WHERE id = 33 AND NOT ('🎌 Аниме-фанат' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 Death Note')
WHERE id = 41 AND NOT ('🎌 Death Note' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 Chainsaw Man')
WHERE id = 44 AND NOT ('🎌 Chainsaw Man' = ANY(COALESCE(tags, ARRAY[]::text[])));

UPDATE t_p49767073_dating_app_developme.users
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), '🎌 Spy x Family')
WHERE id = 45 AND NOT ('🎌 Spy x Family' = ANY(COALESCE(tags, ARRAY[]::text[])));