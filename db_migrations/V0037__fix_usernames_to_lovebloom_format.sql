UPDATE t_p49767073_dating_app_developme.users
SET username = 'LoveBloom_' || id::text
WHERE username IS NULL
   OR username NOT LIKE 'LoveBloom_%';