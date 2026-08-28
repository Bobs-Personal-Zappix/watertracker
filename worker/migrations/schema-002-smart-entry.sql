-- worker/migrations/schema-002-smart-entry.sql
-- Smart Entry (PROD-12) daily-cap tracking. Run once against hydropro-db.
-- Uses IF NOT EXISTS so this is safe to re-run.
--
-- Keyed by device_id (not user_id) because Smart Entry works for signed-out/local-only users too,
-- same as the rest of the app's device-local model — see docs/DECISION-LOG.md ARCH-OPEN-04.
-- One row per device per day; `calls` is real model calls (counts against the daily cap),
-- `cache_hits` is served-from-KV requests (does not count against the cap, per PROD-12).

CREATE TABLE IF NOT EXISTS smart_entry_usage (
  device_id   TEXT NOT NULL,
  day         TEXT NOT NULL,
  calls       INTEGER NOT NULL DEFAULT 0,
  cache_hits  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, day)
);
