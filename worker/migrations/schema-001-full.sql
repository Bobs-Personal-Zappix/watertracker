-- worker/migrations/schema-001-full.sql
-- Full HydroPro D1 schema. Run once against hydropro-db before first deploy.
-- All tables use IF NOT EXISTS so this is safe to re-run.

-- Auth
CREATE TABLE IF NOT EXISTS users (
  id         TEXT NOT NULL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_tokens (
  token      TEXT NOT NULL PRIMARY KEY,
  email      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT NOT NULL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- Doctor share links
CREATE TABLE IF NOT EXISTS shares (
  id           TEXT NOT NULL PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  summary_json TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL
);

-- Cloud backup (logged-in accounts)
CREATE TABLE IF NOT EXISTS account_backups (
  user_id    TEXT NOT NULL UNIQUE,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Retention analytics
CREATE TABLE IF NOT EXISTS user_activity (
  user_id       TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  PRIMARY KEY (user_id, activity_date)
);
