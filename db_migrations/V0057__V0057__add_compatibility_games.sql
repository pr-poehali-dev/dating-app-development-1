
CREATE TABLE IF NOT EXISTS compatibility_games (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  partner_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  score_creator INTEGER,
  score_partner INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compatibility_questions (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES compatibility_games(id),
  question_idx INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  creator_answer INTEGER,
  partner_answer INTEGER
);

CREATE INDEX IF NOT EXISTS idx_compat_games_match ON compatibility_games(match_id);
CREATE INDEX IF NOT EXISTS idx_compat_games_users ON compatibility_games(created_by, partner_id);
