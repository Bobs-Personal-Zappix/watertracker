# HydroPro Tracker — Current State

**Orientation card for a new conversation.** Answers "what exists right now" so it doesn't have to be rediscovered. Update when any of it changes.

*As of: August 17, 2026 · Deployed version: 3.16.0*

---

## What's live

**URLs**
- `hydroprotracker.com` — public landing page.
- `hydroprotracker.com/app/` — the tracker, gated by **Cloudflare Access** (email allowlist, closed testing group only).
- Worker on its own `workers.dev` domain — deliberately ungated, which is what makes doctor-share links reachable without a login.

**Tracked metrics (8 tiles, all with percentage progress rings)**
Water · Protein · Calories · Sleep · Weight · Exercise · Treatments · RX & Supplements — in that order on the Log It! page.

**Tabs:** Log It! · Today · Stats · Setup · Settings

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
8. **Cloudflare Access can't scale** past an invited list. Magic-link auth is built but Access is still the gate.

---

## Not built

No native app (so no HealthKit / Health Connect write — platform boundary, see `STRAT-04`). No wearable sync. No EHR/FHIR integration. No AI coach. No clinic-side dashboard or multi-tenancy. No first-run onboarding flow. No support channel. No billing.

---

## Testers

Closed group via Cloudflare Access allowlist. Feedback arrives through the in-app form (stored in KV) with push alerts.
