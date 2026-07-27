CREATE TABLE IF NOT EXISTS video_blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_video_blocks_blocker ON video_blocks (blocker_id);