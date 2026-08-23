# HydroPro Tracker — Current State

**Orientation card for a new conversation.** Answers "what exists right now" so it doesn't have to be rediscovered. Update when any of it changes.

*As of: August 23, 2026 · Deployed version: 3.43.0*

---

## What's live

**URLs**
- `hydroprotracker.com` — public landing page.
- `hydroprotracker.com/app/` — the tracker, gated by **Cloudflare Access** (email allowlist, closed testing group only).
- Worker on its own `workers.dev` domain — deliberately ungated, which is what makes doctor-share links reachable without a login.

**Tracked metrics (8 tiles, all with percentage progress rings)**
Water · Protein · Calories · Sleep · Weight · Exercise · Treatments · RX & Vitamins — in that order on the Log It! page.

**Tabs:** Log It! · Today · Stats · My Plan · Settings (v3.42.0 swapped Today first; v3.42.1
reverted that swap per Rob after real-device testing — Today's landing-page content additions
from v3.42.0 remain, only the nav order reverted)

**Shipped features**
- Drag-dial entry, one-tap logging, presets, combined multi-metric entries
- Sleep with start/finish session tracking across midnight
- Supplements and Treatments, both with recurring schedules and always-editable next-due dates
- Inventory/subscription tracking on supplements and treatments (remaining count, expiration, low-supply and near-expiry alerts, auto-decrement on log, auto-restore on delete)
- Past-days log viewer (calendar icon on Today); past-day entries are deletable
- "Enter Missed Items" backfill on any past day (Today → calendar icon → day → button)
- Stats: day/week/month views per metric, All-3 comparison, weight and sleep trend lines, Subscriptions panel
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
6. ~~**Schema fragility.**~~ **RESOLVED** — `ARCH-OPEN-05` complete Aug 20. `migrate()`/`deepMergeDefaults` replaced the hand-maintained field whitelists. New fields require one line in defaults, not four scattered additions.
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

- **Sheet standardization** (still not started): swipe-dismiss, focus trap, Escape key, one-sheet-at-a-time — React implementation of designer's Priority 5 spec. This was slated for v3.37.0 but that slot went to the manual-entry bug fix + dark tiles; still open.
- **Recharts Tooltip popups on Stats** still use the library's default white background — deferred from the v3.38.0 dark sweep to avoid breaking charts. Follow-up item.
- **Footer-hide is backdrop-based, not state-based** (v3.38.1): the footer is visually covered by a near-opaque sheet backdrop rather than removed, because there's no single "a sheet is open" flag (would mean touching ~15 scattered open/close variables). If the footer peeks through on an untested sheet, that's why. Candidate for a proper fix if it recurs.
- **UX-OPEN-01 Phase 2** (not started): Settings consolidation — six status rows, "Your data" backed-up/not status, Reminders grouped by intent, tutorial on first run.
- **UX-OPEN-01 Phase 3** (not started): Clinic onboarding ramp — overlaps with the roadmap's protocol-code work.
- **"Add in Setup" stale copy** on Treatments/RX & Vitamins empty-state CTAs on Log It! — quick copy fix, not yet addressed.
- **Some lucide glyphs filled may look odd** (v3.38.2): icons with internal negative space (e.g. Battery) render differently when filled vs. stroked. Flag any that look wrong for individual adjustment.

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

**Working sequence (updated Aug 22, after v3.40.0):** The dark-theme conversion is complete app-wide. v3.40.0 was a Rob-directed detour (Log It! flow split + Voice Tracker tile preview), not the planned next roadmap item — the queued sequence is unchanged: new partner trackers (Time In Bed, Time Out of Bed, Steps, Resting Heart Rate, Calories Burned) → clinic protocol code + patient onboarding link → Smart Entry Phase 1 (text-based AI-assisted logging, brief already written). Note the Voice Tracker tile is a non-functional design preview only — actual Smart Entry backend/voice wiring is still unbuilt and still targets the Smart Entry Phase 1 slot. Sheet standardization (swipe/focus-trap/Escape) remains an open non-blocking item to slot in when convenient.

See `docs/ROADMAP-v3.md` (HydroPro-Master-Roadmap) for the full version-by-version plan.

Running in parallel, needing no engineering: clinic validation conversations (`STRAT-OPEN-03`), pricing (`STRAT-OPEN-02` — most time-sensitive open item, needed before next clinic meeting), and the digital-health attorney consult (`LEGAL-OPEN-01`).

---

## Not built

No native app (so no HealthKit / Health Connect write — platform boundary, see `STRAT-04`). No wearable sync. No EHR/FHIR integration. No AI coach. No clinic-side dashboard or multi-tenancy. No first-run onboarding flow. No support channel. No billing.

---

## Testers

Closed group via Cloudflare Access allowlist. Feedback arrives through the in-app form (stored in KV) with push alerts.
