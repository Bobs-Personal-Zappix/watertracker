# HydroPro Tracker — Changelog

All notable changes to this project are tracked here, most recent first.

---

## [1.6.0] — 2026-08-12

Fits all 4 trackers on screen at once, restructured the Log buttons per-card, and added the bedtime reminder.

### Changed
- All 4 tracker cards, their gauges, and their text shrunk significantly (~45% smaller graphics, tighter spacing) so the full 2×2 grid fits on a phone screen without scrolling. Presets and Today's Log remain below the fold, which is fine since they're used less at-a-glance than the trackers themselves.
- Replaced the single shared "Log" button with four separate buttons — Log Water, Log Protein, Log Calories, Log Sleep — one under each tracker card. The first three all open the same unified multi-field sheet; only Sleep opens its own dedicated flow. This restores visual symmetry across all 4 cards.

### Added
- **Bedtime reminder.** New card in Remind → Bedtime reminder, with its own enable toggle and time picker, completely independent of the existing interval-based reminder schedule. Sends once per day via push notification.
- Worker updated to store and check bedtime independently from the regular reminder schedule — both can fire in the same run if both are due, and each has its own de-duplication so neither can double-send in a day.
- In-app tutorial and the public landing page both updated to mention sleep logging and the bedtime reminder, and the landing page's hero now shows all 4 tracked metrics instead of 3.

### Testing note
The Worker's bedtime logic got the same rigor as everything else this project has shipped: verified it fires independently of the interval schedule, doesn't re-send the same day, correctly sends both notifications when both are due in the same run, and respects being disabled — 9 new Worker-side tests, all passing alongside the 20 that already existed.

### Deployment note
This release requires **two separate deploys** — the site update as usual, and a Worker redeploy for the bedtime reminder to actually function. The site half will work fine on its own (the Settings UI will just save a preference that doesn't do anything yet) until the Worker catches up.

---

## [1.5.0] — 2026-08-11

Sleep added as a fourth tracked metric — water, protein, calories, and now sleep, covering all four fuel categories testers asked for.

### Added
- **Sleep tracking.** New "Log Sleep" button opens a dedicated flow with Lights Out and Woke Up time pickers. Duration is calculated automatically, including sessions that cross midnight — inferred by comparing clock times rather than requiring a manual "this was yesterday" toggle.
- **Naps** use the exact same flow (just without crossing midnight) and accumulate into the same daily total as overnight sleep — no separate nap feature needed.
- **Bed gauge** — a new fillable graphic matching the visual language of the other three trackers, filling as you approach your sleep goal.
- Sleep integrated into **Reports**: its own metric option with Day/Week/Month views, and included in the combined "All 4" comparison view (renamed from "All 3").
- Sleep goal and a "Show on Log page" visibility toggle added to Settings, matching the existing pattern for the other three metrics.
- Log page moved from a 3-column row to a **2×2 grid** to fit the fourth tracker.
- Today's Log shows a sleep session as one row with both times and total hours, rather than splitting it into separate entries.
- Backup export/import and CSV export both updated to include sleep data and settings.

### Fixed
This round involved auditing a substantial amount of sleep-tracking code that already existed in the file from earlier work, and fixing several serious bugs found in it before any of it could be considered safe to ship:
- **Critical data-loss bug**: the migration logic that runs on every page load had no awareness of sleep entries, and was silently zeroing them out — every sleep entry would have been destroyed on the very next reload. Fixed and specifically tested against a real reload cycle.
- **App-breaking bug**: a `BedIcon` component was referenced in the UI but never defined or imported anywhere, which would have crashed the entire app on render.
- The "Log Sleep" button and sheet existed in the UI but had no state or handlers actually wiring them together — tapping it would have done nothing.
- Editing a sleep entry was routing to the wrong form entirely (the water/protein/calories editor instead of the sleep editor).
- The 2×2 grid layout and the dual Log-button row were referenced in the code but had no CSS defining them.
- There was no way to actually set a sleep goal or hide sleep from the Log page, despite the underlying data model supporting both.
- Backup export/import and CSV export were all missing sleep entirely — the same category of bug caught twice before with presets, now fixed for sleep too before it could bite anyone.

### Known follow-ups
- The bedtime reminder (a push notification at a configured lights-out time) is intentionally not included in this release — it needs changes to the Cloudflare Worker, not just the site, so it's planned as its own follow-up deploy.
- Tracker cards haven't been resized to take advantage of the extra width in the new 2×2 grid (they're sized the same as they were in the old 3-column row) — worth a look if the proportions feel off now that there's more room per card.
- The Reports metric switcher now has 5 buttons in one row (Water/Protein/Cal/Sleep/All 4) — same pattern as before, just one more button; worth confirming it doesn't feel cramped on an actual phone.

---

## Icon update — 2026-08-11

- App icon recolored: droplet is now dark ocean blue, battery is white, flame is red — swapped away from the green battery, which was too close to the background's blue tone to read clearly, especially at small sizes. Confirmed the favicon-size legibility issue is actually fixed, not just improved.

---

## [1.4.1] — 2026-08-11

### Added
- Small "In" label under each tracker's consumed total, so the meaning of the bottom number is unambiguous at a glance — pairs with the "to go" text above the icon to make the in/out framing self-explanatory to a first-time viewer.

---

## [1.4.0] — 2026-08-11

Refined the tracker layout based on a "containers" mental model, plus follow-up icon polish.

### Changed
- Tracker column order changed to: goal → "to go" status → icon → consumed total. The idea: "to go" sits above the container since it's what's still coming in, while the running total sits below since it's what's already settled in the container — separates in vs. out more intuitively than having both numbers on the same side of the icon.
- App icon: battery is now green and the flame is dark orange, so all three icons are distinguishable by color as well as shape (previously all white).
- App icon: fixed a vertical alignment issue where the flame sat noticeably lower than the droplet — the two-tongue flame shape's visual weight was centered differently than the droplet's tip-heavy shape; nudged it up to match.

---

## [1.3.0] — 2026-08-11

Log screen readability pass, plus a real redesign of the home-screen icon.

### Changed
- Each tracker column reordered: the running total and "to go" status now sit *above* the gauge graphic instead of below, and both are visually the biggest thing in the card — that's the info people actually check throughout the day.
- The "to go" / "over" status text significantly enlarged and bolded (was small and muted, easy to miss); numbers themselves left unchanged as before.
- The gold "over goal" bubble now centers itself in the middle of the gauge instead of overlapping awkwardly at the top edge.
- **App icon completely redesigned.** Replaced the flat navy background and single plain droplet with a vibrant aqua-blue gradient (matching the in-app banner) and all three tracker icons — droplet, battery, flame — together as the mark, with the battery in green and the flame in dark orange so all three are distinguishable by color as well as shape. Verified by actually viewing the generated icon at multiple sizes before shipping, rather than guessing blind; went through several iterations after the first attempts (battery, then flame) didn't read correctly at small sizes.

---

## [1.2.0] — 2026-08-11

Polish pass based on real usage — editable entries, clearer labeling, and visual tweaks across the header and Log screen.

### Added
- **Description field on the manual Log form.** Optional — type something like "Post-workout shake" instead of getting the auto-generated "Water + Protein" label. Presets are unaffected; this only applies to manual entries.
- **Editable Today's log entries.** Each row now has an edit (pencil) button alongside delete — fixes the exact "clicked a preset but need to change the time" case, and also lets you adjust amounts or the description after the fact. Editing updates the entry in place; confirmed it doesn't create a duplicate.

### Changed
- "+ Add preset" is now a full-width button below the preset grid, styled larger — reads as a section-end separator rather than another grid tile.
- "Day Tracker" label is now all caps.
- Banner title "HydroPro Tracker" enlarged; the "...by Boston Pickleball Assoc." byline size left untouched.
- Header badge icons are now colored to match each metric elsewhere in the app — blue water, green protein, orange calories — instead of all three sharing one color.
- Settings' preset list is now alphabetical, matching the Log page's preset grid.

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
