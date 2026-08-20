# HydroPro Tracker — Decision Log

**Purpose:** a single record of what's been decided, why, and what's still open. Prevents settled questions from being quietly re-litigated, and gives any new conversation an accurate starting point.

**How to maintain it:**
- Add an entry when a decision is actually made — not when an option is merely discussed.
- Keep the "Why" to one or two lines. The reasoning matters more than the detail.
- Never delete an entry. If a decision changes, mark the old one `Superseded by [ID]` and add a new one.
- Re-upload to Project knowledge whenever it changes meaningfully.

**Status values:** `Locked` (settled, don't revisit without cause) · `Provisional` (working assumption, expected to firm up) · `Open` (needs a call) · `Superseded`

**ID prefixes:** `STRAT` strategy/positioning · `ARCH` architecture · `PROD` product scope · `UX` interface · `OPS` process/tooling · `LEGAL` legal/compliance

---

## Strategy & positioning

**STRAT-01 — Scope boundaries: what HydroPro is not.**
Not a replacement for wearables/fitness trackers, meal-planning/diet apps, or medical-advice apps.
*Why:* those categories are crowded, commodity, and carry liability. Staying out keeps the product focused and defensible.
*Status:* **Locked** · Aug 17, 2026

**STRAT-02 — Core positioning: the entry-and-routing layer.**
HydroPro is the tool people use to *enter* daily health data, and the tool that routes that data outward — to other apps, doctors, and clinicians.
*Why:* wearables capture what's passive. Nothing passively captures "I took my B12, I had my drip Tuesday, I have 3 sessions left." That data only exists if a human enters it, and existing apps optimize for calorie counting, not adherence.
*Status:* **Locked** (first half) / see STRAT-04 for the routing half · Aug 17, 2026

**STRAT-03 — Strategy is being locked before re-architecture.**
Business strategy and roadmap get formalized first; technical rearchitecture is planned afterward, against that strategy.
*Why:* avoids rebuilding toward the wrong shape. The architecture needed for a clinic-distributed product differs materially from a consumer one.
*Status:* **Locked** · Aug 17, 2026

**STRAT-04 — Routing thesis has a known technical ceiling.**
A PWA cannot write to Apple HealthKit or Android Health Connect; both require a native app. So "feeds all your other tools" is not deliverable on the current stack at any effort level.
*Why:* platform boundary, not a config issue. Recorded so it isn't rediscovered later or over-promised to a partner.
*Status:* **Locked as a constraint** — the response to it is ARCH-OPEN-03 · Aug 17, 2026

**STRAT-05 — Both acquisition paths are in scope: clinic-referred and self-discovered.**
Clinic-referred users arrive with a protocol code that pre-fills goals, supplements, and treatments. Self-discovered users configure themselves. One app, two entry ramps — not a forked product.
*Why:* the strongest consumer segments (polypharmacy patients, supplement-stack spenders) have the same underlying problem as clinic patients — adherence and inventory. The consumer path is the same product aimed at people who self-identify, which means supporting both is not a divergent bet. Note this does not resolve `STRAT-OPEN-01`, which is about *sequencing and focus*, not exclusivity.
*Status:* **Locked** · Aug 17, 2026

*Note: STRAT-06–STRAT-09 were drafted in the Aug 17 wearable-integration session as STRAT-05–STRAT-08, and renumbered +1 here to resolve an ID collision with STRAT-05 above.*

**STRAT-06 — Wearable/health-platform integration splits into two classes with different prerequisites.**
Cloud APIs (Oura, Fitbit→Google Health, Garmin) are server-to-server and need no native app. On-device platforms (Apple Health, Health Connect, Samsung Health) have no cloud API of any kind and require a native wrapper plus app-store presence. Additionally: writing is unavailable on Oura and Garmin, so the on-thesis direction (push) is only reachable via the native path.
*Why:* recorded so the two classes aren't conflated in future estimates, and so "start with the cheap cloud pull" isn't mistaken for a step toward the routing thesis — it points the other way.
*Status:* **Locked as a constraint** · Aug 17, 2026

**STRAT-07 — HydroPro will not become the wearable-ingest pipe for clinics (provisional).**
A clinic asked for patient wearable data. Two shapes considered: (A) HydroPro ingests from wearable platforms and delivers a combined report; (B) HydroPro delivers only patient-entered adherence data, and the clinic sources wearable data independently. Recommendation is B / "best source, not only source."
*Why:* (A) makes HydroPro a Business Associate almost by construction, puts a part-time project in direct competition with funded aggregators (Terra/Thryve/Validic) who already hold the partnerships, dilutes the one differentiated data set (adherence) into commodity pass-through, and creates permanent upstream-API maintenance debt. The existing share link and printable summary already deliver (B) today at zero engineering cost.
*Status:* **Provisional** — pending the clinic's answer on what they'd do with the data and whether they'd pay more for a combined report · Aug 17, 2026

**STRAT-08 — "Pull only" reduces effort substantially, but only for cloud-API devices.**
Clinic needs ingest only, no write-back. This removes the entire write direction. Ingesting from cloud APIs (Oura, Fitbit→Google Health) needs no native app and runs in the existing Worker: ~4–7 weeks part-time, no architectural cascade. Ingesting from Apple Health or Health Connect still requires the Capacitor wrapper and app-store presence in the read direction too, with the full cascade (Access removal, LEGAL-OPEN-01 blocking): ~6–12 weeks. Patient device mix therefore determines the estimate.
*Status:* **Locked as a constraint** · Aug 17, 2026

**STRAT-09 — User-mediated export is not a viable path to wearable data.**
Considered having each user export weekly from their device/account and send it to the clinic or into HydroPro, in place of API integration. Rejected as a product mechanism.
*Why:* (1) it does not change compliance posture — BA status turns on processing PHI for a paying clinic, not on the transport, so a forwarded ZIP is the same exposure as an API call; (2) engineering is *worse* than the API — five undocumented, silently-drifting archive formats with no contract, versus versioned APIs with changelogs; (3) it violates the locked UX doctrine (under-5-second interaction, grandmother test, anti-guilt) — a recurring weekly chore is the exact abandonment pattern the design avoids. Platform specifics: Health Connect's scheduled export is an encrypted ZIP for its own re-import, unreadable by third parties; Apple Health export is manual, unfiltered lifetime XML; Oura PATs are deprecated, so user-supplied tokens are no longer possible.
*Exception retained:* Apple Shortcuts can read HealthKit on a schedule and POST to a URL without a native wrapper. Not a product feature (iOS-only, fragile, per-user setup), but usable as a cheap pilot instrument to test whether a clinic acts on wearable data before committing to real integration.
*Status:* **Locked** · Aug 17, 2026

**STRAT-10 — Clinic-first sequencing.**
Clinic distribution (B2B2C) gets priority for attention and roadmap sequencing; consumer continues as a downstream byproduct. Does not narrow `STRAT-05` — both acquisition ramps remain in scope. Resolves `STRAT-OPEN-01`.
*Why:* clinic conversations are perishable — an operator in an active conversation may commit elsewhere if nothing materializes. Current consumer testers are friendly users who tolerate waiting. Where one opportunity decays and the other doesn't, sequence toward the decaying one. Market logic (near-zero CAC, clear clinic ROI, crowded consumer category) points the same direction. Explicit call by Rob.
*Status:* **Locked** · Aug 18, 2026

---

## Product scope

**PROD-01 — Daily log history: keep everything, no pruning.**
Every day's logs are retained indefinitely. No retention cap.
*Why:* nothing was ever being deleted (Reports already reads multiple days); per-day data is tiny; and looking back has genuine clinical value. A 2-week cap would have meant *building* a limitation that didn't exist.
*Status:* **Locked** · Aug 17, 2026

**PROD-02 — Inventory/subscription tracking is an add-on, not a separate list.**
`trackInventory`, `qtyRemaining`, `expirationDate` are optional fields on existing Supplements and Treatments rather than a standalone Subscriptions entity.
*Why:* simpler model, no duplicate data entry, and logging a dose the normal way already decrements it.
*Status:* **Locked** · Aug 17, 2026

**PROD-03 — Inventory is one live count, not batch tracking.**
A single correctable "remaining" number per item, rather than tracking separate purchase batches with individual expiry.
*Why:* covers the actual need (what's left, when to reorder) without the bookkeeping burden. Revisit only if a clinic specifically requires batch-level detail.
*Status:* **Provisional** · Aug 17, 2026

**PROD-04 — Low-supply and expiration alerts included from the start.**
Warnings at ≤3 remaining and ≤7 days to expiry, shown in Setup, on tiles, and in the Subscriptions view.
*Why:* the alert *is* the value for the DripBar/refill use case — a silent count doesn't change behavior.
*Status:* **Locked** · Aug 17, 2026

**PROD-05 — Each log entry consumes one unit by default.**
Quantity per log is respected where present, but the default assumption is 1 unit per logged dose.
*Why:* no per-dose quantity concept existed; adding one wasn't needed for the core use case.
*Status:* **Provisional** · Aug 17, 2026

---

## Architecture

**ARCH-01 — Cloudflare stack is settled.**
Pages + Workers + D1 + KV. Not revisiting.
*Why:* cheap, fast, no ops, scales well past foreseeable need.
*Status:* **Locked**

**ARCH-02 — Doctor shares are frozen snapshots with a 90-day expiry.**
A share link captures a point-in-time summary rather than exposing a live feed.
*Why:* privacy-correct default — a link shared once shouldn't grant indefinite ongoing access.
*Status:* **Locked** · prior sessions

**ARCH-03 — Share links are served from the Worker's ungated origin.**
Not routed through the Cloudflare Access–gated `/app/*` path.
*Why:* a recipient (a doctor) can't be expected to authenticate into the app.
*Status:* **Locked** · prior sessions

**ARCH-04 — Built artifacts are no longer to be hand-edited.**
Recent work was done directly on the minified `bundle.js` because committed source had drifted. This stops once source is reconciled.
*Why:* it blocks contributors, invalidates the test suite, and risks a future `npm run build` silently reverting shipped features.
*Status:* **Locked as a rule** — execution is ARCH-OPEN-01 · Aug 17, 2026

---

## Interface

**UX-01 — Numbers stay below the ring, never inside the icon circles.**
Rejects an earlier recommendation to center values inside the icons.
*Why:* the icon circles are a deliberate visual anchor — they make the screen pop. Explicit call by Rob.
*Status:* **Locked** · Aug 17, 2026

**UX-02 — "Uniform tiles" means uniform formatting, not space savings.**
All 8 tiles follow one structure: label → goal → status → ring → number → bottom label.
*Why:* consistency was the goal; freeing up screen space was not.
*Status:* **Locked** · Aug 17, 2026

**UX-03 — All 8 tiles use true percentage progress rings.**
Including Weight, Exercise, Supplements, and Treatments (previously binary done/not-done).
*Status:* **Locked** · Aug 17, 2026

**UX-04 — Weight ring: no celebration either direction.**
Ring is empty until a weight is logged, then fills as today's weight ÷ target. Shows signed `+X` / `−X` lbs. No badge for being over or under.
*Why:* being over or under goal is a fact, not an achievement — this is a health tool, not a game.
*Status:* **Locked** · Aug 17, 2026

**UX-05 — Treatments goal/done reflects today only.**
Goal counts treatments actually due today; done counts those actually logged today. Nothing scheduled → full ring, 0 goal, 0 done.
*Why:* fixed a real bug where never-logged treatments counted as "done." RX & Supplements checked and correct as-is (a never-taken supplement is deliberately treated as due immediately).
*Status:* **Locked** · Aug 17, 2026

**UX-06 — Navigation and titles.**
Nav order: Log It! · Today · Stats · Setup · Settings. Titles: "TO DATE STATS:" + date, "Setup for:" + date, "Settings" (no date).
*Status:* **Locked** · Aug 17, 2026 — *amended Aug 20, 2026: Setup renamed to "My Plan" throughout (`UX-OPEN-01` Phase 1, v3.22.0). Nav order and the other two titles unchanged.*

**UX-07 — Tile order on Log It!**
Water, Protein, Calories, Sleep, Weight, Exercise, Treatments, RX & Supplements.
*Status:* **Locked** · Aug 17, 2026

**UX-08 — Health Summary and doctor share live at the bottom of Stats.**
Moved off Settings.
*Why:* sharing is top-of-mind while viewing stats, not while changing preferences.
*Status:* **Locked** · Aug 17, 2026

**UX-09 — Today page uses two independently scrollable regions.**
Today's Log guaranteed ≥50% of viewport; To Do Today scrolls internally when long.
*Why:* To Do Today must stay visible while scrolling the day's log.
*Status:* **Locked** · Aug 17, 2026

---

## Legal & compliance

**LEGAL-01 — Zappix has no claim on HydroPro.**
HydroPro is developed on Rob's personal PC, under his personal GitHub account (`Bobs-Personal-Zappix`, created personally), and his personal Claude Pro account (`OPS-04`). Its origin as a Zappix Claude Enterprise exercise does not create a claim: personal use of that workspace was permitted, and HydroPro is unrelated to Zappix's business line. Resolves `LEGAL-OPEN-02`.
*Why:* both prongs are answered — authorized use of the workspace, and no overlap with the employer's line of business. Explicit call by Rob.
*Status:* **Locked** · Aug 18, 2026

---

## Process & tooling

**OPS-01 — One Project, not separate strategy and development projects.**
Both this conversation and the prior (full) conversation move into it.
*Why:* strategy and architecture are interdependent here — the roadmap analysis was only useful because it was grounded in actual code state. Also, from inside a Project only that Project's conversations are searchable, so leaving history outside would start every strategy chat blind.
*Status:* **Provisional** — pending setup · Aug 17, 2026

**OPS-02 — Knowledge files are the continuity mechanism, not chat history.**
Project knowledge holds: roadmap v2, CHANGELOG.md, this decision log, and a short current-state note.
*Why:* a new chat inside a Project does not automatically load prior conversations. Knowledge files load every time.
*Status:* **Locked** · Aug 17, 2026

**OPS-03 — No secrets in chat.**
Verified clean to date: `wrangler.toml` holds placeholders only; `worker.js` reads `env.RESEND_API_KEY` rather than hardcoding.
*Status:* **Locked** · Aug 17, 2026

**OPS-04 — Development moved to Rob's personal Pro account, built via Claude Code.**
HydroPro's Claude Project and ongoing development move off the Zappix Enterprise workspace to Rob's personal Pro account; development runs through Claude Code against a locally cloned repo. Resolves OPS-OPEN-01 (Claude Code: yes).
*Why:* the project outgrew its origin as a Zappix Claude-learning exercise and now has independent product ambitions — it should be owned and resourced outside company infrastructure, avoiding quota conflict and ownership ambiguity. Claude Code also brings real repo access, git history, and proper test-suite runs (the kind that would have surfaced the source drift immediately).
*Status:* **Locked** (decided) / execution in progress · Aug 18, 2026

**OPS-05 — The repo carries its own continuity docs and enforced guardrails.**
`CLAUDE.md` at the repo root holds the working rules; `docs/` holds DECISION-LOG.md, CURRENT-STATE.md, and ROADMAP-v2.md; `tools/harness.js` holds the jsdom harness; `.claude/settings.json` denies `npm run build*` and production `wrangler d1 execute`, and asks on `git push` / `wrangler deploy`.
*Why:* Claude Code reads the repo, not Project knowledge — continuity docs only travel if they live in the repo. And `CLAUDE.md` is context, not an enforcement layer, so the two commands that could destroy shipped work are blocked at the permissions layer instead of merely discouraged.
*Status:* **Locked** · Aug 18, 2026

**OPS-06 — Design proposals get an `Open` entry when proposed, not when decided.**
A proposal that isn't yet a decision still goes in the Open section as `UX-OPEN-nn` / `PROD-OPEN-nn`, one or two lines pointing at the full spec, following the existing `STRAT-OPEN` pattern.
*Why:* the Configuration & Onboarding redesign was worked out in a session and nearly lost — it fit neither the "log decisions only" rule nor the knowledge files. The Open section is already the live agenda; proposals belong on it.
*Status:* **Locked** · Aug 18, 2026

**OPS-07 — Document updates are delivered as complete replacement files, never paste-in fragments.**
When any knowledge file changes, the whole updated file is produced for Rob to save over the old one. No "add this entry," no "paste this in," no hand-editing.
*Why:* explicit call by Rob. Hand-merging fragments across a growing set of documents is error-prone, and a missed paste silently corrupts the continuity mechanism the whole project depends on (`OPS-02`).
*Status:* **Locked** · Aug 18, 2026

**OPS-08 — jsdom harness is now runnable.**
`tools/harness.js` fixed for jsdom 25 (`getInternalVMContext`); a minimal root `package.json` + `eslint.config.js` added. `node tools/harness.js site/app/bundle.js` boots the real bundle clean; `npm run lint:bundle` runs a no-undef sweep (baseline: 11 pre-existing vendor-guard errors).
*Why:* the verification steps CLAUDE.md assumes were not actually runnable before this. Bundle edits can now be booted and lint-checked, not just static-checked.
*Status:* **Locked** · Aug 19, 2026

**OPS-09 — Worker deploy path established from the WSL2 clone.**
First successful `wrangler deploy` from the local clone, Aug 20, 2026. `worker/` has its own `package.json` with `@pushforge/builder` and wrangler 3. `worker/package-lock.json` committed. Note: wrangler 4 is available — upgrade before the next Worker deploy (`npm install --save-dev wrangler@4` in `worker/`).
*Why:* prior to this session, the committed `worker.js` and `wrangler.toml` were sanitized templates; the Worker had never been deployed from this clone.
*Status:* **Locked** · Aug 20, 2026

---

## Open — needs a decision

These are recommendations or forks, **not** decisions. They double as the agenda for the strategy sessions.

**STRAT-OPEN-02 — Business model and pricing.** — *now the most time-sensitive open item.*
Proposed shape: clinic subscription per location, consumer free as distribution, consumer premium only after retention proves out. Explicitly ruled out: data monetization.
*Urgency (Aug 18):* `STRAT-10` makes clinic conversations the active track, and those conversations produce the question "what does this cost." There is no answer on file. Needed **before the next clinic meeting**, not after — walking in without a price frame either stalls the conversation or anchors it somewhere unchosen.

**STRAT-OPEN-03 — Validation plan before building clinic infrastructure.**
Proposed: 2–3 clinics, ~10 patients each, current app as-is; measure retention and share-link generation. **Not yet agreed.**

**STRAT-OPEN-04 — Characterize the wearable-integration request before scoping it.**
A tester or clinic asked for health-platform integration; the literal ask was never recorded and exists only in recall or the feedback KV. Recover it, then determine: (a) tester or clinic — different signal weight entirely, since the DripBar signal counted because it was unprompted and tied to clinic revenue; (b) which specific metric they want to stop typing — sleep/weight implies entry friction (on-thesis, and possibly a scope signal that those two tiles compete with hardware), steps/HR implies a dashboard request (off-thesis per roadmap §5); (c) if a clinic, whether they want to receive the data or just enable the patient. Bring to the STRAT-OPEN-03 clinic conversations rather than as separate outreach. **No effort estimate is meaningful until this is answered.**

**UX-OPEN-01 — Configuration & Onboarding redesign: approve, amend, or defer.**
Full spec in `HydroPro-Config-Onboarding-Redesign.md` (project knowledge). Proposes: rename Setup → "My Plan"; merge the 8 tracker toggles and 6 goal inputs into one row per tracker; collapse the three unbounded CRUD lists to summary rows; consolidate Settings to six status rows; rebuild "Your data" as a single backed-up/not-backed-up status with ranked options behind it; group Reminders by intent; promote the tutorial and fire it on first run; add two onboarding ramps (clinic protocol code / self-serve) both ending in a first logged entry.
*Dependencies:* `ARCH-OPEN-01` (source reconciliation) should land first — this relocates large JSX blocks, which is the worst kind of change to attempt on a minified bundle. Analytics should land before the onboarding half ships, or its effect on time-to-first-log and D7 is unmeasurable. `ARCH-OPEN-05` (versioned schema) should land before protocol provenance.
*Update (Aug 18):* items 8–10 of the spec's §7 were gated on `STRAT-OPEN-01`. `STRAT-10` resolves that gate, and clinic-first **promotes** them — the protocol code is the clinic's distribution mechanism and light white-labeling is cheap and persuasive in a sales conversation. Note the spec cites the versioned-schema prerequisite as `ARCH-OPEN-02`; that is a mis-reference, and the correct ID is `ARCH-OPEN-05`.
*Phase 1 complete (Aug 20, v3.22.0):* My Plan page redesigned in `src/app.js`. Unified tracker rows — one row per tracker with toggle + goal inline. Off-trackers hideable entirely via per-row toggle; "Show all trackers" affordance reveals hidden rows. Three CRUD lists collapsed to summary rows with live counts. WO component: 403 → 310 lines. Not yet deployed to `site/app/bundle.js` — deploy is a separate decision after real-browser visual verification.

*Two of five §8 open questions resolved (Aug 20):* (1) "My Plan" confirmed as the name — amends UX-06. (2) Off-trackers hideable entirely — collapsed rows, "Show all trackers" link.

*Remaining open questions:* caregiver case (probably "not yet"), appointment date location, clinic-code prompt scope (everyone vs. QR deep-link only).

*Small outstanding from Phase 1:* "Add in Setup" stale copy on two Log It! tiles (Treatments/Supplements empty-state CTA) — quick fix, not yet addressed.

*Phase 2 (not started):* Settings consolidation — six status rows, "Your data" backed-up/not status, Reminders grouped by intent, tutorial on first run.
*Phase 3 (not started):* Clinic onboarding ramp.

**ARCH-OPEN-01 — Source reconciliation: extraction complete, build pipeline established.**
Chosen approach: extract from live bundle. Executed Aug 20, 2026.
- `src/app.js` — 6,104 lines extracted from `site/app/bundle.js` (beautified lines 25859–31962). Parses cleanly. All 37 vendor short-names mapped and wired as proper ES imports (React, ReactDOM, recharts, 24 lucide-react icons).
- `esbuild.config.js` — build pipeline authored from scratch (none existed). Output: `site/app/bundle.build.js` (gitignored, never deployed). `NODE_ENV=production` set; harness-verified clean boot.
- `site/app/bundle.js` and `src/App.jsx` — untouched throughout. The deployed bundle remains the source of truth until the build output is verified to match production behavior.
*Worker side resolved (Aug 20):* the real deployed `worker.js` (728 lines) is committed, `wrangler.toml` has real values, first `wrangler deploy` succeeded (`OPS-09`).
*All gates passed (Aug 20, 2026):*
- Source extracted: `src/app.js`, 6,104 lines, build pipeline via `esbuild.config.js`
- Recharts pinned to 2.15.4 (v2 fingerprint matched from deployed bundle; `@reduxjs/toolkit`/`reselect` eliminated)
- All 38 vendor identifiers renamed to real names across 7 batches; `XIcon` used instead of `X` to avoid a real local-variable collision
- Harness clean after every batch; real-browser Stats verification confirmed by Rob on device
- `site/app/bundle.js` remains the deployed artifact; `src/app.js` + `esbuild.config.js` now the source of truth for future edits
*Status:* **Locked — complete** · Aug 20, 2026

**ARCH-OPEN-02 — Data model: when to move off the single-blob store.**
Currently one JSON blob in `account_backups.data`. Cannot answer "which patients are lapsing" or "what's D30 retention" — i.e. the entire B2B product. Proposed: keep the blob for sync, add normalized `log_entries` + `user_activity` rows.
*Update (Aug 20, 2026):* `user_activity` shipped as part of `ARCH-OPEN-06` (retention analytics). The broader normalized model (`log_entries`, lapsing-patient queries) remains open — that's the clinic dashboard prerequisite and the next engineering priority after the bundle coverage fix.

**ARCH-OPEN-03 (revised) — Health-platform integration: scope and sequencing.**
Widened from "native wrapper for HealthKit / Health Connect?" to the full question. Forks: (a) drop the ambition entirely; (b) Capacitor wrapper, push-first to HealthKit + Health Connect — collapses Samsung and most Android into one integration, but forces ARCH-OPEN-04 (Access removal), LEGAL-OPEN-01, and provenance work in ARCH-OPEN-02; (c) cloud pull only (Oura ± Google Health) — cheapest, but off-thesis per roadmap §5; (d) aggregator (Terra/Thryve/Validic/Rook) — one integration, holds the Garmin partnership, but a third party in the middle of health data. Notes: Garmin's partner program is closed to new applicants; Google restricted health scopes require CASA assessment; the legacy Fitbit Web API decommissions Sept 2026.

**ARCH-OPEN-04 — Server as source of truth, and removing Cloudflare Access.**
Standing data-loss exposure: history lives in one browser's storage. Access also can't scale past an invited list.

**ARCH-OPEN-05 — Versioned schema and deep-merge migrations.**
Replace the hand-maintained field whitelists in the load path (`One()`, `vj()`, `yj()`) with a versioned schema, deep-merge-against-defaults, and an explicit migration chain. Roughly 100 lines; retires the silent-field-loss bug class rather than fixing it once more. Cheap in real source, miserable in a minified bundle — so it belongs immediately after `ARCH-OPEN-01`. Prerequisite for protocol provenance in `UX-OPEN-01`.
*Created Aug 18, 2026 — this work previously had no ID and was cited incorrectly as `ARCH-OPEN-02` in the redesign spec.*

**ARCH-OPEN-05 — Versioned schema and deep-merge migrations.**
Replaced three hand-maintained field whitelists in the load path with a single `migrate(stored)` function using `deepMergeDefaults` against `defaultSettings`. Export inverted from allowlist to denylist. `SCHEMA_VERSION=2` stamped with a migration-chain hook for future breaking changes. Fixes `goalWeight`/`goalExerciseMinutes` silent-drop bug in `src/app.js` (shipped v3.20.0); same bug patched in deployed `site/app/bundle.js` separately (v3.21.0, real-device verified Aug 20).
*Why:* the silent-field-loss bug had already bitten sleep, weight, and supplements. The fix retires the whole bug class rather than patching it once more.
*Status:* **Locked — complete** · Aug 20, 2026

**ARCH-OPEN-06 — Retention analytics via the Worker.**
`POST /api/progress` merged: D1 retention write (opaque id + server-assigned UTC date to `user_activity`) runs for every caller before the KV progress save, which is preserved intact for push subscribers and the cron job. Full D1 schema migrated: 6 tables (`users`, `login_tokens`, `sessions`, `shares`, `account_backups`, `user_activity`). Deployed Aug 20, 2026 — first row recorded same day.
*Coverage gap closed (Aug 20, 2026):* bundle coverage fix (3b) shipped as v3.18.0 — `wtDeviceId()` + `wtActivityPing()` + mount-only effect added to `site/app/bundle.js`. All users, push-subscribed or not, now generate a `user_activity` row via a `{id}`-only `POST /api/progress` on app mount. Verified on real device: both push-subscribed and non-push users confirmed producing rows in `user_activity`.
*Status:* **Fully deployed and verified** · Aug 20, 2026

**LEGAL-OPEN-01 — Compliance path, including whether to accept HIPAA obligations.**
The clinic path may make HydroPro a Business Associate. Separately, the FTC Health Breach Notification Rule and Washington's My Health My Data Act apply to consumer health apps outside HIPAA. Needs a digital-health attorney, not a decision made in-app.
*Addendum (Aug 17, 2026):* Two additional independent triggers identified. (1) App-store distribution, required for any native health-platform integration, brings its own privacy-policy, data-deletion, and health-data-declaration obligations. (2) If a clinic wants to *receive* patient wearable data rather than the patient merely using it, that is materially closer to Business Associate territory than patient-entered adherence data shared via a snapshot link — in that case, legal consultation must precede the build, not follow it.

---

*Last updated: August 20, 2026 (ARCH-OPEN-06 closed, ARCH-OPEN-01 closed, ARCH-OPEN-05 closed, UX-OPEN-01 Phase 1 complete)*
