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

**STRAT-11 — "No AI" decision reversed, scoped to assisted-entry only.**
The prior decision to shelve AI features (roadmap §5) is reversed for the narrow case of AI-assisted data entry ("Smart Entry"): the user describes what they consumed in plain language, an AI interprets it into the app's tracked metrics, and the user reviews and confirms before anything is logged. This does NOT reopen the AI-coach decision. The distinction is load-bearing: Smart Entry estimates and interprets; it never recommends, never comments on whether something is healthy, and never interprets what a log means for the user's health. The user is always the final authority — no value enters the record without explicit human confirmation.
*Status:* **Locked** — explicit call by Rob · Aug 21, 2026 · target v3.40.0

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

**PROD-06 — Backfill: "Enter Missed Items" on past days.**
The past-day view (Today → calendar icon → All Past Days → a day) gains an "Enter Missed Items" button at the top, opening a portaled entry sheet with a date field pre-filled with the viewed day but editable — so days with zero existing entries, which never appear in All Past Days, stay reachable. One control per enabled tracker. Single Save. No limit on how far back.
*Why:* people forget to log in the moment. Adherence data that can't be corrected understates real behavior, which matters most in the clinic-facing summary.
*Status:* **Locked — deployed v3.33.0** · Aug 21, 2026

**PROD-07 — Treatments excluded from backfill in v1; RX & Vitamins included.**
*Why:* treatments run on multi-week intervals with next-due calculated forward from the last actual dose (intentional schedule drift, v3.4 design note), so a late-entered dose risks yanking a forward schedule the user has been actively managing. Supplements default to daily, making drift risk negligible. Revisit once retroactive schedule behavior is explicitly specified.
*Status:* **Provisional** · Aug 21, 2026

**PROD-08 — Backfill decrements inventory but never recalculates next-due.**
Applies to all backfilled entries as a rule, not judged per tracker. Backfilled entries also never fire goal celebrations, never affect today's due/done state, and restore inventory on delete through the same path live entries use.
*Why:* a late-entered dose was genuinely consumed, so inventory must reflect it; but the forward schedule is state the user has been actively managing and must not be rewritten by a correction to the past.
*Status:* **Locked** · Aug 21, 2026

**PROD-09 — Backfilled entries carry provenance.**
Every backfilled entry stores `backfilled: true` plus an `enteredAt` wall-clock timestamp distinct from its log date. Not surfaced in the UI in v1. Added via the versioned schema (`migrate`/`deepMergeDefaults`), not a hand-maintained field list.
*Why:* trivially cheap now, impossible to retrofit onto existing entries. Clinic adherence data is materially more credible when live logs are distinguishable from later corrections.
*Status:* **Locked** · Aug 21, 2026

**PROD-10 — Smart Entry Phase 1 scope: all trackers, three interpretation classes.**
Phase 1 (text-based) covers all current trackers, split by how the AI handles each:
- *Consumables & time-based* (Water, Protein, Calories, Exercise, Calories Burned, Sleep, Time In Bed / Out of Bed): AI interprets a natural-language description into numeric values; user confirms or edits.
- *Treatments & RX/Vitamins:* AI matches a spoken name against the user's OWN configured items. When match confidence is low, the AI surfaces candidate items for the user to pick ("did you mean…?") rather than guessing. Never decrements inventory on an unconfirmed match.
- *Measured readings* (Weight, Resting Heart Rate, Steps): no interpretation — the spoken/typed number is captured directly, since there is nothing to interpret and the AI adds no value.
*Why:* the three classes have genuinely different interpretation problems and failure modes; conflating them would muddy the Phase 1 accuracy signal and put inventory data at risk. Explicit call by Rob (chose full-scope Phase 1 with the safe-matching design over a consumables-first version).
*Status:* **Locked** · Aug 21, 2026 · target v3.40.0

**PROD-11 — Smart Entry: confirmation is mandatory and must be real.**
Every Smart Entry passes through a confirm step before logging. The confirm UI must make review genuine, not reflexive: stats shown large and legible, any single value editable in one tap, and Confirm a deliberate action rather than an auto-tappable default. For inventory-affecting trackers (Treatments, RX), a low-confidence match must present candidates rather than pre-selecting one.
*Why:* the human-in-the-loop confirmation is the architectural safeguard that keeps the feature on the estimation side of the line (see `STRAT-11`). If users can blow past it unread, the safeguard is theater and the AI is effectively entering data unreviewed.
*Status:* **Locked** · Aug 21, 2026

**PROD-12 — Smart Entry carries a marginal per-use cost — a first for the app.**
Every Smart Entry is an LLM API call (and, when voice ships, a speech-to-text call). Unlike the rest of HydroPro, which runs essentially free on Cloudflare, this cost scales with usage. Mitigations required from Phase 1: cache common interpretations and apply a sensible per-user daily cap. The per-call cost should factor into any clinic pricing conversation (handled outside engineering).
*Why:* recorded so the shift in unit economics is a conscious decision, not a surprise on the first API bill.
*Status:* **Locked** · Aug 21, 2026

**PROD-15 — Smart Entry Phase 1, worker side: model, daily cap, beverage-counting rule, and what
actually shipped this session.**
Session ran from `docs/CC-BRIEF-smart-entry-v3.40.0-v3.41.0.md`, explicitly scoped by Rob to
**worker-only** — `src/app.js`/`site/app/bundle.js` untouched, no app version bump. Decisions,
confirmed directly by Rob before any code was written:
1. **Model: `claude-haiku-4-5-20251001`** — the brief's own recommendation. A constrained
   text-to-numbers task; a frontier model buys nothing extra and costs several times more. Feeds
   `STRAT-OPEN-02` (pricing) directly.
2. **Daily cap: 25 calls/device/day**, enforced server-side in a new D1 table
   `smart_entry_usage` (`device_id`, `day`, `calls`, `cache_hits`) — the brief's proposed number.
   Cache hits never count against the cap. Keyed by `device_id`, not `user_id`, matching this
   app's device-local model (`ARCH-OPEN-04`) — Smart Entry must work for signed-out/local-only
   users, same as everything else. The cap is tracked against the **server's actual calendar day**,
   not the request's `date` field (which is which day an entry gets *logged* to, e.g. a backfill —
   a different concept from when the API call happened; using the logged-to date for the cap would
   let backfill-dated requests dodge the limit).
3. **Non-water beverages (coffee, soda, diet coke, tea, juice, etc.) DO count toward the water
   tracker.** Encoded explicitly in the system prompt (`buildInterpretSystemPrompt` in
   `worker/src/worker.js`), and the prompt requires the `source` phrase name the actual beverage
   (e.g. "diet coke") whenever it produces a water entry — the rule must be visible on the confirm
   card, never discovered after the fact, per the brief's `UX-18`-cited requirement (see numbering
   note below).

**What shipped this session:** `POST /api/interpret` in `worker/src/worker.js` — request validation,
SHA-256 KV cache (`interp:v1:<hash>`, key includes normalized text + the enabled-tracker set so the
same phrase can't leak an entry for a tracker that's off, 30-day TTL), the daily-cap check, the
system-prompt builder, the Anthropic call (with markdown-fence stripping as a defensive unwrap in
case the model doesn't follow the strict-JSON instruction), and server-side re-validation of the
model's output (`normalizeInterpretResult` drops any entry for a tracker that isn't actually
enabled, or that's missing a `source` — defense in depth, not just prompt compliance). Migration
`worker/migrations/schema-002-smart-entry.sql` proposed, **not run** — Rob runs D1 migrations
against production, per standing policy. `ANTHROPIC_API_KEY` was already set as a Worker secret
before this session (confirmed by Rob, not touched or echoed here).

**Deliberately not done this session** (explicitly out of scope per Rob's own scoping): the
front-end (`SmartEntrySheet`, `ConfirmCard`, header Sparkles wiring — brief sections A4/A6/A7), the
write-path provenance fields (`source`/`sourceText` on log entries — A5), and analytics (A8) — the
existing `user_activity` table is a bare `(user_id, activity_date)` retention ping with no room for
the per-event metrics A8 asks for (sessions started, entries proposed/confirmed/edited, cache hit
rate, cap hits); that needs its own small schema addition when analytics work actually starts,
not assumed into `user_activity`'s current shape.

**Numbering/doc-drift note, for whoever picks this up next:** the brief cites `UX-18` as governing
the "spoken summaries under ~2s" / "source visible" rules — this repo's actual `UX-18` is about
tracker-sheet category colors, unrelated. The brief also stated `CLAUDE.md`'s version was stale at
"3.33.0 → 3.39.0"; the actual deployed version is 3.61.0 (many intervening sessions), so that
version-line "fix" from the brief was *not* applied — `CLAUDE.md` already correctly reflects the
real current version and wasn't touched. `PROD-14` (Web Speech API decision, `PROD-14`) and
`UX-14a` (two entry points) are cited by the brief as already-decided but don't exist in this log
yet — both are Phase B (voice) concerns, not blocking for this worker-only Phase A session, but
whoever starts Phase B should confirm or create them rather than assume they're locked.
*Status:* **Locked** · Aug 27, 2026 — worker-side only; the front-end half of Phase A (confirm
card, sheet, header wiring, write-path provenance) and Phase B (voice) remain unbuilt and are
tracked as open work, not re-litigated by this entry.

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
*Status:* **Locked** · Aug 17, 2026 — *amended Aug 21, 2026: Log It! tile layout changed to horizontal (v3.35.0). Left column: category chip (36×36) + title, then Goal/To-go/Logged stats stacked. Right column: existing gem illustration + progress ring. 4px left accent border in category color. Single-column full-width stack replacing the prior vertical format. My Plan 2-column grid is unchanged. Explicit call by Rob.*

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
*Status:* **Locked** · Aug 17, 2026 — *amended Aug 20, 2026: Setup renamed to "My Plan" throughout (`UX-OPEN-01` Phase 1, v3.22.0). Nav order and the other two titles unchanged.* — *amended Aug 23, 2026 (v3.42.0, see `UX-21`): nav order briefly changed to Today · Log It! · Stats · My Plan · Settings, then reverted the same day (v3.42.1) back to the original Log It! · Today · Stats · My Plan · Settings order per Rob after real-device testing.* — *amended Aug 27, 2026 (v3.59.0): Rob explicitly re-requested the same swap v3.42.1 had reverted — nav order is now My Day (renamed from Today) · Log It! · RX · Stats · My Plan · Settings. This is a new, explicit decision superseding the earlier revert, not a regression of it; the app still boots on Log It! by default, which wasn't part of this request. "Today" renamed "My Day" throughout (nav tab, "My Day at a Glance," "My Day's log," header context label) in the same pass.*

**UX-07 — Tile order on Log It!**
Water, Protein, Calories, Sleep, Weight, Exercise, Treatments, RX & Supplements.
*Status:* **Locked** · Aug 17, 2026 — *amended Aug 21, 2026: "RX & Supplements" renamed to "RX & Vitamins" throughout (v3.27.0).* — *amended Aug 23, 2026: renamed back to "RX & Supplements" throughout, explicit call by Rob, v3.47.0.* — *amended Aug 27, 2026 (v3.59.0): this entry describes the underlying 8/9-tracker set, which is unchanged; what changed is where the 3 fast-entry tiles (Voice Tracker/Presets/Meal Entry, added to the same grid in v3.57.0) sit relative to it — moved from before this list to after it, per Rob's testing feedback that users prefer the core trackers up top. Full order is now Water/Protein/Calories/Sleep/Weight/Exercise/Treatments/Prescriptions/Supplements, then Voice Tracker/Presets/Meal Entry.* — *amended Aug 27, 2026 (v3.61.0, see `UX-40`): the 3 fast-entry tiles are now locked to the grid's last 3 cells via placeholder cells for any toggled-off tracker, rather than merely being last by array order (which previously let them shift position whenever a tracker was toggled off).*

**UX-08 — Health Summary and doctor share live at the bottom of Stats.**
Moved off Settings.
*Why:* sharing is top-of-mind while viewing stats, not while changing preferences.
*Status:* **Locked** · Aug 17, 2026

**UX-09 — Today page uses two independently scrollable regions.**
Today's Log guaranteed ≥50% of viewport; To Do Today scrolls internally when long.
*Why:* To Do Today must stay visible while scrolling the day's log.
*Status:* **Locked** · Aug 17, 2026

**UX-10 — Off-trackers stay permanently visible on My Plan.**
Toggling a tracker off affects the Log It! page only. The My Plan card stays in its fixed grid position, dimmed, toggle reading off. The "Show all trackers" affordance is removed rather than restored.
*Why:* the 2-column redesign (v3.22.0–3.26.0) dropped the reveal affordance while keeping the hiding, so an off tracker became permanently unreachable — no path existed to turn it back on. My Plan is the control surface; hiding the control that restores a tracker is a trap. Visibility there is load-bearing and must not be made conditional again. Supersedes the §8 question 2 resolution noted in UX-OPEN-01.
*Status:* **Locked** · Aug 21, 2026 · v3.32.0

**UX-11 — Sheets and modals render at app root via createPortal, never nested.**
Any sheet, modal, or popup renders via `createPortal` to `document.body` — never inside another sheet's DOM, regardless of where it's invoked from.
*Why:* nested rendering produced repeated positioning and visibility failures across three separate bugs (My Presets sheet, the black-background render issue, and the OO preset modal). Recording this as a standing pattern rather than a series of individual fixes is what stops the class from recurring. Established and applied in v3.33.0 for both the OO preset modal and the new backfill sheet.
*Status:* **Locked as a rule** · Aug 21, 2026

**UX-11a — Portaled components must locally redefine scoped CSS tokens.**
Any component portaled to `document.body` (per UX-11) renders outside `.wt-root`, where scoped CSS custom properties (`--deep`, `--line`, `--paper`, and similar) are defined. Such components must locally redefine these tokens on their root element, or buttons, inputs, and backgrounds fall back to transparent/unstyled.
*Why:* this was the root cause of the BackfillSheet and OO modal button-invisibility bugs (surfaced across v3.36.1/v3.36.2). It is a direct consequence of UX-11 and must be applied to every portaled component going forward.
*Status:* **Locked as a rule** · Aug 21, 2026 · v3.36.2

**UX-12 — Design token system is the single source of truth for color and spacing.**
A `:root` block defines all surface, text, category-color, spacing (8pt grid), z-index, and layout tokens. New colors and spacing values reference tokens rather than hard-coded hex/px.
*Why:* prior to this, colors drifted per-component and per-screen. Centralizing them retires color drift as a bug class and makes theme-wide changes (e.g. the warm-tan text and dark-tile passes) single-point edits.
*Status:* **Locked** · Aug 21, 2026 · v3.34.0

**UX-13 — `--treatment` token added.**
Treatments gets its own semantic token (`--treatment` / `--treatment-chip`), teal (#16A394), sharing the hue with `--weight` by design but separated in code for future differentiation. Applied to the Treatments tile border, chip, and ring.
*Why:* the designer's category spec covered 7 categories for 8 tiles; Treatments had no token. A dedicated token avoids a hard-coded color and allows the two teal tiles to diverge later without a hunt.
*Status:* **Locked** · Aug 21, 2026 · v3.35.0

**UX-14 — Smart Entry lives as a global header assistant, not a per-page feature.**
The Smart Entry trigger is an assistant icon in the app header, to the right of the brand name (with a user-profile icon planned for the left). It opens Smart Entry as a modal from any page. Constraint for Phase 1: although summonable from anywhere, its capability is scoped strictly to entry-and-confirm — it captures a consumption/activity entry and routes it through the confirm card, and declines other requests.
*Why:* positioning it app-level rather than on a single page establishes it as a general assistant whose scope can widen over time (more pages, more capabilities) without re-homing the entry point. The global placement is the platform decision; the narrow Phase 1 scope is what keeps it on the estimation side of the line (see `STRAT-11`, `PROD-11`) until scope is deliberately widened.
*Status:* **Locked** · Aug 21, 2026 · target v3.40.0

**UX-15 — Log It!/My Plan tiles and all sheets/pages switched to dark.**
Tiles: background `var(--bg)`, full 2px category-color border (amends UX-02's earlier 4px left-only accent). Sheets/modals/pages: dark surfaces (`--surface-dark`), tan text (`--ink-inverse`), hairline borders on all edges, inputs/buttons re-themed. Completed app-wide across v3.37.0–3.38.2. The base `.wt-root` text color flipped to `--ink-inverse` since the whole app is now dark; the doctor-share / health-summary overlay is explicitly exempt and must stay light (both embedded and as its own `?share=` standalone page).
*Why:* the white-on-black mismatch left large parts of the app illegible (the Past Days popup was fully invisible). Converting to a single dark system with consistent borders and tan text makes the app coherent and readable. Amends UX-02.
*Status:* **Locked** · Aug 21, 2026 · v3.37.0–3.38.2 — amends UX-02

**UX-16 — Dark-theme support tokens and header placeholders.**
Three supporting decisions from the dark-theme completion passes:
- `--muted-dark` (#9FB0C4) replaces the old muted helper-text color on dark surfaces, which failed AA contrast (~3.5:1). Exempt: the doctor-share overlay's on-screen text (light context).
- `--hairline-bright` (#5A7390, muted slate-blue) is the standard visible border on cards/rows/inputs/buttons/sheets — dimmer than the tan text but clearly visible on dark backgrounds.
- App header carries two unwired placeholder icons: a circular profile placeholder to the LEFT of the logo, and a Sparkles AI-assistant icon to the RIGHT of the title (the future Smart Entry entry point per UX-14). Both are 40px, visually chipped, not connected to anything yet. Logo and title reduced ~15% to make room.
*Why:* recorded so the placeholder icons aren't mistaken for live features, and so the two new tokens are the known standard rather than being re-invented per component.
*Status:* **Locked** · Aug 21, 2026 · v3.38.0–3.38.1

**UX-17 — Global form-control inheritance reset.**
`:where(button, input, select, textarea) { color: inherit; font: inherit; }` added globally. These elements don't reliably inherit `color`/`font` from ancestors the way `div`/`span` do, which is why the Past Days date-list buttons rendered black-on-dark (invisible) while every other button had an explicit color. The reset catches this bug class generally rather than patching each instance.
*Why:* it turns a recurring per-element bug (dark text on dark background from un-inherited color) into a single structural fix. Applied v3.38.2.
*Status:* **Locked as a rule** · Aug 21, 2026 · v3.38.2

**UX-18 — Tracker sheets borrow their tile's category color; Log It! tile middle stat becomes a hero number.**
Two related v3.39.0 changes, both explicit calls by Rob:
1. Each of the 8 tracker entry sheets (Water, Protein, Calories, Sleep, Weight, Exercise, Treatments,
   RX & Vitamins) now renders with its border in that tracker's category color (the same token as the
   tile border on Log It!), replacing the generic `--hairline-bright` border.
2. On Log It!, the middle stat line moves out of the left text stack into a new large-bold "hero"
   position between the text stack and the icon/ring, vertically centered next to the icon bubble.
   Scope, clarified with Rob before implementation: Water/Protein/Calories/Sleep/Exercise promote their
   existing "to go"/"left"/"over" text as-is (Goal/Logged stay in the left stack, unchanged size).
   Weight, Treatments, and RX & Vitamins keep all three existing left-stack stats untouched and *add* a
   new hero number: Weight shows the amount left to reach goal ("to go"); Treatments shows the count
   planned today ("to do"); RX & Vitamins shows the count due today ("to take").
*Why:* the color-match makes the sheet read as a continuation of the tile the user tapped rather than a
generic popup. The tile restructure was requested by Rob specifically using the Water tile ("120oz"
large / "to go" small) as the reference; the per-tracker split (promote vs. add-new) was resolved by
asking Rob directly rather than assuming, since Weight/Treatments/RX don't have a plain numeric
"amount to go" the way the other five do.
*Status:* **Locked** · Aug 22, 2026 · v3.39.0 — *amended Aug 22, 2026, v3.39.1: the color-match was
initially wired into Log It!'s sheets only; My Plan's "What I'm Tracking" tile popups (`TrackerSheet`)
now carry the same per-tracker `borderColor`. Also: the Log It! hero number is now horizontally
centered in the tile (`flex:1 1 0`, was hugging the icon ring) and its caption font increased
11px → 13px, both per Rob's real-review feedback.*

**UX-19 — Log It! entry-flow split; Voice Tracker tile supersedes the header AI icon as the Smart
Entry placeholder entry point.**
Two related v3.40.0 changes, both explicit calls by Rob:
1. The combined "Use Your Presets or Log a Meal" button/sheet (presets + manual Water/Protein/
   Calories/Description/Time fields, all in one place) splits into two independent flows: "Use
   Your Presets" (presets grid + Edit Presets only) and a new "Manually Log a Meal" button
   (green/`var(--protein)`) opening a new `ManualMealSheet` with the manual fields. Editing an
   existing log entry routes to `ManualMealSheet`, not the presets sheet.
2. A new, non-functional "Voice Tracker" tile is added to Log It! above Water — a design preview
   for a future voice-driven Smart Entry path. Because it exists, the header AI (Sparkles) icon
   that `UX-14`/`UX-16` placed as the future Smart Entry entry point is removed as redundant.
*Why:* splitting presets from manual entry was requested directly — two distinct user intents
(instant preset tap vs. deliberate manual entry) sharing one sheet added friction to both. The
header-icon removal is not a reversal of `UX-14`'s "global assistant" positioning decision, only a
change in *which placeholder* signals it: the Voice Tracker tile now carries that role instead of
the header icon. `UX-14`'s core claim (Smart Entry is app-level, not per-page) is untouched — actual
Smart Entry Phase 1 (text-based, per `PROD-10`/`PROD-11`) still targets its own build slot; the
Voice Tracker tile is visual-only today, not the real feature.
*Status:* **Locked** · Aug 22, 2026 · v3.40.0 — amends `UX-14`/`UX-16`'s header-icon placement

**UX-20 — Profile page: header-icon-only entry point, local-only storage.**
A new Profile page (Full Name, Email, Phone, photo upload) is reached only via the header's
profile icon — not added to the bottom nav, no other entry point. Data is stored entirely in
`settings.profile` (localStorage, versioned schema per `ARCH-OPEN-05`), including the photo as a
base64 data URI — it does not reach the Worker/D1 backend, does not affect the account's real
sign-in email (`settings.account.email`, used for magic-link auth) or push/SMS notification
contact info.
*Why:* explicit call by Rob on both points. Keeping this local-only avoids new backend engineering
(upload endpoint, schema change, auth-linkage risk) for what's currently pure personalization —
matches the pattern most existing settings already use. The header-icon-only entry point keeps the
nav bar's 5 tabs unchanged and treats Profile as a personal-settings destination rather than a
core navigation destination.
*Status:* **Locked** · Aug 23, 2026 · v3.41.0

**UX-21 — Today becomes the app's landing/initial-engagement page; nav order swapped.**
Today is promoted from a secondary daily-review tab to the app's primary landing page. Three
changes, all explicit calls by Rob: (1) the Voice Tracker tile (from Log It!, `UX-19`) is copied
onto Today as the first thing under the page title; (2) a new "Tracked So Far" section — one card,
one detailed row per currently-enabled tracker (goal/consumed/remaining, category-color-coded) —
is inserted between the Voice Tracker tile and the existing "To Do Today" section, which in turn
still sits above "Today's Log"; (3) the bottom nav order swaps Today and Log It!, so Today is now
the leftmost (and by convention, default-most-prominent) tab. Amends `UX-06`'s nav order.
*Why:* recorded so the reasoning survives past this session — Today consolidating a day's full
picture (voice-entry preview, detailed per-tracker progress, what's still due, and the raw log) in
one place is what makes it a genuine landing page rather than just a log viewer; swapping its nav
position reinforces that it's the primary destination now, not a secondary one.
*Status:* **Locked** · Aug 23, 2026 · v3.42.0 — amends `UX-06` — *amended Aug 23, 2026, v3.42.1:
the nav-order swap (point 3) was reverted per Rob after real-device testing — nav order is back to
Log It! · Today · Stats · My Plan · Settings. Points 1 and 2 (Voice Tracker tile on Today, "Tracked
So Far" section) remain in place; Today's content is still the landing-page-style expanded content
from this decision, only its nav position reverted.* — *amended Aug 23, 2026, v3.43.0: the "Tracked
So Far" section (point 2) is replaced by a compact "Today at a Glance" needs-attention summary —
Rob's call, after noting the original one-row-per-tracker version duplicated Log It!'s tiles and
took up too much of the page. Shows at most 4 callouts (due/overdue meds & treatments, plus the
single most-behind consumable tracker if room remains) or "Great work, you're all caught up for
now! 🎉" when nothing qualifies. See `UX-22`.*

**UX-22 — "Tracked So Far" replaced with "Today at a Glance," a needs-attention summary.**
Rob flagged that the v3.42.0 "Tracked So Far" section (one detailed row per enabled tracker) was
too much info, took up too much screen, and duplicated what Log It!'s tiles already show. Agreed
direction: turn it into an executive-summary-style section that calls out only what the user needs
to know for the day, sitting above To Do Today and Today's Log as a genuine summary rather than a
second detail view.
Resolved shape, both explicit calls by Rob:
1. Callout triggers: due/overdue RX & Vitamins or Treatments (shown as a due-count, e.g. "2 due
   today"), and — if room remains — the single most-behind consumable/time tracker (water,
   protein, calories, sleep, exercise), chosen by largest fraction of goal still remaining. Weight
   is excluded from "most behind" since it's an off-target amount, not a consumption goal.
   Goals-already-met and an active sleep session were considered as triggers and explicitly left
   out — this section is for what still needs doing, not a status board.
2. Capped at 4 rows.
3. Empty state: when nothing qualifies, show "Great work, you're all caught up for now! 🎉" rather
   than an empty or "nothing to see" card. Rob's reasoning: a user who's done most of their
   tracking should see that reflected positively, not have the section just go blank or read like
   something's missing.
*Why:* keeps the section genuinely skimmable and distinct from Log It!'s per-tracker detail, and
turns "nothing left to flag" into positive reinforcement instead of a dead-looking section —
consistent with the app's existing "state facts, don't manufacture celebration" tone (see `UX-04`)
while still making an honest "you're caught up" status feel rewarding rather than empty.
*Status:* **Locked** · Aug 23, 2026 · v3.43.0 — amends `UX-21` point 2

**UX-23 — "To Do Today" removed; Today becomes exec-summary-at-top, full-log-below.**
With "Today at a Glance" (`UX-22`) covering due/overdue callouts, Rob judged the older "To Do
Today" section (a full list of due items, with an inline next-due-date input) pure duplication —
its only function beyond duplication was that date-editing control, which wasn't considered
essential to keep as-is. Removed entirely; Today's layout is now Voice Assistant tile → Today at a
Glance → Today's Log.
*Why:* two sections both surfacing "what's due" on the same page was redundant once the summary
existed; collapsing to one makes Today read cleanly as summary-then-detail.
*Status:* **Locked** · Aug 23, 2026 · v3.44.0 — the next-due-date-editing capability this removed is
resolved narrower and better-organized in `UX-24`.

**UX-24 — Self-Managed RX: supplements split into Vitamins & Supplements / RX on My Plan only.**
Removing "To Do Today" (`UX-23`) also removed the app's only next-due-date-editing UI, surfaced as
a standing-risk flag before building anything further. Resolved shape, explicit calls by Rob:
1. My Plan's combined "Self-Managed" tile (supplements + treatments in one sheet) splits into a new
   "Self-Managed RX" section — two tiles, "Vitamins & Supplements" and "RX" — inserted between "My
   Treatments" and where the old "Self-Managed" tile sat. Existing supplements with no category tag
   default to "Vitamins & Supplements."
2. Vitamins & Supplements: daily items, no scheduling question in the add form (`intervalDays`
   implicitly 1, never asked).
3. RX: keeps the schedule field, and gains an editable next-due-date input per row — this is where
   the capability gap from `UX-23` is restored, scoped to RX items specifically (not Treatments).
4. Log It! and Today are explicitly untouched — both still treat all supplements as one combined
   list for daily logging and due-counting (one "RX & Vitamins" tile, one due-count callout). Rob's
   reasoning: vitamins, supplements, and prescriptions are taken the same way day-to-day, so
   splitting the *logging* step would add daily friction for very similar items even though they
   need different setup-time detail (scheduling variables differ, which is why the split matters on
   My Plan specifically).
5. A "Self-Managed Treatments" tile was added alongside the two new ones, preserving the old
   "Self-Managed" sheet's treatment add/edit/delete unchanged — not explicitly requested, but flagged
   and kept since the old sheet was the *only* place treatments could be managed at all, and folding
   it away silently would have been the same class of quiet capability loss as the next-due-date gap.
*Why:* keeps day-to-day logging at one step (the thing that matters most for adherence, `STRAT-02`)
while giving setup-time management the category-specific detail each type actually needs.
*Status:* **Locked** · Aug 23, 2026 · v3.45.0 — *amended Aug 27, 2026 (v3.58.0): the "RX" label this
entry established on My Plan's "Self-Managed RX" section was renamed "Self-Managed Prescriptions &
Supplements" as part of an app-wide "RX"→"Prescriptions" label rename — see `TRACK-01`'s v3.58.0
amendment. This entry's core decision (splitting supplements-vs-prescriptions setup detail while
keeping combined daily logging) is otherwise unchanged; the combined-logging half was itself later
superseded by `TRACK-01`.*
*Known gap:* Treatments still have no next-due-date-editing UI anywhere in the app (out of scope for
this change — "My Treatments" isn't fully built out yet per Rob). Flagged in
`docs/CURRENT-STATE.md`'s Known outstanding.

**UX-25 — Log It! tile trim: every tile down to 2 left-side data points, tighter height, bigger gap.**
Weight, Treatments, and RX & Vitamins each carried a middle sub-text line duplicating what the hero
number (`UX-18`) already shows on the same tile — Weight's goal-difference, Treatments' "All caught
up"/due-count, RX & Vitamins' "X of Y taken". All three removed, bringing every one of the 8 tiles
to the same 2-data-point shape (Goal + Logged) that Water/Protein/Calories/Sleep/Exercise already
had. The low-supply/near-expiry alert (`QS()`) that shared that line on Treatments/RX & Vitamins is
kept, rendered alone and only when an item actually has one — dropping it outright would have
quietly violated `PROD-04` (locked: alerts must show on tiles), so it was preserved even though the
request didn't call it out by name.
With the extra line gone, tile vertical padding was trimmed (icon/gem bubble on the right explicitly
untouched) and the inter-tile gap increased to match the gap that already existed between the Voice
Assistant tile and Water, applied uniformly across all 8 tiles.
*Why:* two data points per tile everywhere is a simpler, more scannable Log It!, and the freed
vertical space funds a bigger, more legible gap between tiles instead of sitting unused as padding.
*Status:* **Locked** · Aug 23, 2026 · v3.46.0 — amends `UX-02`/`UX-18` — *amended Aug 23, 2026,
v3.47.0: the bigger inter-tile gap was applied to the CSS rule governing gaps within each of Log
It!'s two tile-grid containers, but the seam between the two containers themselves (Sleep→Weight)
kept relying on their separate margin values, landing at 14px instead of 24px — missed in the first
pass, fixed with a `.wt-trackers-grid + .wt-trackers-grid` override. The same fix pattern was
applied to the RX & Supplements→"Use Your Presets" seam, which had the same gap shortfall.*

**UX-26 — Today's Log row restack: stats under description, actions grouped and pinned right.**
Long descriptions were being truncated because per-entry stats sat inline to their right, squeezed
against the edit/delete buttons sharing the row's uniform gap. Reworked the row so stats now render
on their own line directly under the description (full row width for the description line), and
edit/delete buttons are grouped into one tightly-spaced cluster pinned to the row's right edge.
*Why:* recovers the horizontal space descriptions need without enlarging the row/tile itself.
*Status:* **Locked** · Aug 23, 2026 · v3.46.0 — *amended Aug 23, 2026, v3.47.0: the restack left
noticeable extra vertical space under the stacked amounts — row padding, row-to-row gap, and the
description/stats stack's own internal gap all tightened per Rob's follow-up review.*

**PROD-13 — My Plan is the system of record; Today shows status; Log It! is the action that updates
it. Stats' Subscriptions panel retired in favor of a Today section fed by richer source data.**
Rob's stated model for the full data flow: items are entered on My Plan (the point where you start
taking something) — that's where source/provider, quantity, and expiry/renewal data should live.
Today shows the current-day status of that data. Log It! is where consumption is actually logged,
which updates what Today shows. Resolved on this basis:
1. Treatments gain an optional "Ordered from / provider" field; RX items (not Vitamins &
   Supplements — daily items have no fill/refill concept) gain optional "Pharmacy / where filled"
   and "Refills remaining" fields. All entered on My Plan's existing add/edit forms.
2. New Today section, "Remaining RX/Treatments", sits between "Today at a Glance" and "Today's
   Log": one card per inventory-tracked Treatment/RX item showing quantity remaining, expiry/
   renewal date, provider/pharmacy when set, and the low-supply/near-expiry alert when present.
3. Stats' "Subs" chart-picker option and the Subscriptions panel it opened (aggregate view of the
   same underlying data) are removed entirely, not relocated — its function is fully superseded by
   point 2, and it was Stats' only entry point (confirmed with Rob before deleting, since `PROD-04`
   names the Subscriptions view as one of three required alert-visibility surfaces; the other two,
   Setup/My Plan and tiles, still carry it).
*Why:* keeps each page's role distinct and avoids two views doing the same job with different
levels of detail — a design smell now resolved by making My Plan authoritative and Today the single
place to check status.
*Status:* **Locked** · Aug 23, 2026 · v3.46.0 — *amended Aug 23, 2026, v3.47.0: "Remaining
RX/Treatments" gained its own section-wide card border (matching "Today at a Glance"'s `wt-card`
treatment) per Rob's follow-up review — the section label now sits inside the bubble at the top,
with each item's own smaller card nested inside it, rather than floating without a border of its
own.* — *amended Aug 27, 2026, v3.58.0: `TRACK-01`'s split of the RX/Supplements data model
(v3.52.0) had left Today's full-detail tile still summing both trackers into one displayed number,
consistent with "Today shows status" but not fully reflecting the underlying independent trackers.
v3.58.0 resolved this — Today now shows two independent Prescriptions/Supplements tiles, matching
what My Plan (the system of record) and Log It! already tracked separately. See `TRACK-01`'s
v3.58.0 amendment for detail.*

**UX-27 — Voice Assistant tile removed from Today; Log It!'s 8 tracker tiles duplicated onto Today;
"Prior Days" relocated to Stats and renamed "Edit Prior Days Logs."**
Three explicit calls by Rob:
1. The Voice Assistant tile (non-functional preview, `UX-19`) is removed from Today — it stays on
   Log It! only. This amends `UX-21` point 1, which had copied it onto Today.
2. Log It!'s full 8-tile tracker grid (`MO`) is duplicated onto Today, between "Remaining
   RX/Treatments" and "Today's log," reusing the exact same component, tap handlers, and entry
   sheets — so behavior is identical between the two pages, including per-tracker visibility
   respecting My Plan's `settings.show*` toggles. The grid's own "Use Your Presets"/"Manually Log a
   Meal" action buttons are deliberately not duplicated — Rob's request was for the 8 tiles only.
3. The "Prior Days" past-days/backfill entry point (small label + calendar-icon button) moves off
   Today entirely, onto Stats — positioned between "Sleep Over Time" and "Health Summary" — and is
   renamed "Edit Prior Days Logs." It becomes a single large tappable card (bigger label text and
   calendar icon) rather than a small icon button; tapping anywhere on the card opens the same
   past-days list/backfill flow as before.
*Why:* Today was carrying a second copy of Log It!'s summary content (Voice tile) that added no
information, while the day's actual tracked-metric tiles — arguably the most useful content — only
lived on Log It!. Surfacing the same tile grid on Today makes it a genuine one-stop daily view.
Moving Prior Days to Stats groups it with the app's other historical/reporting views (trend charts,
Health Summary) rather than sitting awkwardly next to the live "Today's log" list it doesn't
describe.
*Status:* **Locked** · Aug 24, 2026 · v3.48.0 — amends `UX-19`/`UX-21` (Voice Assistant on Today)

**UX-28 — New "RX" page: consolidated Treatments/Prescriptions/Vitamins & Supplements view,
titled "SCRIPTS FOR:"; partner-branded cards; "Remaining RX/Treatments" retired from Today.**
A 6th bottom-nav tab, "RX" (icon `Pill`, positioned Log It! → Today → **RX** → Stats → My Plan →
Settings), becomes the single place to see everything a user is subscribed to or prescribed by a
wellness center (e.g. DripBar), doctor's office, pharmacy, or insurer. Explicit calls by Rob:
1. Page title reads "SCRIPTS FOR: {today's date}", following the same title-plus-date pattern
   every other tab already uses.
2. Three full sections — **Treatments**, **Prescriptions**, **Vitamins & Supplements** — reusing
   the `category` field split from `UX-24`. Unlike the retired Today section, each lists **every**
   item of that type, not only inventory-tracked ones; inventory detail (qty remaining, expiry,
   refills, the `QS()` low-supply/near-expiry alert) still shows inline only when
   `trackInventory` is on. This is a real scope increase over a straight relocation.
3. **Partner branding, confirmed as real cards, not just surfacing existing text fields:** two new
   optional fields, `partnerLogoDataUri` and `partnerLink`, added to both Treatments (paired with
   the existing `provider` field) and RX-category supplements (paired with `pharmacy`) — not
   offered on Vitamins & Supplements, which have no organizational "filled by" field to attach a
   partner to. When both a provider/pharmacy name and a logo are set, the item renders as a
   partner card (reusing the `.wt-regimen-card` styling already used for the Austin Drip Lounge
   demo on My Plan) with the logo and an outbound link; otherwise it falls back to the existing
   plain "From {provider}" / "Filled at {pharmacy}" text. Logo upload reuses the Profile-photo
   pattern exactly (canvas-downscaled to 240px longest side, JPEG 85%, base64 data URI, 8 MB cap
   before downscale).
4. The "Remaining RX/Treatments" section (`PROD-13`, v3.46.0/v3.47.0) is removed from Today
   entirely — its content moves to and expands into this page. Today's order is now "Today at a
   Glance" → the duplicated 8-tile grid (`UX-27`) → "Today's log".
*Bug found and fixed as part of this work:* the settings normalizer that runs on every app boot and
backup restore (`US()` for supplements, `normalizeTreatments()` for treatments, both invoked from
`migrate()`) rebuilt each item from a field whitelist that excluded `category`, `pharmacy`,
`refillsRemaining` (supplements) and `provider` (treatments) — confirmed present in the deployed
bundle too. Every reload or backup restore was silently reverting these fields to blank/default.
Fixed by adding the missing fields to both normalizers; the new `partnerLogoDataUri`/`partnerLink`
fields were added to the same whitelists from the start so they don't repeat the bug. See the
`ARCH-OPEN-05` addendum below for the full record — this is the same bug class that decision
already exists to prevent.
*Why:* keeps day-to-day logging (Log It!, Today) unchanged while giving RX its own dedicated
"everything I'm on" view — the natural place to also make partner organizations visible, which
supports the clinic-distribution direction (`STRAT-10`) by giving a partner like DripBar a
branded presence inside the app.
*Status:* **Locked** · Aug 25, 2026 · v3.49.0 — amends `UX-06` (nav order), `PROD-13` (Today's
status-view role), `UX-27` point 2 (tile-grid position, now directly after "Today at a Glance"
instead of after "Remaining RX/Treatments") — *amended Aug 27, 2026, v3.58.0: the bottom-nav tab's
visible label changed from "RX" to "Prescriptions" as part of an app-wide rename (see `TRACK-01`'s
v3.58.0 amendment); this page's own title ("SCRIPTS FOR:") and its three section headers
("Treatments"/"Prescriptions"/"Vitamins & Supplements") were already correct from this entry and
were not touched.* — *amended Aug 27, 2026, v3.59.0: the nav tab's label reverted to "RX" (see
`TRACK-01`'s v3.59.0 amendment — "RX" is the umbrella term for the three sections this page shows).
This page's third section also renamed "Vitamins & Supplements" → "Supplements," for consistency
with the label used everywhere else in the app; "Treatments" and "Prescriptions" section headers
unchanged.* — *amended Aug 27, 2026, v3.60.0: the `partnerLogoDataUri`/`partnerLink` fields this
entry introduced are superseded by `TRACK-02`'s `settings.partners` data model — see that entry.
This page's partner-branded card rendering now resolves through a linked partner record instead of
reading those fields directly off the item, with the original fields kept as a fallback for
anything that somehow isn't migrated.*

**UX-29 — Log It! becomes pure fast-entry: compact 3x3 tile grid, "Meals" tile, "Use Presets" tile.**
Now that Today (`UX-27`) and the RX page (`UX-28`) both show full tracked-metric detail, Rob judged
Log It!'s tiles duplicating that same detail (goal/logged text, hero numbers, low-supply/near-expiry
alerts) as redundant. Resolved shape, all explicit calls by Rob:
1. Each of the 8 tracker tiles on Log It! compacts to icon + progress ring + tracker name only —
   no goal/logged text, no hero number (`UX-18`), no `QS()` alert row. Arranged 3x3 in existing
   `UX-07` order (Water/Protein/Calories, Sleep/Weight/Exercise, Treatments/RX & Supplements), with
   a 9th slot for the new Meals tile.
2. **Today's duplicated tile grid (`UX-27`) is explicitly untouched** — it keeps showing full
   detail. Both pages render through the same shared component (`MO`), which gained a `compact`
   prop; Today's call site never sets it. This was a deliberate choice, confirmed with Rob before
   building, specifically so `PROD-04`'s requirement that low-supply/near-expiry alerts stay
   visible "on tiles" continues to hold — via Today's tiles (plus My Plan and the RX page), rather
   than Log It!'s.
3. "Manually Log a Meal" (previously a button below the tile grid) becomes the 9th grid tile,
   "Meals" — tapping it opens the same `ManualMealSheet`, unchanged. Its ring has no real
   percentage to show yet ("isn't connected for now," Rob's words) and no illustrated asset exists
   for it, so it's a hand-built placeholder: a static circle with a `Utensils` icon in Protein
   green (`var(--protein)`, reused rather than adding a new color token, per Rob's choice). Flagged
   to Rob as a placeholder pending a real illustration, the same path the Voice tile itself
   followed (CSS-gradient placeholder in v3.40.0, replaced by a supplied image in v3.40.1).
4. "Use Your Presets" (previously the other button below the grid) becomes its own full-width tile,
   renamed "Use Presets," moved below the 3x3 grid, and restyled to match the top "Voice Entry"
   tile's *layout* (icon chip, title, subtitle, circular badge) — per Rob's choice, keeping its own
   blue/water-colored treatment rather than Voice Entry's gold gradient. The shared layout was
   generalized into one `FeatureTile` component (gold variant for Voice Entry, blue for Use
   Presets) rather than duplicating the markup.
5. The top tile is renamed "Voice Assistant" → "Voice Entry" (Rob's call; display text and
   `aria-label` only, still the same non-functional design preview from `UX-19`).
*Why:* with Today and the RX page now owning the "what's my status" and "what am I on" views
respectively, Log It!'s only remaining job is fast data entry — full-detail tiles there were pure
duplication. Keeping Today's tiles untouched preserves both the day-summary experience `UX-27`
built and `PROD-04`'s alert-visibility guarantee without extra work.
*Status:* **Locked** · Aug 25, 2026 · v3.50.0 — amends `UX-02`/`UX-18`/`UX-25` (Log It! tile
format, now compact) and notes `PROD-04`'s tile-surface requirement is satisfied via Today/My
Plan/RX page rather than Log It!'s tiles
*Known gap:* the Meals tile has no illustrated icon asset — see `docs/CURRENT-STATE.md` Known
outstanding.

**UX-30 — Log It! date pill: prior-day logging gets its own control, separate from Stats' picker.**
A new interactive date pill (`‹ Wed, Aug 26 [TODAY] ›`) replaces the static "Tracking for: <date>"
text on Log It! only — every other tab's header date text is untouched. Left/right chevrons step
one day; the right chevron is disabled at today and a future date is never reachable. New app-shell
state (`logDate`, resets to today on cold start, no persistence) tracks which day Log It! is
viewing; a second new state (`entryTargetDate`) carries that day into every entry sheet's actual
write path, since Log It! and Today share the same underlying submit handlers (previously all
hardcoded to `HS(new Date)`) — sheets opened from Today continue to target today regardless of
Log It!'s selected day. Off-today, the pill turns amber, a subtitle reads "Everything you log goes
to this day," every entry sheet shows an amber `Saving to <date>` bar, and confirmation toasts
append `· <date>`.
*Why:* explicit request from Rob's detailed brief — prior-day correction previously required going
through Stats → Edit Prior Days Logs → Enter Missed Items, a heavier flow than Log It!'s fast-entry
purpose calls for. This is deliberately a *second, independent* path — Stats' existing prior-day
picker and backfill flow (`PROD-06`) are untouched, not replaced, since they serve a different
purpose (browsing/correcting arbitrary past days generally, vs. quickly logging to "yesterday" or
a nearby day from the fast-entry screen).
*Status:* **Locked** · Aug 26, 2026 · v3.51.0

**UX-31 — Log It! top row: bare-artwork Voice Tracker/Presets/Meal Entry replace the FeatureTile
banners.**
The gold "Voice Entry" and blue "Use Presets" `FeatureTile` banners are removed from Log It! (Today
is unaffected — it never rendered "Use Presets" and its own Voice Entry tile was already removed in
`UX-27`). Replaced with a 3-item row of bare artwork (icon + label only, no card/border at rest,
subtle press state): **Voice Tracker** (art supplied by Rob, opens a new lightweight non-functional
preview sheet — see below), **Presets** (opens the existing presets sheet, same as the old "Use
Presets" tile), **Meal Entry** (opens the existing `ManualMealSheet`, taking over the role the
"Meals" grid tile held in `UX-29`, which is removed — see `UX-32`).
The Voice Tracker preview sheet adds a text field next to a decorative mic icon to the same
non-functional preview concept established in `UX-19`/`UX-29` — **UI shell only, no parser wired
up, nothing is ever auto-logged.** This is explicitly not Smart Entry Phase 1 (`PROD-10`/`PROD-11`),
which remains its own unstarted, separately-scoped build.
*Why:* per Rob's brief — Log It!'s fast paths (voice, presets, manual meal) read better as
equal-weight bare icons than as two different banner styles plus a grid tile, and the icons Rob
supplied are the real assets these tiles were always meant to use eventually (the Voice tile
followed the same pattern in `UX-19`/v3.40.0 — CSS placeholder first, then a supplied image).
*Status:* **Locked** · Aug 26, 2026 · v3.51.0 — amends `UX-19`/`UX-29` (Voice tile), supersedes the
"Use Presets"/"Meals" tile placements from `UX-29`

**UX-32 — Log It! grid goes borderless; progress ring gets a real track, a goal-met state, and a
ring-less mode for readings.**
Two related changes, both Log It!-only (Today's full-detail tile/ring rendering is verified
byte-for-byte unchanged via a `compact` flag defaulting off on the shared ring component):
1. The 3×3 grid's tile borders and background fills are removed — transparent at rest, a subtle
   surface wash on press. The grid drops to 2 columns when 4 or fewer trackers are enabled, so
   tiles grow rather than leaving a sparse 3-wide row. The Meals tile is removed from the grid
   (moved to the top row, `UX-31`), bringing the grid back to one tile per tracker.
2. The ring itself: a real neutral track ring (`#2a303a`) now sits under the accent fill — before,
   the "track" was just a dimmed copy of the tile's own accent color, which is why 0% and "no ring"
   read as nearly the same thing. Goal-met state (100%+) clamps the arc rather than wrapping a
   second lap, squares off the stroke cap, adds a glow, and swaps the end-cap dot for a small check
   badge. Weight — a reading, not something that accumulates toward a goal — drops the ring
   entirely on Log It!, showing artwork and label only with the same check badge when a reading
   exists for the day being viewed; the brief flags Resting HR and the bed-time trackers for the
   same treatment when the partner tracker set lands.
*Why:* per Rob's brief — a ring that can't visually distinguish 0% from "not tracked" is decoration,
not information; the fix is a real two-layer ring (track + fill) rather than one ring doing both
jobs. Weight showing a ring at all was always slightly misleading (`UX-04` already established "no
celebration either direction" for Weight) — dropping the ring entirely for readings is a more
honest fit than fabricating a percentage. Scoping every visual change to Log It! only, leaving
Today's tile/ring rendering untouched, was Rob's explicit scope boundary for this session.
*Status:* **Locked** · Aug 26, 2026 · v3.51.0 — amends `UX-25`/`UX-29` (tile borders), `UX-03`
(all-8-tiles-get-rings, now qualified: true on Today/My Plan/RX page, not on Log It! for
goal-less trackers)
*Amendment (v3.59.0, Aug 27, 2026):* point 2's "drops the ring entirely" for Weight is superseded —
Rob asked for a completion indicator back, having found the bare checkmark badge insufficient
alongside the ringed trackers around it. Weight's compact tile now gets a rounded-square border+
glow (`.wt-gauge-imageonly-lit`, CSS only — not `lO`'s SVG ring, which is circular by construction
and doesn't fit a square icon) that lights up when a reading exists today, matching Supplements'
glow-on-completion look, with the existing checkmark badge kept alongside it per Rob's explicit
call. This is a deliberate reversal of this entry's original reasoning ("dropping the ring entirely
for readings is a more honest fit than fabricating a percentage"), not an oversight — the new ring
is a binary completion signal, not a fabricated percentage, so it doesn't reintroduce the original
problem this entry was solving.
*Amendment (v3.61.0, Aug 27, 2026, see `UX-40`):* the ring's image was rendering at 94% of its box,
leaving a visible gap between the image and the border — Rob asked for the ring to hug the image
edge-to-edge; bumped to 100%.

**UX-33 — Quick-add chips and "Add to <tracker>" button relabel across Log It!'s entry sheets.**
Every accumulating-tracker entry sheet gains 4 quick-add chips above its manual field: Water
(+8/12/16/24oz), Protein (+15/25/30/40g), Calories (+150/300/500/650), Sleep (+6/7/7.5/8hrs — sets
"Woke Up" to Lights-Out-plus-N-hours, since Sleep is tracked as a start/end session rather than a
raw duration), Exercise (+15/20/30/45min). Treatments and RX & Supplements already had a
tap-to-select-item chip pattern per item, which already serves the same "two taps, no keyboard"
goal — kept as-is rather than adding a redundant second chip row. Primary buttons across all
sheets relabel from tracker-specific text (e.g. "Log 32oz") to "Add to <tracker>" (Weight: "Save
weight"; the manual meal sheet: "Log meal").
*Why:* per Rob's brief — the common case (adding a typical amount) should be two taps, not a drag
plus a keyboard entry. The button relabel makes every sheet's primary action read consistently
regardless of tracker.
*Status:* **Locked** · Aug 26, 2026 · v3.51.0

**TRACK-01 — RX and Supplements split into two independent trackers; migration design and
reversibility.**
Track 2 of Rob's Log It! redesign brief (`UX-30`–`UX-33` were Track 1). The combined "RX &
Supplements" tracker (`settings.supplements`, items tagged `category: 'vitamin' | 'rx'`) becomes two
fully independent trackers, each with its own array, toggle, log-entry type, and entry sheet.
Resolved shape, all explicit calls by Rob (via three rounds of clarifying questions before any
migration code was written, per this entry's own request in the original brief):
1. **Data shape:** new array key `settings.rx` is seeded from *all* pre-existing combined items —
   both former `'vitamin'`- and `'rx'`-tagged — with the now-redundant `category` field dropped.
   `settings.supplements` (same key, retargeted) becomes the new tracker and starts empty. Rob's
   reasoning: no real RX usage existed yet in testing ("trial data only"), so the cleaner long-term
   data shape was worth choosing over a lower-risk shortcut that would have kept a shared array with
   a tag.
2. **Log-entry type:** a genuine new `"rx"` type, not a shared `"supplement"` type with a
   discriminator field — matching decision 1's "build it clean" reasoning, and accepting the full
   CLAUDE.md new-entry-type checklist (reload-normalizer guard, backfill support, undo-on-delete
   branch, edit-routing, dedicated reload test) rather than the lower-risk alternative that would
   have avoided it.
3. **Toggle repurposing:** `showSupplements` (existing key) now gates the new Supplements tracker
   going forward, matching its literal name. A new `showRx` key (default `true`, since existing
   users have RX history) gates the retained RX tracker.
4. **My Plan touch widened:** the original approval was for one narrow toggle addition inside the
   existing Self-Managed RX section. Once this design was locked, Rob explicitly widened it to also
   split the "What I'm Tracking" list's combined "RX & Supplements" row into two independent
   rows/toggles, rather than ship a row whose label no longer matched what it controlled.
*Migration:* `SCHEMA_VERSION` bumped 2→3. Runs once inside `migrateSettingsShape()`, gated on
whether `settings.rx` already exists as an array (not just the version number, so a partial or
interrupted migration can't double-run). Reversibility: a temporary
`settings.__preMigrationSupplementsBackup` field snapshots the original combined array, kept for one
release cycle and removable once confirmed stable on real devices.
*Known, accepted limitation:* historical log entries created before this migration stay tagged
`type: "supplement"` regardless of which item they referenced — since RX only gained a distinct
`type: "rx"` going forward, a pre-migration dose of what is now an RX item won't retroactively count
toward RX's "taken today" state if backfilled onto today's date. Accepted given the trial-data
context that motivated decision 2.
*Why:* keeps RX (continuous existing-user data, existing icon/color) and Supplements (net-new,
Rob-supplied icon and accent) genuinely independent — separate goals, due-counts, and rings — while
Today's combined "RX & Supplements" tile is deliberately kept summing both trackers rather than
silently narrowing to RX-only, since Today's visual layout was out of scope for this session but its
underlying numbers still had to stay correct.
*Status:* **Locked** · Aug 27, 2026 · v3.52.0 — amends `UX-24` (Self-Managed RX split origin),
`UX-28` (RX page sections), `PROD-13` (Today's combined tile), `ARCH-OPEN-05` (first real use of the
migration-chain hook it established)
*Amendment (v3.58.0, Aug 27, 2026):* the two deliberate deferrals this entry called out — Today's
tile still summing both trackers, and every other "RX" label staying as-is — were resolved. Rob
asked for the next step: split Today's full-detail tile into independent Prescriptions/Supplements
tiles (reusing the already-independent `computeTrackerStats()` fields this entry's migration
produced — no new stat computation needed), and rename "RX" to "Prescriptions" everywhere it
appears as a user-facing label (Log It!, My Plan, the RX entry sheet, the bottom-nav tab, the
Backfill disclaimer, the "Tracked So Far" alert row), confirmed via clarifying questions to be a
full app-wide rename rather than the narrower "My Plan only" scope first mentioned. One correction
made during implementation: My Plan's "Self-Managed RX" section header was renamed "Self-Managed
Prescriptions & Supplements," not "Self-Managed Prescriptions" — that section wraps both trackers'
regimen cards, so a Prescriptions-only label would have been inaccurate; caught by reading the
section's actual rendered contents before applying the rename rather than assuming from its old
name. Internal identifiers (`settings.rx`, `type:"rx"`, `showRx`, route key `"rx"`) are unchanged —
this was a label rename only, not a further data-model change. The RX page itself (`UX-28`) and its
three section headers were already correctly named and were not touched. Partner configuration for
Treatments/Prescriptions and any Stats-page work for these three trackers remain explicitly
out of scope, deferred to a future session per Rob.
*Amendment (v3.59.0, Aug 27, 2026):* one piece of the v3.58.0 rename reverted — Rob clarified that
"RX" is meant as the umbrella term for all three trackers this whole decision chain manages
(Treatments/Prescriptions/Supplements), so the bottom-nav tab (and only the nav tab — it represents
the RX page's all-three-sections umbrella view) reverted from "Prescriptions" back to "RX". The
individual Prescriptions tracker keeps "Prescriptions" everywhere else (Log It!, My Plan, My Day,
the entry sheet) — that part of the v3.58.0 rename stands. The RX page's third section also renamed
"Vitamins & Supplements" → "Supplements" in the same pass, for consistency with the label used
everywhere else (see `UX-28` amendment below).

**TRACK-02 — Partner configuration: device-local `settings.partners` data model (Phase 1); Stats
content scoped for a future session (Phase 2/3).**
Direct continuation of `TRACK-01`'s explicit deferral: "Partner configuration for Treatments/
Prescriptions and any Stats-page work for these three trackers remain explicitly out of scope,
deferred to a future session per Rob." Rob asked to start that scoping; resolved shape, confirmed
via clarifying questions before any code was written:
1. **Data model scope: lightweight, device-local partner list**, not server-side/multi-tenant/
   clinic infrastructure. New `settings.partners` array — `{ id, name, type: "treatment"|"rx",
   logoDataUri, link }` — that Treatment/Prescription items reference by `partnerId`. Explicitly
   not the bigger build (clinic dashboard, protocol codes, multi-tenancy) the roadmap already flags
   as gated behind clinic-pilot validation that hasn't happened (`STRAT-OPEN-03`).
2. **Both existing non-functional placeholders wired up as the real flow** — the hardcoded "Austin
   Drip Lounge" demo card (unconditional, two buttons with no `onClick` handlers) replaced with a
   real partner list; the "Add Partner" sheet (explicitly commented "no data model wired") made
   real. Its original 5 fields were scoped down to the 4 that are actually partner-level data —
   Name, Type, Logo, Link — dropping "Protocol code" (a distinct, separately-sequenced roadmap item
   implying server-side clinic distribution) and "Number of sessions"/"Next appointment date"
   (already per-item concerns handled by each Treatment/RX item's own inventory/due-date fields).
3. **Migration**: `SCHEMA_VERSION` bumped 3→4. Existing items with a `provider`/`pharmacy` value are
   promoted into real partner records on boot, gated on `Array.isArray(settings.partners)` (not the
   version number) so a partial migration can't double-run — the same pattern `TRACK-01` established.
   Deduped by name+type, case-insensitive, not name+logo — a user who'd only uploaded a logo on one
   of several same-clinic items should still collapse to one partner record; first-seen logo wins if
   they differ. Legacy `partnerLogoDataUri`/`partnerLink`/`provider`/`pharmacy` fields are kept
   present but non-authoritative for one release cycle (`__prePartnerMigrationBackup` snapshot),
   mirroring `TRACK-01`'s own rollback-safety precedent.
4. **Entry-form behavior change, called out explicitly rather than shipped quietly**: the free-text
   provider/pharmacy field on Treatment/RX entry forms is replaced by a partner picker (existing
   partners of the matching type, or "No partner" — kept as the default, since most items today
   have neither field set, and self-managed items with no formal partner must not regress). The
   per-item logo/link upload block is removed from these forms — that data now lives once on the
   partner record, entered via the Add Partner sheet. Uploading a partner's logo now happens once
   per partner, not once per item.
5. **Stats content (Phase 2/3) scoped, not built this pass**: adherence over time (%-of-scheduled,
   day/week/month, shaped like the existing Water/Protein/Calories bar-chart tab rather than
   Weight/Sleep's raw-value line — items with no schedule show a count, not a fabricated
   percentage, same reasoning `UX-32`'s Weight-ring amendment already established), inventory/
   expiration timeline (recommended as a sorted list/card view, not a chart — the app doesn't
   snapshot `qtyRemaining` over time, so there's no real time axis to plot), and per-partner
   breakdown (a filter on top of the other two, once `partnerId` exists — no new visualization
   primitive needed). Deferred to a future session; this entry preserves the scoped shape so that
   session doesn't have to re-derive it.
*Why:* keeps day-to-day logging and My Plan's existing "system of record" role unchanged while
finally giving the partner-branding fields `UX-28` introduced (name/logo/link duplicated per item,
no reuse) a real, reusable home — the smallest data-model step that removes the "re-type and
re-upload the same clinic's logo on every item" friction without building clinic-side infrastructure
the business hasn't validated yet.
*Status:* **Locked** · Aug 27, 2026 · v3.60.0 — continues `TRACK-01`'s explicit deferral; amends
`UX-28` (partner logo/link fields now resolve through a partner record, see that entry's v3.60.0
amendment)

**UX-40 — Six quick tweaks after Rob's v3.60.0 review, plus a real bugfix: My Day Supplements tile
connected, Log It!'s fast-entry tiles locked to the bottom row, Weight ring tightened, three header/
section-name renames.**
All explicit calls by Rob in one round of feedback:
1. **Bugfix, not a tweak**: My Day's Supplements tile rendered but did nothing when tapped —
   `onOpenNewSupplementSheet` was wired into Log It!'s `MO` call site (`RO`'s sibling) but never
   passed through My Day's own `RO`→`MO` call site, so `onOpenSup2` was `undefined` there. Fixed by
   threading the same handler through both.
2. **Log It!'s 3 fast-entry tiles locked to the grid's last 3 cells.** Previously these were simply
   the last 3 JS array entries in the grid's children list — visually last only relative to however
   many tracker tiles were currently rendered, so toggling any tracker off on My Plan shifted every
   subsequent tile (including these 3) up by one grid position. Rob wanted them pinned regardless.
   Fixed by rendering an invisible placeholder cell (`.wt-tracker-col-compact-off`, sized to match a
   real tile, `visibility:hidden`, non-interactive) for any toggled-off tracker instead of omitting
   it — the grid always has exactly 12 cells now, so the last 3 never move. Placeholder uses a
   distinct class (not shared with `.wt-tracker-col-compact`) specifically so existing tile-count
   assertions elsewhere keep counting only real, visible tiles.
3. **Weight's compact-tile ring tightened to the image edge** — `.wt-gauge-imageonly-img` was 94% of
   its box (visual gap between the border and the image), bumped to 100%.
4. **Header text**: My Day's "My Day's Summary for:" → "TODAY'S INTAKES"; RX page's "SCRIPTS FOR:"
   → "RX FOR:".
5. **My Plan section renames**: "My Treatments" → "My Health Providers" (Rob's reasoning: that
   section now holds both Treatment and Prescription partners via `TRACK-02`'s partner list, not
   just treatments, so the old name undersold it); "Self-Managed Prescriptions & Supplements" → "My
   Current RX"; "Self-Managed Treatments" → "Treatments". Two in-form hint texts (on the Treatment
   and RX entry forms, added in `TRACK-02`) that referenced the old section names by name were
   updated to match.
*Status:* **Locked** · Aug 27, 2026 · v3.61.0 — amends `TRACK-02` (section renames, hint-text
wording), `UX-07` (fast-entry tile position now locked rather than merely last-by-array-order),
`UX-32` (Weight ring sizing)

**UX-34 — Log It! real-device review round 1: date-pill centering/calendar-picker, top-row/grid
sizing.**
Rob's first real-device pass on the v3.51.0/v3.52.0 Log It! redesign found three problems, all
explicit calls by Rob:
1. **Date pill centered on screen** — was flush-left because `.wt-header`'s
   `justify-content:space-between` only balances correctly with two children (a back button + the
   date), and Log It! never renders the back button. Fixed with a `:only-child`-scoped CSS rule
   that cannot affect the Profile page's back-button layout.
2. **Chevron arrows replaced with a native calendar picker** — the prev/next-day chevrons were "too
   small" with "unclear feedback on which day you actually pick." Replaced with a single tap target
   covering the whole pill (`min-height:var(--touch)`, the app's existing 48px touch-target
   standard) that opens a native `<input type="date">` — the OS/browser's own calendar UI, reusing
   the exact pattern already used in `BackfillSheet` and RX/treatment expiration date fields rather
   than building a custom calendar widget.
3. **Top row shrunk, grid icons/labels enlarged** — the 3 top-row icon boxes were "too big"
   (`min(28.5vw, 15vh, 144px)` → `min(19vw, 10.5vh, 96px)`); the freed vertical space (plus trimmed
   row padding/margin) funds bigger 3×3 grid icons (64px → 84px default, 88px → 100px in the
   2-column fallback) and labels (12px flat → 14.5px / 15.5px), per Rob's own request to trade top-
   row size for grid legibility.
*Found while implementing, not requested:* fixing the calendar picker surfaced a genuine
sign-inversion bug in the pill's `offsetDays` math — `today - selectedDate` is positive for a past
day, but the badge logic checked for `-1`, so picking "yesterday" had shown "PAST DAY" instead of
"YESTERDAY" since `UX-30` first shipped it. A new harness test written to verify the calendar picker
caught this; the original build had no coverage of the badge text at all.
*Why:* Log It! is the most-used page and has to be intuitive enough that testers keep using it —
Rob's framing. All three fixes are presentation-only (CSS/JSX, no data model), but genuinely need
his eyes on a real device again since jsdom cannot verify layout, centering, or the native picker's
actual appearance.
*Status:* **Locked** · Aug 27, 2026 · v3.53.0 — amends `UX-30` (date pill), `UX-31`/`UX-32`
(top-row/grid sizing)

**UX-35 — Top-row icon artwork: three supplied rounds unusable, real transparent PNGs still
needed.**
Rob supplied replacement art for the Voice Tracker/Presets/Meal Entry top-row icons (addressing the
"white square background" complaint from `UX-34`) across three separate rounds. None were usable:
round 1 arrived as PNGs with an opaque background still present; round 2's Presets image arrived as
a JPEG (no alpha channel possible in that format at all); round 3 — resent explicitly as
"transparent and as png" per Rob's own description — still arrived as JPEGs for all three, and each
one visibly has a checkerboard pattern baked into the actual pixels, matching the pattern
image-editing tools use to *indicate* transparency in their own preview UI. The likely mechanism:
whatever's reaching this chat is a flattened screenshot/export of that transparent-preview
thumbnail rather than the actual PNG file, so the on-screen "this is transparent" indicator got
captured as literal opaque gray/white pixels.
*Decision:* do not apply any of the three rounds — using them would look worse (a visible
checkerboard) than the current plain white-background icons. All three keep their original files
until a genuine PNG export with real alpha is supplied.
*Why:* recording this so a future session doesn't re-attempt the same round-trip blind — the fix
needed is on the export side (save/export the actual PNG file directly, not a screenshot of a
transparent-preview thumbnail), not anything on the code side.
*Status:* **Superseded by `UX-36`** · Aug 27, 2026 · v3.53.0 — Rob asked for the backgrounds fixed
regardless of image-supply issues; `UX-36` covers the programmatic fix actually shipped.

**UX-36 — Real-device review round 2: top-row icon backgrounds fixed programmatically, grid sized
up further, header rearranged.**
After `UX-35`'s three rounds of unusable supplied images, Rob's follow-up was explicit: "we must
fix this" — not another round-trip. Resolved with a code-only fix rather than waiting on new art,
plus two further real-device requests, all explicit calls by Rob:
1. **Icon backgrounds removed programmatically.** A one-off Node script (`pngjs`, pure JS, no
   native binary dependency) processes the three *original* round-1 PNGs (which had a real, if
   opaque, alpha channel — unlike the later JPEG rounds): samples background color from each
   image's corners, chroma-keys near-background pixels to transparent with a soft-edge falloff
   (avoids a harsh jagged cutout), crops to the surviving content's bounding box, pads to a square
   transparent canvas, and bilinear-resizes all three to an identical 480×480 output. The common
   final canvas size is what fixes "not the same size and level with each other" — regardless of
   each source image's original aspect ratio (voice-tracker was near-square, presets notably more
   portrait), `object-fit:contain` now renders all three at the same visual scale. Verified
   programmatically only (corner pixels confirmed alpha=0, center alpha=255 on all three) — this
   tool cannot render a transparent PNG against a dark background to eyeball edge quality, so this
   is explicitly best-effort, not a guaranteed-clean cutout the way a properly designed transparent
   export would be.
2. **3×3 grid sized up again, spacing tightened to make room.** Icons 84px→102px (3-column
   default), 100px→122px (2-column fallback); labels 14.5px/15.5px→16.5px/17.5px. Room freed by
   shrinking `.wt-tracker-col-compact` padding (12px→4px vertical) and the grid's own gap
   (16px/12px→8px/6px) and margin (8px/16px→4px/12px) — Rob's own suggestion ("reduce the black
   space to help keep them closer together").
3. **Header rearranged**: brand (logo+title) moved from a centered cluster to the far-left edge;
   profile icon moved from the left (previously nudged in tight against the brand with a `-14px`
   margin hack) to the far-right edge. `.wt-topbanner-inner` switched from `justify-content:center`
   to `space-between`, with a new `.wt-topbanner-brand` wrapper grouping the logo+title so they move
   as one unit rather than spreading apart under `space-between`'s two-child assumption.
*Why, for the icon-background fix specifically:* three attempts at getting a usable transparent export
from Rob had already failed for reasons outside either side's easy control (chat upload pipeline
apparently flattening/re-encoding images); rather than a fourth blind attempt, solving it in code
unblocks the release now. This is recorded as best-effort/reversible — if the chroma-keyed edges
look wrong on a real device, the fallback remains a genuine designed transparent PNG from Rob (see
`UX-35` for what that requires on the export side), which would simply replace these files with no
further code change needed either way.
*Status:* **Locked** · Aug 27, 2026 · v3.54.0 — amends `UX-31`/`UX-32`/`UX-34` (top-row/grid
sizing), supersedes `UX-35`'s blocked state for the background specifically (edge-quality follow-up
remains open)

**UX-37 — Top-row icon staleness was a caching issue, not a code bug; icon files cache-busted; top
row sized to match the 3×3 grid exactly.**
Rob reported the Voice Tracker icon still showed its old white-background image after `UX-36`
shipped. The committed file was re-verified as already correct (corner alpha 0, center alpha 255,
matching what `UX-36` produced) — this was a stale cached copy, not a regression. `_headers`'
`no-cache, no-store, must-revalidate` rule on `/app/*` (`OPS-05`) controls browser caching, but a
CDN edge cache in front of the deployed site is a separate layer outside this repo's control and
isn't guaranteed to honor that header for static binary assets the way it does for the JS bundle.
Rather than rely on a cache purge outside this session's reach, the three top-row image files were
renamed (`voice-tracker.png`→`voice-tracker-v2.png`, and the same for `presets`/`meal-entry`) —
a stale URL simply stops resolving, forcing every client to fetch the new file regardless of any
cache layer's behavior. All three were renamed, not only Voice Tracker, so the same silent
staleness can't recur for the other two later.
Separately, Rob asked for the top-row icon boxes and labels to match the 3×3 grid's size exactly:
`.wt-toprow-art-wrap` changed from a responsive `min(19vw, 10.5vh, 96px)` to a flat `102px`, and
`.wt-toprow-label` from `13.5px` to `16.5px` — both now identical to the grid's default (3-column)
icon/label size rather than independently tuned values.
*Why:* recording the caching root-cause explicitly so a future "the image didn't update" report
gets diagnosed faster — check whether the file itself is correct before assuming a code bug, and
prefer a filename rename over waiting on/requesting a cache purge, consistent with this project's
existing hard-won lesson (`CHANGELOG.md`'s "Caching will strand users on stale builds" from v1–v2)
that caching bugs recur in layers beyond the one already fixed once.
*Status:* **Locked** · Aug 27, 2026 · v3.55.0 — amends `UX-36` (top-row sizing, icon filenames)

**UX-38 — `UX-37`'s caching diagnosis was wrong; the real cause was a stale source image on this
session's side, corrected with the actual current artwork.**
Rob pushed back on `UX-37`'s conclusion: he'd cleared his browser multiple times and the old
Voice Tracker image (with "LISTEN · TAKE VOICE ENTRIES · AGENTIC AI" arced across the top) kept
showing. He was right — this session had been chroma-keying the *original* round-1 upload as its
source image the whole time, never re-checking whether a newer version existed in the later rounds
of images Rob sent. Rob had, in fact, already edited the badge to remove that text; this session
simply never used that edit as input, so no amount of cache-busting on the *output* file could have
fixed a wrong *source*. `UX-37`'s cache-busting fix was still real work (renaming files is still
the right general practice — see that entry), but it fixed a problem that wasn't the actual cause
this time.
Rob's latest resend was, once again, a JPEG with a checkerboard baked into the pixels (the same
mechanism as `UX-35`'s earlier rounds) rather than true alpha transparency — but a checkerboard is
two alternating flat tones, not one uniform background color, so `UX-36`'s corner-sampled chroma-key
approach (built for a single-color background) would not have isolated it correctly. A second,
checkerboard-specific script was written: sample the two actual checker tones directly from the file
(~205 and ~255, both near-neutral gray) rather than assuming a single corner color, clear any
adjacent near-gray fringe pixels to avoid a faint halo at the true edge, then reuse `UX-36`'s existing
crop/pad/480×480-resize pipeline unchanged. The result was visually inspected before shipping (via
the Read tool, not just alpha-value checks like the first pass) — a clean circular badge, text gone,
matching what Rob described.
*Why this is recorded as its own entry rather than folded into `UX-37`:* the mistake itself is the
important thing to carry forward — a "user reports X still looks wrong after a fix" report should
prompt re-checking the actual current inputs/state before defaulting to a caching explanation,
especially when the user reports having already cleared caches. Caching is a real, recurring bug
class in this codebase (`CHANGELOG.md`'s v1–v2 lessons), but it is not the *only* explanation for
"the old thing keeps showing up," and asserting it with confidence without checking is itself a
failure mode worth naming.
*Status:* **Locked** · Aug 27, 2026 · v3.56.0 — corrects `UX-37`'s root-cause diagnosis; the
cache-busting mechanism `UX-37` introduced remains in place and is reused here (a third filename,
`voice-tracker-v3.png`)

**UX-39 — Log It!'s top row merged into the tracker grid; divider removed, now a single 4×3 grid.**
Rob's real-device feedback: "remove the line divider you have between the top 3 tiles and the
bottom 3x3 tiles and move the 3x3 up a little to close the space and it then should be a 4x3 grid...
four down three across all evenly spaced out." The standalone `TopRow`/`TopRowItem` components and
the `.wt-toprow` divider CSS (amends `UX-30`/`UX-31`/`UX-32`, which introduced them) are removed;
Voice Tracker, Presets, and Meal Entry are now the first 3 tiles of the same
`.wt-trackers-grid-compact` grid the trackers render into, via the same `compactTile()` helper used
for every other tile, with a new plain-image variant (`.wt-tile-plain-img`) standing in for a ring.
The old 2-column fallback for ≤4 enabled trackers was dropped in the same pass — with the 3 top-row
items always present, the grid can no longer be sparse enough to need it.
In the same request, Rob also asked for new Presets/Meal Entry/Weight images to replace the current
ones. No images arrived attached to the original message; once flagged back, Rob sent all three
one at a time later in the same session. Each was verified directly (not assumed) before use: real
PNG format, real alpha transparency (corner alpha 0), no checkerboard or JPEG-recompression
artifact — unlike every prior round of top-row art this session, none of this round needed a
chroma-key or checkerboard-removal script. Each was cropped to its content bounding box, padded to
a square canvas, and resized to 480×480 (the same pipeline used for the other tile icons), then
visually inspected before shipping. New files: `presets-v3.png`, `meal-entry-v3.png`,
`weight-v2.png` (old `presets-v2.png`/`meal-entry-v2.png`/`weight.png` removed). Weight's new
artwork was applied to both its Log It! ring-less compact rendering and its Today/full-detail ring
rendering, so the tracker's look stays consistent across both pages.
*Status:* **Locked** · Aug 27, 2026 · v3.57.0 — amends `UX-30`/`UX-31`/`UX-32` (removes the top-row
structure they introduced); image swap completed in the same release

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

**STRAT-OPEN-02 — Business model and pricing.** — *most time-sensitive open item.*
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
*Phase 1 complete (Aug 20, v3.22.0):* My Plan page redesigned in `src/app.js`. Unified tracker rows — one row per tracker with toggle + goal inline. Three CRUD lists collapsed to summary rows. Not yet deployed to `site/app/bundle.js` — deploy is a separate decision after real-browser visual verification.
*Two of five §8 open questions resolved (Aug 20):* (1) "My Plan" confirmed as the name — amends UX-06. (2) Off-trackers: initially resolved as "hideable entirely — collapsed rows, 'Show all trackers' link." **Superseded Aug 21, 2026 by UX-10:** all 8 trackers now render unconditionally on My Plan, dimmed; the `showHiddenTrackers` state and button were removed. Off-trackers are only hidden on Log It!.
*Remaining open questions:* caregiver case (probably "not yet"), appointment date location, clinic-code prompt scope (everyone vs. QR deep-link only).
*Small outstanding from Phase 1:* "Add in Setup" stale copy on two Log It! tiles (Treatments/Supplements empty-state CTA) — quick fix, not yet addressed.
*Phase 2 (not started):* Settings consolidation — six status rows, "Your data" backed-up/not status, Reminders grouped by intent, tutorial on first run.
*Phase 3 (not started):* Clinic onboarding ramp.

**UX-OPEN-02 — Backdrop-click cascade: OO modal closes parent Log sheet.**
When the OO preset add/edit modal is open and the user taps its backdrop, React's tree-based event bubbling (not DOM-based) propagates the click to the parent Log sheet, closing both in one action instead of just the modal. Pre-existing behavior, not introduced by the `createPortal` fix in v3.33.0 — the portal inherits it. My Presets backdrop already has `stopPropagation` for this exact reason.
*Fix:* one-liner `stopPropagation` on the OO modal backdrop handler, same as My Presets. Claude can do this alone.
*Needs first:* Rob's real-device confirmation that the cascade actually manifests (jsdom can't test backdrop event behavior end-to-end). If confirmed, this is a quick patch, no design decision required.

**ARCH-OPEN-01 — Source reconciliation: extraction complete, build pipeline established.**
*Status: **Locked — complete** · Aug 20, 2026*
Chosen approach: extract from live bundle. Executed Aug 20, 2026.
- `src/app.js` — 6,104 lines extracted from `site/app/bundle.js`. All 38 vendor identifiers renamed to real names across 7 batches. Recharts pinned to 2.15.4.
- `esbuild.config.js` — build pipeline authored from scratch. Output: `site/app/bundle.build.js` (gitignored). `NODE_ENV=production` set; harness-verified clean boot.
- Worker side resolved (Aug 20): the real deployed `worker.js` (728 lines) committed, `wrangler.toml` has real values, first `wrangler deploy` succeeded (`OPS-09`).
- `src/app.js` + `esbuild.config.js` are now the source of truth for all future edits.

**ARCH-OPEN-02 — Data model: when to move off the single-blob store.**
Currently one JSON blob in `account_backups.data`. Cannot answer "which patients are lapsing" or "what's D30 retention" — i.e. the entire B2B product. Proposed: keep the blob for sync, add normalized `log_entries` + `user_activity` rows.
*Update (Aug 20, 2026):* `user_activity` shipped as part of `ARCH-OPEN-06` (retention analytics). The broader normalized model (`log_entries`, lapsing-patient queries) remains open — that's the clinic dashboard prerequisite.

**ARCH-OPEN-03 (revised) — Health-platform integration: scope and sequencing.**
Widened from "native wrapper for HealthKit / Health Connect?" to the full question. Forks: (a) drop the ambition entirely; (b) Capacitor wrapper, push-first to HealthKit + Health Connect — collapses Samsung and most Android into one integration, but forces ARCH-OPEN-04 (Access removal), LEGAL-OPEN-01, and provenance work in ARCH-OPEN-02; (c) cloud pull only (Oura ± Google Health) — cheapest, but off-thesis per roadmap §5; (d) aggregator (Terra/Thryve/Validic/Rook) — one integration, holds the Garmin partnership, but a third party in the middle of health data. Notes: Garmin's partner program is closed to new applicants; Google restricted health scopes require CASA assessment; the legacy Fitbit Web API decommissions Sept 2026.

**ARCH-OPEN-04 — Server as source of truth, and removing Cloudflare Access.**
Standing data-loss exposure: history lives in one browser's storage. Access also can't scale past an invited list.

**ARCH-OPEN-05 — Versioned schema and deep-merge migrations.**
*Note: this entry was created at the planning stage (Aug 18). See the second ARCH-OPEN-05 entry below for the completion record.*
Replace the hand-maintained field whitelists in the load path (`One()`, `vj()`, `yj()`) with a versioned schema, deep-merge-against-defaults, and an explicit migration chain. Roughly 100 lines; retires the silent-field-loss bug class rather than fixing it once more. Cheap in real source, miserable in a minified bundle — so it belongs immediately after `ARCH-OPEN-01`. Prerequisite for protocol provenance in `UX-OPEN-01`.
*Created Aug 18, 2026 — this work previously had no ID and was cited incorrectly as `ARCH-OPEN-02` in the redesign spec.*

**ARCH-OPEN-05 — Versioned schema and deep-merge migrations.**
*Status: **Locked — complete** · Aug 20, 2026*
Replaced three hand-maintained field whitelists in the load path with a single `migrate(stored)` function using `deepMergeDefaults` against `defaultSettings`. Export inverted from allowlist to denylist. `SCHEMA_VERSION=2` stamped with a migration-chain hook for future breaking changes. Fixes `goalWeight`/`goalExerciseMinutes` silent-drop bug in `src/app.js` (shipped v3.20.0); same bug patched in deployed `site/app/bundle.js` separately (v3.21.0, real-device verified Aug 20).
*Why:* the silent-field-loss bug had already bitten sleep, weight, and supplements. The fix retires the whole bug class rather than patching it once more.
*Addendum (Aug 25, 2026, v3.49.0):* the array-item normalizers this decision introduced —
`US()` for supplements, `normalizeTreatments()` for treatments, both called from
`migrateSettingsShape()` on every `migrate()` pass — turned out to have their own hand-maintained
field whitelists, the exact same bug class one level down: `category`, `pharmacy`,
`refillsRemaining` (supplements) and `provider` (treatments) were all missing from those
whitelists and so were silently stripped on every app boot and backup restore, confirmed present
in the deployed bundle. `deepMergeDefaults` doesn't help here because it treats arrays specially
(passes the incoming array through as-is rather than merging field-by-field), so the per-item
normalizers are still a manual whitelist that must be kept current by hand. Found and fixed while
building the RX page (`UX-28`) — the fields are now included, and a dedicated boot-time
reload-persistence check was added to `tools/harness.js`. Flagging this as a standing pattern to
check any time a new field is added to a supplement or treatment item: it must go in the relevant
normalizer's whitelist, not just the add/edit handler, or it repeats this bug.

**ARCH-OPEN-06 — Retention analytics via the Worker.**
*Status: **Fully deployed and verified** · Aug 20, 2026*
`POST /api/progress` merged: D1 retention write (opaque id + server-assigned UTC date to `user_activity`) runs for every caller before the KV progress save. Full D1 schema migrated: 6 tables (`users`, `login_tokens`, `sessions`, `shares`, `account_backups`, `user_activity`). Deployed Aug 20, 2026 — first row recorded same day.
*Coverage gap closed (Aug 20, 2026):* bundle coverage fix shipped as v3.18.0 — `wtDeviceId()` + `wtActivityPing()` + mount-only effect added. All users, push-subscribed or not, now generate a `user_activity` row on app mount. Verified on real device.

**LEGAL-OPEN-01 — Compliance path, including whether to accept HIPAA obligations.**
The clinic path may make HydroPro a Business Associate. Separately, the FTC Health Breach Notification Rule and Washington's My Health My Data Act apply to consumer health apps outside HIPAA. Needs a digital-health attorney, not a decision made in-app.
*Addendum (Aug 17, 2026):* Two additional independent triggers identified. (1) App-store distribution, required for any native health-platform integration, brings its own privacy-policy, data-deletion, and health-data-declaration obligations. (2) If a clinic wants to *receive* patient wearable data rather than the patient merely using it, that is materially closer to Business Associate territory than patient-entered adherence data shared via a snapshot link — in that case, legal consultation must precede the build, not follow it.
*Addendum (Aug 21, 2026):* PROD-09 (backfill provenance fields) is the first field added specifically for clinic-facing reporting. The moment clinic patient data enters scope, this stops being theoretical.

---

*Last updated: August 27, 2026 (worker-only, no app version bump: PROD-15 added — Smart Entry Phase
A worker-side implementation (POST /api/interpret, KV cache, D1 smart_entry_usage migration
proposed not run), model/cap/beverage-counting decisions confirmed by Rob, front-end and analytics
explicitly deferred; flags a numbering/doc-drift mismatch between the smart-entry brief and this
log (UX-18 collision, PROD-14/UX-14a not yet created); earlier: v3.61.0: UX-40 added — bugfix (My Day's Supplements tile now
connected), Log It!'s 3 fast-entry tiles locked to the grid's last 3 cells via placeholder cells for
toggled-off trackers, Weight ring tightened to the image edge, header text renames ("TODAY'S
INTAKES", "RX FOR:"), My Plan section renames ("My Health Providers", "My Current RX",
"Treatments"); amends TRACK-02/UX-07/UX-32; earlier: v3.60.0: TRACK-02 added — Phase 1 of partner configuration, a new
device-local `settings.partners` data model (name/type/logo/link) that Treatment/Prescription items
reference by id, with a one-time migration promoting existing per-item provider/pharmacy+logo/link
into real partner records; the hardcoded "Austin Drip Lounge" demo card and non-functional "Add
Partner" placeholder sheet both wired up for real; Stats-page content (Phase 2/3) scoped but not
built this pass; amends UX-28 (partner logo/link fields now resolve through a partner record);
earlier: v3.59.0: TRACK-01/UX-28 amended — "RX" nav-tab label restored
(umbrella term for Treatments/Prescriptions/Supplements; the individual Prescriptions tracker keeps
its own label elsewhere), RX page's "Vitamins & Supplements" section renamed "Supplements"; UX-06
amended — "Today" renamed "My Day" app-wide, Log It!/My Day nav positions swapped (explicitly
re-requested by Rob, superseding the v3.42.1 revert of the same swap, not regressing it); UX-07
amended — Log It!'s 3 fast-entry tiles (Voice Tracker/Presets/Meal Entry) moved from the front of
the grid to the back; UX-32 amended — Weight's compact tile regains a completion ring (rounded-
square border+glow, CSS-only, not a fabricated percentage) alongside its existing checkmark badge,
reversing that entry's "no ring for readings" reasoning by explicit request; earlier: v3.58.0:
TRACK-01 amended — Today's combined "RX & Supplements"
tile split into independent Prescriptions/Supplements tiles, "RX" relabeled "Prescriptions"
app-wide (Log It!, My Plan, RX entry sheet, bottom nav, Backfill disclaimer, Tracked So Far row);
My Plan's "Self-Managed RX" section became "Self-Managed Prescriptions & Supplements" (corrected
from the originally planned "Self-Managed Prescriptions" after finding the section covers both
trackers); PROD-13/UX-24/UX-28 amended to point at this resolution; earlier: v3.57.0: UX-39 added — Log It!'s standalone top row merged into the
tracker grid (amends UX-30/UX-31/UX-32), divider removed, now a single evenly-spaced 4x3 grid;
2-column grid fallback dropped; Presets/Meal Entry/Weight images Rob also requested arrived later in
the same session and were swapped in, verified clean (real alpha transparency, no checkerboard/JPEG
artifact) without needing a chroma-key script; earlier: v3.56.0: UX-38 added — corrects UX-37's caching diagnosis (the real
cause was a stale source image on this session's side, not caching); Voice Tracker icon replaced
with the correct text-free artwork via a checkerboard-specific strip script, visually confirmed
before shipping; earlier: v3.55.0: UX-37 added — top-row icon staleness diagnosed as a CDN
caching issue (not a code bug), fixed via cache-busting filenames, top-row sizing matched exactly to
the 3x3 grid; earlier: v3.54.0: UX-36 added — top-row icon backgrounds fixed
programmatically (chroma-key script, supersedes UX-35's blocked state), grid sized up further,
header rearranged (brand left, profile right); earlier: v3.53.0: UX-34 added — real-device review round 1: date-pill
centering, chevrons replaced with a native calendar picker, top-row/grid sizing, plus a genuine
offsetDays sign-inversion bug found and fixed along the way; UX-35 added (Open) — three rounds of
top-row icon art from Rob all unusable (opaque/JPEG/checkerboard-baked-in), real transparent PNGs
still needed; earlier: v3.52.0: TRACK-01 added — RX and Supplements split into two
independent trackers (separate settings.rx/settings.supplements arrays, new "rx" log-entry type,
new showRx toggle, migration with a temporary rollback snapshot), My Plan's "What I'm Tracking" row
split to match, Today's combined tile kept numerically correct without a visual change; earlier:
v3.51.0: UX-30–UX-33 added — Log It! date pill (`logDate`/
`entryTargetDate`), top row replacing Voice Entry/Use Presets banners, borderless grid + redesigned
ring (track/goal-met/ring-less-Weight), quick-add chips + button relabel — all Log It!-only, Today
untouched; earlier:
v3.50.0: UX-29 added — Log It! reduced to a compact 3x3 tile grid
plus new "Meals" and "Use Presets" tiles, Voice Assistant renamed Voice Entry, amends
UX-02/UX-18/UX-25, notes PROD-04 satisfied via Today/My Plan/RX page; earlier: v3.49.0: UX-28 added — new "RX" nav page consolidating
Treatments/Prescriptions/Vitamins & Supplements ("SCRIPTS FOR:"), partner-branded logo/link cards,
"Remaining RX/Treatments" retired from Today, amends UX-06/PROD-13/UX-27; ARCH-OPEN-05 addendum —
fixed a second-level normalizer bug (`US()`/`normalizeTreatments()`) that was silently stripping
category/pharmacy/refillsRemaining/provider on every app boot and backup restore; earlier: v3.48.0:
UX-27 added — Voice Assistant tile removed from Today,
Log It!'s 8 tracker tiles duplicated onto Today, "Prior Days" moved to Stats and renamed "Edit
Prior Days Logs", amends UX-19/UX-21; earlier: v3.47.0 follow-ups: UX-07 amended — "RX & Vitamins" renamed back to
"RX & Supplements"; UX-25/UX-26/PROD-13 amended — Sleep→Weight and RX & Supplements→presets gaps
fixed, Today's Log rows tightened further, Remaining RX/Treatments given its own card border;
earlier: PROD-13 added for v3.46.0 — My Plan as system of record / Today as
status view / Log It! as the logging action, Subscriptions panel retired for a new "Remaining
RX/Treatments" Today section; UX-25/UX-26 added for v3.46.0 — Log It! tile trim/spacing, Today's
Log row restack; earlier: UX-24 added for v3.45.0 — Self-Managed RX split on My Plan
(Vitamins & Supplements / RX), next-due-date editing restored for RX items; UX-23 added for v3.44.0
— "To Do Today" removed, Today is now exec-summary-at-top/full-log-below; earlier: UX-22 added for
v3.43.0 — "Tracked So Far" replaced with "Today at
a Glance" needs-attention summary, amends UX-21; earlier: UX-21 amended for v3.42.1 — nav-order swap reverted per Rob after real-device testing, Today's content changes retained; earlier: UX-21 added for v3.42.0 — Today promoted to landing page, Tracked So Far section, nav order swap, amends UX-06; earlier: UX-20 added for v3.41.0 — Profile page header-icon-only entry point and local-only storage; earlier: UX-19 added for v3.40.0 — Log It! preset/manual split, Voice Tracker tile, header AI icon removed; earlier: UX-18 amended for v3.39.1 — My Plan sheet color-match, centered hero number, bigger caption; earlier: UX-18 added for tracker-sheet color-matching and Log It! tile hero-number restructure; UX-15–17 for dark-theme completion, support tokens, and form-control reset; STRAT-11, PROD-10–12, UX-11a, UX-12–14 for Smart Entry and design-system decisions; earlier: UX-10, UX-11, PROD-06–09, UX-OPEN-02, UX-02 amendment, ARCH-OPEN-01/05/06 closed)*
