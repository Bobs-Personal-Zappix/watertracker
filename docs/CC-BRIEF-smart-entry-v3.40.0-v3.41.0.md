# CC-BRIEF — Smart Entry (v3.40.0) + Voice Tracker (v3.41.0)

**Written:** Aug 27, 2026 · **Status:** ready to run · **Author:** Claude (strategy project) → Claude Code

Two versions, one system. **Do not attempt both in one session.** Phase A ships and is real-device
verified before Phase B starts. Phase B is a front-end onto Phase A's machinery and builds nothing
new in the interpretation or confirm layer.

---

## 0. Read first

- `docs/DECISION-LOG.md` — authoritative. Governing entries: `STRAT-11`, `PROD-10`, `PROD-11`,
  `PROD-11a`, `PROD-12`, `PROD-13`, `PROD-14`, `UX-11`, `UX-11a`, `UX-14`, `UX-14a`, `UX-15`,
  `UX-16`, `UX-17`, `UX-18`.
- `docs/CURRENT-STATE.md` — current working sequence.
- **Doc drift, fix in this session's commit:** `CLAUDE.md` states "Deployed version: 3.33.0". The
  deployed version is **3.39.0**. `CLAUDE.md` is Claude Code's responsibility and is updated in the
  same commit as code changes — correct it as part of Phase A.

## 1. What this is

The user describes what they consumed or did in plain language. An AI interprets it into HydroPro's
tracked metrics. The user reviews the values on screen and confirms. Only then is anything logged.

**It estimates and captures. It never advises, never comments on whether something is healthy, and
never interprets what a log means for the user's health** (`STRAT-11`). Scope in Phase 1 is
entry-and-confirm only; the assistant declines everything else (`UX-14`).

## 2. What is already decided — do not re-open

| Ref | Decision |
|---|---|
| `PROD-10` | Three interpretation classes: consumables/time-based (interpret), Treatments & RX (match against the user's own items, surface candidates when unsure), measured readings (capture verbatim, no interpretation) |
| `PROD-11` | Confirmation is mandatory and must be real: values large and legible, each tap-editable, Confirm a deliberate action |
| `PROD-11a` | Spoken "yes" is permitted **only** against a visible confirm card. Treatments/RX low-confidence disambiguation is tap-only |
| `PROD-12` | Marginal per-use cost. Requires caching and a per-user daily cap from Phase 1 |
| `PROD-14` | Browser-native Web Speech API, not VAPI. Verified on iOS 18.7 standalone PWA |
| `UX-14` / `UX-14a` | Two entry points — header Sparkles icon and the Log It! Voice Tracker tile — opening one shared modal |
| `UX-18` | Spoken summaries stay under ~2 seconds; the card carries the detail. Interpreted values show their source |

---

# PHASE A — v3.40.0 · Interpretation layer + confirm card (text input)

## A1. Files to touch

```
worker/src/worker.js        NEW route: POST /api/interpret
src/app.js                  SmartEntrySheet, ConfirmCard, header Sparkles wiring, schema
docs/DECISION-LOG.md        commit alongside
docs/CURRENT-STATE.md       update when it stops being true
CHANGELOG.md                new entry, bump to 3.40.0
CLAUDE.md                   fix the stale version line
```

State which of these you need before exploring.

## A2. Worker route — `POST /api/interpret`

Runs server-side so the API key never enters the bundle.

**Secret required:** `ANTHROPIC_API_KEY` via `wrangler secret put`. Rob does this — do not attempt
it and do not echo the value anywhere.

**Request:**
```json
{
  "text": "grilled cheese and a diet coke",
  "deviceId": "…",
  "date": "2026-08-27",
  "trackers": { "water": {"unit":"oz","on":true}, "protein": {"unit":"g","on":true}, "…": {} },
  "userItems": {
    "treatments": [{"id":"t1","name":"NAD+ IV"}],
    "rx":         [{"id":"r1","name":"Metformin"}],
    "supplements":[{"id":"s1","name":"Vitamin D3"}]
  }
}
```

`userItems` is required — `PROD-10` says matching happens against the user's **own** configured
items, never a general drug database. Send only id and name; no dosages, no schedule.

**Response:**
```json
{
  "entries": [
    {"tracker":"water","value":12,"unit":"oz","source":"diet coke","confidence":"high"},
    {"tracker":"calories","value":400,"unit":"kcal","source":"grilled cheese","confidence":"medium"}
  ],
  "unmatched": ["…"],
  "candidates": [{"tracker":"rx","heard":"metfor…","options":[{"id":"r1","name":"Metformin"}]}],
  "declined": null
}
```

- `source` is mandatory on every interpreted entry — see `UX-18`. The card shows *"12 oz water —
  from diet coke"*, never a bare number the user didn't say.
- `candidates` is populated instead of `entries` whenever a Treatment/RX/Supplement match is
  anything below high confidence. **Never guess an inventory-affecting item.**
- `declined` carries a short reason when the request is out of scope ("what should I eat?", "is
  this healthy?"). The route returns 200 with `declined` set — not an error.

**Model:** recommend `claude-haiku-4-5-20251001`. This is a constrained
text-to-numbers task; a frontier model buys nothing and costs several times more. *Needs Rob's
decision* — it feeds `STRAT-OPEN-02` directly.

**Cache** (`PROD-12`): KV, key `interp:v1:<sha256 of normalized text + tracker set>`, TTL 30 days.
"glass of water" will be the single most common input in the app; it should cost nothing after the
first time. Normalize by lowercasing and collapsing whitespace before hashing.

**Daily cap** (`PROD-12`): enforced **server-side** in D1. A client-side cap is decorative.

```sql
CREATE TABLE IF NOT EXISTS smart_entry_usage (
  device_id   TEXT NOT NULL,
  day         TEXT NOT NULL,
  calls       INTEGER NOT NULL DEFAULT 0,
  cache_hits  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, day)
);
```

Propose the migration; **Rob runs it** against production D1. Cache hits do not count toward the
cap. Over-cap returns 200 with `declined: "daily_limit"` so the UI degrades to manual entry rather
than erroring. Proposed cap: **25/day** — confirm with Rob.

## A3. System prompt — required properties

Not verbatim; these are the constraints it must satisfy.

1. Output strict JSON matching the schema above. No prose, no markdown fences.
2. Encode the three `PROD-10` classes explicitly, including *"measured readings are captured as
   spoken, never interpreted."* If the user says "I weigh 181," the value is 181.
3. Every interpreted entry carries the `source` phrase it came from.
4. Match Treatments/RX/Supplements **only** against the supplied `userItems`. Below high
   confidence → `candidates`, never `entries`.
5. Refuse and populate `declined` for: health advice, whether something is healthy, dosing
   guidance, interpretation of the user's data, anything not an entry.
6. Only propose entries for trackers the user has **on**.
7. State the estimation rules that would otherwise be invisible — most importantly **whether a
   non-water beverage counts toward the water goal.** *Needs Rob's decision.* Whatever the answer,
   it must be explicit in the prompt and visible via `source` on the card. Users should not
   discover this rule after the fact.

## A4. Confirm card

The safeguard. `PROD-11` is the spec; treat it as a test, not a suggestion.

- One row per proposed entry: tracker label, **large** value, unit, and the `source` phrase in
  muted text beneath.
- Every value editable in **one tap** — opens a number pad, not a nested form.
- Delete a row without cancelling the whole entry.
- Confirm is a deliberate action, positioned so it can't be hit while reading.
- `candidates` render as a pick list. Nothing pre-selected. No inventory decrement until picked.
- Over-cap or `declined` → clear message plus a direct path to manual entry.

Build this as a **standalone component consumed by both phases.** Phase B adds no confirm logic.

## A5. Write path

Route through the **existing** entry function — the same code a manual log uses. Do not write a
parallel path.

Add provenance via the versioned schema (`migrate`/`deepMergeDefaults`, per `ARCH-OPEN-05`). Do
**not** touch hand-maintained field lists:

```
source: "manual" | "smart" | "voice"      // default "manual"
sourceText: string | null                 // what the user actually said
```

Existing entries migrate to `"manual"`. `sourceText` is the only way to diagnose a bad
interpretation after the fact — you will want it the first week.

Check every item in CLAUDE.md's "Bug classes this codebase has already shipped" against this. The
`migrateEntry` guard and the edit-handler routing have each bitten three times.

## A6. Sheet construction

`UX-11` / `UX-11a` / `UX-15` / `UX-16` / `UX-17` all apply and have each caused a shipped bug:

- `createPortal` to `document.body`, explicit `zIndex`, never nested.
- **Locally redefine `--deep`, `--line`, `--paper` on the portal root** — it renders outside
  `.wt-root` where they're scoped.
- Dark surfaces, `--ink-inverse` text, `--hairline-bright` borders, `--muted-dark` helper text.
- Touch targets ≥48px, inputs ≥16px.

## A7. Header wiring

Wire the existing Sparkles placeholder (shipped unwired in v3.38.1) to open the sheet. Leave the
profile placeholder alone.

## A8. Analytics

Into `user_activity`: sessions started, entries proposed, entries confirmed, entries **edited before
confirm**, sessions abandoned, cache hit rate, cap hits.

Edit rate is the interpretation-accuracy signal. If it runs high, the prompt is wrong — and that is
knowable from data rather than from complaints.

---

# PHASE B — v3.41.0 · Voice Tracker

**Do not start until Phase A is deployed and real-device verified.**

## B1. Verified device behavior — build to this, don't re-derive it

Spiked on iPhone, iOS 18.7 / WebKit 605.1.15, **home-screen standalone PWA**. Confirmed:

- `webkitSpeechRecognition` and `speechSynthesis` both available.
- **The mic reopens after TTS with no new user gesture.** Multi-turn hands-free works.
- Full loop ran end to end including the correction turn.

**Requires a secure context.** Fails silently on `file://`.

## B2. The timing problem — this is the design constraint

The spike's unoptimized loop took **21 seconds**. The locked UX doctrine is *every interaction under
5 seconds*. Two fixes, both required:

1. **The spoken summary must not enumerate values** (`UX-18`). The spike spent **8 seconds** saying
   "Say yes and I will log 12 oz of water, and 10 g of protein, and 400 kcal of calories." The card
   is on screen carrying all of it. Say *"Got three — say yes?"* Under two seconds.
2. **Drop the opening prompt.** Start listening the moment the overlay opens. The overlay itself
   says what it wants; speaking it too costs ~2s and a recognition-restart cycle.

Target is roughly 10–12 seconds. Be honest in the changelog that this is over the 5-second doctrine.
Voice's real advantage is hands-free and zero-friction, not raw speed.

Also: recognition takes ~2–3s of trailing silence to finalize each turn. Don't try to engineer that
away; budget for it.

## B3. Spoken units

The spike said **"400 kcal of calories."** Spoken and display unit forms are different strings.
Keep a small map: `kcal` → "calories", `oz` → "ounces", `g` → "grams". Say the unit once.

## B4. Voice loop

```
tile / sparkles tap
  → overlay opens, mic starts immediately
  → interim transcript streams into the strip
  → recognition ends → POST /api/interpret (Phase A route, unchanged)
  → confirm card renders WITH values visible
  → short spoken prompt (<2s)
  → listen
      "yes"/"yep"/"confirm"  → write via Phase A path, source:"voice"
      anything else          → treat as correction, re-interpret, re-render, re-prompt
  → tap Confirm is always available and always works
```

- The card is on screen **before** the spoken prompt, never after (`PROD-11a`).
- Treatments/RX candidate disambiguation is **tap-only**. Do not read options aloud.
- Cap corrections at 3 rounds, then fall back to manual edit on the card.
- Every state has a visible non-voice escape.

## B5. Overlay states

Real states, not a spinner: `idle · listening · thinking · proposing · confirmed · error`.

Error cases needing distinct copy and a manual-entry path: mic permission denied, no speech
detected, recognition unsupported, network failure, over cap.

Per `UX-14a`, the modal is titled **"My AI Voice Tracker"** and is the same component as Phase A's
sheet with voice input enabled.

## B6. Interim results

The spike confirmed interim results stream. Show them live in the transcript strip — it's what makes
the overlay feel responsive rather than frozen. Interim text muted/italic, finalized text solid.

## B7. Feature detection

If `SpeechRecognition` is absent, the Voice Tracker tile opens the **text** Smart Entry sheet
instead. Never a dead tile, never a "not supported" dead end.

---

## Verification (both phases)

Per CLAUDE.md, no exceptions:

1. `node esbuild.config.js`
2. `node tools/harness.js site/app/bundle.build.js` — clean
3. ESLint `no-undef` sweep on `bundle.build.js`, confirm the count
4. Copy over `site/app/bundle.js`
5. Re-run harness **and** lint against the exact deployed file
6. **Audit the end state** — confirm every intended change is actually present

**jsdom cannot test any of Phase B's core.** Mic permission, speech recognition, and TTS are all
real-device only. Say so plainly rather than implying coverage. Same for Phase A's sheet layout —
jsdom has no layout engine.

## Needs Rob before starting

1. `ANTHROPIC_API_KEY` set as a Worker secret
2. Model string confirmed (recommend Haiku 4.5)
3. Daily cap confirmed (proposed 25)
4. **Does a non-water beverage count toward the water goal?**
5. D1 migration run against production

## Explicitly out of scope

Autonomous logging. Health advice or commentary of any kind. AI coach (`STRAT-11` did not reopen
it). Wake words or background listening. Non-English. Any capability beyond entry-and-confirm
(`UX-14`).
