ALTER TABLE t_p49767073_dating_app_developme.live_messages
  ADD COLUMN IF NOT EXISTS author_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS author_photo TEXT;