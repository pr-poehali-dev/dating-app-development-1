CREATE TABLE IF NOT EXISTS t_p49767073_dating_app_developme.user_onesignal (
    user_id INTEGER PRIMARY KEY,
    onesignal_id TEXT,
    subscription_id TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_onesignal_sub ON t_p49767073_dating_app_developme.user_onesignal (subscription_id);