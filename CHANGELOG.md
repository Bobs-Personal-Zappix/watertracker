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
