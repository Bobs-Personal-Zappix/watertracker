-- D1/D7/D30 cohort retention tracking.
-- One row per user per day they were active. First-seen and last-active are
-- derived via MIN()/MAX() over this table, not stored separately, to avoid a
-- second write path that could drift out of sync.
-- Only an opaque device id and a date are ever stored here — no health data,
-- no log contents, no PII.
CREATE TABLE IF NOT EXISTS user_activity (
  user_id       TEXT NOT NULL,   -- opaque id, unrelated to email/account
  activity_date TEXT NOT NULL    -- 'YYYY-MM-DD', UTC, server-assigned
  , PRIMARY KEY (user_id, activity_date)
);
