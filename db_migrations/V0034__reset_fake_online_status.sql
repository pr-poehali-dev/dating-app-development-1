-- Сбрасываем online у всех кроме тех, у кого активная сессия (последние 30 минут)
UPDATE t_p49767073_dating_app_developme.users
SET online = FALSE
WHERE id NOT IN (
  SELECT DISTINCT user_id FROM t_p49767073_dating_app_developme.sessions
  WHERE expires_at > NOW() AND created_at > NOW() - INTERVAL '30 minutes'
);
