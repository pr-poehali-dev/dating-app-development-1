UPDATE t_p49767073_dating_app_developme.users
SET username = 'user_' || id
WHERE username LIKE 'LoveBloom\_%'
  AND email <> 'system@lbloom.ru';