-- Создаём системного пользователя LoveBloom если его нет
INSERT INTO t_p49767073_dating_app_developme.users (name, email, password_hash, photo_url, verified)
VALUES ('LoveBloom', 'system@lbloom.ru', 'system_no_login',
        'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/9a554cba-69a8-400b-aa59-3cdbaf1dc299.jpg',
        TRUE)
ON CONFLICT (email) DO NOTHING;

-- Создаём матч Богдана (id=1) с ботом LoveBloom если его нет
WITH bot AS (SELECT id FROM t_p49767073_dating_app_developme.users WHERE email = 'system@lbloom.ru' LIMIT 1)
INSERT INTO t_p49767073_dating_app_developme.matches (user1_id, user2_id)
SELECT bot.id, 1 FROM bot
WHERE NOT EXISTS (
    SELECT 1 FROM t_p49767073_dating_app_developme.matches m, bot
    WHERE (m.user1_id = bot.id AND m.user2_id = 1)
       OR (m.user1_id = 1 AND m.user2_id = bot.id)
);

-- Отправляем тестовое Premium-сообщение от LoveBloom в этот матч
WITH bot AS (SELECT id FROM t_p49767073_dating_app_developme.users WHERE email = 'system@lbloom.ru' LIMIT 1),
     sys_match AS (
         SELECT m.id FROM t_p49767073_dating_app_developme.matches m, bot
         WHERE (m.user1_id = bot.id AND m.user2_id = 1)
            OR (m.user1_id = 1 AND m.user2_id = bot.id)
         LIMIT 1
     )
INSERT INTO t_p49767073_dating_app_developme.messages (match_id, sender_id, text)
SELECT sys_match.id, bot.id, '__PREMIUM__1 месяц|24.07.2026'
FROM sys_match, bot;