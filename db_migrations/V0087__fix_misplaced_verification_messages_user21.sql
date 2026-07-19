-- Исправление исторического бага: системные сообщения о верификации попали в чат
-- между обычными пользователями (match 15: user 18 <-> user 21) от имени самого
-- user_21. Переносим их в личный чат бота «Полутон» (id 22) с user_21.

-- 1. Создаём личный чат бота с user_21, если его ещё нет
INSERT INTO matches (user1_id, user2_id)
SELECT 22, 21
WHERE NOT EXISTS (
  SELECT 1 FROM matches
  WHERE (user1_id = 22 AND user2_id = 21) OR (user1_id = 21 AND user2_id = 22)
);

-- 2. Перепривязываем баговые системные сообщения к чату с ботом и делаем отправителем бота
UPDATE messages
SET sender_id = 22,
    match_id = (
      SELECT id FROM matches
      WHERE (user1_id = 22 AND user2_id = 21) OR (user1_id = 21 AND user2_id = 22)
      LIMIT 1
    )
WHERE id IN (126, 236);
