# HydroPro Tracker — Decision Log

**Purpose:** a single record of what's been decided, why, and what's still open. Prevents settled questions from being quietly re-litigated, and gives any new conversation an accurate starting point.

**How to maintain it:**
- Add an entry when a decision is actually made — not when an option is merely discussed.
- Keep the "Why" to one or two lines. The reasoning matters more than the detail.
- Never delete an entry. If a decision changes, mark the old one `Superseded by [ID]` and add a new one.
- Re-upload to Project knowledge whenever it changes meaningfully.

**Status values:** `Locked` (settled, don't revisit without cause) · `Provisional` (working assumption, expected to firm up) · `Open` (needs a call) · `Superseded`

**ID prefixes:** `STRAT` strategy/positioning · `ARCH` architecture · `PROD` product scope · `UX` interface · `OPS` process/tooling

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
*Status:* **Locked** · Aug 17, 2026

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

---

## Open — needs a decision

These are recommendations or forks, **not** decisions. They double as the agenda for the strategy sessions.

**STRAT-OPEN-01 — Clinic-first (B2B2C) or consumer-first?**
Recommendation on the table: clinic-first, with consumer as a downstream byproduct. Rationale: DripBar operators asked unprompted for a feature that solves a revenue problem, distribution comes via the clinic at near-zero CAC, and consumer health tracking is brutally crowded. **Not yet decided.**

**STRAT-OPEN-02 — Business model and pricing.**
Proposed shape: clinic subscription per location, consumer free as distribution, consumer premium only after retention proves out. Explicitly ruled out: data monetization.

**STRAT-OPEN-03 — Validation plan before building clinic infrastructure.**
Proposed: 2–3 clinics, ~10 patients each, current app as-is; measure retention and share-link generation. **Not yet agreed.**

**STRAT-OPEN-04 — Characterize the wearable-integration request before scoping it.**
A tester or clinic asked for health-platform integration; the literal ask was never recorded and exists only in recall or the feedback KV. Recover it, then determine: (a) tester or clinic — different signal weight entirely, since the DripBar signal counted because it was unprompted and tied to clinic revenue; (b) which specific metric they want to stop typing — sleep/weight implies entry friction (on-thesis, and possibly a scope signal that those two tiles compete with hardware), steps/HR implies a dashboard request (off-thesis per roadmap §5); (c) if a clinic, whether they want to receive the data or just enable the patient. Bring to the STRAT-OPEN-03 clinic conversations rather than as separate outreach. **No effort estimate is meaningful until this is answered.**

**ARCH-OPEN-01 — Source reconciliation approach.**
Proposed staged path: (1) extract the ~6,500 lines of app code from the bundle, wire real npm imports, commit as source — kills the drift risk immediately; (2) rename identifiers in tested batches; (3) convert to JSX gradually or never. Alternative: reconstruct from the 3,294-line stale source and port features forward.

**ARCH-OPEN-02 — Data model: when to move off the single-blob store.**
Currently one JSON blob in `account_backups.data`. Cannot answer "which patients are lapsing" or "what's D30 retention" — i.e. the entire B2B product. Proposed: keep the blob for sync, add normalized `log_entries` + `user_activity` rows.

**ARCH-OPEN-03 (revised) — Health-platform integration: scope and sequencing.**
Widened from "native wrapper for HealthKit / Health Connect?" to the full question. Forks: (a) drop the ambition entirely; (b) Capacitor wrapper, push-first to HealthKit + Health Connect — collapses Samsung and most Android into one integration, but forces ARCH-OPEN-04 (Access removal), LEGAL-OPEN-01, and provenance work in ARCH-OPEN-02; (c) cloud pull only (Oura ± Google Health) — cheapest, but off-thesis per roadmap §5; (d) aggregator (Terra/Thryve/Validic/Rook) — one integration, holds the Garmin partnership, but a third party in the middle of health data. Notes: Garmin's partner program is closed to new applicants; Google restricted health scopes require CASA assessment; the legacy Fitbit Web API decommissions Sept 2026.

**ARCH-OPEN-04 — Server as source of truth, and removing Cloudflare Access.**
Standing data-loss exposure: history lives in one browser's storage. Access also can't scale past an invited list.

**LEGAL-OPEN-01 — Compliance path, including whether to accept HIPAA obligations.**
The clinic path may make HydroPro a Business Associate. Separately, the FTC Health Breach Notification Rule and Washington's My Health My Data Act apply to consumer health apps outside HIPAA. Needs a digital-health attorney, not a decision made in-app.
*Addendum (Aug 17, 2026):* Two additional independent triggers identified. (1) App-store distribution, required for any native health-platform integration, brings its own privacy-policy, data-deletion, and health-data-declaration obligations. (2) If a clinic wants to *receive* patient wearable data rather than the patient merely using it, that is materially closer to Business Associate territory than patient-entered adherence data shared via a snapshot link — in that case, legal consultation must precede the build, not follow it.

**LEGAL-OPEN-02 — IP ownership: does Zappix have any claim on HydroPro?**
HydroPro began as a Zappix "learn Claude / product management" exercise before growing into an independent product, and has now been moved to Rob's personal account. Whether any work-product, IP-assignment, or use-of-company-resources questions attach is worth clarifying so it can't surface later during clinic-partner or investor diligence. Can likely be raised in the same digital-health attorney engagement as LEGAL-OPEN-01. **Not a blocker — flag so it doesn't drift.**

---

*Last updated: August 18, 2026*
