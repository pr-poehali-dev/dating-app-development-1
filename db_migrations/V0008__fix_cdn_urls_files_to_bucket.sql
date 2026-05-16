UPDATE posts SET photo_url = REPLACE(photo_url, '/files/posts/', '/bucket/posts/') WHERE photo_url LIKE '%/files/posts/%';
UPDATE users SET photo_url = REPLACE(photo_url, '/files/', '/bucket/') WHERE photo_url LIKE '%cdn.poehali.dev%/files/%';
