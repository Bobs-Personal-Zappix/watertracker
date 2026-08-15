# HydroPro Tracker — Changelog

All notable changes to this project are tracked here, most recent first.

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

---

## [2.9.0] — 2026-08-14

Four quick refinements to Supplements & Prescriptions, plus a programmable daily reminder for them, plus a real bug fix found along the way.

### Changed
- Renamed to "Log Supplements & Prescriptions" throughout (button, sheet title, Settings section).
- **Time field added** — the current time is used by default, but it's now editable, so you can log something after the fact without it showing at the wrong time.
- **Quantity field added per item** — a free-text field (not restricted to numbers), so "1" for a tablet or "10mg" for a measured dose both work. Appears under each item once you select it, and shows in the combined Today's Log label, e.g. "Took: Vitamin D (1), Metformin (10mg)".
- Today's Log time text darkened and bolded — now that the log is genuinely useful to scan at a glance, the time should be one of the first things that's easy to read, not a faded afterthought.
- Backward compatible with entries already logged under the old format (items as plain names, no quantity or custom time) — editing one of those won't crash, it just treats the quantity as blank.

### Added
- **Supplement reminder** — a new card in Remind, matching the existing Bedtime reminder pattern exactly: toggle on, pick a time (like 10am), get a daily push notification. Reuses the same push infrastructure already built for bedtime and feedback alerts, so no new service or setup was needed beyond the Worker update this requires.

### Fixed — a real, pre-existing bug
While building the reminder above, testing surfaced something unrelated but serious: **restoring a backup was silently wiping out your Bedtime reminder setting**, and would have done the same to feedback-watch notifications and the new supplement reminder once shipped. The backup-import logic only remembered to preserve your push subscription from the current device — everything else device-specific in that same object was simply left out of the rebuilt settings, rather than carried forward. Fixed so bedtime, supplement reminder, feedback-watch, and push all correctly survive a restore now, with a dedicated test simulating a real file-based import to make sure this can't silently regress again.

### Testing note
Also found and fixed a second, unrelated latent bug in the Worker's own test suite — three tests computed a "due" time as "a couple minutes before whatever time it happens to be right now" but paired it with a hardcoded 11pm cutoff, which broke whenever the tests happened to run late at night (as they did today). Replaced with a time-of-day-safe calculation. Neither of these two bugs were introduced by today's changes — both were pre-existing, just waiting for the right conditions to surface, and both are now fixed with regression tests in place.

---

## [2.8.0] — 2026-08-14

Supplements & Medicine tracking — the third and last of this round's three requested additions.

### Added
- **"Log Supplements & Medicine"** — a full-width button below "Log My Weight." Opens a multi-select list of whatever you've set up in Settings; tap everything you're taking right now, then Log.
- **New Settings section** to manage the list — add, rename, or remove any vitamin, supplement, or medicine you take regularly, so it shows up as a one-tap option in the log popup.
- Multiple items selected at once combine into a single Today's Log row (e.g., "Took: Vitamin D, Fish Oil") rather than one row each, matching how sleep already combines lights-out/wake into one row instead of two.
- Full editing support — reopening a logged entry shows exactly which items were selected, pre-checked, ready to adjust and re-save.
- A clear empty state (with a direct link into Settings) if the popup is opened before anything's been added yet, rather than showing a confusing blank list.

### Process note
Two bugs from this same pattern were caught and fixed *before* shipping this time, not after: editing a supplement entry would have silently misrouted into the wrong editor (same class of bug found with weight last round), and the migration guard preventing data destruction on reload was added from the very first draft rather than as a follow-up fix. Both were things this project already had to learn the hard way twice — applying that lesson proactively a third time.

### Testing note
21 new tests cover the full flow: adding items in Settings, the empty state, multi-select toggling, the combined-row behavior, and editing. A dedicated reload-safety test (the same kind that caught real bugs for sleep and weight) confirmed supplement entries and the Settings list both survive a full reload intact.

---

## [2.7.0] — 2026-08-14

Weight tracking, the second of three requested additions this round.

### Added
- **"Log My Weight"** — a full-width button below the four trackers, opening the same drag-dial interaction used elsewhere, but with a wider range (0–400lbs) and, unlike the other dials, decimal precision available in the manual entry field (e.g., 165.4) since weight tracking usually cares about tenths of a pound. The dial drag itself still snaps to whole numbers — dragging precisely to a decimal isn't realistic with a thumb, but typing one is.
- Weight entries show in Today's Log alongside everything else, and can be edited or deleted the same way.
- **New "Weight Over Time" section in Reports** — a line chart, always visible below the existing goal-comparison reports. Weight doesn't fit the "sum vs. daily goal" model the other four metrics use (there's no daily goal, and multiple same-day entries take the most recent one rather than summing), so this needed its own visualization rather than joining the existing segmented view.

### Fixed along the way
- Editing a weight entry from Today's Log was routing into the water/protein/calories editor by default, since only sleep had a special case — this would have silently misfired if not caught. Added the same explicit routing sleep already had.

### Technical note
Weight entries got the exact same migration guard added for sleep earlier this session (skip the consumption-metric transform in `migrateEntry`), since without it they'd have been silently destroyed on the next reload — same bug, same fix, applied proactively this time before it could ship. Verified with a dedicated reload test, same as sleep's.

---

## [2.6.0] — 2026-08-14

Streamlined logging flow, based on tester feedback that the per-card buttons felt busy.

### Changed
- **The entire tracker card is now the button.** Tap anywhere on Water, Protein, or Calories and its dial opens immediately — no more separate "Log Water/Protein/Calories" buttons taking up space on each card. Sleep works the same way, tapping the card opens the sleep flow directly.
- **New flow order for the three shared-sheet metrics:** tapping a card opens *that metric's* dial right away (skipping the old intermediate full-form screen). Hit Done, and *then* the full log sheet appears — pre-filled with the value you just chose — where you can add the other fields or just submit immediately. Fewer taps for the common case of logging one thing, while the "log several things at once" flow still works exactly as before once you're in the full sheet.
- Cards now show a small tactile press effect when tapped, since they're the whole interactive surface now rather than just containing a button.

### Testing note
This changed the core interaction model enough that a large share of the existing test suite needed rewriting, not just patching — anywhere a test used to click a labeled button now taps the card itself and checks that the right dial opens first. Re-ran the real-browser drag test too, confirming actual mouse drags still land on the correct values through the new flow (tap card → dial opens → drag → Done → pre-filled full sheet).

---

## [2.5.2] — 2026-08-13

Real bug, found by actually using the feature: submitted feedback with the "notify me" toggle already on, and no notification arrived.

### Fixed
- The "Notify me when new feedback comes in" toggle only ever registered anything with the server if push notifications already had an active subscription — if push wasn't fully set up yet, flipping the toggle silently updated the on-screen switch and did nothing else. No error, no registration, nothing. Made worse by the toggle living in Settings while the actual push toggle lives in a separate Remind tab, so there was no visual cue connecting the two.
- Now, trying to turn it on without push already active is blocked with a clear message pointing to the Remind tab, instead of silently no-op'ing.
- If your device already has `feedbackWatching` stuck in this broken "on but never registered" state from before this fix: toggle it off, then make sure Push notifications shows "enabled on this device" in Remind, then toggle it back on.

---

## [2.5.1] — 2026-08-13

Solves a real gap: with no login system, feedback had no way to say who sent it.

### Added
- **"Your name" field in Settings**, set once — automatically attached to every feedback submission from then on, rather than asking every single time and adding friction back to a form specifically built to be fast.
- The feedback form now shows exactly who it'll be submitted as, or a clear warning ("this will be submitted anonymously") with a direct link back to Settings if no name has been set yet.
- The push alert you get when new feedback arrives now includes the person's name, not just their overall rating.
- Unlike the feedback-watch toggle (which is device-specific), the name is treated as a personal preference and included in backup export/import — restoring a backup on a new phone carries it over instead of asking again.

### Considered and set aside
Looked at auto-detecting identity through Cloudflare Access instead of asking people to type a name. This doesn't work as-is: the feedback API call goes to a separate Worker domain (`workers.dev`), not through the Access-protected `hydroprotracker.com` path, so the authenticated-user header Access provides never reaches it — the Access login cookie is scoped to the main domain and isn't sent cross-domain to the Worker. Solving this properly would mean routing the Worker under the main domain instead of a separate subdomain, a real infrastructure change. The name field solves the actual problem today without that.

---

## [2.5.0] — 2026-08-13

In-app feedback form, so testers don't need to leave the app to tell you what's working.

### Added
- **"Give Feedback" in Settings** — a brief form (about 30 seconds): four quick tap-to-answer questions (overall experience, daily-use frequency, whether entries happen immediately or in batches, and opinion on the new drag dials), plus three optional short-text questions for what's working, what's missing, and what to add next. Only the first question is required.
- Submissions are stored in the same Cloudflare KV store already used for push subscriptions, under a new `feedback:` key prefix.
- **"Notify me when new feedback comes in"** toggle in Settings — reuses the existing push notification pipeline rather than adding a new service. Turning this on registers the current device as a "watcher"; every new submission pings all registered watchers. Multiple people could watch if that's ever useful — it's a list, not a single fixed admin slot.

### Technical note
Deliberately excluded the new watcher toggle from backup export/import, matching how the push subscription itself is already excluded — it's tied to a specific device, so restoring a backup on a new phone shouldn't silently make that new phone a feedback watcher too.

### Testing note
Worker-side (registration, storage, push-alerting, and graceful behavior with zero watchers) covered by 12 new tests. App-side UI (all 7 questions present, chip selection, required-field validation, optional text entry, graceful failure when unsubmitted) covered by 12 more. Visually confirmed the actual rendered form with a live screenshot before considering it done — with real network calls to the production Worker deliberately blocked during that check, since testing the live submission path would have created a real KV entry and potentially pushed a real device.

---

## [2.4.1] — 2026-08-13

### Added
- **Quarter-point tick labels on the drag dial** — shows the actual value at the 3/6/9 o'clock positions (e.g., 16/32/48 for water's 0–64 range), so you know roughly how far to drag before you start. One correction along the way: the 9 o'clock mark is 75% of the max, not the max itself — the true max only appears back at the top after a full turn, so the labels show the mathematically accurate values that match where a drag actually lands.
- Updated instructional text on the dial screen to be clearer about the two ways to enter a number.

### Changed
- Reordered Remind page: "In-app nudge" now comes before "Calendar backup," which moves to the very bottom of the page as the least-used option.

### Testing note
Re-ran the real-browser drag test after slightly shrinking the ring to make room for the tick labels — confirmed all four clock positions still land on the exact right values, since the drag math depends only on angle from center, not the ring's visual radius.

---

## [2.4.0] — 2026-08-13

Drag-to-enter dial for the manual Log form — the biggest interaction change since the app's original build, based on real gym-floor frustration with typing numbers one-handed.

### Added
- **Drag dial for Water, Protein, and Calories.** Tapping any of the three fields in the Log sheet now opens a full-size circular dial — drag your finger around it to set the amount, starting at 0 at the top and increasing clockwise. A text field stays visible below the dial at all times, so typing an exact number is just as available as dragging one; both update each other live.
- Ranges: Water 0–64oz, Protein 0–80g, Calories 0–800cal, snapping to whole numbers.

### Testing note
This feature needed a different kind of testing than anything else in this project — dragging a finger around a circle isn't something the usual jsdom-based test suite can actually simulate, since it doesn't produce real screen geometry. Two things made this possible to verify properly instead of shipping blind:
- The angle math itself (converting a touch position into a 0–max value) was pulled out into small, pure functions with no DOM dependency, so it could be unit-tested directly against known positions (12/3/6/9 o'clock) across all three metric ranges.
- Playwright turned out to be available in this environment, which meant an actual headless browser could physically drag the mouse around the real, rendered dial and read back the resulting number — not a simulation of the interaction, a real one. This caught a real bug along the way (the dial modal was nested inside the Log sheet's own backdrop, so closing the dial would have also accidentally closed the whole sheet without an explicit fix).

This new browser-based test (`dial-drag-test.py`) is saved permanently in the project, separate from the existing jsdom suite, specifically for future changes that touch drag/gesture behavior.

### Known limitation
No amount of simulated testing replaces an actual finger on an actual screen. This is flagged as needing real-world confirmation before considering it done.

---

## [2.3.0] — 2026-08-13

Branding update, plus a teaser for what's coming next.

### Changed
- **Landing page redesigned** into a real structured business page: new logo and icons throughout, alternating light/dark sections instead of one continuous scroll, new tagline copy, and a new "Why These Four?" and "Good to Know" FAQ section. The old detailed step-by-step instructions (presets, reminders, backup) were removed from this page — that level of detail now lives exclusively in the app's own "How to use this" tutorial.
- "...by Boston Pickleball Assoc." removed from the app header and the landing page hero/footer, replaced with "© 2026 HydroPro Tracker Inc. All Rights Reserved." on both the landing page footer and the app's Settings → About section.

### Added
- **"AI Coach" nav item** — a fifth bottom-nav button with a "Coming Soon" badge, intentionally non-functional. This is purely a teaser for future AI-driven analysis and recommendations; no actual AI functionality was built or implied to exist yet.

### Process note
Discovered mid-session that Playwright is available in this environment, which made it possible to genuinely render and screenshot both the new landing page and the live app itself before shipping — including the small "Coming Soon" badge, which needed visual confirmation it wouldn't overlap the Settings button next to it. This is a real capability upgrade over relying on structural DOM checks alone for anything visual.

---

## [2.2.1] — 2026-08-13

### Changed
- Header badge now shows just the droplet mark with its background removed, instead of the full square icon card, which looked out of place sitting next to the title text. Background removal needed a more careful approach than usual — a simple color/brightness cutoff couldn't cleanly separate the droplet from its background since some of the droplet's own shadow areas were just as dark as parts of the background; used a flood-fill technique instead (growing inward from the transparent corners, following color similarity) with two small manually-seeded spots for a couple of stubborn corners the automatic fill didn't reach on its own.
- Badge enlarged (68px → 82px) to stand out more now that it's just the droplet rather than a full square card.

---

## [2.2.0] — 2026-08-13

New brand mark, plus a second readability pass on the progress rings based on this morning's feedback.

### Changed
- **New main logo** — Rob's newest design (a droplet containing the moon, bicep, and apple, no text this time) now used for both the app icon/favicon and the in-app header badge, replacing the previous 2×2 grid of four separate icons in the header. Verified at 192px and 32px before shipping, same as every icon change this project has made. The 4 individual tracker gauge images are untouched — only the outer logo changed.
- **Ring track darkened further** (opacity 0.22 → 0.42) — the previous pass helped, but testing this morning at the actual start of a real day showed it still wasn't visible enough.
- **Added a position marker** — a small white dot with a colored border now sits at the current edge of the filled progress, making "this is exactly where you are right now" immediately clear rather than requiring someone to eyeball where the color stops.

---

## [2.1.1] — 2026-08-13

Readability pass on the tracker headers and rings, based on feedback that both were too subtle to read at a glance.

### Changed
- Tracker section titles (WATER/PROTEIN/CALORIES/SLEEP) significantly enlarged (12.5px → 16px) — this is now the loudest text in each card besides the number itself. Font weight was already at 700, which turned out to be the heaviest weight actually loaded for this typeface, so size was the real lever here, not weight.
- **Ring track color now uses each metric's own color** (at low opacity) instead of a shared neutral gray — this directly fixes the "rings look grey and unnoticeable at the start of the day" problem, since the track itself is now tinted blue/green/orange/indigo depending on the metric, visible even at 0% progress.
- Ring stroke thickened (6px → 7.5px) for more visual weight overall.
- "Log Water/Protein/Calories/Sleep" button text bumped and bolded to match the more prominent header treatment above it.

---

## [2.1.0] — 2026-08-13

Interactive sleep tracking, based on tester feedback.

### Added
- **"Start Sleeping" / "Finish Sleeping" buttons.** Tapping Log Sleep now shows the right action automatically — "Start Sleeping" if nothing's in progress, "Finish Sleeping" (with how long it's been) if a session is already running. Duration is calculated from the actual moment each button was tapped, not from typed-in clock times, so there's no midnight-crossing guesswork needed for this flow specifically.
- The Sleep tracker card now shows a live "😴 Sleeping…" indicator in place of the usual "to go" text while a session is in progress.
- A "Cancel — started by mistake" option clears an accidentally-started session without logging anything.
- The original manual entry flow (enter both Lights Out and Woke Up times at once) is still available via "Enter times manually instead" — this stays the right tool for logging retroactively or catching up after forgetting to tap Start.
- Naps work identically to overnight sleep in this new flow — Start, then Finish shortly after — no separate nap button needed, same as before.

### Technical note
Added a new top-level `activeSleepSession` field (an exact timestamp, not a time-of-day) specifically so a session can safely span across midnight or even multiple days without needing the same "guess whether it crossed midnight" heuristic the manual entry flow relies on. Included in backup export/import from the start this time, having been caught missing a new field from backups twice before with other features.

---

## [2.0.0] — 2026-08-13

A full visual redesign using real generated artwork instead of hand-built shapes — the biggest visual change since the original build.

### Changed
- **All 4 tracker gauges rebuilt from scratch.** Replaced the hand-coded fillable shapes (bottle, battery, flame, bed) with a new design: Rob's own generated crystal/gem-style artwork for water, protein, calories, and sleep, each wrapped in a circular progress ring that fills as you approach your goal. This sidesteps a real, persistent limitation — some organic shapes (the bicep in particular, across five separate attempts throughout this project) never rendered convincingly from basic geometric primitives, while a progress ring is simple, reliable geometry that works regardless of what's inside it.
- **New app icon** — cropped from Rob's generated mark down to just the icon itself (moon, droplet, HP lettermark, bicep, apple, ring), with the baked-in "HYDROPRO TRACKER" text removed after confirming empirically that it became unreadable noise at real icon sizes (192px and especially 32px).
- **Header badge redesigned** to use the same 4 artwork images in a 2×2 grid, replacing the previous lucide-icon version, so the logo, the header, and the trackers themselves all now share one consistent visual identity for the first time.

### Process note
This redesign took a real wrong turn before landing right — several attempts to hand-build a fillable bicep shape (mirroring bed and flame's past construction techniques) all failed, producing shapes that read as a chess pawn, a mushroom, and a snowman in turn. Installed `cairosvg` mid-session specifically to render and inspect each SVG draft before committing to it, rather than continuing to guess blind — this is what caught those failures immediately instead of after shipping. The actual fix was recognizing the fillable-shape approach itself was the wrong tool for this particular case, not a shape worth continuing to iterate on — Rob's own reference images already contained the better answer (a progress ring), which sidesteps hand-building organic shapes entirely.

### Technical note
The 4 artwork images are stored as separate cacheable PNG files (not embedded in the JavaScript bundle), specifically to avoid the bundle's aggressive no-cache policy — a policy that exists for a good reason (an earlier caching bug), but would have meant re-downloading all 4 images on every single app open if they'd been embedded instead.

---

## [1.7.1] — 2026-08-12

### Fixed
- Sleep tracker's icon, "Slept" label, and Log button sat higher than Calories' equivalent elements in the same grid row — the bed gauge was 88px tall while the other three were 96-97px, so everything below it landed at a different vertical offset. Equalized all four gauges to the same height, scaling each width proportionally to keep its own aspect ratio intact.
- Also hardened the "to go" caption above each gauge to always reserve space for 2 lines regardless of whether that particular card's text actually wraps — this was a second, independent way the same kind of misalignment could have resurfaced later with a different combination of numbers (e.g., "550cal over" wrapping while "8hrs to go" doesn't).

---

## [1.7.0] — 2026-08-12

Sizing correction and a real logo redesign.

### Changed
- Tracker cards, gauges, and text bumped back up moderately (~30% bigger than the previous round) after they turned out too small — still fits all 4 on screen, just with the extra room put to use instead of left empty.
- **New 4-icon logo**, used consistently in both the in-app header badge and the phone home-screen icon: droplet, battery, flame, and bed arranged in a 2×2 grid instead of squeezed into a single row. This reads as a deliberate mark rather than icons tacked on as they were added one at a time, and gives sleep equal visual weight to the original three.
- Landing page hero badge updated to match (kept intentionally monochrome, consistent with its existing style, rather than colorizing it to match the in-app version).

### Design note
The bed icon worked on the first attempt this time — a simple headboard + mattress + pillow + legs construction, same "keep it simple" approach that worked well for the battery earlier. Confirmed by actually viewing the generated icon at multiple sizes before shipping, same discipline as every icon change this project has gone through.

---

## [1.6.0] — 2026-08-12

Fits all 4 trackers on screen at once, restructured the Log buttons per-card, and added the bedtime reminder.

### Changed
- All 4 tracker cards, their gauges, and their text shrunk significantly (~45% smaller graphics, tighter spacing) so the full 2×2 grid fits on a phone screen without scrolling. Presets and Today's Log remain below the fold, which is fine since they're used less at-a-glance than the trackers themselves.
- Replaced the single shared "Log" button with four separate buttons — Log Water, Log Protein, Log Calories, Log Sleep — one under each tracker card. The first three all open the same unified multi-field sheet; only Sleep opens its own dedicated flow. This restores visual symmetry across all 4 cards.

### Added
- **Bedtime reminder.** New card in Remind → Bedtime reminder, with its own enable toggle and time picker, completely independent of the existing interval-based reminder schedule. Sends once per day via push notification.
- Worker updated to store and check bedtime independently from the regular reminder schedule — both can fire in the same run if both are due, and each has its own de-duplication so neither can double-send in a day.
- In-app tutorial and the public landing page both updated to mention sleep logging and the bedtime reminder, and the landing page's hero now shows all 4 tracked metrics instead of 3.

### Testing note
The Worker's bedtime logic got the same rigor as everything else this project has shipped: verified it fires independently of the interval schedule, doesn't re-send the same day, correctly sends both notifications when both are due in the same run, and respects being disabled — 9 new Worker-side tests, all passing alongside the 20 that already existed.

### Deployment note
This release requires **two separate deploys** — the site update as usual, and a Worker redeploy for the bedtime reminder to actually function. The site half will work fine on its own (the Settings UI will just save a preference that doesn't do anything yet) until the Worker catches up.

---

## [1.5.0] — 2026-08-11

Sleep added as a fourth tracked metric — water, protein, calories, and now sleep, covering all four fuel categories testers asked for.

### Added
- **Sleep tracking.** New "Log Sleep" button opens a dedicated flow with Lights Out and Woke Up time pickers. Duration is calculated automatically, including sessions that cross midnight — inferred by comparing clock times rather than requiring a manual "this was yesterday" toggle.
- **Naps** use the exact same flow (just without crossing midnight) and accumulate into the same daily total as overnight sleep — no separate nap feature needed.
- **Bed gauge** — a new fillable graphic matching the visual language of the other three trackers, filling as you approach your sleep goal.
- Sleep integrated into **Reports**: its own metric option with Day/Week/Month views, and included in the combined "All 4" comparison view (renamed from "All 3").
- Sleep goal and a "Show on Log page" visibility toggle added to Settings, matching the existing pattern for the other three metrics.
- Log page moved from a 3-column row to a **2×2 grid** to fit the fourth tracker.
- Today's Log shows a sleep session as one row with both times and total hours, rather than splitting it into separate entries.
- Backup export/import and CSV export both updated to include sleep data and settings.

### Fixed
This round involved auditing a substantial amount of sleep-tracking code that already existed in the file from earlier work, and fixing several serious bugs found in it before any of it could be considered safe to ship:
- **Critical data-loss bug**: the migration logic that runs on every page load had no awareness of sleep entries, and was silently zeroing them out — every sleep entry would have been destroyed on the very next reload. Fixed and specifically tested against a real reload cycle.
- **App-breaking bug**: a `BedIcon` component was referenced in the UI but never defined or imported anywhere, which would have crashed the entire app on render.
- The "Log Sleep" button and sheet existed in the UI but had no state or handlers actually wiring them together — tapping it would have done nothing.
- Editing a sleep entry was routing to the wrong form entirely (the water/protein/calories editor instead of the sleep editor).
- The 2×2 grid layout and the dual Log-button row were referenced in the code but had no CSS defining them.
- There was no way to actually set a sleep goal or hide sleep from the Log page, despite the underlying data model supporting both.
- Backup export/import and CSV export were all missing sleep entirely — the same category of bug caught twice before with presets, now fixed for sleep too before it could bite anyone.

### Known follow-ups
- The bedtime reminder (a push notification at a configured lights-out time) is intentionally not included in this release — it needs changes to the Cloudflare Worker, not just the site, so it's planned as its own follow-up deploy.
- Tracker cards haven't been resized to take advantage of the extra width in the new 2×2 grid (they're sized the same as they were in the old 3-column row) — worth a look if the proportions feel off now that there's more room per card.
- The Reports metric switcher now has 5 buttons in one row (Water/Protein/Cal/Sleep/All 4) — same pattern as before, just one more button; worth confirming it doesn't feel cramped on an actual phone.

---

## Icon update — 2026-08-11

- App icon recolored: droplet is now dark ocean blue, battery is white, flame is red — swapped away from the green battery, which was too close to the background's blue tone to read clearly, especially at small sizes. Confirmed the favicon-size legibility issue is actually fixed, not just improved.

---

## [1.4.1] — 2026-08-11

### Added
- Small "In" label under each tracker's consumed total, so the meaning of the bottom number is unambiguous at a glance — pairs with the "to go" text above the icon to make the in/out framing self-explanatory to a first-time viewer.

---

## [1.4.0] — 2026-08-11

Refined the tracker layout based on a "containers" mental model, plus follow-up icon polish.

### Changed
- Tracker column order changed to: goal → "to go" status → icon → consumed total. The idea: "to go" sits above the container since it's what's still coming in, while the running total sits below since it's what's already settled in the container — separates in vs. out more intuitively than having both numbers on the same side of the icon.
- App icon: battery is now green and the flame is dark orange, so all three icons are distinguishable by color as well as shape (previously all white).
- App icon: fixed a vertical alignment issue where the flame sat noticeably lower than the droplet — the two-tongue flame shape's visual weight was centered differently than the droplet's tip-heavy shape; nudged it up to match.

---

## [1.3.0] — 2026-08-11

Log screen readability pass, plus a real redesign of the home-screen icon.

### Changed
- Each tracker column reordered: the running total and "to go" status now sit *above* the gauge graphic instead of below, and both are visually the biggest thing in the card — that's the info people actually check throughout the day.
- The "to go" / "over" status text significantly enlarged and bolded (was small and muted, easy to miss); numbers themselves left unchanged as before.
- The gold "over goal" bubble now centers itself in the middle of the gauge instead of overlapping awkwardly at the top edge.
- **App icon completely redesigned.** Replaced the flat navy background and single plain droplet with a vibrant aqua-blue gradient (matching the in-app banner) and all three tracker icons — droplet, battery, flame — together as the mark, with the battery in green and the flame in dark orange so all three are distinguishable by color as well as shape. Verified by actually viewing the generated icon at multiple sizes before shipping, rather than guessing blind; went through several iterations after the first attempts (battery, then flame) didn't read correctly at small sizes.

---

## [1.2.0] — 2026-08-11

Polish pass based on real usage — editable entries, clearer labeling, and visual tweaks across the header and Log screen.

### Added
- **Description field on the manual Log form.** Optional — type something like "Post-workout shake" instead of getting the auto-generated "Water + Protein" label. Presets are unaffected; this only applies to manual entries.
- **Editable Today's log entries.** Each row now has an edit (pencil) button alongside delete — fixes the exact "clicked a preset but need to change the time" case, and also lets you adjust amounts or the description after the fact. Editing updates the entry in place; confirmed it doesn't create a duplicate.

### Changed
- "+ Add preset" is now a full-width button below the preset grid, styled larger — reads as a section-end separator rather than another grid tile.
- "Day Tracker" label is now all caps.
- Banner title "HydroPro Tracker" enlarged; the "...by Boston Pickleball Assoc." byline size left untouched.
- Header badge icons are now colored to match each metric elsewhere in the app — blue water, green protein, orange calories — instead of all three sharing one color.
- Settings' preset list is now alphabetical, matching the Log page's preset grid.

---

## [1.1.0] — 2026-08-11

The biggest single update yet — presets now work the way people actually eat and drink, and the Log screen got a real readability pass based on tester feedback.

### Added
- **Unified presets.** A single preset can now hold Water, Protein, and Calories all at once (e.g., "Protein Shake" = 16oz + 25g + 250cal), instead of needing three separate presets and three separate taps. Existing presets were migrated automatically — nothing was lost, they just came through as single-metric until edited.
- **One shared "Log" button.** Replaced the three separate per-tracker Log buttons with a single button below all three trackers. It opens one form where you fill in whichever of Water/Protein/Calories apply, then submit once as "Log Items."
- **Combined log entries.** Logging (whether manual or via a preset) now creates one entry that can carry multiple metrics, so Today's Log shows one line per real-world item instead of splitting it across up to three rows.
- **Daily goal shown above each tracker icon**, so it's visible at a glance without adding "consumed + remaining" in your head.
- **Per-metric visibility toggle.** In Settings → Daily goals, each of Water/Protein/Calories has a "Show on Log page" switch — turning one off hides it from the main screen while it keeps being tracked in Reports.
- **App version number**, shown in Settings → About. Will be bumped with each future release so it's easy to confirm which build a tester is actually running.
- **Alphabetical, 2-column preset grid** on the Log page, showing names only (amounts still visible in Settings, where you manage them).

### Changed
- Tracker titles (Water/Protein/Calories) restyled as bold "hero" section headers; goal text and the "to go" caption both sized up. Numbers deliberately left unchanged.
- Trackers themselves enlarged — bigger gauge graphics, more visual presence on the Log screen.
- Date now reads **"Day Tracker: [date]"**, both enlarged to match.
- "Presets" and "Today's log" section headers enlarged to match the new date size.
- Header badge icons made bigger and more pronounced.

### Fixed
- `handleImportBackup` was still referencing preset fields from the old (pre-unification) data shape — would have silently broken restoring an old-format backup file. Fixed before it shipped.
- The build script itself was still writing to a stale, unused file path from before the site was restructured into `/app/` — meaning several rounds of "tests passing" earlier today were unknowingly testing last session's code, not the actual current changes. Fixed the script itself, not just the symptom.

---

## [1.0.0] — 2026-08-11

Third tracked metric and trial-readiness groundwork.

### Added
- **Calories** as a full third tracked metric, alongside Water and Protein — its own goal, presets, gauge, and Reports support.
- **Flame gauge** for calories and **battery gauge** for protein (replacing an earlier bicep-shaped attempt that didn't read well), both fillable bottom-up like the water bottle.
- **"All 3" combined Reports view** — since oz/grams/calories don't share a scale, this shows each as % of its own goal so all three can be compared side by side.
- **In-app tutorial** ("How to use this" in Settings) covering getting started, logging, presets, reports, and reminders.
- **JSON backup export/import** in Settings, for moving data between devices or recovering after a phone switch — proven in real use, not just tested in isolation.
- **Public landing page** at the site's root domain, with the actual tracker moved to `/app/` and gated behind Cloudflare Access — the landing page is public, the tracker requires being on the allow list.

### Changed
- Renamed to **HydroPro Tracker**, with "...by Boston Pickleball Assoc." as the banner attribution.
- Moved to a real domain (`hydroprotracker.com`) instead of the original `.pages.dev` URL.

### Fixed
- Service worker switched from cache-first to network-first, so future updates show up on next open instead of getting stuck behind a stale cache.
- Cloudflare was aggressively caching `config.js` server-side, which meant even a full reinstall couldn't pick up a fix — added a `_headers` file forcing no-cache on everything under `/app/*`.
