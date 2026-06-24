-- Rate limiting: попытки входа по IP
CREATE TABLE IF NOT EXISTS t_p49767073_dating_app_developme.auth_attempts (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(64) NOT NULL,
  action VARCHAR(32) NOT NULL DEFAULT 'login',
  success BOOLEAN NOT NULL DEFAULT FALSE,
  email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_created ON t_p49767073_dating_app_developme.auth_attempts(ip, created_at);

-- Audit log: журнал событий безопасности
CREATE TABLE IF NOT EXISTS t_p49767073_dating_app_developme.security_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'info',
  ip VARCHAR(64),
  user_id INTEGER,
  email VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON t_p49767073_dating_app_developme.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON t_p49767073_dating_app_developme.security_events(ip, created_at);