CREATE TABLE IF NOT EXISTS t_p49767073_dating_app_developme.profile_boosts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  boost_type VARCHAR(32) NOT NULL,
  payment_id VARCHAR(128),
  amount NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);