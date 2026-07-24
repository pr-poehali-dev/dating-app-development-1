ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_login TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'app';