# HydroPro Tracker — Changelog

Current release history, most recent first. Covers **v3.0.0 → present**.

Earlier history (v1.0.0 – v2.9.0) is in `ARCHIVE-changelog-pre-v3.md` — kept in the repo, deliberately left out of project knowledge to save context. The parts worth carrying forward are distilled immediately below.

---

## Lessons carried forward from v1–v2

Distilled from the archived entries so the hard-won parts stay in context. Each of these cost real time or shipped a real bug.

1. **`migrateEntry` silently destroys new entry types unless explicitly guarded.** It runs on every page load. Hit with sleep (1.5.0), again with weight (2.7.0), then applied proactively for supplements (2.8.0). Any new entry type needs a guard *and* a dedicated reload test.
2. **A new field must be added to backup export/import or it vanishes on restore.** Missed for presets, then sleep (1.5.0). Worse variant in 2.9.0: restoring a backup was silently wiping device-specific reminder settings, because the import rebuilt the settings object and carried forward only the push subscription.
3. **Each new entry type needs explicit routing in the edit handler.** Editing sleep (1.5.0), weight (2.7.0), and supplement (2.8.0) entries each defaulted into the wrong editor. The default path is never right for a new type.
4. **Visual changes must actually be rendered and looked at.** Icon legibility at 32px took several rounds of guessing (1.3.0, 1.4.0) before `cairosvg` was installed mid-session specifically to stop guessing (2.0.0). Playwright screenshots later caught a badge overlap that no DOM check would have (2.3.0).
5. **Hand-building organic SVG shapes doesn't work.** The bicep failed across five separate attempts, producing a chess pawn, a mushroom, and a snowman. The fix was abandoning the approach for a progress ring, not iterating on the shape (2.0.0).
6. **Caching will strand users on stale builds, in more than one layer.** Service worker went cache-first → network-first, and Cloudflare was caching `config.js` server-side so hard that a full reinstall couldn't pick up a fix (1.0.0). Separately, the build script wrote to a stale path, meaning several rounds of "tests passing" had been testing the *previous* session's code (1.1.0).
7. **Test-suite bugs masquerade as app bugs.** Three Worker tests computed a due time relative to "now" but compared against a hardcoded 11pm cutoff, so they broke only when run late at night (2.9.0). Verify the test before trusting its failure.

---

## [3.19.0] — 2026-08-20

`ARCH-OPEN-01` continued: recharts version pin and full identifier renaming in the extracted
`src/app.js`. **No change to `site/app/bundle.js` — the deployed app is unaffected by this
release.** This is source-reconciliation/dev-tooling work only.

### Changed — recharts pinned to match the deployed bundle
- `package.json` — `recharts` changed from `"latest"` (resolved to 3.10.1) to an exact pin at
  `2.15.4`. No version string survives minification in `site/app/bundle.js`, so the version was
  inferred from a structural fingerprint (the deployed bundle's `Legend` still uses static
  `defaultProps`, a recharts v2-only pattern) confirmed against recharts' `2.x` source, then
  verified by rebuild: the no-undef delta against the deployed bundle's 11-error baseline closed
  from +14 (recharts v3's `@reduxjs/toolkit`/`reselect` transitive deps) to +2 — and those 2 are
  dead-code artifacts of the unminified diagnostic build, not real errors.
- `package-lock.json` regenerated; `@reduxjs/toolkit` and `reselect` dropped out of the tree
  entirely.
- `eslint.config.js` — extended `files` to also cover `site/app/bundle.build.js` so the diagnostic
  build output can be linted going forward.

### Changed — all 38 vendor identifiers renamed to real names in `src/app.js`
- React (`er`→`React`) and ReactDOM (`Jn`→`ReactDOM`) namespace imports, plus all 12 recharts and
  24 lucide-react import aliases, renamed from mangled bundle-derived short names to their real
  exported names throughout the file (e.g. `rE`→`CartesianGrid`, `Xb`→`Bar`, `kr`→`Pencil`).
- One deliberate exception: the lucide `X` (close) icon, mangled as `Ar`, was aliased to `XIcon`
  rather than renamed to bare `X` — the file already uses `X` as an unrelated local variable in two
  other scopes (a settings toggle, a debounce-timer ref), and a blind rename would have silently
  shadowed those.
- Renamed in 7 batches; rebuilt and ran the jsdom harness after every batch, confirmed clean each
  time. End-state audit confirmed zero occurrences of any of the 38 original mangled tokens remain
  anywhere in the file.

### Testing
Verified against `site/app/bundle.build.js`, the diagnostic build output of `node esbuild.config.js`
(gitignored, never deployed) — **not** the deployed `site/app/bundle.js`, which this release does
not touch. `npx eslint site/app/bundle.build.js` no-undef count: 13, unchanged after the rename
batches (expected — pure rename, no semantic change). `node tools/harness.js
site/app/bundle.build.js` booted clean with all 8 tiles present and nav to every tab (Today, Stats,
Setup, Log It!) succeeding with zero runtime errors, confirmed after the recharts pin and after
every subsequent rename batch. jsdom has no layout engine, so chart rendering on the Stats tab has
not been visually verified — that still needs a real browser or Rob's eyes.

Remaining for `ARCH-OPEN-01`: verifying the build output matches production behavior in a real
browser before the bundle can be considered reconciled. The rule in `CLAUDE.md` declaring
`site/app/bundle.js` the sole source of truth stays in force until then.

---

## [3.18.0] — 2026-08-20

Bundle coverage fix (3b) for `ARCH-OPEN-06` retention analytics — closes the known gap called out
in 3.17.0: `/api/progress` previously only recorded a `user_activity` row for push-subscribed
users, since the client only ever called it from the existing push-gated ping. The Worker side
already handled any `id` unconditionally, so no Worker changes were needed for this fix.

### Added — Device-id activity ping, additive to the existing push ping
- `wtDeviceId()` — reads or creates a UUID (`crypto.randomUUID()`) stored under `localStorage`
  key `wt-device-id`; returns `null` if `localStorage` throws.
- `wtActivityPing()` — POSTs `{id}` only (no health payload) to `${rS()}/api/progress`, guarded on
  both `rS()` and `wtDeviceId()` returning a value, `.catch(()=>{})`. Fires once per app mount via
  a new `useEffect` with an empty dependency array, wired into the same effect chain as the
  existing push-ping effects in the main data component.
- The pre-existing push-gated ping (`uS`, sending the full health payload) is untouched and keeps
  firing on its own schedule for push subscribers — this is purely additive coverage for everyone
  else.

### Testing
Verified against the exact minified `site/app/bundle.js` being shipped: `node -c` syntax check
passed; `npm run lint:bundle` reported the same 11 pre-existing `no-undef` errors (no new one
introduced); `node tools/harness.js site/app/bundle.js` booted the app with all 8 tiles present
and all nav clicks succeeding with zero runtime errors; an end-state byte-diff against the
pre-edit file confirmed the only changes were the two intended insertions, with `uS` and
everything else byte-identical. **Real-device verification (Gate C) complete, 2026-08-20:** Rob
confirmed both push-subscribed and non-push users now produce rows in `user_activity`, closing the
coverage gap this release targeted.

---

## [3.17.0] — 2026-08-19

Worker source reconciliation: the committed `worker/src/worker.js` had drifted badly behind
production — 215 lines covering push notifications only, missing auth, sharing, and backup
entirely. Replaced it with the real deployed source and merged in the new retention write.

### Changed — Worker source reconciled with production
- `worker/src/worker.js` replaced with the actual deployed source (728 lines, up from 215).
  Restores auth (`/api/auth/*` magic-link sign-in and session handling), doctor-share links
  (`/api/share`, `/share/:id`), account backup (`/api/account/backup`), and recovery-code backup
  (`/api/backup`) to the repo — all of it was already live in production but had never been
  committed anywhere.
- CORS now allows the `Authorization` header, required by the auth/share/backup routes.

### Added — Full D1 schema migration
- `worker/migrations/schema-001-full.sql` — all 6 tables the Worker code depends on: `users`,
  `login_tokens`, `sessions`, `shares`, `account_backups`, `user_activity`. Supersedes and
  replaces the narrower `schema-001-user-activity.sql`.

### Added — Retention write merged into `/api/progress`
- `/api/progress` now writes `user_id + date` to D1 `user_activity` for every caller, in addition
  to its existing KV progress save for push subscribers. Previously this route only recorded
  retention data (discarding everything else) with no KV write at all — the two behaviors had
  never coexisted in the same file. Fire-and-forget: a D1 failure doesn't affect the KV save or
  the response.
- Known limitation: the client only calls `/api/progress` when a push subscription id exists, so
  `user_activity` currently only captures users who've enabled push notifications, not the full
  user base. Tracked as an open item, not fixed in this release.

### Fixed — VAPID config
- `wrangler.toml` had placeholder values for `VAPID_PUBLIC_KEY` and `VAPID_CONTACT_EMAIL`. Now
  set to the real public key and `mailto:rob@hydroprotracker.com`.

---

## [3.16.0] — 2026-08-17

Six small-but-real fixes: moved Health Summary to the Stats page, reordered a Log tab tile, gave three tabs proper titles, and fixed a real logic bug in the Treatments tile.

### Changed — Health Summary moved to Stats
- "Health Summary" and "Share with your doctor" moved from Settings to the bottom of the Stats page — makes more sense there, since sharing is usually top-of-mind while looking at your stats.

### Changed — Log It! tile order
- Exercise and RX & Supplements swapped positions. New order: Weight, Exercise, Treatments, RX & Supplements.

### Changed — Tab titles
- Stats now reads "TO DATE STATS:" plus today's date.
- Setup now reads "Setup for:" plus today's date.
- Settings now reads just "Settings" — no date, since nothing there is day-specific.

### Fixed — Treatments tile showing "Done" for things that were never logged
- The Treatments tile's progress ring and "Done" count were built from "not currently pending," which incorrectly counted a treatment as done if it simply had no schedule established yet (i.e. added in Setup but never actually logged even once). Two treatments sitting untouched showed up as "2 Done."
- Now: the goal only counts treatments actually due today (or overdue), and "done" only counts ones actually logged today. Nothing scheduled for today → goal is 0, ring shows complete, "0 Done" — matching what you'd expect at a glance.
- Checked RX & Supplements for the same issue: it doesn't have it. Supplements are deliberately built to treat a never-taken item as due immediately (from earlier work in this project), so a never-logged supplement already correctly shows up as due-and-not-done rather than falsely "done." No change needed there.

### Testing
Verified all six changes in a simulated browser: tile order, all three tab titles (including Settings correctly showing no date), Health Summary present on Stats and gone from Settings, and the full Treatments cycle — two never-logged treatments correctly excluded from the goal, a genuinely-due treatment correctly showing 0 done until logged, then correctly flipping to done once logged today. Also re-ran the full inventory decrement/restore regression suite from the last release to confirm nothing broke. All of the above run against the exact minified file being shipped.

---

## [3.15.0] — 2026-08-17

Two features tonight: a way to look back at past days' logs, and inventory/subscription tracking for supplements and treatments.

### Added — Past days' logs
- A calendar icon next to "Today's Log" opens a list of every past day that has entries, most recent first.
- Tapping a day shows that day's logged items, read-only, using the exact same row rendering as Today's Log.
- No retention limit — every day's logs were already being kept (Reports has always read multiple days), this just adds a way to actually see them. Nothing new to prune or manage.

### Added — Inventory / subscription tracking for RX & Supplements and Treatments
- Each supplement or treatment can now optionally track a real inventory: turn on "Track inventory / subscription" when adding or editing one, and set units/sessions remaining plus an expiration date.
- Logging a dose or session the normal way (tapping the tile, same as always) automatically decrements the count — respects a per-item quantity if you log more than one at a time. Deleting or editing a past log entry correctly gives the count back, so it can't drift out of sync from real usage.
- Low-supply (\u22643 remaining) and near-expiration (\u22647 days) warnings show up right in the Setup list next to the item, and as a short flag on the RX & Supplements / Treatments tile itself.
- New **Subscriptions** view under Stats (next to Water/Protein/Cal/All 3) lists every tracked item with its remaining count, expiration, and full usage history pulled straight from existing logged entries — no separate purchase ledger to maintain.
- Kept deliberately simple: one live "remaining" count per item, correctable any time (e.g. after a refill), rather than tracking separate purchase batches. Covers the actual ask — knowing what's left and when to reorder — without extra bookkeeping.

### Fixed — two real bugs caught before shipping
- The existing supplement-loading code (`vj`, used every time the app starts) rebuilt each supplement from a fixed field list that predated tonight's work — it was silently dropping the new tracking fields on every reload. Would have meant inventory tracking looked like it worked in the moment but reset on next launch. Fixed to preserve the new fields; treatments were unaffected (they load without a similar rebuild step).
- A first draft of the delete-entry logic lost its inventory-restore behavior partway through editing. Caught by directly testing delete-and-confirm-restore end-to-end, not just a syntax check, before packaging.

### Testing
Built and verified in a simulated browser (not just syntax-checked): booted the app fresh, added a tracked supplement end-to-end through Setup, logged it and confirmed the count decremented, deleted the log entry and confirmed the count restored, repeated for treatments, confirmed low-supply badges and the Subscriptions panel render correctly, and confirmed tracked data survives a simulated reload. Also ran a full-file sweep for undefined-reference bugs (the exact class of bug that broke the previous release) — none found. All of the above re-run against the exact minified file being shipped, not just the working copy. Still needs your usual real-device pass — simulated-browser testing catches logic and reference errors but isn't a substitute for using it on your phone.

---

## [3.14.0] — 2026-08-17

Four items held back from the last design batch, all closed out tonight: real progress rings on the four new tiles, layout uniformity across all eight, a nav bar tweak, and a proper scrolling Today tab.

### Changed — Weight, RX & Supplements, Treatments, and Exercise now have real progress rings
- Replaced the binary faded/lit status ring on all four newer tiles with the same percentage-fill ring the original four (Water, Protein, Calories, Sleep) use.
- **Weight**: ring stays empty until a weight is logged for the day, then fills as today's weight ÷ target weight. No "over goal" celebration badge — being over or under is just a fact, not an achievement. New **Weight — target in lbs** goal added in Setup → Daily goals.
- **Exercise**: ring fills same as Water/Protein/Calories — minutes logged today ÷ daily minutes goal, with the same "+X min over 🎉" badge when you beat it. New **Exercise — minutes per day** goal added in Setup → Daily goals.
- **RX & Supplements**: ring fill = how many of today's due items are taken, over how many are due — pulls directly from each supplement's existing schedule, no new setup required.
- **Treatments**: ring fill = planned recurring treatments not currently pending, over the total planned — same existing due-date engine, no new setup required.

### Changed — All 8 tiles now share one layout
- Weight/RX & Supplements/Treatments/Exercise restructured to match Water/Protein/Calories/Sleep exactly: label → goal → status line → ring → number → bottom label. Numbers stay below the ring, never inside it.
- Weight shows `Goal {X}lbs` / today's recorded weight with a signed lbs-to-go stat (`+X` over, `-X` under). Exercise shows `Goal {X}min` / minutes logged today. Supplements and Treatments show how many are planned/due today, pulling from what's already configured for each.

### Changed — Nav bar
- Setup and Settings swapped positions (Setup now sits before Settings).
- "Log" renamed to **"Log It!"**. "Reports" renamed to **"Stats"**.

### Changed — Today tab scrolling
- "To Do Today" and "Today's Log" are now two independently scrollable boxes instead of relying on page-level sticky positioning. Today's Log is guaranteed at least 50% of the viewport height (scrolls internally past that). To Do Today scrolls internally too if a lot of items are due, so it never pushes Today's Log off-screen.

### Notes
- Built directly against the live production bundle rather than `src/App.jsx`, since the committed source had drifted out of sync with what's actually deployed (missing Treatment tracking and Exercise entirely). Worth re-syncing `src/App.jsx` to the real deployed code at some point so this doesn't happen again — flagged separately for the roadmap discussion.
- The Supplements/Treatments ring-fill formulas are a direct, minimal extension of the existing due/not-due logic already powering their status text — nothing new was invented there, just turned into a percentage instead of a yes/no.

### Fixed — blank white screen on load
The first upload of this release had a real bug: the new `ringWeight` component referenced `recordedToday` instead of the local variable it was actually destructured into (`r`), throwing a `ReferenceError` the instant the Weight tile tried to render — which happens on first load for anyone with Weight showing (the default). That's why the app came up as a blank white screen after deploying.

Fixed, and this time verified by actually booting the app in a simulated browser environment (jsdom) rather than relying on a syntax check alone — confirmed it mounts with zero errors, and clicked through Log, Setup, and Today tabs to confirm each renders correctly with the new tiles, goal inputs, and scroll layout present. Also ran the full file through ESLint's `no-undef` check across all ~34,000 lines to catch any other undefined-reference bugs of the same kind — none found.

### Testing
Verified via simulated-browser boot (jsdom) across Log/Setup/Today tabs, plus a full-file undefined-reference sweep. Not yet run through the project's own automated test suite or on a real device — still needs your usual real-device pass before it's considered fully confirmed.

---

## [3.13.0] — 2026-08-16

Three changes this round: toggles for the new tiles, sleep gets its own trend view, and Settings splits into two focused tabs.

### Added — Toggle on/off for all 8 tiles
- Weight, RX & Supplements, Treatments, and Exercise can now be hidden from the Log page individually, matching what Water/Protein/Calories/Sleep already had. New "Other trackers" section with all four switches.

### Changed — Sleep moved to its own "Over Time" section
- Sleep is no longer part of the Water/Protein/Calories percentage-of-goal comparison — it now gets a dedicated line chart over time, right alongside Weight's, with a goal reference line when a sleep goal is set.
- Water, Protein, and Calories are completely unchanged — same bar charts, same day/week/month views, same everything.
- The combined comparison view is now "All 3" instead of "All 4," since sleep moved out.

### Changed — Settings split into two tabs
- **Settings**: name, feedback, reminders, account sign-in, cloud/file backup, health summary, data export/reset, about.
- **Setup**: daily goals, all tracker on/off toggles, presets, supplements & prescriptions, treatments — replacing the old single long Settings page.
- **AI Coach removed** from the navigation bar entirely, replaced by Setup in the same slot.

### Also in this round
- Removed the "X-day streak" badge from the header — unclear what it meant out of context. The underlying calculation is untouched, since the Worker's smart reminders still use it.
- "Day Tracker" is now "Day Planner" specifically on the Today tab; the Log tab keeps "Day Tracker."
- "To Do Today" now stays pinned at the top of the Today tab while the log entries below it scroll past underneath.
- Fixed a real bug found while building the tile toggles: a brand-new, never-yet-taken supplement was incorrectly showing its status ring as fully "done" instead of due, since the scheduling engine's "never logged = no schedule yet" behavior (correct for treatments) doesn't fit supplements, which default to daily.

### Testing
Splitting Settings into two tabs meant walking through the entire migration suite section by section, since dozens of existing tests referenced content by its old location — goals, presets, supplements, and treatments all needed their navigation updated to Setup, and toggle-index tests needed adjusting since Setup's switches no longer have a feedback-watch toggle preceding them. Each fix was verified individually rather than assumed. 578 checks total across every suite in the project, plus real screenshots confirming both new tabs show the right content in the right place.

---

## [3.12.0] — 2026-08-16

Two real bugs from last round's changes, both fixed.

### Fixed — RX & Supplements ring falsely showing "done"
- A brand-new supplement that's never been taken was being read by the scheduling engine as "no schedule yet" (the same behavior treatments correctly have) rather than "due today" - so the status ring showed fully lit even with "0 of 2 taken today" sitting right below it.
- Supplements default to daily, so there's no reason to wait for a first-ever log before counting one as part of today's routine. Fixed with a supplement-specific check that treats a configured-but-never-taken supplement as due immediately, without touching the treatment scheduling logic (which is correct as-is and already well-tested).

### Redesigned — the quick-dial popup
- Presets no longer live inside the quick-dial popup - that's what was causing them to get cut off with no way to scroll on smaller screens.
- **The quick-dial's "X" and tapping outside it now genuinely just close it** - no more forced detour into the full entry form if you didn't enter anything. This was the real substance of "no way to get out."
- **"Add details instead" is now "Manual or Presets Entry."** Tapping it opens the full entry sheet with presets shown at the top (their own scrollable area, so a long list never pushes the rest of the form out of reach) followed by the manual water/protein/calories fields below - exactly the layout requested.

### Testing
A dedicated test proves the ring fix directly: a freshly-added, never-taken supplement is confirmed to render with the faded (not-done) ring and to correctly appear on the To Do Today list. A second test confirms dismissing the quick-dial without entering anything creates zero log entries - not just that the popup visually closed. 557 checks total across every suite in the project, including real screenshots confirming both fixes actually resolve what was reported, not just that the code changed.

---

## [3.11.0] — 2026-08-16

Three design refinements: the four new tiles now match the original four exactly, a unified "To Do Today" list, and presets moved into the tracker popups.

### Changed — Tiles now match the original four precisely
- Weight, RX & Supplements, Treatments, and Exercise tiles restructured to match the original four exactly: title with a small icon on the left at top, circular icon in the middle, status text below - not the boxy, icon-on-top layout from last round.
- All four custom icons converted to circular crops, matching the round crystal style of the original tiles instead of looking like separate square app icons dropped in.
- New status ring around each icon - not a percentage arc like the original four (none of these have a daily numeric goal in that sense), but a binary faded/lit state: faded when something's due, fully lit when there's nothing left to do for that category today.
- Renamed to "RX & Supplements".

### Added — "To Do Today"
- A new section between the date header and Today's Log, titled "To Do Today" - showing anything due or overdue right now, combining supplements and treatments in one genuinely unified list (not two lists stacked on top of each other).
- Shows "All Done for the Day 🎉" when nothing needs attention. Deliberately narrower than the full schedule view on purpose - upcoming (not-yet-due) items don't show here, so "All Done" is a statement that's actually true, not "nothing's overdue, but plenty is coming."
- Each item keeps the always-editable due date this app has had since treatments first shipped.

### Changed — Presets moved into the tracker popups
- Presets no longer sit in their own section on the Log page. Tap Water, Protein, or Calories, and the same preset list appears at the top of whichever dial opens - one consistent location regardless of which tracker you tapped, rather than a separate section further down the page.
- Tapping a preset from inside the popup logs it and closes cleanly - no detour through the full entry form, unlike the dial's own Close button (which intentionally still transitions there, unchanged from before).
- Presets are still fully managed (add/edit/delete) in Settings, exactly as before - only the quick-tap logging location moved.

### Fixed
- A real, pre-existing test-isolation bug in the Worker test suite, unrelated to anything built this round: a leftover subscriber record from an early, unrelated test could coincidentally also be "due" depending on what time of night the tests happened to run, sharing the same fake push endpoint as a different test and inflating its push count. Confirmed stable across repeated runs after the fix.

### Testing
Building the "To Do Today" list surfaced a bug in my own test, not the app: an assertion checked for a name across the *entire page's* HTML, which produced a false failure since the same name legitimately also appears in Today's Log below - fixed by scoping the check to the actual to-do rows specifically. A dedicated test now confirms the list is genuinely unified (exactly one combined list, not two coincidentally stacked) by seeding one overdue supplement and one overdue treatment together and confirming both appear as two rows in the same list. 526 checks total across every suite in the project.

---

## [3.10.0] — 2026-08-16

Fixed a real bug in the shareable-link feature: links were unreachable by the exact people they were built for.

### Fixed
- **Share links pointed into the gated part of the app.** The link generated by "Generate a link to share" was `hydroprotracker.com/app/?share=<id>` - but `/app/*` is protected by Cloudflare Access, the email-allowlist gate that keeps the tracker testing-group-only. Anyone opening the link without an invite - including the doctor it was built for - hit a Cloudflare login wall before the app's own code (which correctly required no login) ever got a chance to run. The React-side logic was right; it just never had a reachable path to run on.
- **The fix:** the Worker itself lives on a completely separate domain with no Access policy on it at all. Shared summaries are now rendered directly by the Worker as a plain HTML page at its own `/share/<id>` path - no React, no build step, genuinely reachable by anyone with the link. "Generate a link to share" now uses the URL the Worker returns, rather than constructing one against the gated app path.

### Testing
The Worker-rendered page is checked against a real, malicious payload - an actual `<script>` tag and an `<img onerror>` payload in a supplement name - confirming the escaping genuinely works, not just that ordinary test data happens not to contain one. A full end-to-end test generates a real link, confirms it points to a different origin than the app itself (the actual property that lets it bypass Access on the real domain), and then genuinely navigates to that link in a completely fresh browser page to confirm the content loads. 504 checks total across every suite in the project.

---

## [3.9.1] — 2026-08-16

Fixed the crop on the four new tile icons (Weight, Supplements, Treatments, Exercise). The originals were resized directly from slightly non-square source images, causing a subtle stretch. Now center-cropped to a true square first, then resized - no distortion.

---

## [3.9.0] — 2026-08-16

Two things this round: supplements now have a real schedule (not just "did you take it"), and the Log page's Weight/Supplements/Treatments buttons became tiles — alongside a brand new Exercise tracker.

### Added — Supplement scheduling
- Supplements now carry the same schedule shape treatments already had: how often (in days), when last taken, and an always-editable next-due override. **Defaults to daily** — most vitamins and prescriptions are, so that should be the thing nobody has to configure. Every-other-day, weekly, etc. are the exception you set, not the default everyone deals with.
- Existing supplements (added before this existed) migrate automatically to daily. Nothing changes for you today unless you go set a different interval.
- This is the foundation for real adherence tracking, not just "logged it once" — the kind of thing that makes the doctor/insurer story actually credible: not "did you drink water," but "did you take what you were supposed to, on schedule."

### Added — Tiles + Exercise
- **Weight, Supplements, and Treatments are now tiles**, matching the visual style of the four main trackers, replacing the three full-width buttons. Kept intentionally large — same accessibility reasoning as always: readable and easy to tap matters more than a tighter layout.
- **A new Exercise tile** — type, minutes, time, and an optional description. No managed preset list like supplements/treatments have; exercise types vary too much per person for a fixed list to make sense, so it's a simple direct-entry form each time, the same way water/protein/calories work.
- Each new tile shows a real, glanceable status: most recent weight (searched across all days, not just today, since weight isn't a daily goal), "X of Y taken today" for supplements, "X due" for treatments, minutes logged today for exercise.
- **Rob's four custom icons are live** — the drip bag, fitness shield, scale, and pill bottle now anchor their respective tiles.

### Design notes
- The scheduling logic added for treatments turned out to be genuinely generic — reused as-is for supplements, not duplicated. One engine, two places it applies.
- Exercise deliberately has no Settings CRUD, unlike supplements and treatments. A fixed list of "exercise types" would fight how varied people's routines actually are; a free-text field each time fits better.

### Testing
Supplement scheduling verified against the same kind of cases the treatment engine got: the underlying due-date math confirmed correct for a supplement-shaped object without any changes to the function itself, migration confirmed not to crash on a supplement missing every new field, and the interval field confirmed to actually default to daily rather than blank. The tile layout change surfaced two existing tests written for the old 4-tile world (both counting `.wt-tracker-col` elements) that needed updating now that eight tiles share that class - found and fixed rather than ignored. 525 checks total across every suite in the project.

---

## [3.8.0] — 2026-08-16

Doctor-share as a shareable link — no email attachment needed. Sign in, generate a link, send it however's convenient; the recipient needs no account at all.

### Added
- **"Generate a link to share"** in the Health Summary view, shown once signed in. Creates a link like `.../app/?share=<id>` and shows it with a one-tap copy button.
- **The link is a frozen snapshot, not a live feed** — deliberately. A link that always shows *current* data is a bigger privacy risk if it's ever forwarded beyond the intended doctor, and a snapshot matches the actual use case better anyway: "here's what happened before this appointment." Links expire after 90 days.
- **Opening the link needs no account, no login, nothing installed** — the recipient just sees the summary. Built as a completely independent view that bypasses the app's normal UI entirely (no nav bar, no tabs, no dependency on local data), since the person opening it is very often on a different device that's never touched this app before.
- New `shares` table in D1 (`schema-003-shares.sql`), separate from account backups, since a share and a full backup are different things serving different purposes.

### Fixed
- **A real rules-of-hooks bug introduced while building this**, caught immediately by the test suite crashing rather than silently misbehaving: a `useEffect` ended up positioned after a conditional early return, meaning React called a different number of hooks depending on whether the view was open. Moved to sit with the other hooks, where it belongs.
- A test assertion that would have been a false positive: checking for the CSS class `wt-nav-btn` via a naive text search on `innerHTML` incorrectly matched the class name as it appears inside the page's own injected stylesheet, not an actual rendered nav button. Fixed to check the real DOM node instead.

### Testing
The real proof for this one: a signed-in browser with actual logged data generates a link, confirmed reaching a fake server; then a completely separate browser context — genuinely empty, no seeded data, no account — opens that exact link and is confirmed showing the real shared data, with no app chrome at all. Not two isolated mocks each checking their own internals; an actual simulated "texted my doctor a link" scenario. 502 checks total across every suite in the project.

---

## [3.7.0] — 2026-08-16

Two features this round: push reminders for overdue treatments, and a printable health summary for doctors and health advisors.

### Added — Treatment reminders
- A daily push notification if anything in Treatments is due today or overdue, naming which one(s) so you know what to log. New card in Settings → Reminders, matching the existing Bedtime/Supplement reminder pattern.
- Built on the same progress-push mechanism that already powers the smart water/protein/calorie reminders — the app computes each treatment's next-due date and includes it in that same small snapshot sent to the server, so the Worker never needs its own copy of the scheduling logic.

### Added — Share with your doctor
- A new "Health Summary" section in Settings generates a clean, formatted summary — daily averages vs. goals, weight trend, supplements/prescriptions (day-counts, not a made-up "adherence %"), and treatments with actual dates — over the last 7, 30, or 90 days.
- **Print or save as PDF using your device's own native print function** — no PDF library, no server involvement, no new dependency. The same idea already used for calendar reminders, applied here.
- Deliberately excludes anything that assumes a supplement is meant to be taken every single day, since that's often not true. An honest day-count is more useful to a clinician than a percentage built on a wrong assumption.
- Carries an explicit disclaimer: self-reported by the user, not a clinical record, may include gaps or user error.

### Fixed
- **A real, meaningful bug in the reminder Worker code**: `/api/subscribe` was rebuilding its entire stored record from scratch every time *any* reminder setting changed — silently wiping out the progress data (including the new treatments-due list) until the next automatic sync happened to run again. Now only overwrites the specific fields it's actually meant to update.
- **A complete failure of the doctor-share feature's actual purpose, caught before shipping**: the first version of the print styling looked correct in code, but real print-media testing showed the printed page was entirely blank. The cause: hiding the rest of the app with `visibility:hidden` still left it occupying layout space, which pushed the summary content thousands of pixels off-screen. Fixed by removing hidden elements from layout entirely (`display:none`) instead — and this is exactly the kind of bug a syntax check or a JSDOM-based test can't catch, since neither has a real layout engine. Only an actual browser under print-media emulation revealed it.

### Testing
The treatment-reminder logic was tested in three layers: the due-date math independently (already covered last release), the Worker's decision logic (fires when something's due, stays quiet and doesn't re-check all day when nothing is), and the full chain from the client computing a due date through to it reaching the Worker in the right shape. The doctor-share aggregation was verified against 22 hand-checked cases — date-range boundaries, weight-trend math, and the same backward-compatible handling of old-format supplement entries used elsewhere in the app — before any UI was built on top of it. A new permanent Playwright test locks in the print-rendering fix specifically, so this exact regression can't silently return. 488 checks total across every suite in the project.

---

## [3.6.0] — 2026-08-16

Treatment tracking — periodic things like drips, shots, and PT sessions. Not daily habits like the core four metrics, but things on their own recurring schedule, with a "when's my next one due" the app actually keeps track of.

### Added
- **A new "Treatments" section in Settings.** Add anything on a recurring schedule — name it, optionally give it an interval in days. Leave the interval blank for pure history tracking with no due-date logic at all.
- **"Log Treatment"** on the Log page, alongside Weight and Supplements. Tap what you had (more than one at once is fine — an IV drip and a B12 shot in the same visit becomes one combined entry), confirm the date and time, done.
- **A "Treatments" status card on the Today tab** — shows anything overdue, due today, or coming up soon, sorted so the most urgent is first. Treatments with no schedule set, or that have never been logged, don't clutter this list.
- **The next-due date is always editable, directly in that status card.** Life doesn't respect intervals — if a date lands on a holiday or just doesn't work, tap the date field and change it. No separate settings screen, no confirmation dialog, just an ordinary date picker sitting right next to the status.

### Design notes
- **Schedule drift is intentional, not a bug.** If a dose gets pushed back a few days, the *next* one calculates forward from when it was actually taken — not from the original planned date. For most periodic treatments, the spacing between doses is what matters medically, so the whole schedule shifting with a delay is the correct behavior, not something to "correct" back.
- Deliberately scoped to **individual, self-directed tracking** — the person using this app chooses to track their own treatments because this is the best tool for not missing one and reporting on it later. This is not, and won't become, a way for a business to manage or monitor a customer's usage from their side.

### Testing
The scheduling math got tested in isolation before any UI was built on top of it — month rollover, year rollover, leap years, and the drift behavior specifically (a delayed dose correctly shifts the whole schedule forward, rather than snapping back to the original plan). 23 checks across CRUD, the logging flow, status display, and confirming the override genuinely persists and updates what's shown - not just accepted and silently ignored. 423 checks total across app and Worker suites.

### What's not included yet
Push reminders for overdue treatments — the equivalent of what supplements got as a follow-up after shipping. Not started; a natural next step, not forgotten.

---

## [3.5.0] — 2026-08-15

Cloud backup is now wired to real accounts — the last piece of Phase 2. This completes the roadmap's Phase 2 scope: accounts, a real database, and now data that follows your account instead of a code you have to hold onto.

### Added
- **Automatic account backup.** The moment you're signed in, your data backs up to your account in the background — no separate toggle, no recovery code to remember. Same 20-second debounce pattern as everything else that auto-saves in this app, plus an immediate flush if you background the app.
- **"Restore from my account"** — sign in on a brand new device and pull your data straight back, no code needed at all.
- **"Back up now"** for account backup specifically, alongside the existing one for the recovery-code system.
- New `account_backups` table in D1 (separate migration file, `schema-002-account-backup.sql`) — one row per account, isolated per user, confirmed one signed-in account genuinely cannot see another's data.

### Changed
- **The recovery-code cloud backup system is completely untouched.** As promised when accounts were first introduced, this sits alongside it, not in place of it — nothing breaks for anyone already relying on the recovery code.

### Fixed
- Caught before shipping: the new endpoints were briefly misplaced outside the Worker's request-handling function during a mid-edit mistake — a syntax check alone didn't catch it (JavaScript doesn't require an error for slightly-wrong-but-still-technically-legal placement), so it needed an explicit look at the actual file structure to confirm the code was really where it needed to be.

### Testing
The real proof for this one: two entirely separate fresh browser instances sharing nothing but a login. "Device A" signs in, logs a real entry, and it's confirmed reaching a fake account-backup server. Then "device B" — genuinely starting empty — signs into the *same* account and is confirmed pulling that exact entry back. Not two isolated mocks asserting on their own internals; an actual simulated lost-phone-and-got-a-new-one scenario. 400 checks total across app and Worker suites, all passing.

### Where Phase 2 stands now
The full arc: real accounts, D1 storage, magic-link sign-in, and data that travels with your account. Phase 3 (the actual integration layer — doctor-share, then eventually Apple Health / Health Connect via a native wrapper) is next on the roadmap whenever you're ready, though as before, real tester feedback should keep having the final say over what gets prioritized next.

---

## [3.4.0] — 2026-08-15

Real sign-in, built on last session's accounts foundation. This is the piece a real person actually taps through, rather than curl commands.

### Added
- **New "Account" section in Settings**, sitting above Backup. Enter your email, get a sign-in link, tap it — no password. Signed-in state shows your email and a Sign out button.
- **Clicking the email link actually works now.** The app detects a `?login=` token in the URL on load, verifies it against the server, and signs you in — cleaning up the URL afterward either way, so a page refresh can't retry an already-used token.
- **Sign out is a real security action, not cosmetic.** Added a `DELETE /api/auth/session` endpoint that actually revokes the session server-side. Previously (this session, caught before shipping) there was no way to revoke a session at all — "signing out" would only have meant forgetting the token locally while it stayed valid forever on the server.
- Accounts are intentionally **not yet connected to anything** — cloud backup still uses its own separate recovery-code system, unchanged. The Account section says this plainly rather than implying more than it does.

### Testing
Real end-to-end verification, not just unit tests: a fresh browser context loads with `?login=<token>` in the URL, the app is confirmed to call verify exactly once, store the session, show "Signed in as...", and clean up the URL — then Sign out is confirmed to actually call the revoke endpoint with the correct token, not just clear local state. Building this test surfaced the same cross-window `fetch`/`setTimeout` resolution quirk found last session (bundle code resolves bare globals through Node's actual global scope, not the jsdom window it was evaluated in) — this time it meant a test's own reassigned mock silently wasn't being used, caught and fixed before treating the result as real. 306 app checks, 81 Worker checks, all passing.

### What's still ahead
Wiring cloud backup to use real accounts instead of the recovery-code system remains the next piece, not started yet.

---

## [3.3.0] — 2026-08-15

Smart reminders — Phase 1 of the roadmap. The app now tells the Worker a small amount about today's progress, so the recurring push reminder can skip itself when it's not needed and say something real when it does fire.

### Added
- **Reminder suppression.** If you logged something in the last 90 minutes, the interval reminder quietly skips itself instead of nagging you for what you just finished doing.
- **Progress-aware push messages.** When the reminder does fire, it says "38oz of water to go" or "Almost there — just 12g of protein left" instead of the generic "time to log your stats" — the same logic already used for the in-app nudge, now ported server-side so it works even when the app is closed.
- The app pushes a small summary (today's totals vs. goals, when you last logged, your current streak) to the Worker roughly 20 seconds after things stop changing, or immediately if you background the app first. Never your log history — just those few numbers.

### Fixed
Nothing user-facing this round, but two real issues surfaced and were fixed during testing:
- A stray `server.close()` call was stranded mid-file in the Worker test suite (left over from an earlier session's edits), silently shutting down the test server before the newest tests ran against it.
- Several fresh-mount tests schedule real timers that resolve against Node's actual global `setTimeout` rather than a per-window one, meaning they can't be fully torn down between tests in the same run. Rather than fight that limitation, the tests that could be affected now check for their own uniquely-identifiable data rather than "nothing happened at all" — a more robust way to verify the same thing.

### Testing
Verified with two different real-browser end-to-end tests (not just unit tests of the logic in isolation): one confirms a logged entry produces a real HTTP request to `/api/progress` with the exact right numbers, reaching an actual local server rather than asserting on internals. Building that test surfaced a genuine trap worth knowing about for any future browser-based testing here: reloading the page mid-test lets the app's own service worker serve a *cached* `config.js`, silently pointing the app at the real production Worker instead of the test server regardless of what the test tried to inject. The fix is to seed test data before the first page load rather than reloading — which is now the documented pattern in both new test files.

### What this doesn't do yet
This is intentionally the smaller of the two options on the roadmap. It does not include accounts, a real database, or anything beyond a tiny rotating progress snapshot per device. Full history still lives only in cloud backup (opt-in, from the last release) or on the device itself.

---

## [3.2.0] — 2026-08-15

Cloud backup. Addresses the most urgent practical risk in the app: until now, every tester's entire history lived in one browser's storage, with a manual JSON file as the only safety net.

### Added
- **Automatic cloud backup (opt-in).** Switch it on in Settings → Backup and the app quietly keeps a server-side copy of your data. Saves automatically about 20 seconds after you stop making changes, and flushes immediately if you background the app — so the common case of "log something, switch apps" doesn't lose the pending write.
- **Recovery codes.** Turning backup on generates a code like `K7QM-3XPT-9B`. That code is the only way to pull your data onto a new device, and it's displayed prominently with an explicit warning to save it. The alphabet deliberately excludes O/0/I/1/L because people read these off a screen and retype them, and the app accepts the code lowercase, without dashes, or with stray spaces.
- **Restore from a recovery code**, with a clear warning that it replaces whatever is currently on the device. A failed restore leaves the dialog open so the code can be corrected, and leaves existing data untouched.
- **"Back up now"** for anyone who wants to force a save rather than wait for the automatic one.

### Changed
- The manual file backup is still there and unchanged — now framed as the option for people who'd rather keep an archive they control instead of relying on the server copy.
- **Corrected the privacy claim on the landing page.** It said data "lives on your own device" and that nothing is shared — accurate before this release, not accurate after it. Now states plainly that cloud backup stores a copy on the server, that it's opt-in, and that it can be switched off.

### Fixed
- **A footgun in "Reset all data".** With cloud backup on, wiping local data would have immediately auto-pushed an empty backup over the user's cloud copy — quietly converting a local reset into permanent, unrecoverable loss. Reset now switches cloud backup off while keeping the recovery code, so a mistaken reset can still be undone by restoring.

### Design notes
- The recovery code is the whole design problem here. Keying a backup to a device ID stored in `localStorage` would be useless in the exact scenario the feature exists for — a cleared browser takes the key with it. Hence a code the user holds themselves.
- Cloud backup settings are treated as device-specific, like the push subscription and bedtime reminder: restoring a backup never silently re-points a new device at someone else's backup slot.
- Restore reuses the same import path as the file restore, so both inherit identical handling of device-specific settings rather than drifting apart.

### Known tradeoff
Anyone holding a recovery code can read that backup. The codes are crypto-random with roughly 5.9e14 combinations, and the endpoint has no enumeration, so this is acceptable for a closed test group — but it is not a substitute for real accounts. Proper per-user auth remains the Phase 2 item in the roadmap.

### Testing
354 checks across four suites, including a new end-to-end browser test that runs a live API, logs data on one browser context, then restores it on a completely separate context that has never seen the data — simulating an actual lost phone rather than asserting on internals. That test also caught a real flaw in its own setup: the app's `config.js` overwrites injected test config, which had silently pointed the first run at the production Worker.

---

## [3.1.0] — 2026-08-15

Refocusing release. First pass at aligning the app to its three core jobs: easy entry, reminders to log, and motivation to hit goals.

### Added
- **One-tap logging.** The dial now has a "Log 16oz" button right on it. Logging a single thing no longer routes through the full multi-field form — that's now a secondary "Add details instead" link for when you actually need a description or a custom time. Cuts the most common action in the app from four taps to two.
- **Progress-aware nudges.** The in-app reminder used to say "time to log your stats" regardless of what you'd done. It now says something specific and true: "38oz of water to go", "Almost there — just 12g of protein left", or in the evening "…last stretch of the day". It picks whichever metric is furthest behind proportionally, so it names one concrete thing rather than listing everything. If all goals are met, it congratulates instead of nagging.
- **Goal celebrations.** The log entry that pushes you over a goal now says "water goal hit for today!" instead of a plain confirmation. Only the crossing celebrates — logging again afterward goes back to a normal toast.

### Changed
- **Scope discipline on the landing page.** Removed "Community Connection" from the roadmap entirely — social features are a different product, and nothing about them serves entry, reminders, or motivation. Rescoped the "AI Coach" description away from "recommendations to improve" (health-coach territory, and a liability surface for AI-generated health advice) toward what's actually on-thesis: encouragement from your own numbers, and a clean summary to share with a doctor or coach.

### Fixed
- The day-streak calculation used `Number(e.oz)` directly, which returns `NaN` for sleep, weight, and supplement entries since those have no `oz` field — a single one of those in a day would poison the whole total and silently break the streak. Now uses the same helper the rest of the app uses.

### Context
This is the first release driven by strategic reassessment rather than feature requests. The app had grown well past its original job, and function 3 (motivation to actually consume) was named as a core pillar but was essentially unbuilt. These are the pieces of that which needed no architectural change. The larger items — server-side progress data for smart push notifications, and accounts with real sync — are deliberately held until tester feedback arrives.

---

## [3.0.0] — 2026-08-15

Three design refinements, the biggest being a real navigation restructure — bumping to 3.0 since this changes how the whole app is organized, not just what's on one page.

### Changed
- **Tracker cards more compact** — trimmed internal padding and spacing (not font sizes or gauge sizes) so all four trackers plus both action buttons fit on a standard phone screen without scrolling.
- **"Log My Weight" → "Log Weight"**, and the weight dial now has its own editable time field, so a weight logged after the fact lands at the right time in Today's Log rather than always using the current moment.
- **New "Today" tab**, positioned right after Log — Today's Log (the full list of everything logged, with edit/delete) moved off the Log page onto its own dedicated page, now that it was getting long enough to deserve one.
- **Remind is no longer its own tab** — all of it (push notifications, bedtime reminder, supplement reminder, in-app nudge, calendar backup) now lives inside Settings, positioned between Supplements & Prescriptions and Backup, under a new "Reminders" section label.

### Fixed
- A toast message and a line in the in-app tutorial both still referred to "the Remind tab" by name — now that it's not a tab anymore, both were updated to point to Settings instead, so the app doesn't send anyone looking for a page that no longer exists.
- Removed a redundant date header on the new Today tab — the app already shows "Day Tracker: [date]" globally on every page, so an extra "Today: [date]" directly underneath it was just clutter, caught via an actual screenshot before shipping.

### Testing note
Moving Today's Log to its own tab broke a large number of existing tests that assumed the log list lived on the Log page — each one needed the same fix (navigate to Today to check the list, then back to Log to continue). Along the way, also hit and fixed a subtler issue: switching tabs unmounts and remounts the Log page's component, which invalidates any previously-captured references to its buttons — a couple of fixes needed re-querying elements fresh rather than reusing ones captured before the tab switch. All three suites (259 app checks, 41 Worker checks, plus the real-browser drag test) confirmed clean before packaging, and the actual spacing goal (fitting the Supplements button on screen) was confirmed with a real screenshot at a standard phone size, not just trusted from the CSS math.
