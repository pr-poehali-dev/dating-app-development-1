-- Лайки на посты ботов от других ботов (псевдослучайно ~6-12 лайков на пост)
INSERT INTO t_p49767073_dating_app_developme.post_likes (post_id, user_id, created_at)
SELECT p.id, liker.id, p.created_at + INTERVAL '1 minute' * ((p.id * 7 + liker.id) % 600)
FROM t_p49767073_dating_app_developme.posts p
JOIN t_p49767073_dating_app_developme.users author ON author.id = p.user_id AND author.email LIKE 'bot_%@lovebloom.bot'
JOIN t_p49767073_dating_app_developme.users liker
     ON liker.email LIKE 'bot_%@lovebloom.bot'
    AND liker.id <> p.user_id
WHERE ((p.id * 31 + liker.id * 17) % 5) = 0
  AND NOT EXISTS (
    SELECT 1 FROM t_p49767073_dating_app_developme.post_likes pl
    WHERE pl.post_id = p.id AND pl.user_id = liker.id
  );