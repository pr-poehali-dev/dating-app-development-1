ALTER TABLE t_p49767073_dating_app_developme.users
  ADD COLUMN IF NOT EXISTS height integer NULL,
  ADD COLUMN IF NOT EXISTS weight integer NULL,
  ADD COLUMN IF NOT EXISTS relationship_status varchar(30) NULL DEFAULT 'single';