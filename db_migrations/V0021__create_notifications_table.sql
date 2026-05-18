CREATE TABLE IF NOT EXISTS t_p49767073_dating_app_developme.notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL,
  from_user_id INTEGER,
  ref_id INTEGER,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);