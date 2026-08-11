# HydroPro Tracker — Changelog

All notable changes to this project are tracked here, most recent first.

---

## [1.1.0] — 2026-08-11

The biggest single update yet — presets now work the way people actually eat and drink, and the Log screen got a real readability pass based on tester feedback.

### Added
- **Unified presets.** A single preset can now hold Water, Protein, and Calories all at once (e.g., "Protein Shake" = 16oz + 25g + 250cal), instead of needing three separate presets and three separate taps. Existing presets were migrated automatically — nothing was lost, they just came through as single-metric until edited.
- **One shared "Log" button.** Replaced the three separate per-tracker Log buttons with a single button below all three trackers. It opens one form where you fill in whichever of Water/Protein/Calories apply, then submit once as "Log Items."
- **Combined log entries.** Logging (whether manual or via a preset) now creates one entry that can carry multiple metrics, so Today's Log shows one line per real-world item instead of splitting it across up to three rows.
- **Daily goal shown above each tracker icon**, so it's visible at a glance without adding "consumed + remaining" in your head.
- **Per-metric visibility toggle.** In Settings → Daily goals, each of Water/Protein/Calories has a "Show on Log page" switch — turning one off hides it from the main screen while it keeps being tracked in Reports.
- **App version number**, shown in Settings → About. Will be bumped with each future release so it's easy to confirm which build a tester is actually running.
- **Alphabetical, 2-column preset grid** on the Log page, showing names only (amounts still visible in Settings, where you manage them).

### Changed
- Tracker titles (Water/Protein/Calories) restyled as bold "hero" section headers; goal text and the "to go" caption both sized up. Numbers deliberately left unchanged.
- Trackers themselves enlarged — bigger gauge graphics, more visual presence on the Log screen.
- Date now reads **"Day Tracker: [date]"**, both enlarged to match.
- "Presets" and "Today's log" section headers enlarged to match the new date size.
- Header badge icons made bigger and more pronounced.

### Fixed
- `handleImportBackup` was still referencing preset fields from the old (pre-unification) data shape — would have silently broken restoring an old-format backup file. Fixed before it shipped.
- The build script itself was still writing to a stale, unused file path from before the site was restructured into `/app/` — meaning several rounds of "tests passing" earlier today were unknowingly testing last session's code, not the actual current changes. Fixed the script itself, not just the symptom.

---

## [1.0.0] — 2026-08-11

Third tracked metric and trial-readiness groundwork.

### Added
- **Calories** as a full third tracked metric, alongside Water and Protein — its own goal, presets, gauge, and Reports support.
- **Flame gauge** for calories and **battery gauge** for protein (replacing an earlier bicep-shaped attempt that didn't read well), both fillable bottom-up like the water bottle.
- **"All 3" combined Reports view** — since oz/grams/calories don't share a scale, this shows each as % of its own goal so all three can be compared side by side.
- **In-app tutorial** ("How to use this" in Settings) covering getting started, logging, presets, reports, and reminders.
- **JSON backup export/import** in Settings, for moving data between devices or recovering after a phone switch — proven in real use, not just tested in isolation.
- **Public landing page** at the site's root domain, with the actual tracker moved to `/app/` and gated behind Cloudflare Access — the landing page is public, the tracker requires being on the allow list.

### Changed
- Renamed to **HydroPro Tracker**, with "...by Boston Pickleball Assoc." as the banner attribution.
- Moved to a real domain (`hydroprotracker.com`) instead of the original `.pages.dev` URL.

### Fixed
- Service worker switched from cache-first to network-first, so future updates show up on next open instead of getting stuck behind a stale cache.
- Cloudflare was aggressively caching `config.js` server-side, which meant even a full reinstall couldn't pick up a fix — added a `_headers` file forcing no-cache on everything under `/app/*`.
