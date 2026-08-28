-- worker/migrations/schema-003-smart-entry-events.sql
-- Smart Entry usage analytics (PROD-15 app-side session, A5). Run once against hydropro-db.
-- Uses IF NOT EXISTS so this is safe to re-run.
--
-- `user_activity` (schema-001) is a bare (user_id, activity_date) retention ping with no room for
-- per-event metrics — this is a separate table, not an extension of it. Keyed by device_id, not
-- user_id, matching this app's device-local model (ARCH-OPEN-04) and the smart_entry_usage table
-- (schema-002) it sits alongside.
--
-- `event` values, one row per (device_id, day, event) with a running count:
--   opened     — Smart Entry sheet opened
--   proposed   — /api/interpret returned entries and/or candidates (not declined, not empty)
--   confirmed  — user tapped Confirm and at least one entry/candidate was actually logged
--   edited     — a confirmed entry's value was changed from what the model proposed before Confirm
--   abandoned  — sheet closed with a proposal on screen but nothing confirmed
--   declined   — /api/interpret returned a non-null `declined`
--
-- Edit rate (edited / confirmed) is the interpretation-accuracy signal: if it runs high, the
-- prompt is wrong, and that becomes knowable from data rather than from complaints.
--
-- NOT wired into the app this session — this migration is proposed ahead of the client-side
-- instrumentation so the table exists whenever that work starts. Client-side event logging itself
-- is out of scope for v3.62.0 (A5 in docs/CC-BRIEF-smart-entry-app-v3.62.0.md).

CREATE TABLE IF NOT EXISTS smart_entry_events (
  device_id  TEXT NOT NULL,
  day        TEXT NOT NULL,
  event      TEXT NOT NULL,   -- opened | proposed | confirmed | edited | abandoned | declined
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, day, event)
);
