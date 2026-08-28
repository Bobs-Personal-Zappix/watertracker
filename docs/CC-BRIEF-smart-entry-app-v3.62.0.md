# CC-BRIEF — Smart Entry app side (v3.62.0) + Voice Tracker (v3.63.0)

**Written:** Aug 28, 2026 · **Status:** ready to run · **Author:** Claude (strategy project) → Claude Code

**Supersedes `docs/CC-BRIEF-smart-entry-v3.40.0-v3.41.0.md`.** That brief was written against
v3.39.0 and its app-side sections describe an app 22 releases out of date. Its worker sections are
done and shipped (`PROD-15`). Treat the old file as historical; this one governs.

Two versions. **Do not attempt both in one session.** v3.62.0 ships and gets a real-device pass
before v3.63.0 starts.

---

## 0. Read first

- `docs/DECISION-LOG.md` — authoritative. Governing: `STRAT-11`, `PROD-10`, `PROD-11`, `PROD-12`,
  `PROD-15` (and its Aug 28 amendment — the shipped worker contract), `UX-11`, `UX-14`, `UX-15`,
  `UX-16`, `UX-17`, `UX-19`, `ARCH-OPEN-05`.
- `docs/CURRENT-STATE.md` — current working sequence.
- `worker/src/worker.js` — `/api/interpret` as actually deployed. **The shipped response is the
  contract.** Where this brief and the code disagree, the code wins; flag the difference.
- `voice-tracker-tile/` — a standalone plain HTML/CSS/JS Voice Tracker deliverable built to Rob's
  own spec (v3.40.0), intended for future wiring outside the React bundle. **Read it before
  designing the v3.63.0 overlay.** It may already be closer to what Rob wants than anything
  specified here. If it is, port from it rather than rebuilding.

## 1. Corrections to the superseded brief — read these before anything else

The old brief contains errors that were caught during the worker session. Do not carry them forward.

| Old brief said | Reality |
|---|---|
| Wire the header Sparkles icon (`A7`, `UX-14a`) | **The header Sparkles icon was removed in v3.40.0** (`UX-19`, Rob's explicit call). There is nothing to wire. The Voice Tracker tile is the entry point. `UX-14a` is discarded — it was drafted against stale state and contradicts a Locked entry. |
| `UX-18` governs spoken brevity and source attribution | This repo's `UX-18` is about tracker-sheet category colors. The rule is real but was never logged. It becomes **`UX-41`** (draft in §5). |
| `PROD-14` / `UX-14a` are already decided | Neither exists in the log. `PROD-14` is an unused number; the Web Speech decision takes it (draft in §5). |
| Analytics go into `user_activity` (`A8`) | `user_activity` is a bare `(user_id, activity_date)` retention ping with no room for per-event metrics. Analytics needs its own small table. |
| Fix `CLAUDE.md`'s version line | Already correct. Do not touch. |
| Target v3.40.0 / v3.41.0 | **v3.62.0 / v3.63.0.** v3.40.0 and v3.41.0 shipped long ago. |
| The fast-entry tiles are a top row | Since v3.59.0 they sit at the **end** of a unified 4×3 grid, after the nine trackers. |

## 2. What already exists — build onto it, don't rebuild

- **The Voice Tracker tile is live** on Log It!, unconditionally visible, using `voice-tracker-v3.png`
  at a flat 102px with a 16.5px label. Its artwork and placement have already been through Rob's
  real-device review. **Do not restyle the tile.**
- **It already opens a sheet** — a preview shell with a text field and a decorative mic icon, no
  parser (v3.51.0). This session replaces that shell's internals. It is not a new component.
- **`/api/interpret` is live and hardened.** Estimation, confidence rubric, multi-tracker entries,
  decline path, candidates safeguard, prompt-versioned cache, and D1 counters are all verified
  against the deployed route.

---

# v3.62.0 — Confirm card, sheet internals, write path

## A1. The worker contract, as shipped

Request:

```json
{
  "text": "grilled cheese and a diet coke",
  "deviceId": "…",
  "date": "2026-08-28",
  "trackers": { "water": {"unit":"oz","on":true}, "…": {} },
  "userItems": {
    "treatments":  [{"id":"t1","name":"NAD+ IV"}],
    "rx":          [{"id":"r1","name":"Metformin"}],
    "supplements": [{"id":"s1","name":"Vitamin D3"}]
  }
}
```

Send **only** `id` and `name` in `userItems` — no dosages, no schedules. The three arrays map
exactly onto the v3.52.0 three-way tracker split.

Response:

```json
{
  "entries":    [{"tracker":"water","value":12,"unit":"oz","source":"diet coke","confidence":"medium"}],
  "unmatched":  ["…"],
  "candidates": [{"tracker":"rx","heard":"metfor","options":[{"id":"r1","name":"Metformin"}]}],
  "declined":   null
}
```

Four response shapes the UI must handle, all HTTP 200:

1. **Entries** — normal. Render the confirm card.
2. **`declined` non-null** — out of scope, or `"daily_limit"`. Show the reason, offer manual entry.
3. **`candidates` non-empty** — needs disambiguation before anything can be confirmed.
4. **`unmatched` non-empty** — partial success. Show what was understood, name what wasn't.

`declined` is never an HTTP error. Treating a non-200 as the decline path will miss it.

`normalizeInterpretResult` already strips entries for disabled trackers and entries missing
`source`, so the client can trust those two invariants. It does **not** guarantee the tracker
exists in the user's current settings if settings changed mid-flight — check before writing.

## A2. Confirm card

The safeguard (`PROD-11`). This is the component that makes the whole feature acceptable, and it is
shared unchanged by v3.63.0 — build it once, build it properly.

- One row per entry: tracker label, **large** value, unit, and the `source` phrase in
  `--muted-dark` beneath it. `source` is never optional (`PROD-15`, `UX-41`).
- Every value editable in **one tap** — opens a number pad, not a nested form.
- Any row deletable without cancelling the whole entry.
- Confirm is a deliberate action, positioned so it isn't hit while reading.
- `candidates` render as a pick list with **nothing pre-selected**. No inventory decrement until
  the user picks. This is `PROD-10`'s inventory safeguard and it is not negotiable.
- `unmatched` phrases shown plainly — "I didn't catch: *a bag of chips*" — with a path to add
  manually.
- `confidence: "low"` gets a visual cue prompting review. Do not hide `high` — all values stay
  visible and editable regardless.

## A3. Sheet internals

Replace the preview shell's contents. Keep the tile, the artwork, and the open/close behavior.

- `createPortal` to `document.body`, explicit `zIndex`, never nested (`UX-11`).
- **Locally redefine `--deep`, `--line`, `--paper` on the portal root.** These are scoped to
  `.wt-root`; a portal renders outside it. This exact omission caused the BackfillSheet and OO
  modal bugs.
- `--surface-dark` #151A21 surfaces, `--ink-inverse` #FFF6DB text, `--hairline-bright` #5A7390
  borders, `--muted-dark` #9FB0C4 helper text.
- Touch targets ≥48px, inputs ≥16px.
- Honor Log It!'s date pill. Off-today, the sheet shows the amber "Saving to *date*" bar like every
  other entry sheet, and the request's `date` is the pill's date — not today's.

## A4. Write path

Route through the **existing** entry function — the same code a manual log uses. No parallel path.

Add provenance through the versioned schema (`migrate`/`deepMergeDefaults`, `ARCH-OPEN-05`). Do
**not** add to hand-maintained field lists:

```
source: "manual" | "smart" | "voice"   // default "manual"
sourceText: string | null              // what the user actually typed or said
```

Existing entries migrate to `"manual"`. `sourceText` is the only way to diagnose a bad
interpretation after the fact.

Then check every item in CLAUDE.md's "Bug classes this codebase has already shipped" — particularly
the `migrateEntry` guard and the edit-handler routing, which have each bitten three times. A
Smart-Entry-sourced Treatments/RX/Supplements log must decrement inventory exactly as a manual one
does, and restore it on delete (`PROD-07`/`PROD-08`).

## A5. Analytics — needs its own table

`user_activity` cannot hold this. Propose a migration; **Rob runs it**:

```sql
CREATE TABLE IF NOT EXISTS smart_entry_events (
  device_id  TEXT NOT NULL,
  day        TEXT NOT NULL,
  event      TEXT NOT NULL,   -- opened | proposed | confirmed | edited | abandoned | declined
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, day, event)
);
```

**Edit rate is the interpretation-accuracy signal** — the fraction of confirmed entries where a
value was changed first. If it runs high, the prompt is wrong, and that becomes knowable from data
rather than from complaints.

## A6. Text input this version

The sheet's existing text field is the input. Voice is v3.63.0. Everything above is input-agnostic
on purpose.

---

# v3.63.0 — Voice layer

**Do not start until v3.62.0 is deployed and real-device verified.**

## B1. Verified device behavior — build to this, don't re-derive it

Spiked on iPhone, iOS 18.7 / WebKit 605.1.15, **home-screen standalone PWA** — the case most likely
to fail. Confirmed:

- `webkitSpeechRecognition` and `speechSynthesis` both available.
- **The mic reopens after TTS with no new user gesture.** Multi-turn hands-free works.
- Interim results stream during speech.
- Full loop ran end to end including a correction turn.

Requires a secure context. Fails silently on `file://`.

## B2. Timing is the design constraint

The unoptimized spike loop took **21 seconds** against a doctrine of under-5-second interactions.
Two required fixes:

1. **The spoken summary must not enumerate values** (`UX-41`). The spike spent **8 seconds** saying
   "Say yes and I will log 12 oz of water, and 10 g of protein, and 400 kcal of calories." The card
   is on screen carrying all of it. Say *"Got three — say yes?"* Under two seconds.
2. **Drop the opening prompt.** Start listening when the overlay opens. The overlay says what it
   wants; speaking it too costs ~2s and a recognition cycle.

Target ~10–12 seconds. Be honest in the changelog that this exceeds the 5-second doctrine — voice's
advantage is hands-free, not raw speed.

Recognition takes ~2–3s of trailing silence to finalize each turn. Budget for it; don't engineer
it away.

## B3. Spoken units

The spike said "400 kcal of calories." Spoken and display unit forms are different strings. Map
`kcal` → "calories", `oz` → "ounces", `g` → "grams". Say the unit once.

## B4. Loop

```
tile tap
  → overlay opens, mic starts immediately
  → interim transcript streams
  → recognition ends → POST /api/interpret  (unchanged from v3.62.0)
  → confirm card renders WITH values visible
  → short spoken prompt (<2s)
  → listen
      "yes"/"yep"/"confirm"  → write via the v3.62.0 path, source:"voice"
      anything else          → correction: re-interpret, re-render, re-prompt
  → tap Confirm always available and always works
```

- The card is on screen **before** the spoken prompt, never after (`PROD-16`).
- Candidate disambiguation is **tap-only**. Never read options aloud.
- Cap corrections at 3 rounds, then fall back to manual edit on the card.
- Every state has a visible non-voice escape.

## B5. States and fallback

Real states, not a spinner: `idle · listening · thinking · proposing · confirmed · error`.

Distinct copy and a manual path for: mic permission denied, no speech detected, recognition
unsupported, network failure, `declined`, over cap.

Show interim results live — muted/italic while interim, solid when finalized. It's what makes the
overlay feel responsive rather than frozen.

**If `SpeechRecognition` is absent, the tile opens the v3.62.0 text sheet.** Never a dead tile,
never a "not supported" dead end.

Modal title: **"My AI Voice Tracker."**

---

## Verification (both versions)

Per CLAUDE.md, all five steps, no exceptions:

1. `node esbuild.config.js`
2. `node tools/harness.js site/app/bundle.build.js` — clean
3. ESLint `no-undef` sweep on `bundle.build.js`; confirm the count against the 11-error vendor
   baseline
4. Copy over `site/app/bundle.js`
5. Re-run harness **and** lint against the exact deployed file

Then **audit the end state** — confirm every intended change is actually present.

**jsdom cannot test v3.63.0's core.** Mic permission, speech recognition, and TTS are real-device
only. Say so plainly rather than implying coverage. Same for sheet layout — jsdom has no layout
engine.

Update `tools/harness.js` for the replaced sheet internals; the preview shell's selectors will go
stale.

## Needs Rob

- Nothing blocking to start v3.62.0. The API key and spend limit are set; the cap migration is run.
- The `smart_entry_events` migration, when analytics lands.
- `SMART_ENTRY_DEBUG_SECRET` is optional — only needed if single-phrase cache-bust testing is
  wanted.
- Real-device passes between versions.

## Out of scope

Autonomous logging. Health advice or commentary of any kind. AI coach (`STRAT-11` did not reopen
it). Wake words or background listening. Non-English. Any capability beyond entry-and-confirm
(`UX-14`). Restyling the Voice Tracker tile.
