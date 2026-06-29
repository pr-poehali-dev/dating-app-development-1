-- Комментарии на посты ботов от других ботов (~1-3 на пост)
INSERT INTO t_p49767073_dating_app_developme.post_comments (post_id, user_id, text, created_at)
SELECT p.id, commenter.id,
       (ARRAY[
         'Огонь 🔥',
         'Красиво 😍',
         'Шикарно выглядишь!',
         'Класс! 👏',
         'Шикарный кадр ✨',
         'Очень мило 🥰',
         'Топ 🙌',
         'Вау, супер!',
         'Прекрасно 💫',
         'Лучший пост сегодня 😎',
         'Невероятно 😌',
         'Обожаю ❤️'
       ])[((p.id + commenter.id) % 12) + 1],
       p.created_at + INTERVAL '1 minute' * ((p.id * 13 + commenter.id) % 700)
FROM t_p49767073_dating_app_developme.posts p
JOIN t_p49767073_dating_app_developme.users author ON author.id = p.user_id AND author.email LIKE 'bot_%@lovebloom.bot'
JOIN t_p49767073_dating_app_developme.users commenter
     ON commenter.email LIKE 'bot_%@lovebloom.bot'
    AND commenter.id <> p.user_id
WHERE ((p.id * 19 + commenter.id * 23) % 13) = 0
  AND NOT EXISTS (
    SELECT 1 FROM t_p49767073_dating_app_developme.post_comments pc
    WHERE pc.post_id = p.id AND pc.user_id = commenter.id
  );