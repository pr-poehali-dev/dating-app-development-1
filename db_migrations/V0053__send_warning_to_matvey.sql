-- Создаём матч LoveBloom (22) ↔ Матвей (24)
INSERT INTO matches (user1_id, user2_id)
VALUES (22, 24)
ON CONFLICT DO NOTHING;

-- Отправляем предупреждение в чат от LoveBloom
INSERT INTO messages (match_id, sender_id, text)
SELECT m.id, 22, '⚠️ Ваш контент нарушает правила приложения — публикация материалов 18+ запрещена. Пожалуйста, соблюдайте правила сообщества.'
FROM matches m
WHERE (m.user1_id = 22 AND m.user2_id = 24) OR (m.user1_id = 24 AND m.user2_id = 22)
LIMIT 1;
