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
  // supplements: [{ id: "s1", name: "TestVit", intervalDays: 1, lastTakenDate: null,
  //                 nextDueOverride: null, trackInventory: true, qtyRemaining: 3,
  //                 expirationDate: null }],
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
    check("tile count", [...window.document.querySelectorAll(".wt-tracker-col")].length, 8);
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
  () => check("open presets/log sheet", clickByText("Use Your Presets or Log a Meal")),
  () => check("click Edit Presets link", clickByText("✏ Edit Presets")),
  () => {
    const headers = [...window.document.querySelectorAll(".wt-sheet-header h3")].map((h) => h.textContent);
    check("My Presets sheet opened inline", headers.includes("My Presets"));
    check("still on Log It! (no nav away)", !!window.document.querySelector(".wt-tracker-col"));
  },
  // Add assertions for whatever changed this session.
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
