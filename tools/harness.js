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
      // Pre-existing RX item with category/pharmacy/refills/partner fields already set, as if
      // saved in a prior session — proves the migrate()-on-load normalizer bug fix (v3.49.0):
      // these fields used to be silently stripped by US() every time the app booted.
      { id: "s3", name: "SeedRx", category: "rx", intervalDays: 1, lastTakenDate: null,
        nextDueOverride: null, trackInventory: true, qtyRemaining: 5,
        expirationDate: null, pharmacy: "Seed Pharmacy", refillsRemaining: 2,
        partnerLogoDataUri: "data:image/jpeg;base64,SEEDRXLOGO", partnerLink: "https://example.com/seedrx" },
    ],
    treatments: [
      // Same reload-persistence proof for treatments' `provider`/partner fields. intervalDays:0
      // (history-only) and qtyRemaining above the low-supply threshold deliberately avoid
      // triggering due-callouts or QS() alerts elsewhere in the suite — this seed item exists
      // only to prove field survival through the boot-time migrate() pass.
      { id: "t1", name: "SeedTreatment", intervalDays: 0, lastTakenDate: null,
        nextDueOverride: null, trackInventory: true, qtyRemaining: 12,
        expirationDate: null, provider: "Seed Provider",
        partnerLogoDataUri: "data:image/jpeg;base64,SEEDTREATMENTLOGO", partnerLink: "https://example.com/seedtreatment" },
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
const rxItem = (name) => stored().settings.rx.find((s) => s.name === name);
const treat = (name) => stored().settings.treatments.find((t) => t.name === name);
const logsToday = () => stored().logs[TODAY] || [];
const headerText = () => {
  const el = window.document.querySelector(".wt-date");
  return el ? el.textContent.trim() : null;
};
function tiles() {
  // v3.50.0: Log It! renders compact tiles (.wt-tracker-col-compact); Today still renders the
  // full-detail tiles (.wt-tracker-col). Only one of the two exists on any given page, so a plain
  // union keeps every existing "does tile X appear" check working regardless of which page it runs on.
  return [...window.document.querySelectorAll(".wt-tracker-col, .wt-tracker-col-compact")]
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
    // v3.51.0: app boots on Log It!, a compact grid — 6 real trackers (Water+Treatments off
    // in seed); Meals moved to the top row so it's no longer a grid tile.
    check("tile count (Water+Treatments off in seed, Meals moved to the top row, RX/Supplements split into two tiles)", [...window.document.querySelectorAll(".wt-tracker-col-compact")].length, 7);
    console.log("tiles:", JSON.stringify(tiles(), null, 1));
  },
  () => {
    // v3.53.0: date pill's prev/next chevrons replaced with a native <input type="date"> calendar
    // picker (real-device fix — chevrons were too small a tap target and gave no direct way to
    // jump to an arbitrary day).
    const pill = window.document.querySelector(".wt-datepill");
    check("date pill present on Log It!", !!pill);
    check("no leftover chevron buttons on the date pill", !window.document.querySelector(".wt-datepill-chevron"));
    const dateInput = pill ? pill.querySelector('input[type="date"]') : null;
    check("date pill has a native date input", !!dateInput);
    check("date input defaults to today", dateInput ? dateInput.value : null, TODAY);
    check("date input caps out at today (max attr, never allow a future date)", dateInput ? dateInput.getAttribute("max") : null, TODAY);
    check("badge reads TODAY by default", pill ? pill.textContent.includes("TODAY") : null, "true");
    check("pill is not in past-day styling by default", pill ? pill.classList.contains("wt-datepill-past") : null, "false");
  },
  () => {
    const dateInput = window.document.querySelector(".wt-datepill input[type=\"date\"]");
    check("set date pill to yesterday", !!dateInput);
    if (dateInput) {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(dateInput, DAYS_AGO(1));
      dateInput.dispatchEvent(new window.Event("change", { bubbles: true }));
    }
  },
  () => {
    const pill = window.document.querySelector(".wt-datepill");
    check("badge reads YESTERDAY after picking the prior day", pill ? pill.textContent.includes("YESTERDAY") : null, "true");
    check("pill switches to past-day (amber) styling", pill ? pill.classList.contains("wt-datepill-past") : null, "true");
    check("'Saving to this day' subtitle appears", !!window.document.querySelector(".wt-datepill-subtitle"));
  },
  () => {
    // Reset back to today so the rest of the suite runs against its usual assumptions.
    const dateInput = window.document.querySelector(".wt-datepill input[type=\"date\"]");
    if (dateInput) {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(dateInput, TODAY);
      dateInput.dispatchEvent(new window.Event("change", { bubbles: true }));
    }
    const pill = window.document.querySelector(".wt-datepill");
    check("date pill back to TODAY for the rest of the suite", pill ? pill.textContent.includes("TODAY") : null, "true");
  },
  () => check("no runtime errors after date-pill pass", errors.length, 0),
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
  () => check("open presets/log sheet", clickByText("Presets", "div")),
  () => check("click Edit Presets link", clickByText("✏ Edit Presets")),
  () => {
    const headers = [...window.document.querySelectorAll(".wt-sheet-header h3")].map((h) => h.textContent);
    check("My Presets sheet opened inline", headers.includes("My Presets"));
    check("still on Log It! (no nav away)", !!window.document.querySelector(".wt-tracker-col-compact"));
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
  () => check("nav to My Plan (for Supplements sheet check)", nav("My Plan")),
  // "Self-Managed" (combined supplements+treatments) was split into "Vitamins & Supplements" /
  // "RX" in an earlier session (see docs/DECISION-LOG.md UX-22/UX-23), then in v3.51.0 Track 2
  // "Vitamins & Supplements" became a genuinely independent "Supplements" tracker (its own
  // settings.supplements array, starting empty) rather than a category filter — see TRACK-01.
  () => check("open Supplements sheet", clickByText("Supplements", "button")),
  () => {
    const title = [...window.document.querySelectorAll(".wt-modal-header h3, h3")]
      .find((el) => el.textContent === "Supplements");
    check("Supplements sheet title found", !!title);
  },
  () => check("close Supplements sheet", clickByAria("Close")),
  () => check("open RX sheet", clickByText("RX", "button")),
  () => {
    const title = [...window.document.querySelectorAll(".wt-modal-header h3, h3")]
      .find((el) => el.textContent === "RX");
    check("RX sheet title found", !!title);
    // SeedRx (category "rx", pharmacy/refills/partner fields pre-set in the seed, as if saved in
    // a prior session) appearing here proves those fields survived the boot-time migrate() pass —
    // the v3.49.0 regression check for the normalizer bug that used to silently strip them.
    const row = [...window.document.querySelectorAll(".wt-preset-row")].find((r) => r.textContent.includes("SeedRx"));
    check("seeded SeedRx (category/pharmacy/refills pre-set) survived boot and appears in the RX list", !!row);
  },
  () => check("close RX sheet", clickByAria("Close")),
  // Add assertions for whatever changed this session.
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    check("My Plan always renders all 9 cards (Water off, Treatments off seeded; RX/Supplements split into two rows)", cards.length, 9);
    const titles = cards.map((c) => c.querySelector(".wt-plan-card-title").textContent);
    check("My Plan card order", titles.join(","), "Water,Protein,Calories,Sleep,Weight,Exercise,RX,Supplements,Treatments");
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
    check("still 9 cards after toggling Water on", cards.length, 9);
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
    check("still 9 cards after toggling Water back off", cards.length, 9);
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
  () => {
    // v3.54.0: header rearranged per Rob's real-device feedback — brand (logo+title) moved to the
    // left edge, profile icon moved to the right edge (was profile-left, brand-centered).
    const brand = window.document.querySelector(".wt-topbanner-brand");
    const profile = window.document.querySelector(".wt-topbanner-profile");
    check("wt-topbanner-brand (logo+title) group exists", !!brand);
    check("profile button now sits after the brand group in DOM order (right side)", brand && profile ? !!(brand.compareDocumentPosition(profile) & window.Node.DOCUMENT_POSITION_FOLLOWING) : null, "true");
    const cssText = window.document.querySelector("style").textContent;
    const innerRule = cssText.match(/\.wt-topbanner-inner\s*\{[^}]*\}/);
    check("header row uses space-between (brand left, profile right)", innerRule ? innerRule[0].includes("justify-content:space-between") : null, "true");
  },
  () => check("nav to Log It! (for grid-to-button spacing check)", nav("Log It!")),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    // Negative lookbehind skips the v3.47.0 compound ".wt-trackers-grid + .wt-action-btns" rule,
    // which also matches a naive ".wt-action-btns {" search since it ends with that same text.
    const rule = cssText.match(/(?<!\+ )\.wt-action-btns\s*\{[^}]*\}/);
    check("wt-action-btns has margin-top:16px (matches existing 16px spacing scale)", rule ? rule[0].includes("margin-top:16px") : null, "true");
  },

  // ── v3.33.0 Part A: OO (add/edit preset) modal must portal to document.body ──
  () => check("open presets/log sheet (for OO portal check)", clickByText("Presets", "div")),
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
    const logSheetStillOpen = [...window.document.querySelectorAll(".wt-sheet-header h3")].some((h) => h.textContent === "Use Your Presets");
    const myPresetsStillOpen = [...window.document.querySelectorAll(".wt-sheet-header h3")].some((h) => h.textContent === "My Presets");
    check("clicking OO's backdrop leaves the parent presets sheet open (UX-OPEN-02 fixed)", logSheetStillOpen, "true");
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
  // Prior Days moved to Stats in v3.48.0 (renamed "Edit Prior Days Logs").
  () => check("nav to Stats (to open Prior Days)", nav("Stats")),
  () => check("open All Past Days", clickByAria("Edit Prior Days Logs")),
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
    const s = rxItem("TestVit");
    check("TestVit inventory decremented by backfilled dose (10 → 9)", s ? s.qtyRemaining : null, 9);
    check("TestVit lastTakenDate untouched by backfill (rule 2: schedule never recalculates)", s ? s.lastTakenDate : "MISSING", null);
    check("TestVit nextDueOverride untouched by backfill (rule 2)", s ? s.nextDueOverride : "MISSING", null);
  },
  // v3.50.0: Log It!'s tiles are now compact (icon/ring/name only, no goal/logged text) — this
  // check needs the full-detail markup, which now lives on Today (same MO component, unchanged).
  () => check("nav to Today (verify today's RX tile ring unaffected)", nav("Today")),
  () => {
    const rxTile = tiles().find((t) => t.startsWith("RX & Supplements"));
    check("today's RX & Supplements tile still shows 0 taken (rule 3: today's ring unaffected)", rxTile ? rxTile.includes("0 Taken") : null, "true");
  },
  () => check("nav back to Stats (to delete the backfilled dose)", nav("Stats")),
  () => check("re-open All Past Days", clickByAria("Edit Prior Days Logs")),
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
    check("backfilled RX entry removed after delete", entries.some((e) => e.type === "rx"), "false");
    const s = rxItem("TestVit");
    check("TestVit inventory restored after deleting backfilled dose (9 → 10)", s ? s.qtyRemaining : null, 10);
  },

  // ── v3.34.0 item 2: "Prior Days:" label + brighter/bigger calendar icon on Today ──
  // Moved off Today entirely in v3.48.0 — see that section below for the current location
  // (Stats page, renamed "Edit Prior Days Logs").

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
  // (surface moved from the removed "To Do Today" section to "Today at a Glance" in v3.43.0/v3.44.0)
  () => check("nav to Today (for overdue icon check)", nav("Today")),
  () => {
    const medsRow = [...window.document.querySelectorAll(".wt-tracked-row")].find((r) => r.textContent.includes("RX & Supplements"));
    check("seeded OverdueMed is reflected in the RX & Supplements due callout", !!medsRow);
    const icon = medsRow ? medsRow.querySelector(".wt-tracked-row-chip svg") : null;
    check("due callout has an icon glyph alongside color (not color alone)", !!icon, "true");
    check("due callout text still states the due count", medsRow ? /due today/.test(medsRow.textContent) : null, "true");
  },

  // ── v3.34.0 item 6a: touch targets — icon buttons (pencil/trash/close) ≥48px ──
  // The "View past days" button used to guarantee a .wt-icon-btn on an otherwise-empty Today
  // page; that button moved to Stats in v3.48.0, so open its replacement here instead.
  () => check("nav to Stats (to find a guaranteed .wt-icon-btn instance)", nav("Stats")),
  () => check("open Edit Prior Days Logs", clickByAria("Edit Prior Days Logs")),
  () => {
    const iconBtn = window.document.querySelector(".wt-icon-btn");
    check("wt-icon-btn (pencil/trash/close everywhere, incl. the past-days sheet's Close button) found", !!iconBtn);
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
  // v3.50.0: this whole block inspects full-detail tile markup (chip/border/mid/ring) — Log It!
  // is compact now, so it runs against Today's tile grid (same MO component, unchanged there).
  () => check("nav to Today (item 3/4 tile restructure checks)", nav("Today")),
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
      ["RX & Supplements", "var(--meds)", "var(--meds-chip)"],
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
    // v3.46.0: gap bumped var(--s3)->var(--s6) to match the Voice-tile-to-Water spacing across all tiles.
    check("Log It! tile container uses var(--s6) gap (bumped from s3 in v3.46.0)", rule ? rule[0].includes("gap:var(--s6)") : null, "true");
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
  () => check("log 32oz of water", clickByText("Add to Water")),
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
  // v3.50.0: chip-icon-color and tile-text font-size checks need full-detail markup (now Today).
  () => check("nav to Today (item 1a/1b checks)", nav("Today")),
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
  // "Prior Days:" label moved off Today in v3.48.0 — see that section below.
  () => check("nav to My Plan (item 3 checks)", nav("My Plan")),
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    check("all 9 My Plan tiles mount", cards.length, 9);
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
      ["RX", "var(--meds)", "var(--meds-chip)"],
      ["Supplements", "var(--supplements)", "var(--supplements-chip)"],
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
  // v3.50.0: Water tile lookup here needs full-detail markup (now Today); the presets-sheet
  // flow later in this block still needs Log It! specifically and navs there itself below.
  () => check("nav to Today (v3.37.0 manual entry check)", nav("Today")),
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
    const logBtn = [...window.document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Add to Water");
    check("Log button visible/present for typed value", !!logBtn);
  },
  () => check("log 32oz of water (manual entry submit works)", clickByText("Add to Water")),
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
    // Close the Water manual-entry sheet, then nav to Log It! (v3.50.0: the presets trigger is
    // Log It!-only now, via the "Use Presets" tile below the compact grid) and open the presets
    // sheet, then its nested My Presets sheet — a second, independent sheet — to confirm at
    // least one more sheet mounts cleanly under the new dark styling.
    const closeBtns = [...window.document.querySelectorAll('button[aria-label="Close"]')];
    if (closeBtns[0]) fire(closeBtns[0]);
  },
  () => check("nav to Log It! (presets flow)", nav("Log It!")),
  () => {
    const presetsBtn = clickByText("Presets", "div");
    check("found 'Use Presets' tile to open presets sheet", presetsBtn);
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
    // Header: profile placeholder (left), logo, title. AI placeholder removed v3.40.0 —
    // its future-Smart-Entry role is now carried by the Voice Tracker tile on Log It!.
    const banner = window.document.querySelector(".wt-topbanner-inner");
    check("header banner found", !!banner);
    const profile = window.document.querySelector(".wt-topbanner-profile");
    const ai = window.document.querySelector(".wt-topbanner-ai");
    check("profile placeholder icon present (left of logo)", !!profile);
    check("AI assistant placeholder icon removed from header (v3.40.0, superseded by Voice Tracker tile)", !ai);
    const cssText = window.document.querySelector("style").textContent;
    const badgeRule = cssText.match(/\.wt-topbanner-badge \{[^}]*\}/);
    check("logo badge resized down from 82px", badgeRule ? /width:(\d+)px/.exec(badgeRule[0])[1] < 82 : null, "true");
    const titleRule = cssText.match(/\.wt-topbanner-title \{[^}]*\}/);
    check("title font-size resized down from 27px", titleRule ? /font-size:(\d+)px/.exec(titleRule[0])[1] < 27 : null, "true");
  },
  () => check("nav to Stats (Past Days popup check, moved off Today in v3.48.0)", nav("Stats")),
  () => {
    const btn = window.document.querySelector('[aria-label="Edit Prior Days Logs"]');
    check("found 'Edit Prior Days Logs' tile", !!btn);
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
  () => check("nav to Today (manual entry regression check)", nav("Today")),
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
    check(".wt-topbanner-ai CSS rule removed along with the header icon (v3.40.0)", cssText.includes(".wt-topbanner-ai"), "false");
  },
  () => check("nav to Today (v3.38.1 regression check)", nav("Today")),
  () => check("all 8 Today tiles still mount after border-color change", [...window.document.querySelectorAll(".wt-tracker-col")].length, 8),
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
  () => check("nav to Today (filled-icon check)", nav("Today")),
  () => {
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((t) => t.textContent.includes("Water"));
    const svg = waterTile ? waterTile.querySelector(".wt-tile-chip svg") : null;
    check("Today Water tile icon found", !!svg);
    check("Today Water tile icon is filled, not transparent-inside", svg ? svg.getAttribute("fill") : null, "var(--water)");
  },
  () => check("nav to My Plan (filled-icon check)", nav("My Plan")),
  () => {
    const cards = [...window.document.querySelectorAll(".wt-plan-card")];
    const waterCard = cards.find((c) => c.querySelector(".wt-plan-card-title") && c.querySelector(".wt-plan-card-title").textContent === "Water");
    const svg = waterCard ? waterCard.querySelector(".wt-plan-card-icon svg") : null;
    check("My Plan Water tile icon found", !!svg);
    check("My Plan Water tile icon is filled, not transparent-inside", svg ? svg.getAttribute("fill") : null, "var(--water)");
  },
  () => check("nav to Stats (Past Days text-color regression check, moved off Today in v3.48.0)", nav("Stats")),
  () => {
    const btn = window.document.querySelector('[aria-label="Edit Prior Days Logs"]');
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

  // ── v3.40.0: Log It! action-button split, Voice Tracker tile, header AI icon removed ──
  () => check("nav to Log It! (v3.40.0 checks)", nav("Log It!")),
  () => {
    // Best-effort: close sheets left open by earlier tests in this long-running
    // session (sheets are portaled to document.body and survive tab navigation).
    // Each .wt-backdrop's own onClick closes it, so click every one found; not
    // asserted strictly since stacking/z-order across many prior tests can leave
    // an odd one — the checks below only care that OUR new sheets aren't double-stacked.
    for (let guard = 0; guard < 10; guard++) {
      const backdrops = [...window.document.querySelectorAll(".wt-backdrop")];
      if (backdrops.length === 0) break;
      backdrops.forEach((b) => fire(b));
    }
  },
  () => {
    // v3.51.0: Voice Entry/Use Presets FeatureTile banners removed from Log It!, replaced by a
    // 3-item bare-artwork "fast paths" row (.wt-toprow > .wt-toprow-item) above the compact grid:
    // Voice Tracker, Presets, Meal Entry. The row sits before the grid in document order.
    const topRow = window.document.querySelector(".wt-toprow");
    check("top row present above the tracker grid", !!topRow);
    const items = [...window.document.querySelectorAll(".wt-toprow-item")].map((e) => e.textContent.trim());
    check("top row has Voice Tracker item", items.includes("Voice Tracker"), "true");
    check("top row has Presets item", items.includes("Presets"), "true");
    check("top row has Meal Entry item", items.includes("Meal Entry"), "true");
    const grid = window.document.querySelector(".wt-trackers-grid-compact");
    check("top row sits before the compact grid in document order", topRow && grid ? !!(topRow.compareDocumentPosition(grid) & window.Node.DOCUMENT_POSITION_FOLLOWING) : null, "true");
  },
  () => {
    // v3.51.0: Log It! is now a borderless 3x3 compact grid, Meals moved out to the top row, and
    // RX & Supplements split into two independent tiles — 9 tiles with all trackers enabled. The
    // old .wt-action-btn buttons still don't render here.
    check("no .wt-action-btn buttons on the now-compact Log It!", !window.document.querySelector(".wt-action-btn"), "true");
    const compactTiles = [...window.document.querySelectorAll(".wt-tracker-col-compact")];
    check("Log It! renders 9 compact tiles (Meals moved to the top row; RX/Supplements split)", compactTiles.length, 9);
    check("Meals tile no longer in the compact grid", compactTiles.some((t) => t.textContent.trim() === "Meals"), "false");
  },
  () => check("open presets sheet (v3.51.0 top-row trigger)", clickByText("Presets", "div")),
  () => {
    const header = [...window.document.querySelectorAll(".wt-sheet-header h3")].find((h) => h.textContent === "Use Your Presets");
    check("presets-only sheet header found", !!header);
    const sheet = header ? header.closest(".wt-sheet") : null;
    check("presets-only sheet has no manual Water/Protein/Calories fields", sheet ? !sheet.querySelector(".wt-field-row") : null, "true");
    const closeBtn = window.document.querySelector('button[aria-label="Close"]');
    if (closeBtn) fire(closeBtn);
  },
  () => check("open manual meal sheet (v3.51.0 top-row trigger)", clickByText("Meal Entry", "div")),
  () => {
    const header = [...window.document.querySelectorAll(".wt-sheet-header h3")].find((h) => h.textContent === "Manually Log a Meal");
    check("manual meal sheet header found", !!header);
    const sheet = header ? header.closest(".wt-sheet") : null;
    check("manual meal sheet has Water/Protein/Calories field row", sheet ? !!sheet.querySelector(".wt-field-row") : null, "true");
    check("manual meal sheet has no presets grid", sheet ? !sheet.querySelector(".wt-preset-grid") : null, "true");
    const numberInputs = sheet ? sheet.querySelectorAll('.wt-field-row input[type="number"]') : [];
    check("manual meal sheet Water/Protein/Calories are plain number inputs, not dial-trigger buttons", numberInputs.length, 3);
    check("manual meal sheet has no dial-trigger buttons (v3.40.1 bugfix: no stacked dial popup)", sheet ? !sheet.querySelector(".wt-dial-trigger") : null, "true");
  },
  () => {
    // v3.40.1: typing into Water should NOT open a second stacked wO dial sheet.
    const input = window.document.querySelector('.wt-field-row input[type="number"]');
    check("found Water number input in manual meal sheet", !!input);
    check("typed 24 into Water number input", setInput("0", "24"));
  },
  () => {
    const backdrops = window.document.querySelectorAll(".wt-backdrop");
    check("no second backdrop/dial sheet stacked open after typing a number (v3.40.1 bugfix)", backdrops.length, 1);
    const closeBtn = window.document.querySelector('button[aria-label="Close"]');
    if (closeBtn) fire(closeBtn);
  },
  () => check("no runtime errors after v3.40.0/3.40.1 pass", errors.length, 0),

  // ── v3.41.0: Profile page, reached only via the header profile icon ──
  () => check("nav to Log It! (profile page checks)", nav("Log It!")),
  () => {
    const profileBtn = window.document.querySelector('button[aria-label="Open your profile"]');
    check("header profile icon is a clickable button (was aria-hidden decorative before)", !!profileBtn);
    if (profileBtn) fire(profileBtn);
  },
  () => {
    const title = [...window.document.querySelectorAll(".wt-date-label")].find((el) => el.textContent === "Profile");
    check("Profile page header title found", !!title);
    check("Profile page not reachable via bottom nav (no nav button targets it)", ![...window.document.querySelectorAll(".wt-nav-btn")].some((b) => b.textContent.includes("Profile")));
    check("Full Name field present", window.document.querySelector('input[placeholder="e.g. Sarah M."]') !== null);
    check("Email Address field present", window.document.querySelector('input[type="email"][placeholder="you@example.com"]') !== null);
    check("Mobile Phone Number field present", window.document.querySelector('input[type="tel"]') !== null);
    check("photo upload file input present", window.document.querySelector('input[type="file"][accept="image/*"]') !== null);
    check("Back button present", !!window.document.querySelector('button[aria-label="Back"]'));
  },
  () => check("typed a full name", setInput("e.g. Sarah M.", "Test Tester")),
  () => check("clicked Save on Profile page", clickByText("Save")),
  () => {
    check("profile.fullName persisted to settings", stored().settings.profile.fullName, "Test Tester");
    check("no runtime errors after profile save", errors.length, 0);
  },
  () => {
    const backBtn = window.document.querySelector('button[aria-label="Back"]');
    check("found Back button to leave Profile page", !!backBtn);
    if (backBtn) fire(backBtn);
  },
  () => {
    check("back navigation returns to Log It!", tiles().some((t) => t.startsWith("Water")));
  },
  () => check("no runtime errors after v3.41.0 pass", errors.length, 0),

  // ── v3.41.1: bugfix — header profile photo overflowed its circular clip ──
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-topbanner-profile \{[^}]*\}/);
    check("wt-topbanner-profile clips its contents (overflow:hidden) so a photo can't square-overhang the circle", rule ? rule[0].includes("overflow:hidden") : null, "true");
    const photoRule = cssText.match(/\.wt-topbanner-profile-photo \{[^}]*\}/);
    check("wt-topbanner-profile-photo stays within its box (max-width/max-height:100%)", photoRule ? photoRule[0].includes("max-width:100%") && photoRule[0].includes("max-height:100%") : null, "true");
  },
  () => check("no runtime errors after v3.41.1 pass", errors.length, 0),

  // ── v3.42.0: Today becomes the landing page — Voice Tracker tile, Tracked So Far, nav swap ──
  // Voice Tracker tile was removed from Today again in v3.48.0 (see that section below).
  () => check("nav to Today (v3.42.0 checks)", nav("Today")),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-section-label")].map((el) => el.textContent);
    check("'Today's log' section still present", labels.some((l) => l.toLowerCase() === "today's log"));
  },
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const rule = cssText.match(/\.wt-tracked-row \{[^}]*\}/);
    check("wt-tracked-row has a category-colored left border (border-left)", rule ? rule[0].includes("border-left:3px solid") : null, "true");
  },
  () => check("no runtime errors after v3.42.0 Today-page pass", errors.length, 0),
  () => {
    const navBtns = [...window.document.querySelectorAll(".wt-nav-btn")].map((b) => b.textContent.trim());
    check("nav order is Log It!, Today, Stats, ... (swapped back per v3.42.1)", navBtns[0].includes("Log It!") && navBtns[1].includes("Today"), "true");
  },
  () => check("no runtime errors after v3.42.0 nav-swap pass", errors.length, 0),

  // ── v3.42.1: header drop-shadow removed (suspected WebKit repaint-artifact trigger), Tracked So Far text bumped ──
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const badgeRule = cssText.match(/\.wt-topbanner-badge \{[^}]*\}/);
    check("wt-topbanner-badge no longer has a CSS filter (drop-shadow removed)", badgeRule ? !badgeRule[0].includes("filter:") : null, "true");
    const labelRule = cssText.match(/\.wt-tracked-row-label \{[^}]*\}/);
    check("Tracked row label font bumped to 15px", labelRule ? labelRule[0].includes("font-size:15px") : null, "true");
    const detailRule = cssText.match(/\.wt-tracked-row-detail \{[^}]*\}/);
    check("Tracked row detail font bumped to 14px", detailRule ? detailRule[0].includes("font-size:14px") : null, "true");
    check("Tracked row detail text now tan (var(--ink-inverse)), not muted-gray", detailRule ? detailRule[0].includes("color:var(--ink-inverse)") : null, "true");
  },
  () => check("no runtime errors after v3.42.1 pass", errors.length, 0),

  // ── v3.43.0: Tracked So Far replaced with a compact "Today at a Glance" needs-attention summary ──
  () => check("nav to Today (v3.43.0 checks)", nav("Today")),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-section-label")].map((el) => el.textContent);
    check("'Today at a Glance' section present (renamed from 'Tracked So Far')", labels.includes("Today at a Glance"), "true");
    check("old 'Tracked So Far' label is gone", labels.includes("Tracked So Far"), false);
    const idxGlance = labels.indexOf("Today at a Glance");
    const idxLog = labels.some((l) => l.toLowerCase() === "today's log");
    check("'Today at a Glance' present alongside 'Today's log'", idxGlance >= 0 && idxLog, "true");
  },
  () => {
    const rows = [...window.document.querySelectorAll(".wt-tracked-row")];
    check("Today at a Glance shows at most 4 callout rows", rows.length <= 4, "true");
    // Default seed has 2 supplements due and nothing else logged yet, so it should surface the
    // meds-due callout plus the single most-behind tracker — not one row per tracker.
    check("Today at a Glance surfaces the RX & Supplements due-count callout", rows.some((r) => /RX & Supplements/.test(r.textContent) && /due today/.test(r.textContent)), "true");
    check("Today at a Glance does not list every enabled tracker (no Water/Calories/Sleep/Exercise noise in default seed)", rows.some((r) => /Water|Calories|Sleep|Exercise/.test(r.textContent)), false);
  },
  () => check("no runtime errors after v3.43.0 Today-at-a-Glance pass", errors.length, 0),

  // ── v3.44.0: "To Do Today" removed (Today at a Glance now the only summary), "Voice Tracker" ──
  // renamed "Voice Assistant", header locked (sticky) and its dead space trimmed ──
  () => check("nav to Today (v3.44.0 checks)", nav("Today")),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-section-label")].map((el) => el.textContent);
    check("'To Do Today' section removed from Today page", labels.includes("To Do Today"), false);
    check("'Today at a Glance' still present", labels.includes("Today at a Glance"), "true");
    check("'Today's log' still present", labels.some((l) => l.toLowerCase() === "today's log"));
  },
  () => {
    check("wt-todo-today-sticky / wt-todo-today-scroll classes no longer used", !window.document.querySelector(".wt-todo-today-sticky") && !window.document.querySelector(".wt-todo-today-scroll"), "true");
  },
  // Voice tile presence on Today is checked in the v3.48.0 section below (removed there).
  () => check("no runtime errors after v3.44.0 Today-page pass", errors.length, 0),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const bannerRule = cssText.match(/\.wt-topbanner \{[^}]*\}/);
    check("wt-topbanner is now sticky (locked header, doesn't scroll away)", bannerRule ? bannerRule[0].includes("position:sticky") && bannerRule[0].includes("top:0") : null, "true");
    check("wt-topbanner bottom padding trimmed (was 28px)", bannerRule ? !bannerRule[0].includes("padding:22px 16px 28px") : null, "true");
    const frameRule = cssText.match(/\.wt-frame \{[^}]*\}/);
    check("wt-frame top padding trimmed to bring content up (was 18px)", frameRule ? !frameRule[0].includes("padding:18px 18px 4px") : null, "true");
  },
  () => check("no runtime errors after v3.44.0 header-spacing pass", errors.length, 0),

  // ── v3.44.0: Self-Managed RX — Vitamins & Supplements / RX split, self-managed Treatments ──
  // preserved as its own tile, RX next-due-date editing added (see decision log UX-22/UX-23) ──
  () => check("nav to My Plan (for Self-Managed RX checks)", nav("My Plan")),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-plan-section-label")].map((el) => el.textContent);
    check("'Self-Managed RX' section header present", labels.includes("Self-Managed RX"), "true");
  },
  // v3.51.0 (Track 2): RX & Supplements split into two fully independent trackers. Per the locked
  // migration design, ALL pre-existing combined items (regardless of the old category field) seed
  // the retained RX tracker (settings.rx); the new Supplements tracker (settings.supplements)
  // starts empty. See docs/DECISION-LOG.md TRACK-01.
  () => check("open RX sheet (legacy-item migration check)", clickByText("RX", "button")),
  () => {
    const rows = [...window.document.querySelectorAll(".wt-preset-row")].map((r) => r.textContent);
    check("seeded TestVit (no category field) migrated into RX (all pre-split items seed RX)", rows.some((r) => r.includes("TestVit")), "true");
    check("seeded OverdueMed (no category field) migrated into RX", rows.some((r) => r.includes("OverdueMed")), "true");
  },
  () => check("close RX sheet", clickByAria("Close")),
  () => check("open Supplements sheet (new tracker starts empty)", clickByText("Supplements", "button")),
  () => {
    const rows = [...window.document.querySelectorAll(".wt-preset-row")];
    check("Supplements tracker starts empty post-migration", rows.length, 0);
  },
  () => check("open Add-vitamin form", clickByText("Add vitamin or supplement", "button")),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-field")].map((l) => l.textContent);
    check("vitamin add form has no 'Take every (days)' schedule field", labels.some((l) => l.includes("Take every")), false);
  },
  () => check("fill new vitamin name", setInput("e.g. Vitamin D, Fish Oil", "TestVitamin")),
  () => check("save new vitamin", clickByText("Save", "button")),
  () => {
    const v = supp("TestVitamin");
    check("new vitamin stored in the Supplements tracker (settings.supplements)", !!v, "true");
    check("new vitamin implicitly daily (intervalDays:1) with no schedule prompt", v ? v.intervalDays : null, 1);
  },
  () => check("close Supplements sheet", clickByAria("Close")),
  () => check("open RX sheet", clickByText("RX", "button")),
  () => {
    const rows = [...window.document.querySelectorAll(".wt-preset-row")].map((r) => r.textContent);
    check("new vitamin TestVitamin does NOT appear in RX (separate tracker)", rows.some((r) => r.includes("TestVitamin")), false);
  },
  () => check("open Add-prescription form", clickByText("Add prescription", "button")),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-field")].map((l) => l.textContent);
    check("RX add form keeps the 'Take every (days)' schedule field", labels.some((l) => l.includes("Take every")), "true");
  },
  () => check("fill new RX name", setInput("e.g. Metformin", "TestRx")),
  () => check("set new RX interval to every 3 days", setInput("1", "3")),
  () => check("save new RX item", clickByText("Save", "button")),
  () => {
    const r = rxItem("TestRx");
    check("new RX item stored in settings.rx", !!r, "true");
    check("new RX item keeps its entered interval (3 days)", r ? r.intervalDays : null, 3);
  },
  () => {
    // TestRx has intervalDays:3 and no lastTakenDate/nextDueOverride yet, so DS() treats it as
    // due today (UX-05: never-taken items are due immediately) — its date input should be present.
    const rows = [...window.document.querySelectorAll(".wt-preset-row")];
    const rxRow = rows.find((r) => r.textContent.includes("TestRx"));
    const dateInput = rxRow ? rxRow.querySelector(".wt-treatment-date-input") : null;
    check("TestRx row shows an editable next-due date input", !!dateInput);
    if (dateInput) {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(dateInput, DAYS_AGO(-5));
      dateInput.dispatchEvent(new window.Event("change", { bubbles: true }));
    }
  },
  () => {
    const r = rxItem("TestRx");
    check("editing the date input updates TestRx's nextDueOverride (the capability lost when To Do Today was removed)", r ? r.nextDueOverride : null, DAYS_AGO(-5));
  },
  () => check("no runtime errors after Self-Managed RX pass", errors.length, 0),

  // ── v3.46.0: Log It! tile trims (Weight/Treatments/RX drop their redundant sub-text now that ──
  // the hero number covers it), tighter tile height + bigger inter-tile gap, Today's Log row ──
  // restack (stats under description, actions grouped right), Stats "Subs" removed, new ──
  // "Remaining RX/Treatments" section on Today ──
  // v3.50.0: this block tests full-detail tile sub-text trimming — now Today's tiles (Log It!
  // dropped all sub-text/hero-number content when it went compact).
  () => check("nav to Today (v3.46.0 tile-trim checks)", nav("Today")),
  () => {
    // Seed has no treatments and no low-supply/near-expiry alert yet, so no tile should show a
    // wt-tile-togo row at all right now — Weight's was removed outright, Treatments/RX's only
    // reappear conditionally when there's an actual inventory alert.
    const togoRows = [...window.document.querySelectorAll(".wt-tile-togo")];
    check("no wt-tile-togo rows present with no treatments/alerts yet (Weight/Treatments/RX all trimmed)", togoRows.length, 0);
  },
  () => {
    const weightTile = tiles().find((t) => t.startsWith("Weight"));
    check("Weight tile no longer repeats the goal-difference text a second time", weightTile ? !/to golbs|lbs to go.*to go/.test(weightTile) : null, "true");
    const rxTile = tiles().find((t) => t.startsWith("RX & Supplements"));
    check("RX & Supplements tile no longer shows the old 'of N taken' sub-text", rxTile ? !/of \d+ taken/.test(rxTile) : null, "true");
  },
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const colRule = cssText.match(/\.wt-tracker-col \{[^}]*\}/);
    check("wt-tracker-col vertical padding trimmed (was uniform var(--s4))", colRule ? colRule[0].includes("padding:10px var(--s4)") : null, "true");
  },
  () => check("no runtime errors after v3.46.0 tile-trim pass", errors.length, 0),

  // ── Today's Log row restack ──
  () => check("nav to Today (log row restack checks)", nav("Today")),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const stackRule = cssText.match(/\.wt-log-desc-stack \{[^}]*\}/);
    check("wt-log-desc-stack rule present (stats now stack under description)", stackRule ? stackRule[0].includes("flex-direction:column") : null, "true");
    const actionsRule = cssText.match(/\.wt-log-actions \{[^}]*\}/);
    check("wt-log-actions rule present (edit/delete grouped tight, pushed right)", actionsRule ? actionsRule[0].includes("margin-left:auto") && actionsRule[0].includes("gap:2px") : null, "true");
  },
  () => {
    const row = window.document.querySelector(".wt-log-row");
    const stack = row ? row.querySelector(".wt-log-desc-stack") : null;
    check("a Today's Log row has the new desc-stack wrapper", !!stack);
    const label = stack ? stack.querySelector(".wt-log-label") : null;
    const metrics = stack ? stack.querySelector(".wt-log-metrics") : null;
    check("label sits inside the stack", !!label);
    check("metrics sit inside the same stack, under the label", !!metrics && !!label && label.compareDocumentPosition(metrics) === window.Node.DOCUMENT_POSITION_FOLLOWING, "true");
    const actions = row ? row.querySelector(".wt-log-actions") : null;
    check("row has a single grouped actions wrapper", !!actions);
    check("actions wrapper holds both edit and delete buttons", actions ? actions.querySelectorAll(".wt-icon-btn").length : 0, 2);
  },
  () => check("no runtime errors after log-row-restack pass", errors.length, 0),

  // ── Stats "Subs" removed ──
  () => check("nav to Stats (Subs-removal check)", nav("Stats")),
  () => {
    const segBtns = [...window.document.querySelectorAll(".wt-segment button")].map((b) => b.textContent.trim());
    check("'Subs' button no longer present in Stats chart picker", segBtns.includes("Subs"), false);
  },
  () => check("no runtime errors after Subs-removal pass", errors.length, 0),

  // ── New "Remaining RX/Treatments" Today section, fed from My Plan's system-of-record fields ──
  () => check("nav to My Plan (add a fully-detailed RX + treatment)", nav("My Plan")),
  () => check("open RX sheet (fill full detail)", clickByText("RX", "button")),
  () => check("open Add-prescription form", clickByText("Add prescription", "button")),
  () => check("fill detailed RX name", setInput("e.g. Metformin", "DetailedRx")),
  () => check("fill DetailedRx pharmacy", setInput("e.g. CVS on Main St", "Corner Pharmacy")),
  () => check("toggle inventory tracking on for DetailedRx", clickByAria("Toggle inventory tracking")),
  () => check("set DetailedRx qty low enough to trigger a low-supply alert", setInput("e.g. 30", "2")),
  () => check("set DetailedRx refills remaining", setInput("e.g. 3", "5")),
  () => check("Partner link field appears once pharmacy is filled", setInput("https://...", "https://corner-pharmacy.example.com")),
  () => {
    // Scoped to .wt-modal — the RX PlanSheet underneath may still have its own due-date inputs
    // mounted (e.g. TestRx's), which would otherwise be matched first by a bare type="date" query.
    const el = window.document.querySelector('.wt-modal input[type="date"]');
    check("found DetailedRx expiration date input", !!el);
    if (el) {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, DAYS_AGO(-90));
      el.dispatchEvent(new window.Event("input", { bubbles: true }));
    }
  },
  () => check("save DetailedRx", clickByText("Save", "button")),
  () => {
    const r = rxItem("DetailedRx");
    check("DetailedRx stored with pharmacy", r ? r.pharmacy : null, "Corner Pharmacy");
    check("DetailedRx stored with refillsRemaining", r ? r.refillsRemaining : null, 5);
    check("DetailedRx stored with trackInventory on", r ? r.trackInventory : null, "true");
    check("DetailedRx stored with partnerLink even with no logo uploaded", r ? r.partnerLink : null, "https://corner-pharmacy.example.com");
    check("DetailedRx has no partnerLogoDataUri (none uploaded)", r ? r.partnerLogoDataUri : "MISSING", null);
  },
  () => check("close RX sheet", clickByAria("Close")),
  () => check("open Self-Managed Treatments sheet", clickByText("Self-Managed Treatments", "button")),
  () => check("open Add-a-treatment form", clickByText("Add a treatment", "button")),
  () => check("fill detailed treatment name", setInput("e.g. B12 Shot, IV Drip, Allergy Shot", "DetailedTreatment")),
  () => check("fill DetailedTreatment provider", setInput("e.g. Austin Drip Lounge", "Wellness Clinic")),
  () => check("toggle inventory tracking on for DetailedTreatment", clickByAria("Toggle inventory tracking")),
  () => check("set DetailedTreatment qty remaining", setInput("e.g. 12", "4")),
  () => check("save DetailedTreatment", clickByText("Save", "button")),
  () => {
    const tr = stored().settings.treatments.find((t) => t.name === "DetailedTreatment");
    check("DetailedTreatment stored with provider", tr ? tr.provider : null, "Wellness Clinic");
    check("DetailedTreatment stored with trackInventory on", tr ? tr.trackInventory : null, "true");
  },
  () => check("close Self-Managed Treatments sheet", clickByAria("Close")),
  () => check("no runtime errors after detailed-item setup pass", errors.length, 0),

  // ── v3.49.0: "Remaining RX/Treatments" retired from Today; new "RX" page ("SCRIPTS FOR:")
  // takes over and expands it into three full groups — Treatments / Prescriptions / Vitamins &
  // Supplements — listing every item (not just inventory-tracked ones), plus partner-branded
  // cards (logo + link) for items with both a provider/pharmacy and a partner logo set ──
  () => check("nav to Today (Remaining RX/Treatments retired check)", nav("Today")),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-section-label, .wt-section-label-lg")].map((el) => el.textContent);
    check("'Remaining RX/Treatments' no longer present on Today (moved to the RX page)", labels.includes("Remaining RX/Treatments"), false);
  },
  () => check("nav button 'RX' present in bottom nav", [...window.document.querySelectorAll(".wt-nav-btn")].some((b) => b.textContent.trim() === "RX"), "true"),
  () => check("nav to RX page", nav("RX")),
  () => check("RX page title starts with 'SCRIPTS FOR:'", (headerText() || "").startsWith("SCRIPTS FOR:"), "true"),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-section-label-lg")].map((el) => el.textContent);
    check("RX page has 'Treatments' section", labels.includes("Treatments"), "true");
    check("RX page has 'Prescriptions' section", labels.includes("Prescriptions"), "true");
    check("RX page has 'Vitamins & Supplements' section", labels.includes("Vitamins & Supplements"), "true");
    const idxT = labels.indexOf("Treatments"), idxP = labels.indexOf("Prescriptions"), idxV = labels.indexOf("Vitamins & Supplements");
    check("sections ordered Treatments -> Prescriptions -> Vitamins & Supplements", idxT >= 0 && idxP > idxT && idxV > idxP, "true");
  },
  () => {
    const cards = [...window.document.querySelectorAll(".wt-card, .wt-regimen-card")];
    const rxCard = cards.find((c) => c.textContent.includes("DetailedRx"));
    check("DetailedRx card present on RX page", !!rxCard);
    check("DetailedRx card shows where it was filled", rxCard ? rxCard.textContent.includes("Filled at Corner Pharmacy") : null, "true");
    check("DetailedRx card shows qty remaining", rxCard ? rxCard.textContent.includes("2 remaining") : null, "true");
    check("DetailedRx card shows refills remaining", rxCard ? rxCard.textContent.includes("5 refills left") : null, "true");
    check("DetailedRx card shows a renew-by date", rxCard ? /renew by/.test(rxCard.textContent) : null, "true");
    check("DetailedRx card shows the low-supply alert (PROD-04)", rxCard ? /left$/.test(rxCard.textContent.trim()) || /2 left/.test(rxCard.textContent) : null, "true");
    const trCard = cards.find((c) => c.textContent.includes("DetailedTreatment"));
    check("DetailedTreatment card present on RX page", !!trCard);
    check("DetailedTreatment card shows where it's from", trCard ? trCard.textContent.includes("From Wellness Clinic") : null, "true");
    check("DetailedTreatment card shows qty remaining", trCard ? trCard.textContent.includes("4 remaining") : null, "true");
  },
  () => {
    // Items with no inventory tracking still appear on the RX page (a real scope increase over
    // the old Today section, which only listed trackInventory items) — TestVit (no inventory
    // tracking in the seed, migrated into RX per v3.51.0 Track 2) must show up in Prescriptions.
    const cards = [...window.document.querySelectorAll(".wt-card, .wt-regimen-card")];
    check("non-inventory-tracked item (TestVit) still listed on the RX page", cards.some((c) => c.textContent.includes("TestVit")));
  },
  () => {
    // Reload-persistence regression check (v3.49.0 normalizer bug fix): SeedRx/SeedTreatment were
    // seeded directly into localStorage with category/pharmacy/refillsRemaining/provider/partner
    // fields already set, as if saved in a prior session. Their surviving the boot-time migrate()
    // pass and rendering correctly here proves US()/normalizeTreatments() no longer strip them.
    const seedRx = rxItem("SeedRx");
    check("SeedRx migrated into settings.rx (pre-split item with category:'rx' seed)", !!seedRx, "true");
    check("SeedRx pharmacy survived boot-time migrate()", seedRx ? seedRx.pharmacy : null, "Seed Pharmacy");
    check("SeedRx refillsRemaining survived boot-time migrate()", seedRx ? seedRx.refillsRemaining : null, 2);
    check("SeedRx partnerLogoDataUri survived boot-time migrate()", seedRx ? seedRx.partnerLogoDataUri : null, "data:image/jpeg;base64,SEEDRXLOGO");
    check("SeedRx partnerLink survived boot-time migrate()", seedRx ? seedRx.partnerLink : null, "https://example.com/seedrx");
    const seedTr = stored().settings.treatments.find((t) => t.name === "SeedTreatment");
    check("SeedTreatment provider survived boot-time migrate()", seedTr ? seedTr.provider : null, "Seed Provider");
    check("SeedTreatment partnerLogoDataUri survived boot-time migrate()", seedTr ? seedTr.partnerLogoDataUri : null, "data:image/jpeg;base64,SEEDTREATMENTLOGO");
    check("SeedTreatment partnerLink survived boot-time migrate()", seedTr ? seedTr.partnerLink : null, "https://example.com/seedtreatment");
    const cards = [...window.document.querySelectorAll(".wt-card, .wt-regimen-card")];
    const seedRxCard = cards.find((c) => c.textContent.includes("SeedRx"));
    check("SeedRx renders as a partner-branded card (has a logo image and outbound link)", seedRxCard ? !!seedRxCard.querySelector("img") && !!seedRxCard.querySelector('a[href="https://example.com/seedrx"]') : null, "true");
    const seedTrCard = cards.find((c) => c.textContent.includes("SeedTreatment"));
    check("SeedTreatment renders as a partner-branded card (has a logo image and outbound link)", seedTrCard ? !!seedTrCard.querySelector("img") && !!seedTrCard.querySelector('a[href="https://example.com/seedtreatment"]') : null, "true");
  },
  () => check("no runtime errors after RX page pass", errors.length, 0),

  // ── v3.47.0: Sleep→Weight gap fixed to match the rest, RX & Supplements→presets-button gap ──
  // added, "RX & Vitamins" renamed "RX & Supplements", Remaining RX/Treatments gets its own card ──
  // border, Today's Log rows tightened ──
  () => check("nav to Log It! (v3.47.0 spacing/rename checks)", nav("Log It!")),
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const seamRule = cssText.match(/\.wt-trackers-grid \+ \.wt-trackers-grid \{[^}]*\}/);
    check("Sleep→Weight seam now has its own margin-top override (was relying on default 6px+8px=14px, now matches the 24px gap used elsewhere)", seamRule ? seamRule[0].includes("margin-top:18px") : null, "true");
    const btnSeamRule = cssText.match(/\.wt-trackers-grid \+ \.wt-action-btns \{[^}]*\}/);
    check("RX & Supplements→presets-button seam also gets the matching margin-top override", btnSeamRule ? btnSeamRule[0].includes("margin-top:18px") : null, "true");
  },
  () => {
    // v3.51.0 (Track 2): Log It!'s compact grid split the combined tile into two — "RX" and
    // "Supplements" — so the old combined "RX & Supplements" label no longer appears there.
    const rxTile = tiles().find((t) => t === "RX");
    check("Log It! has a standalone 'RX' tile (split from the old combined tile)", !!rxTile);
    const supTile = tiles().find((t) => t === "Supplements");
    check("Log It! has a standalone 'Supplements' tile", !!supTile);
    const oldName = tiles().find((t) => t.startsWith("RX & Vitamins"));
    check("old 'RX & Vitamins' tile name is gone", !!oldName, false);
  },
  () => check("no runtime errors after v3.47.0 Log It! pass", errors.length, 0),
  () => check("nav to My Plan (rename check)", nav("My Plan")),
  () => {
    // v3.51.0 (Track 2): the combined "RX & Supplements" What-I'm-Tracking row split into two
    // independent rows.
    const cardTitles = [...window.document.querySelectorAll(".wt-plan-card-title")].map((el) => el.textContent);
    check("My Plan has a standalone 'RX' tracker card", cardTitles.includes("RX"), "true");
    check("My Plan has a standalone 'Supplements' tracker card", cardTitles.includes("Supplements"), "true");
    check("My Plan tracker card old combined name gone", cardTitles.includes("RX & Vitamins"), false);
  },
  () => check("no runtime errors after My Plan rename check", errors.length, 0),

  // ── RX page sections each get their own section-wide card border (carried over from the ──
  // retired Today section's styling, now per-group on the RX page) ──
  // Route through Today first: from My Plan, clickByText("RX") would instead hit My Plan's own
  // "RX" RegimenSummaryCard button (same literal text, earlier in document order).
  () => check("nav to Today (before RX, to avoid My Plan's own 'RX' button)", nav("Today")),
  () => check("nav to RX (section card-border check)", nav("RX")),
  () => {
    const labelEl = [...window.document.querySelectorAll(".wt-section-label-lg")].find((el) => el.textContent === "Prescriptions");
    check("'Prescriptions' label found", !!labelEl);
    const outerCard = labelEl ? labelEl.closest(".wt-card") : null;
    check("the label sits inside its own wt-card wrapper (section-wide bubble border)", !!outerCard);
    const rxItemCard = outerCard ? [...outerCard.querySelectorAll(".wt-card")].find((c) => c.textContent.includes("DetailedRx")) : null;
    check("individual item cards (e.g. DetailedRx) nest inside that outer section card", !!rxItemCard);
  },
  () => check("no runtime errors after RX section card-border check", errors.length, 0),

  // ── Today's Log rows tightened (less wasted space under the stacked amounts) ──
  () => {
    const cssText = window.document.querySelector("style").textContent;
    const rowRule = cssText.match(/\.wt-log-row \{[^}]*\}/);
    check("wt-log-row padding tightened (was 9px 10px)", rowRule ? rowRule[0].includes("padding:7px 10px") : null, "true");
    const listRule = cssText.match(/\.wt-log-list \{[^}]*\}/);
    check("wt-log-list row-to-row gap tightened (was 6px)", listRule ? listRule[0].includes("gap:4px") : null, "true");
    const stackRule = cssText.match(/\.wt-log-desc-stack \{[^}]*\}/);
    check("wt-log-desc-stack internal gap tightened (was 2px)", stackRule ? stackRule[0].includes("gap:1px") : null, "true");
  },
  () => check("no runtime errors after Today's-Log-tightening check", errors.length, 0),

  // ── v3.48.0: Voice Assistant tile removed from Today; Log It!'s 8 tiles duplicated onto
  // Today (between Remaining RX/Treatments and Today's log, respecting My Plan's per-tracker
  // toggles, without re-adding the presets/manual-log action buttons); "Prior Days" moved to
  // Stats, renamed "Edit Prior Days Logs", bigger text/icon, in its own clickable tile ──
  () => check("nav to Today (v3.48.0 checks)", nav("Today")),
  () => {
    check("Voice Entry tile removed from Today (renamed from Voice Assistant, class renamed .wt-voice-tile -> .wt-feature-tile.gold in v3.50.0)", !window.document.querySelector(".wt-feature-tile.gold"), "true");
  },
  () => {
    const labels = [...window.document.querySelectorAll(".wt-section-label")].map((el) => el.textContent);
    const idxGlance = labels.indexOf("Today at a Glance"), idxLog = labels.findIndex((l) => l.toLowerCase() === "today's log");
    // v3.49.0: Remaining RX/Treatments retired from Today (moved to the RX page) — Today's order
    // is now Today at a Glance -> duplicated tile grid -> Today's log.
    check("Today at a Glance sits above Today's log with the duplicated tile grid between them", idxGlance >= 0 && idxLog > idxGlance, "true");
    const t = tiles();
    check("Today shows all 8 Log It! tiles (duplicated grid, current toggle state all-on)", t.length, 8);
    check("Today's duplicated grid includes Water", t.some((x) => x.startsWith("Water")), "true");
    check("Today's duplicated grid includes RX & Supplements", t.some((x) => x.startsWith("RX & Supplements")), "true");
    check("duplicated grid does not also duplicate Log It!'s presets/manual-log action buttons", !window.document.querySelector(".wt-action-btns"), "true");
  },
  () => {
    const waterTile = [...window.document.querySelectorAll(".wt-tracker-col")].find((x) => x.textContent.includes("Water"));
    check("found Today's duplicated Water tile", !!waterTile);
    if (waterTile) fire(waterTile);
  },
  () => {
    const dialOpen = !!window.document.querySelector(".wt-sheet, .wt-backdrop");
    check("tapping Today's duplicated Water tile opens the same entry sheet Log It!'s Water tile opens", dialOpen, "true");
  },
  () => check("close the sheet opened from Today's duplicated grid", clickByAria("Close")),
  () => check("nav to My Plan (toggle Water off, to verify Today's duplicated grid honors the toggle)", nav("My Plan")),
  () => {
    const waterToggle = window.document.querySelector('[aria-label="Toggle Water on Log page"]');
    check("found Water toggle on My Plan", !!waterToggle);
    if (waterToggle) fire(waterToggle);
  },
  () => check("nav to Today (verify Water tile hidden)", nav("Today")),
  () => {
    check("Water tile no longer shown on Today's duplicated grid once toggled off on My Plan", tiles().some((t) => t.startsWith("Water")), false);
  },
  () => check("nav to My Plan (restore Water toggle)", nav("My Plan")),
  () => {
    const waterToggle = window.document.querySelector('[aria-label="Toggle Water on Log page"]');
    if (waterToggle) fire(waterToggle);
  },
  () => check("nav to Today (Water tile restored)", nav("Today")),
  () => {
    check("Water tile restored on Today's duplicated grid", tiles().some((t) => t.startsWith("Water")), "true");
  },
  () => check("no runtime errors after v3.48.0 Today-page pass", errors.length, 0),
  () => check("nav to Stats (Prior Days relocation checks)", nav("Stats")),
  () => {
    const labels = [...window.document.querySelectorAll(".wt-section-label, .wt-section-label-strong")].map((el) => el.textContent);
    const idxHealth = labels.indexOf("Health Summary");
    check("'Health Summary' section still present on Stats", idxHealth >= 0, "true");
  },
  () => {
    const tile = window.document.querySelector('[aria-label="Edit Prior Days Logs"]');
    check("'Edit Prior Days Logs' tile found on Stats", !!tile);
    const span = tile ? [...tile.querySelectorAll("span")].find((s) => s.textContent === "Edit Prior Days Logs") : null;
    check("tile text reads 'Edit Prior Days Logs'", !!span);
    check("label font size bumped up (20px, bigger than Today's old 13px label)", span ? span.style.fontSize : null, "20px");
    const svg = tile ? tile.querySelector("svg") : null;
    check("calendar icon present", !!svg);
    check("calendar icon size bumped up (32, bigger than Today's old 24)", svg ? svg.getAttribute("width") : null, "32");
    const healthSummaryLabel = [...window.document.querySelectorAll(".wt-section-label-strong")].find((el) => el.textContent === "Health Summary");
    check("'Edit Prior Days Logs' tile sits before 'Health Summary' in document order", tile && healthSummaryLabel ? !!(tile.compareDocumentPosition(healthSummaryLabel) & window.Node.DOCUMENT_POSITION_FOLLOWING) : null, "true");
  },
  () => check("tap the Edit Prior Days Logs tile", clickByAria("Edit Prior Days Logs")),
  () => {
    const sheet = [...window.document.querySelectorAll(".wt-sheet")].find((s) => s.textContent.includes("Past days") || s.textContent.includes("Enter Missed Items"));
    check("tapping the tile opens the past-days list", !!sheet);
  },
  () => check("close the past-days sheet", clickByAria("Close")),
  () => check("no runtime errors after v3.48.0 Stats-page pass", errors.length, 0),
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
