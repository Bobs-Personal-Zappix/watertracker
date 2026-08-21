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
  settings: { showWater: false, showTreatments: false },
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
    check("Self-Managed sheet label stays dark (not white) on light sheet", label ? label.style.color : null, "var(--ink)");
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
    check("wordmark color is #fff", titleRuleMatch ? titleRuleMatch[0].includes("color:#fff") : null, "true");
    check("wt-topbanner element exists", !!banner);
  },
  () => check("nav to Log It! (for grid-to-button spacing check)", nav("Log It!")),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-action-btns\s*\{[^}]*\}/);
    check("wt-action-btns has margin-top:16px (matches existing 16px spacing scale)", rule ? rule[0].includes("margin-top:16px") : null, "true");
  },
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
