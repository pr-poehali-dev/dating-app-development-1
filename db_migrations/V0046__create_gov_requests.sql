CREATE TABLE IF NOT EXISTS t_p49767073_dating_app_developme.gov_requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(100) NOT NULL,
  authority VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  user_id INTEGER,
  user_email VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  data_exported_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);