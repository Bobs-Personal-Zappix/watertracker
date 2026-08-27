# HydroPro Tracker — Current State

**Orientation card for a new conversation.** Answers "what exists right now" so it doesn't have to be rediscovered. Update when any of it changes.

*As of: August 27, 2026 · Deployed version: 3.59.0*

---

## What's live

**URLs**
- `hydroprotracker.com` — public landing page.
- `hydroprotracker.com/app/` — the tracker, gated by **Cloudflare Access** (email allowlist, closed testing group only).
- Worker on its own `workers.dev` domain — deliberately ungated, which is what makes doctor-share links reachable without a login.

**Tracked metrics (9 tiles as of v3.52.0, all with percentage progress rings except Weight)**
Water · Protein · Calories · Sleep · Weight · Exercise · Treatments · Prescriptions · Supplements — this is still the underlying set of 9, but as of v3.59.0 the *display order* on Log It! is Water/Protein/Calories/Sleep/Weight/Exercise/Treatments/Prescriptions/Supplements followed by the 3 fast-entry tiles (Voice Tracker/Presets/Meal Entry) — see Log It! below. Prescriptions and Supplements were one combined "RX & Supplements" tracker through v3.51.0 (renamed from "RX & Vitamins" in v3.47.0); v3.52.0 split them into two fully independent trackers, and v3.58.0 finished the split's visual work — My Day's full-detail grid shows two independent tiles instead of one combined tile. "RX" is now the umbrella term covering all three of Treatments/Prescriptions/Supplements (used for the nav tab and the RX page, which shows all three as sections); "Prescriptions" is the individual tracker's own label everywhere else — see below and `docs/DECISION-LOG.md` `TRACK-01`'s v3.58.0/v3.59.0 amendments. As of v3.50.0, these display very differently on Log It! (compact) vs. My Day (full detail) — see below.

**Tabs:** **My Day** · Log It! · RX · Stats · My Plan · Settings — 6 tabs, nav order as of v3.59.0
(My Day and Log It! swapped positions per Rob's explicit request — the app still boots on Log It!
by default). "Today" was renamed "My Day" in v3.59.0 (nav tab, "My Day at a Glance" section,
"My Day's log" section, header context label) — generic calendar-day words ("due today," the date
pill's TODAY badge) are unrelated and unchanged. RX (icon `Pill`, between Log It! and Stats) briefly
read "Prescriptions" in v3.58.0; Rob clarified RX is meant as the umbrella term for all three
trackers it groups (Treatments/Prescriptions/Supplements) and asked for the tab label back — v3.42.0
had swapped Today first before v3.42.1 reverted it; v3.59.0's My Day/Log It! swap is a distinct,
explicitly-requested decision, not a regression of that revert. My Day's Voice Entry tile (renamed
from "Voice Assistant" in v3.50.0) was removed from My Day in v3.48.0 (Log It! keeps its own copy);
My Day now also shows Log It!'s full-detail 9-tile tracker grid (same component, same toggles, same
tap behavior, goal/logged text, hero numbers, and low-supply/near-expiry alerts all intact). As of
v3.49.0, My Day's order is "My Day at a Glance" → the tracker grid → "My Day's log" — the "Remaining
RX/Treatments" section that used to sit between them was removed from My Day entirely and moved to
the RX page.

**Log It! rebuilt again (v3.51.0, Track 1 of a 2-part brief)** — pure fast-entry, now with a real
date control and a redesigned tile grid:
- **Date pill** under the header (Log It! only — every other tab's date text is unchanged),
  centered on screen: `Wed, Aug 26 [TODAY]`, badge reads TODAY/YESTERDAY/PAST DAY. As of v3.53.0,
  tapping the pill opens a native calendar (`<input type="date">`) rather than stepping via
  chevrons — the whole pill is the tap target. Off-today, the pill goes amber, every entry sheet
  shows an amber "Saving to <date>" bar, and toasts append the date. This is a second, independent
  path for prior-day logging alongside — not a replacement for — Stats' existing prior-day/backfill
  picker.
- **Unified 4×3 grid, borderless** (transparent at rest, subtle wash on press) — as of v3.57.0,
  Voice Tracker/Presets/Meal Entry are no longer a separate top row: they're 3 tiles inside the
  same grid the 9 trackers render into (12 tiles total with all trackers enabled — a true
  4-row × 3-column, evenly spaced grid), per Rob's real-device feedback that the divider between the
  two sections should go and the whole thing should read as one grid. As of v3.59.0, those 3 tiles
  sit at the **end** of the grid rather than the start — Water/Protein/Calories/Sleep/Weight/
  Exercise/Treatments/Prescriptions/Supplements lead, Voice Tracker/Presets/Meal Entry trail — per
  Rob's testing feedback that users prefer the core trackers up top. Voice Tracker opens a new
  non-functional preview sheet (text field + decorative mic icon, no parser — still not Smart
  Entry). Presets and Meal Entry open the same sheets they always have. Icons are a flat `102px`,
  matching every tracker tile's icon/ring size exactly; labels are `16.5px`. The old 2-column
  fallback for ≤4 enabled trackers was dropped — the grid is never that sparse now that 3 tiles are
  always present. As of v3.57.0, Presets (`presets-v3.png`) and Meal Entry (`meal-entry-v3.png`)
  use Rob-supplied artwork that arrived as real transparent PNGs (verified: corner alpha 0, no
  checkerboard/JPEG-recompression artifact, so no chroma-key script was needed this round, just
  crop-to-content/pad-to-square/resize-to-480 like every other icon) — superseding the v3.54.0
  chroma-keyed versions. Voice Tracker (`voice-tracker-v3.png`, v3.56.0) is unchanged this round,
  via a checkerboard-specific script after an earlier version turned out to be sourced from outdated
  artwork with text baked in (see `docs/DECISION-LOG.md` `UX-38`). All three were visually inspected
  before shipping, not just alpha-checked.
- **Redesigned ring, Log It!-only** (My Day's full-detail rendering is unchanged) — a real neutral
  track ring under the accent fill (previously the "track" was just a dimmed copy of the fill
  color), a goal-met state (clamped arc, squared cap, glow, check badge). Weight's compact tile is a
  reading, not a percentage-of-goal tracker, so it uses `imageOnlyTile` instead of the percentage
  ring `lO` uses: artwork + label + a checkmark badge when a reading exists today. As of v3.59.0 it
  also gets a rounded-square completion ring (border + glow, `.wt-gauge-imageonly-lit`) around the
  icon when a reading exists today — a CSS-only treatment, not `lO`'s SVG ring (which is circular by
  construction and didn't fit Weight's square icon) — matching Supplements' glow-on-completion look
  while keeping the existing checkmark badge alongside it, per Rob's explicit request. This
  supersedes the original v3.51.0 reasoning ("a ring implies progress that doesn't exist for a
  reading") — not an oversight, a deliberate reversal after real-device feedback.
- **Quick-add chips** in every accumulating-tracker sheet (Water/Protein/Calories/Sleep/Exercise);
  Treatments/Prescriptions/Supplements keep their existing tap-to-select-item chips. Primary buttons
  relabel to "Add to <tracker>" (Weight: "Save weight"; meal sheet: "Log meal").
- `MO`, the tile-grid component shared with My Day, kept its `compact` prop from v3.50.0 for all of
  this — My Day's usage and rendering path are unchanged and were verified byte-identical.
- **Track 2 of this brief shipped in v3.52.0** — see below.

**RX and Supplements split into two independent trackers (v3.52.0)** — previously one combined
"RX & Supplements" tracker (`settings.supplements`, items tagged `category: 'vitamin'|'rx'`).
- **Data model:** `settings.rx` (new array) is seeded from *all* pre-existing combined items
  (former vitamins and RX alike) — Rob's explicit call, since no real RX usage existed yet in
  testing. `settings.supplements` (same key, retargeted) is the new tracker and starts empty. New
  `showRx` toggle (default on); `showSupplements` now gates the new tracker specifically.
  `SCHEMA_VERSION` 2→3; migration is idempotent and keeps a temporary
  `settings.__preMigrationSupplementsBackup` rollback snapshot for one release cycle.
- **Genuine new `"rx"` log-entry type** (not a shared type with a tag) — its own reload-normalizer
  guard, undo-on-delete branch, backfill section (new "RX" section in "Enter Missed Items",
  alongside "Supplements"), edit-routing, and entry sheet.
- **Log It!'s grid**: "RX & Supplements" is now two tiles, "RX" (existing icon/color, all migrated
  history) and "Supplements" (new icon Rob supplied, new lime-green `--supplements` token, starts
  empty).
- **Today stays visually unchanged**, but its combined "RX & Supplements" tile and "Today at a
  Glance" due-count callout now correctly sum both trackers again (a fix, not a new feature — the
  data-model split alone would have silently narrowed Today to RX-only numbers under an unchanged
  label).
- **My Plan**: "What I'm Tracking" list's combined row split into independent "RX"/"Supplements"
  rows+toggles; the "Self-Managed RX" section's two cards read straight from the two arrays now
  (no more `category` filtering); "Vitamins & Supplements" card relabeled "Supplements".
- **Known, accepted limitation:** log entries created before this migration stay tagged
  `type: "supplement"` regardless of which item they referenced, so a pre-migration dose of what is
  now an RX item won't retroactively count toward RX's "taken today" state if backfilled onto
  today's date. Low-risk given the trial-data context.

**Shipped features**
- Drag-dial entry, one-tap logging, presets, combined multi-metric entries
- Sleep with start/finish session tracking across midnight
- Supplements and Treatments, both with recurring schedules. Next-due-date editing lives on My
  Plan's RX tile only as of v3.45.0 (Vitamins & Supplements are implicitly daily, no schedule to
  edit); Treatments have no next-due-editing UI anywhere in the app right now — see Known outstanding.
- Inventory/subscription tracking on supplements and treatments (remaining count, expiration, low-supply and near-expiry alerts, auto-decrement on log, auto-restore on delete). Treatments also carry an optional provider/source field; Prescriptions items also carry optional pharmacy and refills-remaining fields (v3.46.0) — all entered on My Plan, surfaced on the RX page (moved there from My Day's "Remaining RX/Treatments" section in v3.49.0).
- **RX page (v3.49.0)** — titled "SCRIPTS FOR: {date}", the single place to see everything a user
  is subscribed to or prescribed; "RX" here is the umbrella term for all three trackers it sections.
  Three sections: Treatments, Prescriptions, Supplements (renamed from "Vitamins & Supplements" in
  v3.59.0 for consistency with the label used everywhere else) — lists every item of that type, not
  just inventory-tracked ones. Treatments and Prescriptions items can carry an optional partner logo
  + link (entered on My Plan next to provider/pharmacy); when both a name and a logo are set, the
  item renders as a partner-branded card instead of plain text — the first step toward the "promote
  our partners" direction. Supplements have no partner concept.
- Past-days log viewer ("Edit Prior Days Logs" tile on Stats, between Sleep Over Time and Health
  Summary, as of v3.48.0 — moved off My Day, where it used to live behind a small calendar-icon
  button); past-day entries are deletable
- "Enter Missed Items" backfill on any past day (Stats → Edit Prior Days Logs → day → button)
- Stats: day/week/month views per metric, All-3 comparison, weight and sleep trend lines. The
  Subscriptions panel was removed in v3.46.0 — superseded first by Today's "Remaining
  RX/Treatments" section, then by the RX page as of v3.49.0.
- Health Summary → printable/PDF doctor summary, plus shareable snapshot links (90-day expiry, no account needed to open) — at the bottom of Stats
- Push notifications: interval reminders (progress-aware, suppressed if recently logged), bedtime, supplement, treatment
- In-app feedback form with push alerts to watchers
- Accounts: email magic-link sign-in, session revocation
- Backup: automatic account backup, recovery-code cloud backup, manual JSON file export/import, CSV export
- In-app tutorial (lives in Settings)
- Profile page (Full Name, Email, Phone, photo upload) — reached only via the header profile icon,
  local-only storage (`settings.profile`), not tied to account sign-in

---

## Stack

| Layer | What |
|---|---|
| Frontend | React 18 PWA, single bundle, esbuild, no router |
| Charts | Recharts v2.15.4 (majority of bundle weight; only Stats needs it) |
| Icons | lucide-react |
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Worker (`water-tracker-push`), cron every 5 min |
| Database | Cloudflare D1 — `account_backups`, `shares`, `user_activity`, plus auth/session tables |
| KV | Push subscriptions, feedback entries (`feedback:` prefix), recovery-code backups |
| Email | Resend, via `env.RESEND_API_KEY` (secret, never committed) |
| Push | Web Push + VAPID |

Bundle is ~702KB minified, ~180KB gzipped.

---

## Repo and deploy

```
src/app.js             SOURCE OF TRUTH — edit this, then build
src/App.jsx            STALE legacy file (pre-v3.13.0). Reference only. Never build from it.
esbuild.config.js      Build pipeline — run: node esbuild.config.js
site/app/bundle.js     Deployed artifact — overwritten with bundle.build.js after verification
site/app/              config.js, index.html, manifest.json, service-worker.js,
                       gauges/, icons/, tile-icons/
worker/src/worker.js   Cloudflare Worker: push, auth, shares, account backup, 15-min cron
tools/harness.js       jsdom smoke-test harness
docs/                  DECISION-LOG.md, CURRENT-STATE.md, ROADMAP-v2.md
voice-tracker-tile/    standalone HTML/CSS/JS Voice Tracker component (not wired into the app)
CHANGELOG.md
```

**Deploy pipeline (all 5 steps required every time):**
1. `node esbuild.config.js` → produces `site/app/bundle.build.js`
2. `node tools/harness.js site/app/bundle.build.js` — must boot clean
3. `npm run lint:bundle` — confirm no-undef count (baseline: 11 pre-existing vendor errors)
4. Copy `bundle.build.js` → `site/app/bundle.js`
5. Re-run harness and lint against the exact shipped `bundle.js`

**Development environment:** WSL2 + Claude Code (`OPS-04`, `OPS-05`) — fully operational as of Aug 19. Front-end deploy: commit `site/app/bundle.js` + `CHANGELOG.md`, `git push`; Cloudflare Pages serves from the repo. Worker deploy: `wrangler deploy` from `worker/` — separate step (`OPS-09`). D1 migrations: `wrangler d1 execute hydropro-db --remote --file=<migration>` from `worker/`; run by Rob, never by Claude Code.

**Service worker is network-first** (deliberate — an earlier cache-first version stranded users on stale builds). `_headers` forces no-cache on `/app/*`.

---

## Testing assets

- **`tools/harness.js`** — jsdom smoke-test harness, boots the real bundle and drives the UI. Run with `node tools/harness.js site/app/bundle.js`. Environment gotchas documented at the top of the file.
- **`tools/harness.txt`** in project knowledge — copy of the harness for reference; save as `.js` to run.
- **`dial-drag-test.py`** — Playwright test for drag-dial geometry, in repo.
- **~578-check jsdom suite** — in repo, runs against `src/app.js`. Now that ARCH-OPEN-01 is complete and `src/app.js` is the source of truth, this suite is meaningful again — but always re-run the harness against the deployed `bundle.js` as the final verification step.

---

## Standing risks (none have a deadline; all will drift if not raised)

1. ~~**Source drift.**~~ **RESOLVED** — `ARCH-OPEN-01` complete Aug 20. `src/app.js` + `esbuild.config.js` are the source of truth. `src/App.jsx` is a known-stale legacy artifact, clearly labelled.
2. **Data-loss exposure.** A user's history lives in one browser's `localStorage`. Cloud backup is opt-in. Someone clearing site data or switching phones without a backup loses everything. → `ARCH-OPEN-04`
3. **No error monitoring.** Crashes are discovered only when a tester reports them. A blank white screen is otherwise invisible.
4. **No analytics.** D1/D7/D30 retention — the only metric that matters for a tracker — cannot currently be measured.
5. **Single-blob data model.** History is one JSON blob in `account_backups.data`. Cannot answer any aggregate or per-clinic question, which is the entire B2B proposition. → `ARCH-OPEN-02`
6. ~~**Schema fragility.**~~ **RESOLVED** — `ARCH-OPEN-05` complete Aug 20. `migrate()`/`deepMergeDefaults` replaced the hand-maintained field whitelists. New fields require one line in defaults, not four scattered additions. *Addendum Aug 25 (v3.49.0):* found and fixed a second-level instance of the same bug class — the per-item array normalizers (`US()`, `normalizeTreatments()`) had their own hand-maintained whitelists that were silently dropping `category`/`pharmacy`/`refillsRemaining`/`provider` on every boot and backup restore. `deepMergeDefaults` doesn't reach into arrays field-by-field, so these normalizers remain a manual whitelist — any future field added to a supplement or treatment item must be added there too, not just in the add/edit handler. See `docs/DECISION-LOG.md` `ARCH-OPEN-05` addendum.
7. **Legal/compliance unaddressed.** FTC Health Breach Notification Rule and state consumer-health-privacy laws apply to consumer health apps; the clinic path may trigger HIPAA obligations. PROD-09 (backfill provenance) is the first field added specifically for clinic reporting — legal consult should precede clinic pilot. → `LEGAL-OPEN-01`
8. **Cloudflare Access can't scale** past an invited list. Magic-link auth is built but Access is still the gate. → `ARCH-OPEN-04`
9. ~~**Header rendering bug.**~~ **RESOLVED** — a black-box artifact intermittently covered the
   header (profile icon, logo, app name) after uploading a profile photo, clearing on tab switch
   then randomly recurring. Root cause: `filter:drop-shadow` on the logo badge, a known WebKit
   repaint-artifact trigger. Removed in v3.42.1; Rob confirmed on real device (Aug 23) the artifact
   has not recurred since.

---

## What shipped Aug 23, 2026 (v3.40.4)

Follow-up polish from Rob's review of v3.40.3, all in `CHANGELOG.md`:
- Voice Tracker badge nudged left again (`margin-right` 20px → 26px), still fine-tuning toward
  alignment with the rings below.
- "Use Your Presets"/"Manually Log a Meal" buttons restyled: transparent background, 2px colored
  outline (gold / protein-green respectively, same colors moved from fill to outline), tan
  (`var(--ink-inverse)`) text and icon color.
- Header profile icon moved further left (`margin-left:-14px`) to rebalance the header now that the
  AI icon is gone.
- RX & Vitamins tile: "0 of 2 taken today" → "0 of 2 taken" — the extra word was pushing that tile's
  layout out of alignment with the other 7.
- Full 5-step verification pipeline re-run and passed against the exact shipped `bundle.js`. **Not
  yet verified on a real device** — jsdom can't confirm badge alignment, button contrast, header
  spacing, or the RX tile's resulting size match.

## What shipped Aug 27, 2026 (v3.59.0)

Rob's follow-up feedback after using v3.58.0, plus a Log It! tile reorder and a new Weight
completion indicator. Full detail in `CHANGELOG.md`.

- "RX" nav-tab label restored (was "Prescriptions" in v3.58.0) — RX is the umbrella term for all
  three trackers it groups; the individual Prescriptions tracker keeps its own label elsewhere.
- "Today" renamed "My Day" everywhere (nav tab, "My Day at a Glance", "My Day's log", header
  context label) — generic calendar-day words untouched.
- Log It! and My Day swapped nav positions (My Day first) — re-requested explicitly by Rob after
  this same swap was tried and reverted in v3.42.0/v3.42.1; not a regression of that revert.
- Log It!'s compact grid reordered: Voice Tracker/Presets/Meal Entry moved from first to last.
- Weight's compact tile gained a rounded-square completion ring (border+glow) alongside its
  existing checkmark badge, matching Supplements' glow-on-completion look — supersedes the original
  v3.51.0 "no ring for readings" reasoning by explicit request, not by oversight.
- RX page's "Vitamins & Supplements" section renamed "Supplements" for consistency.
- `tools/harness.js`: every `nav("Today")` → `nav("My Day")`; nav-order and grid-order checks
  updated; new coverage for the Weight completion ring (unlit → lit after logging, badge still
  present).
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. One pre-existing,
  unrelated stale check still fails (`wt-tile-togo`, documented since v3.44.0).
- **Not yet verified on a real device**: the nav swap's real-world feel, the grid reorder's effect
  on daily habit, and the new completion ring's visual proportions.

## What shipped Aug 27, 2026 (v3.58.0)

Continues the Prescriptions/Supplements separation started by `TRACK-01` (v3.52.0). Full detail in
`CHANGELOG.md` and `docs/DECISION-LOG.md` (amends `TRACK-01`/`PROD-13`/`UX-24`/`UX-28`).

- Today's combined "RX & Supplements" full-detail tile split into two independent tiles
  (Prescriptions, Supplements), reusing `computeTrackerStats()`'s already-independent fields — no
  new stat computation needed, just new JSX. Tile order: Treatments, Prescriptions, Supplements,
  matching Log It!'s existing order.
- "Tracked So Far" alert row split the same way (independent Prescriptions-due / Supplements-due
  rows instead of one combined row).
- "RX" relabeled "Prescriptions" everywhere it was a user-facing label: Log It!'s compact grid,
  My Plan's tracker row, the RX entry sheet, the bottom-nav tab, the Backfill sheet disclaimer.
  Internal identifiers (`settings.rx`, route key `"rx"`, etc.) unchanged — label rename only.
- My Plan's "Self-Managed RX" section header became "Self-Managed Prescriptions & Supplements"
  (not "Self-Managed Prescriptions" as first planned — that section wraps both trackers' cards).
- `tools/harness.js`: every existing "RX"/"RX & Supplements" assertion updated; tile-count checks
  bumped 8→9 everywhere Today's/Log It!'s full tracker set is asserted; new regression check
  confirms Prescriptions and Supplements tiles show independent, non-summed numbers.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. **Not yet verified on a
  real device** — Today's new two-tile layout, and specifically the "Prescriptions" nav-tab label's
  fit in the tight 6-tab nav row (explicitly flagged by Rob before shipping).
- Explicitly out of scope (future session): partner configuration for Treatments/Prescriptions, any
  Stats-page additions for these three trackers.

## What shipped Aug 27, 2026 (v3.57.0)

Log It!'s top row (Voice Tracker/Presets/Meal Entry) merged into the tracker grid, per Rob's
real-device feedback. Full detail in `CHANGELOG.md`.

- Standalone `TopRow`/`TopRowItem` components and the `.wt-toprow` divider removed; Voice Tracker/
  Presets/Meal Entry are now the grid's first 3 tiles via the same `compactTile()` helper, using a
  new `.wt-tile-plain-img` (102×102) image variant in place of a ring.
- Grid is now always a single `wt-trackers-grid-compact` (2-column fallback removed — never sparse
  enough to need it with 3 fixed tiles always present); gap made uniform, top margin removed to
  close the seam where the divider used to sit.
- `tools/harness.js` updated: tile-count checks bumped (7→10 at boot, 9→12 all-on), new checks
  confirm no `.wt-toprow` remains and that the grid's first 3 tiles are Voice Tracker/Presets/Meal
  Entry in document order.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. One unrelated
  pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0; confirmed present
  on the untouched v3.56.0 bundle too). **Not yet verified on a real device** — the "evenly spaced
  4×3 grid" outcome is exactly what jsdom can't confirm.
- **Presets/Meal Entry/Weight icon artwork replaced.** Rob sent all three, one at a time, later in
  the same session; each verified as a real transparent PNG (corner alpha 0, no checkerboard/JPEG
  artifact) before use — no chroma-key script needed this round, just the standard crop/pad/resize
  to 480×480. New files: `presets-v3.png`, `meal-entry-v3.png`, `weight-v2.png` (old versions
  removed). Weight's new artwork updated in both its Log It! and Today renderings for consistency.

## What shipped Aug 27, 2026 (v3.56.0)

Correction to v3.54.0/v3.55.0: the Voice Tracker "stale image" report wasn't a caching bug — this
session had been chroma-keying an outdated source image (with text arced across the top) instead
of the text-removed version Rob had already sent. Full detail in `CHANGELOG.md` and
`docs/DECISION-LOG.md` `UX-38`.

- **Voice Tracker icon replaced with the correct artwork.** Rob's latest upload was a JPEG with a
  baked-in checkerboard (the same transparency-preview-screenshot issue as earlier rounds), which a
  single-color chroma-key can't isolate — wrote a checkerboard-specific script (detects the two
  actual checker tones sampled from the file, ~205 and ~255 gray) and reused the v3.54.0 crop/pad/
  resize pipeline. Result visually inspected this time, not just alpha-checked.
- File renamed again (`voice-tracker-v2.png` → `voice-tracker-v3.png`).
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js`. **Not yet
  verified on a real device.**

## What shipped Aug 27, 2026 (v3.55.0)

Two follow-ups from Rob's v3.54.0 real-device check. Full detail in `CHANGELOG.md`.

- **Cache-busted the three top-row icon files** (renamed to `-v2` filenames) — Rob still saw
  Voice Tracker's old white-background image after v3.54.0 shipped; the committed file was already
  correct (re-verified), so this was a stale cached copy of the old asset, not a code bug. Renamed
  all three (not just Voice Tracker) so the same issue can't recur silently for the other two.
- **Top-row icon/label sizing now matches the 3×3 grid exactly** (102px icons, 16.5px labels, both
  flat values instead of the previous responsive/smaller ones), per Rob's explicit request.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js`. **Not yet
  verified on a real device.**

## What shipped Aug 27, 2026 (v3.54.0)

Real-device review round 2 for Log It!, plus a header layout change — all per Rob's direct
feedback. Full detail in `CHANGELOG.md` and `docs/DECISION-LOG.md` (amends `UX-34`/`UX-35`).

- **Top-row icon backgrounds fixed programmatically** — a one-off Node script (`pngjs`) chroma-keys
  each image's background to transparent, crops to content, and normalizes all three to an
  identical 480×480 square canvas so they render the same size and stay level with each other.
  Applied after three rounds of manually-supplied replacement images were all unusable (see
  `UX-35`). Verified programmatically (corner alpha 0, center alpha 255); actual edge quality still
  needs Rob's eyes.
- **3×3 grid bigger again** (102px/122px icons, 16.5px/17.5px labels) with tighter tile/grid
  spacing to make room, per Rob's explicit request.
- **Header rearranged**: brand (logo+title) now sits at the far left edge; profile icon now sits at
  the far right edge (previously: profile pinned left with a `-14px` nudge, brand centered).
- `tools/harness.js`: new coverage for the header reorder.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js`. **Not yet
  verified on a real device.**

## What shipped Aug 27, 2026 (v3.53.0)

Real-device review round 1 fixes for the Log It! redesign, per Rob's feedback. Full detail in
`CHANGELOG.md` and `docs/DECISION-LOG.md` (amends `UX-30`/`UX-31`/`UX-32`).

- **Date pill**: fixed a genuine `offsetDays` sign-inversion bug (yesterday was showing "PAST DAY"
  instead of "YESTERDAY" since this was first built) — caught by a new harness test written for
  this fix. Centered on screen (`.wt-header`'s `:only-child` case wasn't centering). Chevrons
  replaced with a native `<input type="date">` calendar picker covering the whole pill, reusing the
  same pattern already used in `BackfillSheet`/RX expiration fields elsewhere in the app.
- **Top row**: icon boxes shrunk ~⅓, row padding/margin trimmed to free space for the grid.
- **3×3 grid**: icons and labels bumped up meaningfully (see above).
- **Top-row icon artwork still unresolved** — three rounds of images from Rob were all unusable
  (opaque background, then a JPEG, then JPEGs with a transparency-preview checkerboard baked into
  the pixels instead of real alpha). None applied; see Known Outstanding.
- `tools/harness.js`: new dedicated `DatePill` coverage.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 516 checks pass, up from 503), lint unchanged at the 11-error vendor
  baseline. One unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since
  v3.44.0). **Not yet verified on a real device** — this entire pass is visual/interactive and
  jsdom cannot confirm any of it.

## What shipped Aug 27, 2026 (v3.52.0)

Track 2 of Rob's Log It! redesign brief: RX and Supplements split into two independent trackers.
Full detail in `CHANGELOG.md` and `docs/DECISION-LOG.md` `TRACK-01`.

- `settings.rx` (new array, seeded from all pre-existing combined items) + `settings.supplements`
  (retargeted, starts empty) + `showRx` (new toggle) + `SCHEMA_VERSION` 3 migration with a temporary
  rollback snapshot.
- New `"rx"` log-entry type with full new-entry-type treatment (reload guard, backfill, undo,
  edit-routing, dedicated sheet).
- Log It! grid: "RX & Supplements" → "RX" + "Supplements" tiles. Today unchanged visually; its
  combined tile's numbers fixed to keep summing both trackers.
- My Plan: "What I'm Tracking" row split; Self-Managed RX cards read the two arrays directly;
  "Vitamins & Supplements" card relabeled "Supplements".
- `tools/harness.js`: extensive updates — seed-data migration assertions, independent add/edit/
  delete coverage for both trackers, tile/card counts, backfill coverage for RX specifically,
  reload-persistence checks moved off the removed `category` field.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 503 checks pass, up from 498), lint unchanged at the 11-error vendor
  baseline. One unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since
  v3.44.0). **Not yet verified on a real device.**

## What shipped Aug 26, 2026 (v3.51.0)

Log It! redesign, Track 1 of a 2-part brief from Rob (Track 2 — RX/Supplements split — is a
separate, not-yet-built pass): date pill, top-row rebuild, borderless grid, ring redesign,
quick-add chips. Full detail in `CHANGELOG.md` and `docs/DECISION-LOG.md` `UX-30`–`UX-33`.

- New `logDate`/`entryTargetDate` app-shell state threads the selected day through every entry
  sheet's write path on Log It! (previously all hardcoded to today); Today's sheets continue to
  target today regardless. Stats' own prior-day/backfill picker is untouched.
- Voice Entry/Use Presets banner tiles removed from Log It!, replaced by a 3-item bare-artwork top
  row (Voice Tracker/Presets/Meal Entry) using images Rob supplied
  (`site/app/tile-icons/voice-tracker.png`, `presets.png`, `meal-entry.png`). Voice Tracker opens a
  new non-functional preview sheet (text field + mic icon, no parser).
- Grid borders/backgrounds removed; Meals tile moved out of the grid to the top row, so the grid is
  back to one tile per tracker (8 with all enabled); 2-column fallback at ≤4 enabled trackers.
- Ring redesign scoped to Log It! only (Today verified unchanged): real neutral track ring, goal-met
  clamp/glow/badge state, ring-less mode for Weight.
- Quick-add chips in Water/Protein/Calories/Sleep/Exercise sheets; button relabels to "Add to
  <tracker>" throughout.
- Found and fixed in passing: the in-app Settings "Version" string had been stuck at "3.39.1" since
  that release, missed by every subsequent version bump. Now tracks the real deployed version.
- `tools/harness.js` updated: tile-count expectations, presets/meal-entry trigger selectors, and the
  water quick-dial submit-button text all updated for the new structure.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 498 checks pass, matching the v3.50.0 baseline), lint unchanged at the
  11-error vendor baseline. One unrelated pre-existing stale check still fails (`wt-tile-togo`,
  documented since v3.44.0). **Not yet verified on a real device** — jsdom can't confirm the grid's
  on-device fit (the `100dvh`/flex one-screen-sizing pass is implemented but unverified), the ring's
  visual proportions, or the top-row art's crop/scale.

## What shipped Aug 25, 2026 (v3.50.0)

Log It! reduced to pure fast-entry per Rob's direction, now that Today and the RX page both show
full tracked-metric detail:
- Log It!'s 8 tracker tiles compacted to icon+ring+name only (3x3 grid), 9th slot filled by a new
  "Meals" tile absorbing "Manually Log a Meal." "Use Your Presets" became a full-width "Use
  Presets" tile below the grid, matching the top "Voice Entry" tile's layout (renamed from "Voice
  Assistant") in a blue rather than gold treatment. `MO` (shared with Today) gained a `compact`
  prop; **Today's tile grid is unaffected** — full detail (goal/logged, hero numbers,
  low-supply/near-expiry alerts) unchanged there.
- Meals' ring is a placeholder (static circle, `Utensils` icon, Protein green) — flagged to Rob
  that a real illustrated "gem" asset like the other 8 tiles have would need to be supplied or
  commissioned separately.
- `tools/harness.js`: `tiles()` helper broadened to match both tile classes; full-detail-only
  checks redirected to Today; Log It!-specific checks (Voice Entry, Meals, Use Presets triggers)
  updated for the new structure.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 498 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0). **Not
  yet verified on a real device** — jsdom can't confirm 3x3 grid sizing/spacing, the Meals
  placeholder ring's look, or the Use Presets tile's visual read next to Voice Entry.

## What shipped Aug 25, 2026 (v3.49.0)

New "RX" nav page (`UX-28`) per Rob's direction, plus a data-loss bug fix found while building it:
- New 6th bottom-nav tab "RX" (icon `Pill`, between Today and Stats), titled "SCRIPTS FOR: {date}".
  Three sections — Treatments, Prescriptions, Vitamins & Supplements — listing every item of that
  type (not just inventory-tracked ones, a real scope increase over the section it replaces).
- "Remaining RX/Treatments" removed from Today entirely; its content moved to and expanded into
  the new page. Today's order is now "Today at a Glance" → 8-tile grid → "Today's log".
- New optional "Partner logo" (image upload, same canvas-downscale pipeline as the Profile photo)
  and "Partner link" (URL) fields on Treatments and RX-category prescriptions (not offered on
  Vitamins & Supplements). When both a provider/pharmacy name and a logo are set, the item renders
  as a partner-branded card on the RX page instead of plain text.
- **Bug fix:** the settings normalizer run on every app boot and backup restore (`US()` for
  supplements, `normalizeTreatments()` for treatments) was silently stripping `category`,
  `pharmacy`, `refillsRemaining` (supplements) and `provider` (treatments) on every reload —
  confirmed present in the previously-deployed bundle. Fixed; see `docs/DECISION-LOG.md`
  (`ARCH-OPEN-05` addendum). `tools/harness.js` now seeds a pre-existing RX item and treatment
  with these fields already set, so the harness's normal boot doubles as the reload-persistence
  regression test.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 495 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0). **Not
  yet verified on a real device** — jsdom can't confirm 6-tab nav crowding at the 420px max nav
  width, partner logo crop/scale, or general visual/spacing of the new page.

## What shipped Aug 24, 2026 (v3.48.0)

Three Today/Stats changes per Rob's direction (`UX-27`):
- Voice Assistant tile removed from Today (stays on Log It! only); the sections below it shift up.
- Log It!'s 8-tile tracker grid duplicated onto Today, between "Remaining RX/Treatments" and
  "Today's log" — same component, tap handlers, entry sheets, and per-tracker My Plan toggle
  behavior as Log It!, without duplicating Log It!'s presets/manual-log action buttons.
- "Prior Days" moved from Today to Stats (between Sleep Over Time and Health Summary), renamed
  "Edit Prior Days Logs," rebuilt as one large tappable card with bigger label text (13px → 20px)
  and a bigger calendar icon (24px → 32px, clock glyph swapped for an actual calendar glyph).
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 474 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0). **Not
  yet verified on a real device** — jsdom can't confirm how the duplicated tile grid reads visually
  on Today next to Log It!, or how the new Stats card looks/feels.

## What shipped Aug 23, 2026 (v3.47.0)

Follow-up tweaks from Rob's review of v3.46.0:
- Fixed the Sleep→Weight tile gap (was only 14px, now matches the 24px used everywhere else) and
  added the same-size gap between RX & Supplements and "Use Your Presets" below it.
- Renamed "RX & Vitamins" to "RX & Supplements" everywhere in the app.
- "Remaining RX/Treatments" now has its own section-wide card border (matching "Today at a
  Glance"), with each item's own smaller card nested inside it.
- Today's Log rows tightened (padding, row-to-row gap, and the description/stats stack's internal
  gap all reduced) to remove the extra vertical space the v3.46.0 row restack had left behind.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js`. **Not yet
  verified on a real device.**

## What shipped Aug 23, 2026 (v3.46.0)

Log It! tile trim/spacing pass, Today's Log row restack, Stats "Subs" removed, new "Remaining
RX/Treatments" Today section — per Rob's described end-to-end flow (My Plan = system of record →
Today = daily status → Log It! = the action that updates that status):
- Weight/Treatments/RX & Vitamins tiles on Log It! each lost a redundant sub-text line now covered
  by the hero number — every tile now shows exactly 2 left-side data points. The low-supply/
  near-expiry alert on Treatments/RX & Vitamins tiles is preserved, just shown alone when present
  (not dropped — `PROD-04` requires it stay visible on tiles).
- Tile vertical padding trimmed (icon/gem bubble untouched), inter-tile gap increased to match the
  Voice-Assistant-to-Water spacing across all 8 tiles.
- Today's Log rows restacked: stats now render under the description instead of squeezing it
  inline; edit/delete buttons grouped tightly and pinned right.
- Stats' "Subs" chart option and the Subscriptions panel it opened removed entirely — superseded by
  the new Today section below.
- New "Remaining RX/Treatments" section on Today (between Today at a Glance and Today's Log): lists
  every inventory-tracked Treatment/RX item with qty remaining, expiry/renewal, and its alert if
  any. Treatments gained an optional provider field; RX items gained optional pharmacy and
  refills-remaining fields — all entered on My Plan's add/edit forms.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js`. **Not yet
  verified on a real device.**

## What shipped Aug 23, 2026 (v3.45.0)

My Plan's "Self-Managed" tile split into "Self-Managed RX" (two tiles: Vitamins & Supplements, RX)
plus a standalone "Self-Managed Treatments" tile, per Rob's direction:
- New `category` field (`'vitamin'`|`'rx'`) on supplement items; legacy items with no category
  default to vitamin wherever read, no migration needed.
- Vitamins & Supplements: add/edit/delete, no schedule field (implicitly daily).
- RX: add/edit/delete, keeps the schedule field, and each row now has an editable next-due-date
  input — restores the capability lost when v3.44.0 removed "To Do Today" (the only place that
  editing used to live), scoped to RX items specifically.
- Self-Managed Treatments: same CRUD as before, just its own tile — preserved deliberately since the
  old "Self-Managed" sheet was the only place treatments could be managed at all.
- Log It! and Today deliberately untouched — both still treat all supplements as one combined list
  for daily logging and due-counting, by explicit choice (minimizes daily logging steps).
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js`. **Not yet
  verified on a real device.**

## What shipped Aug 23, 2026 (v3.44.0)

"To Do Today" removed from the Today page, "Voice Tracker" renamed "Voice Assistant," app header
locked (sticky) and tightened, per Rob's direction:
- "To Do Today" (the due-items list with inline next-due-date editing) removed — "Today at a
  Glance" (v3.43.0) already surfaces due/overdue meds & treatments as a callout, making the old
  section pure duplication. Its only unique function, inline next-due-date editing, was
  reintroduced narrower and better-organized on My Plan in v3.45.0 (see above).
- "Voice Tracker" tile renamed "Voice Assistant" throughout (Log It! and Today) — label only, still
  non-functional.
- App header (`wt-topbanner`) changed to `position:sticky; top:0` so it no longer scrolls away;
  its padding and `wt-frame`'s top padding trimmed to remove dead space under the logo/title.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js`. One
  unrelated pre-existing stale harness check (`wt-tile-togo` water-tile assertion, predating this
  session — superseded by the v3.39.0 hero-number tile restructure) confirmed failing identically
  on the already-deployed v3.43.0 bundle, so not a regression from this work. **Not yet verified on
  a real device.**

## What shipped Aug 23, 2026 (v3.43.0)

Today's "Tracked So Far" section reworked into a compact "Today at a Glance" needs-attention
summary, per Rob's direction:
- Instead of one detailed row per enabled tracker (duplicating Log It!'s tiles and pushing To Do
  Today/Today's Log below the fold), the section now shows at most 4 callout rows: due/overdue RX
  & Vitamins or Treatments (due-count), plus — if room remains — the single most-behind consumable
  tracker (water/protein/calories/sleep/exercise, by largest fraction of goal remaining). Weight is
  excluded from "most behind" since it isn't a consumption goal.
- When nothing qualifies, shows "Great work, you're all caught up for now! 🎉" instead of an empty
  card.
- `tools/harness.js` updated: old 8-row/label checks replaced with checks for the new name,
  ordering, 4-row cap, and default-seed behavior.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js`. **Not yet
  verified on a real device** — jsdom can't confirm how the shorter section reads at a glance, or
  how the "all caught up" empty state feels on a genuinely done day.

## What shipped Aug 23, 2026 (v3.42.1)

Follow-up from Rob's real-device test of v3.42.0, all in `CHANGELOG.md`:
- Nav order reverted to Log It! · Today · Stats · My Plan · Settings (Today's content changes from
  v3.42.0 stay in place, only the nav position reverted).
- Investigated a recurring black-box header artifact after profile-photo upload — memory pressure
  ruled out as implausible; leading hypothesis is a WebKit `filter`-triggered repaint bug (the logo
  badge's `drop-shadow` filter), now removed. **This is a hypothesis, not a confirmed fix** — see
  Standing risk #9 above.
- Profile photo now downscaled/compressed client-side (canvas, capped 240px longest side, JPEG 85%)
  regardless of the filter theory — a smaller stored image is strictly safer either way.
- Tracked So Far row text enlarged and recolored tan throughout, per Rob's request.
- Full 5-step verification pipeline re-run and passed. **Header-artifact fix confirmed by Rob on
  real device (Aug 23)** — not reproduced since the `drop-shadow` filter was removed.

## What shipped Aug 23, 2026 (v3.42.0)

Today becomes the app's landing/engagement page, per Rob's direction:
- Voice Tracker tile copied onto Today (same non-functional component as Log It!'s copy), first
  thing under the page title.
- New **"Tracked So Far"** section: one card, one row per currently-enabled tracker, each showing a
  detailed goal/consumed/remaining line, left-border tinted in that tracker's category color.
  Extracted `computeTrackerStats()` as a shared function so Log It! and Tracked So Far compute from
  one source instead of duplicated logic.
- Today's section order is now: Voice Tracker tile → Tracked So Far → To Do Today → Today's Log.
- **Bottom nav order swapped**: Today · Log It! · Stats · My Plan · Settings (was Log It! · Today ·
  …).
- Full 5-step verification pipeline run and passed, including new harness coverage for the tile,
  section ordering, all 8 tracker rows, and the nav swap. **Not yet verified on a real device** —
  jsdom can't confirm row spacing/wrapping or how the page reads as a whole on a real screen.

## What shipped Aug 23, 2026 (v3.41.1)

Bugfix from Rob's real-device test: uploading a profile photo left a black square overlapping the
header profile icon and app name after returning from the Profile page (inconsistent — cleared on
switching nav tabs). Root cause: `.wt-topbanner-profile` had no `overflow:hidden`, so the photo's
square edges weren't guaranteed clipped to the circular button. Fixed by adding
`overflow:hidden` there and `max-width/max-height:100%` + `object-position:center` to
`.wt-topbanner-profile-photo`. Full pipeline re-verified. **Not yet re-tested on a real device.**

## What shipped Aug 23, 2026 (v3.41.0)

Log It! action-button restyle and a new Profile page, all in `CHANGELOG.md`:
- "Use Your Presets" button restyled to a transparent/glossy blue outline (`var(--water)` border +
  soft glow); its bottom sheet and "Manually Log a Meal"'s sheet now each carry a matching colored
  border (blue / protein-green) continuing the tile-to-sheet color-match pattern (`UX-18`).
- New **Profile page** — Full Name, Email, Mobile Phone, and a photo upload (2MB cap, stored as a
  base64 data URI). Reached only via the header profile icon (now a real button, was decorative).
  Explicit Save button; a Back button returns to Log It! since Profile isn't in the bottom nav.
  **Local-only by design** — new `settings.profile` field added to the versioned-schema defaults,
  picked up automatically by `migrate()`/backup export-import; does not reach the Worker/D1 or
  affect the account's real sign-in email/notifications. Explicit call by Rob.
- `tools/harness.js`: new end-to-end check for the full profile flow (open → fill → save → persist →
  back). Full 5-step verification pipeline run and passed. **Not yet verified on a real device** —
  jsdom can't confirm the button's visual "glossy" look, photo crop/scale, or phone file-picker
  behavior.

## What shipped Aug 22, 2026 (v3.40.3)

Quick follow-up from Rob's real-device check: Voice Tracker badge was too far left after v3.40.2's
shift; `margin-right` reduced 38px → 20px. Full pipeline re-verified. Not yet re-checked on device.

## What shipped Aug 22, 2026 (v3.40.2)

Follow-up fixes from Rob's review of v3.40.1, all in `CHANGELOG.md`:
- Voice Tracker tile: subtext font reduced (11.5px → 10px), badge shifted left (`margin-right:38px`)
  to roughly horizontally align with the progress rings below. **Vertical center-line alignment
  across tiles of different heights is not verifiable in jsdom** and is flagged as a known
  limitation needing Rob's real-device check.
- Preset buttons on "Use Your Presets" now center their text both horizontally and vertically
  (`.wt-preset-btn` was missing flex-centering, causing text to sit high and clip at the bottom).
- Fixed the presets sheet's excess bottom space and a backdrop/scroll interference bug — a forced
  `minHeight:60vh` on the sheet (added in v3.40.0's "less wasted space" fix) created a mismatch
  between the sheet's visual and actual boundaries. Reverted to normal content-driven sheet sizing
  with the presets grid capped at `max-height:50vh` and independently scrollable.
- Full 5-step verification pipeline re-run and passed against the exact shipped `bundle.js`. **Not
  yet verified on a real device** — jsdom can't confirm badge vertical alignment, preset bubble
  centering, or that the scroll-interference bug is actually resolved on a touchscreen.

## What shipped Aug 22, 2026 (v3.40.1)

Follow-up fixes from Rob's review of v3.40.0, all in `CHANGELOG.md`:
- Voice Tracker tile resized shorter than the tiles below it (icon bubble now 36px matching
  `.wt-tile-chip`, badge 52px aligned with the rings below, title/subtext shifted left and subtext
  font reduced).
- Real `voice-tracker-badge.png` (Rob-supplied) now fills the badge in both the in-app tile and the
  standalone deliverable, replacing the v3.40.0 CSS-gradient placeholder.
- "Use Your Presets" sheet's presets grid now fills available height (flex column, `flex:1 1 auto`)
  instead of leaving empty space below "Edit Presets".
- **Bugfix:** Manually Log a Meal's Water/Protein/Calories fields were tap-to-open buttons that
  launched a second stacked drag-dial sheet on top of the manual sheet. They're now plain number
  inputs — tapping brings up the phone's numeric keyboard directly, no second popup.
- Full 5-step verification pipeline re-run and passed against the exact shipped `bundle.js`. **Not
  yet verified on a real device** — jsdom can't confirm the tile's new height/alignment or the
  badge image's crop.

## What shipped Aug 22, 2026 (v3.40.0)

**Log It! entry-flow split, Voice Tracker tile preview, header AI icon removed.** Requested by Rob
in one pass; full detail in `CHANGELOG.md`.

- The combined "Use Your Presets or Log a Meal" button/sheet split into two independent flows:
  **"Use Your Presets"** (presets grid + Edit Presets only, no manual fields) and **"Manually Log a
  Meal"** (new, green/`var(--protein)`-colored button; Water/Protein/Calories/Description/Time
  fields + Log Items, in a new `ManualMealSheet` component). Editing an existing log entry now
  routes to `ManualMealSheet` rather than the presets sheet.
- New **"Voice Tracker" tile** on Log It!, above Water, unconditionally visible — gold-gradient
  card, AI-agent icon, gradient-sphere mic badge. **Not functional** — a design preview for the
  future Smart Entry voice path, no backend or speech wiring.
- **Header AI (Sparkles) icon removed** — explicit call by Rob: the Voice Tracker tile now carries
  the future-Smart-Entry-entry-point role that `UX-14`/`UX-16` had assigned to the header icon. See
  `UX-19` in the decision log.
- **Standalone Voice Tracker deliverable** produced at `voice-tracker-tile/` (plain HTML/CSS/JS, no
  framework/build step) per Rob's separate detailed spec, for future wiring outside the React
  bundle. Badge uses a CSS gradient sphere (no source image was supplied); see that folder's
  `assets/README.txt` for swapping in a real image later.
- `tools/harness.js` updated: stale selectors depending on removed button text/AI icon fixed; new
  checks added for the tile and both split sheets.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` (harness
  clean except one pre-existing, unrelated stale check predating this session; lint at the
  unchanged 11-error vendor baseline). **Not yet verified on a real device** — jsdom has no layout
  engine, so the Voice Tracker tile's visual design and the new button's sizing need Rob's eyes.

## What shipped Aug 22, 2026 (v3.39.0–3.39.1)

**v3.39.1 (follow-up from Rob's review):** My Plan's "What I'm Tracking" tile popups (`TrackerSheet`)
now also color-match their tile, matching what v3.39.0 already did on Log It!. Log It!'s hero number
is now horizontally centered in the tile (`.wt-tile-mid` flex:1 1 0, was flex:0 0 auto) instead of
hugging the icon ring. Hero-number caption font bumped 11px → 13px. Today page header: "Tracking Plan
& Summary for:" → "Today's Summary for:".


- **Popup outline color-matching** — all 8 tracker entry sheets now take an explicit `borderColor`
  matching that tracker's category token (`var(--water)`, `var(--protein)`, etc.), the same color as
  the tile border on Log It!, so the bottom sheet visually continues the tile that opened it.
- **Log It! tile restructure** — the middle stat ("to go" / diff / due-count) moved out of the left
  text stack into a new large-bold hero position (`wt-tile-mid`) between the text stack and the icon
  ring, vertically centered next to the icon bubble. Water/Protein/Calories/Sleep/Exercise: existing
  "to go"/"left"/"over" text becomes the hero (Goal/Logged unchanged). Weight: hero is amount left to
  reach goal ("to go" / "On goal!" / "Log today"), left stack unchanged. Treatments: hero is count
  planned today ("to do"), left stack unchanged. RX & Vitamins: hero is count due today ("to take"),
  left stack unchanged.
- **Header copy** — Log It! "Day Tracker:" → "Tracking for:"; Today "Day Planner:" → "Tracking Plan &
  Summary for:"; Stats "TO DATE STATS:" → "CURRENT STATS FOR:".
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` (harness clean,
  0 runtime errors; lint at the unchanged 11-error vendor baseline). **Not yet verified on a real
  device/browser** — jsdom has no layout engine, so tile-row spacing/wrapping needs Rob's eyes.

## What shipped Aug 19–21, 2026 (v3.17.0–3.38.2)

- **Worker source reconciled** — real deployed `worker.js` (728 lines: auth, share, backup, feedback, push, cron) committed for the first time. `wrangler.toml` has real values. `ARCH-OPEN-01` Worker side resolved.
- **Full D1 schema migrated** — 6 tables live in `hydropro-db`: `users`, `login_tokens`, `sessions`, `shares`, `account_backups`, `user_activity`.
- **Retention analytics fully live** (`ARCH-OPEN-06`, v3.17–3.18) — `POST /api/progress` writes opaque id + server date to `user_activity` (D1) for every caller. All users (push-subscribed or not) confirmed producing rows. Retention clock running.
- **jsdom harness runnable** (`OPS-08`) — `node tools/harness.js site/app/bundle.js` boots clean; baseline: 11 pre-existing no-undef errors.
- **Source reconciliation complete** (`ARCH-OPEN-01`, Aug 20, v3.19.0) — `src/app.js` extracted (6,104 lines), all 38 vendor identifiers renamed, recharts pinned to 2.15.4, Stats tab real-device verified. `src/app.js` + `esbuild.config.js` are now source of truth.
- **Versioned schema live** (`ARCH-OPEN-05`, Aug 20, v3.20.0/3.21.0) — `migrate()` + `deepMergeDefaults` replace three hand-maintained field whitelists. `goalWeight`/`goalExerciseMinutes` silent-drop bug fixed and real-device verified.
- **My Plan + Log It! redesigned and deployed** (`UX-OPEN-01` Phase 1, Aug 20–21, v3.22.0–3.36.2):
  - 2-column tracker card grid, per-tracker color icons, top-right toggle with "Track" label
  - All 8 tracker cards render unconditionally on My Plan — toggling off dims the card but never unmounts it (v3.32.0); toggle and "Track" label explicitly exempt from dimming (v3.36.0)
  - App header full black, no gradient; Log It! spacing widened (v3.32.0/3.32.1)
  - Provider-grouped "My Treatments" section, Austin Drip Lounge demo card, "Add Treatment Provider" placeholder sheet
  - Log It!: "Use Your Presets or Log a Meal" full-width action button, inline "My Presets" sheet
  - "RX & Vitamins" rename throughout, black page background
  - OO preset add/edit modal portal fix (v3.33.0); OO button transparency root-cause fix (v3.36.2) — `--deep` token now locally defined on all portaled components since createPortal renders outside `.wt-root` where the token was scoped
  - Log It! tile restructure (v3.35.0) — horizontal layout, data left, gem right, 4px left accent border per category, single-column stack (amends UX-02)
  - Design token system installed: full `:root` block with surface, text, category color, spacing, z-index tokens (v3.34.0)
  - Warm tan text (`#FFF6DB`, `--ink-inverse`) on all dark backgrounds across all tabs (v3.36.0/3.36.1)
  - Category color tokens applied to Log It! chip icons, progress rings, Stats charts, My Plan chips (v3.35.0/3.36.0)
  - My Plan tiles: left accent border + category chip matching Log It! style; "Target:" bold label on Water/Protein/Calories/Sleep/Exercise (v3.36.0)
  - Nav bar: dark elevated surface (`--surface-dark`), hairline border, accent pill on active tab, warm tan inactive labels (v3.34.0)
  - Accessibility: touch targets ≥48px, Settings inputs ≥16px, overdue state has icon glyph alongside color (v3.34.0)
- **"Enter Missed Items" backfill (v3.33.0)** — Today → calendar icon → All Past Days → a day → "Enter Missed Items" opens a portaled sheet. Entries tagged `backfilled:true`/`enteredAt`, decrement inventory without touching forward schedule. BackfillSheet button visibility and label fixed (v3.36.1/3.36.2).
- **UX-OPEN-02 resolved (v3.34.0)** — OO modal backdrop `stopPropagation` fix; no longer closes parent Log sheet.
- **VAPID config corrected** — `VAPID_CONTACT_EMAIL` = `mailto:rob@hydroprotracker.com`; public key set.
- **Dark theme completed app-wide (v3.37.0–3.38.2)** — the whole app converted from white-on-black mismatch to a coherent dark system:
  - Manual entry input bug hardened (v3.37.0) — explicit dark bg + tan text so it can't land dark-on-dark
  - All Log It! and My Plan tiles: `var(--bg)` background with full 2px category-color border (v3.37.0)
  - All sheets/modals/pages dark-themed; every remaining white bubble on Today/Stats/My Plan/Settings converted in place (v3.38.0)
  - Past Days popup — was fully illegible (invisible text and borders), now readable (v3.38.0, root-caused in v3.38.2)
  - `.wt-root` base text flipped to `--ink-inverse`; doctor-share overlay explicitly kept light (v3.38.0)
  - `--muted-dark` (#9FB0C4) fixes low-contrast helper text; `--hairline-bright` (#5A7390) gives visible borders everywhere (v3.38.0/3.38.1)
  - Header: logo/title reduced ~15%; unwired placeholder icons added — profile circle (left), Sparkles AI-assistant (right, future Smart Entry entry point) (v3.38.0/3.38.1)
  - Header/footer stacking fixed: header stays above open sheets, doctor-share takes full screen, footer covered by near-opaque backdrop (v3.38.1)
  - Global form-control reset `:where(button,input,select,textarea){color:inherit;font:inherit}` — catches the dark-on-dark button-text bug class generally (v3.38.2)
  - All 8 Log It! tile icons + My Plan TrackerRow icons now solid-filled in category color (v3.38.2)

---

## Known pattern — portaled components and CSS token scope

`createPortal` renders outside `.wt-root`, where scoped CSS custom properties (like `--deep`, `--line`, `--paper`) are defined. Any portaled sheet or modal must locally redefine these tokens on its root element, or buttons and inputs will fall back to transparent/unstyled. This was the root cause of the BackfillSheet and OO modal button bugs (v3.36.2). Apply this pattern to every future portaled component.

---

## Known outstanding

- **Presets/Meal Entry/Weight new icon artwork (v3.57.0) needs Rob's real-device confirmation.**
  Verified programmatically (real alpha transparency, no checkerboard/JPEG artifact) and visually
  inspected here before shipping, but the actual on-device look/scale/crop of all three is
  jsdom-unverifiable.
- **v3.55.0 misdiagnosed the Voice Tracker report as a caching issue; it was actually a stale
  source image on this session's side** (corrected v3.56.0, see `docs/DECISION-LOG.md` `UX-38`) —
  the v3.55.0 file rename wasn't wasted (renaming to bust any cache layer beyond this repo's
  control, e.g. a CDN edge cache, is still the right general practice if an asset ever *does* seem
  stuck after a real fix), but the caching theory should have been checked against the actual
  source content first, not assumed. Worth remembering: when an image "won't update," diff the
  actual file content/source before reaching for a caching explanation.
- **Top-row icon backgrounds were fixed with automated scripts, not real designed cutouts** for all
  three icons — Presets/Meal Entry via a corner-sampled chroma-key (v3.54.0), Voice Tracker via a
  checkerboard-specific variant (v3.56.0, visually confirmed clean before shipping — the other two
  were only alpha-checked, not eyeballed). This is inherently best-effort: edges may show faint
  fringing or an imperfect cutout compared to a real designed transparent export. Needs Rob's eyes
  on a real device for Presets/Meal Entry specifically; if their edges look rough, the fallback is
  still a properly-exported transparent PNG from Rob (see `docs/DECISION-LOG.md` `UX-35` for what
  that requires on the export side).
- **v3.53.0–v3.55.0's date-pill, sizing, and header changes all need Rob's real-device
  confirmation** — centering, the native calendar picker's feel on a phone, whether the bigger grid
  icons/labels fit well, and whether the header's new left/right balance reads correctly are all
  things jsdom cannot verify.
- **RX/Supplements split (v3.52.0/v3.58.0) needs Rob's real-device confirmation.** Not yet
  verified: the Supplements tile/icon's visual read next to Prescriptions on Log It! and My Day, and
  My Plan's "What I'm Tracking" row. The bottom-nav label concern (v3.58.0's "Prescriptions" was
  longer than the old "RX" in a tight 6-tab row) was resolved by Rob's own v3.59.0 feedback — the
  tab reverted to "RX" as the umbrella term for all three trackers.
- **v3.59.0 changes need Rob's real-device confirmation**: the My Day/Log It! nav swap's real-world
  feel (this exact swap was tried once before and reverted — worth confirming it holds up this
  time), the Log It! grid reorder's effect on daily habit, and the new Weight completion ring's
  visual proportions (rounded-square glow next to the existing checkmark badge).
- ~~**Today has no Supplements tile**~~ **RESOLVED v3.58.0** — My Day's full-detail grid now shows
  independent Prescriptions and Supplements tiles instead of one combined "RX & Supplements" tile.
  See `docs/DECISION-LOG.md` `TRACK-01`'s v3.58.0 amendment.
- **Pre-migration log-entry history stays tagged `type: "supplement"` regardless of which item it
  referenced** (v3.52.0, accepted limitation) — see `docs/DECISION-LOG.md` `TRACK-01`. A
  pre-migration dose of what is now an RX item won't retroactively count toward RX's "taken today"
  state if backfilled onto today's date. Low-risk given the trial-data context; revisit if it ever
  matters for a real clinic user's history.
- **Log It!'s one-screen sizing pass is implemented but unverified** (v3.51.0): the
  `100dvh`/flex-column CSS from Rob's brief is in place, but jsdom can't confirm it actually fits
  one screen with no scroll on a real phone. If it scrolls, the brief's own guidance is to lower the
  `vh` term in the art-sizing `min()` first (14vh, then 13.5vh) — not the `vw` term, which is
  already the binding constraint at 3 columns.
- **Voice Tracker sheet is a UI shell only** (v3.51.0): text field next to a decorative mic icon, no
  parser behind it. Not a regression — Smart Entry Phase 1 (real text/voice parsing) was explicitly
  out of scope for this brief and remains its own unstarted, separately-scoped build.
- **Sheet standardization** (still not started): swipe-dismiss, focus trap, Escape key, one-sheet-at-a-time — React implementation of designer's Priority 5 spec. This was slated for v3.37.0 but that slot went to the manual-entry bug fix + dark tiles; still open.
- **Recharts Tooltip popups on Stats** still use the library's default white background — deferred from the v3.38.0 dark sweep to avoid breaking charts. Follow-up item.
- **Footer-hide is backdrop-based, not state-based** (v3.38.1): the footer is visually covered by a near-opaque sheet backdrop rather than removed, because there's no single "a sheet is open" flag (would mean touching ~15 scattered open/close variables). If the footer peeks through on an untested sheet, that's why. Candidate for a proper fix if it recurs.
- **UX-OPEN-01 Phase 2** (not started): Settings consolidation — six status rows, "Your data" backed-up/not status, Reminders grouped by intent, tutorial on first run.
- **UX-OPEN-01 Phase 3** (not started): Clinic onboarding ramp — overlaps with the roadmap's protocol-code work.
- **"Add in Setup" stale copy** on Treatments/RX & Supplements empty-state CTAs on Log It! — quick copy fix, not yet addressed.
- **Some lucide glyphs filled may look odd** (v3.38.2): icons with internal negative space (e.g. Battery) render differently when filled vs. stroked. Flag any that look wrong for individual adjustment.
- **Treatments have no next-due-date editing UI anywhere in the app** (since v3.44.0 removed "To Do
  Today," the only place it lived). v3.45.0 restored this for RX items on My Plan, but "Self-Managed
  Treatments" wasn't in scope for that fix — a wrong next-due date on a treatment currently can't be
  corrected without deleting and re-adding the item. Worth raising with Rob before "My Treatments"
  gets built out further.
- **"Add Partner"/"Add Treatment Provider" sheet on My Plan is still a design-review placeholder**
  (name, protocol code, contact, sessions, appointment date — none wired to any data model). This is
  a separate concern from the per-item "Partner logo"/"Partner link" fields added in v3.49.0 (which
  attach to an existing Treatment/RX item's provider/pharmacy name) — the placeholder sheet is for
  onboarding a whole new partner relationship, not decorating an existing item. Not touched by
  v3.49.0; still needs a real spec and data model before it can be wired up.

---

## Design system reference (current tokens)

- `--bg` #0B0F14 (page), `--surface-dark` #151A21 (cards/sheets)
- `--ink-inverse` #FFF6DB (warm tan — all text on dark surfaces)
- `--muted-dark` #9FB0C4 (secondary/helper text on dark, AA-passing)
- `--hairline-bright` #5A7390 (visible borders on cards/rows/inputs/buttons/sheets)
- Category colors: `--water` `--protein` `--calories` `--sleep` `--weight` `--exercise` `--meds` `--treatment` — used for tile borders (2px), chips, ring fills, chart colors
- Exempt from dark theme: the doctor-share / health-summary overlay stays light (embedded and as standalone `?share=` page)
- Global rule: `:where(button,input,select,textarea){color:inherit;font:inherit}` — form controls don't inherit color reliably, this catches dark-on-dark bugs (UX-17)

---

## Current direction

**Clinic-first** (`STRAT-10`). Clinic distribution gets priority for attention and sequencing; consumer continues as a downstream byproduct, with both acquisition ramps still in scope (`STRAT-05`).

**Working sequence (updated Aug 22, after v3.40.0):** The dark-theme conversion is complete app-wide. v3.40.0 was a Rob-directed detour (Log It! flow split + Voice Tracker tile preview), not the planned next roadmap item — the queued sequence is unchanged: new partner trackers (Time In Bed, Time Out of Bed, Steps, Resting Heart Rate, Calories Burned) → clinic protocol code + patient onboarding link → Smart Entry Phase 1 (text-based AI-assisted logging, brief already written). Note the Voice Tracker tile is a non-functional design preview only — actual Smart Entry backend/voice wiring is still unbuilt and still targets the Smart Entry Phase 1 slot. Sheet standardization (swipe/focus-trap/Escape) remains an open non-blocking item to slot in when convenient. v3.41.0 through v3.48.0 were all further Rob-directed detours in the same vein (Today/Stats/My Plan layout and content changes); the queued sequence above still hasn't been started.

See `docs/ROADMAP-v3.md` (HydroPro-Master-Roadmap) for the full version-by-version plan.

Running in parallel, needing no engineering: clinic validation conversations (`STRAT-OPEN-03`), pricing (`STRAT-OPEN-02` — most time-sensitive open item, needed before next clinic meeting), and the digital-health attorney consult (`LEGAL-OPEN-01`).

---

## Not built

No native app (so no HealthKit / Health Connect write — platform boundary, see `STRAT-04`). No wearable sync. No EHR/FHIR integration. No AI coach. No clinic-side dashboard or multi-tenancy. No first-run onboarding flow. No support channel. No billing.

---

## Testers

Closed group via Cloudflare Access allowlist. Feedback arrives through the in-app form (stored in KV) with push alerts.
