# CC-BRIEF — Partner showcase (v3.64.0)

**Written:** Aug 28, 2026 · **Status:** ready to run · **Author:** Claude (strategy project) → Claude Code

**Context:** Rob is demoing this at a tech conference next week to an audience that includes
wellness-clinic operators, pharmacies, and physician offices. `TRACK-02` shipped a real
`settings.partners` data model in v3.60.0/v3.61.0 — and almost nothing in the app renders it. This
session makes the clinic relationship visible. It is the difference between demoing a personal
tracker and demoing a clinic tool.

**Scope discipline:** this is presentation of data that already exists. No new data model, no
server-side clinic infrastructure, no protocol codes, no multi-tenancy — all of that is gated
behind clinic-pilot validation that hasn't happened (`STRAT-OPEN-03`). If a change here requires a
new field on `settings.partners`, stop and flag it.

---

## 0. Read first

- `docs/DECISION-LOG.md` — `TRACK-02` (the partner data model and what was deliberately excluded),
  `TRACK-01`, `UX-11`, `UX-15`, `UX-16`, `UX-17`, `STRAT-10`.
- `docs/CURRENT-STATE.md` — My Plan's "My Health Providers" section, the RX page's three-section
  structure, the Health Summary / doctor-share output.

The data model, unchanged: `{ id, name, type: "treatment"|"rx", logoDataUri, link }`, referenced by
items via `partnerId`. Deleting a partner clears `partnerId` on referencing items without deleting
them.

---

## A. Partner cards on My Plan

Today "My Health Providers" renders a plain list. Make it real cards.

- Logo at a generous size (the partner uploaded it once; use it), name, and a type label.
- A count of how many Treatment/Prescription items reference this partner — "3 items" — so the
  relationship is legible at a glance.
- The `link` as a tappable action, opening in a new tab.
- Tap the card to edit; keep the existing Add Partner sheet unchanged.
- **Empty state matters for the demo.** With no partners configured, show a single inviting card
  explaining what a partner is and prompting Add Partner — not a blank region.

Card styling per `UX-15`/`UX-16`: `--surface-dark` background, `--hairline-bright` border,
`--ink-inverse` text, `--muted-dark` for the count and type label.

## B. Partner attribution on the RX page

The highest-value change in this session. The RX page is where a patient looks at what they're on;
right now every row is visually identical regardless of who prescribed or administers it.

- Each item row in the Treatments and Prescriptions sections shows its partner's logo inline
  (small, ~28px, left of or beneath the item name) plus the partner name in `--muted-dark`.
- Items with no partner render exactly as they do today. **Self-managed items must not regress** —
  "No partner" is the default and the common case (`TRACK-02` §4).
- Supplements: include partner attribution if a supplement item can carry a `partnerId`; if the
  data model doesn't allow it, skip Supplements rather than adding a field.
- Do not restructure the three sections or change the page title.

## C. Partner branding on the Health Summary / doctor-share

The strategic one, and worth understanding before building: when a patient shares their summary
with a physician, the clinic's logo travels with it. That downstream visibility is a clinic's
actual incentive to hand this app to patients — it's the B2B2C loop made concrete. Rob will say
this out loud in the demo, so it needs to look deliberate, not tacked on.

- A "Care team" or "Providers" block listing each partner with logo and name, rendered on both the
  embedded summary and the standalone `?share=` page.
- **The share overlay is exempt from the dark theme and stays light** (`UX-15`). Style accordingly;
  do not inherit dark tokens here.
- Only include partners that are actually referenced by at least one item — don't list an orphaned
  partner record.
- Include it by default. If it's trivial to add a toggle in the share flow, add one defaulted on;
  if not, default-on is fine for now and can be revisited.

**Privacy note worth flagging, not solving:** the share link is unauthenticated with a 90-day
expiry. Adding provider names to it increases what a leaked link reveals. That's a real
consideration for `LEGAL-OPEN-01`, not a blocker for this session — record it in the Decision Log
entry rather than silently shipping past it.

## D. Demo seed data (fold in here — small, and v3.65.0 depends on it)

A hidden action in Settings, at the bottom, clearly labeled as demo/testing:

- **Load demo data** — populates ~30 days of history across all nine trackers with realistic
  variation (not perfect adherence; some missed days, some partial), two partners with logos, RX
  and Supplement items at varying supply levels including one low-supply and one near-expiry, and
  a mix of `source: "manual" | "smart" | "voice"` entries.
- **Clear demo data** — removes only what the seeder created, leaving real entries intact. Tag
  seeded entries so this is exact rather than date-range guesswork.

Reasoning: the adherence charts in v3.65.0 cannot render meaningfully against a few days of real
logging, and every screen in this session looks better with data behind it. It also lets Rob reset
between conversations at the conference instead of depending on whatever is in his personal log.

Keep it out of the way — a real user should not stumble into it.

---

## Verification

Per CLAUDE.md, all five steps, no exceptions:

1. `node esbuild.config.js`
2. `node tools/harness.js site/app/bundle.build.js` — clean
3. ESLint `no-undef` sweep on `bundle.build.js`; confirm against the 11-error vendor baseline
4. Copy over `site/app/bundle.js`
5. Re-run harness **and** lint against the exact deployed file

Then audit the end state — confirm every intended change is present.

Update `tools/harness.js` for the new card markup and the seeder. jsdom has no layout engine, so
card proportions, logo sizing, and the share page's print rendering are **real-device only** — say
so plainly in the wrap rather than implying coverage.

## Needs Rob

- Real-device pass, particularly the RX page's inline logos at small size and the share output.
- Nothing blocking to start.

## Out of scope

Protocol codes. Clinic dashboard. Multi-tenancy. Server-side partner records. Any new field on
`settings.partners`. Restructuring the RX page's sections. Changing the Add Partner sheet.
