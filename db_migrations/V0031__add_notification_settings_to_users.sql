ALTER TABLE t_p49767073_dating_app_developme.users
  ADD COLUMN IF NOT EXISTS notif_matches boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_likes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_promo boolean NOT NULL DEFAULT false;
