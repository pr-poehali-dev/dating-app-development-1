CREATE TABLE IF NOT EXISTS webrtc_signals (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL,
  from_user_id INTEGER NOT NULL,
  signal_type VARCHAR(20) NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_consumed BOOLEAN NOT NULL DEFAULT FALSE
);