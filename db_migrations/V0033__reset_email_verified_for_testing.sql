-- Сброс подтверждения почты для пользователя 1 (для тестирования)
UPDATE t_p49767073_dating_app_developme.email_codes
SET used = FALSE
WHERE user_id = 1;
