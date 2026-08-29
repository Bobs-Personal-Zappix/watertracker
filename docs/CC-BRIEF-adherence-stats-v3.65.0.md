# CC-BRIEF — Adherence over time on Stats (v3.65.0)

**Written:** Aug 28, 2026 · **Status:** ready to run · **Author:** Claude (strategy project) → Claude Code

**Depends on v3.64.0** — specifically the demo seed data. An adherence chart rendered against a few
days of real logging shows two or three bars and reads as broken. Do not start this session until
v3.64.0 is deployed and the seeder produces ~30 days of history.

**Why this matters:** adherence is the one differentiated data set this product has. The decision
log says so explicitly in the aggregator entry — everything else (steps, sleep, weight) is
commodity data that funded aggregators already own. Right now the app *claims* adherence tracking.
This session makes it a screen Rob can point at in front of a clinic operator.

---

## 0. Read first

- `docs/DECISION-LOG.md` — **`TRACK-02` §5 is the spec.** It scoped this precisely so this session
  wouldn't have to re-derive it. Also `UX-32` (the Weight-ring amendment and its reasoning about
  fabricated percentages), `TRACK-01`, `UX-15`, `UX-16`.
- `src/app.js` — `computeTrackerStats()`, the existing Water/Protein/Calories bar-chart tab, and the
  Weight/Sleep trend-line tab. Reuse both patterns; build no new visualization primitive.

---

## A. Adherence over time — the core view

Per `TRACK-02` §5, already decided:

- **Percentage of scheduled**, over day / week / month — the same period control the existing charts
  use.
- Shaped like the **Water/Protein/Calories bar chart**, not the Weight/Sleep raw-value line. This is
  a completion metric, not a reading.
- **Items with no schedule show a count, not a fabricated percentage.** This is the same reasoning
  `UX-32` established for Weight's ring: don't invent a denominator that doesn't exist. An
  as-needed supplement logged four times this week is "4 logged," not "80% adherent."
- Covers the three RX-family trackers: Treatments, Prescriptions, Supplements.

Use the existing category color tokens (`--meds`, `--treatment`) rather than introducing new ones.

## B. Per-partner filter

A filter on top of the adherence view — "All partners" plus one entry per configured partner.
`TRACK-02` §5 is explicit that this needs no new visualization primitive; it's a filter over the
same chart.

This is the view that carries the demo: *"here is this patient's protocol adherence over 30 days,
filtered to your clinic."* Make sure the filtered state reads clearly — the partner's name (and
logo, if it fits) visible while filtered, so a screenshot of it is self-explanatory.

Items with no `partnerId` group under "Self-managed."

## C. Inventory and expiration timeline

Per `TRACK-02` §5: **a sorted list or card view, not a chart.** The app doesn't snapshot
`qtyRemaining` over time, so there is no real time axis to plot — inventing one would mean
fabricating history.

- Sorted by urgency: soonest expiry and lowest supply first.
- Each row: item name, partner attribution (from v3.64.0's work), remaining count, expiry date, and
  a clear visual state for low-supply and near-expiry.
- Reuse the existing low-supply/near-expiry thresholds already used on the RX page. Do not invent
  new ones.

## D. Placement on Stats

Stats is already long. Do not simply append.

Add adherence as a **peer of the existing metric views** — reachable from the same control that
switches between metrics, rather than as a separate scrolling section. The inventory timeline can
sit as its own card in the page flow, near the existing Edit Prior Days / Health Summary cards.

If the existing metric control can't accommodate another option cleanly, say so and propose the
smallest alternative rather than forcing it.

---

## Verification

Per CLAUDE.md, all five steps, no exceptions:

1. `node esbuild.config.js`
2. `node tools/harness.js site/app/bundle.build.js` — clean
3. ESLint `no-undef` sweep on `bundle.build.js`; confirm against the 11-error vendor baseline
4. Copy over `site/app/bundle.js`
5. Re-run harness **and** lint against the exact deployed file

Then audit the end state.

**Watch bundle weight.** Recharts is already the majority of the bundle and only Stats needs it. If
this work pulls in additional Recharts modules, flag the size delta rather than shipping it
silently.

Chart rendering is **real-device only** — jsdom has no layout engine. Verify the computation in the
harness (correct percentages, correct handling of unscheduled items, correct partner grouping) and
say plainly that visual rendering is unverified.

## Edge cases to handle deliberately

- No partners configured → the filter is hidden entirely, not shown empty.
- No RX-family items at all → an empty state explaining what adherence tracking is, not a blank
  chart.
- An item added mid-period → its denominator starts from when it was added, not from the period
  start. Otherwise a newly-added item shows as catastrophically non-adherent.
- A deleted partner → its items appear under "Self-managed," consistent with `TRACK-02`'s behavior
  of clearing `partnerId` without deleting items.

## Needs Rob

- Real-device pass on chart rendering and the filter control.
- v3.64.0 deployed first, with seed data working.

## Out of scope

Clinic-side dashboard. Multi-patient views. Exporting adherence data. Any new snapshotting of
`qtyRemaining` over time. Changes to the existing Water/Protein/Calories or Weight/Sleep charts.
