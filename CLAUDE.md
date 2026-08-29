# HydroPro Tracker

Deployed React 18 PWA health-entry tracker on Cloudflare (Pages + Workers + D1 + KV) at
hydroprotracker.com. Deployed version: 3.65.0. One part-time maintainer (Rob). Closed tester group
behind Cloudflare Access.

Read `docs/DECISION-LOG.md` before proposing anything. Never re-litigate entries marked
`Locked` — if a request conflicts with one, say so before building it. `docs/CURRENT-STATE.md`
answers "what exists right now"; update it when it stops being true.

---

## Source of truth: `src/app.js` + `esbuild.config.js`

- `src/app.js` — extracted and reconciled under `ARCH-OPEN-01`, closed Aug 20, 2026
  (`docs/DECISION-LOG.md`) — is the current source of truth. Build it with `esbuild.config.js`.
- `src/App.jsx` (capital `A`) is a **separate, still-stale legacy file** — missing Treatments,
  Exercise, and everything after v3.13.0. Reference only, never build from it. Don't confuse it
  with `src/app.js` (lowercase) — the names differ only in one letter's case.
- **The correct build command is `node esbuild.config.js`.** There is no `npm run build` script in
  `package.json` today. If one is ever added, don't trust it just because it exists — confirm its
  entry point and output path first. A build script pointed at the wrong source (especially the
  stale `src/App.jsx`) would silently revert months of shipped features, same risk this section has
  always warned about.
- **Deploying `site/app/bundle.js` from a build is now a verified path, not a blocked one** — but
  only by running the full sequence every time: (1) `node esbuild.config.js`, (2)
  `node tools/harness.js site/app/bundle.build.js` clean, (3) lint `bundle.build.js` and confirm
  its no-undef count, (4) copy `bundle.build.js` over `site/app/bundle.js`, (5) re-run the harness
  and lint against the exact deployed file afterward. Skipping straight to the copy without all
  five steps is still the exact failure mode this section used to hard-block outright — the rule
  didn't disappear, it moved into the verification sequence instead of stopping the action.
- The ~578-check jsdom suite in the repo runs against `src/`. **Passing tests prove nothing about
  production** until the harness has run against the real, currently-deployed `site/app/bundle.js`
  — cite that, not the test suite, as evidence a change works.

This reflects `ARCH-OPEN-01`'s closure. The previous version of this section required stopping and
asking before any build, because source and deployed bundle had diverged and no reconciled,
verified pipeline existed. That's no longer true — but the underlying risk (a bad build silently
overwriting shipped behavior) is still real, which is why steps 1–5 above are mandatory, not
optional, every time this path is used.

## Layout

```
site/app/bundle.js     the real deployed artifact — edit this
site/app/              config.js, index.html, manifest.json, service-worker.js, icons
src/App.jsx            STALE. Reference only. Do not build from it.
worker/src/worker.js   Cloudflare Worker: push, auth, shares, account backup, 15-min cron
tools/harness.js       jsdom smoke-test harness — boots the real bundle and drives the UI
docs/                  DECISION-LOG.md, CURRENT-STATE.md, ROADMAP-v2.md
CHANGELOG.md
```

## Before writing code

- State exactly which files you need, up front, before exploring. Don't explore, then ask.
- Direction is **clinic-first** (`STRAT-10`, Aug 18): clinic distribution gets priority for
  sequencing, consumer continues as a downstream byproduct, both acquisition ramps stay in scope.
- The agreed working order is in `docs/SEQUENCING-PLAN.md`. The sanctioned first task is
  `ARCH-OPEN-01` (source reconciliation) plus `ARCH-OPEN-05` (versioned schema). Don't start other
  code work unless Rob explicitly asks for it.
- Prefer surgical edits over regenerating whole files.

## Editing the minified bundle

- Use Python line-number-anchored edits rather than string matching. Whitespace and line drift
  make string matching fail unpredictably after earlier edits.
- Re-locate anchors with `grep -n` **immediately before each edit** — earlier line numbers go
  stale the moment anything above them changes.
- Read from a beautified working copy if helpful, but every verification step below must run
  against the exact minified file being shipped.

## Verification — required before anything is packaged or committed as shippable

Never sign off on a syntax check alone. An undefined reference once shipped a blank white screen
to every user. All three, in order:

1. **Full-file ESLint `no-undef` sweep** across the entire bundle. If no npm script exists for
   this yet, create one (`npm run lint:bundle`) and commit it.
2. **Boot the app in the jsdom harness** (`node tools/harness.js site/app/bundle.js`) and click
   through every affected tab. Zero runtime errors, and assert the actual behavior changed — not
   just that the file did.
3. **Re-run both against the exact minified file being shipped**, not the working copy.

Then **audit the end state**: re-verify every intended change is actually present in the final
file. A fix silently reverted mid-session once and was caught only by an explicit end-state check.

jsdom has no layout engine. Print styling, overlap, and anything visual needs a real browser
(Playwright) or Rob's eyes — say so rather than implying it was checked.

## Bug classes this codebase has already shipped

Check every one of these against any change that touches data shape:

- **New entry type** → needs a guard in `migrateEntry` (runs on every page load) *and* a dedicated
  reload test. Has bitten sleep, weight, and supplements.
- **New field** → must be added to backup export/import *and* to the load-path rebuilds
  (`One()`, `vj()`, `yj()`), or it silently vanishes on reload. This is ~4 places today; missing
  one is invisible until the next launch.
- **New entry type** → needs explicit routing in the edit handler. The default path is never right.
- **Test-suite bugs masquerade as app bugs.** Verify the test before trusting its failure.
- **Caching strands users on stale builds.** Service worker is deliberately network-first;
  `_headers` forces no-cache on `/app/*`. Don't "optimize" either without raising it first.

## Secrets

- Never commit secrets. `wrangler.toml` holds placeholders only; the Worker reads
  `env.RESEND_API_KEY`. Resend and VAPID keys live as Cloudflare secrets.
- Check `git diff --cached` before every commit. Never echo a secret value into the terminal, a
  commit message, or a session transcript.

## Deploy

- **App:** commit `site/app/bundle.js` and `CHANGELOG.md`; Cloudflare Pages serves from the repo.
- **Worker:** `wrangler deploy` from `worker/` — separate step, doesn't ride along with a push.
- **D1:** migrations run via `wrangler d1 execute` against the **production database**. Propose the
  SQL and let Rob run it. Never run a destructive or schema-dropping command.
  `--file` fails with `Authentication error [code: 10000]` on the `/import` endpoint under wrangler
  3.114; use `--command` instead.
- Bump the version and add a `CHANGELOG.md` entry with every shipped change.

## Status reporting must be precise

Distinguish clearly between: *implemented* · *verified in simulated browser* · *verified on real
device by Rob* · *committed and deployed*. Never imply something was tested more thoroughly than
it was. If you ran out of room mid-task, say exactly where you stopped and what remains.

## End every working session with — update the repo docs in the same commit

The docs live in the repo and are the ONLY continuity layer. They must never lag the code, so update them as the final step of the work — not as drafts for Rob to carry elsewhere:

1. Bump the version; add a CHANGELOG.md entry (most-recent-first).
2. Update docs/CURRENT-STATE.md — deployed version, what shipped, what's outstanding, current working sequence.
3. Append any decisions to docs/DECISION-LOG.md in the existing format. Never delete an entry; supersede it.
4. Update the "Deployed version" line at the top of this file.
5. Complete replacement files, never fragments (OPS-07). Stage docs + code in the SAME commit.
6. Then report: what changed, what needs Rob's real-device test, what's outstanding — and show git diff --cached before committing. Don't push until Rob approves.

## Working with Rob

Part-time, alongside a primary job, context-switching constantly. Assume he will not remember open
threads between sessions — surface them rather than waiting to be asked. Watch for things that are
quietly overdue: legal/compliance, the standing data-loss exposure, source reconciliation. None of
them have a deadline and all of them will drift indefinitely if nobody raises them.

Label every next step: *Claude can do this alone* / *needs Rob's decision* / *needs Rob on a real
device* / *needs an outside professional*.

Push back when something looks wrong — including on Rob's requests and on your own earlier
recommendations. Bugs surfaced early are cheap; a bug that reaches users is not. Own mistakes
plainly and move to the fix.
