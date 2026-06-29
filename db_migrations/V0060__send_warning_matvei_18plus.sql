-- Предупреждение 18+ пользователю @matvei (id 24) от бота LoveBloom (id 22)
WITH new_match AS (
  INSERT INTO t_p49767073_dating_app_developme.matches (user1_id, user2_id)
  VALUES (22, 24)
  RETURNING id
)
INSERT INTO t_p49767073_dating_app_developme.messages (match_id, sender_id, text)
SELECT id, 22, '⚠️ Предупреждение от модерации LoveBloom

Контент 18+ запрещён в приложении. Пожалуйста, удалите материалы, нарушающие правила. При повторном нарушении аккаунт будет заблокирован.'
FROM new_match;

INSERT INTO t_p49767073_dating_app_developme.notifications (user_id, type, from_user_id, read, text)
VALUES (24, 'admin_warning', NULL, FALSE, '⚠️ Предупреждение: контент 18+ запрещён. Удалите нарушающие материалы во избежание блокировки.');