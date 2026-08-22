/**
 * HydroPro Tracker — reusable jsdom smoke-test harness
 *
 * Purpose: boot the real bundle in a simulated browser, drive the UI, and catch
 * runtime errors that a syntax check cannot. A syntax-clean bundle once shipped a
 * blank white screen to every user; this harness exists to prevent a repeat.
 *
 * Usage:
 *   npm install jsdom
 *   node harness.js /path/to/bundle.js
 *
 * Edit the STEPS array at the bottom for whatever is being tested this session.
 * Always run it twice: once against the beautified working copy, once against the
 * exact minified file being shipped.
 *
 * ── ENVIRONMENT GOTCHAS (all already handled below — do not re-discover these) ──
 *
 * 1. jsdom's `localStorage` is a GETTER-ONLY property. Assigning a mock object
 *    silently does nothing and the app reads jsdom's real (empty) storage instead.
 *    Seed it with setItem() on the real object.
 * 2. `ResizeObserver` does not exist in jsdom. Recharts needs it — without a stub,
 *    the Stats tab throws and you never reach the code under test.
 * 3. `MessageChannel` / `queueMicrotask` must exist on `window` for React's
 *    scheduler to flush effects (including the initial data load).
 * 4. A rejected serviceWorker promise must have `.catch()` attached at creation or
 *    it surfaces as an unhandled rejection and pollutes the error list.
 * 5. Tile `textContent` has LEADING WHITESPACE (icon + label JSX). Always .trim()
 *    before comparing — untrimmed startsWith() silently matches nothing.
 * 6. React needs ~2.5s of real time after eval before first paint is complete.
 *    Start assertions at 2500ms, not sooner.
 * 7. Always include the final process.exit() safety timeout, or lingering app
 *    timers keep the node process alive and the command times out.
 */

const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const BUNDLE_PATH = process.argv[2] || "/home/claude/hydropro/bundle.beautified.js";
const STORAGE_KEY = "water-tracker-data";

// ─── Seed data template ────────────────────────────────────────────────────────
// Full settings shape. Adjust per test. Set to null to boot as a brand-new user.
function makeSeed(overrides = {}) {
  const base = {
    logs: {},
    activeSleepSession: null,
    settings: {
      goalOz: 64, goalProtein: 100, goalCalories: 2000, goalSleepHours: 8,
      goalWeight: 0, goalExerciseMinutes: 0,
      showWater: true, showProtein: true, showCalories: true, showSleep: true,
      showWeight: true, showSupplements: true, showTreatments: true, showExercise: true,
      feedbackWatching: false, testerName: "",
      cloudBackup: { enabled: false, code: null, lastSavedAt: null },
      account: { email: null, sessionToken: null },
      presets: [],
      supplements: [],
      treatments: [],
      reminders: {
        inApp: { enabled: false, intervalMin: 60 },
        calendar: { startTime: "08:00", endTime: "20:00", intervalHours: 2 },
        push: { subscribed: false, id: null },
        bedtime: { enabled: false, time: "22:00" },
        supplementReminder: { enabled: false, time: "10:00" },
        treatmentReminder: { enabled: false, time: "09:00" }
      }
    }
  };
  return { ...base, ...overrides, settings: { ...base.settings, ...(overrides.settings || {}) } };
}

const ymd = (d) => d.toISOString().slice(0, 10);
const TODAY = ymd(new Date());
const DAYS_AGO = (n) => ymd(new Date(Date.now() - n * 86400000));

// ─── Boot ──────────────────────────────────────────────────────────────────────
const bundleSrc = fs.readFileSync(BUNDLE_PATH, "utf-8");
const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "https://hydroprotracker.com/app/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const { window } = dom;

// GOTCHA 1: seed the real localStorage; do not replace it.
const SEED = makeSeed({
  // ── edit per session ──
  logs: {
    [DAYS_AGO(3)]: [
      { id: "old1", time: "9:00 AM", timeMinutes: 540, label: "Old entry", oz: 20, grams: 0, calories: 0 },
    ],
  },
  settings: {
    showWater: false, showTreatments: false,
    goalWeight: 180, goalExerciseMinutes: 30,
    supplements: [
      { id: "s1", name: "TestVit", intervalDays: 1, lastTakenDate: null,
        nextDueOverride: null, trackInventory: true, qtyRemaining: 10,
        expirationDate: null },
      { id: "s2", name: "OverdueMed", intervalDays: 1, lastTakenDate: null,
        nextDueOverride: DAYS_AGO(3), trackInventory: false, qtyRemaining: 0,
        expirationDate: null },
    ],
  },
});
if (SEED) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));

window.fetch = () => { const p = Promise.reject(new Error("network disabled")); p.catch(() => {}); return p; };

// GOTCHA 4: attach .catch() at creation.
const rejQuiet = (msg) => { const p = Promise.reject(new Error(msg)); p.catch(() => {}); return p; };
window.navigator.serviceWorker = { register: () => rejQuiet("sw disabled"), ready: rejQuiet("sw disabled") };

window.Notification = { permission: "default", requestPermission: () => Promise.resolve("default") };
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));

// GOTCHA 2 + 3
window.ResizeObserver = window.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
window.MessageChannel = MessageChannel;
window.queueMicrotask = queueMicrotask;

const errors = [];
window.addEventListener("error", (e) =>
  errors.push(e.error ? (e.error.stack || e.error.message) : e.message));
window.onunhandledrejection = (e) =>
  errors.push("UnhandledRejection: " + ((e.reason && (e.reason.stack || e.reason.message)) || e.reason));

global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.self = window;
global.ResizeObserver = window.ResizeObserver;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

try {
  vm.runInContext(bundleSrc, dom.getInternalVMContext(), { filename: "bundle.js" });
} catch (err) {
  console.log("FATAL — threw during eval:", err && (err.stack || err.message));
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const html = () => window.document.getElementById("root").innerHTML;
const fire = (el) => { el.dispatchEvent(new window.Event("click", { bubbles: true })); return true; };

// GOTCHA 5: always trim.
function clickByText(text, tag = "button") {
  const el = [...window.document.querySelectorAll(tag)]
    .find((b) => b.textContent.trim() === text || b.textContent.trim().startsWith(text));
  return el ? fire(el) : false;
}
function clickTile(text) {
  const el = [...window.document.querySelectorAll(".wt-tracker-col")]
    .find((e) => e.textContent.trim().startsWith(text));
  return el ? fire(el) : false;
}
function clickByAria(label) {
  const el = window.document.querySelector(`[aria-label="${label}"]`);
  return el ? fire(el) : false;
}
function setInput(placeholder, value) {
  const el = window.document.querySelector(`input[placeholder="${placeholder}"]`);
  if (!el) return false;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, value);
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
  return true;
}
function setInputByAria(label, value) {
  const el = window.document.querySelector(`[aria-label="${label}"]`);
  if (!el) return false;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, value);
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
  return true;
}
const nav = (tab) => clickByText(tab); // "Log It!" | "Today" | "Stats" | "My Plan" | "Settings"
const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY));
const supp = (name) => stored().settings.supplements.find((s) => s.name === name);
const treat = (name) => stored().settings.treatments.find((t) => t.name === name);
const logsToday = () => stored().logs[TODAY] || [];
const headerText = () => {
  const el = window.document.querySelector(".wt-date");
  return el ? el.textContent.trim() : null;
};
function tiles() {
  return [...window.document.querySelectorAll(".wt-tracker-col")]
    .map((e) => e.textContent.trim().slice(0, 60));
}
const check = (label, actual, expected) => {
  const pass = expected === undefined ? !!actual : String(actual) === String(expected);
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}`, expected === undefined ? actual : `→ ${actual}`);
};

// ─── Steps — edit per session ──────────────────────────────────────────────────
const STEPS = [
  () => {
    check("app mounted", html().length > 1000);
    check("tile count (Water+Treatments off in seed)", [...window.document.querySelectorAll(".wt-tracker-col")].length, 6);
    console.log("tiles:", JSON.stringify(tiles(), null, 1));
  },
  () => check("nav to Stats", nav("Stats")),
  () => check("nav to My Plan", nav("My Plan")),
  () => {
    const card = window.document.querySelector(".wt-plan-card");
    check("My Plan tracker card found", !!card);
    if (card) fire(card);
  },
  () => {
    const sheetContent = window.document.querySelector(".wt-plan-bottom-sheet");
    check("TrackerSheet opened", !!sheetContent);
    check("TrackerSheet paddingBottom", sheetContent ? sheetContent.style.paddingBottom : null, "88px");
  },
  () => check("nav to Today", nav("Today")),
  () => check("nav to Log It!", nav("Log It!")),
  () => {
    const actionBtns = window.document.querySelector(".wt-action-btns");
    const prev = actionBtns ? actionBtns.previousElementSibling : null;
    check("no divider line above action buttons", !(prev && prev.classList.contains("wt-divider")));
  },
  () => check("open presets/log sheet", clickByText("Use Your Presets or Log a Meal")),
  () => check("click Edit Presets link", clickByText("✏ Edit Presets")),
  () => {
    const headers = [...window.document.querySelectorAll(".wt-sheet-header h3")].map((h) => h.textContent);
    check("My Presets sheet opened inline", headers.includes("My Presets"));
    check("still on Log It! (no nav away)", !!window.document.querySelector(".wt-tracker-col"));
    const header = [...window.document.querySelectorAll(".wt-sheet-header")].find((h) => h.textContent.includes("My Presets"));
    const sheet = header ? header.closest(".wt-sheet") : null;
    check("My Presets sheet escapes parent via position:fixed", sheet ? sheet.style.position : null, "fixed");
    check("My Presets sheet z-index above parent sheet", sheet ? sheet.style.zIndex : null, "171");
  },
  () => check("click Add Preset", clickByText("Add Preset")),
  () => {
    const headers = [...window.document.querySelectorAll(".wt-modal-header h3")].map((h) => h.textContent);
    check("Add preset modal opened", headers.includes("Add preset"));
    check("set preset name", setInput("e.g. Protein shake", "Test Preset"));
    check("set preset oz", setInput("0", "12"));
  },
  () => check("save new preset", clickByText("Save preset")),
  () => {
    const row = [...window.document.querySelectorAll(".wt-preset-row")]
      .find((r) => r.textContent.includes("Test Preset"));
    check("preset row rendered", !!row);
    check("preset row has edit button", !!row && !!row.querySelector('[aria-label="Edit preset"]'));
    check("preset row has delete button", !!row && !!row.querySelector('[aria-label="Delete preset"]'));
  },
  () => {
    const row = [...window.document.querySelectorAll(".wt-preset-row")]
      .find((r) => r.textContent.includes("Test Preset"));
    check("click delete on new preset", row ? fire(row.querySelector('[aria-label="Delete preset"]')) : false);
  },
  () => {
    const stillThere = [...window.document.querySelectorAll(".wt-preset-row")]
      .some((r) => r.textContent.includes("Test Preset"));
    check("preset removed after delete", !stillThere);
  },
  () => check("nav to My Plan (for Self-Managed sheet check)", nav("My Plan")),
  () => check("open Self-Managed sheet", clickByText("Self-Managed", "button")),
  () => {
    const label = [...window.document.querySelectorAll(".wt-section-label")]
      .find((el) => el.textContent === "Supplements & Prescriptions");
    check("Self-Managed sheet label found", !!label);
    // Sheet went dark in v3.37.0 (this label's inline color was flipped from var(--ink) to
    // var(--ink-inverse) that session so it wouldn't render invisible on the new dark background).
    check("Self-Managed sheet label uses var(--ink-inverse) on the now-dark sheet", label ? label.style.color : null, "var(--ink-inverse)");
  },
  // Add assertions for whatever changed this session.
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    check("My Plan always renders all 8 cards (Water off, Treatments off seeded)", cards.length, 8);
    const titles = cards.map((c) => c.querySelector(".wt-plan-card-title").textContent);
    check("My Plan card order", titles.join(","), "Water,Protein,Calories,Sleep,Weight,Exercise,RX & Vitamins,Treatments");
    const waterCard = cards.find((c) => c.querySelector(".wt-plan-card-title").textContent === "Water");
    check("Water card renders dimmed (off class)", waterCard ? waterCard.classList.contains("off") : null, "true");
  },
  () => {
    const waterToggle = window.document.querySelector('[aria-label="Toggle Water on Log page"]');
    check("found Water toggle switch", !!waterToggle);
    if (waterToggle) fire(waterToggle);
  },
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    check("still 8 cards after toggling Water on", cards.length, 8);
    const waterCard = cards.find((c) => c.querySelector(".wt-plan-card-title").textContent === "Water");
    check("Water card no longer off after toggle-on", waterCard ? waterCard.classList.contains("off") : null, "false");
    check("settings.showWater persisted true", stored().settings.showWater, "true");
  },
  () => check("nav to Log It! (after Water re-enabled)", nav("Log It!")),
  () => {
    check("Water tile now appears on Log It!", tiles().some((t) => t.startsWith("Water")));
  },
  () => check("nav back to My Plan", nav("My Plan")),
  () => {
    const waterToggle = window.document.querySelector('[aria-label="Toggle Water on Log page"]');
    check("re-found Water toggle", !!waterToggle);
    if (waterToggle) fire(waterToggle);
  },
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    check("still 8 cards after toggling Water back off", cards.length, 8);
    const waterCard = cards.find((c) => c.querySelector(".wt-plan-card-title").textContent === "Water");
    check("Water card off again (round-trip complete)", waterCard ? waterCard.classList.contains("off") : null, "true");
  },
  () => {
    const treatToggle = window.document.querySelector('[aria-label="Toggle Treatments on Log page"]');
    check("found Treatments toggle (was off in seed)", !!treatToggle);
    const treatCard = treatToggle ? treatToggle.closest(".wt-plan-card") : null;
    check("Treatments card off per seed", treatCard ? treatCard.classList.contains("off") : null, "true");
    if (treatToggle) fire(treatToggle);
  },
  () => {
    const treatCard = [...window.document.querySelectorAll(".wt-plan-card")]
      .find((c) => c.querySelector(".wt-plan-card-title").textContent === "Treatments");
    check("Treatments card on after toggle", treatCard ? treatCard.classList.contains("off") : null, "false");
    check("settings.showTreatments persisted true", stored().settings.showTreatments, "true");
  },
  () => {
    const banner = window.document.querySelector(".wt-topbanner");
    const cssText = window.document.querySelector("style").textContent;
    const bannerRuleMatch = cssText.match(/\.wt-topbanner\s*\{[^}]*\}/);
    check("header CSS has no gradient", bannerRuleMatch ? !bannerRuleMatch[0].includes("gradient") : null, "true");
    check("header CSS uses page-bg (black) background", bannerRuleMatch ? bannerRuleMatch[0].includes("var(--page-bg)") : null, "true");
    const titleRuleMatch = cssText.match(/\.wt-topbanner-title\s*\{[^}]*\}/);
    check("wordmark color is warm tan var(--ink-inverse) (v3.36.0; was #fff)", titleRuleMatch ? titleRuleMatch[0].includes("color:var(--ink-inverse)") : null, "true");
    check("wt-topbanner element exists", !!banner);
  },
  () => check("nav to Log It! (for grid-to-button spacing check)", nav("Log It!")),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-action-btns\s*\{[^}]*\}/);
    check("wt-action-btns has margin-top:16px (matches existing 16px spacing scale)", rule ? rule[0].includes("margin-top:16px") : null, "true");
  },

  // ── v3.33.0 Part A: OO (add/edit preset) modal must portal to document.body ──
  () => check("open presets/log sheet (for OO portal check)", clickByText("Use Your Presets or Log a Meal")),
  () => check("open My Presets sheet (for OO portal check)", clickByText("✏ Edit Presets")),
  () => check("click Add Preset (opens OO modal)", clickByText("Add Preset")),
  () => {
    const h3 = [...window.document.querySelectorAll(".wt-modal-header h3")].find((h) => h.textContent === "Add preset");
    check("OO Add preset modal opened", !!h3);
    const backdrop = h3 ? h3.closest(".wt-backdrop") : null;
    check("OO modal's backdrop is a direct child of document.body (portal, not nested)", backdrop ? backdrop.parentElement === window.document.body : null, "true");
    check("OO modal backdrop z-index above every nested sheet level", backdrop ? backdrop.style.zIndex : null, "180");
    const modal = h3 ? h3.closest(".wt-modal") : null;
    // v3.37.0 darkened this from #F2F5F8 to #151A21 as part of the sheet dark-theme conversion.
    check("OO modal has an explicit opaque dark background (v3.37.0 dark theme)", modal ? modal.style.background : null, "rgb(21, 26, 33)");
    check("OO modal locally defines --deep (fixes its own invisible Save-preset button)", modal ? modal.style.getPropertyValue("--deep") : null, "#1B4F72");
    check("OO modal locally defines --line", modal ? modal.style.getPropertyValue("--line") : null, "#D5E1EC");
    if (backdrop) fire(backdrop); // close it (onClick = onClose)
  },
  () => {
    const stillOpen = [...window.document.querySelectorAll(".wt-modal-header h3")].some((h) => h.textContent === "Add preset");
    check("OO modal closed after backdrop click", !stillOpen, "true");
    // v3.34.0 (UX-OPEN-02): OO's backdrop onClick now calls e.stopPropagation() before closing,
    // so the click no longer bubbles through the REACT tree to xO's own outer backdrop onClick.
    // Both the parent Log sheet and the nested My Presets sheet must stay open.
    const logSheetStillOpen = [...window.document.querySelectorAll(".wt-sheet-header h3")].some((h) => h.textContent === "Log");
    const myPresetsStillOpen = [...window.document.querySelectorAll(".wt-sheet-header h3")].some((h) => h.textContent === "My Presets");
    check("clicking OO's backdrop leaves the parent Log sheet open (UX-OPEN-02 fixed)", logSheetStillOpen, "true");
    check("My Presets sheet also stays open", myPresetsStillOpen, "true");
  },
  () => check("close Log sheet (its own Close button unmounts nested My Presets too)", clickByAria("Close")),
  () => {
    const anyOpen = [...window.document.querySelectorAll(".wt-sheet-header h3")].some((h) => h.textContent === "Log" || h.textContent === "My Presets");
    check("both sheets closed", !anyOpen, "true");
  },

  // ── v3.33.0 Part B: Enter Missed Items (backfill) ──────────────────────────────
  () => check("nav to Today (for backfill test)", nav("Today")),
  () => {
    const preLen = logsToday().length;
    check("today's log starts empty before any backfill", preLen, 0);
  },
  () => check("open All Past Days", clickByAria("View past days")),
  () => {
    const rows = [...window.document.querySelectorAll(".wt-preset-row")];
    check("seeded past day appears in All Past Days list", rows.length, 1);
    if (rows[0]) fire(rows[0]);
  },
  () => check("Enter Missed Items button present on past-day view", clickByText("Enter Missed Items")),
  () => {
    const h3 = [...window.document.querySelectorAll(".wt-sheet-header h3")].find((h) => h.textContent === "Enter Missed Items");
    check("BackfillSheet opened", !!h3);
    const backdrop = h3 ? h3.closest(".wt-backdrop") : null;
    check("BackfillSheet's backdrop is a direct child of document.body (portal, not nested)", backdrop ? backdrop.parentElement === window.document.body : null, "true");
    const sheet = h3 ? h3.closest(".wt-sheet") : null;
    // v3.37.0 darkened this from #F2F5F8 to #151A21 as part of the sheet dark-theme conversion.
    check("BackfillSheet has an explicit opaque dark background (v3.37.0 dark theme)", sheet ? sheet.style.background : null, "rgb(21, 26, 33)");
    check("BackfillSheet is not transparent", sheet ? sheet.style.background !== "transparent" && sheet.style.background !== "" : null, "true");
    check("BackfillSheet anchored left:0", sheet ? sheet.style.left : null, "0px");
    check("BackfillSheet anchored right:0 (prevents right-edge overflow from padding under content-box)", sheet ? sheet.style.right : null, "0px");
    check("BackfillSheet width:100%", sheet ? sheet.style.width : null, "100%");
    check("BackfillSheet has no negative margin", sheet ? sheet.style.margin : null, "0px");
    check("BackfillSheet uses box-sizing:border-box", sheet ? sheet.style.boxSizing : null, "border-box");
    const logBtn = [...window.document.querySelectorAll(".wt-btn-primary")].find((b) => b.textContent.trim() === "Log");
    check("BackfillSheet has a \"Log\" submit button (was unlabeled/missing per Rob's real-device report)", !!logBtn);
    check("\"Log\" button starts disabled (no fields filled in yet)", logBtn ? logBtn.disabled : null, "true");
    check("\"Log\" button centered/full-width, matching Log It!'s Log button layout", logBtn ? logBtn.style.width : null, "100%");
    check("\"Log\" button marginTop:16 matching Log It!'s Log button spacing", logBtn ? logBtn.style.marginTop : null, "16px");
    // jsdom can't resolve var() referencing an inline custom property on an ancestor when
    // computing a stylesheet rule (confirmed empirically — getComputedStyle just echoes the
    // unresolved "var(--deep)" string and falls back to transparent) — so the button's actual
    // visible color can't be asserted via computed style here. Verify the fix at the source
    // instead: the sheet's own container must locally re-define every .wt-root-only custom
    // property that .wt-btn-primary (and the .wt-chip/.wt-field/.wt-qty-* classes nested inside
    // it) actually reference, since none of them exist in the global :root block this portaled
    // sheet can otherwise see.
    check("sheet locally defines --deep (fixes the invisible/transparent Log button background)", sheet ? sheet.style.getPropertyValue("--deep") : null, "#1B4F72");
    check("sheet locally defines --line (fixes invisible input/chip borders)", sheet ? sheet.style.getPropertyValue("--line") : null, "#D5E1EC");
    check("sheet locally defines --paper", sheet ? sheet.style.getPropertyValue("--paper") : null, "#F2F5F8");
  },
  () => check("set backfill date to a day with zero existing entries", setInputByAria("Backfill entry date", DAYS_AGO(10))),
  () => check("set backfill protein amount", setInputByAria("Backfill protein amount", "25")),
  () => check("set backfill calories amount", setInputByAria("Backfill calories amount", "300")),
  () => check("set backfill sleep hours", setInputByAria("Backfill sleep hours", "7.5")),
  () => check("select TestVit supplement chip", clickByText("TestVit")),
  () => {
    const row = [...window.document.querySelectorAll(".wt-qty-row")].find((r) => r.textContent.includes("TestVit"));
    const qtyInput = row ? row.querySelector(".wt-qty-input") : null;
    check("TestVit qty defaults to 1", qtyInput ? qtyInput.value : null, "1");
  },
  () => {
    const logBtn = [...window.document.querySelectorAll(".wt-btn-primary")].find((b) => b.textContent.trim() === "Log");
    check("\"Log\" button now enabled once fields are filled", logBtn ? logBtn.disabled : null, "false");
  },
  () => {
    // Scoped, not clickByText("Log") — that also matches the "Log It!" nav tab (both start
    // with "Log"), and clickByText's document-order .find() would hit the nav tab first since
    // it isn't inside the BackfillSheet's own portaled subtree. Query within the sheet instead.
    const logBtn = [...window.document.querySelectorAll(".wt-btn-primary")].find((b) => b.textContent.trim() === "Log");
    check("log backfill (button renamed Save -> Log)", logBtn ? fire(logBtn) : false);
  },
  () => {
    const entries = stored().logs[DAYS_AGO(10)] || [];
    check("backfill landed on the selected (new) date with 4 entries", entries.length, 4);
    check("all backfilled entries flagged backfilled:true", entries.every((e) => e.backfilled === true), "true");
    check("all backfilled entries have enteredAt timestamp", entries.every((e) => typeof e.enteredAt === "string" && e.enteredAt.length > 0), "true");
    check("all backfilled entries timestamped 12:00 PM / 720 minutes", entries.every((e) => e.time === "12:00 PM" && e.timeMinutes === 720), "true");
  },
  () => {
    check("today's log is still empty after backfilling a past date (rule 3)", logsToday().length, 0);
    const s = supp("TestVit");
    check("TestVit inventory decremented by backfilled dose (10 → 9)", s ? s.qtyRemaining : null, 9);
    check("TestVit lastTakenDate untouched by backfill (rule 2: schedule never recalculates)", s ? s.lastTakenDate : "MISSING", null);
    check("TestVit nextDueOverride untouched by backfill (rule 2)", s ? s.nextDueOverride : "MISSING", null);
    const stillDueToday = [...window.document.querySelectorAll(".wt-treatment-name")].some((el) => el.textContent === "TestVit");
    check("TestVit still shows as due in To Do Today (rule 3: not marked done by backfill)", stillDueToday, "true");
  },
  () => check("nav to Log It! (verify today's RX tile ring unaffected)", nav("Log It!")),
  () => {
    const rxTile = tiles().find((t) => t.startsWith("RX & Vitamins"));
    check("today's RX & Vitamins tile still shows 0 taken (rule 3: today's ring unaffected)", rxTile ? rxTile.includes("0 Taken") : null, "true");
  },
  () => check("nav back to Today (to delete the backfilled dose)", nav("Today")),
  () => check("re-open All Past Days", clickByAria("View past days")),
  () => {
    const rows = [...window.document.querySelectorAll(".wt-preset-row")];
    check("newly backfilled day now appears in All Past Days list", rows.length, 2);
  },
  () => {
    // Click whichever past-day row is NOT the originally-seeded one (3 days ago); the backfilled
    // day (10 days ago) sorts after it since the list is date-descending.
    const rows = [...window.document.querySelectorAll(".wt-preset-row")];
    const seededLabel = new Date(DAYS_AGO(3) + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const backfilledRow = rows.find((r) => !r.textContent.includes(seededLabel));
    check("found the backfilled day's row", !!backfilledRow);
    if (backfilledRow) fire(backfilledRow);
  },
  () => {
    const rows = [...window.document.querySelectorAll(".wt-log-row")];
    check("backfilled day shows all 4 entries", rows.length, 4);
    const suppRow = rows.find((r) => r.textContent.includes("TestVit"));
    check("backfilled supplement entry has a delete button (delete/edit parity)", suppRow ? !!suppRow.querySelector('[aria-label="Delete entry"]') : null, "true");
    check("backfilled supplement entry has NO edit button (past-day view stays read-only for edit)", suppRow ? !suppRow.querySelector('[aria-label="Edit entry"]') : null, "true");
    const delBtn = suppRow ? suppRow.querySelector('[aria-label="Delete entry"]') : null;
    if (delBtn) fire(delBtn);
  },
  () => {
    const entries = stored().logs[DAYS_AGO(10)] || [];
    check("backfilled supplement entry removed after delete", entries.some((e) => e.type === "supplement"), "false");
    const s = supp("TestVit");
    check("TestVit inventory restored after deleting backfilled dose (9 → 10)", s ? s.qtyRemaining : null, 10);
  },

  // ── v3.34.0 item 2: "Prior Days:" label + brighter/bigger calendar icon on Today ──
  () => check("nav to Today (for Prior Days label check)", nav("Today")),
  () => {
    const label = [...window.document.querySelectorAll("span")].find((s) => s.textContent === "Prior Days:");
    check("\"Prior Days:\" label present", !!label);
    const btn = window.document.querySelector('[aria-label="View past days"]');
    check("calendar icon button found", !!btn);
    check("calendar icon button sits immediately after the label in the same row", label && btn ? label.nextElementSibling === btn : null, "true");
    const svg = btn ? btn.querySelector("svg") : null;
    check("calendar icon size increased to 24 (was 18)", svg ? svg.getAttribute("width") : null, "24");
    check("calendar icon color brightened to #fff (was faint var(--muted))", btn ? btn.style.color : null, "rgb(255, 255, 255)");
  },

  // ── v3.34.0 item 5: nav bar dark retheme, present + correctly styled on all 5 tabs ──
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const navRule = cssText.match(/\.wt-nav \{[^}]*\}/);
    const activeRule = cssText.match(/\.wt-nav-btn\.active \{[^}]*\}/);
    check("nav background uses var(--surface-dark), not pure white/black", navRule ? navRule[0].includes("background:var(--surface-dark)") : null, "true");
    // v3.38.1 brightened all hairline borders (including nav's) to var(--hairline-bright) —
    // Rob's follow-up request that the borders were too faint to see.
    check("nav top border uses the brightened var(--hairline-bright)", navRule ? navRule[0].includes("border-top:1px solid var(--hairline-bright)") : null, "true");
    check("nav z-index uses var(--z-nav)", navRule ? navRule[0].includes("z-index:var(--z-nav)") : null, "true");
    check("nav includes safe-area-inset-bottom in its padding", navRule ? navRule[0].includes("env(safe-area-inset-bottom") : null, "true");
    check("active nav tab uses var(--accent) text on var(--accent-chip) pill", activeRule ? activeRule[0].includes("color:var(--accent)") && activeRule[0].includes("background:var(--accent-chip)") : null, "true");
    check("active nav tab pill has border-radius:12px", activeRule ? activeRule[0].includes("border-radius:12px") : null, "true");
  },
  () => {
    const tabs = ["Log It!", "Today", "Stats", "My Plan", "Settings"];
    let allPresent = true;
    for (const label of tabs) {
      nav(label);
      const nv = window.document.querySelector(".wt-nav");
      if (!nv) allPresent = false;
    }
    check("wt-nav renders on all 5 tabs", allPresent, "true");
  },
  () => {
    const active = window.document.querySelector(".wt-nav-btn.active");
    check("active tab has aria-current=\"page\"", active ? active.getAttribute("aria-current") : null, "page");
    const inactive = [...window.document.querySelectorAll(".wt-nav-btn")].find((b) => !b.classList.contains("active"));
    check("inactive tab has no aria-current", inactive ? inactive.getAttribute("aria-current") : null, null);
  },
  () => check("nav to Log It! (content clearance check)", nav("Log It!")),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const rootRule = cssText.match(/\.wt-root \{[^}]*\}/);
    check("page container padding-bottom uses var(--nav-h) + safe-area-inset-bottom (item 5 content clearance)", rootRule ? rootRule[0].includes("padding-bottom:calc(var(--nav-h) + env(safe-area-inset-bottom, 0px))") : null, "true");
  },

  // ── v3.34.0 item 6c: overdue items show an icon glyph alongside color, not color alone ──
  () => check("nav to Today (for overdue icon check)", nav("Today")),
  () => {
    const overdueRow = [...window.document.querySelectorAll(".wt-treatment-overdue")].find((r) => r.textContent.includes("OverdueMed"));
    check("seeded OverdueMed shows in To Do Today as overdue", !!overdueRow);
    const label = overdueRow ? overdueRow.querySelector(".wt-treatment-due-label") : null;
    const icon = label ? label.querySelector("svg") : null;
    check("overdue label has an icon glyph alongside the text (not color alone)", !!icon, "true");
    check("overdue label still shows the '... overdue' text too", label ? /overdue/.test(label.textContent) : null, "true");
  },

  // ── v3.34.0 item 6a: touch targets — Today's Log edit/delete buttons ≥48px ──
  () => {
    const iconBtn = window.document.querySelector(".wt-icon-btn");
    check("wt-icon-btn (pencil/trash/close everywhere, incl. Today's Log) found", !!iconBtn);
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-icon-btn \{[^}]*\}/);
    check("wt-icon-btn min-width reaches var(--touch)=48px", rule ? rule[0].includes("min-width:var(--touch)") : null, "true");
    check("wt-icon-btn min-height reaches var(--touch)=48px", rule ? rule[0].includes("min-height:var(--touch)") : null, "true");
    const fieldRule = cssText.match(/\.wt-field input, \.wt-field select, \.wt-field textarea \{[^}]*\}/);
    check("date/dropdown-style inputs (incl. backfill sheet date field) also reach 48px min-height", fieldRule ? fieldRule[0].includes("min-height:var(--touch)") : null, "true");
  },

  // ── v3.34.0 item 6b: Settings form inputs raised to 16px minimum ──
  () => check("nav to Settings (for 16px input font-size check)", nav("Settings")),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-settings-tab \.wt-field input, \.wt-settings-tab \.wt-field select, \.wt-settings-tab \.wt-field textarea \{[^}]*\}/);
    check("Settings-scoped form input font-size raised to 16px (iOS zoom fix)", rule ? rule[0].includes("font-size:16px") : null, "true");
    const nameInput = window.document.querySelector('input[placeholder="e.g. Sarah M."]');
    check("Settings tester-name input found (real element, not just the CSS rule)", !!nameInput);
  },

  // ── v3.35.0: Log It! tile restructure + category color tokens ──────────────────
  () => check("nav to My Plan (to re-enable Water for the full 8-tile check)", nav("My Plan")),
  () => {
    const waterToggle = window.document.querySelector('[aria-label="Toggle Water on Log page"]');
    check("found Water toggle to re-enable it", !!waterToggle);
    if (waterToggle) fire(waterToggle);
  },
  () => check("nav to Log It! (item 3/4 tile restructure checks)", nav("Log It!")),
  () => {
    const tiles = [...window.document.querySelectorAll(".wt-tracker-col")];
    check("all 8 Log It! tiles mount with all trackers enabled", tiles.length, 8);
    check("no runtime errors after full 8-tile render", errors.length, 0);
  },
  () => {
    // Item 3: horizontal layout — left column (chip+title+stats) and right column (gem), per tile.
    const expected = [
      ["Water", "var(--water)", "var(--water-chip)"],
      ["Protein", "var(--protein)", "var(--protein-chip)"],
      ["Calories", "var(--calories)", "var(--calories-chip)"],
      ["Sleep", "var(--sleep)", "var(--sleep-chip)"],
      ["Weight", "var(--weight)", "var(--weight-chip)"],
      ["Exercise", "var(--exercise)", "var(--exercise-chip)"],
      ["Treatments", "var(--treatment)", "var(--treatment-chip)"],
      ["RX & Vitamins", "var(--meds)", "var(--meds-chip)"],
    ];
    const tiles = [...window.document.querySelectorAll(".wt-tracker-col")];
    let allOk = true;
    for (const [label, colorVar, chipVar] of expected) {
      const tile = tiles.find((t) => t.textContent.includes(label));
      if (!tile) { console.log(`  (missing tile: ${label})`); allOk = false; continue; }
      const border = tile.style.border || "";
      if (!border.includes(colorVar)) { console.log(`  (${label} border mismatch: "${border}")`); allOk = false; }
      const chip = tile.querySelector(".wt-tile-chip");
      if (!chip || chip.style.background !== chipVar || chip.style.color !== colorVar) { console.log(`  (${label} chip mismatch)`); allOk = false; }
      const left = tile.querySelector(".wt-tile-left");
      const right = tile.querySelector(".wt-tile-right");
      if (!left || !right) { console.log(`  (${label} missing left/right columns)`); allOk = false; }
      if (right && tile.lastElementChild !== right) { console.log(`  (${label} right column — gem — is not the last/rightmost child)`); allOk = false; }
      const gem = right ? right.querySelector(".wt-gauge-wrap") : null;
      if (!gem) { console.log(`  (${label} gem illustration missing from right column)`); allOk = false; }
    }
    check("every tile has correct left-border color token, chip tint+icon color, and left/right column split with the gem on the right", allOk, "true");
  },
  () => {
    // v3.37.0: tiles are now dark (var(--bg)) with a full category-color border, not a white surface.
    const tiles = [...window.document.querySelectorAll(".wt-tracker-col")];
    const allWhite = tiles.every((t) => t.style.background === "" || getComputedStyle(t).backgroundColor);
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-tracker-col \{[^}]*\}/);
    check("tile CSS background uses var(--bg), not var(--surface)", rule ? rule[0].includes("background:var(--bg)") : null, "true");
    check("tile CSS uses var(--radius) for corner rounding", rule ? rule[0].includes("border-radius:var(--radius)") : null, "true");
  },
  () => {
    // Item 2: container is now a single-column vertical stack, not a 2-col grid.
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-trackers-grid \{[^}]*\}/);
    check("Log It! tile container is single-column flex (item 2)", rule ? rule[0].includes("display:flex") && rule[0].includes("flex-direction:column") : null, "true");
    check("Log It! tile container uses var(--s3) gap", rule ? rule[0].includes("gap:var(--s3)") : null, "true");
  },
  () => {
    // Item 4: ring fill color uses the category token (not the old shared mS/hS/gS/yS constants).
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    const ring = waterTile ? waterTile.querySelector(".wt-gauge-ring circle[opacity]") : null;
    check("Water ring stroke uses var(--water) token", ring ? ring.getAttribute("stroke") : null, "var(--water)");
  },
  () => {
    // My Plan grid is untouched — still 2-column.
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-plan-grid \{[^}]*\}/);
    check("My Plan grid still 2-column (untouched by this session)", rule ? rule[0].includes("grid-template-columns:1fr 1fr") : null, "true");
  },
  () => {
    // Spot-check: tapping a tile still opens its entry sheet — unchanged tap behavior.
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    check("found Water tile to tap", !!waterTile);
    if (waterTile) fire(waterTile);
  },
  () => {
    const dialInput = window.document.querySelector('input[placeholder="0"]');
    check("tapping Water tile opens the quick-dial sheet (tap handler unchanged)", !!dialInput);
  },
  () => check("set water amount to 32 in the quick dial", setInput("0", "32")),
  () => check("log 32oz of water", clickByText("Log 32oz")),
  () => {
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    const togo = waterTile ? waterTile.querySelector(".wt-tile-togo") : null;
    check("Goal 64oz − 32oz logged = 32oz to go (ring % calculation input unchanged)", togo ? togo.textContent.trim() : null, "32oz to go");
    const ring = waterTile ? waterTile.querySelector(".wt-gauge-ring circle[stroke-dasharray]") : null;
    const offset = ring ? parseFloat(ring.getAttribute("stroke-dashoffset")) : null;
    const circumference = 2 * Math.PI * 42;
    const expectedAt50pct = circumference * 0.5;
    check(
      `ring fill at 32/64 = 50% (dashoffset ≈ ${expectedAt50pct.toFixed(1)} of ${circumference.toFixed(1)} circumference)`,
      offset !== null && Math.abs(offset - expectedAt50pct) < 1,
      "true"
    );
  },
  () => check("nav to Today (tab mounts without errors after tile restructure)", nav("Today")),
  () => check("nav to Stats (tab mounts without errors)", nav("Stats")),
  () => check("no runtime errors on Stats tab", errors.length, 0),
  () => check("switch Stats to the All 3 combined view", clickByText("All 3")),
  // NOTE: recharts' ResponsiveContainer needs a non-zero measured container size before it
  // renders any chart children, and jsdom has no layout engine (0×0 for everything) — so the
  // actual <Bar>/<Line> fill colors can't be asserted from the rendered DOM here. Verified
  // instead by reading the shipped bundle's source text directly (see the end-state audit) that
  // the combined-bar and single-metric Water/Protein/Calories/Weight/Sleep fills use the raw
  // hex token values, not var(--water) etc. — recharts doesn't reliably resolve CSS variables.
  () => check("nav to My Plan (tab mounts without errors, chip color audit)", nav("My Plan")),
  () => {
    const waterChip = [...window.document.querySelectorAll(".wt-plan-card")].find((c) => c.textContent.includes("Water"));
    const icon = waterChip ? waterChip.querySelector(".wt-plan-card-icon svg") : null;
    check("My Plan Water chip icon color aligned to water token (v3.36.0: var(--water), was hex)", icon ? icon.getAttribute("stroke") : null, "var(--water)");
  },
  () => check("no runtime errors across the full v3.35.0 pass", errors.length, 0),

  // ── v3.36.0: Log It! icon fill + font sizes, warm-tan dark-bg text, My Plan tile updates ──
  () => check("nav to Log It! (item 1a/1b checks)", nav("Log It!")),
  () => {
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    const icon = waterTile ? waterTile.querySelector(".wt-tile-chip svg") : null;
    check("Log It! Water chip icon now has an explicit category color (item 1a)", icon ? icon.getAttribute("stroke") : null, "var(--water)");
    const cssText = window.document.querySelector("style").textContent;
    const goalRule = cssText.match(/\.wt-tile-goal \{[^}]*\}/);
    const togoRule = cssText.match(/\.wt-tile-togo \{[^}]*\}/);
    const loggedRule = cssText.match(/\.wt-tile-logged \{[^}]*\}/);
    check("wt-tile-goal font-size raised to 14px (item 1b)", goalRule ? goalRule[0].includes("font-size:14px") : null, "true");
    check("wt-tile-togo font-size raised to 15px, still font-weight 700 (item 1b)", togoRule ? togoRule[0].includes("font-size:15px") && togoRule[0].includes("font-weight:700") : null, "true");
    check("wt-tile-logged font-size raised to 14px (item 1b)", loggedRule ? loggedRule[0].includes("font-size:14px") : null, "true");
  },
  () => {
    const tiles = [...window.document.querySelectorAll(".wt-tracker-col")];
    check("all 8 Log It! tiles still mount cleanly after item 1 changes", tiles.length, 8);
    check("no runtime errors after item 1 changes", errors.length, 0);
  },
  () => {
    // Item 2: warm-tan text on dark backgrounds.
    const cssText = window.document.querySelector("style").textContent;
    const rules = [
      [".wt-date ", "var(--ink-inverse)"],
      [".wt-date-label ", "var(--ink-inverse)"],
      [".wt-section-label ", "var(--ink-inverse)"],
      [".wt-section-label-strong ", "var(--ink-inverse)"],
      [".wt-plan-section-label ", "var(--ink-inverse)"],
      [".wt-range-label ", "var(--ink-inverse)"],
    ];
    let allOk = true;
    for (const [sel, expected] of rules) {
      const re = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim() + " \\{[^}]*\\}");
      const m = cssText.match(re);
      if (!m || !m[0].includes(`color:${expected}`)) { console.log(`  (${sel} missing ${expected})`); allOk = false; }
    }
    check("page-level dark-bg text classes (header date, section labels, range label) use var(--ink-inverse)", allOk, "true");
    check("--ink-inverse token is the warm tan #FFF6DB", cssText.includes("--ink-inverse:#FFF6DB"), "true");
    const navBtnRule = cssText.match(/\.wt-nav-btn \{[^}]*\}/);
    const navActiveRule = cssText.match(/\.wt-nav-btn\.active \{[^}]*\}/);
    check("nav inactive tab labels use var(--ink-inverse), not var(--muted) globally", navBtnRule ? navBtnRule[0].includes("color:var(--ink-inverse)") : null, "true");
    check("nav active tab label still uses var(--accent) (unchanged)", navActiveRule ? navActiveRule[0].includes("color:var(--accent)") : null, "true");
    const fieldLabelRule = cssText.match(/\.wt-field \{[^}]*\}/);
    // v3.38.0: sheet field labels moved from var(--muted) to the lighter var(--muted-dark) —
    // the v3.37.0 low-contrast fix flagged in that session's summary and addressed here.
    check("sheet field labels use the AA-contrast var(--muted-dark), not the old var(--muted)", fieldLabelRule ? fieldLabelRule[0].includes("color:var(--muted-dark)") : null, "true");
  },
  () => check("nav to Today (to re-check the Prior Days label color)", nav("Today")),
  () => {
    const label = [...window.document.querySelectorAll("span")].find((s) => s.textContent === "Prior Days:");
    check("\"Prior Days:\" label updated to var(--ink-inverse) (item 2)", label ? label.style.color : null, "var(--ink-inverse)");
  },
  () => check("nav to My Plan (item 3 checks)", nav("My Plan")),
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    check("all 8 My Plan tiles mount", cards.length, 8);
    check("no runtime errors on My Plan after item 3 changes", errors.length, 0);
  },
  () => {
    // Item 3c: left accent border + resized/recolored chip on every My Plan card.
    const expected = [
      ["Water", "var(--water)", "var(--water-chip)"],
      ["Protein", "var(--protein)", "var(--protein-chip)"],
      ["Calories", "var(--calories)", "var(--calories-chip)"],
      ["Sleep", "var(--sleep)", "var(--sleep-chip)"],
      ["Weight", "var(--weight)", "var(--weight-chip)"],
      ["Exercise", "var(--exercise)", "var(--exercise-chip)"],
      ["RX & Vitamins", "var(--meds)", "var(--meds-chip)"],
      ["Treatments", "var(--treatment)", "var(--treatment-chip)"],
    ];
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    let allOk = true;
    for (const [label, colorVar, chipVar] of expected) {
      const card = cards.find((c) => c.querySelector(".wt-plan-card-title") && c.querySelector(".wt-plan-card-title").textContent === label);
      if (!card) { console.log(`  (missing My Plan card: ${label})`); allOk = false; continue; }
      if (!(card.style.border || "").includes(colorVar)) { console.log(`  (${label} My Plan border mismatch: "${card.style.border}")`); allOk = false; }
      const chip = card.querySelector(".wt-plan-card-icon");
      if (!chip || chip.style.background !== chipVar) { console.log(`  (${label} My Plan chip bg mismatch)`); allOk = false; }
    }
    check("every My Plan card has the matching category full border and chip-tint background", allOk, "true");
    const cssText = window.document.querySelector("style").textContent;
    const chipRule = cssText.match(/\.wt-plan-card-icon \{[^}]*\}/);
    check("My Plan chip resized to 28x28 / radius 8 (item 3c)", chipRule ? chipRule[0].includes("width:28px") && chipRule[0].includes("height:28px") && chipRule[0].includes("border-radius:8px") : null, "true");
  },
  () => {
    // Item 3b: bold "Target: " prefix on Water/Protein/Calories/Sleep/Exercise; Weight untouched; RX/Treatments have no goal line.
    const withTarget = ["Water", "Protein", "Calories", "Sleep", "Exercise"];
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    let allOk = true;
    for (const label of withTarget) {
      const card = cards.find((c) => c.querySelector(".wt-plan-card-title") && c.querySelector(".wt-plan-card-title").textContent === label);
      const goal = card ? card.querySelector(".wt-plan-card-goal") : null;
      const strong = goal ? goal.querySelector("strong") : null;
      if (!strong || strong.textContent !== "Target: " || (strong.style.fontWeight !== "700" && window.getComputedStyle(strong).fontWeight !== "700")) {
        console.log(`  (${label} missing bold "Target: " prefix)`); allOk = false;
      }
    }
    check("Water/Protein/Calories/Sleep/Exercise My Plan cards show a bold \"Target: \" prefix (item 3b)", allOk, "true");
    const weightCard = cards.find((c) => c.querySelector(".wt-plan-card-title") && c.querySelector(".wt-plan-card-title").textContent === "Weight");
    const weightGoal = weightCard ? weightCard.querySelector(".wt-plan-card-goal") : null;
    check("Weight card's existing \"Target\" text left exactly as-is (plain text, no new <strong> wrapper)", weightGoal ? !weightGoal.querySelector("strong") && weightGoal.textContent.includes("Target") : null, "true");
  },
  () => {
    // Item 3a: toggle a tile off and confirm the toggle+Track label stay at full opacity while the rest dims.
    const waterToggle = window.document.querySelector('[aria-label="Toggle Water on Log page"]');
    check("found Water toggle to switch off for the dimming check", !!waterToggle);
    if (waterToggle) fire(waterToggle);
  },
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    const waterCard = cards.find((c) => c.querySelector(".wt-plan-card-title") && c.querySelector(".wt-plan-card-title").textContent === "Water");
    check("Water card off after toggle", waterCard ? waterCard.classList.contains("off") : null, "true");
    const dim = waterCard ? waterCard.querySelector(".wt-plan-card-dim") : null;
    check("content wrapper (.wt-plan-card-dim) carries the off/dim class", dim ? dim.classList.contains("off") : null, "true");
    const toggleArea = waterCard ? waterCard.querySelector(".wt-plan-card-toggle-area") : null;
    check("toggle+Track area exists as a sibling OUTSIDE the dimmed content wrapper", toggleArea && dim ? !dim.contains(toggleArea) : null, "true");
    const cssText = window.document.querySelector("style").textContent;
    const dimOffRule = cssText.match(/\.wt-plan-card-dim\.off \{[^}]*\}/);
    const toggleAreaRule = cssText.match(/\.wt-plan-card-toggle-area \{[^}]*\}/);
    check("dim wrapper's off state reduces opacity (0.6)", dimOffRule ? dimOffRule[0].includes("opacity:.6") : null, "true");
    check("toggle-area CSS rule has no opacity reduction of its own", toggleAreaRule ? !toggleAreaRule[0].includes("opacity") : null, "true");
    const toggleBtn = toggleArea ? toggleArea.querySelector(".wt-switch") : null;
    check("toggle switch still tappable/rendered when tile is off", !!toggleBtn);
  },
  () => {
    // Re-enable Water so it's back to a known-good state, matching the pre-toggle baseline.
    const waterToggle = window.document.querySelector('[aria-label="Toggle Water on Log page"]');
    check("found Water toggle to re-enable it", !!waterToggle);
    if (waterToggle) fire(waterToggle);
  },
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    const waterCard = cards.find((c) => c.querySelector(".wt-plan-card-title") && c.querySelector(".wt-plan-card-title").textContent === "Water");
    check("Water re-enabled after the dimming check", waterCard ? !waterCard.classList.contains("off") : null, "true");
  },
  () => check("nav to Today (tab mounts without errors after item 2/3 changes)", nav("Today")),
  () => check("nav to Stats (tab mounts without errors)", nav("Stats")),
  () => check("no runtime errors across the full v3.36.0 pass", errors.length, 0),

  // ── v3.36.1: two missed old-blue text spots on the dark page background ────────
  () => check("nav to My Plan (missed-blue-text check)", nav("My Plan")),
  () => {
    const caption = [...window.document.querySelectorAll("p")].find((p) => p.textContent.startsWith("Off trackers stay visible here"));
    check("My Plan's \"Off trackers stay visible...\" caption found", !!caption);
    check("caption now uses var(--ink-inverse) (was the old muted blue-gray)", caption ? caption.style.color : null, "var(--ink-inverse)");
  },
  () => check("nav to Settings (missed-blue-text check)", nav("Settings")),
  () => {
    const label = [...window.document.querySelectorAll("span")].find((s) => s.textContent === "Notify me (push) when new feedback comes in");
    check("Settings' \"Notify me (push)...\" label found", !!label);
    check("label now uses var(--ink-inverse) (was the old muted blue-gray)", label ? label.style.color : null, "var(--ink-inverse)");
  },
  () => {
    // Confirm the OTHER wS-colored text in Settings — inside the white "About" .wt-card — was
    // correctly left untouched (dark text on white stays dark; not switched to the warm tan
    // meant for dark backgrounds), per Rob's "don't change text already correct" instruction.
    const version = [...window.document.querySelectorAll("p")].find((p) => p.textContent.startsWith("Version "));
    check("in-card version text found", !!version);
    check("in-card version text untouched (still its original muted color, not var(--ink-inverse))", version ? version.style.color !== "var(--ink-inverse)" : null, "true");
  },
  () => check("no runtime errors after the v3.36.1 fixes", errors.length, 0),

  // ── v3.37.0: manual entry input fix + dark tiles/sheets ────────────────────────
  () => check("nav to Log It! (v3.37.0 manual entry check)", nav("Log It!")),
  () => {
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    check("found Water tile to open manual entry", !!waterTile);
    if (waterTile) fire(waterTile);
  },
  () => {
    const input = window.document.querySelector('input[placeholder="0"]');
    check("Water manual entry numeric input present", !!input);
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-field input, \.wt-field select, \.wt-field textarea \{[^}]*\}/);
    check("manual entry input CSS has explicit non-transparent background (var(--bg))", rule ? rule[0].includes("background:var(--bg)") : null, "true");
    check("manual entry input CSS has explicit visible text color (var(--ink-inverse))", rule ? rule[0].includes("color:var(--ink-inverse)") : null, "true");
  },
  () => check("type 32 into Water manual entry input", setInput("0", "32")),
  () => {
    const input = window.document.querySelector('input[placeholder="0"]');
    check("Water manual entry input accepted the typed value", input ? input.value : null, "32");
    const logBtn = [...window.document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Log 32oz");
    check("Log button visible/present for typed value", !!logBtn);
  },
  () => check("log 32oz of water (manual entry submit works)", clickByText("Log 32oz")),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const tileRule = cssText.match(/\.wt-tracker-col \{[^}]*\}/);
    check("Log It! tile CSS background is dark (var(--bg))", tileRule ? tileRule[0].includes("background:var(--bg)") : null, "true");
    const titleRule = cssText.match(/\.wt-tile-title \{[^}]*\}/);
    check("Log It! tile title text uses var(--ink-inverse)", titleRule ? titleRule[0].includes("color:var(--ink-inverse)") : null, "true");
    const sheetRule = cssText.match(/\.wt-sheet \{[^}]*\}/);
    check("bottom sheet CSS background is dark (var(--surface-dark))", sheetRule ? sheetRule[0].includes("background:var(--surface-dark)") : null, "true");
    const btnRule = cssText.match(/\.wt-btn-primary \{[^}]*\}/);
    check("primary sheet button uses var(--accent) background", btnRule ? btnRule[0].includes("background:var(--accent)") : null, "true");
  },
  () => check("no runtime errors after v3.37.0 manual-entry/tile changes", errors.length, 0),
  () => {
    // Close the Water manual-entry sheet, then open the combined entry sheet (via "Use Your
    // Presets or Log a Meal") and its nested My Presets sheet — a second, independent sheet —
    // to confirm at least one more sheet mounts cleanly under the new dark styling.
    const closeBtns = [...window.document.querySelectorAll('button[aria-label="Close"]')];
    if (closeBtns[0]) fire(closeBtns[0]);
    const combinedEntryBtn = clickByText("Use Your Presets or Log a Meal");
    check("found 'Use Your Presets or Log a Meal' button to open combined entry sheet", combinedEntryBtn);
  },
  () => {
    const editPresets = [...window.document.querySelectorAll("button")].find((b) => b.textContent.includes("Edit Presets"));
    check("found Edit Presets button to open My Presets sheet", !!editPresets);
    if (editPresets) fire(editPresets);
  },
  () => {
    const header = [...window.document.querySelectorAll("h3")].find((h) => h.textContent === "My Presets");
    check("My Presets sheet opened without errors", !!header);
    check("no runtime errors after opening My Presets sheet", errors.length, 0);
  },
  () => check("nav to Today (mounts without errors, v3.37.0)", nav("Today")),
  () => check("nav to Stats (mounts without errors, v3.37.0)", nav("Stats")),
  () => check("no runtime errors after full v3.37.0 pass", errors.length, 0),

  // ── v3.38.0: finish dark theme everywhere + header placeholders ────────────────
  () => {
    // Header: profile placeholder (left), logo, title, AI placeholder (right).
    const banner = window.document.querySelector(".wt-topbanner-inner");
    check("header banner found", !!banner);
    const profile = window.document.querySelector(".wt-topbanner-profile");
    const ai = window.document.querySelector(".wt-topbanner-ai");
    check("profile placeholder icon present (left of logo)", !!profile);
    check("AI assistant placeholder icon present (right of title)", !!ai);
    if (banner && profile && ai) {
      const kids = [...banner.children];
      const profileIdx = kids.indexOf(profile);
      const badgeIdx = kids.findIndex((k) => k.className.includes("wt-topbanner-badge"));
      const textIdx = kids.findIndex((k) => k.className.includes("wt-topbanner-text"));
      const aiIdx = kids.indexOf(ai);
      check("header order is profile, logo, title, AI icon", profileIdx < badgeIdx && badgeIdx < textIdx && textIdx < aiIdx, "true");
    }
    const cssText = window.document.querySelector("style").textContent;
    const badgeRule = cssText.match(/\.wt-topbanner-badge \{[^}]*\}/);
    check("logo badge resized down from 82px", badgeRule ? /width:(\d+)px/.exec(badgeRule[0])[1] < 82 : null, "true");
    const titleRule = cssText.match(/\.wt-topbanner-title \{[^}]*\}/);
    check("title font-size resized down from 27px", titleRule ? /font-size:(\d+)px/.exec(titleRule[0])[1] < 27 : null, "true");
  },
  () => check("nav to Today (Past Days popup check)", nav("Today")),
  () => {
    const btn = window.document.querySelector('button[aria-label="View past days"]');
    check("found 'View past days' button", !!btn);
    if (btn) fire(btn);
  },
  () => {
    const sheet = [...window.document.querySelectorAll(".wt-sheet")].find((s) => s.textContent.includes("Past days") || s.textContent.includes("Enter Missed Items"));
    check("Past Days popup opened (sheet mounted)", !!sheet);
    check("no runtime errors opening Past Days popup", errors.length, 0);
    const cssText = window.document.querySelector("style").textContent;
    const sheetRule = cssText.match(/\.wt-sheet \{[^}]*\}/);
    check("sheet CSS has a visible outer border (var(--hairline-bright) as of v3.38.1)", sheetRule ? sheetRule[0].includes("border:1px solid var(--hairline-bright)") : null, "true");
    const logRowRule = cssText.match(/\.wt-log-row \{[^}]*\}/);
    check("Past Days log rows are dark (var(--bg)), not white", logRowRule ? logRowRule[0].includes("background:var(--bg)") : null, "true");
    const logTimeRule = cssText.match(/\.wt-log-time \{[^}]*\}/);
    check("Past Days log row time text uses var(--ink-inverse), not var(--ink)", logTimeRule ? logTimeRule[0].includes("color:var(--ink-inverse)") : null, "true");
  },
  () => check("no runtime errors after Past Days popup check", errors.length, 0),
  () => check("nav to Settings (mounts with inputs, v3.38.0)", nav("Settings")),
  () => {
    const input = [...window.document.querySelectorAll("input")].find((i) => i.type === "text" || i.type === "email");
    check("Settings has at least one input rendered", !!input);
    check("no runtime errors on Settings", errors.length, 0);
  },
  () => check("nav to My Plan (v3.38.0 dark-theme regression check)", nav("My Plan")),
  () => check("no runtime errors on My Plan", errors.length, 0),
  () => check("nav to Stats (v3.38.0 dark-theme regression check)", nav("Stats")),
  () => check("no runtime errors on Stats", errors.length, 0),
  () => check("nav to Log It! (manual entry regression check)", nav("Log It!")),
  () => {
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    check("found Water tile for v3.38.0 regression check", !!waterTile);
    if (waterTile) fire(waterTile);
  },
  () => {
    const input = window.document.querySelector('input[placeholder="0"]');
    check("Water manual entry input still present (v3.37.0 regression check)", !!input);
  },
  () => check("no runtime errors after full v3.38.0 pass", errors.length, 0),

  // ── v3.38.1: brighter borders, bigger header icons, header/footer stacking ─────
  () => {
    const cssText = window.document.querySelector("style").textContent;
    check("--hairline-bright token defined", cssText.includes("--hairline-bright:#5A7390"), "true");
    const cardRule = cssText.match(/\.wt-card \{[^}]*\}/);
    check("card borders upgraded to var(--hairline-bright)", cardRule ? cardRule[0].includes("border:1px solid var(--hairline-bright)") : null, "true");
    const sheetRule = cssText.match(/\.wt-sheet \{[^}]*\}/);
    check("sheet outer border upgraded to var(--hairline-bright)", sheetRule ? sheetRule[0].includes("border:1px solid var(--hairline-bright)") : null, "true");
    const inputRule = cssText.match(/\.wt-field input, \.wt-field select, \.wt-field textarea \{[^}]*\}/);
    check("input borders upgraded to var(--hairline-bright)", inputRule ? inputRule[0].includes("border:1px solid var(--hairline-bright)") : null, "true");
    const backdropRule = cssText.match(/\.wt-backdrop \{[^}]*\}/);
    check("backdrop is now near-opaque (alpha .94) so the footer is hidden behind an open sheet", backdropRule ? backdropRule[0].includes("rgba(14,42,46,.94)") : null, "true");
    const topbannerRule = cssText.match(/\.wt-topbanner \{[^}]*\}/);
    check("header now has a z-index (250) above any sheet/backdrop so it always stays visible", topbannerRule ? topbannerRule[0].includes("z-index:250") : null, "true");
    const shareRule = cssText.match(/\.wt-doctor-share-overlay \{[^}]*\}/);
    check("doctor-share full-screen overlay raised above the header's new z-index (260 > 250)", shareRule ? shareRule[0].includes("z-index:260") : null, "true");
    const profileRule = cssText.match(/\.wt-topbanner-profile \{[^}]*\}/);
    check("profile placeholder resized up to 40px", profileRule ? profileRule[0].includes("width:40px") : null, "true");
    const aiRule = cssText.match(/\.wt-topbanner-ai \{[^}]*\}/);
    check("AI placeholder resized up to 40px with a visible chip background", aiRule ? aiRule[0].includes("width:40px") && aiRule[0].includes("background:var(--accent-chip)") : null, "true");
  },
  () => check("nav to Log It! (v3.38.1 regression check)", nav("Log It!")),
  () => check("all 8 Log It! tiles still mount after border-color change", [...window.document.querySelectorAll(".wt-tracker-col")].length, 8),
  () => {
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    if (waterTile) fire(waterTile);
  },
  () => {
    const input = window.document.querySelector('input[placeholder="0"]');
    check("manual entry input still present after v3.38.1 border/header changes", !!input);
  },
  () => check("no runtime errors after v3.38.1 pass", errors.length, 0),

  // ── v3.38.2: Past Days text-color fix + filled tile icons ──────────────────────
  () => {
    const cssText = window.document.querySelector("style").textContent;
    check(
      "global button/input/select/textarea color-inherit reset present (Past Days text-color fix)",
      cssText.includes(":where(button, input, select, textarea) { color:inherit; font:inherit; }"),
      "true"
    );
  },
  () => check("nav to Log It! (filled-icon check)", nav("Log It!")),
  () => {
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    const svg = waterTile ? waterTile.querySelector(".wt-tile-chip svg") : null;
    check("Log It! Water tile icon found", !!svg);
    check("Log It! Water tile icon is filled, not transparent-inside", svg ? svg.getAttribute("fill") : null, "var(--water)");
  },
  () => check("nav to My Plan (filled-icon check)", nav("My Plan")),
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    const waterCard = cards.find((c) => c.querySelector(".wt-plan-card-title") && c.querySelector(".wt-plan-card-title").textContent === "Water");
    const svg = waterCard ? waterCard.querySelector(".wt-plan-card-icon svg") : null;
    check("My Plan Water tile icon found", !!svg);
    check("My Plan Water tile icon is filled, not transparent-inside", svg ? svg.getAttribute("fill") : null, "var(--water)");
  },
  () => check("nav to Today (Past Days text-color regression check)", nav("Today")),
  () => {
    const btn = window.document.querySelector('button[aria-label="View past days"]');
    if (btn) fire(btn);
  },
  () => {
    const dateBtn = [...window.document.querySelectorAll(".wt-preset-row")][0];
    check("Past Days date-list button found", !!dateBtn);
    const nameSpan = dateBtn ? dateBtn.querySelector(".wt-preset-name") : null;
    check("Past Days date-list button has no conflicting inline/explicit dark color of its own (relies on the new inherit reset)", nameSpan ? nameSpan.style.color : "", "");
    check("no runtime errors opening Past Days after the text-color fix", errors.length, 0);
  },
  () => check("no runtime errors after v3.38.2 pass", errors.length, 0),
];

// ─── Runner ────────────────────────────────────────────────────────────────────
// GOTCHA 6: React needs ~2.5s before first assertions.
let t = 2500;
for (const step of STEPS) {
  setTimeout(() => { try { step(); } catch (e) { errors.push("STEP THREW: " + (e.stack || e.message)); } }, t);
  t += 500;
}
setTimeout(() => {
  console.log("\n=== RUNTIME ERRORS ===");
  console.log(errors.length === 0 ? "none" : JSON.stringify(errors, null, 2));
  process.exit(errors.length > 0 ? 2 : 0);
}, t);
// GOTCHA 7: safety net so lingering app timers can't hang the process.
setTimeout(() => process.exit(3), t + 5000);
