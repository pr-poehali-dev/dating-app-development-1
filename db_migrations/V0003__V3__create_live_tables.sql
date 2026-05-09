
CREATE TABLE IF NOT EXISTS live_streams (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  viewers_count INTEGER DEFAULT 0,
  hearts_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_messages (
  id SERIAL PRIMARY KEY,
  stream_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
