# HydroPro Tracker — Current State

**Orientation card for a new conversation.** Answers "what exists right now" so it doesn't have to be rediscovered. Update when any of it changes.

*As of: August 21, 2026 · Deployed version: 3.34.0*

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

## What shipped Aug 19–21, 2026 (v3.17.0–3.34.0)

- **Worker source reconciled** — real deployed `worker.js` (728 lines: auth, share, backup, feedback, push, cron) committed for the first time. `wrangler.toml` has real values. `ARCH-OPEN-01` Worker side resolved.
- **Full D1 schema migrated** — 6 tables live in `hydropro-db`: `users`, `login_tokens`, `sessions`, `shares`, `account_backups`, `user_activity`.
- **Retention analytics fully live** (`ARCH-OPEN-06`, v3.17–3.18) — `POST /api/progress` writes opaque id + server date to `user_activity` (D1) for every caller. All users (push-subscribed or not) confirmed producing rows. Retention clock running.
- **jsdom harness runnable** (`OPS-08`) — `node tools/harness.js site/app/bundle.js` boots clean; baseline: 11 pre-existing no-undef errors.
- **Source reconciliation complete** (`ARCH-OPEN-01`, Aug 20, v3.19.0) — `src/app.js` extracted (6,104 lines), all 38 vendor identifiers renamed, recharts pinned to 2.15.4, Stats tab real-device verified. `src/app.js` + `esbuild.config.js` are now source of truth.
- **Versioned schema live** (`ARCH-OPEN-05`, Aug 20, v3.20.0/3.21.0) — `migrate()` + `deepMergeDefaults` replace three hand-maintained field whitelists. `goalWeight`/`goalExerciseMinutes` silent-drop bug fixed and real-device verified.
- **My Plan + Log It! redesigned and deployed** (`UX-OPEN-01` Phase 1, Aug 20–21, v3.22.0–3.33.0):
  - 2-column tracker card grid, per-tracker color icons, top-right toggle with "Track" label
  - All 8 tracker cards render unconditionally on My Plan — toggling off dims the card but never unmounts it (v3.32.0, fixes a regression introduced in the 2-column rework)
  - App header full black (`var(--page-bg)`), no gradient; Log It! spacing widened (v3.32.0/3.32.1)
  - Provider-grouped "My Treatments" section, Austin Drip Lounge demo card, "Add Treatment Provider" placeholder sheet
  - Log It!: "Use Your Presets or Log a Meal" full-width action button, inline "My Presets" sheet
  - "RX & Vitamins" rename throughout (from "RX & Supplements"), black page background
  - OO preset add/edit modal fixed (v3.33.0) — now `createPortal`-rendered to `document.body`; established as the project-wide pattern for all sheets/modals (UX-11)
- **"Enter Missed Items" backfill (v3.33.0)** — Today → calendar icon → All Past Days → a day → "Enter Missed Items" opens a portaled sheet with editable date (reaches any day, including zero-entry days). One control per enabled tracker (Treatments excluded in v1). Entries tagged `backfilled:true`/`enteredAt`, timestamped 12:00 PM local, decrement RX & Vitamins inventory without touching forward schedule, never affect today's state, never fire goal toasts. Past-day entries (backfilled or not) now deletable; restores inventory through existing delete path.
- **VAPID config corrected** — `VAPID_CONTACT_EMAIL` = `mailto:rob@hydroprotracker.com`; public key set.
- **Design token system installed** (`UX-12`, v3.34.0) — a `:root` token block (surfaces, text, accent, per-tracker category color+chip pairs, 8pt spacing scale, radius/touch/nav-height, z-index scale) now sits at the top of the CSS, reachable by portaled sheets/modals as well as `.wt-root`-scoped content. `--ink`/`--muted`/`--success` intentionally exist at two different values (`.wt-root`-scoped vs `:root`-scoped) — documented inline, not a bug; see CHANGELOG v3.34.0 for the resolution mechanics. Token *adoption* (replacing the ~33 literal `#fff` card backgrounds and other hardcoded colors across the CSS) is not done — that's part of the Session 2 tile restructure below.
- **v3.34.0 fixes/hardening**, same session as the tokens: BackfillSheet's transparent-background/left-right-overflow bug fixed (root cause: portaled content sits outside `.wt-root`'s CSS variable and `box-sizing` scope — same class of bug as the OO fix in v3.33.0); Today's "Prior Days" calendar-icon control enlarged, brightened, and labeled; pure-black page backgrounds repointed to `var(--bg)`; bottom nav retheme to `var(--surface-dark)` + `var(--hairline)` + `var(--accent)`/`var(--accent-chip)` active state + `aria-current`; accessibility floor (48px touch targets on icon buttons and form fields, Settings inputs raised to 16px, an icon added alongside the overdue color indicator, two specific muted-text-on-white contrast fixes inside the portaled sheets); **`UX-OPEN-02` resolved** — one-line `stopPropagation` fix, OO's backdrop click no longer cascades to close the parent Log sheet.

---

## Known outstanding

- **My Presets backdrop may have the same cascade bug `UX-OPEN-02` just fixed for OO.** While fixing OO, found that My Presets' own backdrop `onClick` does *not* actually call `stopPropagation`, despite the `UX-11` decision log entry describing it as already having one. Unconfirmed whether this manifests on a real device — same one-line fix if it does. *Needs Rob's real-device check, then Claude can fix alone if confirmed.*
- **Z-index token mismatch.** The new `--z-sheet:50`/`--z-scrim:40` tokens don't match the app's actual sheet/modal z-indices (150–191, several hand-picked levels for nested sheets). Nav now uses `var(--z-nav)=30` per spec, but nothing else was renumbered to the token scale this session — a larger, separate change if it's wanted.
- **Token adoption sweep not started.** ~33 literal `#fff` card/surface backgrounds and 7 literal `rgba(0,0,0,…)` shadows in the CSS now have token equivalents but haven't been converted — flagged in v3.34.0, folded into the Session 2 tile restructure below rather than done piecemeal.
- **UX-OPEN-01 Phase 2** (not started): Settings consolidation — six status rows, "Your data" backed-up/not status, Reminders grouped by intent, tutorial on first run.
- **UX-OPEN-01 Phase 3** (not started): Clinic onboarding ramp.
- **"Add in Setup" stale copy** on Treatments/RX & Vitamins empty-state CTAs on Log It! — quick copy fix, not yet addressed.

---

## Current direction

**Clinic-first** (`STRAT-10`). Clinic distribution gets priority for attention and sequencing; consumer continues as a downstream byproduct, with both acquisition ramps still in scope (`STRAT-05`).

**Working sequence (updated Aug 21, post-v3.34.0):** `UX-OPEN-02` is resolved (was the first item in the prior sequence). Next up, **v3.35.0 = Session 2: Log It! tile restructure**, building on the token system landed this session — adopts the surface/category tokens across the tile grid rather than the literal hex values flagged above. After that: `UX-OPEN-01` Phase 2 (Settings redesign) → server as source of truth (`ARCH-OPEN-04`) → clinic-side build (`ARCH-OPEN-02`).

Running in parallel, needing no engineering: clinic validation conversations (`STRAT-OPEN-03`), pricing (`STRAT-OPEN-02` — most time-sensitive open item, needed before next clinic meeting), and the digital-health attorney consult (`LEGAL-OPEN-01`).

---

## Not built

No native app (so no HealthKit / Health Connect write — platform boundary, see `STRAT-04`). No wearable sync. No EHR/FHIR integration. No AI coach. No clinic-side dashboard or multi-tenancy. No first-run onboarding flow. No support channel. No billing.

---

## Testers

Closed group via Cloudflare Access allowlist. Feedback arrives through the in-app form (stored in KV) with push alerts.
