# HydroPro Tracker — Current State

**Orientation card for a new conversation.** Answers "what exists right now" so it doesn't have to be rediscovered. Update when any of it changes.

*As of: August 21, 2026 · Deployed version: 3.33.0*

---

## What's live

**URLs**
- `hydroprotracker.com` — public landing page.
- `hydroprotracker.com/app/` — the tracker, gated by **Cloudflare Access** (email allowlist, closed testing group only).
- Worker on its own `workers.dev` domain — deliberately ungated, which is what makes doctor-share links reachable without a login.

**Tracked metrics (8 tiles, all with percentage progress rings)**
Water · Protein · Calories · Sleep · Weight · Exercise · Treatments · RX & Supplements — in that order on the Log It! page.

**Tabs:** Log It! · Today · Stats · My Plan · Settings

**Shipped features**
- Drag-dial entry, one-tap logging, presets, combined multi-metric entries
- Sleep with start/finish session tracking across midnight
- Supplements and Treatments, both with recurring schedules and always-editable next-due dates
- Inventory/subscription tracking on supplements and treatments (remaining count, expiration, low-supply and near-expiry alerts, auto-decrement on log, auto-restore on delete)
- Past-days log viewer (calendar icon on Today)
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
| Charts | Recharts (majority of bundle weight; only Stats needs it) |
| Icons | lucide-react |
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Worker (`water-tracker-push`), cron every 5 min |
| Database | Cloudflare D1 — `account_backups`, `shares`, plus auth/session tables |
| KV | Push subscriptions, feedback entries (`feedback:` prefix), recovery-code backups |
| Email | Resend, via `env.RESEND_API_KEY` (secret, never committed) |
| Push | Web Push + VAPID |

Bundle is ~702KB minified, ~180KB gzipped.

---

## Repo and deploy

```
/src/App.jsx          ← STALE. Missing Treatments, Exercise, everything after v3.13.0
/site/app/bundle.js   ← the real deployed artifact and current source of truth
/site/app/            config.js, index.html, manifest.json, service-worker.js,
                      gauges/, icons/, tile-icons/
/worker/src/worker.js
/CHANGELOG.md
```

**Deploy:** `bundle.js` → `site/app/bundle.js`, `CHANGELOG.md` → repo root, via GitHub web UI. Worker changes need a separate `wrangler deploy`. D1 migrations run separately via `wrangler d1 execute`.

**Development environment:** WSL2 + Claude Code (`OPS-04`, `OPS-05`) — fully operational as of Aug 19. Front-end deploy: commit `site/app/bundle.js` + `CHANGELOG.md`, `git push`; Cloudflare Pages serves from the repo. Worker deploy: `wrangler deploy` from `worker/` — separate step, first successful deploy from this clone Aug 20 (`OPS-09`). D1 migrations: `wrangler d1 execute hydropro-db --remote --file=<migration>` from `worker/`; run by Rob, never by Claude Code.

**Service worker is network-first** (deliberate — an earlier cache-first version stranded users on stale builds). `_headers` forces no-cache on `/app/*`.

---

## Testing assets

- **`harness.txt`** in project knowledge — jsdom smoke-test harness, boots the real bundle and drives the UI. Reuse it; environment gotchas are documented at the top. Save as `.js` to run.
- **`dial-drag-test.py`** — Playwright test for drag-dial geometry, in repo.
- **~578-check jsdom suite** — in repo, but runs against the stale `src/`, so it currently proves nothing about production. Untrustworthy until source reconciliation is done.

---

## Standing risks (none have a deadline; all will drift if not raised)

1. **Source drift.** `src/App.jsx` no longer matches production. Blocks contributors, invalidates the test suite, and a `npm run build` today would revert months of shipped work. → `ARCH-OPEN-01`
2. **Data-loss exposure.** A user's history lives in one browser's `localStorage`. Cloud backup is opt-in. Someone clearing site data or switching phones without a backup loses everything. → `ARCH-OPEN-04`
3. **No error monitoring.** Crashes are discovered only when a tester reports them. A blank white screen is otherwise invisible.
4. **No analytics.** D1/D7/D30 retention — the only metric that matters for a tracker — cannot currently be measured.
5. **Single-blob data model.** History is one JSON blob in `account_backups.data`. Cannot answer any aggregate or per-clinic question, which is the entire B2B proposition. → `ARCH-OPEN-02`
6. **Schema fragility.** The load path rebuilds settings field-by-field from hardcoded whitelists; a new field must be added in ~4 places or it silently vanishes on reload. Has already caused one real bug.
7. **Legal/compliance unaddressed.** FTC Health Breach Notification Rule and state consumer-health-privacy laws apply to consumer health apps; the clinic path may trigger HIPAA obligations. → `LEGAL-OPEN-01`
8. **Cloudflare Access can't scale** past an invited list. Magic-link auth is built but Access is still the gate. → `ARCH-OPEN-04`

---

## What shipped Aug 19–20, 2026 (v3.17.0)

- **Worker source reconciled** — real deployed `worker.js` (728 lines: auth, share, backup, feedback, push, cron) committed for the first time. `wrangler.toml` has real values; no more sanitized placeholders. `ARCH-OPEN-01` Worker side resolved.
- **Full D1 schema migrated** — 6 tables live in `hydropro-db`: `users`, `login_tokens`, `sessions`, `shares`, `account_backups`, `user_activity`. Auth and sharing now have a real database backing them.
- **Retention analytics fully live** (`ARCH-OPEN-06`, v3.17–3.18) — `POST /api/progress` merged: writes opaque id + server date to `user_activity` (D1) for every caller. Coverage fix (3b) shipped in v3.18.0: `wtDeviceId()` + `wtActivityPing()` mount effect fires unconditionally on app open regardless of push status. Both push-subscribed and non-push users confirmed producing `user_activity` rows. Retention clock running, full coverage, from Aug 20.
- **jsdom harness runnable** (`OPS-08`) — `node tools/harness.js site/app/bundle.js` boots clean; `npm run lint:bundle` baseline: 11 pre-existing no-undef errors.
- **Source reconciliation complete** (`ARCH-OPEN-01`, Aug 20, v3.19.0) — `src/app.js` extracted (6,104 lines), all 38 vendor identifiers renamed, recharts pinned to 2.15.4, Stats tab real-device verified. `src/app.js` + `esbuild.config.js` are now the source of truth for future edits.
- **My Plan + Log It! redesigned and deployed** (`UX-OPEN-01` Phase 1a–1d, Aug 20–21, v3.22.0–3.33.0):
  - 2-column tracker card grid, per-tracker color icons, top-right toggle with "Track" label, always-visible dimmed off-trackers (v3.22.0–3.26.0; regressed to unmounting off cards on toggle in the 2-column rework and fixed again for real in v3.32.0 — all 8 cards now render unconditionally, only the `on` prop/dimming changes)
  - App header background is full black (`var(--page-bg)`), matching the page body; no gradient banner (v3.32.0). Log It! spacing between the tile grid and the presets/meal button widened to 16px (v3.32.1)
  - Provider-grouped "My Treatments" section, hardcoded Austin Drip Lounge clinic demo card, "Add Treatment Provider" placeholder sheet (v3.23.0–3.28.0)
  - Log It!: "Use Your Presets or Log a Meal" full-width action button, inline "My Presets" sheet with edit/delete/add (v3.27.0–3.31.0)
  - "RX & Vitamins" rename throughout, black page background, all sheet z-index/positioning fixes (v3.27.0–3.31.0)
  - OO preset add/edit modal nested-position bug fixed (v3.33.0) — now renders via `createPortal` to `document.body` instead of a z-index patch, since it's invoked from two different deeply-nested sheets. Established pattern reused for the new backfill sheet below.
- **"Enter Missed Items" backfill (v3.33.0)** — Today → calendar icon → All Past Days → a day → new button opens a `document.body`-portaled sheet with an editable date field (reaches any day, including ones with no existing entries) and one control per enabled tracker (Treatments excluded in v1). Entries save with `backfilled:true`/`enteredAt` provenance fields, timestamped 12:00 PM, decrement RX & Vitamins inventory without touching the forward due-date schedule, never touch today's log/To-Do state, and never fire goal-hit toasts. Past-day entries (backfilled or not) are now deletable — restores inventory through the same delete path live entries use.
- **Versioned schema live** (`ARCH-OPEN-05`, Aug 20, v3.20.0/3.21.0) — `migrate()` + `deepMergeDefaults` replace three hand-maintained field whitelists. Export inverted to denylist. `goalWeight`/`goalExerciseMinutes` silent-drop bug fixed in `src/app.js` (v3.20.0) and deployed `bundle.js` (v3.21.0, real-device verified).
- **VAPID config corrected** — `VAPID_CONTACT_EMAIL` = `mailto:rob@hydroprotracker.com`; public key set.
- **`env.RESEND_FROM_EMAIL`** — optional undocumented var; falls back to `HydroPro Tracker <login@hydroprotracker.com>` if unset.

---

## Current direction (Aug 18, 2026)

**Clinic-first** (`STRAT-10`). Clinic distribution gets priority for attention and sequencing; consumer continues as a downstream byproduct, with both acquisition ramps still in scope (`STRAT-05`).

Working sequence (updated Aug 21): backfill (Add Missed Items on Today page, item 7) → fix OO preset modal nested-position bug → UX-OPEN-01 Phase 2 (Settings redesign) → server as source of truth (`ARCH-OPEN-04`) → clinic-side build (`ARCH-OPEN-02`).

Running in parallel, needing no engineering: clinic validation conversations (`STRAT-OPEN-03`), pricing (`STRAT-OPEN-02` — the most time-sensitive open item), and the digital-health attorney consult (`LEGAL-OPEN-01`).

---

## Not built

No native app (so no HealthKit / Health Connect write — platform boundary, see `STRAT-04`). No wearable sync. No EHR/FHIR integration. No AI coach. No clinic-side dashboard or multi-tenancy. No first-run onboarding flow. No support channel. No billing.

---

## Testers

Closed group via Cloudflare Access allowlist. Feedback arrives through the in-app form (stored in KV) with push alerts.
