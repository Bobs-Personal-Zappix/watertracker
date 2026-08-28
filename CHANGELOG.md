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

## [3.63.4] — 2026-08-28

App-launch splash screen: black, with the logo spinning to upright. Rob: opening the app from the
home-screen icon showed a white screen with a static logo, doesn't match the style guide.

- **Root cause**: the white screen is the OS/browser's own auto-generated PWA launch splash — both
  Android/Chrome and iOS build it automatically from `manifest.json`'s `background_color` plus the
  app icon, centered. It isn't rendered by the app and previously wasn't touched, so it defaulted
  to `manifest.json`'s old `#F2F5F8` (near-white).
- `site/app/manifest.json`: `background_color` changed to `#0B0F14` — the app's actual `--bg` dark
  token (same one used everywhere else in the app, including the existing "Loading your
  tracker…" state), not an arbitrary pure `#000`.
- `site/app/index.html`: the same dark background for the brief window between the native splash
  disappearing and the app's own JS taking over (previously white here too). Added a real
  spinning-logo screen in that window — the actual header logo (`gauges/main-logo.png`), 2 full
  rotations landing exactly upright (`animation-fill-mode: forwards`, not an infinite loop that
  could be cut off mid-turn), respecting `prefers-reduced-motion` (matching an existing pattern
  elsewhere in the app's own CSS). Lives in `#root`'s initial markup — React's `createRoot(...).
  render()` replaces it cleanly on first commit, no JS coordination needed.
- Pure HTML/CSS/config change, no `bundle.js` logic touched apart from the version bump. ESLint
  no-undef sweep and jsdom harness (618 checks, 0 runtime errors) re-run to confirm the version
  bump didn't break anything, but neither can exercise this change itself — CSS animation and
  layout are outside what jsdom renders.
- **Not verified visually** — no browser automation (Playwright/Puppeteer) available in this
  environment. Needs Rob to confirm on a real device: background reads as black not gray/blue,
  the logo spins and lands upright, and the transition into the app itself doesn't flash white.

## [3.63.3] — 2026-08-28

Voice quality follow-up to v3.63.2, from Rob's Android testing. See `docs/DECISION-LOG.md`
`PROD-17`'s third Aug 28 amendment.

- Rob confirmed v3.63.2's script/rate fixes were "much better" but asked for a more human-sounding
  voice. Two paths were presented: a real neural/cloud TTS voice (better quality, but a new Worker
  endpoint + secret + per-request cost + added latency — real new scope) vs. picking the best
  voice already on the device (free, no new infrastructure, but capped by what browser TTS
  engines sound like). Rob chose the on-device path.
- `X(R,A)`'s voice preference in `site/app/bundle.js` now checks first for any en-US voice whose
  name contains "enhanced," "premium," or "natural" — the labels iOS uses for its higher-quality
  Siri voice variants — before falling through to the existing Google US English / named-voice /
  local / any-en-US tiers. No effect on Android if no such labeled voice exists there; falls
  through to the same tiers as before.
- Full verification pipeline re-run against the exact shipped `bundle.js`: ESLint no-undef sweep
  unchanged (11 pre-existing vendor errors, none new), jsdom harness full pass (618 checks) with
  0 runtime errors, end-state audit confirmed the new tier and version bump present.
- **Not yet verified on a real device** — jsdom can't enumerate real device voices or play audio.
  If this still isn't enough on Rob's Android device, the next step is the cloud-TTS path he
  explicitly declined this round, not further on-device tuning.

## [3.63.2] — 2026-08-28

Smart Entry voice layer follow-up, from Rob's real-device testing of v3.63.1 on **Android**. See
`docs/DECISION-LOG.md` `PROD-17`'s second Aug 28 amendment — this explicitly supersedes B2's
"drop the opening prompt" / "under 2 seconds" timing doctrine, at Rob's direction.

- **Script rewrite, per Rob's exact wording.** Opening the Voice Tracker now speaks a prompt
  before listening starts: *"Tell me what you had and want to add."* (previously no opening
  prompt, per the original B2 decision). The terse "Got 1. Say yes." confirm line — which Rob
  said he didn't understand — is now: *"Is this correct? If so, please say yes and I'll add it.
  Or tell me what you want changed and I'll update it."* On confirm, she now says *"All set!"*
  before the overlay closes (new — B4 never specified confirm copy).
- **Voice-picker timing bug fixed.** Rob also didn't like the voice itself. Investigating found
  `speechSynthesis.getVoices()` commonly returns empty on the very first call after page load
  (async population, especially on Chrome/Android) — v3.63.1's picker called it synchronously
  with no wait, so the opening prompt (now the very first utterance on a fresh load) likely fell
  through to the raw default engine voice instead of the intended clearer pick. Fixed with a
  voice-priming helper that waits for `onvoiceschanged` (300ms fallback) before speaking if the
  list isn't populated yet. Same code path on Android Chrome and iOS Safari — this was a timing
  bug, not a platform difference, so no OS branching was needed.
- Also hardened: the overlay's stop/cleanup function now calls `speechSynthesis.cancel()` so
  closing mid-prompt doesn't leave her talking after the screen is gone.
- **Timing tradeoff, stated plainly**: total loop time now runs longer than the original
  ~10–12s target — accepted in exchange for the script actually being understandable.
- Full verification pipeline re-run against the exact shipped `bundle.js`: ESLint no-undef sweep
  unchanged (11 pre-existing vendor errors, none new), jsdom harness full pass (618 checks) with
  0 runtime errors, end-state audit confirmed all six edits present.
- **Not yet verified on a real device** — jsdom can't play audio or exercise the `voiceschanged`
  timing path. Both the new script and whether the voice-picker fix actually improves what Rob
  heard on Android need his real-device pass.

## [3.63.1] — 2026-08-28

Smart Entry voice layer follow-up, from Rob's continued real-device testing of v3.63.0. See
`docs/DECISION-LOG.md` `PROD-17`'s Aug 28 amendment.

- **Fix: spoken confirm prompt was hard to understand.** Rob reported the TTS response ("Got N —
  say yes?") was muddy/unclear on real device. Root cause: `X(R,A)` (`site/app/bundle.js`, the
  `speechSynthesis` play function) built its `SpeechSynthesisUtterance` with no `rate` or `voice`
  set, so it played at whichever default the device happened to have — never a deliberate choice.
  Now sets `utterance.rate = 0.82` (slower) and prefers a clearer named en-US voice
  (Google US English / Samantha / Aria / Zira) from `speechSynthesis.getVoices()` when the browser
  has one loaded, falling back to any local en-US voice, then any en-US voice, then the device
  default.
- **Clarified for Rob, not a code change**: the spoken responses are fixed template strings (the
  confirm prompt, and the no-speech/permission/network/unsupported/declined error copy) with a
  count substituted in — not generative. Same as designed in v3.63.0's B2/B4, just not previously
  stated back explicitly.
- Full verification pipeline re-run against the exact shipped `bundle.js`: ESLint no-undef sweep
  unchanged (11 pre-existing vendor errors, same as baseline, none new), jsdom harness full pass
  including the voice-confirm path (0 runtime errors), end-state audit confirmed the edit present.
- **Not yet verified on a real device** — jsdom cannot play audio, so whether the slower rate/voice
  actually sounds clearer is unconfirmed. Needs Rob's real-device pass.

## [3.63.0] — 2026-08-28

Smart Entry Phase A, voice layer (`docs/CC-BRIEF-smart-entry-app-v3.62.0.md` section B). Built onto
v3.62.0's already-deployed, real-device-verified confirm card/interpretation/write path — nothing
new in any of those three; voice is purely a front end that drives the same pieces. See
`docs/DECISION-LOG.md` `PROD-17`.

- **New `VoiceEntryOverlay`**, opened by the Voice Tracker tile when `SpeechRecognition` is
  available (falls back to the existing v3.62.0 text sheet otherwise — never a dead tile, per B5).
  Loop: mic starts immediately on open (no opening prompt, per B2) → interim transcript streams
  live → recognition ends → `/api/interpret` (unchanged) → the confirm card renders **with values
  visible before any spoken prompt** → a short spoken prompt that never enumerates values ("Got
  3 — say yes?", under 2s, per B2) → listens for a yes/correction → confirmed writes go through the
  exact same shared write path as text and manual entry, tagged `source:"voice"`.
- **States**: `listening · thinking · proposing · confirmed · error`, each with distinct copy and a
  visible non-voice "Type instead" escape to the text sheet (mic permission denied, no speech
  detected, network failure, unsupported, declined, over cap — all separately worded).
- **Candidate disambiguation is tap-only** — never read aloud, matching `PROD-10`'s inventory
  safeguard exactly as it already works for text. Corrections (anything that isn't a yes/confirm)
  re-interpret the combined utterance and re-prompt, capped at 3 rounds, after which the card stays
  on screen for manual tap-edit rather than continuing to listen indefinitely.
- **Shared, not duplicated, per A4/B4's own instruction**: the `/api/interpret` fetch call was
  extracted into `callSmartEntryInterpret()` (one call site for both the text sheet and the voice
  overlay), and the confirm-to-write aggregation logic into `buildSmartEntryConfirmPayload()` (same
  reasoning — both channels build the identical payload shape, tagged with their own `channel`).
  The dispatcher that actually writes (`applySmartEntryConfirm`) now reads `payload.channel` instead
  of hardcoding `source:"smart"` — a one-line parameterization, not new write logic, since `source`
  was specced `manual|smart|voice` from the start and the hardcoded value was always an incomplete
  v3.62.0 implementation of that spec, not a deliberate scope boundary.
- **A real bug found and fixed before this shipped**: the voice loop's auto-confirm (triggered by a
  spoken "yes", not a tap) was silently writing nothing and never closing the overlay — a classic
  stale-closure-in-`useEffect` bug. The whole listen→interpret→propose→speak→relisten→confirm chain
  runs through callbacks that all trace back to one mount-time `useEffect`, whose closure captured
  `workingEntries`/`candidateGroups` as empty arrays from the initial render; later `setState` calls
  updated the real state (and correctly re-rendered the visible card) but never reached the stale
  callback chain still holding the original empty arrays. Fixed with mirror refs
  (`workingEntriesRef`/`candidateGroupsRef`) kept in sync alongside the state, which `doConfirm`
  reads instead. A tap on the card's own Confirm button was never affected — that path always reads
  the current render's closure directly. Caught by the harness's own coverage (a mocked
  `SpeechRecognition` proving the app's state machine, not Apple's real API — see below), not by
  code review; worth remembering as a real risk in this exact "long-lived effect chains a sequence
  of async callbacks" pattern.
- `tools/harness.js`: mocked-`SpeechRecognition` coverage for the full entries→confirm round trip
  (proves `source:"voice"` and `sourceText` land correctly, not just that nothing crashes) and the
  mic-permission-denied error path with its "Type instead" escape; confirmed the unsupported-device
  fallback opens the text sheet directly, never the voice overlay. Real device behavior (mic
  permission UX, actual speech recognition/synthesis, timing feel) is explicitly **not** testable in
  jsdom (B7) — this coverage proves the app's own logic is correct, not that Apple's API behaves as
  documented; that's real-device-only.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` (618
  harness checks, 0 runtime errors, 11-error vendor lint baseline unchanged). One unrelated
  pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0).
- **Not yet verified on a real device** — this entire feature is real-device-only to meaningfully
  test (mic permission flow, actual recognition accuracy, the mic-reopens-after-TTS behavior B1
  verified on iPhone/iOS 18.7 standalone PWA, whether the ~10-12s target timing feels right in
  practice). Needs Rob's real-device pass before wider use, same as v3.62.0 needed and got.

## [3.62.1] — 2026-08-28

Real-device fix, found by Rob on his first live test of Smart Entry (banana and grilled cheese both
interpreted correctly — the interpretation itself works): two visibility bugs in `SmartEntrySheet`.

- **Textarea text was invisible (white/clear on white).** `.wt-voice-text` never set its own
  `background`/`color` — I'd assumed it inherited from an existing dark-themed `textarea` rule, but
  that rule is actually scoped to `.wt-field textarea`, and this textarea isn't wrapped in
  `.wt-field`. It fell back to the browser's native white background with the light theme color
  inherited onto the text (`UX-17`'s global reset), making it unreadable while typing. Fixed with
  explicit `background:var(--bg); color:var(--ink-inverse)` on the rule itself. Also swapped its
  border from `var(--line)` (a legacy token scoped to `.wt-root`, which doesn't reach this portaled
  sheet — see `UX-11a`) to `var(--hairline-bright)` (installed globally, per `UX-12`/`UX-16`), which
  was likely invisible too for the same reason.
- **Close "×" button was white on white.** Used `className:"wt-sheet-close"`, a class with no CSS
  rule anywhere in the stylesheet — every other sheet in the app uses `wt-icon-btn` instead, which
  is properly styled. Switched to match.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 607 checks pass), lint unchanged at the 11-error vendor baseline.
- **Not yet re-verified on a real device** — Rob reported both bugs from his own real-device test;
  this fix has only gone through the jsdom pipeline so far, which has no layout engine and can't
  render actual color contrast. Needs Rob to re-check on the same device before considering it
  closed.

## [3.62.0] — 2026-08-28

Smart Entry Phase A, app side: confirm card, sheet internals, write path (`docs/CC-BRIEF-smart-entry-app-v3.62.0.md` sections A1–A6; text input only — voice is a separate future v3.63.0 pass, not attempted this session). The worker route (`PROD-15`) was already live; this ships the UI and write path that actually use it. See `docs/DECISION-LOG.md` `PROD-16`.

- **New `SmartEntrySheet` + `ConfirmCard` components**, replacing the Voice Tracker tile's non-functional preview shell (text field + disabled button, unchanged since v3.51.0). Tile artwork/placement/open-close behavior untouched, per the brief. Flow: describe what you had in plain text → `POST /api/interpret` → mandatory confirm card (`PROD-11`) → write. Handles all four response shapes (entries, declined, candidates, unmatched) plus a network-failure fallback.
- **Confirm card (A2, the safeguard `PROD-11` requires):** one editable row per entry (tracker, value, unit, source phrase always shown, low-confidence rows get a visible "Review" cue), any row removable before confirming, candidates render as a pick list with **nothing pre-selected** (`PROD-10`'s inventory safeguard), unmatched phrases shown plainly. Confirm is a separate deliberate action.
- **Properly portaled this time (`UX-11`).** The old preview shell rendered inline, not via `createPortal` — exactly the omission that caused the BackfillSheet/OO-modal bugs `UX-11a` exists to prevent. Fixed, with the portal root's tokens (`--surface-dark` #151A21, `--ink-inverse` #FFF6DB, `--hairline-bright` #5A7390, `--muted-dark` #9FB0C4) hardcoded inline the same way `BackfillSheet` already does, since portals render outside `.wt-root`'s scoped CSS variables.
- **Write path routes through the same functions manual entry uses — no parallel path (A4).** Extended `pe()` (the shared water/protein/calories writer) with an optional source param. For weight, sleep, exercise, treatments, prescriptions, and supplements — which had no shared function to route through, each sheet's write logic lived inline in that sheet's own `onSubmit` — extracted named functions (`writeWeightEntry`, `writeSleepEntry`, `writeExerciseEntry`, `writeRegimenEntry`) that both the original sheet and Smart Entry's confirm handler call, so inventory decrement (`PROD-07`/`PROD-08`) and reload/edit-routing behavior are guaranteed identical between a manual entry and a Smart-Entry-confirmed one, not just similar today.
- **New provenance fields, `source: "manual"|"smart"|"voice"` and `sourceText`,** on every log entry, added through the existing migration path — no hand-maintained field list. Existing entries read as `"manual"` by default. `sourceText` is the only way to diagnose a bad interpretation after the fact.
- **A real gap found and resolved by construction, not by trusting the model:** the shipped `/api/interpret` response schema has no field to identify *which* configured treatment/RX/supplement an "entries" row would refer to — only `candidates` carries an item reference. The app never lists `treatment`/`rx`/`supplement` in the request's `trackers` object, which makes the worker's own `enabledSet` filter guarantee those three trackers can only ever arrive via `candidates`, never a forced pick in `entries`, regardless of what the model returns.
- **Analytics migration proposed, not run:** `worker/migrations/schema-003-smart-entry-events.sql` (`smart_entry_events`, keyed by device_id/day/event) — `user_activity` has no room for per-event metrics (opened/proposed/confirmed/edited/abandoned/declined). Client-side event logging itself is out of scope this session (A5); the table is proposed ahead of it so it exists when that work starts.
- `tools/harness.js`: fixed a real test-environment gap found while writing this session's coverage — the harness never set `window.WATER_TRACKER_CONFIG`, so `apiBase` read empty and *every* fetch-based feature (not just Smart Entry) was silently short-circuiting before reaching the network layer; likely masked in every prior session's harness runs, not just this one. Added `mockInterpretFetch`/`disableFetch`/`setTextarea` helpers and full coverage for the entries, declined, candidates (including the "nothing pre-selected" safeguard), and network-failure paths.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness clean (0 runtime errors, 607 checks pass), lint unchanged at the 11-error vendor baseline. One unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0).
- **Not yet verified on a real device or against the live worker** — this session's harness tests use a mocked `fetch`, not the actual deployed `/api/interpret` route; jsdom also can't confirm the confirm card's real-device look/feel, portal z-index behavior, or touch-target sizing. Needs both a real end-to-end run against the live worker and a real-device pass before wider use.

## Worker: Smart Entry Phase A hardening, deployed — 2026-08-28 (no app version bump)

Worker-only session, `src/app.js`/`site/app/bundle.js` untouched — continues the Aug 27, 2026
worker-side Smart Entry build (see `docs/DECISION-LOG.md` `PROD-15`) with five prompt/hardening
fixes, all diagnosed and verified through live curl testing against the deployed route rather than
by theorizing:

- **Over-conservative estimation fixed.** The model was declining to estimate calorie/protein
  values for plainly-named foods ("grilled cheese," even "a banana") while water estimation worked
  fine for the same input. Added an explicit confidence rubric (high/medium/low, tied to how
  standard the portion is) and tightened the unmatched boundary so "grilled cheese" gets estimated
  but "I had lunch" still correctly lands in `unmatched`.
- **Multi-tracker entries per food.** The model was emitting one entry per food instead of one
  entry per applicable enabled tracker per food (grilled cheese with both calories and protein on
  was only producing a calories entry). Prompt now requires one entry per tracker, sharing the same
  `source` phrase.
- **Prompt-version-aware cache invalidation.** New `SMART_ENTRY_PROMPT_VERSION` constant (now `3`)
  is folded into the KV cache key, so any future prompt fix invalidates every previously-cached
  interpretation in one move instead of silently freezing testers on stale results for up to 30
  days.
- **`bypassCache` gated behind a Worker secret.** Was a plain client-suppliable flag on a public
  endpoint — any caller could have forced a paid model call and skipped the cache. Now only honored
  when a request header matches a new (optional, not yet provisioned) `SMART_ENTRY_DEBUG_SECRET`
  Worker secret; fails closed by default.
- **Candidates schema fix.** `"tracker"` was returning the matched item's name instead of the
  tracker type (`"rx"`/`"treatment"`/`"supplement"`); `"heard"` was returning the user's full
  sentence instead of just the fragment needing disambiguation. Both fixed, matching the schema
  Phase B's confirm card will branch on.
- Walked the daily-cap enforcement branch in code (`usage.calls >= SMART_ENTRY_DAILY_CAP`, checked
  before any Anthropic call is made — a blocked request costs nothing) rather than spending 25 real
  model calls to trigger it live; the over-cap path itself is therefore still unverified against a
  real request.
- **Deployed and live.** Rob ran `worker/migrations/schema-002-smart-entry.sql` against production
  D1 and `wrangler deploy`'d the Worker. `POST /api/interpret` is live at
  `water-tracker-push.bob-barrows.workers.dev`; estimation, declined, and candidates paths verified
  against the live route.

## [3.61.0] — 2026-08-27

Six quick tweaks from Rob's follow-up review of v3.60.0's partner configuration work, plus a real
bug fix.

- **Bugfix: My Day's Supplements tile was never connected.** `onOpenNewSupplementSheet` was never
  threaded through `RO` (My Day) → `MO` (the shared tile-grid component) — Log It!'s copy of `MO`
  had it wired, My Day's didn't, so the tile rendered but tapping it did nothing. Fixed by passing
  the same handler through both. New harness coverage added (this class of bug — a handler wired on
  one `MO` call site but not the other — wasn't previously tested).
- **Log It!'s 3 fast-entry tiles (Voice Tracker/Presets/Meal Entry) now stay locked to the grid's
  last 3 cells**, regardless of which trackers are toggled off on My Plan. Previously, toggling any
  tracker off shifted every tile after it up by one grid position — including the fast-entry tiles,
  which no longer stayed at the bottom the way Rob wanted. Toggled-off trackers now render an
  invisible placeholder cell (`.wt-tracker-col-compact-off`, sized to match a real tile but hidden
  and non-interactive) instead of being omitted, so the grid always has exactly 12 cells and the
  last 3 never move.
- **Weight's compact-tile ring now hugs the icon image edge-to-edge** — the image was rendering at
  94% of its box (a holdover from before the ring existed), leaving a visible gap between the image
  and the border. Bumped to 100%.
- **Header text changes**: My Day's "My Day's Summary for:" → "TODAY'S INTAKES"; the RX page's
  "SCRIPTS FOR:" → "RX FOR:".
- **My Plan section renames**: "My Treatments" → "My Health Providers" (since that section now
  holds both Treatment and Prescription partners, not just treatments); "Self-Managed Prescriptions
  & Supplements" → "My Current RX"; "Self-Managed Treatments" → "Treatments". Updated two in-form
  hint texts (on the Treatment and RX entry forms) that referenced the old section names by name.
- `tools/harness.js`: updated section-header/sheet-title assertions for the renames; new coverage
  for the Supplements-tile bugfix and the locked-fast-entry-tiles behavior (toggles Water off,
  confirms the grid still has 12 cells with Voice Tracker/Presets/Meal Entry unmoved in the last 3).
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. Two pre-existing,
  unrelated flakes noted (date-pill checks, a stale water-goal check), not caused by this pass.
- **Not yet verified on a real device** — the tightened Weight ring's visual fit and the locked
  fast-entry-tiles' placeholder-gap look are both things jsdom can't confirm.

## [3.60.0] — 2026-08-27

Phase 1 of the partner-configuration work scoped and greenlit this session: a real, device-local
partner data model, replacing the two non-functional placeholders that had been sitting on My Plan
since v3.49.0. `TRACK-01`'s own text had explicitly deferred this exact work to a future session —
this is that session.

- **New `settings.partners` array** — each partner is `{ id, name, type: "treatment"|"rx",
  logoDataUri, link }`. Treatment/Prescription items reference a partner by `partnerId` instead of
  carrying their own free-text provider/pharmacy name plus a per-item logo/link. Deliberately
  device-local only — no server-side/multi-tenant/clinic infrastructure, consistent with what the
  roadmap flags as unvalidated (clinic pilot validation hasn't happened yet).
- **One-time migration** (`SCHEMA_VERSION` 3→4): existing items with a `provider`/`pharmacy` value
  are promoted into real partner records on boot, deduped by name+type (not name+logo, so a user
  who'd only uploaded a logo on one of several same-clinic items still collapses to one partner
  record), with `partnerId` stamped back onto the item. Legacy `partnerLogoDataUri`/`partnerLink`
  fields are kept present but non-authoritative for one release cycle (`__prePartnerMigrationBackup`
  snapshot), mirroring `TRACK-01`'s own rollback-safety pattern.
- **The hardcoded "Austin Drip Lounge" demo card removed** — it was fully static (unconditional,
  two buttons with no `onClick` handlers at all) and never connected to real data. Replaced with a
  real partner list driven by `settings.partners`: each partner shows its referencing items, with
  working Edit and Delete. Deleting a partner clears `partnerId` on referencing items rather than
  cascade-deleting them or blocking the delete.
- **The "Add Partner" sheet wired up** — was an explicitly-commented placeholder ("fields for
  design review only, no data model wired") with 5 unbound fields. Scoped down to the 4 fields that
  are actually partner-level data: Name, Type, Logo, Link. The other 3 (protocol code, session
  count, next appointment date) were dropped — protocol code is a distinct, separately-sequenced
  roadmap item (clinic-issued onboarding codes, implies server-side clinic distribution, bigger
  than what this session scoped in); session count and appointment date are already per-item
  concerns handled by each Treatment/RX item's own inventory/due-date fields, not partner-level.
- **Treatment/RX entry forms**: the free-text provider/pharmacy field is replaced by a partner
  picker (existing partners of the matching type, or "No partner" to keep today's self-managed
  behavior — the default, since most items today have no provider/pharmacy set at all). The
  per-item logo/link upload block is removed from these forms entirely — that data now lives once
  on the partner record, entered via My Plan's Add Partner sheet. **This is a real behavior
  change**, not incidental: uploading a partner logo now happens once per partner, not once per
  item.
- `RxPage`'s partner-branded card rendering now resolves through `partnerId → settings.partners`
  first, falling back to an item's own legacy fields only if no `partnerId` is set (a safety net,
  not the common path — migration stamps `partnerId` onto everything that had a name at boot).
- `tools/harness.js`: seed data left deliberately without a pre-set `partners` key (that absence
  is literally what triggers the migration path — see the in-file GOTCHA comment) while two
  existing seed items (`SeedRx`/`SeedTreatment`, already used for an earlier reload-persistence
  regression test) double as the migration-promotion test fixture. New coverage: promotion creates
  real partner records with `partnerId` stamped back on the items; the old demo card's content is
  gone; the real partner list renders; the Add Partner flow persists a new record; deleting a
  partner clears `partnerId` without deleting the item. One test-ordering bug caught and fixed
  during this session (not shipped): an early delete-partner test was destroying the migration
  fixture a later assertion depended on — reordered so promotion checks run before the delete test
  that exercises the same partner record.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. Two pre-existing,
  unrelated flakes noted and confirmed present on the untouched v3.59.0 bundle too (a stale
  `wt-tile-togo` water-goal check documented since v3.44.0, and a set of date-pill checks whose
  root cause wasn't investigated further this session — flagged, not fixed, since they predate this
  work).
- **Not yet verified on a real device** — the partner picker's UX in the entry forms, the partner
  list's visual read on My Plan, and whether losing the per-item logo-upload flow (in favor of
  per-partner) feels right in practice.
- **Explicitly out of scope this pass** (Phase 2/3, scoped but not built — see
  `docs/DECISION-LOG.md`): Stats-page content for Treatments/Prescriptions/Supplements (adherence
  over time, inventory/expiration timeline, per-partner breakdown).

## [3.59.0] — 2026-08-27

Rob's real-device feedback after v3.58.0, plus a Log It! tile reorder and a new Weight completion
indicator:

- **"RX" nav-tab label restored** (was briefly "Prescriptions" in v3.58.0). Rob's clarification:
  "RX" is the umbrella term for all three trackers it groups — Treatments (partner-managed via
  DripBar-style providers), Prescriptions (partner-managed via pharmacies/doctors/insurers, to
  promote medication adherence), and Supplements (fully self-managed). The individual
  "Prescriptions" tracker keeps its own label everywhere else (Log It!, My Plan, the entry sheet,
  Today/My Day) — only the nav tab, which represents the RX page's all-three-sections umbrella
  view, reverted.
- **"Today" renamed "My Day"** everywhere it's a page/section label: the nav tab, "My Day at a
  Glance" (was "Today at a Glance"), "My Day's log" (was "Today's log"), and the header context
  label ("My Day's Summary for:", was "Today's Summary for:"). Generic calendar-day words like
  "due today"/"taken today"/the date pill's TODAY badge are unrelated and untouched — those refer
  to the day, not the page.
- **Log It! and My Day swapped nav positions** — My Day is now the first tab, Log It! second. This
  is the same swap v3.42.0 tried and v3.42.1 reverted the same day; Rob explicitly re-requested it
  now, so it's not a regression of that revert, it's a new decision superseding it. App still boots
  on Log It! by default (that wasn't part of this request).
- **Log It!'s compact grid reordered**: Voice Tracker/Presets/Meal Entry moved from the first 3
  tiles to the last 3 — Water/Protein/Calories/Sleep/Weight/Exercise/Treatments/Prescriptions/
  Supplements now lead, the three broader fast-entry tiles trail. Pure reorder, no tiles
  added/removed.
- **Weight's compact tile gains a completion ring.** Previously ring-less (a deliberate v3.51.0
  design choice — "a ring implies progress that doesn't exist for a reading"); Rob asked for a
  ring that lights up when a weight is logged today, matching Supplements' glow-on-completion
  treatment, adapted to a rounded-square shape since Weight's icon is square rather than circular.
  The existing checkmark badge stays alongside it per Rob's explicit call. Implemented as a CSS
  border+box-shadow toggle (`.wt-gauge-imageonly-lit`) rather than new SVG ring geometry — `lO`'s
  existing ring component is circular by construction and wasn't a fit for a square icon.
- **RX page's "Vitamins & Supplements" section renamed "Supplements"** for consistency with the
  label used everywhere else in the app (Log It!, My Plan, My Day, entry sheets).
- `tools/harness.js`: every `nav("Today")` call updated to `nav("My Day")`; the two `nav("RX")`
  calls that had become `nav("Prescriptions")` in v3.58.0 reverted; nav-order check updated for the
  swap (explicitly noting this supersedes the v3.42.1 revert, not regresses it); Log It! grid-order
  checks updated for the new tile order; new test coverage for the Weight completion ring (confirm
  unlit before logging, lit after, checkmark badge still present).
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. One pre-existing,
  unrelated stale check still fails (`wt-tile-togo`, documented since v3.44.0).
- **Not yet verified on a real device** — the nav swap's feel with real usage, the grid reorder's
  effect on daily habit/muscle-memory, and the new square completion ring's visual proportions
  next to Weight's existing checkmark badge are all things jsdom can't confirm.

## [3.58.0] — 2026-08-27

Continues the Prescriptions/Supplements separation started by `TRACK-01` (v3.52.0): Today's tile
split into two independent tiles, and "RX" relabeled "Prescriptions" everywhere it's a user-facing
label, so the three trackers read consistently as **Treatments / Prescriptions / Supplements**
across every page.

- **Today's combined "RX & Supplements" tile split into two independent tiles.** `computeTrackerStats()`
  already returned fully independent fields for both trackers (from TRACK-01) — Today's full-detail
  grid just hadn't been updated to use them yet. The old block was an IIFE that locally summed the
  two trackers into combined values; both new tiles use their already-computed fields directly, no
  local derivation needed. New "Supplements" tile reuses the same ring/icon combination already
  established elsewhere in the app (`newSupO`'s `--supplements` ring color, `Pill` chip icon with
  `--supplements`/`--supplements-chip`) — no new design decision required. Tile order: Treatments,
  Prescriptions, Supplements, matching Log It!'s existing compact-grid order.
- **"Tracked So Far" alert row split** the same way — the combined due-count callout is now two
  independent rows (Prescriptions due, Supplements due).
- **"RX" relabeled "Prescriptions" everywhere else it appeared as a user-facing label**: Log It!'s
  compact grid tile, My Plan's "What I'm Tracking" row and its own RX entry sheet, the bottom-nav
  tab (6th tab, icon unchanged), the RX entry sheet opened from Log It!, and the Backfill sheet's
  disclaimer text. Internal identifiers (`settings.rx`, `type:"rx"`, `showRx`, route key `"rx"`,
  CSS class hooks like `"meds"`) are unchanged — this is a label rename only, not a data-model
  change, so none of the new-entry-type/new-field checklists applied.
- **My Plan's "Self-Managed RX" section header renamed "Self-Managed Prescriptions & Supplements"**
  — not "Self-Managed Prescriptions" as originally planned, since that section actually wraps both
  the Supplements and Prescriptions regimen cards, and "Prescriptions" alone would have been
  inaccurate. Caught by reading the section's actual contents before applying the rename.
  The RX page itself (`RxPage`, 3rd bottom-nav tab) was not touched — it already correctly said
  "Treatments"/"Prescriptions"/"Vitamins & Supplements" from TRACK-01.
- `tools/harness.js`: extensive updates — every existing "RX"/"RX & Supplements" assertion updated
  to expect "Prescriptions" (roughly a dozen call sites across Today, Log It!, My Plan, the RX
  entry sheet, and the bottom nav); tile-count checks bumped 8→9 everywhere Today's/Log It!'s full
  tracker set is asserted; new regression check added that seeds different due-counts for
  Prescriptions vs. Supplements and confirms the two tiles show different, non-summed numbers (the
  actual bug class this whole change guards against — a naive incomplete split could still show
  correct labels while silently leaving stale combined math underneath).
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. One pre-existing,
  unrelated stale check still fails (`wt-tile-togo`, documented since v3.44.0).
- **Not yet verified on a real device**: Today's new two-tile layout (does it reflow sanely with
  one more tile than before), and specifically flagged by Rob before this shipped — the bottom-nav
  row's fit with "Prescriptions" (9 characters longer than "RX") in an already-tight 6-tab, 420px-
  max-width layout. May need a font-size tweak in a fast follow-up if it doesn't fit well.
- Explicitly out of scope this pass (per Rob, future session): partner configuration for
  Treatments/Prescriptions (DripBar-style / pharmacy), and any Stats-page additions for these three
  trackers (Stats currently has zero RX/Supplements/Treatments content).

## [3.57.0] — 2026-08-27

Log It! merges the 3-item top row (Voice Tracker/Presets/Meal Entry) into the tracker grid itself,
so the page now reads as one unified grid instead of a row-plus-grid split.

- **Divider removed, top row merged into the grid.** Rob's real-device feedback: "remove the line
  divider you have between the top 3 tiles and the bottom 3x3 tiles and move the 3x3 up a little to
  close the space... four down three across all evenly spaced out." The standalone `TopRow`/
  `TopRowItem` components (and the `.wt-toprow` hairline-divider CSS they rendered inside) are gone
  — Voice Tracker, Presets, and Meal Entry are now the first 3 tiles of the same
  `.wt-trackers-grid-compact` grid the trackers render into, using the same `compactTile()` helper
  and a new plain-image variant (`.wt-tile-plain-img`, 102×102, same size as the tracker rings/
  images) in place of a ring. With all trackers enabled this is a true 4-row × 3-column, evenly
  spaced grid (12 tiles); the old 2-column fallback for ≤4 enabled trackers was dropped since the
  top row's 3 fixed items mean the grid is never that sparse anymore.
- Grid CSS simplified: uniform `8px` gap (was `8px 6px`), top margin removed (`4px` → `0`) so the
  grid sits directly under the date pill with no extra seam where the divider used to be.
- **Presets, Meal Entry, and Weight icon artwork replaced.** Rob sent the three replacements one at
  a time this session, each confirmed clean before use (real PNG, real alpha transparency, corner
  alpha 0, no checkerboard/JPEG-recompression artifact — none of this round needed the chroma-key/
  checkerboard scripts earlier rounds required). Each cropped to its content bounding box, padded to
  a square canvas, and resized to the same 480×480 final size the other tile icons use, then
  visually inspected before shipping. New files (cache-busted, matching this repo's established
  practice): `presets-v3.png`, `meal-entry-v3.png`, `weight-v2.png` — old `presets-v2.png`,
  `meal-entry-v2.png`, `weight.png` removed. Weight's new artwork is used in both its Log It!
  ring-less compact tile and its Today/full-detail ring rendering, so the tracker looks consistent
  across both pages.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. `tools/harness.js`
  rewritten for the merged structure: tile-count checks bumped (7→10 at boot, 9→12 with all
  trackers on), new checks assert no `.wt-toprow` remains and that Voice Tracker/Presets/Meal Entry
  are the grid's first 3 tiles in document order. One pre-existing, unrelated failure noted and
  confirmed present on the untouched v3.56.0 bundle too (a stale "32oz to go" assertion on the
  full-size, non-compact water tile) — not touched by this change, not a regression.
- **Not yet verified visually on a real device** — jsdom has no layout engine, so the "evenly
  spaced 4×3 grid" outcome itself (spacing, alignment, whether it actually reads as one grid) needs
  Rob's eyes.

## [3.56.0] — 2026-08-27

Correction: v3.54.0/v3.55.0's Voice Tracker fix diagnosed the wrong problem. Rob's report of a
stale image wasn't a caching issue — it was this session using an outdated *source* image (the
version with "LISTEN · TAKE VOICE ENTRIES · AGENTIC AI" text arced across the top) instead of the
text-removed version Rob had already sent. The v3.55.0 cache-busting rename was real but
unnecessary work chasing the wrong cause; the actual fix needed was using the right source file.

- **Voice Tracker icon replaced with the correct, text-free artwork.** Rob's latest upload was
  still a JPEG (no real alpha channel) with the same baked-in transparency-preview checkerboard
  seen in earlier rounds — but unlike a solid-color background, a checkerboard has two alternating
  flat tones, so the general chroma-key approach from `UX-36` wouldn't isolate it correctly. Wrote
  a second, checkerboard-specific script (`jpeg-js` to decode, since `pngjs` can't read JPEGs):
  detects near-neutral-gray pixels matching either checker tone (~205 and ~255, sampled directly
  off this file), clears a thin fringe of adjacent gray pixels to avoid a faint halo at the
  boundary, then reuses the same crop/pad/resize pipeline from `UX-36` (480×480, matching the
  other two top-row icons). Result inspected directly this time (not just alpha-checked) — a clean
  circular badge, text gone, background genuinely transparent.
- File renamed again (`voice-tracker-v2.png` → `voice-tracker-v3.png`) — both because the content
  actually changed and to keep the established cache-busting practice from `UX-37`.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 519 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0). **Not
  yet verified on a real device.**

## [3.55.0] — 2026-08-27

Two follow-ups from Rob's v3.54.0 review: the Voice Tracker icon was still showing its old
white-background image, and the top-row icons/labels needed to match the 3×3 grid's new size.

- **Cache-busted all three top-row icon files** (`voice-tracker.png`/`presets.png`/`meal-entry.png`
  → `voice-tracker-v2.png`/`presets-v2.png`/`meal-entry-v2.png`). The actual committed file for
  Voice Tracker was already the fixed, transparent v3.54.0 version (re-verified: corner alpha 0,
  center alpha 255) — the stale white background Rob saw was a cached copy of the old file, not a
  code bug. Renaming forces every client to fetch fresh regardless of any cache layer (the app's
  own `_headers` no-cache rule covers `/app/*`, but that only controls browser caching — a CDN edge
  cache in front of it is outside this repo's control and isn't guaranteed to respect that rule for
  static assets). All three were renamed, not just Voice Tracker, so the same staleness can't recur
  for Presets or Meal Entry later even though only Voice Tracker was reported this time.
- **Top-row icon boxes and labels now match the 3×3 grid exactly** — `102px` fixed (was a responsive
  `min(19vw, 10.5vh, 96px)`) and `16.5px` labels (was `13.5px`), same values as the grid's default
  3-column state, per Rob's explicit request that they read as the same size.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 519 checks pass — unchanged from v3.54.0, no new checks needed since
  this is a filename/sizing-only change), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0). **Not
  yet verified on a real device** — need Rob to confirm both the fresh Voice Tracker image loads
  and the new top-row sizing reads correctly.

## [3.54.0] — 2026-08-27

Real-device review round 2: the top-row icon backgrounds are finally fixed (programmatically,
after three rounds of manual image exports all came back unusable), the 3×3 grid got bigger again,
and the header layout changed per Rob's request.

- **Top-row icon backgrounds actually fixed.** Rather than wait on a fourth manual export attempt,
  wrote a one-off Node script (`pngjs`, no native deps) that: samples each image's background color
  from its corners, chroma-keys near-background pixels to transparent with a soft edge falloff (to
  avoid a hard jagged cutout), crops to the surviving content's bounding box, pads to a square
  transparent canvas, and bilinear-resizes all three to an identical 480×480 — so they render at
  the same visual size and stay level with each other inside equal `object-fit:contain` boxes
  regardless of each source image's original aspect ratio. Verified programmatically (corner alpha
  = 0, center alpha = 255 on all three) since this can't be eyeballed through this tool. Replaces
  `site/app/tile-icons/voice-tracker.png`/`presets.png`/`meal-entry.png` in place — same filenames,
  no further code change. Still needs Rob's eyes on the actual edge quality (chroma-keying is
  best-effort, not a guaranteed-clean cutout the way a real designed transparent export would be).
- **3×3 grid: bigger again, tighter spacing.** Icons 84px → 102px (3-column default), 100px → 122px
  (2-column fallback); labels 14.5px/15.5px → 16.5px/17.5px. Freed the room by tightening tile
  padding (12px→4px vertical) and the grid's own gap (16px/12px → 8px/6px) and top/bottom margin
  (8px/16px → 4px/12px), per Rob's explicit "reduce the black space to keep them closer together."
- **Header rearranged**: the brand (logo + "HydroPro Tracker" title) moved from a centered cluster
  to the far left edge; the profile icon moved from the left (previously nudged in tight against
  the brand with a `-14px` margin hack) to the far right edge. `.wt-topbanner-inner` switched from
  `justify-content:center` to `space-between` with the brand and profile as its two flex children
  (badge+title now wrapped in a new `.wt-topbanner-brand` group so they move as one unit rather
  than spreading apart under `space-between`).
- `tools/harness.js`: new coverage for the header reorder (brand exists, profile now follows it in
  DOM order, `justify-content:space-between` confirmed).
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 519 checks pass, up from 516), lint unchanged at the 11-error vendor
  baseline. One unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since
  v3.44.0). **Not yet verified on a real device** — icon edge quality, grid legibility at the new
  size, and the header's new left/right balance all need Rob's eyes.

## [3.53.0] — 2026-08-27

Real-device review round 1 of the Log It! redesign — Rob found three problems that made the page
"look terrible" and hard to use; this pass fixes what's fixable from code, and flags what still
needs real assets from Rob.

- **Date pill: fixed a genuine logic bug, not just a device-only issue.** The pill's
  `offsetDays` calculation had the subtraction backwards since it was first written (Track 1) —
  picking "yesterday" always showed the "PAST DAY" badge instead of "YESTERDAY," because
  `today - selectedDate` is positive for a past date, not negative, and the badge logic checked
  for `-1`. Caught by a new harness test written for this fix, not by the original build. Also:
  - **Centered on screen** — the date pill wasn't centering because `.wt-header`'s
    `justify-content:space-between` only works with two children (a back button + the date); Log
    It! never renders the back button, so the pill was left flush against the left edge. Fixed
    with a scoped `:only-child` rule that can't affect the Profile page's back-button layout.
  - **Chevron arrows replaced with a native calendar picker** — the two 28×28px chevron buttons
    (a poor touch target, and no way to jump to a specific day) are gone. The whole pill is now a
    single tap target (`min-height:var(--touch)`, the app's own 48px touch-target standard)
    overlaying a native `<input type="date">` — reusing the exact pattern already used in 6+ other
    places in this codebase (`BackfillSheet`, the RX/treatment expiration fields), so this opens
    the OS/browser's own calendar UI rather than a custom-built widget. `max` still caps it at
    today, keeping the existing "never allow a future date" rule.
- **Top row (Voice Tracker/Presets/Meal Entry): shrunk and its spacing trimmed.** Icon box size
  `min(28.5vw, 15vh, 144px)` → `min(19vw, 10.5vh, 96px)` (roughly a third smaller — was
  legitimately oversized for a 3-up row). Row padding/margin trimmed to free vertical space for the
  grid below, per Rob's own request.
- **3×3 grid: icons and labels made meaningfully bigger**, using the space freed above — ring/icon
  64px → 84px (default 3-column state), 88px → 100px (2-column fallback at ≤4 trackers); tracker
  label 12px → 14.5px (15.5px in the 2-column state, which previously didn't scale with the ring
  at all).
- **Top-row icon artwork is still unresolved — not a code problem.** Rob sent three separate
  rounds of replacement PNGs for Voice Tracker/Presets/Meal Entry (the "white square background"
  complaint). None were usable: round 1 arrived with an opaque background baked in; round 2's
  Presets image arrived as a JPEG (JPEGs can't have transparency); round 3 — resent explicitly as
  "transparent and as png" — still arrived as JPEGs for all three, each with a **checkerboard
  pattern baked into the pixels themselves** (the gray/white grid an editor shows to *indicate*
  transparency in its own preview, apparently captured as a flattened screenshot rather than an
  actual PNG export). Using any of these as-is would look worse than the current white-background
  icons, so all three keep their existing files this release. Needs Rob to export/save the actual
  PNG file directly from whatever tool generated it, not a screenshot of its transparent-preview
  thumbnail.
- `tools/harness.js`: new dedicated `DatePill` coverage (this is what caught the offset-days bug)
  — asserts the pill renders with a native date input defaulting to today and capped there, that
  picking a prior day updates the badge/styling/subtitle correctly, and that no chevron buttons
  remain.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 516 checks pass, up from 503 — net new `DatePill` coverage), lint
  unchanged at the 11-error vendor baseline. One unrelated pre-existing stale check still fails
  (`wt-tile-togo`, documented since v3.44.0). **Not yet verified on a real device** — every part of
  this fix (centering, sizing, spacing, the native picker's actual on-screen appearance) is
  fundamentally visual/interactive and jsdom cannot confirm any of it.

## [3.52.0] — 2026-08-27

Track 2 of Rob's Log It! redesign brief: **RX and Supplements split into two fully independent
trackers**, each with its own data array, toggle, log-entry type, and entry sheet. Previously "RX &
Supplements" was one combined tracker (`settings.supplements`) with items tagged
`category: 'vitamin' | 'rx'`.

- **Data model split, locked with Rob before writing the migration:** all pre-existing combined
  items — both former `'vitamin'`- and `'rx'`-tagged — seed the retained **RX** tracker
  (`settings.rx`, new array key), since no real RX usage existed yet in testing and Rob chose the
  clean long-term shape over a lower-risk shortcut. The **Supplements** tracker
  (`settings.supplements`, same key, retargeted) starts genuinely empty. `SCHEMA_VERSION` bumped to
  3; the split runs once, inside `migrateSettingsShape()`, and is idempotent (checked via presence
  of `settings.rx`, not just the version number so a partial/interrupted migration can't double-run).
  A temporary `settings.__preMigrationSupplementsBackup` snapshot of the original combined array is
  kept for one release cycle as a rollback path.
- **Genuine new `"rx"` log-entry type** (not a shared `"supplement"` type with a tag) — full
  CLAUDE.md new-entry-type treatment applied: added to the reload normalizer's pass-through list,
  its own undo-on-delete branch, its own backfill path (both in `saveBackfill()` and a new "RX"
  section in the "Enter Missed Items" sheet, alongside the existing "Supplements" section), its own
  edit-on-tap routing from Today's log list, and its own entry sheet (reusing the existing
  tap-to-select-item chip UI, wired to two independent data paths).
- **Log It!'s grid**: the combined "RX & Supplements" tile is now two tiles, "RX" (keeps the
  existing icon/color, all migrated history) and "Supplements" (new icon Rob supplied
  — `supplements-new.png` — new lime-green `--supplements` token, starts with no items).
- **Today stays visually unchanged** (explicit scope boundary) but its combined "RX & Supplements"
  tile and "Today at a Glance" due-count callout now correctly sum both trackers' data again —
  without this fix, Today would have silently shown RX-only numbers under a label that still says
  "RX & Supplements," which would have been a real regression hiding behind an unchanged UI.
- **My Plan**, the one page besides Log It! this session touches: the "What I'm Tracking" toggle
  list splits its combined row into independent "RX" and "Supplements" rows/toggles
  (`showRx` new key, `showSupplements` repurposed to mean Supplements-only going forward); the
  existing "Self-Managed RX" section's two cards now read straight from the two arrays (no more
  `category` filtering) and the "Vitamins & Supplements" card is relabeled "Supplements" for
  consistency.
- **RX page** ("SCRIPTS FOR:"), **Stats' Health Summary adherence report**, and the **CSV export**
  all updated to read from the new arrays/type — verified via the harness rather than assumed, since
  each had its own `category`-filtering or `type`-checking logic that would otherwise have silently
  dropped RX or Supplements data.
- `tools/harness.js`: extensive updates for the new shape — seed data's pre-migration items now
  assert they land in RX (not "default to vitamin"), new add/edit/delete coverage for both trackers
  independently, tile/card counts updated across Log It! and My Plan, backfill coverage extended to
  assert RX-specific inventory decrement/restore and undo, reload-persistence checks (`SeedRx`)
  updated to look up `settings.rx` instead of a `category` field that no longer exists.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 503 checks pass, up from 498 in v3.51.0 — net new coverage for the
  split), lint unchanged at the 11-error vendor baseline. One unrelated pre-existing stale check
  still fails (`wt-tile-togo`, documented since v3.44.0). **Not yet verified on a real device** —
  jsdom can't confirm the new Supplements tile/icon's visual read next to RX, or the My Plan toggle
  list's new row.
- **Known, accepted limitation of the clean-build choice:** historical log entries created before
  this migration remain tagged `type: "supplement"` regardless of which item they referenced: since
  RX only gained a distinct `type: "rx"` going forward, a pre-migration dose of what is now an RX
  item won't retroactively count toward RX's "taken today" state if backfilled onto today's date.
  Accepted as low-risk given the trial data this replaces.

## [3.51.0] — 2026-08-26

Log It! rebuilt per Rob's detailed brief (Track 1 of 2 — RX/Supplements split is Track 2, staged
separately): interactive date pill for prior-day logging, a bare-artwork top row replacing the old
banner tiles, a borderless 3×3 grid, a redesigned progress ring, and quick-add chips across every
entry sheet.

- **Date pill (`DatePill`)** replaces the static "Tracking for: <date>" text on Log It! only (every
  other tab's header text is unchanged). `‹ Wed, Aug 26 [TODAY] ›`, left/right chevrons step one day
  at a time, right chevron disabled at today, badge reads `TODAY`/`YESTERDAY`/`PAST DAY`. New
  `logDate` state (app-shell root, resets to today on cold start — no persistence) is the source of
  truth for what day Log It! is viewing; it is separate from and does not replace Stats' own
  prior-day/backfill picker, which is untouched.
  - **Past-day mode:** pill turns amber, a subtitle reads "Everything you log goes to this day",
    every entry sheet opened from Log It! shows an amber `Saving to <date>` bar under its header, and
    confirmation toasts append `· <date>`. New `entryTargetDate` state carries the selected day into
    every log-write path (quick dial, weight, supplements/RX, treatments, exercise, sleep, manual
    meal, presets) — all previously hardcoded to `HS(new Date)`. Sheets opened from Today
    continue to target today regardless of Log It!'s selected day (shared submit handlers, explicitly
    reset per open-handler).
- **Top row replaces the Voice Entry/Use Presets banners** — three bare-artwork items (`TopRow`):
  Voice Tracker, Presets, Meal Entry, using the images Rob supplied. Tapping Meal Entry opens the
  same `ManualMealSheet` the removed "Meals" grid tile used to open; Presets opens the existing
  presets sheet; Voice Tracker opens a new lightweight preview sheet (text field next to a decorative
  mic icon) — **UI shell only, no parser wired up, never auto-logs** — Smart Entry Phase 1 is still
  out of scope.
- **3×3 grid is now borderless** — tile borders/backgrounds removed (transparent at rest, subtle
  surface wash on press). Meals tile removed from the grid (moved to the top row); grid is back to
  one tile per tracker. Falls back to 2 columns when ≤4 trackers are enabled.
- **Progress ring redesign, Log It!-only** — Today's full-detail ring rendering is byte-for-byte
  unchanged (verified via a dedicated `compact` flag on the shared ring component, defaulting off).
  On Log It!: a real neutral track ring (`#2a303a`, 5px) now sits under the fill (5.5px, was one
  ring doing double duty as its own dimmed track); goal-met state clamps at 100%, squares off the
  cap, adds a glow, and swaps the end-cap dot for a small check badge. Weight (a reading, not an
  accumulation) now renders artwork + label only, no ring — with the same check badge when a reading
  exists for the viewed day.
- **Quick-add chips** added above the manual field in every accumulating-tracker sheet: Water
  (+8/12/16/24oz), Protein (+15/25/30/40g), Calories (+150/300/500/650), Sleep (+6/7/7.5/8hrs, sets
  Woke Up from the current Lights Out time), Exercise (+15/20/30/45min). Treatments/RX &
  Supplements already had a tap-to-select chip pattern per item, kept as-is. Primary buttons relabel
  to "Add to <tracker>" (or "Save weight" for Weight, "Log meal" for the meal sheet).
- New image assets: `site/app/tile-icons/voice-tracker.png`, `presets.png`, `meal-entry.png` (all
  supplied by Rob). A `supplements-new.png` was also saved from a follow-up upload, staged for
  Track 2 — not wired into anything yet.
- **Found and fixed in passing:** the in-app "Version" string shown on Settings (and sent as
  `appVersion` in feedback submissions) had been stuck at "3.39.1" since that release — every version
  bump since then updated `CHANGELOG.md`/docs but missed this literal. Now reads 3.51.0 and will be
  bumped going forward with every release.
- `tools/harness.js` updated for the new structure: tile-count expectations (8, not 9 — Meals moved
  out), the presets/meal-entry triggers now click the top-row items by their new labels instead of
  the removed banner text, and the water quick-dial submit-button assertion updated for its new
  "Add to Water" label.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 498 checks pass, matching the v3.50.0 baseline count), lint unchanged at
  the 11-error vendor baseline. One unrelated pre-existing stale check still fails (`wt-tile-togo`,
  documented since v3.44.0). **Not yet verified on a real device** — jsdom has no layout engine, so
  the 3×3 grid's on-device fit, the ring's visual proportions, and the top-row art's crop/scale all
  need Rob's eyes. The `100dvh`/flex sizing pass from the brief (fit one screen, no scroll) is
  implemented in CSS but is unverified for the same reason — if it scrolls on a real phone, the
  brief's own tuning note applies (lower the `vh` term in the art-sizing `min()`, not the `vw` term).
- **Track 2 (RX/Supplements split into two independent trackers) is a separate, not-yet-built pass**
  — Log It!'s RX & Supplements tile is still the single combined tracker for this release.

## [3.50.0] — 2026-08-25

Log It! becomes pure fast-entry: compact 3x3 tile grid, new "Meals" tile, restyled Presets tile,
per Rob's direction — now that Today and the RX page both show full tracked-metric detail, Log
It!'s tiles duplicating that same detail was redundant:

- **Log It!'s 8 tracker tiles are now compact** — icon/progress-ring + tracker name only, no
  goal/logged text, no hero number, no low-supply/near-expiry alert row. Arranged in a 3x3 grid:
  Water/Protein/Calories, Sleep/Weight/Exercise, Treatments/RX & Supplements/**Meals** (9th tile).
  **Today's duplicated tile grid is unaffected** — it still shows the full detail (goal, logged,
  hero number, alerts) exactly as before; only Log It! changed. `MO` (the shared tile-grid
  component) gained a `compact` prop for this — Today's call site never sets it, so its rendering
  path is untouched code.
- **New "Meals" tile** absorbs "Manually Log a Meal" — tapping it opens the same
  `ManualMealSheet`, unchanged. Its ring is a hand-built placeholder (a static circle, not tied to
  a real percentage — "isn't connected for now" per Rob's request) with a `Utensils` icon in
  Protein green (`var(--protein)`/`var(--protein-chip)`, reusing the existing token rather than
  adding a new one). **Flagged to Rob:** the other 8 tiles each use a real illustrated PNG "gem"
  image; Meals doesn't have one yet, so this is a vector-icon placeholder, the same
  placeholder-now/real-asset-later path the Voice tile itself took in v3.40.0/v3.40.1.
- **"Use Your Presets" removed as a button, reborn as a "Use Presets" tile** below the 3x3 grid,
  full-width, matching the layout of the tile at the top (icon chip, title, subtitle, circular
  badge) but keeping its own blue/water-colored treatment rather than gold. "Manually Log a Meal"
  as a button is gone entirely (see Meals tile above).
- **Top tile renamed "Voice Assistant" → "Voice Entry"** (display text and `aria-label` only, no
  behavior change — still a non-functional design preview). Generalized the tile's component into
  a shared `FeatureTile` (gold variant for Voice Entry, blue variant for Use Presets) so both
  full-width tiles share one implementation instead of two near-duplicates.
- `tools/harness.js`: the `tiles()` helper now matches both the full-detail (`.wt-tracker-col`,
  Today) and compact (`.wt-tracker-col-compact`, Log It!) tile classes, so existing "does tile X
  appear" checks keep working on whichever page they run on. Checks that inspect full-detail-only
  markup (chip/goal/logged/hero-number/ring-fill-percentage) were redirected to run against Today
  instead of Log It!, since that's where this now-shared, otherwise-unchanged code path lives;
  checks specific to Log It!'s own content (Voice Entry tile, the Meals/Use Presets triggers) were
  updated for the new structure.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 498 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo`/ring-percentage water-tile
  assertion, documented since v3.44.0). **Not yet verified on a real device** — jsdom can't confirm
  the 3x3 grid's actual sizing/spacing on a phone screen, the Meals placeholder ring's look, or
  whether the Use Presets tile reads clearly against Voice Entry's gold treatment.

## [3.49.0] — 2026-08-25

New "RX" nav page consolidating everything a user is subscribed to or prescribed, per Rob's
direction — plus a data-loss bug fix found while building it:

- **New "RX" bottom-nav tab** (icon `Pill`), positioned Log It! → Today → **RX** → Stats → My Plan
  → Settings. Titled **"SCRIPTS FOR: {today's date}"**, following the same title-plus-date pattern
  every other tab already uses.
- **Three sections** — **Treatments**, **Prescriptions**, **Vitamins & Supplements** — reusing the
  `category` field split introduced in v3.45.0. Unlike the Today section it replaces, each section
  lists **every** item of that type, not only inventory-tracked ones; qty remaining, expiry,
  refills, and the low-supply/near-expiry alert still show inline only when inventory tracking is
  on for that item.
- **"Remaining RX/Treatments" removed from Today entirely** (v3.46.0/v3.47.0) — its content moves
  to and expands into the new RX page. Today's order is now "Today at a Glance" → the duplicated
  8-tile grid (v3.48.0) → "Today's log".
- **Partner-branded cards, per Rob's explicit request to help promote partners:** two new optional
  fields, "Partner logo" (image upload) and "Partner link" (URL), added to the My Plan add/edit
  forms for Treatments (next to "Ordered from / provider") and RX-category prescriptions (next to
  "Pharmacy / where filled") — shown once that name field is filled in. Not offered on Vitamins &
  Supplements, which have no organizational "filled by" field. When both a provider/pharmacy name
  and a logo are set, the RX page renders that item as a partner card (reusing the existing
  clinic-card styling from the Austin Drip Lounge demo on My Plan) with the logo and an outbound
  link; otherwise it falls back to the existing plain "From {provider}" / "Filled at {pharmacy}"
  text. Logo upload reuses the Profile page's photo pipeline exactly: canvas-downscaled to 240px
  longest side, JPEG 85%, stored as a base64 data URI, 8 MB cap before downscale.
- **Bug fix found and fixed while building this:** the settings normalizer that runs on every app
  boot and backup restore (`US()` for supplements, `normalizeTreatments()` for treatments) rebuilt
  each item from a field whitelist that excluded `category`, `pharmacy`, `refillsRemaining`
  (supplements) and `provider` (treatments) — confirmed present in the previously-deployed
  `bundle.js` too. Every reload or backup restore was silently reverting these fields to
  blank/default, meaning any RX item would drift back toward showing as a plain vitamin, and any
  pharmacy/provider/refills detail would disappear, on the very next app open. Fixed by adding the
  missing fields (plus the two new partner fields) to both normalizers' whitelists. See
  `docs/DECISION-LOG.md` (`ARCH-OPEN-05` addendum, `UX-28`) for the full record.
- `tools/harness.js`: seed data now includes a pre-existing RX supplement and treatment with
  category/pharmacy/refills/provider/partner fields already set (as if saved in a prior session) —
  this doubles as the dedicated reload-persistence regression test for the bug fix above, since the
  harness's one-time boot already exercises the exact `migrate()` code path production hits on
  every app open. Also updated: every check that referenced the now-removed "Remaining
  RX/Treatments" Today section, either repointed at the new RX page or rewritten to confirm the
  section's absence from Today.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 495 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo`, documented since v3.44.0). **Not
  yet verified on a real device** — jsdom can't confirm 6-tab nav crowding/wrapping at the 420px
  max nav width, partner logo crop/scale, or general visual/spacing of the new page.

## [3.48.0] — 2026-08-24

Three changes to Today and Stats, per Rob's direction:

- **Voice Assistant tile removed from Today.** The non-functional preview tile (still present on
  Log It!) no longer appears at the top of Today; the sections below it (Today at a Glance,
  Remaining RX/Treatments, the tile grid below, Today's log) shift up to fill the space.
- **Log It!'s 8 tracker tiles duplicated onto Today**, inserted between "Remaining RX/Treatments"
  and "Today's log". Same component (`MO`), same tap handlers, same entry sheets, same per-tracker
  visibility toggles as Log It! — a tracker turned off on My Plan disappears from both pages
  identically, since both read the same `settings.show*` flags. The duplicated grid does not also
  duplicate Log It!'s "Use Your Presets"/"Manually Log a Meal" action buttons underneath it — only
  the 8 tiles, as requested. (`MO` gained two optional props, `hideVoiceTile` and
  `hideActionButtons`, to support reuse without touching Log It!'s own rendering.)
- **"Prior Days" moved from Today to Stats**, positioned above "Health Summary" and below "Sleep
  Over Time". Renamed **"Edit Prior Days Logs"**, and rebuilt as a single large tappable card
  (`wt-card`) rather than a small label + icon button — tapping anywhere on the card opens the same
  past-days list/backfill flow that used to live behind the small calendar-icon button on Today.
  Label text bumped 13px → 20px; calendar icon bumped 24px → 32px (and changed from a clock glyph
  to an actual calendar glyph, matching the feature's name).
- `tools/harness.js`: updated every check that depended on Today's now-removed Voice Assistant tile
  or Prior Days button (several were relocated to Stats or rewritten to find their guaranteed
  element elsewhere, since removing Prior Days from Today also removed the only element that
  guaranteed a `.wt-icon-btn` existed on an otherwise-empty Today page for the v3.34.0 touch-target
  check). Added a new v3.48.0 section covering: Voice Assistant tile absence on Today, the
  duplicated 8-tile grid's presence/count/ordering and its respect for My Plan's toggles (tested by
  toggling Water off and back on), that the action buttons are NOT duplicated, that tapping a
  duplicated tile opens the real entry sheet, and the new "Edit Prior Days Logs" tile's label text,
  icon size, position (before Health Summary), and click-to-open behavior on Stats.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 474 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo` water-tile assertion, documented
  since v3.44.0 — unrelated, predates this session). **Not yet verified on a real device** — jsdom
  can't confirm how the duplicated tile grid reads visually on Today (whether it feels redundant
  next to Log It!, spacing/wrapping) or how the new "Edit Prior Days Logs" card looks/feels on
  Stats.

## [3.47.0] — 2026-08-23

Follow-up tweaks from Rob's review of v3.46.0: fixed a spacing gap that was missed, added another
one, a naming change, a card border, and tighter Today's Log rows.

- **Sleep→Weight tile gap fixed.** Log It!'s two tile grids (Water/Protein/Calories/Sleep, then
  Weight/Exercise/Treatments/RX & Supplements) each have their own `margin: 8px 0 6px`, so the seam
  between them was only getting 14px (6px + 8px) instead of the 24px gap used between every other
  pair of tiles. Added `.wt-trackers-grid + .wt-trackers-grid { margin-top: 18px; }` so that specific
  seam totals 24px (6px + 18px) like the rest.
- **RX & Supplements→"Use Your Presets" gap added.** Same fix pattern applied to the seam between
  the second tile grid and the action buttons below it: `.wt-trackers-grid + .wt-action-btns {
  margin-top: 18px; }` brings that gap to 24px too, matching the Voice-Assistant-to-Water spacing
  used everywhere else on the page.
- **"RX & Vitamins" renamed "RX & Supplements"** everywhere it appears in the app (Log It! tile,
  My Plan tracker toggle row, Today at a Glance's due-count callout, the manual-log sheet header,
  and the backfill disclaimer text). Pure label change — no behavior change, no schema change (the
  supplement `category` field added in v3.45.0 is still `'rx'`/`'vitamin'` internally).
- **"Remaining RX/Treatments" gets its own section-wide card border**, matching "Today at a
  Glance"'s `wt-card` treatment — the section label now sits inside the bubble at the top, with
  each item's own smaller card nested inside it, rather than the section floating with no border of
  its own.
- **Today's Log rows tightened** — extra vertical space had opened up under the stacked
  amounts since v3.46.0's row restack. `wt-log-row` padding cut 9px→7px, `wt-log-list`'s
  row-to-row gap cut 6px→4px, and `wt-log-desc-stack`'s internal label/metrics gap cut 2px→1px.
- `tools/harness.js`: renamed all "RX & Vitamins" string assertions to "RX & Supplements"; fixed one
  test (`wt-action-btns` margin check) that was accidentally matching the new compound
  `.wt-trackers-grid + .wt-action-btns` selector instead of the original standalone rule (both
  contain the substring `.wt-action-btns {`) — added a negative lookbehind to skip the compound
  match. Added checks for both new grid-seam margins, the rename (Log It! tile + My Plan card),
  the Remaining RX/Treatments section's new card wrapper (and that item cards nest inside it), and
  the tightened log-row/list/stack CSS values.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 453 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo` water-tile assertion, documented
  since v3.44.0 — unrelated, predates this session). **Not yet verified on a real device.**

## [3.46.0] — 2026-08-23

Log It! tile trim + spacing pass, Today's Log row restack, Stats "Subs" removed, and a new
"Remaining RX/Treatments" section on Today — all per Rob's direction, closing the loop on the data
flow he described: My Plan is the system of record (source, qty, expiry/renewal), Today shows
current-day status, Log It! is where consumption actually happens and updates that status.

- **Log It! tile trims.** Weight, Treatments, and RX & Vitamins each had a middle sub-text line
  duplicating what the hero number (added in `UX-18`) already shows — Weight's goal-difference
  text, Treatments' "All caught up"/due-count text, RX & Vitamins' "X of Y taken" text. All three
  removed, so every one of the 8 tiles now shows exactly 2 left-side data points (Goal + Logged),
  matching Water/Protein/Calories/Sleep/Exercise's existing shape.
  - The low-supply/near-expiry inventory alert (`QS()`, `PROD-04` — locked, alerts must show on
    tiles) that shared that same line on Treatments and RX & Vitamins was **not** dropped — it now
    renders alone, conditionally, only when an item actually has one. Flagging this since it wasn't
    explicitly called out in the request but removing it outright would have quietly violated a
    locked decision.
- **Tile height reduced, inter-tile gap increased.** `.wt-tracker-col` vertical padding cut from a
  uniform 16px to 10px top/bottom (left/right unchanged) — the icon/gem bubble on the right
  (`.wt-tile-right`) is untouched, only the surrounding whitespace shrank. `.wt-trackers-grid`'s
  gap bumped from `var(--s3)` (12px) to `var(--s6)` (24px) so the spacing between every tile now
  matches the extra buffer that already existed between the Voice Assistant tile and Water (that
  gap came from Voice's own `margin-bottom` stacking with the grid's `gap` — now the grid's `gap`
  alone matches it everywhere).
- **Today's Log row restack.** Descriptions were getting cut off because stats sat inline to their
  right, squeezed against the edit/delete buttons. Reworked the 4 metric-bearing entry types
  (Sleep, Weight, Exercise, the combined Water/Protein/Calories entry) so stats now render on their
  own line directly under the description (`wt-log-desc-stack`, a column flex wrapper), giving the
  description the full row width. Edit and delete buttons are now grouped into one `wt-log-actions`
  wrapper (2px gap between them, `margin-left:auto` to keep them pinned right) instead of sharing
  the row's uniform 8px gap with everything else.
- **Stats "Subs" option removed.** The "Subs" chart-picker button and the `$O` Subscriptions-panel
  component it opened are deleted outright (not relocated) — its job (aggregate inventory/expiry
  view) is now superseded by the new "Remaining RX/Treatments" section on Today, fed from richer
  data entered at the source on My Plan. Confirmed with Rob before removing, since it was the
  *only* way to reach that panel and `PROD-04` names it as one of three required alert surfaces;
  the other two (Setup/My Plan, tiles) still carry the alert.
- **New "Remaining RX/Treatments" section on Today**, between "Today at a Glance" and "Today's
  Log": lists every trackInventory-on Treatment and RX item with its quantity remaining, expiry/
  renewal date, and the `QS()` low-supply/near-expiry alert when present — plus two new
  system-of-record fields entered on My Plan:
  - Treatments gain an optional **"Ordered from / provider"** field (e.g. "Austin Drip Lounge"),
    shown as "From {provider}".
  - RX items (category `'rx'` only, not Vitamins & Supplements) gain optional **"Pharmacy / where
    filled"** and **"Refills remaining"** fields, shown as "Filled at {pharmacy}" and "{n} refills
    left".
  - Both `jO` (treatment) and `CO` (supplement) add/edit modals updated with the new fields;
    `onAddTreatment`/`onEditTreatment`/`onAddSupplement`/`onEditSupplement` all gained the new
    parameters and store them alongside the existing qty/expiration fields already used for
    inventory tracking. Vitamins never see the pharmacy/refills fields (not applicable — they're
    daily items with no fill/refill concept).
- `tools/harness.js`: added checks for the tile trims (no `wt-tile-togo` rows with no alerts
  present, tile padding value), the log-row restack (stack wrapper present, metrics render after
  the label inside it, actions grouped in one wrapper with both buttons), the Subs button's
  removal, and an end-to-end check that adds a fully-detailed RX item and treatment on My Plan
  (pharmacy, refills, provider, low qty, future expiration) and confirms all of it surfaces
  correctly in the new Today section.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors, 434 checks pass), lint unchanged at the 11-error vendor baseline. One
  unrelated pre-existing stale check still fails (`wt-tile-togo` water-tile assertion, documented
  in v3.44.0/v3.45.0 — unrelated, predates this session). **Not yet verified on a real device** —
  jsdom can't confirm the tighter tile spacing, the restacked log rows, or how the new Remaining
  RX/Treatments cards actually look.

## [3.45.0] — 2026-08-23

My Plan's "Self-Managed" tile (which bundled all supplements/prescriptions and self-managed
treatments into one combined sheet) split into a new **"Self-Managed RX"** section with two tiles —
"Vitamins & Supplements" and "RX" — plus a standalone "Self-Managed Treatments" tile, per Rob's
direction following the "To Do Today" removal (v3.44.0). Log It! and Today are unaffected — they
still log/count all supplements together in one place, by explicit choice, to keep daily logging to
one step.

- **New `category` field on supplement items** (`'vitamin'` | `'rx'`). Existing items with no
  category (all supplements created before this release) default to `'vitamin'` wherever read —
  no migration/rewrite needed, since the field is simply absent on old items and treated as
  "vitamin" by a `!== 'rx'` check, the same optional-field pattern already used for
  `trackInventory`/`qtyRemaining`/`expirationDate`. New items get the category stamped at creation
  by `onAddSupplement`/`onEditSupplement`, which both gained a `category` parameter.
- **My Plan reorganized**: "My Treatments" (unchanged, partner/clinic demo) → new "Self-Managed RX"
  header → "Vitamins & Supplements" tile → "RX" tile → "Self-Managed Treatments" tile (unchanged
  behavior, just no longer bundled with supplements in one sheet).
  - **Vitamins & Supplements**: view/add/edit/delete only — the add form has no interval/schedule
    field at all (these are daily items by design, so `intervalDays` is implicitly 1 and never
    asked about).
  - **RX**: view/add/edit/delete, keeps the existing "Take every (days)" schedule field, and now
    also shows each item's due/overdue state with an **editable next-due-date input** per row — this
    restores the capability that "To Do Today" (removed in v3.44.0) used to be the only place to
    exercise. Editing the date calls a new `onEditSupplementNextDue` handler wired from the app root
    down through My Plan.
  - **Self-Managed Treatments**: identical CRUD to before, just given its own tile instead of being
    bundled with supplements in the old "Self-Managed" sheet — this was preserved deliberately so
    treatment management wasn't quietly lost in the split (it wasn't explicitly requested, but the
    old sheet was the *only* place treatments could be added/edited/deleted).
  - `CO` (the shared supplement add/edit modal) gained a `category` prop that hides the schedule
    field and adjusts modal copy for vitamins, while leaving the RX and legacy-caller behavior
    unchanged.
- **Log It! and Today deliberately untouched**: both still read `settings.supplements` as one list
  (no category filtering), so the combined "RX & Vitamins" tile, its due-count, and "Today at a
  Glance"'s due-count callout keep working exactly as before — adding an RX item or a vitamin both
  show up the same way for daily logging. This was Rob's explicit call: splitting Log It! into two
  tiles would add a second daily-logging step for very similar items, working against minimizing
  steps to log.
- `tools/harness.js`: replaced the stale "Self-Managed sheet" checks with checks for the new
  "Vitamins & Supplements" and "RX" sheets; added checks that legacy no-category items default
  correctly into Vitamins & Supplements, that the vitamin add form hides the schedule field while
  the RX add form keeps it, that new items are stamped with the right category, and an end-to-end
  check that editing an RX item's date input actually updates its `nextDueOverride` in storage.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. One unrelated
  pre-existing stale check still fails (`wt-tile-togo` water-tile assertion, documented in v3.44.0 —
  unrelated to this change). **Not yet verified on a real device** — jsdom can't confirm how the
  three-tile My Plan section looks/reads, or how the RX date-input feels on a touchscreen.

## [3.44.0] — 2026-08-23

Follow-up from Rob's review of v3.43.0's "Today at a Glance": "To Do Today" removed as redundant
now that the new summary covers it, "Voice Tracker" renamed "Voice Assistant," and the app header
tightened and locked in place.

- **"To Do Today" section removed from the Today page.** Now that "Today at a Glance" surfaces
  due/overdue RX & Vitamins and Treatments as a callout, the old section (a full list of due items
  with per-item overdue/today status and an inline "change next-due date" input) was pure
  duplication — per Rob, its only real function beyond that duplication was letting you edit an
  item's next-due date inline, which isn't essential to keep. Today is now a clean exec-summary-at-
  top, full-log-below layout: Voice Assistant tile → Today at a Glance → Today's Log.
  - The per-item next-due-date editing UI is gone along with it; next-due dates can still be
    corrected from My Plan (unaffected — this session didn't touch that page).
  - `onEditNextDue` (the handler wiring that date input) removed as dead code along with its call
    site, since its only caller was the removed section.
  - Dead CSS (`wt-todo-today-sticky`, `wt-todo-today-scroll`) removed.
  - The v3.34.0 accessibility rule "overdue state has icon glyph alongside color, not color alone"
    (see decision log `UX-OPEN-01`/item 6c) is preserved — it now lives on "Today at a Glance"'s
    due-count callouts (`AlertCircle` icon + colored border), which is the only remaining surface
    that shows due/overdue meds & treatments on this page. Note the callouts show an aggregate
    count, not a per-item overdue-vs-due-today distinction the old section had — flagging in case
    that granularity is missed on real-device review.
- **"Voice Tracker" renamed "Voice Assistant"** throughout (tile title and aria-label, on both Log
  It! and Today). Purely a label change — still the same non-functional design preview, no behavior
  change.
- **App header locked and tightened.** `.wt-topbanner` (the banner holding the drip-logo badge and
  "HydroPro Tracker" title) changed from `position:relative` to `position:sticky; top:0` so it no
  longer scrolls away with the page content — Rob's "locked" request. Its bottom padding was cut
  from 28px to 10px (top 22px → 16px), and `.wt-frame`'s top padding cut from 18px to 10px, removing
  the excess dead space under the logo/title so the page content beneath starts higher on screen.
- `tools/harness.js`: removed/replaced checks that depended on the deleted "To Do Today" DOM (the
  backfill "rule 3" and v3.34.0 overdue-icon checks now assert against the RX & Vitamins tile ring
  and the new due-count callout instead of the removed section); added checks for the section's
  removal, the Voice Assistant rename, and the sticky/trimmed header.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` — harness
  clean (0 runtime errors), lint unchanged at the 11-error vendor baseline. One unrelated
  pre-existing stale check failed (`wt-tile-togo` water-tile assertion, predating this session —
  that class was superseded by the v3.39.0 hero-number tile restructure and the test was never
  updated; confirmed present and failing identically on the already-deployed v3.43.0 bundle before
  any of this session's changes, so it is not a regression from this work). **Not yet verified on a
  real device** — jsdom can't confirm how the sticky header feels while scrolling, whether the
  tightened spacing looks right, or how the shorter Today page reads as a whole.

## [3.43.0] — 2026-08-23

Today's "Tracked So Far" section replaced with a compact "Today at a Glance" needs-attention
summary, per Rob's direction — the old section duplicated every tracker's detail already shown on
Log It! and pushed To Do Today/Today's Log below the fold.

- **"Tracked So Far" → "Today at a Glance."** `TrackedSoFar` (`src/app.js`) no longer renders one
  row per enabled tracker. It now surfaces only what needs attention, capped at 4 rows:
  - Any due/overdue RX & Vitamins or Treatments, shown as a due-count callout (e.g. "2 due today").
  - If room remains, the single most-behind consumable/time tracker (water, protein, calories,
    sleep, exercise) — whichever has the largest fraction of its goal still remaining — shown as
    e.g. "40oz to go toward your 120oz goal." Weight is excluded (it's an off-target amount, not a
    consumption goal, so "most behind" doesn't apply to it).
  - Goals-already-met and an active sleep session were considered as callout triggers and explicitly
    left out per Rob — the summary is for what still needs doing, not a status board.
- **Empty state changed from a warning to a reward.** When nothing qualifies (all due items handled,
  no tracker meaningfully behind), the section shows "Great work, you're all caught up for now! 🎉"
  instead of an empty card — Rob's call: a quiet section reads as broken, a positive message reads as
  earned.
- `computeTrackerStats()` unchanged — this reuses the same shared computation Log It! and the old
  Tracked So Far both already depended on; only what `TrackedSoFar` selects and renders from it
  changed.
- `tools/harness.js`: replaced the old 8-row/label-text checks with checks for the new section name,
  ordering, the 4-row cap, and that the default seed (2 supplements due, nothing else logged) surfaces
  the RX & Vitamins due-callout without listing every other tracker.
- Full 5-step verification pipeline run and passed against the exact shipped `bundle.js` (harness
  clean, 0 runtime errors; lint unchanged at the 11-error vendor baseline). **Not yet verified on a
  real device** — jsdom can't confirm how the shorter section reads at a glance on an actual phone,
  or how the "all caught up" empty state feels in practice on a day where everything really is done.

## [3.42.1] — 2026-08-23

Follow-up from Rob's real-device test of v3.42.0 — nav swap reverted, header black-box artifact
investigated and mitigated, profile photo now downscaled, Tracked So Far text bumped.

- **Bottom nav order reverted to Log It!, Today, Stats, My Plan, Settings** — Rob asked to swap it
  back after testing v3.42.0's Today-first order.
- **Investigated a recurring black-box artifact over the header** (profile icon, logo, and app
  name — not just the profile photo as first reported). It appeared inconsistently after uploading
  a profile photo and cleared on switching tabs, then would randomly recur. Ruled out memory
  pressure as the cause — a single compressed photo is far too small to plausibly exhaust page
  memory on a modern phone. The strongest suspect is a known WebKit/iOS Safari class of bug where a
  CSS `filter` on one element (here, `filter:drop-shadow(...)` on the logo badge) causes a stray
  repaint artifact over sibling elements after certain re-renders — this matches the
  "intermittent, clears on navigation" symptom exactly and is not reproducible in jsdom (no real
  layout/paint engine), so this is a strong hypothesis, not a confirmed root cause.
  - **Mitigation shipped:** removed the `drop-shadow` filter from `.wt-topbanner-badge` entirely —
    purely cosmetic, low risk to drop.
- **Profile photo is now downscaled and compressed client-side before storage**, regardless of the
  root cause above — a smaller, normalized image is strictly safer and was worth doing either way.
  On upload, the image loads into an offscreen `<img>`, is drawn to a canvas capped at 240px on its
  longest side, and re-exported as JPEG at 85% quality — so the stored `photoDataUri` is now
  reliably tiny (tens of KB) regardless of the original photo's resolution. Raw file-size gate
  raised from 2MB to 8MB (generous headroom for an unprocessed phone photo) since the real
  constraint is now post-processing size, not the original upload.
- **Tracked So Far text made larger and consistently tan**, per Rob's request: row label 13px → 15px
  (already tan), row detail 12.5px → 14px and recolored from muted-gray (`var(--muted-dark)`) to
  tan (`var(--ink-inverse)`) to match.
- `tools/harness.js`: nav-order check inverted to match the reverted order; new checks confirm the
  filter is gone and the Tracked So Far font/color changes are present.

**Verification:** full 5-step pipeline (esbuild → harness clean, 0 runtime errors → `eslint` on
`bundle.build.js`, 11-error vendor baseline unchanged → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same results). End-state audit confirmed the filter
removal, the canvas-downscale code, and the raised size cap are all present in the shipped bundle.
**Not yet verified on a real device — this is the important caveat.** The drop-shadow removal is a
hypothesis-driven fix for a bug jsdom cannot reproduce or confirm; if the black-box artifact recurs
after this deploy, the WebKit-filter theory is wrong and the investigation needs to continue with
Rob's on-device repro steps (exact sequence of taps, iOS version, whether it's Safari or a PWA
homescreen install).

**Update (same day):** Rob confirmed on real device — the black-box artifact has not recurred since
this deploy. The `filter:drop-shadow` removal is the confirmed fix, not just a hypothesis.

## [3.42.0] — 2026-08-23

Today becomes the app's true landing/engagement page, per Rob's direction.

- **Voice Tracker tile copied onto Today**, as the first thing under "Today's Summary for:" — same
  visual design and non-functional/decorative state as the Log It! copy (both now render the same
  `VoiceTrackerTile` component).
- **New "Tracked So Far" section**, directly below the Voice Tracker tile: one bordered card ("one
  bubble") listing every currently-enabled tracker as its own row — icon chip and label on the
  left, a detailed one-line summary on the right (e.g. "32oz of 64oz goal · 32oz to go"), each row's
  left border tinted in that tracker's category color. Only trackers currently enabled on Log It!
  appear (matches Log It!'s own on/off behavior). Section order on Today is now: Voice Tracker tile
  → Tracked So Far → To Do Today → Today's Log.
- **Refactor: extracted `computeTrackerStats(data, todayKey)`** from Log It!'s tile component (`MO`)
  into a standalone shared function, so both Log It!'s tiles and Tracked So Far compute every
  tracker's goal/consumed/remaining numbers from one source instead of two independently-maintained
  copies of the same logic — avoids the drift/duplication bug class this codebase has hit before.
  `MO`'s own rendering is unchanged; it now just destructures from the shared function's return.
- **Bottom nav order swapped**: Today now sits left of Log It! (was Log It!, Today, Stats, My Plan,
  Settings; now Today, Log It!, Stats, My Plan, Settings).
- `tools/harness.js`: new checks confirm the Voice Tracker tile renders on Today, "Tracked So Far"
  appears before "To Do Today" (and both still precede "Today's Log"), all 8 tracker rows render
  with correct detail text and color-coded borders, and the nav bar's first two buttons are now
  Today then Log It!.

**Verification:** full 5-step pipeline (esbuild → harness clean, 0 runtime errors → `eslint` on
`bundle.build.js`, 11-error vendor baseline unchanged → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same results). All new harness checks pass, including
an exact 8-row count for the default seed data and the section-ordering assertion. Same one
pre-existing, unrelated stale harness check still fails, untouched. **Not yet verified on a real
device** — jsdom has no layout engine, so Tracked So Far's row spacing/wrapping on a real phone
screen, and how the page reads as a whole with the reordered sections, need Rob's eyes.

## [3.41.1] — 2026-08-23

Bugfix from Rob's real-device test of v3.41.0.

- **Fixed: header profile icon/app name showed a black square overlapping them after uploading a
  profile photo.** Root cause: `.wt-topbanner-profile` (the circular header button) had no
  `overflow:hidden`, so the uploaded `<img>` — sized `width:100%;height:100%` of its 40×40 box —
  wasn't actually clipped to the parent's circular `border-radius`; only `.wt-topbanner-profile-photo`
  itself had rounding, which isn't sufficient on its own to guarantee the image's square edges never
  paint outside the circle on first render. Rob reported the artifact was inconsistent — present on
  return from the Profile page, gone after switching to a different nav tab — consistent with a
  stale first-paint that a later reflow corrects, rather than a persistent layout bug, but the
  missing `overflow:hidden` was the real, fixable defect either way.
- Fix: added `overflow:hidden` to `.wt-topbanner-profile`, plus `max-width:100%;max-height:100%;
  object-position:center` to `.wt-topbanner-profile-photo` so the image is guaranteed to be
  clipped and centered within its circular container regardless of the photo's original dimensions
  or render timing.
- `tools/harness.js`: added a check confirming both CSS rules are present in the shipped bundle.

**Verification:** full 5-step pipeline (esbuild → harness clean, 0 runtime errors → `eslint` on
`bundle.build.js`, 11-error vendor baseline unchanged → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same results). End-state audit confirmed both CSS rules
are present in the shipped bundle. Same one pre-existing, unrelated stale harness check still
fails, untouched. **Not yet verified on a real device** — jsdom cannot render CSS clipping/paint
behavior at all, so this fix needs Rob to re-upload a photo and confirm the artifact is actually
gone, including the specific "returns from Profile page" repro path he described.

## [3.41.0] — 2026-08-23

Log It! action-button restyle and a new Profile page, requested by Rob in one pass.

- **"Use Your Presets" button is now a glossy blue outline.** Background changed from a solid gold
  gradient to `transparent` with a 2px `var(--water)` border and a soft blue glow
  (`box-shadow:0 0 14px rgba(47,128,237,.35), inset 0 1px 0 rgba(255,255,255,.15)`) for a glossy
  look. Text/icon color changed to `var(--ink-inverse)` (tan).
- **Both entry sheets now carry a matching colored border.** The "Use Your Presets" bottom sheet
  takes `borderColor:"var(--water)"` (matching its button); the "Manually Log a Meal" sheet takes
  `borderColor:"var(--protein)"` (matching its button's existing green), continuing the same
  tile-to-sheet color-matching pattern used elsewhere in the app (`UX-18`).
- **New Profile page** (`ProfilePage` component), reached only via the header's profile icon —
  previously a decorative, `aria-hidden` circle, now a real button (`onClick: () => a("profile")`).
  Not in the bottom nav and has no other entry point, per Rob's request. Fields: Full Name, Email
  Address, Mobile Phone Number (all plain text/email/tel inputs), and a profile photo upload
  (`<input type="file" accept="image/*">`, capped at 2MB, stored as a base64 data URI). Explicit
  Save button; the header's profile icon shows the uploaded photo once one exists. A Back button
  (`ChevronLeft`, already imported) in the shared header returns to Log It!, since Profile has no
  nav-tab equivalent to switch away from.
- **Storage: local-only, by design.** New `settings.profile` object (`fullName`, `email`, `phone`,
  `photoDataUri`) added to the versioned-schema defaults (`ES.settings`, `ARCH-OPEN-05`) — picked up
  automatically by `migrate()`/`deepMergeDefaults` and by backup export/import (`ve()`'s denylist
  export includes it with no extra wiring). This is a personalization-only field, explicitly
  separate from `settings.account.email` (the real sign-in/magic-link email) — a note to that effect
  is shown on the Profile page itself. Does not reach the Worker/D1 backend or affect notifications;
  explicit call by Rob to keep this local-only for now.
- `tools/harness.js`: added a full click-through check — profile icon is a real clickable button,
  Profile page mounts with all 4 fields plus Back, typing + Save persists `settings.profile.fullName`
  into stored data, and Back returns to Log It!.

**Verification:** full 5-step pipeline (esbuild → harness clean, 0 runtime errors → `eslint` on
`bundle.build.js`, 11-error vendor baseline unchanged → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same results). The new harness checks exercise the full
profile flow end-to-end (open → fill → save → persist → back) and all pass. Same one pre-existing,
unrelated stale harness check still fails, untouched. **Not yet verified on a real device** — jsdom
can't confirm the button glow/outline actually reads as "glossy," how the profile photo crops/scales
on a real screen, or file-picker behavior on a phone.

## [3.40.4] — 2026-08-23

Follow-up polish from Rob's review of v3.40.3.

- **Voice Tracker badge nudged left again.** `margin-right` increased 20px → 26px — still fine-tuning
  toward alignment with the progress rings below.
- **"Use Your Presets" and "Manually Log a Meal" buttons restyled: transparent fill, colored
  outline, tan text.** Both previously had solid-color fills (gold gradient / green). Now
  `background:transparent` with a 2px border in their respective color (`#F9A825` gold for presets,
  `var(--protein)` green for manual — same colors, moved from fill to outline) and
  `color:var(--ink-inverse)` (the standard warm-tan text used everywhere else on dark surfaces) for
  both the label and icon.
- **Header profile icon moved further left**, `margin-left:-14px` — since the AI icon's removal
  (v3.40.0) left the header's centered icon+logo+title group asymmetric, pulling the profile icon
  further from the logo restores better visual balance.
- **RX & Vitamins tile: removed "today" from "0 of 2 taken today".** Now reads "0 of 2 taken" —
  per Rob, the extra word was pushing the tile's format out of line with the other 7 tiles.

**Verification:** full 5-step pipeline (esbuild → harness clean, 0 runtime errors → `eslint` on
`bundle.build.js`, 11-error vendor baseline unchanged → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same results). End-state audit confirmed the new badge
margin, both buttons' transparent/outline/tan styling, the profile icon's margin, and the "taken"
string (no "today") are all present in the shipped bundle; the old "taken today" string is fully
gone. Same one pre-existing, unrelated stale harness check still fails, untouched. **Not yet
verified on a real device** — jsdom has no layout engine, so the badge's alignment, the buttons'
visual contrast against the page background, the header spacing, and the RX tile's resulting size
match against the other 7 tiles all need Rob's eyes.

## [3.40.3] — 2026-08-22

Quick follow-up from Rob's real-device check of v3.40.2.

- **Voice Tracker badge nudged back right.** v3.40.2 shifted the badge left via
  `margin-right:38px`; Rob reported it went too far. Reduced to `margin-right:20px`.

**Verification:** full 5-step pipeline re-run and passed against the exact shipped `bundle.js` —
0 runtime errors, lint at the unchanged 11-error baseline, same one pre-existing unrelated stale
harness check. **Not yet verified on a real device.**

## [3.40.2] — 2026-08-22

Follow-up fixes from Rob's review of v3.40.1.

- **Voice Tracker tile: subtext smaller, badge shifted left.** Subtext font reduced 11.5px → 10px.
  Badge circle given `margin-right:38px` (was flush against the tile's 16px edge padding) so its
  horizontal center roughly matches the progress rings' horizontal center in the tiles below (ring
  center sits ~67.5px from the tile's right edge; badge center now sits ~64px). Vertical alignment
  is a known limitation: jsdom has no layout engine, so exact cross-tile center-line matching for
  tiles of different heights can't be computed or verified here — needs Rob's real-device eyes to
  confirm or further nudge.
- **Fixed preset button text formatting.** `.wt-preset-btn` had no vertical-centering rule, so text
  sat high and could get clipped at the bottom of the grid cell when the CSS grid stretched button
  heights. Added `display:flex; align-items:center; justify-content:center; min-height:52px` so
  preset names are centered both ways inside their bubble.
- **Fixed "Use Your Presets" sheet's excess bottom space and backdrop/scroll interference.** The
  v3.40.0 fix that expanded the presets grid used `minHeight:"60vh"` on the sheet plus
  `flex:1 1 auto`/`margin-top:auto` — when there were few presets, the grid didn't stretch to fill
  that forced height, leaving dead space between the grid and "Edit Presets," and created a mismatch
  between the sheet's visual bottom and its actual boundary that interfered with tapping/scrolling.
  Reverted to the sheet's normal content-driven sizing (same pattern every other sheet in the app
  uses) with the presets grid capped at `max-height:50vh` and scrollable on its own — no more forced
  minimum height, no more gap.

**Verification:** full 5-step pipeline (esbuild → harness clean, 0 runtime errors → `eslint` on
`bundle.build.js`, 11-error vendor baseline unchanged → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same results). End-state audit confirmed the new sub
font-size, badge margin, preset-button flex-centering, and removal of the forced `60vh` sheet
height are all present in the shipped bundle. Same one pre-existing, unrelated stale harness check
still fails, untouched. **Not yet verified on a real device** — jsdom cannot confirm the badge's
actual vertical alignment against the rings below, the preset bubble text centering, or that the
sheet's dead-space/scroll-interference bug is actually gone on a touchscreen.

## [3.40.1] — 2026-08-22

Follow-up fixes from Rob's review of v3.40.0.

- **Voice Tracker tile resized to fit below the standard tile height.** Icon bubble shrunk from
  52px to 36px (now matches `.wt-tile-chip`, the same small icon size used on every other tile).
  Title/subtext shifted left (`margin-left:-4px` on the text column) and subtext font reduced
  14px → 11.5px. Tile padding reduced 20px → 12px/16px so the whole card is shorter than the
  tiles below it. Badge circle reduced 72px → 52px and horizontally aligned with the progress
  rings in the tiles below (matching 16px right padding).
- **Real badge image applied.** Rob supplied `voice-tracker-badge.png` (the glossy gradient
  sphere from the original spec); it's now the actual badge fill in both the in-app tile
  (`site/app/assets/voice-tracker-badge.png`) and the standalone deliverable
  (`voice-tracker-tile/assets/voice-tracker-badge.png`), replacing the CSS-gradient placeholder
  from v3.40.0.
- **"Use Your Presets" sheet no longer wastes space below Edit Presets.** The sheet content is now
  a flex column with the presets grid set to `flex:1 1 auto` (filling available height instead of
  a fixed 260px cap) and "Edit Presets" pinned to the bottom via `margin-top:auto`, so the sheet's
  existing size is used fully instead of leaving a gap.
- **Bugfix: Manually Log a Meal no longer opens a second stacked popup.** Water/Protein/Calories
  were tap-to-open buttons that launched the `wO` drag-dial sheet on top of the manual sheet —
  a second backdrop stacked behind/over the first, not the plain numeric-keyboard entry the manual
  flow is supposed to be. They're now plain `<input type="number">` fields directly in the sheet
  (same pattern as the existing Description field), so tapping one just brings up the phone's
  numeric keyboard and "Log Items" submits normally. No second sheet, no dial.
- `tools/harness.js`: added checks confirming the Voice Tracker tile mounts as the trackers-grid's
  first child and is `aria-disabled`; confirmed the manual sheet's three fields are plain number
  inputs with no `.wt-dial-trigger` buttons; added a regression check that typing into the Water
  field does not open a second `.wt-backdrop`. Added a best-effort sheet-cleanup step before the
  v3.40.0/3.40.1 block since sheets are portaled to `document.body` and survive tab navigation,
  so an earlier test's leftover open sheet was polluting the new stacked-popup check.

**Verification:** full 5-step pipeline (esbuild → harness clean, 0 runtime errors → `eslint` on
`bundle.build.js`, 11-error vendor baseline unchanged → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same results). End-state audit confirmed the new tile
CSS sizes, the real PNG reference, the flex-column presets sheet, and the removal of the last
`wt-dial-trigger` usage are all present/absent as intended in the shipped bundle. The same one
pre-existing, unrelated stale harness check from v3.40.0 (`Goal 64oz − 32oz logged`) still fails,
untouched. **Not yet verified on a real device** — jsdom has no layout engine, so the tile's new
height/alignment against the tiles below and the badge image's crop/fit need Rob's eyes.

## [3.40.0] — 2026-08-22

Log It! split the combined "Use Your Presets or Log a Meal" flow into two independent entry
paths, added a non-functional "Voice Tracker" tile as a preview of the future Smart Entry
capability, and removed the placeholder AI header icon now that the tile carries that role.
Also produced a standalone, dependency-free HTML/CSS/JS Voice Tracker tile component for future
wiring outside the React bundle.

- **Presets and manual entry split into two flows.** The single "Use Your Presets or Log a Meal"
  button and its combined sheet (`xO`) — presets grid, manual Water/Protein/Calories/Description/
  Time fields, and "Edit Presets" all in one place — is now two buttons and two sheets:
  - **"Use Your Presets"** opens a trimmed `xO`: presets grid, "Edit Presets" (→ My Presets
    sub-sheet, unchanged), tap-to-log-instantly. No manual fields, no "Log Items" button of its
    own — logging happens by tapping a preset.
  - **"Manually Log a Meal"** (new, green, matching the Protein category color `var(--protein)`)
    opens a new `ManualMealSheet`: Water/Protein/Calories/Description/Time fields and "Log Items",
    carrying over all of `xO`'s previous manual-entry behavior (drag-dial triggers, validation,
    submit logic) unchanged.
  - **Editing an existing water/protein/calories log entry** (tap an entry in Today's log → edit)
    now opens `ManualMealSheet` pre-filled, not the presets sheet — editing is inherently a
    manual-field operation, and the presets sheet no longer carries fields to edit into. Explicit
    call by Rob.
- **"Voice Tracker" tile added to Log It!**, positioned above the Water tile, unconditionally
  visible. Gold-gradient-bordered dark card with an AI-agent icon bubble, title/subtext, and a
  glossy gradient-sphere badge with a mic glyph — **not wired to anything**; it's a design preview
  for the future Smart Entry voice-entry capability, not yet functional.
- **Header AI (Sparkles) icon removed.** Per `UX-14`/`UX-16`, this was the placeholder future
  Smart-Entry entry point in the app header. Explicit call by Rob: the new Voice Tracker tile now
  carries that role instead, so the header placeholder is redundant. Supersedes the header-based
  placement from `UX-14`/`UX-16` — see `UX-19` in the decision log.
- **Standalone Voice Tracker component produced** at `voice-tracker-tile/` — plain HTML/CSS/JS, no
  framework, no build step, matching the full design spec (colors, fonts, gradient border/badge
  ring, idle/listening/done states, `initVoiceTracker()` / `setVoiceTrackerState()` API for a future
  speech-recognition integration to call into). No source badge image was supplied, so the badge
  circle uses a CSS radial-gradient sphere in both the standalone files and the in-app tile instead
  of an image; a README in `voice-tracker-tile/assets/` documents how to swap in a real PNG later.
- **`tools/harness.js` updated** for the split: stale selectors depending on the old combined
  button text and the removed AI icon (`UX-OPEN-02` OO-backdrop check, preset CRUD flow, header
  order check) now target the new UI; new checks added for the tile, the two buttons, and both
  sheets' field composition.

**Verification:** full 5-step pipeline (esbuild → harness clean, 0 runtime errors → `eslint` on
`bundle.build.js`, 11-error vendor baseline unchanged → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same results). End-state audit confirmed both new
button strings, the removed combined-button string, the Voice Tracker copy/CSS class, and the
removed `.wt-topbanner-ai` CSS rule are all present/absent as intended in the shipped bundle. One
harness check (`Goal 64oz − 32oz logged = 32oz to go`) still fails — pre-existing at HEAD before
this session (stale since the v3.39.0 tile restructure moved that text to `.wt-tile-mid-label`),
unrelated to this change, not touched here. **Not yet verified on a real device** — jsdom has no
layout engine, so the Voice Tracker tile's visual design (gradient border, badge ring, glow
animation) and the new button's sizing/color next to the presets button need Rob's eyes.

## [3.39.1] — 2026-08-22

Follow-up fixes from Rob's review of v3.39.0.

- **My Plan tile popups now color-match too.** v3.39.0 only wired the color-match into the Log It!
  sheets; the "What I'm Tracking" tile popups on My Plan (`TrackerSheet`, opened from `TrackerRow`)
  still had the generic border. Each of the 8 `setOpenTracker(...)` calls now carries a `borderColor`
  (reusing the same `iconColor` token already passed to that row's tile border), and `TrackerSheet`
  applies it to its `wt-sheet`.
- **Log It! hero number now centered in the tile**, not hugging the icon. `.wt-tile-mid` changed from
  `flex:0 0 auto` to `flex:1 1 0` so it shares the tile's remaining width evenly with the left text
  stack, centering the number/caption in the middle of the tile rather than against the ring.
- **Hero-number caption bumped up**: `.wt-tile-mid-label` font-size 11px → 13px, per Rob's "a little
  bigger" request.
- **Today page header**: "Tracking Plan & Summary for:" (from v3.39.0) → "Today's Summary for:".

**Verification:** same 5-step pipeline (esbuild → harness clean, 0 errors → lint:bundle, 11-error
vendor baseline unchanged → copy to `site/app/bundle.js` → harness + lint re-run against the exact
shipped file). End-state audit confirmed 16 sheet `borderColor` occurrences (8 trackers × Log It! +
My Plan), the new `flex:1 1 0` / 13px CSS, and the new Today string all present in the shipped bundle.
**Not yet verified on a real device** — same caveat as v3.39.0: jsdom can't confirm the centered
layout actually looks centered, or how the wider `wt-tile-mid` box interacts with long labels like
"Right on goal! 🎯".

## [3.39.0] — 2026-08-22

Log It! tile restructure, popup outline color-matching, and three header-copy changes — all requested
by Rob in one pass.

**Popup outline now matches its tile's category color.** All 8 tracker entry sheets (Water, Protein,
Calories, Sleep, Weight, Exercise, Treatments, RX & Vitamins) previously shared the generic
`--hairline-bright` border. Each sheet now takes an explicit `borderColor` (`var(--water)`,
`var(--protein)`, etc. — the same token already used for that tracker's tile border on Log It!) so the
bottom sheet visually continues the tile you tapped. Water/Protein/Calories/Weight share one dial
component (`wO`) parameterized by a new `borderColor` prop passed at each call site; Sleep, RX &
Vitamins, Treatments, and Exercise each got the color applied directly (Sleep has three separate sheet
states — active-session, manual-entry, and choice — all three updated).

**Log It! tile restructure — the middle stat is now a large, bold hero number.** Previously the "to go"
line sat as a mid-size line inside the left-hand text stack alongside Goal and Logged/Taken. It now
renders in a new middle column (`wt-tile-mid`, between the text stack and the icon/progress-ring), at
24px bold with a smaller caption underneath — vertically centered next to the tile's icon bubble, as
Rob asked using the Water tile ("120oz" large / "to go" small) as the reference example. Per-tracker
scope, agreed with Rob before implementation:
- **Water, Protein, Calories, Sleep, Exercise:** the existing "to go"/"left"/"over" stat moves out of
  the left stack entirely into the new hero position (Goal and Logged stay put, unchanged size).
- **Weight:** left stack unchanged (Goal/today's value stay as-is); the new hero number is the signed
  amount left to reach goal (`Math.abs(goal − today's weight)`), captioned "to go" — "On goal!" when
  the diff is zero, "Log today" when no weight's been recorded yet.
- **Treatments:** left stack unchanged; hero number is the count of treatments planned for today,
  captioned "to do".
- **RX & Vitamins:** left stack unchanged; hero number is the count due today, captioned "to take".

New CSS: `.wt-tile-mid` / `.wt-tile-mid-value` (24px bold) / `.wt-tile-mid-label` (11px, muted).

**Header copy changes (3 pages):**
- Log It! — "Day Tracker:" → "Tracking for:"
- Today — "Day Planner:" → "Tracking Plan & Summary for:"
- Stats — "TO DATE STATS:" → "CURRENT STATS FOR:"

**Verification:** Full 5-step pipeline run (esbuild → harness clean boot, 0 runtime errors → lint:bundle,
11 pre-existing vendor no-undef errors, unchanged baseline → copy to `site/app/bundle.js` → harness +
lint re-run against the exact shipped file, same clean results). End-state audit confirmed all 8
`wt-tile-mid` blocks, all 8 sheet `borderColor` tokens, and all 3 header strings present in the shipped
bundle. **Not yet verified:** visual layout on a real device/browser — jsdom has no layout engine, so
vertical centering, spacing, and whether the hero number/tile-right column crowd on narrow screens
need Rob's eyes.

## [3.38.2] — 2026-08-22

Two more defects from Rob's real-device pass on v3.38.1: invisible text in the Past Days popup,
and outline-only (transparent-inside) tile icons on both Log It! and My Plan.

**Past Days text-color bug, root cause.** The date-list buttons in the "Past days" view (before a
specific day is selected) render as native `<button>` elements. Their `.wt-preset-name` label had
no explicit `color` of its own, which had worked fine everywhere else this session because plain
elements (`div`, `span`, `li`) inherit `color` from their ancestors — but `<button>` (and `input`/
`select`/`textarea`) do **not** reliably inherit `color`/`font` from ancestors across browsers; the
UA stylesheet gives them their own default (typically black/`buttontext`), which is exactly why
every *other* button-based control in this app (`.wt-btn-primary`, `.wt-preset-btn`, `.wt-chip`,
etc.) already had its own explicit `color` set — the Past Days date list was simply the one place
that didn't. Fixed with a general reset, not a one-off: `:where(button, input, select, textarea)
{ color:inherit; font:inherit; }`, added early in the stylesheet. `:where()` carries zero
specificity, so every existing explicitly-colored button/input class still wins exactly as before
(nothing else changes) — this only fills the gap for anything that was silently relying on
inheritance that never actually reached it. Because this is a general fix rather than a scoped
one, it should also catch any other not-yet-reported instance of the same bug elsewhere in the
app, not just the Past Days popup.

**Filled tile icons.** Checked before assuming: My Plan's tile icons were **not** already filled
— both Log It! and My Plan render their category icon via `lucide-react`'s default stroke-only
outline (`fill:none`, `color` only sets the stroke), so both had the same "transparent inside"
look Rob flagged. Rather than reverting one to match the other, both got the same fix: each of the
8 Log It! tile icons and the shared `TrackerRow` component (all 8 My Plan tiles) now pass a `fill`
prop matching their existing category color alongside `color`, so the icon shape renders solid
instead of outline-only. Purely a `fill` addition — no size, stroke-width, or color-token changes.

Verified: jsdom harness (zero runtime errors, zero failing assertions across 282 checks, including
a direct check that the rendered `<svg fill="...">` attribute is now set on both a Log It! and a
My Plan tile icon) and ESLint no-undef (11/11 baseline, unchanged), both against the fresh build
and the exact shipped `bundle.js`. **Not verified:** whether the filled icon style actually looks
good for every one of the 8 icons on a real device — some lucide glyphs (e.g. `Battery`) have
internal negative-space details that a solid fill may partially obscure; flag if any specific icon
looks wrong once you've seen it live.

---

## [3.38.1] — 2026-08-22

Follow-up polish on v3.38.0, from Rob's real-device look at the dark theme: borders were too
faint to see, the two new header placeholder icons were too small/dim, and the header/footer
needed different visibility behavior around bottom sheets.

**Brighter borders.** New `--hairline-bright` token (`#5A7390`, a muted slate-blue — deliberately
dimmer than the `--ink-inverse` tan text color, per Rob's explicit "not as bright as the text"
call, but clearly visible against both `--bg` and `--surface-dark`) replaces `var(--hairline)`
wherever it was used for a "bubble" (card/row/input/button) or "bottom-up popup" (sheet/modal)
border — all 23 usages introduced across v3.37.0–v3.38.0, including the nav bar's own top border
for visual consistency with everything else that got the brighter treatment.

**Bigger, brighter header icons.** Both placeholders grew from 32px to 40px. The profile icon's
`User` glyph went from 16px `var(--muted)` (dim gray) to 20px `var(--muted-dark)` (the brighter
token already introduced in v3.38.0 for secondary text) and its border upgraded to
`--hairline-bright`. The AI-assistant icon's `Sparkles` glyph grew from 18px to 22px and gained a
`var(--accent-chip)` circular background plus a `--hairline-bright` border — previously a bare
floating icon with no chip, now visually matches the profile icon's "pronounced" circular
treatment.

**Header always visible; footer hides behind an open sheet.** `.wt-topbanner` given
`z-index:250` — above every sheet/backdrop z-index in the app (max was 191) — so it now paints on
top of any open bottom sheet's backdrop instead of being dimmed by it. `.wt-doctor-share-overlay`
(the full-screen health-summary/print view, a different case from a bottom sheet) raised to
`z-index:260` so it still correctly replaces the header when *it's* open. `.wt-backdrop`'s scrim
opacity raised from `.45` to `.94` alpha — since the footer nav (`z-index:30`) sits well below
every sheet's backdrop already, making the backdrop itself near-opaque is what actually hides the
footer from view while a sheet is open, without needing to track "is any sheet currently open" as
a single flag across the ~15 independent open/close state variables scattered through the file.
This is a visual-covering fix, not a DOM-removal one — the footer is still mounted and dimmed-out
behind the sheet, which is sufficient for the stated goal and lower-risk than threading a new shared
boolean through every sheet in one pass.

Verified: jsdom harness (zero runtime errors, zero failing assertions across 270 checks) and
ESLint no-undef (11/11 baseline, unchanged), both against the fresh build and the exact shipped
`bundle.js`. Two more pre-existing harness assertions turned out stale from earlier sessions
(nav's border color, this session's own sheet-border check) and were updated to reflect the new
intentional colors — caught immediately this time via `grep "^FAIL"`, not by tailing output.
**Not verified:** the actual visual brightness/contrast of the new border color and icon sizing —
jsdom has no layout engine; needs Rob's eyes on a real device.

---

## [3.38.0] — 2026-08-22

Finishes the dark-theme conversion started in v3.37.0. Three parts: a global text-color/border
sweep, page-by-page removal of remaining white surfaces (in place, not a shared-class rewrite —
Rob's explicit call), and header updates with two unwired placeholder icons. Takes the v3.38.0
slot originally reserved for new partner trackers, which moves later in the sequence since this
was the more urgent item.

**Global text/border pass.** `.wt-root`'s own base text color flipped from dark navy to
`var(--ink-inverse)` — with the whole app dark end-to-end after v3.37.0, any element that didn't
explicitly set its own color was inheriting an unreadable dark-on-dark default. The one context
that must stay light — the doctor-share/health-summary overlay (on-screen and printed) — was
given its own explicit `color:var(--ink)` first, so it doesn't inherit the new default; it's
rendered both embedded in the app (inside `.wt-root`) and standalone (a bare `?share=` link with
no `.wt-root` ancestor at all), so this had to hold in both cases. Two more explicit dark-on-dark
bugs turned up by tracing every remaining hardcoded dark color, not covered by the root-level
fix: the dial-entry sheet's big center number (`fill:var(--ink)` on the SVG text) and a
confirm-dialog's non-danger button (`background: pS`, i.e. `--deep`, hardcoded inline) — both
would have been unreadable or blended into their dark surface. New `--muted-dark` token
(`#9FB0C4`) added to the global `:root` block and applied everywhere secondary "helper" text sits
on a dark surface (sheet field labels, card notes, stat labels, the dial's tick labels, etc.) —
this is the AA-contrast fix flagged as a follow-up in the v3.37.0 summary (`wS`, `#5C7085`, sat at
~3.5:1 against `--surface-dark`, below the 4.5:1 floor). `wS` itself was **not** changed, because
it's also used for on-screen text in the doctor-share overlay's light controls — the exact same
shared-constant trap as `.wt-chip`, just at the constant level instead of the class level; a new
`wD` constant carries the lightened value at the ~26 dark-context call sites instead. All sheet/
modal outer edges now have `border:1px solid var(--hairline)`; secondary buttons, inputs, and
previously-borderless rows (`.wt-log-row`, `.wt-treatment-row`, `.wt-qty-row`, `.wt-divider`, the
date-input on Today's To Do rows) got the same treatment wherever their edge had gone invisible
against the new dark backgrounds.

**Page-by-page white-surface removal.** **Today** — the Past Days popup was the worst offender
exactly as flagged: its `.wt-log-row` entries were white boxes with `.wt-sheet`'s inherited tan
text color landing on top of them, i.e. tan-on-white inside a dark-on-white sheet — invisible in
both directions at once. Converted `.wt-log-row`/`.wt-log-time`/`.wt-log-icon`, and the To Do
Today `.wt-treatment-row` cards including their overdue/today-due tinted backgrounds (now
`var(--alert-chip)`/`var(--meds-chip)`, the existing dark category-tint tokens, instead of pastel
`#FBEEEC`/`#FEF3E8`). **Stats** — segmented control, range-nav buttons, stat boxes, and every
`.wt-card` (including the Health Summary/doctor-share launcher) converted; chart containers now
dark, but the four recharts `Tooltip` popups still use the library's default white
`contentStyle` — left alone per the brief (chart internals, flag for follow-up rather than risk
breaking a chart this session). **My Plan** — `.wt-regimen-card` (My Treatments section, the
Austin Drip Lounge demo card, "Add Treatment Provider") converted; the off-state dimmed tile icon
background was itself a separate leftover light chip (`var(--paper)`) fixed alongside it.
**Settings** — covered entirely by the global `.wt-card`/`.wt-field` fixes; no page-specific
surfaces left over. **Left alone, flagged rather than fixed:** `.wt-chip`, used both inside dark
sheets and inside the light/printable doctor-share overlay — touching it would fix one context
and break the other, the same reasoning that correctly protected it in v3.37.0.

**Header.** Logo badge 82px→70px, title 27px→23px (~15% each, per spec) to make room for two new
placeholder icons — neither wired to anything, no tap handler: a 32px circular profile icon (left
of the logo, `lucide-react` `User`, muted fill) and a `Sparkles` icon in `var(--accent)` (right of
the title) marking the future Smart Entry assistant entry point (`UX-14`, tracked separately from
this session's `UX-15`).

**Process note.** Three pre-existing harness assertions turned out to be stale — two from v3.36.2
asserting the old light `#F2F5F8` inline sheet background, one from before v3.37.0 asserting a
sheet label should stay dark-on-light — and all three should have been caught as failures during
v3.37.0's own verification, not this session's. They weren't, because that session's harness runs
were checked by tailing the last N lines of output rather than grepping for `FAIL` explicitly.
Fixed this session, and `grep "^FAIL"` (not `tail`) is now how harness output gets checked.

Verified: jsdom harness (zero runtime errors, zero failing assertions across 257 checks —
including the Past Days popup's dark background/border/text-color and the header's two
placeholders) and ESLint no-undef (11/11 baseline, unchanged), both against the fresh build and
the exact shipped `bundle.js`. Not verified: real-device visual contrast and layout — jsdom has
no layout engine.

---

## [3.37.0] — 2026-08-21

Two changes: fixed the manual entry inputs for Water/Protein/Calories (and every other entry
sheet), and switched all Log It!/My Plan tiles and every bottom sheet/modal to dark styling.

**Manual entry input fix.** `.wt-field input` (the numeric field inside the Water/Protein/
Calories/Weight quick-entry sheet, and every other form field in the app) had `background:#fff;
color:var(--ink)` — correct on the old white sheet background, but the investigation this session
found no case where it was actually rendering transparent or unclickable in the current source;
the field was always present and functional. The real risk was contrast drift once the sheet
itself went dark (below): a white-background input on a still-white sheet was fine, but the
brief's hypothesis (a portal-scoped-token bug like the v3.36.2 Log button) didn't match — `wO`,
the shared dial/manual-entry sheet, is not portaled. Rather than leave the input's styling
implicitly dependent on the sheet staying light, it now has an explicit dark background
(`var(--bg)`) and warm-tan text (`var(--ink-inverse)`), matching the new dark sheet exactly so
there's no light-on-light or dark-on-dark scenario possible going forward.

**Dark tiles.** All 8 Log It! tiles and both My Plan tracker-card grids: `background:var(--bg)`
(was `var(--surface)`/`#fff`), full 2px border in the category color on all 4 sides (was a 4px
left-only accent border, v3.35.0) via inline `style.border` replacing `style.borderLeft`. Tile
title, goal, to-go, and logged-amount text switched to `var(--ink-inverse)`. My Plan card title
and goal text likewise.

**Dark sheets.** Every bottom sheet and modal (`wt-sheet`/`wt-modal`, covering the Log It! entry
sheet, manual entry, My Presets, BackfillSheet, the OO preset add/edit modal, PlanSheet-based
sheets including Add Treatment Provider and the Supplements/Treatments expanded lists, the
Tutorial modal, and the Feedback form) now render with `background:var(--surface-dark)` and
`color:var(--ink-inverse)`. Inside sheets: form inputs use `background:var(--bg)`, `color:
var(--ink-inverse)`, `border:1px solid var(--hairline)`; the primary action button (`wt-btn-
primary`) is now `background:var(--accent)` (was `var(--deep)`, which read as near-black on the
new dark sheet); the secondary/cancel button is `background:transparent` with a hairline border;
text-only buttons (`wt-btn-text`, e.g. "Manual or Presets Entry") use `var(--accent)`; preset/
option rows (`wt-preset-row`, `wt-preset-btn`, `wt-preset-add-btn`) use the dark background and
hairline border. The two portaled sheets (BackfillSheet, OO modal) had their hardcoded inline
`background:"#F2F5F8"` changed to `"#151A21"` (matches `--surface-dark`) plus `color:"#FFF6DB"`,
since inline styles override the CSS class and portals can't be trusted to inherit it.

**Follow-on fixes found by inspection, not in the original brief:** two inline `color:
"var(--ink)"` overrides on the Supplements/Treatments section labels inside the expanded-list
sheet, and `.wt-qty-name`'s explicit `color:var(--ink)`, would have rendered as dark-navy text on
the new dark sheet background — effectively invisible. Both switched to `var(--ink-inverse)`.

**Explicitly left alone this session** (per Item 2c, noted rather than chased): `.wt-chip` (used
both inside sheets and on Stats/feedback UI outside them — touching it risked unrelated
regressions), `.wt-empty-note` (used on Log It!/Today pages directly, not just inside sheets;
kept white by design), and the `wS` (`#5C7085`) muted helper-text constant used throughout sheets
for secondary copy — contrast against the new dark background drops to roughly 3.5:1, which is
readable but weaker than its ~5.7:1 on the old white sheet. Worth a follow-up pass if it reads
poorly on a real device.

Verified: jsdom harness (zero runtime errors, 8/8 tiles both tabs, manual entry accepts "32" and
submits, My Presets sheet opens) and ESLint no-undef (11/11 baseline, unchanged) against both the
fresh build and the exact shipped `bundle.js`. Not verified: actual visual contrast/legibility on
a real device — jsdom has no layout engine and cannot render computed colors.

---

## [3.36.2] — 2026-08-21

Real root cause found for the "invisible Log button" report from v3.36.1: renaming "Save" to "Log"
wasn't the actual problem — the button itself has been rendering with a transparent background
this whole time. Built in `src/app.js`, deployed to `site/app/bundle.js` via the full build/
harness/lint pipeline (build clean, harness clean — 8 new assertions added, see below — lint 11,
identical no-undef count before/after and matching the currently-deployed baseline).

### Fixed — BackfillSheet's "Log" button (and OO's "Save preset" button) had a transparent background
Root cause: `.wt-btn-primary`'s `background:var(--deep)` and `.wt-chip.active`'s `background:
var(--deep)` both reference `--deep`, which is defined only inside `.wt-root`'s scope — never
merged into the global `:root` token block, unlike `--ink`/`--muted`/`--success`. `BackfillSheet`
and `OO` both render via `createPortal` to `document.body`, outside `.wt-root`'s subtree, so
`var(--deep)` resolves to nothing there: the property is invalid at computed-value time and
`background` (not an inherited property) falls back to its initial value — transparent. With
`.wt-btn-primary`'s text hardcoded to `color:#fff`, the result was exactly what Rob
described — white text on a transparent background, sitting on the sheet's light surface: visually
gone, but still a real, clickable element (which is why tapping the empty space where it should be
still submitted the entry).

This is the same bug class as the sheet-background fix in v3.34.0 (`--paper` was undefined there
for the same reason) — that fix covered the *sheet's own* background but missed that `.wt-btn-primary`
and the RX-picker's `.wt-chip.active` selected-state (also `var(--deep)`) needed the same treatment,
and that OO — which renders the identical portal pattern — had never actually been checked for this
specific failure mode at all (it wasn't reported, but sharing the exact same structure, it had the
identical bug: OO's own `.wt-modal` background is `var(--paper)`, invisible for the same reason, and
its "Save preset" button and any input/chip borders using `var(--line)` were equally broken).

**Fixed comprehensively, not just the one report**: both `BackfillSheet`'s `.wt-sheet` container and
`OO`'s `.wt-modal` container now locally redefine every `.wt-root`-only custom property their own
descendant elements actually reference — `--deep`, `--line`, and `--paper`, alongside the `--muted`
override already added in v3.34.0. `OO`'s modal also gained the same explicit `background:"#F2F5F8"`
override `BackfillSheet` already had, since `.wt-modal`'s `background:var(--paper)` was equally
broken and had simply never been exercised/reported. Systematically checked every CSS class actually
used inside these two components against the global `:root` token list to confirm no other
`.wt-root`-only variable is still silently unresolved — none found.

### Changed — BackfillSheet's "Log" button now matches Log It!'s Log button exactly
`marginTop` 6px → 16px, matching the quick-dial's `Log ${amount}${unit}` button precisely. Both
already shared the same `.wt-btn-primary` class (`width:100%`, `justify-content:center` built into
the class), so once the background renders correctly the two now look and behave identically, per
Rob's explicit ask.

### Verification
`tools/harness.js`: confirmed jsdom cannot resolve `var()` referencing an inline custom property
set on an ancestor when computing a stylesheet-defined rule (verified empirically with a minimal
reproduction — `getComputedStyle` just echoes the unresolved `var(--deep)` string and falls back to
transparent) — the same jsdom limitation already documented for CSS-variable-scope checks earlier
this project. Verified at the source instead: both containers' inline `style` objects asserted to
literally contain `--deep:#1B4F72`, `--line:#D5E1EC`, `--paper:#F2F5F8`; the Log button's `width`/
`marginTop` asserted directly. All pass against both the working build and the exact shipped
`site/app/bundle.js`, with zero runtime errors.

**Verified:** implemented and confirmed at the source (inline style contents) in the jsdom harness.
**Not yet verified:** on a real device — this is exactly the kind of visual bug jsdom cannot see by
design (no layout/paint engine), so Rob's real-device report is what caught it in the first place.
Please confirm the "Log" button is now clearly visible (dark blue background, white text, full
width) on BackfillSheet, and — since it shares the identical fix — that the "Save preset" button and
any selected (active) RX/Vitamins chip inside the Add/Edit Preset modal are also now visible.

## [3.36.1] — 2026-08-21

Two real-device reports from Rob: the BackfillSheet had no visible submit control, and two spots
of page-level text on My Plan/Settings were missed in v3.36.0's warm-tan adoption pass. Built in
`src/app.js`, deployed to `site/app/bundle.js` via the full build/harness/lint pipeline (build
clean, harness clean — 5 new assertions added, see below — lint 11, identical no-undef count before/
after and matching the currently-deployed baseline).

### Fixed — BackfillSheet ("Enter Missed Items") had no visible submit button
The submit button was always there and functional — labeled **"Save"**, not "Log". Every other
entry flow in the app (Log Items, Log Sleep, Log Weight, Log Exercise…) calls its submit action
"Log", so "Save" didn't read as the thing to tap to finish a backfill; renamed to **"Log"** to match.
No logic changed — same `onClick`, same `disabled: !I` gating (date set + at least one field
filled), same handler.

### Fixed — two page-level text spots still the old muted blue-gray, not the warm tan
Both sit directly on the dark page background (not inside a white card), and were missed in
v3.36.0's `--ink-inverse` adoption pass because that pass worked class-by-class and these two use
one-off inline `style={color: wS}` (the old `#5C7085` constant) instead of a shared class:
- My Plan: "Off trackers stay visible here, dimmed…" caption below the tracker grid.
- Settings: "Notify me (push) when new feedback comes in" label next to the feedback-watch toggle.

Both now use `var(--ink-inverse)`. **Left untouched, correctly**: every other `wS`-colored text in
these two files — confirmed all of it sits inside a white `.wt-card`/sheet (My Plan's Self-Managed
sheet section labels, Settings' "Last backed up"/"Not backed up yet", "Version X", "©
2026…") — those are dark text on white and must stay dark, per the explicit instruction not to
touch text that's already correct.

### Verification
`tools/harness.js` extended: BackfillSheet's submit button now searched for by exact text "Log"
(not "Save"), confirmed present, confirmed disabled with no fields filled and enabled once fields
are filled; the click itself is now scoped to `.wt-btn-primary` elements with exact text "Log"
rather than `clickByText("Log")`'s document-wide substring search — that generic helper would have
matched the bottom nav's "Log It!" tab first (both start with "Log"), which is a real ambiguity in
the *test tooling's* simple text-matching, not in the app itself (a real user taps the specific
button they see, not a fuzzy text search across the whole page) — worth remembering next time a
button gets a common word like "Log" for a name. Both text-color fixes confirmed via inline
`style.color`; the correctly-untouched in-card "Version" text confirmed still carrying its original
color, not `var(--ink-inverse)`. All pass against both the working build and the exact shipped
`site/app/bundle.js`, with zero runtime errors.

**Verified:** implemented and passing in the jsdom harness (simulated browser only) — button
presence/label/disabled-state and the two text colors are all DOM/style-attribute checks.
**Not yet verified:** on a real device — Rob should confirm the "Log" button is now obviously
there and submits correctly, and that both text spots read as the same warm tan as everything else
on their pages.

## [3.36.0] — 2026-08-21

Three visual refinements following v3.35.0 real-device feedback: Log It! icon fill + stat font
sizes, a warm-tan text color for dark backgrounds app-wide, and three My Plan tile updates (toggle
dimming fix, "Target" labels, left border + chip). Visual/style only — no data logic, schema, or
functionality changes. Built in `src/app.js`, deployed to `site/app/bundle.js` via the full
build/harness/lint pipeline (build clean, harness clean — 41 new assertions added, see below — lint
11, identical no-undef count before/after and matching the currently-deployed baseline).

### Fixed — Log It! chip icons rendered dark/black instead of their category color
Each tile's chip `<div>` set `color: var(--<category>)` via CSS, expecting the lucide-react icon
inside to inherit it through `currentColor` — it didn't. Fixed by passing `color: "var(--<category>)"`
directly as a prop to each of the 8 icon components (the same approach already used for My Plan's
chips, confirmed working there via harness in v3.35.0). Chip container size unchanged.

### Changed — Log It! stat line font sizes increased
`.wt-tile-goal` 13px→14px, `.wt-tile-togo` 14px→15px (still weight 700), `.wt-tile-logged`
13px→14px. All 8 tiles confirmed still mounting cleanly with no layout errors at the new sizes.

### Changed — `--ink-inverse` token set to warm tan `#FFF6DB` (was `#E8ECF1`), adopted across dark-bg text
The token itself had been installed in v3.34.0 but never actually used anywhere — this session both
changed its value and adopted it for the first time. Updated: the app header title, the header date
text, section labels/headers on every tab (Today, Stats, My Plan, Settings), the Stats date-range
label (found genuinely unstyled — inheriting dark `--ink` on the dark page background, effectively
invisible; not explicitly requested but squarely the bug class this item targets), and the "Prior
Days:" label on Today. **Left alone, correctly out of scope**: text inside white
`var(--surface)`-background tiles/cards/sheets (still `--ink`, dark, as required); the active nav
tab label (still `var(--accent)` blue); Stats chart axis labels (recharts-managed). **Bottom nav
inactive labels**: changed the base `.wt-nav-btn` rule to `var(--ink-inverse)` rather than touching
the global `--muted` token — `.wt-nav-btn.active`'s own `color:var(--accent)` rule has higher
specificity and is untouched, so the active tab is unaffected; `--muted` itself still reads its old
value everywhere else (confirmed via harness: sheet field labels unaffected).

### Fixed — My Plan: toggling a tile off used to dim its toggle switch and "Track" label too
Per `UX-10`, the toggle must always stay clearly visible so a user knows to tap it back on — but
`.wt-plan-card.off { opacity:.6 }` applied to the whole card, and CSS opacity compounds down a
subtree with no way for a child to opt back in to full opacity. Restructured: the card's dimmable
content (icon, title, goal line, status) now lives in a new `.wt-plan-card-dim` wrapper that alone
carries the `.off` opacity class; the toggle switch + "Track" label moved out to a sibling
`.wt-plan-card-toggle-area`, absolutely positioned in the same top-right spot it always occupied
(`.wt-plan-card` gained `position:relative` to anchor it), so it's structurally impossible for the
card-level dim to reach it. Verified in the harness: toggle a card off, confirm the dim wrapper
carries `.off` while the toggle area doesn't and isn't nested inside anything that does, and that
the switch is still rendered/tappable.

### Added — bold "Target: " prefix on 5 My Plan tiles
Water, Protein, Calories, Sleep, and Exercise now show a bold (`font-weight:700`) "Target: " prefix
before the goal value, only when a real goal is set (matches the existing "Set a goal" fallback
behavior exactly — no prefix on the placeholder text). Weight's own "Target ${x}lbs" string — which
predates this session and isn't actually bolded internally — was left completely untouched per the
brief. RX & Vitamins and Treatments have no goal line and were correctly skipped.

### Changed — My Plan tiles: left accent border + resized/recolored category chip
`.wt-plan-card` gained an inline `borderLeft: "4px solid var(--<category>)"` per tile (reusing the
`iconColor` prop already carrying that value — no new prop needed). The existing 50×50px/12px-radius
chip (light pastel background, saturated icon) was resized to 28×28px/8px-radius and recolored to
the same dark `var(--<category>-chip)` background + `var(--<category>)` icon used by Log It!'s
chips — this **supersedes the v3.35.0 decision** to leave My Plan's `iconBg` alone (that call was
made before this real-device feedback asked for visual parity with Log It!; this session's explicit
instruction takes precedence). 2-column grid and card structure otherwise unchanged; no gem added —
My Plan never had gem illustrations and this session didn't add any.

### Verification
`tools/harness.js` seed extended with `goalWeight:180`/`goalExerciseMinutes:30` (both were 0 by
default, which was silently making the "Target:" prefix check on Exercise, and the "Weight text
still contains Target" check, both meaningless — fixed the test, not the app). New assertions cover,
per item: Log It! icon `stroke` attributes now carry the category `var()`, stat-line CSS font
sizes, all 8 tiles still mount; the CSS rule text for every dark-bg text class asserted against
`var(--ink-inverse)`, the token's `#FFF6DB` value, nav's inactive-vs-active color split, confirmation
`--muted` itself is untouched; every My Plan card's border/chip pairing, chip CSS dimensions, the 5
bold "Target:" prefixes present and Weight's untouched, and a live toggle-off/toggle-on round trip
confirming the dim wrapper and toggle area are structurally independent. All pass against both the
working build and the exact shipped `site/app/bundle.js`, with zero runtime errors.

**Verified:** implemented and passing in the jsdom harness (simulated browser only) — everything
DOM/CSS-text observable: icon color attributes, font-size rules, dimming class structure, bold
prefix presence, border/chip inline styles. **Not yet verified:** anything actually visual — whether
the Log It! icons read as clearly colored (not dark) at a glance, whether all stat text is
comfortably readable, whether the warm tan actually reads warm and legible against the dark
backgrounds across all 5 tabs (and stays dark, unchanged, inside white cards), whether the My Plan
toggle+Track visibly stays bright while the rest of an off card dims, and whether the new smaller
chip + border look right at the 2-column card width. Real-device walk needed, per the brief's own
checklist.

## [3.35.0] — 2026-08-21

Log It! tile restructure plus a category-color-token consistency pass across Log It!, Stats, and
My Plan. Visual-only, as scoped: no ring-fill math, tap handler, entry sheet, or goal formula
changed — only layout and color. Built in `src/app.js`, deployed to `site/app/bundle.js` via the
full build/harness/lint pipeline (build clean, harness clean — 33 new assertions added, see below —
lint 11, identical no-undef count before/after and matching the currently-deployed baseline).

### Added — `--treatment` / `--treatment-chip` tokens
Added to the `:root` block from v3.34.0, sharing the teal hue with `--weight` by design (per the
brief — Treatments didn't have its own token before this session; My Plan and Stats never covers
Treatments as a chart metric, so this was purely additive).

### Changed — Log It! container: single-column vertical stack
`.wt-trackers-grid` (the class shared by both of Log It!'s two tile groups) went from
`display:grid; grid-template-columns:1fr 1fr` to `display:flex; flex-direction:column;
gap:var(--s3)`. The redundant `marginTop:14` inline style on the second group's container was
dropped now that `gap` provides consistent spacing throughout — previously a mismatched extra
14px sat only between tile 4 and tile 5. My Plan's `.wt-plan-grid` is untouched and still 2-column,
confirmed by harness assertion.

### Changed — all 8 tiles restructured to a horizontal layout with left accent border
Applies to Water, Protein, Calories, Sleep, Weight, Exercise, Treatments, and RX & Vitamins — the
designer's spec only named 6, the brief explicitly said apply the same pattern to all 8.
- Outer tile (`.wt-tracker-col`): `flex-direction:row`, `background:var(--surface)` (was `#fff`,
  same effective color, now token-based), `border-radius:var(--radius)`, `padding:var(--s4)`, and a
  per-tile inline `borderLeft: "4px solid var(--<category>)"` — the only property that has to vary
  per tile, so it's inline rather than eight new modifier classes.
- New left column (`.wt-tile-left`, `flex:1`): a header row (`.wt-tile-header`) with a 36×36
  `.wt-tile-chip` (10px radius, tinted `var(--<category>-chip)` background, icon in
  `var(--<category>)`) plus the tile title, followed by three stacked stat lines reusing the
  *exact* existing text/values — `.wt-tile-goal` (13px, `var(--muted)`), `.wt-tile-togo` (14px/700,
  `var(--ink)`), and `.wt-tile-logged` (13px, `#5B6673`) — the last one combines what used to be two
  separate elements (a big 24px number and a small caption below it, e.g. "32" then "oz" then "In"
  as siblings) into one line, same values, same words, no wording changed.
- New right column (`.wt-tile-right`, `flex:0 0 auto`): the existing gauge/gem component, *moved*
  here in the JSX — not re-rendered, not resized, no new props. Its internal ring math (`lO`, the
  shared gauge component) wasn't touched.

### Changed — progress ring fill color now uses the category token
Each of the 8 gauge-wrapper functions (`dO`/`pO`/`mO`/`hO`/`uO`/`fO`/`cO`/`sO`) had their
`ringColor` prop changed from the old shared four-color palette (`mS`/`hS`/`gS`/`yS` — reused
across unrelated metrics, e.g. Water and Treatments both used to share the same blue) to
`"var(--<category>)"`. This is a plain SVG `stroke` attribute, not a `style` prop, but Log It!'s
tiles aren't portaled (unlike v3.33's/v3.34's sheets), so they're normal descendants of `.wt-root`
and inherit `:root`-scoped tokens fine — confirmed via harness by reading the rendered ring's
`stroke` attribute directly. Only the fill arc's color changed; the track/background circle (same
element, same `ringColor`, differentiated only by its existing `opacity:.42`) tracks whatever the
fill uses, exactly as it already did — no separate track color existed to preserve or disturb.
Ring percentage math (`pct`, `strokeDasharray`/`strokeDashoffset`) is untouched — verified in the
harness with the brief's own spot check (64oz goal, log 32oz, ring lands within 1 unit of the
50%-fill dashoffset).

### Changed — color-token consistency audit (Stats, My Plan)
- **Stats**: the combined "All 3" bar chart's three `<Bar>` fills, the single-metric bar chart's
  per-tab color picker, and the Weight/Sleep `<Line>` charts' stroke+dot colors all moved from the
  old shared `mS`/`hS`/`gS`/`yS` constants to the new category hex values (`#2F80ED`/`#27AE60`/
  `#E8823A`/`#16A394`/`#7B61FF`) — hex, not `var()`, per the brief's explicit guidance that recharts
  doesn't reliably resolve CSS custom properties. **Left alone, on purpose**: the green (`hS`) used
  for "goal met" bar highlights and dashed goal-reference lines across multiple different metric
  charts — that's a shared semantic "you hit your goal" color reused intentionally across metrics,
  not a per-category color that drifted; changing it would be a design decision beyond a color-token
  swap and out of this audit's scope.
- **My Plan**: all 8 `TrackerRow` `iconColor` values (the saturated icon color inside each tracker's
  chip) updated to the category token hex — two were meaningfully different hues before this
  (Protein was purple, now green; Treatments was dark green, now teal) rather than just a shade
  off. **`iconBg` (the light pastel chip background) was deliberately left untouched** — there's no
  "light tint" token defined for these categories, only the dark `--<category>-chip` tokens meant
  for Log It!'s new tile chips on a white surface; forcing My Plan's existing light-pastel chips to
  that dark value would be an unrequested redesign, not a color-token alignment.
- **Today**: audited, no drift found. The To Do Today list's Pill/Syringe icons already render in
  neutral `var(--muted)`, not any hardcoded category color — nothing to align.

### Verification
`tools/harness.js` extended with checks per tab: Log It! — all 8 tiles mount with every tracker
enabled, each has the correct left-border/chip-tint/chip-icon-color token trio, the gem sits in a
`.wt-tile-right` column that's the tile's last DOM child, tile/container CSS matches the new
token-based rules; a live spot check (tap the Water tile, log 32oz against the 64oz goal, confirm
the "to go" text and the ring's `stroke-dashoffset` both land at the 50% mark); Today, Stats, and
My Plan each confirmed to mount with zero runtime errors; My Plan's Water chip icon `stroke`
attribute confirmed against the token hex; My Plan's grid confirmed still 2-column. **Not
DOM-verified**: the Stats chart's actual rendered fill colors — recharts' `ResponsiveContainer`
needs a real, non-zero measured container size before it renders any `<Bar>`/`<Line>` children, and
jsdom has no layout engine (everything measures 0×0), so no chart content renders in the harness at
all. Verified instead by reading the shipped bundle's source text directly for the hex values (see
the end-state audit). All DOM-based checks pass against both the working build and the exact
shipped `site/app/bundle.js`, with zero runtime errors.

**Verified:** implemented and passing in the jsdom harness (simulated browser only) for everything
DOM-observable — tile structure, colors-as-attributes, ring math. **Not yet verified:** anything
actually *visual* — whether the gem reads as being on the right and the text on the left at a
glance, whether the left border and chip tint look right against the white tile surface, whether
the single-column list feels right on a real phone screen, and the Stats chart colors specifically
(unverifiable in jsdom for the reason above). This session has more visual surface area than any
previous one — Rob, a full real-device walk of every Log It! tile plus a look at the Stats charts
is especially important before calling this done.

## [3.34.0] — 2026-08-21

Seven items: two bug fixes, a design-token foundation, a page-background sweep, a nav retheme, an
accessibility floor, and the `UX-OPEN-02` backdrop-cascade fix — done in that order since items 4–6
reference the tokens installed in item 3. Built in `src/app.js`, deployed to `site/app/bundle.js`
via the full build/harness/lint pipeline (build clean, harness clean — 37 new assertions added
across all seven items, see below — lint 11, identical no-undef count before/after and matching the
currently-deployed baseline).

### Fixed — BackfillSheet (Enter Missed Items) rendered transparent and overflowed left/right
Root cause: `.wt-sheet`'s `background:var(--paper)` and `.wt-root *`'s `box-sizing:border-box` are
both declared *inside* the `.wt-root` selector's scope, but `BackfillSheet` (and `OO`, since
v3.33.0) render via `createPortal` to `document.body` — outside `.wt-root`'s DOM subtree entirely.
CSS custom-property and `box-sizing` inheritance both follow the DOM tree, not the React tree, so
neither declaration ever reached the portaled sheet: `background` fell back to its initial value
(`transparent`, since it isn't an inherited property), and `box-sizing` defaulted to `content-box`,
so the sheet's `width:100%` plus its own horizontal padding added extra width beyond the viewport.
Fixed by giving the sheet div an explicit inline `background:"#F2F5F8"` (the same value `--paper`
already resolves to elsewhere), plus `right:0`, `margin:0`, and `boxSizing:"border-box"` alongside
the existing `left:0`/`width:"100%"` so the box is anchored on both edges regardless of box model.
`OO`'s equivalent modal never had this specific bug — its `.wt-modal` class already uses a literal
`background:#fff`, not a variable — but is otherwise the same nested-portal pattern.

### Changed — Today tab: bigger, brighter "Prior Days" control
The calendar/clock icon that opens the past-days list was `size:18` in `var(--muted)` (very low
contrast against the black page background). Bumped to `size:24`, recolored to `#fff`, given a
48px×48px tap target, and paired with a new "Prior Days:" label immediately to its left so the pair
reads as one labeled control rather than a bare, faint icon.

### Added — Design token system (`UX-12`)
Installed the v3.34.0 `:root` token block (surfaces, text, accent, one color+chip pair per tracker
category, spacing scale, radius/touch/nav-height, z-index scale) at the top of the CSS, right after
the existing `@import`. Installed at `:root` rather than merged into `.wt-root` specifically so the
tokens also reach portaled sheets/modals (`UX-11`) outside `.wt-root`'s subtree — which is what item
1 above needed and didn't have.
**Merge conflicts, resolved without renaming:** the new spec reuses the names `--ink`, `--muted`,
and `--success` with different values than the existing `.wt-root`-scoped ones. Left both in place
rather than renaming either — CSS custom-property inheritance resolves from the *nearest* ancestor
that sets the property, so `.wt-root`'s own declarations keep winning for every existing element
inside `.wt-root` (nothing already shipped changes appearance); the `:root` values only take effect
for content outside `.wt-root`, i.e. the portaled sheets that previously had no value for these
variables at all. Documented inline in the CSS with a comment explaining why.
**Not done yet (flagged, not fixed — Session 2):** a token-adoption sweep. `src/app.js`'s CSS still
has 33 literal `#fff` card/surface backgrounds and 7 literal `rgba(0,0,0,…)` shadows that now have
token equivalents (`var(--surface)`, etc.) but weren't touched this session, per the brief's explicit
scope.

### Changed — pure-black page/screen backgrounds → `var(--bg)`
The only hard-coded pure black was `--page-bg:#000000` inside `.wt-root`'s own variable block, which
feeds `.wt-root`'s background, `.wt-topbanner`'s background, the topbanner wave's `fill`, and
`.wt-todo-today-sticky`'s background — all genuine page/screen backgrounds, none of them text color.
Repointed to `--page-bg:var(--bg)` (`#0B0F14`, a very dark near-black rather than pure `#000`) so
every consumer picks up the new token through one change. No inline-style or literal `"black"`/
`rgb(0,0,0)` backgrounds existed outside this CSS variable.

### Changed — bottom nav bar dark retheme
`.wt-nav`: `background:#fff` → `var(--surface-dark)`; added `border-top:1px solid var(--hairline)`;
`z-index:200` → `var(--z-nav)` (30 — now below the sheet/scrim range, matching the token spec's
fixed relationship, a deliberate drop from previously being the highest z-index in the app).
`.wt-nav-btn.active`: `color:var(--deep); background:var(--mist)` → `color:var(--accent);
background:var(--accent-chip); border-radius:12px`. Added `aria-current="page"` to whichever tab
button is active (and no attribute on the rest). Text labels were already always-visible and already
11px/weight 600 — no change needed there. Content clearance: `.wt-root`'s hardcoded
`padding-bottom:78px` → `padding-bottom:calc(var(--nav-h) + env(safe-area-inset-bottom, 0px))`, so
page content clears the fixed nav using the same token the nav itself is sized from, instead of a
magic-number approximation.
**Not done (flagged for Rob):** the new `--z-sheet:50` token doesn't match the app's actual existing
sheet/modal z-indices (150–191, several distinct hand-picked levels for stacked nested sheets). Item
5 only asked for the nav's own z-index; renumbering every sheet to the token scale is a separate,
larger change this session didn't attempt.

### Added — accessibility floor
- **Touch targets:** `.wt-icon-btn` (every pencil/trash/close icon button app-wide, including
  Today's Log edit/delete buttons) now has `min-width:var(--touch); min-height:var(--touch)` with
  centered content. `.wt-field input/select/textarea` (every text/number/date field app-wide,
  including the backfill sheet's date field) gained `min-height:var(--touch)` plus explicit
  `box-sizing:border-box` so the min-height is predictable regardless of which sheet it's rendered
  in, portaled or not.
- **Settings 16px inputs:** gave `HO` (the Settings tab's root element) a `wt-settings-tab`
  className and added a scoped rule, `.wt-settings-tab .wt-field input/select/textarea { font-size:
  16px; }`, without touching the shared `.wt-field input` rule's global 15px (used by every other
  sheet in the app). Settings has exactly two visible text inputs (tester name, and one inside the
  account section) — both now covered; the hidden file-input for backup import wasn't touched.
- **Overdue icon:** added a new `AlertCircle` import (lucide-react), rendered at `size:12` inline
  before the "N days overdue" text in Today's To Do list, scoped to `"overdue" === e.status.state`
  only. Existing red/coral color (`var(--danger)` via `.wt-treatment-overdue`) is unchanged — the
  icon is additive, not a replacement.
- **Muted-text contrast, two specific instances:** the shared `.wt-field` label rule uses
  `color:var(--muted)`. Inside `OO` and `BackfillSheet` (both portaled, both on light/white
  backgrounds), that variable now resolves to the *new* `:root`-scoped `--muted` (`#8A97A6`,
  ~2.98:1 against white — fails 4.5:1) rather than the existing `.wt-root`-scoped one (`#5C7085`,
  ~5.11:1 against white — passes) that every other sheet in the app still correctly gets. Rather
  than touching the global token (explicitly forbidden) or hand-editing every individual label,
  added one inline `"--muted": "#5C7085"` custom-property override on each portaled sheet's own
  outer container — it locally re-establishes the safe value for every `var(--muted)` reference
  inside that subtree, portaled or not, present or future.

### Fixed — `UX-OPEN-02`: OO modal backdrop click no longer cascades to the parent Log sheet
One-line fix: `OO`'s backdrop `onClick` now calls `e.stopPropagation()` before `onClose()`. Since
React portals bubble events through the *React* tree (not the DOM tree) and `OO` is declared as a
direct child of the Log sheet's own outer backdrop, an unstopped click on `OO`'s portaled backdrop
was reaching the Log sheet's own backdrop handler and closing both in one action.
**Flagged, not fixed:** while verifying this, found that the non-portaled "My Presets" backdrop's
own `onClick` (`() => setShowPresetsSheet(false)`) does *not* actually call `stopPropagation`,
despite the decision log's `UX-11` entry describing it as already having one "for this exact
reason." If that's still accurate for some other reason not visible in the current code, no action
needed; if not, My Presets' own backdrop likely has the same cascade bug independently — worth a
quick real-device check.

### Verification
`tools/harness.js` seed extended with a second supplement (`OverdueMed`, `nextDueOverride` set
several days in the past) to exercise the overdue-icon check. New assertions cover: BackfillSheet's
background/anchoring/box-sizing; the "Prior Days:" label and icon size/color; every `.wt-nav`/
`.wt-nav-btn.active` CSS property against the new tokens, `wt-nav` mounting on all 5 tabs,
`aria-current` on the active tab only; the page container's nav-clearance padding; the overdue row's
icon presence alongside its text; the `.wt-icon-btn`/`.wt-field input` touch-target CSS; the
Settings-scoped 16px font-size rule; and — the key regression test for item 7 — that clicking `OO`'s
backdrop now leaves both the parent Log sheet and the nested My Presets sheet open, closable only
via their own Close buttons. All pass against both the working build and the exact shipped
`site/app/bundle.js`, with zero runtime errors.

**Verified:** implemented and passing in the jsdom harness (simulated browser only), including CSS
property assertions read directly from the stylesheet text and inline style checks on rendered
elements. **Not yet verified:** on a real device — jsdom has no layout engine, so nothing about
actual pixel positioning, overflow, or visual contrast was measured; Rob should specifically check
BackfillSheet renders fully opaque with no horizontal scroll/clipping, the nav bar's new dark
styling and active-tab pill read correctly, the brighter "Prior Days" control is legible, and that
tapping OO's backdrop now leaves the Log sheet open as expected.

## [3.33.0] — 2026-08-21

Two changes, same root cause: the "OO" (add/edit preset) modal nested-position bug, plus a new
"Enter Missed Items" backfill feature that reuses the fix pattern established fixing it. Built in
`src/app.js`, deployed to `site/app/bundle.js` via the full build/harness/lint pipeline (build
clean, harness clean — 39 new assertions added across both parts, see below — lint 11, identical
no-undef count before/after and matching the currently-deployed baseline).

### Fixed — OO (add/edit preset) modal rendered nested, same bug class as the My Presets sheet
`OO` is invoked from two places, both several sheets deep: inside the "My Presets" sub-sheet on
Log It! (itself nested inside the main Log sheet), and inside My Plan's "Self-Managed" sheet.
Unlike the My Presets fix in v3.31.0 (a `position:fixed` + escalating `z-index` override on the
nested sheet), this time the fix is structural: `OO` now renders via `createPortal` (imported from
`react-dom`) straight to `document.body`, with an explicit `zIndex:180` on its own backdrop —
so its DOM position no longer depends on which sheet happens to be its ancestor, at any nesting
depth, from either call site. This is the pattern the task asked to establish here and reuse in
Part B below, rather than adding yet another z-index patch that would need bumping again the next
time something nests one level deeper.

One behavioral note surfaced by testing, not introduced by this fix: because React portals bubble
events through the *React* tree rather than the DOM tree, and `OO` is declared as a sibling of the
"My Presets" block (a direct child of the Log sheet's own outer backdrop) rather than a descendant
of it, clicking OO's backdrop to dismiss it also closes the whole Log sheet in one action — the
same backdrop-click cascade the non-portaled "My Presets" backdrop already has today (neither
backdrop's `onClick` calls `stopPropagation`). Flagging this now rather than letting it go
unnoticed; not fixed here since it's pre-existing and outside this task's scope.

### Added — "Enter Missed Items" (backfill past-day entries)
Today → calendar icon → All Past Days → tap a day → the previously read-only past-day view now has
an "Enter Missed Items" button at the top. It opens a new sheet — `BackfillSheet`, portaled to
`document.body` the same way as `OO` above, so it can't repeat this bug class a third time — with:

- An editable **Date** field, pre-filled with the day being viewed but changeable to *any* date
  (no lower bound), which is how a user reaches a day with zero existing entries — those don't
  show up in All Past Days at all.
- One control per **enabled** tracker only (respects the same My Plan on/off toggles Log It! reads):
  Water/Protein/Calories as independent amount + optional description fields, Sleep as a plain
  numeric hours field (no start/finish session — that flow is a real-time mechanism and meaningless
  retroactively), Weight as a single value, Exercise as minutes, and RX & Vitamins as a tap-to-select
  chip list (same interaction as the live supplement logger) with quantity defaulting to `"1"`.
  **Treatments are excluded entirely in v1** — no control, disabled or otherwise.
- One **Save** button that writes whichever fields were filled in as separate log entries on the
  chosen date, all timestamped `12:00 PM` / `timeMinutes:720` (no time-of-day field in v1).

Every backfilled entry gets `backfilled: true` and `enteredAt` (the actual wall-clock save time,
distinct from the entry's log date) — added as plain fields on the entry object at creation, which
survive reload untouched because they flow through the existing versioned entry-migration path
(`BS`/`$S`, called from `migrate()`) rather than needing a hand-maintained field list: entries with
an explicit `type` (sleep/weight/supplement/exercise) already pass through that migration
unmodified, and the water/protein/calories combo shape already matches the "return as-is" branch
since it always sets `oz`/`grams`/`calories` (never `undefined`). Backup export/import needed no
changes either — both serialize `logs` wholesale with no per-field allowlist.

Business rules, verified end-to-end in the harness:
1. **Inventory**: a backfilled RX & Vitamins dose decrements the same way a live dose does, via the
   existing `KS` inventory-adjustment helper, clamped at 0.
2. **Schedule**: backfilling deliberately skips the `lastTakenDate`/`nextDueOverride` update that
   live supplement logging performs — the forward due-date schedule is untouched by design.
3. **Today's state**: entries land in `logs[<chosen date>]`, never in today's log key (unless a
   user explicitly picks today), so Today's "To Do Today" list and the Log It! RX & Vitamins tile's
   "taken today" ring are provably unaffected by a backfill to a past date.
4. **No celebrations**: the save path is a new `saveBackfill` function, entirely separate from the
   live water/protein/calorie logger's goal-hit toast logic — backfilling never fires a 🎉 toast,
   only a plain confirmation.
5. **Delete/edit parity**: past-day entries (backfilled or not) are now deletable from the past-day
   view — `IO`, the shared log-row renderer, gained a decoupled `canDelete` parameter (defaulting to
   the existing `canEdit` flag, so the "Today's log" call site is unchanged) so past-day rows can
   offer delete without also exposing edit, which still assumes "today" throughout the rest of the
   app. Deleting a backfilled dose goes through the same `me()` delete function live entries use,
   which already restores inventory generically off `entry.type`/`entry.items` — no backfilled-only
   branch was needed, and none was added.

### Verification
`tools/harness.js` seeded with a tracked supplement and one log entry on a prior date. New steps:
open `OO` from the My Presets flow and assert its backdrop's `parentElement` is `document.body`
directly (not nested) with `zIndex:180`; open `BackfillSheet` from a past day, assert the same
portal placement; set a date ten days back (not already in the seed) plus protein, calories, sleep,
and one RX & Vitamins item, save, and assert: the entries landed on the new date (not today) with
`backfilled:true`/`enteredAt` set and `12:00 PM`/`720` timestamps; today's log length and the RX
tile's "taken today" count are unchanged; the supplement's inventory dropped 10→9 while
`lastTakenDate`/`nextDueOverride` stayed `null`; the supplement still shows as due in Today's To Do
list (proving it wasn't silently marked done); the newly-backfilled day now appears in All Past
Days; its entries render with a delete button and no edit button; and deleting the backfilled
supplement dose removes it and restores inventory 9→10. All pass against both the working build and
the exact shipped `site/app/bundle.js`, with zero runtime errors.

**Verified:** implemented and passing in the jsdom harness (simulated browser only), including the
full inventory-decrement-then-restore round trip. **Not yet verified:** on a real device — Rob
should check that the OO and BackfillSheet portals render/position correctly in a real browser (not
just "not nested in the DOM," which jsdom can confirm, but actually visually centered/bottom-sheeted
and above everything else), and should decide whether the backdrop-click-cascade behavior noted
above is worth fixing separately.

## [3.32.1] — 2026-08-21

Spacing-only fix on top of v3.32.0. Built in `src/app.js`, deployed to `site/app/bundle.js` via the
full build/harness/lint pipeline (build clean, harness clean — one new assertion added, see below —
lint 11, identical no-undef count before/after and matching the currently-deployed baseline).

### Fixed — too little space between the Log It! tracker grid and the presets button
`.wt-action-btns` had no top margin, so on Log It! the gap between the bottom row of tracker tiles
and the "Use Your Presets or Log a Meal" button came only from `.wt-trackers-grid`'s existing
`margin: 8px 0 6px` (6px) — visibly tight. Added `margin-top: 16px` to `.wt-action-btns`, reusing
the 16px value already used elsewhere on the same screen (`.wt-card`'s `margin-bottom`, the sheet
paddings) rather than introducing a new spacing constant. `wt-action-btns` is used in exactly one
place, so the change is scoped to Log It! only.

### Verification
`tools/harness.js` extended with one assertion reading the `.wt-action-btns` CSS rule directly and
confirming `margin-top:16px` is present. Passes against both the working build and the exact shipped
`site/app/bundle.js`, with zero runtime errors. As always, jsdom has no layout engine — the actual
visual gap on a real device is unverified.

**Verified:** implemented and the CSS rule confirmed present in the harness (simulated browser
only). **Not yet verified:** the actual on-screen spacing on a real device — Rob should eyeball Log
It! to confirm 16px reads as "roughly right" and not too much/too little.

## [3.32.0] — 2026-08-21

Two fixes on My Plan. Built in `src/app.js`, deployed to `site/app/bundle.js` via the full
build/harness/lint pipeline (build clean, harness clean — nine new assertions added, see below —
lint 11, identical no-undef count before/after and matching the currently-deployed baseline).

### Fixed (CRITICAL) — toggling a tracker off on My Plan permanently trapped it
`PlanGrid` derived one boolean per tracker (`showWater`, `showTreatments`, etc.) and used it both
as the `on` prop passed to `TrackerRow` *and* to gate whether `TrackerRow` rendered at all
(`X && React.createElement(TrackerRow, {...})`). Turning a tracker off made that boolean `false`,
which unmounted the card instead of just dimming it. Since the standalone "show hidden trackers"
affordance was removed in the 2-column redesign (`UX-OPEN-01` Phase 1d, v3.27.0 — see decision log
entry, superseding the original "Show all trackers" link plan), there was no longer any way to
reach an off tracker's toggle once it disappeared — a permanent trap for anyone who tapped it.
Fix: all 8 `TrackerRow` cards (Water, Protein, Calories, Sleep, Weight, Exercise, RX & Vitamins,
Treatments) now render unconditionally, in fixed order, on every render; only the `on` prop (already
wired to the existing `.wt-plan-card.off` dimmed styling) changes with the toggle. Log It! is
unaffected — it derives its own independent `showX` booleans at line ~2190 and continues to filter
off trackers from that list. Also removed a dead `.wt-plan-show-hidden` CSS rule left over from the
already-superseded "show hidden trackers" link; no JS state or handlers for it were found (already
removed in v3.27.0), only this orphaned style survived.

### Fixed — app header now goes full black
`.wt-topbanner`'s `background` changed from the `linear-gradient(135deg, #0B4F72 0%, #158FB0 52%,
#35D6E8 100%)` banner to `var(--page-bg)` (the same black used for the page body since v3.29.0), so
the droplet logo sits directly on black with no card/plate/gradient behind it. The "HydroPro
Tracker" wordmark was already `#fff` — no change needed there. Also updated
`site/app/index.html`'s `<meta name="theme-color">` and `site/app/manifest.json`'s `theme_color`
from `#1B4F72` to `#000000` so the phone status bar matches instead of showing the old blue above a
now-black header (`apple-mobile-web-app-status-bar-style` was already `black-translucent` and
needed no change).

### Verification
`tools/harness.js` STEPS extended with a seed that boots with `showWater: false, showTreatments:
false`, then: confirms My Plan renders all 8 cards with fixed order and the seeded-off cards dimmed;
toggles Water on and confirms 8 cards persist, the card un-dims, `settings.showWater` persists
`true`, and the Log It! tile reappears; toggles Water back off and confirms the round-trip lands
back at 8 cards, off again; repeats the on-toggle for Treatments (the other seeded-off tracker); and
asserts the `.wt-topbanner`/`.wt-topbanner-title` CSS rules directly for no gradient, `page-bg`
background, and `#fff` wordmark color. All pass against both the working build and the exact shipped
`site/app/bundle.js`, with zero runtime errors.

**Verified:** implemented and passing in the jsdom harness (simulated browser only). **Not yet
verified:** on a real device — Rob should confirm the phone status bar color and the header's actual
appearance in a real browser, since jsdom has no layout engine for anything visual.

## [3.31.0] — 2026-08-21

Three fixes on top of v3.30.0. Built in `src/app.js`, deployed to `site/app/bundle.js` via the
full build/harness/lint pipeline (build clean, harness clean — three new assertions added, see
below — lint 11, identical no-undef count before/after).

### Fixed — "My Presets" sheet rendered invisible (real bug, not a color issue — predates v3.30.0)
The sheet was nested as a DOM child of `xO`'s own outer `.wt-sheet` (`overflow-y:auto; max-height:
75vh`), sharing its class's base `z-index:160` with no positioning override — so it rendered
invisibly on real devices while still updating state correctly (which is why the v3.30.0 harness
test passed even though the button was already broken; jsdom has no layout engine to catch this
class of bug). Gave the nested backdrop `z-index:170` and the nested sheet `position:fixed;
z-index:171; bottom:0; left:0; width:100%` inline so it escapes the parent sheet's stacking/scroll
container instead of relying on flex layout inherited from an ancestor it's no longer really inside
of. Also added `touch-action:none` to `.wt-backdrop` and `overscroll-behavior:contain` to
`.wt-sheet`/`.wt-modal` app-wide so scroll gestures on an open sheet don't leak through to the page
behind it. New harness assertions check the nested sheet's inline `position`/`zIndex` directly.
**Not fixed**: the "Add/Edit preset" modal (`OO`) that opens from inside this same sheet is nested
the same way and wasn't touched — flagging it now rather than waiting for the next bug report.

### Fixed — v3.30.0 accidentally whited out text inside cards and sheets
Root cause: v3.30.0 set `.wt-root`'s own `color` to `#fff` for the new black page background.
Several containers that don't set their own explicit text color — sheet/modal headers
(`.wt-sheet-header h3`), `.wt-card`, `.wt-card-title`, and others — were inheriting that white
color straight through onto their light `--paper` surfaces, making that text unreadable. Reverted
`.wt-root`'s inherited `color` back to `var(--ink)`; the background-level text that's deliberately
white (`.wt-date`, `.wt-date-label`, `.wt-section-label`, `.wt-section-label-strong`,
`.wt-plan-section-label`) already carries its own explicit color and is unaffected by this revert.
Separately, two literal `.wt-section-label` instances *inside* the "Self-Managed" `PlanSheet`
("Supplements & Prescriptions", "Treatments") needed an explicit inline `color: var(--ink)`
override, since that generic class itself is styled white for its (more common) page-background
usage elsewhere — this was a real second bug, not just inheritance. New harness assertion opens
that sheet and checks the label's inline color directly.

### Fixed — stray line above "Use Your Presets or Log a Meal"
A `.wt-divider` (`border-top:1px solid var(--line)`) was rendered directly above `.wt-action-btns`
on the Log It! page — invisible on the old light background, glaring on the new black one. Removed
that one instance; the divider element/class is still used correctly elsewhere (chart sections,
etc.) and was left alone. New harness assertion checks `.wt-action-btns`'s previous sibling is not
a divider.

jsdom still has no layout engine — needs Rob's eyes on a real device (specifically Safari/iOS,
since nested `position:fixed`-inside-`overflow` bugs are a known WebKit quirk) to confirm the sheet
is now actually visible and none of these fixes look wrong.

## [3.30.0] — 2026-08-21

Built in `src/app.js`, deployed to `site/app/bundle.js` via the full build/harness/lint pipeline
(build clean, harness clean — including a new preset-add/edit/delete round trip — lint 11,
identical no-undef count before/after).

### Investigated — "Edit Presets" button reported dead on tap
Traced the full chain in `xO` (the shared log-entry/preset sheet): the button's `onClick`, the
`showPresetsSheet`/`setShowPresetsSheet` state pair, the conditional sheet render, and the
`presets`/`onAddPreset`/`onEditPreset`/`onDeletePreset` props at the single call site. Everything
is correctly wired and matches the fix already shipped in v3.29.0. Rebuilt `src/app.js` and
confirmed byte-for-byte identical to the previously deployed `bundle.js`, so there was no
source/deployed drift to explain it either. Strengthened the harness test to add a preset, then
assert the row renders with visible edit and delete buttons, then delete it — full round trip
passes clean. **No code change made** — didn't find a bug to fix. Most likely explanation per the
caching lesson above: a stale cached bundle predating v3.29.0 on the reporting device. Needs Rob to
confirm on a real device after this deploy (force-refresh / reinstall if the nav bar still shows
the old version number) whether the button now works — if it's still dead after a confirmed-fresh
load, we need exact repro steps and device console output, because static analysis found nothing.

### Changed — page background is now black
`.wt-root`'s background moved from `--paper` (`#F2F5F8`, light) to a new `--page-bg` (`#000000`)
variable, along with `.wt-topbanner-wave path` and `.wt-todo-today-sticky`, which shared `--paper`
purely to blend with the page background and would otherwise show as light patches against the new
black. Cards (`.wt-card`, `.wt-tracker-col`, `.wt-plan-card`, `.wt-regimen-card`) and sheets/modals
(`.wt-sheet`, `.wt-modal`) still use the original `--paper` value directly and are unaffected — they
keep their white/light surfaces with existing dark text. Text sitting directly on the page
background switched to white/near-white: `.wt-date`, `.wt-date-label` (the "Day Planner:" /
"My Plan for:" style header), `.wt-section-label`, `.wt-section-label-strong`, and
`.wt-plan-section-label`. The `.wt-doctor-share-overlay` (Share with Doctor / print view) was left
untouched — it's a separate printable screen, not part of the main page background, and CLAUDE.md
flags print CSS as previously fragile.

**Not audited**: other background-level text I didn't find named in scope, e.g. `.wt-btn-text`'s
`var(--deep)` (dark navy) — if any such text turns out to sit directly on the new black background
rather than inside a card, it may also need a contrast fix. Flagging so it doesn't get missed.

jsdom has no layout engine, so none of this was visually verified — needs Rob's eyes on a real
device or a Playwright screenshot pass to confirm contrast and that nothing looks broken.

## [3.29.0] — 2026-08-21

Two fixes on top of v3.28.0. Built in `src/app.js`, deployed to `site/app/bundle.js` via the
full build/harness/lint pipeline.

### Fixed — My Plan tracker bottom sheet (`TrackerSheet`) still hidden behind nav bar
The v3.28.0 fix raised `.wt-sheet`'s bottom padding to 88px, but `TrackerSheet` renders with
`className: "wt-sheet wt-plan-bottom-sheet"` — and `.wt-plan-bottom-sheet { padding-bottom:24px;
}`, declared later in the stylesheet, has equal CSS specificity to `.wt-sheet` and won cascade
tie-break by source order, silently overriding the fix for this one sheet. Added `style: {
paddingBottom: 88 }` inline on `TrackerSheet`'s content div, which wins regardless of class
cascade order. Confirmed via a new harness step that opens a My Plan tracker card and reads
`sheetContent.style.paddingBottom` directly off the rendered node — asserts `"88px"`. Worth
checking `.wt-sheet-tall` and any other modifier class combined with `.wt-sheet` for the same
class-order trap; none found this pass (`.wt-sheet-tall` only sets `max-height`/`overflow-y`, no
padding conflict).

### Changed — "Edit Presets" now opens an inline sheet instead of navigating away
Reverted the `a("setup")` tab-switch from v3.28.0. The link no longer leaves Log It! at all.
Added local state to `xO` (the shared log-entry/preset sheet): `showPresetsSheet` for a new "My
Presets" bottom sheet (header + close, the full preset list with edit/delete buttons, an "Add
Preset" button), plus `presetModalOpen`/`presetEditTarget` for a fresh `OO` (add/edit preset
modal) instance — reusing the same `OO` component definition My Plan already used, just a second
instantiation local to `xO`, since `xO` and `WO` (My Plan) are never mounted at the same time and
`WO`'s local sheet state couldn't have been triggered from Log It! anyway.

The actual preset-mutation logic (`onAddPreset`/`onEditPreset`/`onDeletePreset`) was hoisted out
of the inline closures previously declared only inside `WO`'s prop object into three named
functions — `addPreset`, `editPreset`, `deletePreset` — declared once in the top-level app
component alongside `pe`/`he`/`ge`/`me`. Both `WO` and `xO` now receive the same function
references as props, so the two "preset management" surfaces (My Plan's, and this new inline one)
can never drift out of sync with each other.

**This resolves the dead end flagged in v3.28.0** — removing the Quick Presets card from My
Regimen no longer strands "Edit Presets" with nowhere to go; it now manages presets on the spot.

## [3.28.0] — 2026-08-21

Follow-up on v3.27.0 based on Rob's real-device feedback. Built in `src/app.js`, deployed to
`site/app/bundle.js` via the full build/harness/lint pipeline.

### Fixed — sheet/popup content hidden behind bottom nav bar
`.wt-sheet` bottom padding 26px → 88px, clearing the nav bar height (~56px) plus safe area on
every bottom sheet in the app. `.wt-backdrop` gained `padding-bottom:env(safe-area-inset-bottom,
0px)` for the iPhone home-indicator inset.

### Removed — "Log a Meal" button and sheet
Reverted from v3.27.0 — button, its bottom sheet, and all five pieces of related state
(`showMealSheet`, `mealName`, `mealWater`, `mealProtein`, `mealCalories`) removed from `MO`. The
now-unused `UtensilsCrossed` import and the `onLogMeal` prop/wiring were removed with it.

### Changed — "Use Your Presets" renamed and made full width
Now reads "Use Your Presets or Log a Meal" and spans the full tile-grid width. `.wt-action-btns`
changed from `display:flex; gap:12px; padding:0 16px 16px` to `display:block; padding:0 0 16px`
— **the horizontal padding was dropped, not just the display mode**, because the tile grid above
it has no horizontal padding of its own (it inherits `.wt-frame`'s 18px inset directly); keeping
`16px` here would have left the button sitting 16px further in than the grid on both sides,
directly contradicting the "align left/right edges with the tile grid exactly" requirement. Also
dropped the now-dead `.wt-action-btn.meal` gradient rule.

### Added — "✏ Edit Presets" link in the preset/log sheet
Small centered teal text button in `xO` (the shared preset-and-manual-entry sheet), shown
whenever the sheet isn't editing an existing log entry. Closes the sheet and navigates to the
My Plan tab (`onEditPresets` → `a("setup")`, the same tab-switch state the rest of the app uses).
**Worth Rob's attention:** this button currently has nowhere useful to land — see the My Regimen
→ My Treatments entry below, which removes the only preset-management UI that existed.

### Removed — Quick Presets card from My Plan → My Regimen
The `RegimenSummaryCard` for presets, the `"presets" === expandedList` branch, and its expanded
`PlanSheet` (preset list, edit/delete buttons, "Add preset" button) are gone, along with the now-
unused `presetPreview` computation. **Flagging a real conflict, not just a note:** this was the
only place in the app to add, edit, or delete a preset. The "✏ Edit Presets" link added in this
same release now navigates to a page with no preset-management UI left on it — a dead end. The
underlying add/edit-preset modal (`OO`) and its trigger state are still wired into `WO` but are
now unreachable from any button, since their only triggers lived inside the markup just removed.
Left in place rather than deleted outright, since removing them wasn't asked for and doing so is
a bigger structural call — but this needs a decision: either restore some preset-management entry
point on My Plan, or point "Edit Presets" somewhere else, or delete the orphaned `OO`
plumbing outright.

### Changed — "My Regimen" section renamed "My Treatments"

### Changed — "Add Treatment Provider" replaces "+ Add Partner"
Button label only. The sheet it opens (a `PLACEHOLDER` — no data model wired) still titles itself
"Add Partner" and asks for "Partner/Clinic name" / "Request Partnership" — not touched, since only
the trigger button was in scope. Worth a consistency pass later.

### Changed — My Plan tracker card layout
Icon size in `TrackerRow` 28px → 22px. Top row restructured to a single flex row (icon, title,
then the toggle column pushed right via `margin-left:auto`) instead of two nested flex groups
with `justify-content:space-between` — visually equivalent, moves the title left relative to the
smaller icon, matches the exact implementation Rob specified.

## [3.27.0] — 2026-08-20

`UX-OPEN-01` Phase 1d — cosmetic fixes and two new Log It! action buttons, built in
`src/app.js` and deployed to `site/app/bundle.js` via the full build/harness/lint pipeline.

### Changed — "RX & Supplements" renamed to "RX & Vitamins"
All 4 user-facing occurrences (Log It! tile, My Plan tracker row, and the tracker-detail sheet
title used in two places). Settings keys (`showSupplements`, `supplements`, etc.) unchanged.

### Added — "Use Your Presets" and "Log a Meal" action buttons on Log It!
Two side-by-side buttons below the tile grid. "Use Your Presets" (amber) opens the existing
preset-capable log sheet fresh, with no entry being edited and no quick-dial value carried in —
the same sheet already used elsewhere in the app, just newly triggered from Log It!. "Log a Meal"
(teal) opens a new bottom sheet with an optional meal-name field and three numeric inputs
(water/protein/calories); "Log This Meal" writes one combined log entry via the existing `pe()`
log-entry function, the same one every other quick-log path in the app uses. A field only
contributes to the entry if it's non-empty and > 0; if all three are empty, nothing is logged.

### Changed — My Plan tracker card title font size
`.wt-plan-card-title` 17px → 14px. Icon, goal text, and status pill sizing unchanged.

### Changed — "Track" label added under each My Plan toggle
Small 10px label beneath the on/off switch in `TrackerRow`, always visible.

### Changed / reversed decision — off-trackers are always visible on My Plan now
Removed the `showHiddenTrackers` state and the "Show hidden trackers" / "Hide inactive trackers"
button entirely. All 8 `TrackerRow`s now render unconditionally, dimmed via the existing
`.wt-plan-card.off` styling (`opacity:.6`, unchanged — it already satisfied the brief's
"opacity:.6 or similar" bar). **This reverses the Aug 20 decision-log entry** ("Off-trackers
hideable entirely — collapsed rows, 'Show all trackers' link," `UX-OPEN-01` §8) — flagged to Rob
before building and confirmed to proceed. Decision-log update below. The helper paragraph under
the tracker grid was reworded to match: off trackers now stay visible (dimmed) on My Plan but are
still hidden on Log It!, and still counted in Reports.

### Changed — removed vertical accent stripe on My Plan section headers
`.wt-plan-section-label` no longer has `border-left:3px solid var(--teal)`. `padding-left:12px`
was deliberately left in place (not called out for removal), so header text sits slightly
indented even without the stripe — worth Rob's eyes on whether that indent should also go.

### Changed — Settings page field order
"Your name" input now renders above "How to use this," reversed from before. No styling changes.

## [3.26.0] — 2026-08-20

`UX-OPEN-01` follow-up — three targeted fixes on top of Phase 1c's tile sizing, built in
`src/app.js` and deployed to `site/app/bundle.js` via the full build/harness/lint pipeline.

### Changed — Log It! tracker tiles enlarged
`.wt-tracker-col` min-height 132px → 160px, padding 12px → 16px; label 16px → 18px, value
22px → 24px; the gauge ring inside each tile 82px → 103px; all eight lucide tracker icons
16 → 22px.

### Changed — My Plan card icon container enlarged 25%
`.wt-plan-card-icon` (the circular icon background behind each `TrackerRow` icon) 40px → 50px,
matching the same tile-enlargement pass.

### Fixed — My Plan grid horizontal overflow
`.wt-plan-grid` and `.wt-plan-card` gained explicit `width:100%`/`min-width:0` plus
`box-sizing:border-box`, and the My Plan tab's root now wraps in a `div` with
`overflowX:hidden`, so the larger cards can no longer push the page wider than the viewport.

### Changed — bottom-sheet stacking and sizing
`.wt-nav` z-index 40 → 200, `.wt-backdrop` 50 → 150, `.wt-sheet` gains an explicit z-index:160.
`.wt-sheet` also gains `max-height:75vh; overflow-y:auto` and switches `max-width` from a
hardcoded 420px to `100%` (plus `box-sizing:border-box`) so long sheet content scrolls instead
of overflowing. **Note for Rob's real-device check:** `.wt-sheet` is shared by every bottom
sheet in the app (not just My Plan's `TrackerSheet`), so this affects all of them. Also worth
double-checking on a real device: nav (200) now stacks *above* backdrop (150) and sheet (160) —
inverted from the previous ordering where the backdrop (50) covered the nav (40). If any sheet
is meant to fully obscure the bottom nav while open, this ordering will look wrong even though
it was built exactly as specified.

## [3.25.0] — 2026-08-20

`UX-OPEN-01` Phase 1c — six targeted visual polish changes across My Plan, Log It!, Today, and
Stats, built in `src/app.js` and deployed to `site/app/bundle.js` the same day via the build
pipeline. Also corrects the Settings-footer version string, stale at `"3.13.0"` since before this
session's work began — now reads the real version.

### Changed — tracker cards use Log It!'s own icons, now in color
Investigated first, per instructions: Log It!'s tile icons (including Weight/Exercise/Treatments/
Supplements) were never custom image assets — all eight are the same `lucide-react` components
already used by My Plan's `TrackerRow`. No icon-source work was needed; only added a per-tracker
background-tint + icon-color pair via inline style on `.wt-plan-card-icon`, one color set per
tracker as specified.

### Changed — toggle moved to the tracker card itself; sheet now goal-only
The on/off toggle now lives top-right on each `TrackerRow` card and fires `onToggle` directly via
`e.stopPropagation()`, without opening the bottom sheet. `TrackerSheet` dropped its "Show on Log
It!" row entirely — title, close, goal input (if applicable), Save only.

**Bug caught during this change, before it shipped anywhere:** the toggle `<button>` was originally
nested inside the card's own `<button>` — invalid HTML that jsdom/browsers silently restructure,
breaking click targeting unpredictably (confirmed empirically: a scratchpad test showed tapping the
card body stopped working after the toggle was used). Fixed by making the card a `<div>` with
`onClick` (matching the existing `.wt-tracker-col-clickable` pattern already used for Log It!
tiles) instead of a nested interactive element.

**Separately caught:** an unbalanced extra `)` in the rewritten `TrackerSheet` that `node --check`
did not flag but `esbuild` correctly rejected outright — a reminder that a Node syntax check alone
isn't sufficient for this file; the actual build is the real gate.

### Changed — goal input in the bottom sheet is now much larger
New `.wt-plan-goal-input` (28px/700/centered, 64px min-height) and `.wt-plan-goal-unit` (16px
secondary-color label below the input, e.g. "oz / day") replace the default `.wt-field` input
styling inside `TrackerSheet` only — the global `.wt-field` is untouched. Save button gets
`.wt-plan-save-btn` (56px min-height, 17px/700).

### Changed — Quick Presets and Self-Managed cards get colored icons
`RegimenSummaryCard` gained `iconBg`/`iconColor` props, applied via inline style on a new
`.wt-plan-card-icon`-styled container (reused from the tracker cards, sized down). Presets: `Zap`,
`#F9A825`/`#FFFDE7`. Self-Managed: new `Users` icon (added to the `lucide-react` import block,
already an installed dependency), `#00695C`/`#E0F2F1`.

### Changed — Log It! tiles bigger, more defined border
Investigated first: no `.wt-tile` class exists — the real class is `.wt-tracker-col`, and it had
**no explicit `min-height` at all**, so "increase by ~20%" had no baseline to compute from. Added
`min-height:132px` as a deliberate choice rather than an unmeasurable percentage (jsdom can't
measure real rendered height either — same layout-engine limit as every visual change this
session). Border: `1px solid var(--line)` → `2px solid rgba(11,32,56,.15)`. Padding: `8px 4px` →
`12px 8px`. No font-size changes, per instruction.

### Changed — Today and Stats section headers, bolder
New `.wt-section-label-strong` (`font-size:14px; font-weight:700; color:var(--ink);
letter-spacing:.01em;`) appended alongside the existing `.wt-section-label` class at the two
`.wt-section-label` call sites in `RO` (Today) and the one in `FO` (Stats) — component names
corrected from the brief's assumed `GO`/`DO`. Global `.wt-section-label` and My Plan's separate
`.wt-plan-section-label` both untouched.

### Testing
Full six-step pipeline clean: build (708.7KB) → harness + lint (11 no-undef) on `bundle.build.js` →
copied to `site/app/bundle.js` (725,708 bytes, byte-identical) → harness + lint re-run against the
deployed file, same 11. Beyond that: a scratchpad-only harness variant (deleted after use, never
committed) drove real interactions — confirmed icon colors are actually applied inline, tapping a
toggle does not open the sheet while tapping elsewhere on the card does, the sheet's full rendered
HTML shows the goal input/unit label/Save button with the right classes, and toggling a tracker off
still correctly hides its card (unrelated confirmation that the Phase 1 hide-entirely behavior
still works). One section-label instance (a "Subscriptions" sub-view nested inside `RO`, reachable
only through additional in-page navigation not exercised by this harness) was verified by direct
source read instead of at runtime — low risk for a plain className string addition, but flagged as
the one check that isn't fully end-to-end.

**Not yet verified:** real-browser visual check — icon color contrast, the top-right toggle's exact
position, the enlarged goal input's proportions, and tile sizing all need eyes, not just DOM
assertions.

---

## [3.24.0] — 2026-08-20

`UX-OPEN-01` Phase 1b follow-up — three UX fixes to the My Plan page, built in `src/app.js` and
deployed to `site/app/bundle.js` the same day via the build pipeline.

### Changed — section headers now visually tie their content together
- New `.wt-plan-section-label` class (16px, bold, `--ink`, 3px `--teal` left border, 12px left
  padding), scoped to My Plan only — the global `.wt-section-label` used everywhere else is
  untouched. Applied to "What I'm Tracking" and "My Regimen".

### Changed — Self-Managed and Quick Presets open as bottom sheets, not inline expansion
- New `PlanSheet` component (title, close button, children) follows the same
  `.wt-backdrop`/`.wt-sheet` pattern as the tracker bottom sheet from v3.23.0. Tapping either
  `RegimenSummaryCard` now opens a sheet containing the exact same list/add-button markup that used
  to render inline — content unchanged, only the container changed, so the card header and its
  items read as parent/child instead of peers.
- `expandedList` state is unchanged in shape and purpose; only what it drives changed (sheet
  visibility instead of an inline conditional render).

### Added — "Add Partner +" placeholder card and sheet
- Dashed-border card (`--teal` border and text, `Plus` icon, 56px min-height) between the Austin
  Drip Lounge clinic card and the Self-Managed card. Opens a `PlanSheet` with five inert fields
  (partner name, protocol code, provider contact, session count, next-appointment date) and an
  inert "Request Partnership" button — no save logic, no data model changes, explicitly marked in
  code as a design-review-only placeholder.

### Testing
Full six-step pipeline run clean: `node esbuild.config.js` (707.1KB) → harness + lint (11 no-undef)
on `bundle.build.js` → copied to `site/app/bundle.js` (724,066 bytes, byte-identical to the build
output) → harness + lint re-run against the exact deployed file, same 11 no-undef. Beyond that: a
scratchpad-only harness variant (deleted after use, never committed) confirmed both section headers
use the new class (and not the old one), that Self-Managed and Quick Presets open real sheets with
correct titles and content rather than expanding inline, and that the Add Partner sheet opens with
all five fields and the button present.

**Not yet verified:** real-browser visual check — this release is entirely visual/interaction
behavior (sheet open/close, header treatment, dashed-card styling) that jsdom cannot confirm reads
correctly.

---

## [3.23.0] — 2026-08-20

`UX-OPEN-01` Phase 1b — My Plan visual redesign, built in `src/app.js` and deployed to
`site/app/bundle.js` the same day via the build pipeline (second deploy through that path, after
v3.22.0/v3.21.0's manual patches and v3.22.0's own deploy). Replaces v3.22.0's generic-settings-form
look with a purpose-built visual language, keeping all of v3.22.0's structural logic (state,
callbacks, modals) unchanged underneath.

### Changed — "What I'm Tracking": tracker rows became a 2-column card grid
- `TrackerRow` rebuilt as a tappable card (icon in a teal-tinted rounded square, bold 17px name,
  formatted goal value or "Set a goal", "● Active"/"○ Off" status pill) instead of an
  always-visible toggle-and-input row.
- New `TrackerSheet` component: a single shared bottom sheet (reusing existing
  `.wt-backdrop`/`.wt-sheet` modal classes) replaces the old always-rendered inline inputs — tap a
  card to open it, toggle visibility and edit the goal there, Save to commit. The six existing
  per-field `useState`/`useEffect` pairs from v3.22.0 are unchanged; the sheet just borrows them via
  a per-tracker closure instead of rendering its own input.
- "Show hidden trackers (N)" link moved below the grid with a live count, wording updated from
  "Show all trackers".
- Icon-per-tracker corrected against what Log It! tiles actually use, not guessed: Protein →
  `Battery`, Sleep → `Bed` (both already imported; previously would have been wrong if built from
  the original brief's untested guesses of `Flame`/`Dumbbell` and `Moon`).

### Changed — "My Regimen": provider-grouped full-width cards replace plain CRUD summary rows
- New `RegimenSummaryCard` (icon optional, title, live count, item preview) replaces v3.22.0's
  `CrudSummaryRow` pill button, which is now deleted (unused once both call sites migrated).
- **Self-Managed card** combines Supplements + Treatments into one summary (combined count,
  combined name preview) — expands to the two *existing* lists (unchanged markup, unchanged
  `CO`/`jO` add/edit modals) under their own sub-headers, not a merged data model.
- **Quick Presets card** — same existing preset list/modal, now under a `RegimenSummaryCard` with a
  new `Zap` icon import (`lucide-react`, already an installed dependency — no new package).
- **Clinic provider card — hardcoded demo data, explicitly marked in code as a placeholder.** One
  static card ("Austin Drip Lounge", a fixed protocol item list, a fixed sessions/next-date line,
  two inert buttons) exists purely to visually demo the concept to clinic partners. Not wired to
  any data model; no backend/Worker/schema changes anywhere in this release.

### Design system
Stayed in the app's real light theme (`--paper`/`--ink`/`--teal`/`--mist`/`--line`/`--muted`, all
pre-existing) after catching that an earlier draft of the session brief specified dark colors
(`#080808`/`#191919`) that don't exist anywhere in the actual stylesheet — confirmed against `iO`
(line 591) before writing any CSS, corrected before building. "Bold and exciting" delivered through
real box-shadows (the old flat `.wt-card` has none), a stronger `--teal` presence (card borders,
icon badges, the show-hidden link), larger card-title type (17px vs. the old 14.5px), and more
generous spacing — not a theme change. ~14 new CSS rules added to the existing `iO` stylesheet
string; no separate stylesheet, no new fonts (`'Space Grotesk'` was already loaded).

### Testing
`node esbuild.config.js`: clean, 705.2KB → 722,137 bytes after copying to `bundle.js`. Harness and
lint (11 no-undef, matching baseline) both clean on `bundle.build.js` and, after the copy, on the
exact deployed `site/app/bundle.js` — full six-step build→verify→deploy→re-verify sequence, same
as v3.22.0's deploy. Beyond that: a scratchpad-only harness variant (deleted after use, never
committed) drove the real UI against both files — section headers, tracker-card goal formatting,
hide-by-default, the clinic card's full content, Self-Managed's combined count/preview across both
arrays, opening/closing the tracker bottom sheet, and expanding Self-Managed to confirm both a
supplement and a treatment render under their correct sub-headers (an ordering bug caught and fixed
during the session, before it ever reached a build).

**Not yet verified:** real-browser visual check — jsdom has no layout engine, so shadows, spacing,
the bottom sheet's slide-up feel, and whether "bold and exciting" actually reads that way in a real
browser are all unconfirmed. This matters more than usual this release, since the whole point was
visual polish.

---

## [3.22.0] — 2026-08-20

`UX-OPEN-01` Phase 1 — "My Plan" page redesign, built in `src/app.js`. **Deployed to
`site/app/bundle.js` the same day** — see "Deploy" below.

### Changed — Setup renamed to "My Plan" throughout
- Bottom-nav tab label: "Setup" → "My Plan".
- Page header: "Setup for:" → "My Plan for:". Nav order and the other tab titles are unchanged.
- Internal router state key (`"setup"`) and component name (`WO`) are untouched — this is a
  display-only rename, not a routing change.

### Changed — six goal inputs and eight tracker toggles merged into one row per tracker
- New `TrackerRow` component (39 lines): one row per tracker — toggle, label, and (for the six
  trackers that have one) an inline goal input — replacing the old "Daily goals" and "Other
  trackers" cards, which had goal inputs and toggles split inconsistently across two separate cards
  (water/protein/calories/sleep already had them adjacent; weight/exercise did not).
- **Off trackers are hidden entirely, not dimmed** — an off tracker's row doesn't render at all by
  default. A "Show all trackers" link at the bottom of the tracker list reveals every row
  (including off ones) so any tracker can be switched back on; the link becomes "Hide off trackers"
  once expanded.
- Turning a tracker off in My Plan already cascaded to hiding its Log It! dashboard tile before this
  change (pre-existing `&&`-gated rendering) — confirmed still true, unchanged by this release.

### Changed — Presets, Supplements, and Treatments collapsed to summary rows
- New `CrudSummaryRow` component (23 lines): each of the three CRUD lists is now a single row
  showing a live count (e.g. "Presets (4)") that expands in place on tap to reveal the existing
  list and "Add" button — unchanged markup, just newly conditional on expand state.
- The three add/edit modals (`OO`/`CO`/`jO`) are untouched — only what triggers them changed.

### Net effect on `WO` (the My Plan component)
355 lines touched across `src/app.js` (155 insertions / 187 deletions). `WO` itself shrank from 403
to 310 lines; combined with the two new components its total footprint (372 lines) is still smaller
than the original single component, despite the two additions — the CRUD-list collapsing saved more
than the unified tracker rows added.

### Testing
`node esbuild.config.js`: clean. `npx eslint site/app/bundle.build.js` no-undef count: 13,
unchanged. `node tools/harness.js site/app/bundle.build.js`: exit 0, 8 tiles, all nav clean
(including the renamed "My Plan" tab — `tools/harness.js`'s default nav check was updated from
`"Setup"` to `"My Plan"` since this is a permanent rename, not scratch content). Beyond the standard
harness: a scratchpad-only variant (deleted after use, never committed) seeded one off tracker and
one preset, then drove the real UI — confirmed the header text, hide-by-default/reveal-via-link
behavior, live CRUD counts, and expand-on-tap all work end-to-end, not just in source.

**Not yet verified:** real-browser visual check (row spacing, goal-input width, chevron rotation) —
jsdom has no layout engine. `docs/DECISION-LOG.md` amendment for the "My Plan" naming and
hide-entirely decisions is drafted but not yet applied to the log.

### Deploy — first build-pipeline deploy to `site/app/bundle.js`
`ARCH-OPEN-01`'s closure made `src/app.js` + `esbuild.config.js` the source of truth (see
`CLAUDE.md`'s updated "Source of truth" section); this is the first time `site/app/bundle.js` was
produced by that pipeline rather than hand-edited. Prerequisite fix caught before deploying:
`esbuild.config.js` still had `minify:false` from its Gate B diagnostic origin — building with it
as-is would have shipped an unminified, ~2x-larger bundle and never converged on the deployed
lint baseline. Fixed to `minify:true` first (separate commit), then the full six-step sequence run
clean: build → harness+lint on `bundle.build.js` → copy to `bundle.js` → harness+lint on the exact
deployed file. Final: `bundle.build.js` and `bundle.js` both at **11** no-undef errors (matching
baseline — the old 13-vs-11 split no longer applies now that the build itself minifies), harness
clean on both, and the full My Plan behavior check (header text, hide-entirely default, "Show all
trackers" reveal, CRUD summary counts, expand-on-tap) re-verified against the exact deployed
`bundle.js`, not just the build output. Real-browser check is still the open item — jsdom can't see
layout.

---

## [3.21.0] — 2026-08-20

Production bundle patch: fixes `goalWeight`/`goalExerciseMinutes` silently dropping from backup
export/import in the **deployed** `site/app/bundle.js`. This is the same bug fixed in `src/app.js`
under `ARCH-OPEN-05` (v3.20.0, below) — that fix never touched the deployed bundle, since it was
part of the source-reconciliation effort, not a production patch. This release is the direct,
minimal, two-location patch to the actual artifact serving `hydroprotracker.com`.

### Fixed — `goalWeight`/`goalExerciseMinutes` silently dropped by backup export/import
- Backup export (`ve()`): the exported settings object skipped straight from `goalSleepHours` to
  `showWater`, omitting `goalWeight` and `goalExerciseMinutes` entirely. Added both, using the same
  bare-property pattern every other field in the function already uses.
- Backup import (`xe()`): same omission, mirrored on the restore side. Added both using the same
  `stored||default` fallback convention (`r.settings.goalWeight||ES.settings.goalWeight`) already
  used by every other numeric goal field in the function.
- The localStorage load path already had both fields correctly — only export and import were
  affected. A user who never used the backup feature was never exposed to this bug.
- Two-location, content-anchored edit via Python (the file is a single 702KB line; anchors were
  confirmed unique via `content.count(target) == 1` immediately before editing). No other change to
  `site/app/bundle.js`.

### Testing
`node --check`: clean. `npm run lint:bundle`: 11 no-undef errors, unchanged from baseline (same
errors, same locations). `node tools/harness.js site/app/bundle.js`: exit 0, 8 tiles, all nav clean,
zero runtime errors. Beyond the harness's default smoke test: a scratchpad-only harness variant
(deleted after use, never committed) drove the actual UI — seeded `localStorage` with non-default
goal values, clicked "Export backup" for real and captured the Blob content at construction time to
confirm both fields appear in the export, then simulated picking a backup file with different
goal values via a real file-input `change` event and confirmed the app applied them instead of
dropping them. Both directions of the bug verified fixed through the real code path. End-state
audit: diffed the final `ve()`/`xe()` function bodies against pre-edit snapshots — confirmed
removing only the inserted text reproduces the original functions byte-for-byte, nothing else
changed.

**Real-device verification: pending.** This patches the bundle serving production, but jsdom has no
layout engine and this touches actual data persistence — Rob needs to export a backup with
non-default weight/exercise goals set, import it back, and confirm both goals survive, before this
is considered verified. Per this project's front-end deploy path (`git push` to `main` is what
serves `site/app/bundle.js` via Cloudflare Pages — there is no separate manual deploy step for the
app, unlike the Worker), pushing this commit **is** the production deploy. That push is being held
until the real-device check above happens.

---

## [3.20.0] — 2026-08-20

`ARCH-OPEN-05` — versioned schema and deep-merge migrations, in the extracted `src/app.js`.
**No change to `site/app/bundle.js` — the deployed app is unaffected by this release.** This is
source-reconciliation/dev-tooling work only, same as `ARCH-OPEN-01`.

### Changed — hand-maintained field whitelists replaced with a versioned schema
- `SCHEMA_VERSION = 2` — matches the version number `ve()` (backup export) already stamped on
  every export, previously written but never read on import. Now a real constant, threaded through
  `migrate()` as a hook for future version-specific migrations (none needed yet).
- `deepMergeDefaults(defaults, stored)` — new generic, type-driven recursive merge. For each key in
  `defaultSettings`: booleans and strings are accepted from `stored` via `typeof` check (so a falsy
  `false`/`""` survives instead of being treated as "missing"); numbers keep the pre-existing
  truthy-fallback guard (a stored `0` still falls back to default — this defends against div-by-zero
  in goal-percentage tiles, and was deliberate in the original hand-rolled checks, so it's preserved
  rather than "fixed" as an inconsistency); plain objects recurse; arrays are taken wholesale via
  `Array.isArray`, then reshaped separately.
- `migrateSettingsShape()` + `normalizeTreatments()` — structural migrations that can't be expressed
  as "fill in a missing key," reusing the existing `FS()` (presets) and `US()` (supplements)
  normalizers as-is; `normalizeTreatments()` is new, mirroring `US()`'s shape (treatments and
  supplements share the same adherence-schedule fields) since treatments previously had no
  equivalent normalizer.
- `migrate(stored)` — single entry point combining the above, now used by both the localStorage load
  path and backup import. Replaces ~60 and ~50 lines of hand-maintained field-by-field merging,
  respectively, with one call plus (for import only) an explicit re-pin of the handful of
  device-local fields that must never come from an imported file regardless of whether the file has
  them (`account`, `cloudBackup`, `feedbackWatching`, and the `push`/`bedtime`/`supplementReminder`/
  `treatmentReminder` reminder subscriptions) — that pin-back is a deliberate business rule, not a
  defaults problem, so it stays explicit rather than folding into the generic merge.
- Backup export (`ve()`) inverted from a ~19-line allowlist to a denylist of the same device-local
  field set above. New settings fields are included in exports by default from now on, instead of
  requiring every future addition to be remembered in an allow-list — the failure direction that
  used to silently drop fields now silently *over-includes* at worst, which is the safer default.

### Fixed — `goalWeight` and `goalExerciseMinutes` silently dropped by backup export/import
Found while tracing the three whitelists against each other: the localStorage load path included
`goalWeight` and `goalExerciseMinutes`, but both `ve()` (export) and the old backup-import merge
omitted them entirely. Exporting a backup and restoring it silently reset a user's weight and
exercise goals to defaults. Fixed as a consequence of the generic merge (both fields are ordinary
entries in `defaultSettings`, so they're covered automatically now) rather than patched individually.
**This same bug still exists in the deployed `site/app/bundle.js` — this release does not fix
production.** A separate, standalone bundle.js patch is needed to fix it for real users; tracked as
an open item, not yet started.

### Testing
`node esbuild.config.js`: clean. `npx eslint site/app/bundle.build.js` no-undef count: 13, unchanged.
`node tools/harness.js site/app/bundle.build.js`: exit 0, 8 tiles, all nav clean, zero runtime
errors — but that smoke test only exercises the empty-storage default path. Additionally verified
`migrate()` directly against a deliberately partial/legacy stored blob (missing most settings
fields, the old split preset format, and a non-default falsy boolean) via a one-off harness variant,
scratchpad-only, never committed: 16 assertions, all passing, including confirmation that `logs`
data survives migration byte-identical. That check caught a real implementation mistake before it
shipped anywhere — an early version of `migrate()` ran the generic merge over the *entire* default
state including `logs`, whose default is `{}`; since deep-merge only fills in keys present in the
defaults object, and `{}` has none, that would have silently wiped every stored log entry on first
load. Fixed before verification by scoping the generic merge to the `settings` subtree only, leaving
`logs` and `activeSleepSession` handled directly as before.

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
