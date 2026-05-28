
CREATE TABLE IF NOT EXISTS live_streams (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  viewers_count INTEGER NOT NULL DEFAULT 0,
  hearts_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS live_viewers (
  stream_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (stream_id, user_id)
);

CREATE TABLE IF NOT EXISTS live_messages (
  id SERIAL PRIMARY KEY,
  stream_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_photo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_signals (
  id SERIAL PRIMARY KEY,
  stream_id INTEGER NOT NULL,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER,
  signal_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_messages_stream ON live_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_signals_stream ON live_signals(stream_id, created_at);
