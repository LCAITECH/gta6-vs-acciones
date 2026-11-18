CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,           -- unix ms
  day TEXT NOT NULL,             -- YYYY-MM-DD (UTC)
  event TEXT NOT NULL,
  path TEXT,
  ref_host TEXT,
  country TEXT,
  device TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_day ON events(day);
CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
