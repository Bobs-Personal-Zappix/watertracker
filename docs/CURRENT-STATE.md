# HydroPro Tracker — Current State

**Orientation card for a new conversation.** Answers "what exists right now" so it doesn't have to be rediscovered. Update when any of it changes.

*As of: August 22, 2026 · Deployed version: 3.38.2*

---

## What's live

**URLs**
- `hydroprotracker.com` — public landing page.
- `hydroprotracker.com/app/` — the tracker, gated by **Cloudflare Access** (email allowlist, closed testing group only).
- Worker on its own `workers.dev` domain — deliberately ungated, which is what makes doctor-share links reachable without a login.

**Tracked metrics (8 tiles, all with percentage progress rings)**
Water · Protein · Calories · Sleep · Weight · Exercise · Treatments · RX & Vitamins — in that order on the Log It! page.

**Tabs:** Log It! · Today · Stats · My Plan · Settings

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

---

## What shipped Aug 19–21, 2026 (v3.17.0–3.36.2)

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
- **Dark tiles and dark sheets (v3.37.0)** — all 8 Log It! tiles and both My Plan tracker-card
  grids: `background:var(--bg)`, full 2px category-color border on all 4 sides (replaces the
  4px left-only accent border from v3.35.0), title/goal/to-go/logged text on `var(--ink-inverse)`.
  Every bottom sheet and modal (`wt-sheet`/`wt-modal`) now dark (`var(--surface-dark)` +
  `var(--ink-inverse)`), including inputs (`var(--bg)` background, `var(--ink-inverse)` text,
  hairline border), the primary action button (now `var(--accent)` blue instead of the
  near-invisible `var(--deep)` navy), secondary/text buttons, and preset/option rows. Manual
  entry numeric inputs (Water/Protein/Calories/Weight) given an explicit dark background and
  warm-tan text so they can't land on a light-on-light or dark-on-dark combination regardless of
  which sheet renders them. Two inline `color:var(--ink)` overrides (Supplements/Treatments
  section labels, `.wt-qty-name`) that would have gone invisible on the new dark sheets were
  caught and fixed during this pass. Not real-device verified yet — see below.
- **Dark theme completed app-wide (v3.38.0, `UX-15`)** — finishes what v3.37.0 started. All
  remaining white/light surfaces on Today, Stats, My Plan, and Settings converted in place
  (page by page, not a shared-class rewrite, per Rob's explicit call): Today's Past Days popup
  (previously the worst offender — text, field borders, and the popup's own border were all
  invisible), To Do Today rows, Today's Log rows; Stats' segmented control, range-nav buttons,
  stat boxes, and cards (including the Health Summary launcher); My Plan's My Treatments/regimen
  cards (Austin Drip Lounge demo card included); Settings' cards and fields. Every sheet/modal
  outer edge now has a `1px solid var(--hairline)` border. A new `--muted-dark` token (`#9FB0C4`)
  replaces `--muted`/the `wS` inline constant wherever secondary "helper" text sits on a dark
  surface, clearing the AA 4.5:1 floor the v3.37.0 summary flagged (`wS` itself is unchanged,
  since it's also used on the doctor-share overlay's on-screen light controls — a second
  shared-constant case, same pattern as `.wt-chip`). `.wt-root`'s own base text color flipped
  from dark navy to `--ink-inverse`, since the app is dark end-to-end now; the doctor-share
  overlay (print/share page, must stay light) was given its own explicit `color:var(--ink)` so
  it doesn't inherit the new default. Header: logo and title reduced ~15% (82px→70px badge,
  27px→23px title) to make room for two new placeholder icons, neither wired to anything —
  a circular profile icon (left of the logo, `lucide-react` `User`) and a `Sparkles` AI-assistant
  icon in `--accent` (right of the title, future Smart Entry entry point per `UX-14`).
  **Shared-component stragglers intentionally left untouched** (flagged, not fixed, to avoid
  regressing a context that must stay light): `.wt-chip` (used inside dark sheets AND inside the
  light/printable doctor-share overlay); `.wt-empty-note` was fully converted this session since
  none of its ~14 usages are in a light context. **Also noted, not touched:** the four recharts
  `Tooltip` `contentStyle` popups on Stats still render with the library's default white
  background — arguably chart internals, out of scope per this session's brief; worth a follow-up.
- **Border/header polish (v3.38.1)** — follow-up to v3.38.0 from Rob's real-device look. New
  `--hairline-bright` token (`#5A7390`) replaces `--hairline` on every card/row/input/button/sheet
  border introduced in v3.37.0–v3.38.0 (dimmer than `--ink-inverse` text, per explicit instruction,
  but clearly visible against `--bg`/`--surface-dark`). Header profile/AI placeholder icons grown
  32px→40px with brighter icon colors and (for the AI icon) a new `--accent-chip` circular
  background matching the profile icon's chip treatment. Header (`.wt-topbanner`) given
  `z-index:250` so it stays visible above any open sheet's backdrop; the doctor-share full-screen
  overlay raised to `z-index:260` so it still correctly replaces the header when that's open
  instead. `.wt-backdrop` opacity raised `.45→.94` so the footer nav (`z-index:30`, well below any
  sheet) is visually hidden behind an open sheet — a covering fix, not a DOM-removal one; the nav
  is still mounted, just visually obscured, which was judged sufficient rather than threading an
  "any sheet open" flag through the ~15 independent open/close state variables in the file.
- **Past Days text-color bug fixed + tile icons filled (v3.38.2)** — the Past Days popup's
  date-list buttons were rendering invisible (black) text because `<button>`/`<input>`/`<select>`/
  `<textarea>` don't reliably inherit `color`/`font` from ancestors the way plain elements do; a
  new global reset (`:where(button, input, select, textarea) { color:inherit; font:inherit; }`,
  zero-specificity via `:where()` so it never overrides any of the app's many explicitly-colored
  buttons) fixes this everywhere, not just that one popup. Also: both Log It! and My Plan's 8
  category tile icons were outline-only (`lucide-react` default, `fill:none`) — neither was
  actually filled despite it looking like My Plan's might be — both now pass a `fill` prop
  matching their category color so the icon renders solid.

---

## Known pattern — portaled components and CSS token scope

`createPortal` renders outside `.wt-root`, where scoped CSS custom properties (like `--deep`, `--line`, `--paper`) are defined. Any portaled sheet or modal must locally redefine these tokens on its root element, or buttons and inputs will fall back to transparent/unstyled. This was the root cause of the BackfillSheet and OO modal button bugs (v3.36.2). Apply this pattern to every future portaled component.

Confirmed recurring (v3.37.0): the tokens the app's two portaled components (BackfillSheet, OO
preset modal) actually need to redefine locally are only the ones with *different* values inside
vs. outside `.wt-root` (`--deep`, `--line`, `--paper`, `--muted`, `--ink`). Tokens installed only
on the global `:root` block (`--bg`, `--surface-dark`, `--hairline`, `--ink-inverse`, `--accent`,
the per-category color/chip pairs) resolve correctly for portaled content automatically, with no
local redefinition needed — they were deliberately installed outside `.wt-root` for exactly this
reason (see the `:root` block's own comment in `src/app.js`). v3.37.0's dark-sheet styling moved
sheet/input/button colors onto this second group of tokens wherever possible, which is why the
portals needed no new local overrides for the dark-theme pass. A shared utility function for
portal containers (to stop hand-copying the `--deep`/`--line`/`--paper`/`--muted` local overrides
into every new portaled component) is still worth doing in a future session — noted, not done.

---

## Known outstanding

- **UX-OPEN-01 Phase 2** (not started): Settings consolidation — six status rows, "Your data" backed-up/not status, Reminders grouped by intent, tutorial on first run.
- **UX-OPEN-01 Phase 3** (not started): Clinic onboarding ramp.
- **Sheet standardization** (v3.37.0): swipe-dismiss, focus trap, Escape key, one-sheet-at-a-time — React implementation of designer's Priority 5 spec.
- **"Add in Setup" stale copy** on Treatments/RX & Vitamins empty-state CTAs on Log It! — quick copy fix, not yet addressed.
- **UX-13 (--treatment token) and UX-12 (design tokens)** — Decision Log entries exist but CURRENT-STATE shipped features should reflect them; noted above.

---

## Current direction

**Clinic-first** (`STRAT-10`). Clinic distribution gets priority for attention and sequencing; consumer continues as a downstream byproduct, with both acquisition ramps still in scope (`STRAT-05`).

**Working sequence (updated Aug 22):** dark-theme completion shipped v3.38.0, taking the version
slot originally reserved for new partner trackers — that work moves later in the sequence, after
sheet standardization (swipe-dismiss, focus trap, Escape, one-at-a-time) → UX-OPEN-01 Phase 2
(Settings redesign) → server as source of truth (`ARCH-OPEN-04`) → clinic-side build
(`ARCH-OPEN-02`).

Running in parallel, needing no engineering: clinic validation conversations (`STRAT-OPEN-03`), pricing (`STRAT-OPEN-02` — most time-sensitive open item, needed before next clinic meeting), and the digital-health attorney consult (`LEGAL-OPEN-01`).

---

## Not built

No native app (so no HealthKit / Health Connect write — platform boundary, see `STRAT-04`). No wearable sync. No EHR/FHIR integration. No AI coach. No clinic-side dashboard or multi-tenancy. No first-run onboarding flow. No support channel. No billing.

---

## Testers

Closed group via Cloudflare Access allowlist. Feedback arrives through the in-app form (stored in KV) with push alerts.
