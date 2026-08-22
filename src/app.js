import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createPortal } from "react-dom";

// recharts is pinned to 2.15.4 (see docs/DECISION-LOG.md ARCH-OPEN-01) to
// match the version vendored in the deployed bundle.
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Bar,
  Cell,
  Line,
  LineChart,
  BarChart,
} from "recharts";

import {
  AlertCircle,
  BarChart3,
  Battery,
  Bed,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Cloud,
  Download,
  Droplet,
  Dumbbell,
  Flame,
  Mail,
  Moon,
  Pencil,
  Pill,
  Plus,
  Settings,
  SlidersVertical,
  Sparkles,
  Syringe,
  Trash2,
  User,
  Users,
  Weight,
  X as XIcon,
  Zap,
} from "lucide-react";

    function tS(e) {
        let t = (e + "=".repeat((4 - e.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/"),
            n = atob(t),
            r = new Uint8Array(n.length);
        for (let e = 0; e < n.length; e++) r[e] = n.charCodeAt(e);
        return r
    }
    async function nS() {
        return "serviceWorker" in navigator ? navigator.serviceWorker.register("./service-worker.js") : null
    }

    function rS() {
        return (typeof window < "u" && window.WATER_TRACKER_CONFIG && window.WATER_TRACKER_CONFIG.apiBase || "").replace(/\/$/, "")
    }
    async function aS(e, t, n, r, a) {
        let o = rS();
        if (!o) throw new Error("Push server not configured yet — set apiBase in config.js.");
        if (!("Notification" in window)) throw new Error("Notifications are not supported in this browser.");
        let i = await nS();
        if (!i) throw new Error("Service workers are not supported in this browser.");
        if ("granted" !== await Notification.requestPermission()) throw new Error("Notification permission was not granted.");
        let l = await async function() {
            let e = rS();
            if (!e) throw new Error("Push server not configured yet — set apiBase in config.js.");
            let t = await fetch(`${e}/api/vapid-public-key`);
            if (!t.ok) throw new Error("Could not reach the push server.");
            return (await t.json()).publicKey
        }(), u = await i.pushManager.getSubscription();
        u || (u = await i.pushManager.subscribe({
            userVisibleOnly: !0,
            applicationServerKey: tS(l)
        }));
        let s = Intl.DateTimeFormat().resolvedOptions().timeZone,
            c = await fetch(`${o}/api/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: e || void 0,
                    subscription: u.toJSON(),
                    schedule: t,
                    bedtime: n,
                    supplementReminder: r,
                    treatmentReminder: a,
                    timezone: s
                })
            });
        if (!c.ok) throw new Error("Could not register with the push server.");
        return (await c.json()).id
    }
    async function oS(e, t, n, r, a) {
        if (!e) return;
        let o = rS();
        if (!o) return;
        let i = await navigator.serviceWorker.getRegistration(),
            l = i && await i.pushManager.getSubscription();
        if (!l) return;
        let u = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await fetch(`${o}/api/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e,
                subscription: l.toJSON(),
                schedule: t,
                bedtime: n,
                supplementReminder: r,
                treatmentReminder: a,
                timezone: u
            })
        })
    }
    async function iS(e) {
        let t = rS();
        try {
            let e = await navigator.serviceWorker.getRegistration();
            if (e) {
                let t = await e.pushManager.getSubscription();
                t && await t.unsubscribe()
            }
        } catch {}
        e && t && await fetch(`${t}/api/subscribe`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e
            })
        }).catch(() => {})
    }
    async function lS(e, t) {
        let n = rS();
        if (!n) throw new Error("Account server not configured yet.");
        let r = await fetch(`${n}/api/account/backup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${e}`
            },
            body: JSON.stringify({
                data: t
            })
        });
        if (!r.ok) throw new Error("Could not save to your account.");
        return r.json()
    }
    async function uS(e, t) {
        let n = rS();
        !n || !e || await fetch(`${n}/api/progress`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e,
                ...t
            })
        }).catch(() => {})
    }
    async function sS(e, t) {
        let n = rS();
        if (!n) throw new Error("Backup server not configured yet.");
        let r = await fetch(`${n}/api/backup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: e,
                data: t
            })
        });
        if (!r.ok) throw new Error("Could not save backup — try again in a moment.");
        return r.json()
    }

    function wtDeviceId() {
        try {
            let e = localStorage.getItem("wt-device-id");
            return e || (e = crypto.randomUUID(), localStorage.setItem("wt-device-id", e), e)
        } catch {
            return null
        }
    }
    async function wtActivityPing() {
        let e = wtDeviceId(),
            n = rS();
        !n || !e || await fetch(`${n}/api/progress`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e
            })
        }).catch(() => {})
    }
    var cS = "water-tracker-data",
        fS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        dS = "#0B2038",
        pS = "#1B4F72",
        mS = "#2E86C1",
        hS = "#2F8F5B",
        gS = "#F0923B",
        yS = "#6C63B5",
        vS = "#D5E1EC",
        bS = "#C1523E",
        wS = "#5C7085",
        wD = "#9FB0C4",
        wI = "#FFF6DB",
        xS = "3.39.1",
        SCHEMA_VERSION = 2,
        ES = {
            logs: {},
            activeSleepSession: null,
            settings: {
                goalOz: 64,
                goalProtein: 100,
                goalCalories: 2e3,
                goalSleepHours: 8,
                goalWeight: 0,
                goalExerciseMinutes: 0,
                showWater: !0,
                showProtein: !0,
                showCalories: !0,
                showSleep: !0,
                showWeight: !0,
                showSupplements: !0,
                showTreatments: !0,
                showExercise: !0,
                feedbackWatching: !1,
                testerName: "",
                cloudBackup: {
                    enabled: !1,
                    code: null,
                    lastSavedAt: null
                },
                account: {
                    email: null,
                    sessionToken: null
                },
                presets: [],
                supplements: [],
                treatments: [],
                reminders: {
                    inApp: {
                        enabled: !1,
                        intervalMin: 60
                    },
                    calendar: {
                        startTime: "08:00",
                        endTime: "20:00",
                        intervalHours: 2
                    },
                    push: {
                        subscribed: !1,
                        id: null
                    },
                    bedtime: {
                        enabled: !1,
                        time: "22:00"
                    },
                    supplementReminder: {
                        enabled: !1,
                        time: "10:00"
                    },
                    treatmentReminder: {
                        enabled: !1,
                        time: "09:00"
                    }
                }
            }
        };

    function kS(e) {
        return Number(e && e.oz || 0)
    }

    function SS(e) {
        return Number(e && e.grams || 0)
    }

    function OS(e) {
        return Number(e && e.calories || 0)
    }

    function PS(e) {
        return !(!e || "sleep" !== e.type)
    }

    function CS(e) {
        return PS(e) && Number(e.hours) || 0
    }

    function jS(e) {
        return !(!e || "weight" !== e.type)
    }

    function NS(e) {
        return !(!e || "supplement" !== e.type)
    }

    function TS(e) {
        if (!e) return null;
        if (e.nextDueOverride) return e.nextDueOverride;
        if (!e.intervalDays || e.intervalDays <= 0 || !e.lastTakenDate) return null;
        let t = MS(e.lastTakenDate);
        return t ? HS(VS(t, e.intervalDays)) : null
    }

    function AS(e, t) {
        let n = TS(e);
        if (!n) return {
            state: "none",
            due: null,
            daysAway: null
        };
        let r = _S(t, n);
        return r < 0 ? {
            state: "overdue",
            due: n,
            daysAway: r
        } : 0 === r ? {
            state: "today",
            due: n,
            daysAway: 0
        } : {
            state: "upcoming",
            due: n,
            daysAway: r
        }
    }

    function MS(e) {
        if (!e || "string" != typeof e) return null;
        let [t, n, r] = e.split("-").map(Number);
        if (!t || !n || !r) return null;
        let a = new Date(t, n - 1, r);
        return a.setHours(0, 0, 0, 0), a
    }

    function _S(e, t) {
        let n = MS(e),
            r = MS(t);
        return n && r ? Math.round((r - n) / 864e5) : null
    }

    function DS(e, t) {
        return e.intervalDays > 0 && !e.lastTakenDate && !e.nextDueOverride ? {
            state: "today",
            due: t,
            daysAway: 0
        } : AS(e, t)
    }

    function zS(e) {
        return !(!e || "treatment" !== e.type)
    }

    function IS(e) {
        return !(!e || "exercise" !== e.type)
    }

    function LS(e, t) {
        let n = t - e;
        return n < 0 && (n += 1440), Math.round(n / 60 * 10) / 10
    }
    var RS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    function BS(e) {
        return !e || "sleep" === e.type || "weight" === e.type || "supplement" === e.type || "treatment" === e.type || "exercise" === e.type || void 0 === e.type && void 0 !== e.oz && void 0 !== e.grams && void 0 !== e.calories ? e : {
            id: e.id,
            time: e.time,
            timeMinutes: e.timeMinutes,
            label: e.label,
            oz: "protein" === e.type || "calories" === e.type ? 0 : Number(e.oz) || 0,
            grams: "protein" === e.type && Number(e.grams) || 0,
            calories: "calories" === e.type && Number(e.calories) || 0
        }
    }

    function $S(e) {
        let t = {};
        return Object.keys(e || {}).forEach(n => {
            t[n] = (e[n] || []).map(BS)
        }), t
    }

    function FS(e) {
        let t = e && e.presets || [],
            n = e && e.proteinPresets || [],
            r = e && e.caloriePresets || [];
        return t.every(e => "grams" in e && "calories" in e) && 0 === n.length && 0 === r.length ? t : [...t.map(e => "grams" in e && "calories" in e ? e : {
            id: `w-${e.id}`,
            name: e.name,
            oz: Number(e.oz) || 0,
            grams: 0,
            calories: 0
        }), ...n.map(e => ({
            id: `p-${e.id}`,
            name: e.name,
            oz: 0,
            grams: Number(e.grams) || 0,
            calories: 0
        })), ...r.map(e => ({
            id: `c-${e.id}`,
            name: e.name,
            oz: 0,
            grams: 0,
            calories: Number(e.calories) || 0
        }))]
    }

    function US(e) {
        return (e && Array.isArray(e.supplements) ? e.supplements : []).map(e => ({
            id: e.id,
            name: e.name,
            intervalDays: "number" == typeof e.intervalDays ? e.intervalDays : 1,
            lastTakenDate: e.lastTakenDate || null,
            nextDueOverride: e.nextDueOverride || null,
            trackInventory: !!e.trackInventory,
            qtyRemaining: e.qtyRemaining || 0,
            expirationDate: e.expirationDate || null
        }))
    }

    function normalizeTreatments(e) {
        return (Array.isArray(e) ? e : []).map(e => ({
            id: e.id,
            name: e.name,
            intervalDays: "number" == typeof e.intervalDays ? e.intervalDays : 1,
            lastTakenDate: e.lastTakenDate || null,
            nextDueOverride: e.nextDueOverride || null,
            trackInventory: !!e.trackInventory,
            qtyRemaining: e.qtyRemaining || 0,
            expirationDate: e.expirationDate || null
        }))
    }

    function migrateSettingsShape(e) {
        return {
            ...e,
            presets: FS(e),
            supplements: US(e),
            treatments: normalizeTreatments(e && e.treatments)
        }
    }

    function deepMergeDefaults(e, t) {
        if (Array.isArray(e)) return Array.isArray(t) ? t : e;
        if (null !== e && "object" == typeof e) {
            let n = {};
            for (let r of Object.keys(e)) n[r] = deepMergeDefaults(e[r], t && "object" == typeof t ? t[r] : void 0);
            return n
        }
        return "number" == typeof e ? "number" == typeof t && t ? t : e : "boolean" == typeof e ? "boolean" == typeof t ? t : e : "string" == typeof e ? "string" == typeof t ? t : e : void 0 !== t ? t : e
    }

    function migrate(e) {
        if (!e || "object" != typeof e) return JSON.parse(JSON.stringify(ES));
        let t = migrateSettingsShape(e.settings || {});
        return {
            logs: $S(e.logs || {}),
            activeSleepSession: e.activeSleepSession || null,
            settings: deepMergeDefaults(ES.settings, t)
        }
    }
    var WS = e => String(e).padStart(2, "0");

    function HS(e) {
        return `${e.getFullYear()}-${WS(e.getMonth()+1)}-${WS(e.getDate())}`
    }

    function qS(e) {
        let t = new Date(e),
            n = t.getDay(),
            r = (0 === n ? -6 : 1) - n;
        return t.setDate(t.getDate() + r), t.setHours(0, 0, 0, 0), t
    }

    function VS(e, t) {
        let n = new Date(e);
        return n.setDate(n.getDate() + t), n
    }

    function GS(e) {
        return new Date(e.getFullYear(), e.getMonth(), 1)
    }

    function XS(e) {
        return new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate()
    }

    function YS(e) {
        return e.toLocaleDateString(void 0, {
            month: "short",
            day: "numeric"
        })
    }

    function KS(e, t, n) {
        let r = {};
        return (t || []).forEach(e => {
            let t = "string" == typeof e ? e : e.name,
                n = "string" == typeof e ? 1 : e.qty || 1;
            r[t] = (r[t] || 0) - n
        }), (n || []).forEach(e => {
            let t = "string" == typeof e ? e : e.name,
                n = "string" == typeof e ? 1 : e.qty || 1;
            r[t] = (r[t] || 0) + n
        }), e.map(e => {
            if (!e.trackInventory) return e;
            let t = r[e.name] || 0;
            return 0 === t ? e : {
                ...e,
                qtyRemaining: Math.max(0, (e.qtyRemaining || 0) - t)
            }
        })
    }

    function QS(e) {
        if (!e.trackInventory) return null;
        let t = (e.qtyRemaining || 0) <= 3,
            n = e.expirationDate ? _S(HS(new Date), e.expirationDate) : null,
            r = null !== n && n >= 0 && n <= 7;
        return null !== n && n < 0 ? "Expired" : t && r ? `${e.qtyRemaining} left · expires in ${n}d` : t ? `${e.qtyRemaining} left` : r ? `Expires in ${n}d` : null
    }

    function ZS(e, t, n, r, a) {
        let o = (360 * (t > 0 ? Math.max(0, Math.min(1, e / t)) : 0) - 90) * (Math.PI / 180);
        return {
            x: n + a * Math.cos(o),
            y: r + a * Math.sin(o)
        }
    }

    function JS() {
        let e = new Date;
        return `${WS(e.getHours())}:${WS(e.getMinutes())}`
    }

    function eO(e) {
        let t = Math.floor(e / 60) % 24,
            n = e % 60;
        return `${WS(t)}:${WS(n)}`
    }

    function tO(e) {
        let t = Math.floor(e / 60) % 24,
            n = t >= 12 ? "PM" : "AM";
        return `${t%12==0?12:t%12}:${WS(e%60)} ${n}`
    }

    function nO(e) {
        let [t, n] = e.split(":").map(Number);
        return 60 * t + n
    }

    function rO(e) {
        if ("number" == typeof e.timeMinutes) return e.timeMinutes;
        let t = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(e.time || "");
        if (!t) return 0;
        let n = Number(t[1]) % 12;
        return /pm/i.test(t[3]) && (n += 12), 60 * n + Number(t[2])
    }

    function aO(e) {
        return e.toLocaleDateString(void 0, {
            month: "long",
            year: "numeric"
        })
    }

    function oO(e, t, n) {
        let r = new Blob([n], {
                type: t
            }),
            a = URL.createObjectURL(r),
            o = document.createElement("a");
        o.href = a, o.download = e, document.body.appendChild(o), o.click(), document.body.removeChild(o), URL.revokeObjectURL(a)
    }
    var iO = "\n@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');\n@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&display=swap');\n\n:root {\n  /* v3.34.0 design tokens (UX-12), installed globally rather than on .wt-root so they also\n     reach the app's portaled sheets/modals (UX-11), which live outside .wt-root's subtree and\n     previously had no value at all for the .wt-root-scoped variables below.\n     Merge note: --ink, --muted, and --success here differ from the --ink/--muted/--success\n     declared on .wt-root further down. That's not an oversight — CSS custom-property\n     inheritance resolves from the nearest ancestor that sets the property, so .wt-root's own\n     values keep winning for everything already inside .wt-root; nothing existing changes\n     appearance. These :root values take effect only outside .wt-root. */\n  --bg:#0B0F14; --surface-dark:#151A21; --surface:#FFFFFF; --surface-2:#F1F4F8; --hairline:#232A33; --hairline-bright:#5A7390;\n  --ink:#0B0F14; --ink-inverse:#FFF6DB; --muted:#8A97A6; --muted-dark:#9FB0C4;\n  --accent:#4C9AFF; --accent-chip:#16273D;\n  --water:#2F80ED; --water-chip:#16273D;\n  --protein:#27AE60; --protein-chip:#14301F;\n  --calories:#E8823A; --calories-chip:#34220F;\n  --sleep:#7B61FF; --sleep-chip:#211C3A;\n  --weight:#16A394; --weight-chip:#0F2B28;\n  --exercise:#E85D9E; --exercise-chip:#331424;\n  --treatment:#16A394; --treatment-chip:#0F2B28;\n  --meds:#F2A93B; --meds-chip:#33270E;\n  --alert:#FF6B5E; --alert-chip:#2E1614;\n  --success:#27AE60;\n  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s6:24px; --s8:32px;\n  --radius:16px; --touch:48px; --nav-h:64px;\n  --z-nav:30; --z-scrim:40; --z-sheet:50;\n}\n\n:where(button, input, select, textarea) { color:inherit; font:inherit; }\n.wt-root, .wt-root * { box-sizing: border-box; }\n.wt-root {\n  --ink:#0B2038; --deep:#1B4F72; --teal:#2E86C1; --teal-light:#8AC4E8;\n  --mist:#DCEAF5; --citrus:#E3A83B; --success:#2F8F5B; --light-green:#8DDD9B; --orange:#F0923B; --paper:#F2F5F8; --page-bg:var(--bg); --line:#D5E1EC;\n  --danger:#C1523E; --muted:#5C7085;\n  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\n  background:var(--page-bg); color:var(--ink-inverse); min-height:100vh; position:relative;\n  padding-bottom:calc(var(--nav-h) + env(safe-area-inset-bottom, 0px));\n}\n.wt-root :focus-visible { outline:2px solid var(--teal); outline-offset:2px; }\n@media (prefers-reduced-motion: reduce) {\n  .wt-root * { animation:none !important; transition:none !important; }\n}\n\n.wt-topbanner { position:relative; z-index:250; background:var(--page-bg); padding:22px 16px 28px; overflow:hidden; }\n.wt-topbanner-inner { display:flex; align-items:center; justify-content:center; gap:10px; position:relative; z-index:1; }\n.wt-topbanner-badge { width:70px; height:70px; flex-shrink:0; filter:drop-shadow(0 4px 10px rgba(4,40,54,.45)); }\n.wt-topbanner-badge img { width:100%; height:100%; object-fit:contain; }\n.wt-topbanner-text { display:flex; flex-direction:column; align-items:flex-start; line-height:1.18; }\n.wt-topbanner-title { font-family:'Space Grotesk',sans-serif; font-size:23px; font-weight:700; color:var(--ink-inverse); letter-spacing:.01em; }\n.wt-topbanner-profile { width:40px; height:40px; flex-shrink:0; border-radius:50%; background:var(--surface-dark); border:1.5px solid var(--hairline-bright); display:flex; align-items:center; justify-content:center; }\n.wt-topbanner-wave { position:absolute; bottom:-1px; left:0; width:100%; height:20px; display:block; }\n.wt-topbanner-wave path { fill:var(--page-bg); }\n\n.wt-frame { max-width:420px; margin:0 auto; padding:18px 18px 4px; }\n\n.wt-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }\n.wt-date { font-size:16px; color:var(--ink-inverse); }\n.wt-date-label { font-weight:700; color:var(--ink-inverse); text-transform:uppercase; }\n\n.wt-trackers-row { display:flex; gap:6px; margin:8px 0 6px; align-items:stretch; }\n.wt-trackers-grid { display:flex; flex-direction:column; gap:var(--s3); margin:8px 0 6px; }\n.wt-tracker-col { display:flex; flex-direction:row; align-items:center; gap:var(--s3); width:100%; background:var(--bg); color:var(--ink-inverse); border-radius:var(--radius); padding:var(--s4); box-sizing:border-box; }\n.wt-tile-left { flex:1; min-width:0; }\n.wt-tile-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; }\n.wt-tile-chip { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }\n.wt-tile-title { font-weight:700; font-size:16px; color:var(--ink-inverse); }\n.wt-tile-goal { font-size:14px; color:var(--ink-inverse); }\n.wt-tile-togo { font-size:15px; font-weight:700; color:var(--ink-inverse); margin-top:2px; }\n.wt-tile-logged { font-size:14px; color:var(--ink-inverse); margin-top:2px; }\n.wt-tile-mid { flex:1 1 0; display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:0; padding:0 2px; }\n.wt-tile-mid-value { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:24px; line-height:1; color:var(--ink-inverse); text-align:center; white-space:nowrap; }\n.wt-tile-mid-label { font-size:13px; font-weight:600; color:var(--muted-dark); text-align:center; margin-top:2px; white-space:nowrap; }\n.wt-tile-right { flex:0 0 auto; display:flex; align-items:center; justify-content:center; }\n.wt-tracker-col-clickable { cursor:pointer; transition:transform .1s ease, box-shadow .1s ease; -webkit-tap-highlight-color:transparent; }\n.wt-tracker-col-clickable:active { transform:scale(0.97); box-shadow:0 1px 4px rgba(0,0,0,.08); }\n.wt-full-width-btn { width:100%; margin-top:10px; background:var(--indigo); }\n.wt-full-width-btn-pill { background:var(--success); }\n.wt-full-width-btn-treatment { background:var(--orange); }\n.wt-tracker-label { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:18px; color:var(--ink); text-transform:uppercase; letter-spacing:.01em; margin-bottom:3px; display:flex; align-items:center; gap:4px; white-space:nowrap; }\n.wt-tracker-goal { font-size:11.5px; color:var(--muted); margin-bottom:3px; font-weight:600; }\n.wt-divider { border-top:1px solid var(--hairline-bright); margin:20px 0 4px; }\n.wt-tracker-number { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:24px; text-align:center; line-height:1; margin-top:3px; }\n.wt-tracker-in-label { text-align:center; font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; margin-top:1px; margin-bottom:4px; }\n.wt-tracker-number .unit { font-size:10px; font-weight:500; color:var(--muted); margin-left:1px; }\n.wt-tracker-sub { text-align:center; font-size:13px; font-weight:700; color:var(--ink); margin-top:1px; margin-bottom:4px; line-height:1.2; min-height:28px; display:flex; align-items:center; justify-content:center; }\n.wt-tracker-btn { padding:9px 4px; font-size:13.5px; font-weight:700; width:100%; gap:4px; background:var(--deep); }\n.wt-tracker-btn-sleep { background:var(--indigo); }\n.wt-btn-text { display:block; width:100%; background:none; border:none; padding:10px 4px; font-size:13.5px; font-weight:600; color:var(--accent); cursor:pointer; font-family:inherit; text-align:center; }\n.wt-btn-text-danger { color:var(--danger); }\n.wt-inline-link { display:inline; background:none; border:none; padding:0; margin:0; font:inherit; font-weight:700; color:inherit; text-decoration:underline; cursor:pointer; }\n.wt-tracker-presets { display:flex; flex-wrap:wrap; justify-content:center; gap:4px; margin-top:8px; }\n.wt-chip-sm { padding:5px 9px; font-size:11px; }\n\n.wt-gauge-wrap { position:relative; margin:0 auto; }\n.wt-gauge-svg { display:block; }\n.wt-gauge-ring { width:103px; height:103px; }\n.wt-gauge-ring circle[stroke-dasharray] { transition:stroke-dashoffset .7s cubic-bezier(.22,1,.36,1); }\n.wt-sleep-preview { text-align:center; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:17px; color:var(--deep); background:var(--mist); border-radius:10px; padding:10px; margin-bottom:16px; }\n.wt-overflow { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:fit-content; text-align:center; font-family:'Space Grotesk',sans-serif; font-size:9px; font-weight:700; color:var(--ink); background:var(--citrus); border-radius:999px; padding:3px 7px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,.18); }\n\n.wt-today-number { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:38px; text-align:center; line-height:1; margin-top:6px; }\n.wt-today-number .unit { font-size:16px; font-weight:500; color:var(--muted); margin-left:3px; }\n.wt-today-sub { text-align:center; font-size:13px; color:var(--muted); margin-top:4px; margin-bottom:16px; }\n\n.wt-btn-primary { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; background:var(--accent); color:#FFFFFF; border:none; border-radius:12px; padding:13px 16px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }\n.wt-btn-primary:disabled { opacity:.4; cursor:not-allowed; }\n.wt-btn-secondary { display:flex; align-items:center; justify-content:center; gap:6px; background:transparent; color:var(--ink-inverse); border:1px solid var(--hairline-bright); border-radius:12px; padding:11px 14px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }\n.wt-btn-ghost { background:none; border:none; color:var(--muted); font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }\n.wt-btn-danger { color:var(--danger); }\n\n.wt-preset-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0 4px; }\n.wt-preset-btn { background:var(--bg); border:1px solid var(--hairline-bright); border-radius:12px; padding:12px 10px; font-size:13.5px; font-weight:600; color:var(--ink-inverse); cursor:pointer; font-family:inherit; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }\n.wt-preset-add-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; background:var(--bg); border:1.5px dashed var(--hairline-bright); border-radius:12px; padding:14px 10px; margin:10px 0 4px; font-size:14.5px; font-weight:700; color:var(--accent); cursor:pointer; font-family:inherit; }\n.wt-chip { display:flex; align-items:center; gap:6px; background:#fff; border:1.5px solid var(--line); border-radius:999px; padding:8px 13px; font-size:13.5px; font-weight:600; color:var(--ink); cursor:pointer; font-family:inherit; }\n.wt-chip-oz { color:var(--teal); font-weight:700; }\n.wt-chip-ghost { color:var(--muted); border-style:dashed; }\n\n.wt-section-label { font-family:'Space Grotesk',sans-serif; font-size:12.5px; font-weight:600; letter-spacing:.02em; color:var(--ink-inverse); text-transform:uppercase; margin:22px 0 8px; }\n.wt-section-label-lg { font-size:16px; }\n.wt-section-label-strong { font-size:14px; font-weight:700; color:var(--ink-inverse); letter-spacing:.01em; }\n.wt-empty-note { font-size:13.5px; color:var(--muted-dark); background:var(--bg); border:1px dashed var(--hairline-bright); border-radius:12px; padding:14px; text-align:center; }\n\n.wt-log-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }\n.wt-log-row { display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--hairline-bright); border-radius:10px; padding:9px 10px; font-size:13.5px; }\n.wt-todo-today-sticky { position:sticky; top:0; z-index:5; background:var(--page-bg); padding-top:2px; margin-bottom:2px; }\n.wt-todo-today-scroll { max-height:34vh; overflow-y:auto; -webkit-overflow-scrolling:touch; }\n.wt-today-log-scroll { min-height:50vh; max-height:62vh; overflow-y:auto; -webkit-overflow-scrolling:touch; }\n.wt-treatment-row { display:flex; align-items:center; gap:10px; background:var(--bg); border:1.5px solid var(--hairline-bright); border-radius:12px; padding:11px 12px; margin-bottom:8px; }\n.wt-treatment-overdue { border-color:var(--danger); background:var(--alert-chip); }\n.wt-treatment-today { border-color:var(--orange); background:var(--meds-chip); }\n.wt-treatment-info { flex:1; min-width:0; display:flex; flex-direction:column; }\n.wt-treatment-name { font-weight:700; font-size:14px; color:var(--ink-inverse); }\n.wt-treatment-due-label { font-size:12px; font-weight:600; color:var(--muted-dark); }\n.wt-treatment-overdue .wt-treatment-due-label { color:var(--danger); }\n.wt-treatment-today .wt-treatment-due-label { color:var(--orange); }\n.wt-treatment-date-input { border:1px solid var(--hairline-bright); border-radius:8px; padding:6px 8px; font-size:12.5px; font-family:inherit; width:132px; flex-shrink:0; background:var(--bg); color:var(--ink-inverse); }\n\n.wt-doctor-share-overlay { position:fixed; inset:0; background:var(--paper); color:var(--ink); z-index:260; overflow-y:auto; }\n.wt-doctor-share-toolbar { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--line); background:#fff; position:sticky; top:0; z-index:2; }\n.wt-doctor-share-toolbar h3 { margin:0; font-size:16px; }\n.wt-doctor-share-controls { padding:14px 18px; background:#fff; border-bottom:1px solid var(--line); }\n.wt-doctor-share-range-label { font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; display:block; margin-bottom:8px; }\n.wt-doctor-share-content { max-width:640px; margin:0 auto; padding:24px 20px 60px; }\n.wt-doctor-share-header { text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid var(--ink); }\n.wt-doctor-share-header h1 { font-size:19px; margin:0 0 4px; }\n.wt-doctor-share-name { font-weight:700; font-size:15px; margin:0 0 2px; }\n.wt-doctor-share-dates { font-size:13px; color:var(--muted); margin:0; }\n.wt-doctor-share-section { margin-bottom:22px; }\n.wt-doctor-share-section h2 { font-size:14px; text-transform:uppercase; letter-spacing:.03em; color:var(--deep); border-bottom:1px solid var(--line); padding-bottom:6px; margin:0 0 10px; }\n.wt-doctor-share-empty { font-size:13px; color:var(--muted); font-style:italic; }\n.wt-doctor-share-table { width:100%; border-collapse:collapse; font-size:13px; }\n.wt-doctor-share-table th { text-align:left; font-weight:700; color:var(--muted); font-size:11.5px; text-transform:uppercase; padding:4px 8px; border-bottom:1.5px solid var(--line); }\n.wt-doctor-share-table td { padding:6px 8px; border-bottom:1px solid var(--mist); }\n.wt-doctor-share-disclaimer { font-size:11px; color:var(--muted); margin-top:30px; padding-top:14px; border-top:1px solid var(--line); line-height:1.5; }\n.wt-share-link-box { font-size:12px; word-break:break-all; background:var(--mist); border:1.5px dashed var(--deep); border-radius:8px; padding:10px; color:var(--ink); user-select:all; }\n\n@media print {\n  .wt-no-print { display:none !important; }\n  /* Hide every other direct child of the app's root wrapper - display:none removes\n     them from layout entirely, unlike visibility:hidden (which was the original,\n     broken approach: hidden elements still occupy space, so everything above the\n     doctor-share overlay in the DOM pushed it thousands of pixels off-screen). */\n  .wt-root > *:not(.wt-doctor-share-overlay) { display:none !important; }\n  .wt-doctor-share-overlay { position:static !important; overflow:visible !important; }\n  .wt-doctor-share-content { max-width:none; padding:0; margin:0; }\n}\n.wt-log-icon { color:var(--muted-dark); flex-shrink:0; }\n.wt-log-time { color:var(--ink-inverse); font-weight:700; width:64px; flex-shrink:0; }\n.wt-log-label { flex:1; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n.wt-log-oz { color:var(--teal); font-weight:700; margin-right:4px; }\n.wt-log-metrics { display:flex; align-items:center; font-size:13px; margin-right:4px; white-space:nowrap; }\n.wt-icon-btn { background:none; border:none; color:var(--muted); padding:4px; display:flex; align-items:center; justify-content:center; min-width:var(--touch); min-height:var(--touch); cursor:pointer; }\n.wt-icon-btn:hover { color:var(--danger); }\n\n.wt-backdrop { position:fixed; inset:0; background:rgba(14,42,46,.94); display:flex; align-items:flex-end; justify-content:center; z-index:150; padding-bottom:env(safe-area-inset-bottom, 0px); touch-action:none; }\n.wt-backdrop.wt-center { align-items:center; padding:20px; }\n.wt-sheet { width:100%; max-width:100%; box-sizing:border-box; max-height:75vh; overflow-y:auto; background:var(--surface-dark); color:var(--ink-inverse); border:1px solid var(--hairline-bright); border-radius:20px 20px 0 0; padding:18px 18px 88px; z-index:160; overscroll-behavior:contain; }\n.wt-modal { width:100%; max-width:360px; background:var(--surface-dark); color:var(--ink-inverse); border:1px solid var(--hairline-bright); border-radius:16px; padding:18px; overscroll-behavior:contain; }\n.wt-modal-tall { max-height:80vh; overflow-y:auto; }\n.wt-help-section { margin-bottom:18px; }\n.wt-help-section:last-child { margin-bottom:0; }\n.wt-help-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:14px; margin:0 0 6px; color:var(--ink-inverse); }\n.wt-help-list { margin:0; padding-left:18px; font-size:13px; color:var(--muted-dark); line-height:1.5; }\n.wt-help-list li { margin-bottom:4px; }\n.wt-sheet-header, .wt-modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }\n.wt-sheet-header h3, .wt-modal-header h3 { font-family:'Space Grotesk',sans-serif; font-size:16px; margin:0; }\n\n\n\n.wt-field { display:block; font-size:12.5px; color:var(--muted-dark); font-weight:600; margin-bottom:14px; }\n.wt-field input, .wt-field select, .wt-field textarea { display:block; width:100%; margin-top:6px; padding:11px 12px; border:1px solid var(--hairline-bright); border-radius:10px; font-size:15px; font-family:inherit; background:var(--bg); color:var(--ink-inverse); box-sizing:border-box; min-height:var(--touch); }\n.wt-settings-tab .wt-field input, .wt-settings-tab .wt-field select, .wt-settings-tab .wt-field textarea { font-size:16px; }\n.wt-field-row { display:flex; gap:10px; }\n.wt-dial-trigger { width:100%; padding:11px 8px; border-radius:10px; border:1px solid var(--hairline-bright); background:var(--bg); font-size:17px; font-weight:700; font-family:'Space Grotesk',sans-serif; color:var(--ink-inverse); text-align:center; cursor:pointer; }\n.wt-dial { width:220px; height:220px; display:block; margin:6px auto 0; touch-action:none; cursor:grab; }\n.wt-dial-number { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:44px; fill:var(--ink-inverse); user-select:none; }\n.wt-dial-tick { font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:13px; fill:var(--muted-dark); user-select:none; }\n.wt-field-row .wt-field { flex:1; }\n.wt-feedback-q { margin-bottom: 16px; }\n.wt-feedback-label { font-size:13px; font-weight:700; color:var(--ink-inverse); margin:0 0 8px; }\n.wt-chip-row { display:flex; flex-wrap:wrap; gap:8px; }\n.wt-chip { padding:9px 14px; border-radius:20px; border:1.5px solid var(--line); background:#fff; font-size:12.5px; font-weight:600; color:var(--muted); cursor:pointer; font-family:inherit; }\n.wt-chip.active { background:var(--deep); border-color:var(--deep); color:#fff; }\n.wt-qty-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--hairline-bright); }\n.wt-qty-row:last-child { border-bottom:none; }\n.wt-qty-name { flex:1; font-size:13.5px; font-weight:600; color:var(--ink-inverse); }\n.wt-recovery-code { font-family:'Space Grotesk',monospace; font-size:22px; font-weight:700; letter-spacing:.08em; text-align:center; color:var(--ink); background:var(--mist); border:1.5px dashed var(--deep); border-radius:10px; padding:12px 8px; user-select:all; }\n.wt-qty-input { width:120px; padding:8px 10px; border:1px solid var(--hairline-bright); border-radius:8px; font-size:13.5px; font-family:inherit; background:var(--bg); color:var(--ink-inverse); }\n.wt-sheet-tall { max-height:85vh; overflow-y:auto; }\n\n.wt-toast { position:fixed; left:50%; bottom:88px; transform:translateX(-50%); background:var(--ink); color:#fff; padding:10px 16px; border-radius:999px; font-size:13.5px; display:flex; align-items:center; gap:12px; z-index:60; box-shadow:0 6px 18px rgba(0,0,0,.18); max-width:90%; }\n.wt-toast button { background:none; border:none; color:var(--teal-light); font-weight:700; cursor:pointer; font-family:inherit; flex-shrink:0; }\n\n.wt-banner { position:fixed; top:14px; left:50%; transform:translateX(-50%); background:var(--citrus); color:var(--ink); padding:11px 18px; border-radius:12px; font-size:13.5px; font-weight:600; z-index:60; box-shadow:0 6px 18px rgba(0,0,0,.15); }\n\n.wt-nav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:min(420px,100%); background:var(--surface-dark); border-top:1px solid var(--hairline-bright); display:flex; padding:8px 6px calc(8px + env(safe-area-inset-bottom,0px)); z-index:var(--z-nav); }\n.wt-nav-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; color:var(--ink-inverse); font-size:11px; font-weight:600; padding:6px 0; cursor:pointer; font-family:inherit; border-radius:10px; min-height:var(--touch); }\n.wt-nav-btn.active { color:var(--accent); background:var(--accent-chip); border-radius:12px; }\n.wt-nav-btn-soon { position:relative; opacity:0.55; cursor:default; }\n.wt-soon-badge { position:absolute; top:-2px; left:50%; transform:translateX(-50%) rotate(-6deg); background:var(--citrus); color:var(--ink); font-size:6.5px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; padding:1.5px 5px; border-radius:5px; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,.25); }\n\n.wt-segment { display:flex; background:var(--bg); border:1px solid var(--hairline-bright); border-radius:11px; padding:3px; margin-bottom:14px; }\n.wt-segment button { flex:1; background:none; border:none; padding:8px 0; font-size:13.5px; font-weight:600; color:var(--muted-dark); border-radius:8px; cursor:pointer; font-family:inherit; }\n.wt-segment button.active { background:var(--accent); color:#FFFFFF; }\n\n.wt-range-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }\n.wt-range-nav button { background:var(--bg); border:1px solid var(--hairline-bright); border-radius:8px; padding:6px; display:flex; cursor:pointer; color:var(--accent); }\n.wt-range-nav button:disabled { opacity:.35; cursor:not-allowed; }\n.wt-range-label { font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600; color:var(--ink-inverse); }\n\n.wt-stat-row { display:flex; gap:8px; margin-bottom:16px; }\n.wt-stat { flex:1; background:var(--bg); border:1px solid var(--hairline-bright); border-radius:12px; padding:10px; text-align:center; }\n.wt-stat-value { font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:700; }\n.wt-stat-label { font-size:10.5px; color:var(--muted-dark); margin-top:2px; }\n\n.wt-card { background:var(--surface-dark); border:1px solid var(--hairline-bright); border-radius:14px; padding:16px; margin-bottom:16px; }\n.wt-card-title { display:flex; align-items:center; gap:7px; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:14.5px; margin-bottom:4px; }\n.wt-card-note { font-size:12.5px; color:var(--muted-dark); margin-bottom:12px; line-height:1.5; }\n.wt-toggle-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }\n.wt-switch { width:42px; height:24px; border-radius:999px; background:var(--line); position:relative; border:none; cursor:pointer; flex-shrink:0; }\n.wt-switch.on { background:var(--teal); }\n.wt-switch span { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:transform .2s ease; }\n.wt-switch.on span { transform:translateX(18px); }\n.wt-tracker-goal-input { width:60px; padding:7px 8px; border:1.5px solid var(--line); border-radius:8px; font-size:14px; font-family:inherit; text-align:right; margin:0 8px; background:#fff; color:var(--ink); }\n\n.wt-plan-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; width:100%; box-sizing:border-box; }\n.wt-plan-card { position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:4px; background:var(--bg); border:1.5px solid var(--line); border-radius:14px; padding:16px 14px; min-height:112px; min-width:0; box-sizing:border-box; box-shadow:0 4px 14px rgba(11,32,56,.08); cursor:pointer; text-align:left; font-family:inherit; transition:transform .12s ease, box-shadow .12s ease; }\n.wt-plan-card:active { transform:scale(0.97); }\n.wt-plan-card:not(.off) { border-color:var(--teal-light); box-shadow:0 6px 18px rgba(46,134,193,.18); }\n.wt-plan-card.off { box-shadow:none; }\n.wt-plan-card-dim { display:flex; flex-direction:column; align-items:flex-start; gap:4px; width:100%; }\n.wt-plan-card-dim.off { opacity:.6; }\n.wt-plan-card-toggle-area { position:absolute; top:16px; right:14px; display:flex; flex-direction:column; align-items:center; }\n.wt-plan-card-icon { width:28px; height:28px; border-radius:8px; background:var(--mist); color:var(--teal); display:flex; align-items:center; justify-content:center; }\n.wt-plan-card.off .wt-plan-card-icon { background:var(--surface-dark); color:var(--muted-dark); }\n.wt-plan-card-title { font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:700; color:var(--ink-inverse); }\n.wt-plan-card.off .wt-plan-card-title { color:var(--muted-dark); }\n.wt-plan-card-goal { font-size:15px; font-weight:600; color:var(--ink-inverse); }\n.wt-plan-card-status { font-size:12px; font-weight:700; color:var(--success); margin-top:auto; padding-top:6px; }\n.wt-plan-card-status.off { color:var(--muted-dark); }\n.wt-plan-bottom-sheet { padding-bottom:24px; }\n.wt-plan-goal-input { display:block; width:100%; font-size:28px; font-weight:700; text-align:center; min-height:64px; padding:8px 12px; border:1px solid var(--hairline-bright); border-radius:12px; font-family:inherit; background:var(--bg); color:var(--ink-inverse); margin-top:12px; }\n.wt-plan-goal-unit { font-size:16px; color:var(--muted-dark); text-align:center; margin-top:6px; }\n.wt-plan-save-btn { min-height:56px; font-size:17px; font-weight:700; }\n.wt-regimen-card { display:block; width:100%; text-align:left; background:var(--surface-dark); border:1px solid var(--hairline-bright); border-radius:14px; padding:16px 14px; margin-bottom:12px; font-family:inherit; cursor:pointer; box-shadow:0 3px 10px rgba(11,32,56,.06); }\n.wt-regimen-card.clinic { border-left:4px solid var(--teal); cursor:default; }\n.wt-regimen-card-title { display:flex; align-items:center; justify-content:space-between; font-family:'Space Grotesk',sans-serif; font-size:17px; font-weight:700; color:var(--ink-inverse); }\n.wt-regimen-card-count { font-size:13px; color:var(--muted-dark); font-weight:600; }\n.wt-regimen-card-preview { font-size:14px; color:var(--muted-dark); margin-top:6px; }\n.wt-regimen-item-list { font-size:14px; color:var(--ink-inverse); line-height:1.7; margin-top:8px; }\n.wt-regimen-clinic-stats { font-size:13px; font-weight:700; color:var(--teal); margin-top:10px; }\n.wt-regimen-live-badge { font-size:11px; font-weight:700; color:var(--success); text-transform:uppercase; letter-spacing:.03em; }\n.wt-regimen-add-partner { display:flex; align-items:center; justify-content:center; gap:8px; min-height:56px; background:none; border:1.5px dashed var(--teal); box-shadow:none; color:var(--teal); font-weight:700; font-size:15px; }\n.wt-plan-section-label { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:700; color:var(--ink-inverse); padding-left:12px; margin:24px 0 10px; }\n\n.wt-action-btns { display:block; margin-top:16px; padding:0 0 16px; }\n.wt-action-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; min-height:56px; border-radius:14px; border:none; font-family:inherit; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,.15); transition:transform .1s ease, box-shadow .1s ease; }\n.wt-action-btn:active { transform:scale(0.97); box-shadow:0 2px 6px rgba(0,0,0,.12); }\n.wt-action-btn.presets { background:linear-gradient(135deg,#F9A825,#F57F17); color:#fff; }\n.wt-action-btn.manual { background:var(--protein); border:2px solid var(--protein); margin-top:10px; }\n\n.wt-voice-tile { position:relative; display:flex; align-items:center; gap:12px; width:100%; box-sizing:border-box; border-radius:20px; padding:12px 16px; margin-bottom:var(--s3); background:linear-gradient(#0B0F14,#0B0F14) padding-box, linear-gradient(135deg,#FFE696,#CE8C08) border-box; border:3px solid transparent; box-shadow:0 0 22px rgba(255,196,40,.35); cursor:default; }\n.wt-voice-tile-icon { flex-shrink:0; width:36px; height:36px; border-radius:10px; background:#564216; color:#FFC428; display:flex; align-items:center; justify-content:center; }\n.wt-voice-tile-icon svg { width:20px; height:20px; }\n.wt-voice-tile-text { flex:1; min-width:0; font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; margin-left:-4px; }\n.wt-voice-tile-title { font-weight:700; font-size:18px; color:#FFF6DB; line-height:1.15; }\n.wt-voice-tile-sub { font-weight:500; font-size:11.5px; color:#FFF6DB; line-height:1.35; margin-top:4px; }\n.wt-voice-tile-badge { position:relative; flex-shrink:0; width:52px; height:52px; border-radius:50%; background-image:url('assets/voice-tracker-badge.png'); background-size:cover; background-position:center; display:flex; align-items:center; justify-content:center; color:#561A96; box-shadow:0 0 0 3px transparent, 0 0 16px rgba(255,196,40,.35); }\n.wt-voice-tile-badge::before { content:''; position:absolute; inset:-3px; border-radius:50%; padding:3px; background:linear-gradient(135deg,#FFE696,#CE8C08); -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude; }\n.wt-voice-tile-badge::after { content:''; position:absolute; top:1px; left:50%; transform:translateX(-50%); width:6px; height:6px; border-radius:50%; background:#fff; }\n.wt-voice-tile-badge svg { width:22px; height:22px; }\n\n.wt-preset-row { display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--hairline-bright); border-radius:12px; padding:10px 11px; margin-bottom:8px; }\n.wt-preset-name { flex:1; font-weight:600; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n.wt-preset-oz { color:var(--teal); font-weight:700; font-size:13.5px; margin-right:2px; }\n\n.wt-loading { padding:60px 20px; text-align:center; color:var(--muted-dark); font-family:inherit; }\n";

    function lO({
        pct: e,
        over: t,
        overText: n,
        imageSrc: r,
        ringColor: a,
        folder: o = "gauges"
    }) {
        let i = Math.max(0, Math.min(100, e)),
            l = 2 * Math.PI * 42,
            u = l * (1 - i / 100),
            s = (i / 100 * 360 - 90) * (Math.PI / 180),
            c = 50 + 42 * Math.cos(s),
            f = 50 + 42 * Math.sin(s);
        return React.default.createElement("div", {
            className: "wt-gauge-wrap"
        }, React.default.createElement("svg", {
            viewBox: "0 0 100 100",
            className: "wt-gauge-svg wt-gauge-ring"
        }, React.default.createElement("defs", null, React.default.createElement("clipPath", {
            id: `ring-clip-${r}`
        }, React.default.createElement("circle", {
            cx: "50",
            cy: "50",
            r: "34"
        }))), React.default.createElement("image", {
            href: `${o}/${r}.png`,
            x: "12",
            y: "12",
            width: "76",
            height: "76",
            clipPath: `url(#ring-clip-${r})`
        }), React.default.createElement("circle", {
            cx: "50",
            cy: "50",
            r: 42,
            fill: "none",
            stroke: a,
            strokeWidth: "7.5",
            opacity: "0.42"
        }), React.default.createElement("circle", {
            cx: "50",
            cy: "50",
            r: 42,
            fill: "none",
            stroke: a,
            strokeWidth: "7.5",
            strokeDasharray: l,
            strokeDashoffset: u,
            strokeLinecap: "round",
            transform: "rotate(-90 50 50)"
        }), React.default.createElement("circle", {
            cx: c,
            cy: f,
            r: "5.5",
            fill: "#fff",
            stroke: a,
            strokeWidth: "2.5"
        })), t && React.default.createElement("div", {
            className: "wt-overflow"
        }, n))
    }

    function uO({
        todayValue: e,
        goal: t,
        recordedToday: n
    }) {
        let r = n && t > 0 ? e / t * 100 : 0;
        return React.default.createElement(lO, {
            pct: r,
            over: !1,
            overText: "",
            imageSrc: "weight",
            ringColor: "var(--weight)",
            folder: "tile-icons"
        })
    }

    function sO({
        pct: e
    }) {
        return React.default.createElement(lO, {
            pct: e,
            over: !1,
            overText: "",
            imageSrc: "supplements",
            ringColor: "var(--meds)",
            folder: "tile-icons"
        })
    }

    function cO({
        pct: e
    }) {
        return React.default.createElement(lO, {
            pct: e,
            over: !1,
            overText: "",
            imageSrc: "treatments",
            ringColor: "var(--treatment)",
            folder: "tile-icons"
        })
    }

    function fO({
        minutes: e,
        goalMinutes: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0;
        return React.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${e-t}min`,
            imageSrc: "exercise",
            ringColor: "var(--exercise)",
            folder: "tile-icons"
        })
    }

    function dO({
        consumedOz: e,
        goalOz: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0;
        return React.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${e-t}oz`,
            imageSrc: "water",
            ringColor: "var(--water)"
        })
    }

    function pO({
        consumedGrams: e,
        goalGrams: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0;
        return React.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${e-t}g`,
            imageSrc: "protein",
            ringColor: "var(--protein)"
        })
    }

    function mO({
        consumedCal: e,
        goalCal: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0;
        return React.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${e-t}cal`,
            imageSrc: "calories",
            ringColor: "var(--calories)"
        })
    }

    function hO({
        hours: e,
        goalHours: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0,
            a = Math.round(10 * (e - t)) / 10;
        return React.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${a}hrs`,
            imageSrc: "sleep",
            ringColor: "var(--sleep)"
        })
    }

    function gO({
        toast: e,
        onDismiss: t
    }) {
        return e ? React.default.createElement("div", {
            className: "wt-toast"
        }, React.default.createElement("span", null, e.message), e.undo && React.default.createElement("button", {
            onClick: () => {
                e.undo(), t()
            }
        }, "Undo")) : null
    }

    function yO({
        open: e,
        onClose: t
    }) {
        return e ? React.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: t
        }, React.default.createElement("div", {
            className: "wt-modal wt-modal-tall",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-modal-header"
        }, React.default.createElement("h3", null, "How to use this"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: t,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("div", {
            className: "wt-help-section"
        }, React.default.createElement("p", {
            className: "wt-help-title"
        }, "Getting started"), React.default.createElement("ul", {
            className: "wt-help-list"
        }, React.default.createElement("li", null, "Add this to your home screen (share icon → Add to Home Screen) so it opens like a real app."), React.default.createElement("li", null, "Set your daily goals for water, protein, and calories in Setup — the defaults are just a starting point."), React.default.createElement("li", null, "Turn on notifications under Remind if you want reminders through the day."))), React.default.createElement("div", {
            className: "wt-help-section"
        }, React.default.createElement("p", {
            className: "wt-help-title"
        }, "Logging something"), React.default.createElement("ul", {
            className: "wt-help-list"
        }, React.default.createElement("li", null, "Tap Log under Water, Protein, or Calories on the main screen."), React.default.createElement("li", null, "Pick a quick amount, or enter a custom one and adjust the time if you're catching up on something from earlier."), React.default.createElement("li", null, "Sleep works differently — tap Log Sleep and enter Lights Out and Woke Up times; the hours are calculated for you, including overnight sessions that cross midnight. Naps use the same button and add to the day's total."), React.default.createElement("li", null, "Made a mistake? Tap the trash icon next to the entry in Today's log to remove it."))), React.default.createElement("div", {
            className: "wt-help-section"
        }, React.default.createElement("p", {
            className: "wt-help-title"
        }, "Presets — one-tap logging"), React.default.createElement("ul", {
            className: "wt-help-list"
        }, React.default.createElement("li", null, "In Settings, add anything you log often — a drink, a shake, a usual snack — with its amount."), React.default.createElement("li", null, "It shows up as a button on the main screen. One tap logs it, no typing."))), React.default.createElement("div", {
            className: "wt-help-section"
        }, React.default.createElement("p", {
            className: "wt-help-title"
        }, "Reports"), React.default.createElement("ul", {
            className: "wt-help-list"
        }, React.default.createElement("li", null, 'Switch between Water / Protein / Cal / Sleep at the top, or pick "All 4" to compare all of them at once.'), React.default.createElement("li", null, '"All 4" shows each as a percentage of its own goal, since oz, grams, calories, and hours don\'t share a scale.'), React.default.createElement("li", null, "Switch between Day / Week / Month, and use the arrows to look back at previous ones."))), React.default.createElement("div", {
            className: "wt-help-section"
        }, React.default.createElement("p", {
            className: "wt-help-title"
        }, "Reminders"), React.default.createElement("ul", {
            className: "wt-help-list"
        }, React.default.createElement("li", null, "Push notifications: real alerts even with the app closed. Turn on in Settings."), React.default.createElement("li", null, "Bedtime reminder: a separate, once-a-day push at whatever time you want to start winding down — set it in Remind too."), React.default.createElement("li", null, "In-app nudge: only works while this is open on screen — a lighter backup, not the main way."), React.default.createElement("li", null, "Calendar file: a one-time download that adds recurring reminders to your phone's own calendar."))), React.default.createElement("div", {
            className: "wt-help-section"
        }, React.default.createElement("p", {
            className: "wt-help-title"
        }, "Backing up your data"), React.default.createElement("ul", {
            className: "wt-help-list"
        }, React.default.createElement("li", null, "In Settings → Backup, export a backup before switching phones or reinstalling."), React.default.createElement("li", null, "Import it on the new device to bring your history back — nothing is stored anywhere else."))), React.default.createElement("p", {
            style: {
                fontSize: 12,
                color: wD,
                marginTop: 4,
                marginBottom: 0
            }
        }, "Still stuck on something? Use Send feedback below and I'll help directly."))) : null
    }

    function vO({
        open: e,
        title: t,
        message: n,
        danger: r,
        onCancel: a,
        onConfirm: o
    }) {
        return e ? React.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: a
        }, React.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-modal-header"
        }, React.default.createElement("h3", null, t)), React.default.createElement("p", {
            style: {
                fontSize: 13.5,
                color: wD,
                marginTop: 0,
                marginBottom: 18
            }
        }, n), React.default.createElement("div", {
            style: {
                display: "flex",
                gap: 10
            }
        }, React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            },
            onClick: a
        }, "Cancel"), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                flex: 1,
                background: r ? bS : "#4C9AFF"
            },
            onClick: o
        }, "Confirm")))) : null
    }

    function bO({
        value: e,
        max: t,
        color: n,
        onChange: r
    }) {
        let a = (0, React.useRef)(null),
            o = (0, React.useRef)(!1);

        function i(e) {
            let n = a.current.getBoundingClientRect();
            return function(e, t, n, r, a) {
                let o = n - e,
                    i = r - t,
                    l = (Math.atan2(i, o) * (180 / Math.PI) + 90 + 360) % 360,
                    u = Math.round(l / 360 * a);
                return u > a && (u = a), u < 0 && (u = 0), u
            }(n.left + n.width / 2, n.top + n.height / 2, e.clientX, e.clientY, t)
        }

        function l() {
            o.current = !1
        }
        let u = 100,
            s = 100,
            c = 2 * Math.PI * 70,
            f = c * (1 - (t > 0 ? Math.max(0, Math.min(1, e / t)) : 0)),
            d = ZS(e, t, u, s, 70),
            p = [0, t / 4, t / 2, 3 * t / 4].map(e => ({
                val: Math.round(e),
                pos: ZS(e, t, u, s, 90)
            }));
        return React.default.createElement("svg", {
            ref: a,
            viewBox: "0 0 200 200",
            className: "wt-dial",
            onPointerDown: function(e) {
                o.current = !0, e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId), r(i(e))
            },
            onPointerMove: function(e) {
                o.current && r(i(e))
            },
            onPointerUp: l,
            onPointerCancel: l
        }, React.default.createElement("circle", {
            cx: u,
            cy: s,
            r: "98",
            fill: "transparent"
        }), React.default.createElement("circle", {
            cx: u,
            cy: s,
            r: 70,
            fill: "none",
            stroke: n,
            strokeWidth: "16",
            opacity: "0.18"
        }), React.default.createElement("circle", {
            cx: u,
            cy: s,
            r: 70,
            fill: "none",
            stroke: n,
            strokeWidth: "16",
            strokeDasharray: c,
            strokeDashoffset: f,
            strokeLinecap: "round",
            transform: "rotate(-90 100 100)"
        }), p.map((e, t) => React.default.createElement("text", {
            key: t,
            x: e.pos.x,
            y: e.pos.y,
            textAnchor: "middle",
            dominantBaseline: "middle",
            className: "wt-dial-tick"
        }, e.val)), React.default.createElement("circle", {
            cx: d.x,
            cy: d.y,
            r: "15",
            fill: "#fff",
            stroke: n,
            strokeWidth: "4"
        }), React.default.createElement("text", {
            x: u,
            y: 102,
            textAnchor: "middle",
            dominantBaseline: "middle",
            className: "wt-dial-number"
        }, e))
    }

    function wO({
        open: e,
        title: t,
        unit: n,
        max: r,
        value: a,
        color: o,
        borderColor: bc,
        onChange: i,
        onClose: l,
        allowDecimal: u,
        time: s,
        onTimeChange: c,
        onLogNow: f,
        onDismiss: d
    }) {
        if (!e) return null;
        let p = d || l;
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: e => {
                e.stopPropagation(), p()
            }
        }, React.default.createElement("div", {
            className: "wt-sheet",
            style: bc ? { borderColor: bc } : null,
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, t), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: p,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -6,
                marginBottom: 16,
                textAlign: "center"
            }
        }, u ? "Drag the dial for a rough number, or type the exact amount down below." : f ? 'Drag the dial or type an amount, then log it. Want to pick from your presets, or add a description or different time? Use "Manual or Presets Entry".' : "Drag the dial to the amount you consumed, or manually type in the exact amount down below."), React.default.createElement(bO, {
            value: a,
            max: r,
            color: o,
            onChange: i
        }), React.default.createElement("label", {
            className: "wt-field",
            style: {
                marginTop: 18
            }
        }, n, React.default.createElement("input", {
            type: "number",
            inputMode: u ? "decimal" : "numeric",
            step: u ? "0.1" : "1",
            value: 0 === a ? "" : a,
            placeholder: "0",
            onChange: e => {
                let t = Number(e.target.value),
                    n = u ? Math.round(10 * t) / 10 : Math.round(t);
                i(Number.isFinite(t) ? Math.max(0, n) : 0)
            }
        })), c && React.default.createElement("label", {
            className: "wt-field"
        }, "Time", React.default.createElement("input", {
            type: "time",
            value: s,
            onChange: e => c(e.target.value)
        })), f ? React.default.createElement(React.default.Fragment, null, React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                marginTop: 16
            },
            disabled: a <= 0,
            onClick: f
        }, a > 0 ? `Log ${a}${n}` : "Log"), React.default.createElement("button", {
            className: "wt-btn-text",
            onClick: l
        }, "Manual or Presets Entry")) : React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                marginTop: 16
            },
            onClick: l
        }, "Done")))
    }

    function xO({
        open: e,
        onClose: r,
        presets: o,
        onQuickLogPreset: i,
        onAddPreset,
        onEditPreset,
        onDeletePreset
    }) {
        let [showPresetsSheet, setShowPresetsSheet] = (0, React.useState)(!1), [presetModalOpen, setPresetModalOpen] = (0, React.useState)(!1), [presetEditTarget, setPresetEditTarget] = (0, React.useState)(null);
        if ((0, React.useEffect)(() => {
                e && setShowPresetsSheet(!1)
            }, [e]), !e) return null;
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, React.default.createElement("div", {
            className: "wt-sheet",
            style: {
                display: "flex",
                flexDirection: "column",
                minHeight: "60vh"
            },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, "Use Your Presets"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -6,
                marginBottom: 16
            }
        }, "Tap a preset to log it instantly."), o && o.length > 0 ? React.default.createElement("div", {
            className: "wt-preset-grid",
            style: {
                alignContent: "flex-start",
                flex: "1 1 auto",
                overflowY: "auto",
                marginBottom: 8
            }
        }, [...o].sort((e, t) => e.name.localeCompare(t.name)).map(e => React.default.createElement("button", {
            key: e.id,
            className: "wt-preset-btn",
            onClick: () => i(e)
        }, e.name))) : React.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 10
            }
        }, "No presets yet. Add something you log often — a drink, a shake, a usual snack — with whichever of water, protein, or calories apply."), React.default.createElement("button", {
            type: "button",
            style: {
                display: "block",
                width: "100%",
                textAlign: "center",
                background: "none",
                border: "none",
                padding: 0,
                marginTop: "auto",
                paddingTop: 16,
                marginBottom: 14,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--teal)",
                cursor: "pointer",
                fontFamily: "inherit"
            },
            onClick: () => setShowPresetsSheet(!0)
        }, "✏ Edit Presets")), showPresetsSheet && React.default.createElement("div", {
            className: "wt-backdrop",
            style: {
                zIndex: 170
            },
            onClick: () => setShowPresetsSheet(!1)
        }, React.default.createElement("div", {
            className: "wt-sheet",
            style: {
                position: "fixed",
                zIndex: 171,
                bottom: 0,
                left: 0,
                width: "100%"
            },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, "My Presets"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => setShowPresetsSheet(!1),
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), 0 === o.length && React.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 10
            }
        }, "No presets yet. Add something you log often — a drink, a shake, a usual snack — with whichever of water, protein, or calories apply."), [...o].sort((e, t) => e.name.localeCompare(t.name)).map(e => {
            let t = [];
            return e.oz > 0 && t.push(`${e.oz}oz`), e.grams > 0 && t.push(`${e.grams}g`), e.calories > 0 && t.push(`${e.calories}cal`), React.default.createElement("div", {
                key: e.id,
                className: "wt-preset-row"
            }, React.default.createElement("span", {
                className: "wt-preset-name"
            }, e.name), React.default.createElement("span", {
                className: "wt-preset-oz"
            }, t.join(" · ")), React.default.createElement("button", {
                className: "wt-icon-btn",
                onClick: () => {
                    setPresetEditTarget(e), setPresetModalOpen(!0)
                },
                "aria-label": "Edit preset"
            }, React.default.createElement(Pencil, {
                size: 14
            })), React.default.createElement("button", {
                className: "wt-icon-btn",
                onClick: () => onDeletePreset(e.id),
                "aria-label": "Delete preset"
            }, React.default.createElement(Trash2, {
                size: 14
            })))
        }), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 4
            },
            onClick: () => {
                setPresetEditTarget(null), setPresetModalOpen(!0)
            }
        }, React.default.createElement(Plus, {
            size: 15
        }), " Add Preset"))), React.default.createElement(OO, {
            open: presetModalOpen,
            initial: presetEditTarget,
            onClose: () => setPresetModalOpen(!1),
            onSave: e => {
                presetEditTarget ? onEditPreset(presetEditTarget.id, e.name, e.oz, e.grams, e.calories) : onAddPreset(e.name, e.oz, e.grams, e.calories), setPresetModalOpen(!1)
            }
        }))
    }

    function ManualMealSheet({
        open: e,
        initial: t,
        quickFill: n,
        onClose: r,
        onSubmit: a
    }) {
        let [l, u] = (0, React.useState)(""), [s, c] = (0, React.useState)(""), [f, d] = (0, React.useState)(""), [p, m] = (0, React.useState)(""), [h, g] = (0, React.useState)(JS());
        if ((0, React.useEffect)(() => {
                e && (u(t && t.oz ? String(t.oz) : n && "oz" === n.field ? String(n.value) : ""), c(t && t.grams ? String(t.grams) : n && "grams" === n.field ? String(n.value) : ""), d(t && t.calories ? String(t.calories) : n && "calories" === n.field ? String(n.value) : ""), m(t ? t.label : ""), g(t ? eO(t.timeMinutes) : JS()))
            }, [e, t, n]), !e) return null;
        let b = Number(l) || 0,
            w = Number(s) || 0,
            x = Number(f) || 0,
            E = (b > 0 || w > 0 || x > 0) && "" !== h;
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, React.default.createElement("div", {
            className: "wt-sheet",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, t ? "Edit entry" : "Manually Log a Meal"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -6,
                marginBottom: 16
            }
        }, "Fill in whichever apply — leave the rest blank."), React.default.createElement("div", {
            className: "wt-field-row"
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Water (oz)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: 0,
            placeholder: "0",
            value: l,
            onChange: e => u(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Protein (g)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: 0,
            placeholder: "0",
            value: s,
            onChange: e => c(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Calories", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: 0,
            placeholder: "0",
            value: f,
            onChange: e => d(e.target.value)
        }))), React.default.createElement("label", {
            className: "wt-field"
        }, "Description (optional)", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Post-workout shake",
            value: p,
            onChange: e => m(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Time", React.default.createElement("input", {
            type: "time",
            value: h,
            onChange: e => g(e.target.value)
        })), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -8,
                marginBottom: 14
            }
        }, "Defaults to now — change it if you're catching up on something from earlier today."), React.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: !E,
            onClick: () => a({
                oz: b,
                grams: w,
                calories: x
            }, h, p)
        }, t ? "Save changes" : "Log Items")))
    }

    function EO({
        label: e,
        options: t,
        value: n,
        onChange: r
    }) {
        return React.default.createElement("div", {
            className: "wt-feedback-q"
        }, React.default.createElement("p", {
            className: "wt-feedback-label"
        }, e), React.default.createElement("div", {
            className: "wt-chip-row"
        }, t.map(e => React.default.createElement("button", {
            key: e,
            type: "button",
            className: "wt-chip " + (n === e ? "active" : ""),
            onClick: () => r(e)
        }, e))))
    }

    function kO({
        open: e,
        testerName: t,
        onClose: n,
        onSubmit: r,
        onGoToSettings: a
    }) {
        let [o, i] = (0, React.useState)(""), [l, u] = (0, React.useState)(""), [s, c] = (0, React.useState)(""), [f, d] = (0, React.useState)(""), [p, m] = (0, React.useState)(""), [h, g] = (0, React.useState)(""), [y, v] = (0, React.useState)(""), [b, w] = (0, React.useState)(!1), [x, E] = (0, React.useState)("");
        if ((0, React.useEffect)(() => {
                e && (i(""), u(""), c(""), d(""), m(""), g(""), v(""), w(!1), E(""))
            }, [e]), !e) return null;
        let k = "" !== o;
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: n
        }, React.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, "Feedback"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -6,
                marginBottom: 16
            }
        }, "Takes about 30 seconds — only the first question is required."), t ? React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -4,
                marginBottom: 16
            }
        }, "Submitting as ", React.default.createElement("b", {
            style: {
                color: wI
            }
        }, t), ".") : React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: -4,
                marginBottom: 16
            }
        }, "No name set — this will be submitted anonymously.", " ", React.default.createElement("button", {
            type: "button",
            className: "wt-inline-link",
            onClick: a
        }, "Add your name")), React.default.createElement(EO, {
            label: "Overall, how's it going?",
            options: ["Great", "Good", "OK", "Frustrating"],
            value: o,
            onChange: i
        }), React.default.createElement(EO, {
            label: "Are you using it every day?",
            options: ["Yes, every day", "Most days", "A few times a week", "Not really"],
            value: l,
            onChange: u
        }), React.default.createElement(EO, {
            label: "Do you enter things immediately or more in bunches?",
            options: ["Right away, each time", "In a batch, later", "A mix of both"],
            value: s,
            onChange: c
        }), React.default.createElement(EO, {
            label: "Do you like the dials for entry?",
            options: ["Love them", "They're fine", "Prefer typing", "Haven't tried them"],
            value: f,
            onChange: d
        }), React.default.createElement("label", {
            className: "wt-field"
        }, "What's working well? (optional)", React.default.createElement("textarea", {
            rows: "2",
            value: p,
            onChange: e => m(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "What's frustrating or missing? (optional)", React.default.createElement("textarea", {
            rows: "2",
            value: h,
            onChange: e => g(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Anything specific you'd want added? (optional)", React.default.createElement("textarea", {
            rows: "2",
            value: y,
            onChange: e => v(e.target.value)
        })), x && React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 4,
                marginBottom: 10
            }
        }, x), React.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: !k || b,
            onClick: async function() {
                w(!0), E("");
                try {
                    await r({
                        overall: o,
                        dailyUse: l,
                        entryPattern: s,
                        dialOpinion: f,
                        workingWell: p,
                        frustrations: h,
                        wanted: y
                    })
                } catch (e) {
                    E(e.message || "Could not submit — try again."), w(!1)
                }
            }
        }, b ? "Sending…" : "Send Feedback")))
    }

    function SO({
        open: e,
        initial: t,
        activeSession: n,
        onClose: r,
        onSubmit: a,
        onStartSleeping: o,
        onFinishSleeping: i,
        onCancelSession: l
    }) {
        let [u, s] = (0, React.useState)(!1), [c, f] = (0, React.useState)("22:00"), [d, p] = (0, React.useState)("06:00");
        if ((0, React.useEffect)(() => {
                e && (s(!!t), f(t ? eO(t.lightsOutMinutes) : "22:00"), p(t ? eO(t.wokeUpMinutes) : JS()))
            }, [e, t]), !e) return null;
        let m = nO(c),
            h = nO(d),
            g = LS(m, h),
            y = function(e, t) {
                return e > t
            }(m, h),
            v = g > 0;
        if (t || u) return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, React.default.createElement("div", {
            className: "wt-sheet",
            style: { borderColor: "var(--sleep)" },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, t ? "Edit sleep" : "Log Sleep"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -6,
                marginBottom: 16
            }
        }, "If Lights Out was last night, just pick that time — crossing into today is handled automatically."), React.default.createElement("div", {
            className: "wt-field-row"
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Lights Out", React.default.createElement("input", {
            type: "time",
            value: c,
            onChange: e => f(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Woke Up", React.default.createElement("input", {
            type: "time",
            value: d,
            onChange: e => p(e.target.value)
        }))), React.default.createElement("div", {
            className: "wt-sleep-preview"
        }, "= ", g, "hrs", y ? " (overnight)" : " (nap)"), React.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: !v,
            onClick: () => a(m, h)
        }, t ? "Save changes" : "Log Sleep"), !t && React.default.createElement("button", {
            className: "wt-btn-text",
            onClick: () => s(!1)
        }, "← Back")));
        if (n) {
            let e = new Date(n.startedAt),
                t = Math.round((Date.now() - e.getTime()) / 36e5 * 10) / 10,
                a = e.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                }),
                o = t > 16;
            return React.default.createElement("div", {
                className: "wt-backdrop",
                onClick: r
            }, React.default.createElement("div", {
                className: "wt-sheet",
                style: { borderColor: "var(--sleep)" },
                onClick: e => e.stopPropagation()
            }, React.default.createElement("div", {
                className: "wt-sheet-header"
            }, React.default.createElement("h3", null, "Sleeping"), React.default.createElement("button", {
                className: "wt-icon-btn",
                onClick: r,
                "aria-label": "Close"
            }, React.default.createElement(XIcon, {
                size: 18
            }))), React.default.createElement("p", {
                style: {
                    fontSize: 13.5,
                    color: wI,
                    marginTop: -6,
                    marginBottom: 18,
                    textAlign: "center"
                }
            }, "Started at ", a, " — about ", t, "hrs ago"), o && React.default.createElement("p", {
                style: {
                    fontSize: 11.5,
                    color: bS,
                    marginTop: -12,
                    marginBottom: 14,
                    textAlign: "center"
                }
            }, "That's a long stretch — double check this is right, or enter times manually instead."), React.default.createElement("button", {
                className: "wt-btn-primary wt-tracker-btn-sleep",
                style: {
                    marginBottom: 12
                },
                onClick: i
            }, "Finish Sleeping"), React.default.createElement("button", {
                className: "wt-btn-text",
                onClick: () => s(!0)
            }, "Enter times manually instead"), React.default.createElement("button", {
                className: "wt-btn-text wt-btn-text-danger",
                onClick: l
            }, "Cancel — started by mistake")))
        }
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, React.default.createElement("div", {
            className: "wt-sheet",
            style: { borderColor: "var(--sleep)" },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, "Sleep"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("p", {
            style: {
                fontSize: 13,
                color: wD,
                marginTop: -6,
                marginBottom: 18,
                textAlign: "center"
            }
        }, "Tap when you're about to fall asleep, then again when you wake up."), React.default.createElement("button", {
            className: "wt-btn-primary wt-tracker-btn-sleep",
            style: {
                marginBottom: 12
            },
            onClick: o
        }, "Start Sleeping"), React.default.createElement("button", {
            className: "wt-btn-text",
            onClick: () => s(!0)
        }, "Enter times manually instead")))
    }

    function OO({
        open: e,
        initial: t,
        onClose: n,
        onSave: r
    }) {
        let [a, o] = (0, React.useState)(""), [i, l] = (0, React.useState)(""), [u, s] = (0, React.useState)(""), [c, f] = (0, React.useState)("");
        if ((0, React.useEffect)(() => {
                e && (o(t ? t.name : ""), l(t && t.oz ? String(t.oz) : ""), s(t && t.grams ? String(t.grams) : ""), f(t && t.calories ? String(t.calories) : ""))
            }, [e, t]), !e) return null;
        let d = Number(i) || 0,
            p = Number(u) || 0,
            m = Number(c) || 0,
            h = a.trim().length > 0 && (d > 0 || p > 0 || m > 0);
        return createPortal(React.default.createElement("div", {
            className: "wt-backdrop wt-center",
            style: {
                zIndex: 180
            },
            onClick: e => {
                e.stopPropagation(), n()
            }
        }, React.default.createElement("div", {
            className: "wt-modal",
            style: {
                background: "#151A21",
                color: "#FFF6DB",
                "--muted": "#5C7085",
                "--deep": "#1B4F72",
                "--line": "#D5E1EC",
                "--paper": "#F2F5F8"
            },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-modal-header"
        }, React.default.createElement("h3", null, t ? "Edit preset" : "Add preset"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("label", {
            className: "wt-field"
        }, "Name", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Protein shake",
            value: a,
            onChange: e => o(e.target.value)
        })), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -8,
                marginBottom: 14
            }
        }, "Fill in whichever apply — leave the rest blank. A protein shake might have all three; a black coffee just water."), React.default.createElement("div", {
            className: "wt-field-row"
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Water (oz)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: i,
            onChange: e => l(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Protein (g)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: u,
            onChange: e => s(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Calories", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: c,
            onChange: e => f(e.target.value)
        }))), React.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: !h,
            onClick: () => r({
                name: a.trim(),
                oz: d,
                grams: p,
                calories: m
            })
        }, "Save preset"))), document.body)
    }

    function PO({
        open: e,
        onClose: t,
        onRestore: n
    }) {
        let [r, a] = (0, React.useState)(""), [o, i] = (0, React.useState)(!1);
        if ((0, React.useEffect)(() => {
                e && (a(""), i(!1))
            }, [e]), !e) return null;
        return React.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: t
        }, React.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-modal-header"
        }, React.default.createElement("h3", null, "Restore from backup"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: t,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("p", {
            style: {
                fontSize: 12,
                color: bS,
                marginTop: -4,
                marginBottom: 14,
                lineHeight: 1.5
            }
        }, "This replaces everything currently in the app on this device with whatever was backed up under that code."), React.default.createElement("label", {
            className: "wt-field"
        }, "Recovery code", React.default.createElement("input", {
            type: "text",
            placeholder: "ABCD-EFGH-JK",
            autoCapitalize: "characters",
            autoCorrect: "off",
            value: r,
            onChange: e => a(e.target.value)
        })), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginTop: 6
            },
            disabled: o || 0 === r.trim().length,
            onClick: async function() {
                i(!0);
                let e = await n(r);
                i(!1), e && t()
            }
        }, o ? "Restoring…" : "Restore my data")))
    }

    function CO({
        open: e,
        initial: t,
        onClose: n,
        onSave: r
    }) {
        let [a, o] = (0, React.useState)(""), [i, l] = (0, React.useState)("1"), [u, s] = (0, React.useState)(!1), [c, f] = (0, React.useState)(""), [d, p] = (0, React.useState)("");
        if ((0, React.useEffect)(() => {
                e && (o(t ? t.name : ""), l(t && null != t.intervalDays ? String(t.intervalDays) : "1"), s(!(!t || !t.trackInventory)), f(t && null != t.qtyRemaining ? String(t.qtyRemaining) : ""), p(t && t.expirationDate ? t.expirationDate : ""))
            }, [e, t]), !e) return null;
        let m = a.trim().length > 0;
        return React.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: n
        }, React.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-modal-header"
        }, React.default.createElement("h3", null, t ? "Edit item" : "Add supplement or medicine"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("label", {
            className: "wt-field"
        }, "Name", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Vitamin D, Metformin",
            value: a,
            onChange: e => o(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Take every (days)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: "1",
            placeholder: "1",
            value: i,
            onChange: e => l(e.target.value)
        })), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -8,
                marginBottom: 14
            }
        }, "Most people leave this at 1 (daily). Set it to 2, 3, 7, etc. for anything you take less often — like every other day, or once a week."), React.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: u ? 12 : 4
            }
        }, React.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Track inventory / subscription"), React.default.createElement("button", {
            className: "wt-switch " + (u ? "on" : ""),
            onClick: () => s(!u),
            "aria-label": "Toggle inventory tracking"
        }, React.default.createElement("span", null))), u && React.default.createElement("label", {
            className: "wt-field"
        }, "Units remaining", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: "0",
            placeholder: "e.g. 30",
            value: c,
            onChange: e => f(e.target.value)
        })), u && React.default.createElement("label", {
            className: "wt-field",
            style: {
                marginTop: 12,
                marginBottom: 14
            }
        }, "Expiration date", React.default.createElement("input", {
            type: "date",
            value: d,
            onChange: e => p(e.target.value)
        })), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginTop: 6
            },
            disabled: !m,
            onClick: () => r(a.trim(), Math.max(1, Math.round(Number(i) || 1)), u, Number(c) || 0, d || null)
        }, "Save")))
    }

    function jO({
        open: e,
        initial: t,
        onClose: n,
        onSave: r
    }) {
        let [a, o] = (0, React.useState)(""), [i, l] = (0, React.useState)(""), [u, s] = (0, React.useState)(!1), [c, f] = (0, React.useState)(""), [d, p] = (0, React.useState)("");
        if ((0, React.useEffect)(() => {
                e && (o(t ? t.name : ""), l(t && t.intervalDays ? String(t.intervalDays) : ""), s(!(!t || !t.trackInventory)), f(t && null != t.qtyRemaining ? String(t.qtyRemaining) : ""), p(t && t.expirationDate ? t.expirationDate : ""))
            }, [e, t]), !e) return null;
        let m = a.trim().length > 0;
        return React.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: n
        }, React.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-modal-header"
        }, React.default.createElement("h3", null, t ? "Edit treatment" : "Add a treatment"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("label", {
            className: "wt-field"
        }, "Name", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. B12 Shot, IV Drip, Allergy Shot",
            value: a,
            onChange: e => o(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Repeats every (optional)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "e.g. 14 (leave blank to just track history)",
            value: i,
            onChange: e => l(e.target.value)
        })), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -8,
                marginBottom: 14
            }
        }, 'Leave the interval blank if you just want to log when you had it, with no "next due" reminder.'), React.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: u ? 12 : 4
            }
        }, React.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Track inventory / subscription"), React.default.createElement("button", {
            className: "wt-switch " + (u ? "on" : ""),
            onClick: () => s(!u),
            "aria-label": "Toggle inventory tracking"
        }, React.default.createElement("span", null))), u && React.default.createElement("label", {
            className: "wt-field"
        }, "Sessions/doses remaining", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: "0",
            placeholder: "e.g. 12",
            value: c,
            onChange: e => f(e.target.value)
        })), u && React.default.createElement("label", {
            className: "wt-field",
            style: {
                marginTop: 12,
                marginBottom: 14
            }
        }, "Expiration date", React.default.createElement("input", {
            type: "date",
            value: d,
            onChange: e => p(e.target.value)
        })), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginTop: 6
            },
            disabled: !m,
            onClick: () => r(a.trim(), Math.max(0, Math.round(Number(i) || 0)), u, Number(c) || 0, d || null)
        }, "Save")))
    }

    function NO({
        open: e,
        supplements: t,
        initial: n,
        onClose: r,
        onSubmit: a,
        onGoToSettings: o
    }) {
        let [i, l] = (0, React.useState)([]), [u, s] = (0, React.useState)(JS());
        if ((0, React.useEffect)(() => {
                if (e)
                    if (n) {
                        let e = (n.items || []).map(e => "string" == typeof e ? {
                            name: e,
                            qty: ""
                        } : e);
                        l(e), s(eO(n.timeMinutes))
                    } else l([]), s(JS())
            }, [e, n]), !e) return null;
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, React.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            style: { borderColor: "var(--meds)" },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, n ? "Edit entry" : "Supplements & Prescriptions"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), 0 === t.length ? React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            style: {
                fontSize: 13,
                color: wD,
                marginTop: -6,
                marginBottom: 18,
                textAlign: "center"
            }
        }, "Nothing set up yet. Add the supplements, vitamins, and medicines you take regularly in Setup, and they'll show up here to log with one tap."), React.default.createElement("button", {
            className: "wt-btn-primary",
            onClick: o
        }, "Go to Settings")) : React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -6,
                marginBottom: 16,
                textAlign: "center"
            }
        }, "Tap everything you're taking right now."), React.default.createElement("div", {
            className: "wt-chip-row",
            style: {
                marginBottom: i.length > 0 ? 14 : 18
            }
        }, t.map(e => React.default.createElement("button", {
            key: e.id,
            type: "button",
            className: "wt-chip " + (i.some(t => t.name === e.name) ? "active" : ""),
            onClick: () => function(e) {
                l(t => t.some(t => t.name === e) ? t.filter(t => t.name !== e) : [...t, {
                    name: e,
                    qty: ""
                }])
            }(e.name)
        }, e.name))), i.length > 0 && React.default.createElement("div", {
            style: {
                marginBottom: 16
            }
        }, i.map(e => React.default.createElement("div", {
            key: e.name,
            className: "wt-qty-row"
        }, React.default.createElement("span", {
            className: "wt-qty-name"
        }, e.name), React.default.createElement("input", {
            type: "text",
            className: "wt-qty-input",
            placeholder: "Qty (e.g. 1 or 10mg)",
            value: e.qty,
            onChange: t => function(e, t) {
                l(n => n.map(n => n.name === e ? {
                    ...n,
                    qty: t
                } : n))
            }(e.name, t.target.value)
        })))), React.default.createElement("label", {
            className: "wt-field"
        }, "Time", React.default.createElement("input", {
            type: "time",
            value: u,
            onChange: e => s(e.target.value)
        })), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                marginTop: 6
            },
            disabled: 0 === i.length,
            onClick: () => a(i, u)
        }, n ? "Save changes" : "Log " + (i.length > 0 ? `(${i.length})` : "")))))
    }

    function TO({
        open: e,
        initial: t,
        onClose: n,
        onSubmit: r
    }) {
        let [a, o] = (0, React.useState)(""), [i, l] = (0, React.useState)(""), [u, s] = (0, React.useState)(""), [c, f] = (0, React.useState)(JS());
        if ((0, React.useEffect)(() => {
                e && (o(t ? t.exerciseType : ""), l(t ? String(t.minutes) : ""), s(t && t.description || ""), f(t ? eO(t.timeMinutes) : JS()))
            }, [e, t]), !e) return null;
        let d = Number(i) || 0,
            p = a.trim().length > 0 && d > 0;
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: n
        }, React.default.createElement("div", {
            className: "wt-sheet",
            style: { borderColor: "var(--exercise)" },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, t ? "Edit exercise" : "Log Exercise"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("label", {
            className: "wt-field"
        }, "Type", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Running, Weights, Yoga",
            value: a,
            onChange: e => o(e.target.value)
        })), React.default.createElement("div", {
            className: "wt-field-row"
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Minutes", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "30",
            value: i,
            onChange: e => l(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Time", React.default.createElement("input", {
            type: "time",
            value: c,
            onChange: e => f(e.target.value)
        }))), React.default.createElement("label", {
            className: "wt-field"
        }, "Description (optional)", React.default.createElement("textarea", {
            rows: "2",
            placeholder: "e.g. 5k around the park",
            value: u,
            onChange: e => s(e.target.value)
        })), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginTop: 6
            },
            disabled: !p,
            onClick: () => r(a.trim(), d, u.trim(), c)
        }, t ? "Save changes" : "Log")))
    }

    function AO({
        open: e,
        treatments: t,
        initial: n,
        onClose: r,
        onSubmit: a,
        onGoToSettings: o
    }) {
        let [i, l] = (0, React.useState)([]), [u, s] = (0, React.useState)(""), [c, f] = (0, React.useState)(JS());
        if ((0, React.useEffect)(() => {
                e && (n ? (l(n.items || []), s(n.dateKeyStr || HS(new Date)), f(eO(n.timeMinutes))) : (l([]), s(HS(new Date)), f(JS())))
            }, [e, n]), !e) return null;
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, React.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            style: { borderColor: "var(--treatment)" },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, n ? "Edit entry" : "Log Treatment"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), 0 === t.length ? React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            style: {
                fontSize: 13,
                color: wD,
                marginTop: -6,
                marginBottom: 18,
                textAlign: "center"
            }
        }, "Nothing set up yet. Add periodic treatments — drips, shots, sessions — in Setup, and they'll show up here to log with one tap."), React.default.createElement("button", {
            className: "wt-btn-primary",
            onClick: o
        }, "Go to Settings")) : React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -6,
                marginBottom: 16,
                textAlign: "center"
            }
        }, "Tap everything you had, and set the date if it wasn't today."), React.default.createElement("div", {
            className: "wt-chip-row",
            style: {
                marginBottom: 18
            }
        }, t.map(e => React.default.createElement("button", {
            key: e.id,
            type: "button",
            className: "wt-chip " + (i.includes(e.name) ? "active" : ""),
            onClick: () => function(e) {
                l(t => t.includes(e) ? t.filter(t => t !== e) : [...t, e])
            }(e.name)
        }, e.name))), React.default.createElement("label", {
            className: "wt-field"
        }, "Date", React.default.createElement("input", {
            type: "date",
            value: u,
            onChange: e => s(e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Time", React.default.createElement("input", {
            type: "time",
            value: c,
            onChange: e => f(e.target.value)
        })), React.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: 0 === i.length,
            onClick: () => a(i, u, c)
        }, n ? "Save changes" : "Log " + (i.length > 0 ? `(${i.length})` : "")))))
    }

    function VoiceTrackerTile() {
        return React.default.createElement("div", {
            className: "wt-voice-tile",
            role: "button",
            tabIndex: 0,
            "aria-label": "Voice Tracker — coming soon, not yet active",
            "aria-disabled": "true"
        }, React.default.createElement("div", {
            className: "wt-voice-tile-icon"
        }, React.default.createElement("svg", {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.8,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            width: 20,
            height: 20
        }, React.default.createElement("rect", { x: 6, y: 8, width: 12, height: 10, rx: 3.2 }), React.default.createElement("line", { x1: 12, y1: 8, x2: 12, y2: 4.5 }), React.default.createElement("circle", { cx: 12, cy: 3.3, r: 1.15, fill: "currentColor", stroke: "none" }), React.default.createElement("circle", { cx: 9.3, cy: 12.6, r: 1.15, fill: "currentColor", stroke: "none" }), React.default.createElement("circle", { cx: 14.7, cy: 12.6, r: 1.15, fill: "currentColor", stroke: "none" }), React.default.createElement("line", { x1: 9, y1: 15.6, x2: 15, y2: 15.6 }), React.default.createElement("line", { x1: 6, y1: 12, x2: 4, y2: 12 }), React.default.createElement("line", { x1: 18, y1: 12, x2: 20, y2: 12 }))), React.default.createElement("div", {
            className: "wt-voice-tile-text"
        }, React.default.createElement("div", {
            className: "wt-voice-tile-title"
        }, "Voice Tracker"), React.default.createElement("div", {
            className: "wt-voice-tile-sub"
        }, "Describe what you had, Tracker AI will suggest and enter the stats for you.")), React.default.createElement("div", {
            className: "wt-voice-tile-badge"
        }, React.default.createElement("svg", {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.8,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            width: 22,
            height: 22
        }, React.default.createElement("rect", { x: 9.5, y: 3, width: 5, height: 8.5, rx: 2.5, fill: "currentColor", stroke: "none" }), React.default.createElement("path", { d: "M7 10.5a5 5 0 0 0 10 0" }), React.default.createElement("line", { x1: 12, y1: 15.5, x2: 12, y2: 18.5 }), React.default.createElement("line", { x1: 9, y1: 18.5, x2: 15, y2: 18.5 }), React.default.createElement("path", { d: "M4.5 9.5a7.5 7.5 0 0 0 0 3" }), React.default.createElement("path", { d: "M2.3 8a10 10 0 0 0 0 6" }), React.default.createElement("path", { d: "M19.5 9.5a7.5 7.5 0 0 1 0 3" }), React.default.createElement("path", { d: "M21.7 8a10 10 0 0 1 0 6" }))))
    }

    function MO({
        data: e,
        todayKey: t,
        onOpenQuickDial: n,
        onOpenSleepSheet: r,
        onOpenWeightDial: a,
        onOpenSupplementSheet: o,
        onOpenTreatmentSheet: i,
        onOpenExerciseSheet: l,
        onOpenPresetSheet,
        onOpenManualSheet
    }) {
        let u = e.logs[t] || [],
            s = u.reduce((e, t) => e + kS(t), 0),
            c = u.reduce((e, t) => e + SS(t), 0),
            f = u.reduce((e, t) => e + OS(t), 0),
            d = Math.round(10 * u.reduce((e, t) => e + CS(t), 0)) / 10,
            p = e.settings.goalOz || 0,
            m = e.settings.goalProtein || 0,
            h = e.settings.goalCalories || 0,
            g = e.settings.goalSleepHours || 0,
            y = p - s,
            v = m - c,
            b = h - f,
            w = Math.round(10 * (g - d)) / 10,
            x = !1 !== e.settings.showWater,
            E = !1 !== e.settings.showProtein,
            k = !1 !== e.settings.showCalories,
            S = !1 !== e.settings.showSleep,
            O = !1 !== e.settings.showWeight,
            P = !1 !== e.settings.showSupplements,
            C = !1 !== e.settings.showTreatments,
            j = !1 !== e.settings.showExercise,
            N = x || E || k || S,
            T = (() => {
                let t = null;
                return Object.keys(e.logs).forEach(n => {
                    (e.logs[n] || []).forEach(e => {
                        jS(e) && (!t || n > t.date || n === t.date && e.timeMinutes > t.timeMinutes) && (t = {
                            date: n,
                            value: e.value
                        })
                    })
                }), t
            })(),
            A = (T && (T.date === t ? T.value : (T.value, YS(MS(T.date)))), e.settings.supplements.length),
            M = new Set;
        u.forEach(e => {
            NS(e) && (e.items || []).forEach(e => M.add("string" == typeof e ? e : e.name))
        });
        let _ = 0 === A ? "Add in Setup" : `${M.size} of ${A} taken today`,
            D = e.settings.supplements.filter(e => {
                let n = DS(e, t);
                return ("overdue" === n.state || "today" === n.state) && !M.has(e.name)
            }).length,
            z = e.settings.treatments.filter(e => e.intervalDays > 0),
            I = z.filter(e => {
                let n = AS(e, t);
                return "overdue" === n.state || "today" === n.state
            }).length,
            L = 0 === e.settings.treatments.length ? "Add in Setup" : I > 0 ? `${I} due` : z.length > 0 ? "All caught up" : "Tap to log",
            R = u.filter(IS).reduce((e, t) => e + (Number(t.minutes) || 0), 0),
            B = !!T && T.date === t,
            $ = (e.settings.treatments.length, e.settings.goalWeight || 0),
            F = e.settings.goalExerciseMinutes || 0,
            U = (B && $ > 0 && T.value, B ? Math.round(10 * (T.value - $)) / 10 : null),
            W = $ <= 0 ? "Set a goal" : B ? 0 === U ? "Right on goal! 🎯" : U > 0 ? `+${U}lbs` : `${U}lbs` : "Log today's weight",
            H = e.settings.supplements.filter(e => {
                let n = DS(e, t);
                return "overdue" === n.state || "today" === n.state
            }).length,
            q = 0 === A ? 0 : 0 === H ? 100 : (H - D) / H * 100,
            V = z.filter(e => {
                let n = AS(e, t);
                return "overdue" === n.state || "today" === n.state || e.lastTakenDate === t
            }),
            G = V.length,
            X = V.filter(e => e.lastTakenDate === t).length,
            Y = 0 === G ? 100 : X / G * 100,
            K = (Math.max(1, F), F <= 0 ? "Set a goal" : F - R > 0 ? F - R + "min to go" : R - F + "min over 🎉"),
            Q = e.settings.supplements.map(QS).find(e => e) || null,
            Z = e.settings.treatments.map(QS).find(e => e) || null;
        return React.default.createElement("div", null, React.default.createElement("div", {
            className: "wt-trackers-grid"
        }, React.default.createElement(VoiceTrackerTile, null), x && React.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            style: {
                border: "2px solid var(--water)"
            },
            onClick: () => n("oz"),
            role: "button",
            tabIndex: 0
        }, React.default.createElement("div", {
            className: "wt-tile-left"
        }, React.default.createElement("div", {
            className: "wt-tile-header"
        }, React.default.createElement("div", {
            className: "wt-tile-chip",
            style: {
                background: "var(--water-chip)",
                color: "var(--water)"
            }
        }, React.default.createElement(Droplet, {
            size: 18,
            color: "var(--water)",
            fill: "var(--water)"
        })), React.default.createElement("span", {
            className: "wt-tile-title"
        }, "Water")), React.default.createElement("div", {
            className: "wt-tile-goal"
        }, "Goal ", p, "oz"), React.default.createElement("div", {
            className: "wt-tile-logged"
        }, s, React.default.createElement("span", {
            className: "unit"
        }, "oz"), " In")), React.default.createElement("div", {
            className: "wt-tile-mid"
        }, React.default.createElement("div", {
            className: "wt-tile-mid-value"
        }, p <= 0 ? "–" : y > 0 ? `${y}oz` : `${s - p}oz`), React.default.createElement("div", {
            className: "wt-tile-mid-label"
        }, p <= 0 ? "Set a goal" : y > 0 ? "to go" : "over 🎉")), React.default.createElement("div", {
            className: "wt-tile-right"
        }, React.default.createElement(dO, {
            consumedOz: s,
            goalOz: p
        }))), E && React.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            style: {
                border: "2px solid var(--protein)"
            },
            onClick: () => n("grams"),
            role: "button",
            tabIndex: 0
        }, React.default.createElement("div", {
            className: "wt-tile-left"
        }, React.default.createElement("div", {
            className: "wt-tile-header"
        }, React.default.createElement("div", {
            className: "wt-tile-chip",
            style: {
                background: "var(--protein-chip)",
                color: "var(--protein)"
            }
        }, React.default.createElement(Battery, {
            size: 18,
            color: "var(--protein)",
            fill: "var(--protein)"
        })), React.default.createElement("span", {
            className: "wt-tile-title"
        }, "Protein")), React.default.createElement("div", {
            className: "wt-tile-goal"
        }, "Goal ", m, "g"), React.default.createElement("div", {
            className: "wt-tile-logged"
        }, c, React.default.createElement("span", {
            className: "unit"
        }, "g"), " In")), React.default.createElement("div", {
            className: "wt-tile-mid"
        }, React.default.createElement("div", {
            className: "wt-tile-mid-value"
        }, m <= 0 ? "–" : v > 0 ? `${v}g` : `${c - m}g`), React.default.createElement("div", {
            className: "wt-tile-mid-label"
        }, m <= 0 ? "Set a goal" : v > 0 ? "to go" : "over 🎉")), React.default.createElement("div", {
            className: "wt-tile-right"
        }, React.default.createElement(pO, {
            consumedGrams: c,
            goalGrams: m
        }))), k && React.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            style: {
                border: "2px solid var(--calories)"
            },
            onClick: () => n("calories"),
            role: "button",
            tabIndex: 0
        }, React.default.createElement("div", {
            className: "wt-tile-left"
        }, React.default.createElement("div", {
            className: "wt-tile-header"
        }, React.default.createElement("div", {
            className: "wt-tile-chip",
            style: {
                background: "var(--calories-chip)",
                color: "var(--calories)"
            }
        }, React.default.createElement(Flame, {
            size: 18,
            color: "var(--calories)",
            fill: "var(--calories)"
        })), React.default.createElement("span", {
            className: "wt-tile-title"
        }, "Calories")), React.default.createElement("div", {
            className: "wt-tile-goal"
        }, "Goal ", h, "cal"), React.default.createElement("div", {
            className: "wt-tile-logged"
        }, f, React.default.createElement("span", {
            className: "unit"
        }, "cal"), " In")), React.default.createElement("div", {
            className: "wt-tile-mid"
        }, React.default.createElement("div", {
            className: "wt-tile-mid-value"
        }, h <= 0 ? "–" : b > 0 ? `${b}cal` : `${f - h}cal`), React.default.createElement("div", {
            className: "wt-tile-mid-label"
        }, h <= 0 ? "Set a goal" : b > 0 ? "left" : "over")), React.default.createElement("div", {
            className: "wt-tile-right"
        }, React.default.createElement(mO, {
            consumedCal: f,
            goalCal: h
        }))), S && React.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            style: {
                border: "2px solid var(--sleep)"
            },
            onClick: r,
            role: "button",
            tabIndex: 0
        }, React.default.createElement("div", {
            className: "wt-tile-left"
        }, React.default.createElement("div", {
            className: "wt-tile-header"
        }, React.default.createElement("div", {
            className: "wt-tile-chip",
            style: {
                background: "var(--sleep-chip)",
                color: "var(--sleep)"
            }
        }, React.default.createElement(Bed, {
            size: 18,
            color: "var(--sleep)",
            fill: "var(--sleep)"
        })), React.default.createElement("span", {
            className: "wt-tile-title"
        }, "Sleep")), React.default.createElement("div", {
            className: "wt-tile-goal"
        }, "Goal ", g, "hrs"), React.default.createElement("div", {
            className: "wt-tile-logged"
        }, d, React.default.createElement("span", {
            className: "unit"
        }, "hrs"), " Slept")), React.default.createElement("div", {
            className: "wt-tile-mid"
        }, React.default.createElement("div", {
            className: "wt-tile-mid-value"
        }, e.activeSleepSession ? "😴" : g <= 0 ? "–" : w > 0 ? `${w}hrs` : `${Math.abs(w)}hrs`), React.default.createElement("div", {
            className: "wt-tile-mid-label",
            style: e.activeSleepSession ? {
                color: yS
            } : null
        }, e.activeSleepSession ? "Sleeping…" : g <= 0 ? "Set a goal" : w > 0 ? "to go" : "over 🎉")), React.default.createElement("div", {
            className: "wt-tile-right"
        }, React.default.createElement(hO, {
            hours: d,
            goalHours: g
        }))), !N && React.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                width: "100%"
            }
        }, "All trackers are hidden from this screen. Turn one back on in Setup → Daily goals.")), React.default.createElement("div", {
            className: "wt-trackers-grid"
        }, O && React.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            style: {
                border: "2px solid var(--weight)"
            },
            onClick: a,
            role: "button",
            tabIndex: 0
        }, React.default.createElement("div", {
            className: "wt-tile-left"
        }, React.default.createElement("div", {
            className: "wt-tile-header"
        }, React.default.createElement("div", {
            className: "wt-tile-chip",
            style: {
                background: "var(--weight-chip)",
                color: "var(--weight)"
            }
        }, React.default.createElement(Weight, {
            size: 18,
            color: "var(--weight)",
            fill: "var(--weight)"
        })), React.default.createElement("span", {
            className: "wt-tile-title"
        }, "Weight")), React.default.createElement("div", {
            className: "wt-tile-goal"
        }, $ <= 0 ? "Set a goal" : `Goal ${$}lbs`), React.default.createElement("div", {
            className: "wt-tile-togo"
        }, W), React.default.createElement("div", {
            className: "wt-tile-logged"
        }, B ? T.value : "—", React.default.createElement("span", {
            className: "unit"
        }, "lbs"), " Today")), React.default.createElement("div", {
            className: "wt-tile-mid"
        }, React.default.createElement("div", {
            className: "wt-tile-mid-value"
        }, $ <= 0 || !B ? "–" : 0 === U ? "🎯" : `${Math.abs(U)}`), React.default.createElement("div", {
            className: "wt-tile-mid-label"
        }, $ <= 0 ? "Set a goal" : !B ? "Log today" : 0 === U ? "On goal!" : "to go")), React.default.createElement("div", {
            className: "wt-tile-right"
        }, React.default.createElement(uO, {
            todayValue: B ? T.value : 0,
            goal: $,
            recordedToday: B
        }))), j && React.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            style: {
                border: "2px solid var(--exercise)"
            },
            onClick: l,
            role: "button",
            tabIndex: 0
        }, React.default.createElement("div", {
            className: "wt-tile-left"
        }, React.default.createElement("div", {
            className: "wt-tile-header"
        }, React.default.createElement("div", {
            className: "wt-tile-chip",
            style: {
                background: "var(--exercise-chip)",
                color: "var(--exercise)"
            }
        }, React.default.createElement(Dumbbell, {
            size: 18,
            color: "var(--exercise)",
            fill: "var(--exercise)"
        })), React.default.createElement("span", {
            className: "wt-tile-title"
        }, "Exercise")), React.default.createElement("div", {
            className: "wt-tile-goal"
        }, F <= 0 ? "Set a goal" : `Goal ${F}min`), React.default.createElement("div", {
            className: "wt-tile-logged"
        }, R, React.default.createElement("span", {
            className: "unit"
        }, "min"), " Today")), React.default.createElement("div", {
            className: "wt-tile-mid"
        }, React.default.createElement("div", {
            className: "wt-tile-mid-value"
        }, F <= 0 ? "–" : F - R > 0 ? `${F - R}min` : `${R - F}min`), React.default.createElement("div", {
            className: "wt-tile-mid-label"
        }, F <= 0 ? "Set a goal" : F - R > 0 ? "to go" : "over 🎉")), React.default.createElement("div", {
            className: "wt-tile-right"
        }, React.default.createElement(fO, {
            minutes: R,
            goalMinutes: F
        }))), C && React.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            style: {
                border: "2px solid var(--treatment)"
            },
            onClick: i,
            role: "button",
            tabIndex: 0
        }, React.default.createElement("div", {
            className: "wt-tile-left"
        }, React.default.createElement("div", {
            className: "wt-tile-header"
        }, React.default.createElement("div", {
            className: "wt-tile-chip",
            style: {
                background: "var(--treatment-chip)",
                color: "var(--treatment)"
            }
        }, React.default.createElement(Syringe, {
            size: 18,
            color: "var(--treatment)",
            fill: "var(--treatment)"
        })), React.default.createElement("span", {
            className: "wt-tile-title"
        }, "Treatments")), React.default.createElement("div", {
            className: "wt-tile-goal"
        }, 0 === z.length ? "Add in Setup" : G > 0 ? `Goal ${G} today` : "Nothing planned"), React.default.createElement("div", {
            className: "wt-tile-togo"
        }, Z ? `${L} · ${Z}` : L), React.default.createElement("div", {
            className: "wt-tile-logged"
        }, X, " Done")), React.default.createElement("div", {
            className: "wt-tile-mid"
        }, React.default.createElement("div", {
            className: "wt-tile-mid-value"
        }, 0 === z.length ? "–" : `${G}`), React.default.createElement("div", {
            className: "wt-tile-mid-label"
        }, 0 === z.length ? "Add in Setup" : "to do")), React.default.createElement("div", {
            className: "wt-tile-right"
        }, React.default.createElement(cO, {
            pct: Y
        }))), P && React.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            style: {
                border: "2px solid var(--meds)"
            },
            onClick: o,
            role: "button",
            tabIndex: 0
        }, React.default.createElement("div", {
            className: "wt-tile-left"
        }, React.default.createElement("div", {
            className: "wt-tile-header"
        }, React.default.createElement("div", {
            className: "wt-tile-chip",
            style: {
                background: "var(--meds-chip)",
                color: "var(--meds)"
            }
        }, React.default.createElement(Pill, {
            size: 18,
            color: "var(--meds)",
            fill: "var(--meds)"
        })), React.default.createElement("span", {
            className: "wt-tile-title"
        }, "RX & Vitamins")), React.default.createElement("div", {
            className: "wt-tile-goal"
        }, 0 === A ? "Add in Setup" : H > 0 ? `Goal ${H} today` : "Nothing due"), React.default.createElement("div", {
            className: "wt-tile-togo"
        }, Q ? `${_} · ${Q}` : _), React.default.createElement("div", {
            className: "wt-tile-logged"
        }, M.size, " Taken")), React.default.createElement("div", {
            className: "wt-tile-mid"
        }, React.default.createElement("div", {
            className: "wt-tile-mid-value"
        }, 0 === A ? "–" : `${H}`), React.default.createElement("div", {
            className: "wt-tile-mid-label"
        }, 0 === A ? "Add in Setup" : "to take")), React.default.createElement("div", {
            className: "wt-tile-right"
        }, React.default.createElement(sO, {
            pct: q
        }))), !O && !P && !C && !j && React.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                width: "100%"
            }
        }, "All of these trackers are hidden from this screen. Turn one back on in Setup.")), React.default.createElement("div", {
            className: "wt-action-btns"
        }, React.default.createElement("button", {
            className: "wt-action-btn presets",
            onClick: onOpenPresetSheet
        }, React.default.createElement(Zap, {
            size: 20,
            color: "#fff"
        }), "Use Your Presets"), React.default.createElement("button", {
            className: "wt-action-btn manual",
            onClick: onOpenManualSheet
        }, React.default.createElement(Pencil, {
            size: 20,
            color: "#fff"
        }), "Manually Log a Meal")))
    }

    function _O({
        open: e,
        data: t,
        onClose: n
    }) {
        let [r, a] = (0, React.useState)(30), [o, i] = (0, React.useState)("idle"), [l, u] = (0, React.useState)(""), [s, c] = (0, React.useState)(""), [f, d] = (0, React.useState)(!1);
        if ((0, React.useEffect)(() => {
                i("idle"), u(""), c("")
            }, [r]), !e) return null;
        let p = function(e, t) {
                let n = new Date;
                n.setHours(0, 0, 0, 0);
                let r = VS(n, -(t - 1)),
                    a = [];
                for (let e = new Date(r); e <= n; e = VS(e, 1)) a.push(HS(e));
                let o = 0,
                    i = 0,
                    l = 0,
                    u = 0,
                    s = 0,
                    c = [],
                    f = {},
                    d = {};
                a.forEach(t => {
                    let n = e.logs[t] || [];
                    n.length > 0 && s++, n.forEach(e => {
                        PS(e) ? u += e.hours || 0 : jS(e) ? c.push({
                            date: t,
                            value: e.value
                        }) : NS(e) ? (e.items || []).forEach(e => {
                            let n = "string" == typeof e ? e : e.name;
                            f[n] || (f[n] = new Set), f[n].add(t)
                        }) : zS(e) ? (e.items || []).forEach(e => {
                            d[e] || (d[e] = []), d[e].push(t)
                        }) : (o += kS(e), i += SS(e), l += OS(e))
                    })
                }), c.sort((e, t) => e.date.localeCompare(t.date));
                let p = a.length;
                return {
                    rangeStart: a[0],
                    rangeEnd: a[a.length - 1],
                    daysInRange: p,
                    daysWithAnyLog: s,
                    goals: {
                        goalOz: e.settings.goalOz || 0,
                        goalProtein: e.settings.goalProtein || 0,
                        goalCalories: e.settings.goalCalories || 0,
                        goalSleepHours: e.settings.goalSleepHours || 0
                    },
                    averages: {
                        avgOz: Math.round(o / p),
                        avgProtein: Math.round(i / p),
                        avgCalories: Math.round(l / p),
                        avgSleepHours: Math.round(u / p * 10) / 10
                    },
                    weight: {
                        entries: c,
                        first: c.length > 0 ? c[0] : null,
                        last: c.length > 0 ? c[c.length - 1] : null,
                        change: c.length >= 2 ? Math.round(10 * (c[c.length - 1].value - c[0].value)) / 10 : null
                    },
                    supplements: Object.entries(f).map(([e, t]) => ({
                        name: e,
                        daysTaken: t.size
                    })).sort((e, t) => e.name.localeCompare(t.name)),
                    treatments: Object.entries(d).map(([e, t]) => ({
                        name: e,
                        dates: [...t].sort()
                    })).sort((e, t) => e.name.localeCompare(t.name))
                }
            }(t, r),
            m = (t.settings.testerName || "").trim(),
            h = t.settings.account && t.settings.account.sessionToken;
        return React.default.createElement("div", {
            className: "wt-doctor-share-overlay"
        }, React.default.createElement("div", {
            className: "wt-doctor-share-toolbar wt-no-print"
        }, React.default.createElement("h3", null, "Health Summary"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("div", {
            className: "wt-doctor-share-controls wt-no-print"
        }, React.default.createElement("span", {
            className: "wt-doctor-share-range-label"
        }, "Time period"), React.default.createElement("div", {
            className: "wt-chip-row"
        }, [7, 30, 90].map(e => React.default.createElement("button", {
            key: e,
            type: "button",
            className: "wt-chip " + (r === e ? "active" : ""),
            onClick: () => a(e)
        }, "Last ", e, " days"))), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginTop: 14
            },
            onClick: () => window.print()
        }, "Print / Save as PDF"), h ? React.default.createElement("div", {
            style: {
                marginTop: 12
            }
        }, "ready" !== o && React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%"
            },
            disabled: "generating" === o,
            onClick: async function() {
                i("generating"), c("");
                try {
                    let e = await async function(e, t) {
                        let n = rS();
                        if (!n) throw new Error("Sharing is not configured yet.");
                        let r = await fetch(`${n}/api/share`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${e}`
                                },
                                body: JSON.stringify({
                                    summary: t
                                })
                            }),
                            a = await r.json().catch(() => ({}));
                        if (!r.ok) throw new Error(a.error || "Could not generate a share link.");
                        return a
                    }(h, {
                        ...p,
                        testerName: m
                    });
                    u(e.url), i("ready")
                } catch (e) {
                    c(e.message || "Could not generate a link."), i("error")
                }
            }
        }, "generating" === o ? "Generating…" : "Generate a link to share"), "error" === o && React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 8,
                marginBottom: 0
            }
        }, s), "ready" === o && React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginBottom: 6
            }
        }, "Anyone with this link can view this summary — no account needed. It expires in 90 days."), React.default.createElement("div", {
            className: "wt-share-link-box"
        }, l), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 8
            },
            onClick: async function() {
                try {
                    await navigator.clipboard.writeText(l), d(!0), setTimeout(() => d(!1), 2e3)
                } catch {}
            }
        }, f ? "Copied!" : "Copy link"))) : React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Sign in (below, in Account) to generate a shareable link instead of printing.")), React.default.createElement(DO, {
            summary: p,
            testerName: m,
            generatedAt: new Date
        }))
    }

    function DO({
        summary: e,
        testerName: t,
        generatedAt: n
    }) {
        function r(e) {
            let [t, n, r] = e.split("-").map(Number);
            return new Date(t, n - 1, r).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric"
            })
        }
        return React.default.createElement("div", {
            className: "wt-doctor-share-content"
        }, React.default.createElement("div", {
            className: "wt-doctor-share-header"
        }, React.default.createElement("h1", null, "HydroPro Tracker — Health Summary"), t && React.default.createElement("p", {
            className: "wt-doctor-share-name"
        }, t), React.default.createElement("p", {
            className: "wt-doctor-share-dates"
        }, r(e.rangeStart), " – ", r(e.rangeEnd), " (", e.daysInRange, " days, logged on ", e.daysWithAnyLog, ")")), React.default.createElement("div", {
            className: "wt-doctor-share-section"
        }, React.default.createElement("h2", null, "Daily Averages"), React.default.createElement("table", {
            className: "wt-doctor-share-table"
        }, React.default.createElement("thead", null, React.default.createElement("tr", null, React.default.createElement("th", null, "Metric"), React.default.createElement("th", null, "Average"), React.default.createElement("th", null, "Goal"))), React.default.createElement("tbody", null, React.default.createElement("tr", null, React.default.createElement("td", null, "Water"), React.default.createElement("td", null, e.averages.avgOz, "oz"), React.default.createElement("td", null, e.goals.goalOz > 0 ? `${e.goals.goalOz}oz` : "—")), React.default.createElement("tr", null, React.default.createElement("td", null, "Protein"), React.default.createElement("td", null, e.averages.avgProtein, "g"), React.default.createElement("td", null, e.goals.goalProtein > 0 ? `${e.goals.goalProtein}g` : "—")), React.default.createElement("tr", null, React.default.createElement("td", null, "Calories"), React.default.createElement("td", null, e.averages.avgCalories, "cal"), React.default.createElement("td", null, e.goals.goalCalories > 0 ? `${e.goals.goalCalories}cal` : "—")), React.default.createElement("tr", null, React.default.createElement("td", null, "Sleep"), React.default.createElement("td", null, e.averages.avgSleepHours, "hrs"), React.default.createElement("td", null, e.goals.goalSleepHours > 0 ? `${e.goals.goalSleepHours}hrs` : "—"))))), React.default.createElement("div", {
            className: "wt-doctor-share-section"
        }, React.default.createElement("h2", null, "Weight"), 0 === e.weight.entries.length ? React.default.createElement("p", {
            className: "wt-doctor-share-empty"
        }, "No weight logged in this period.") : React.default.createElement(React.default.Fragment, null, React.default.createElement("p", null, e.weight.first.value, "lbs (", r(e.weight.first.date), ") → ", e.weight.last.value, "lbs (", r(e.weight.last.date), ")", null !== e.weight.change && React.default.createElement(React.default.Fragment, null, " — ", React.default.createElement("b", null, e.weight.change > 0 ? `+${e.weight.change}` : e.weight.change, "lbs"))), React.default.createElement("table", {
            className: "wt-doctor-share-table"
        }, React.default.createElement("thead", null, React.default.createElement("tr", null, React.default.createElement("th", null, "Date"), React.default.createElement("th", null, "Weight"))), React.default.createElement("tbody", null, e.weight.entries.map((e, t) => React.default.createElement("tr", {
            key: t
        }, React.default.createElement("td", null, r(e.date)), React.default.createElement("td", null, e.value, "lbs"))))))), React.default.createElement("div", {
            className: "wt-doctor-share-section"
        }, React.default.createElement("h2", null, "Supplements & Prescriptions"), 0 === e.supplements.length ? React.default.createElement("p", {
            className: "wt-doctor-share-empty"
        }, "None logged in this period.") : React.default.createElement("table", {
            className: "wt-doctor-share-table"
        }, React.default.createElement("thead", null, React.default.createElement("tr", null, React.default.createElement("th", null, "Name"), React.default.createElement("th", null, "Days taken (of ", e.daysInRange, ")"))), React.default.createElement("tbody", null, e.supplements.map((e, t) => React.default.createElement("tr", {
            key: t
        }, React.default.createElement("td", null, e.name), React.default.createElement("td", null, e.daysTaken)))))), React.default.createElement("div", {
            className: "wt-doctor-share-section"
        }, React.default.createElement("h2", null, "Treatments"), 0 === e.treatments.length ? React.default.createElement("p", {
            className: "wt-doctor-share-empty"
        }, "None logged in this period.") : React.default.createElement("table", {
            className: "wt-doctor-share-table"
        }, React.default.createElement("thead", null, React.default.createElement("tr", null, React.default.createElement("th", null, "Name"), React.default.createElement("th", null, "Dates"))), React.default.createElement("tbody", null, e.treatments.map((e, t) => React.default.createElement("tr", {
            key: t
        }, React.default.createElement("td", null, e.name), React.default.createElement("td", null, e.dates.map(e => r(e)).join(", "))))))), React.default.createElement("p", {
            className: "wt-doctor-share-disclaimer"
        }, "This summary is self-reported by the user via the HydroPro Tracker app and is provided for informational purposes only. It is not a clinical record and may include gaps, estimates, or user error. Generated ", n.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric"
        }), "."))
    }

    function zO({
        shareId: e
    }) {
        let [t, n] = (0, React.useState)("loading"), [r, a] = (0, React.useState)(null), [o, i] = (0, React.useState)("");
        return (0, React.useEffect)(() => {
            let t = !1;
            return async function(e) {
                let t = rS();
                if (!t) throw new Error("Sharing is not configured yet.");
                let n = await fetch(`${t}/api/share/${encodeURIComponent(e)}`),
                    r = await n.json().catch(() => ({}));
                if (!n.ok) throw new Error(r.error || "Could not load this shared summary.");
                return r
            }(e).then(e => {
                t || (a(e.summary), n("ready"))
            }).catch(e => {
                t || (i(e.message || "Could not load this shared summary."), n("error"))
            }), () => {
                t = !0
            }
        }, [e]), React.default.createElement("div", {
            className: "wt-doctor-share-overlay",
            style: {
                position: "static"
            }
        }, React.default.createElement("style", null, iO), "loading" === t && React.default.createElement("div", {
            className: "wt-doctor-share-content"
        }, React.default.createElement("p", null, "Loading shared summary…")), "error" === t && React.default.createElement("div", {
            className: "wt-doctor-share-content"
        }, React.default.createElement("p", {
            style: {
                color: bS,
                fontWeight: 600
            }
        }, o), React.default.createElement("p", {
            style: {
                fontSize: 13,
                color: wS
            }
        }, "This link may have expired, or may no longer exist.")), "ready" === t && React.default.createElement(React.default.Fragment, null, React.default.createElement("div", {
            className: "wt-doctor-share-controls wt-no-print",
            style: {
                textAlign: "center"
            }
        }, React.default.createElement("button", {
            className: "wt-btn-primary",
            onClick: () => window.print()
        }, "Print / Save as PDF")), React.default.createElement(DO, {
            summary: r,
            testerName: "",
            generatedAt: new Date
        })))
    }

    function IO(e, t, n, r, a = t) {
        return React.default.createElement("li", {
            key: e.id,
            className: "wt-log-row"
        }, PS(e) ? React.default.createElement(React.default.Fragment, null, React.default.createElement(Bed, {
            size: 13,
            className: "wt-log-icon"
        }), React.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), React.default.createElement("span", {
            className: "wt-log-label"
        }, "Sleep"), React.default.createElement("span", {
            className: "wt-log-metrics"
        }, React.default.createElement("span", {
            style: {
                color: yS,
                fontWeight: 700,
                fontSize: 12
            }
        }, tO(e.lightsOutMinutes), " → ", tO(e.wokeUpMinutes), " · ", e.hours, "hrs"))) : jS(e) ? React.default.createElement(React.default.Fragment, null, React.default.createElement(Weight, {
            size: 13,
            className: "wt-log-icon"
        }), React.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), React.default.createElement("span", {
            className: "wt-log-label"
        }, "Weight"), React.default.createElement("span", {
            className: "wt-log-metrics"
        }, React.default.createElement("span", {
            style: {
                color: yS,
                fontWeight: 700
            }
        }, e.value, "lbs"))) : NS(e) ? React.default.createElement(React.default.Fragment, null, React.default.createElement(Pill, {
            size: 13,
            className: "wt-log-icon"
        }), React.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), React.default.createElement("span", {
            className: "wt-log-label",
            style: {
                flex: 2
            }
        }, e.label)) : zS(e) ? React.default.createElement(React.default.Fragment, null, React.default.createElement(Syringe, {
            size: 13,
            className: "wt-log-icon"
        }), React.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), React.default.createElement("span", {
            className: "wt-log-label",
            style: {
                flex: 2
            }
        }, e.label)) : IS(e) ? React.default.createElement(React.default.Fragment, null, React.default.createElement(Dumbbell, {
            size: 13,
            className: "wt-log-icon"
        }), React.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), React.default.createElement("span", {
            className: "wt-log-label",
            style: {
                flex: 2
            }
        }, e.exerciseType, e.description ? ` — ${e.description}` : ""), React.default.createElement("span", {
            className: "wt-log-metrics"
        }, React.default.createElement("span", {
            style: {
                color: gS,
                fontWeight: 700
            }
        }, e.minutes, "min"))) : React.default.createElement(React.default.Fragment, null, React.default.createElement(Clock, {
            size: 13,
            className: "wt-log-icon"
        }), React.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), React.default.createElement("span", {
            className: "wt-log-label"
        }, e.label), React.default.createElement("span", {
            className: "wt-log-metrics"
        }, function(e) {
            let t = [];
            return kS(e) > 0 && t.push({
                amount: kS(e),
                unit: "oz",
                color: mS
            }), SS(e) > 0 && t.push({
                amount: SS(e),
                unit: "g",
                color: hS
            }), OS(e) > 0 && t.push({
                amount: OS(e),
                unit: "cal",
                color: gS
            }), t
        }(e).map((e, t) => React.default.createElement("span", {
            key: t,
            style: {
                color: e.color,
                fontWeight: 700
            }
        }, t > 0 && React.default.createElement("span", {
            style: {
                color: vS
            }
        }, " · "), e.amount, e.unit)))), t && React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => n(e),
            "aria-label": "Edit entry"
        }, React.default.createElement(Pencil, {
            size: 14
        })), a && React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => r(e.id),
            "aria-label": "Delete entry"
        }, React.default.createElement(Trash2, {
            size: 14
        })))
    }

    function LO({
        open: e,
        historyDate: t,
        dates: n,
        entriesForDate: r,
        onClose: a,
        onSelectDate: o,
        onBack: i,
        onEnterMissed: l,
        onDeleteEntry: u
    }) {
        return e ? React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: a
        }, React.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, t ? YS(MS(t)) : "Past days"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: a,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), t ? React.default.createElement(React.default.Fragment, null, React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginBottom: 14
            },
            onClick: () => l(t)
        }, "Enter Missed Items"), React.default.createElement("button", {
            className: "wt-btn-text",
            style: {
                textAlign: "left",
                padding: "0 0 12px"
            },
            onClick: i
        }, "← All past days"), 0 === r.length ? React.default.createElement("p", {
            className: "wt-empty-note"
        }, "No entries logged that day.") : React.default.createElement("ul", {
            className: "wt-log-list"
        }, r.slice().sort((e, t) => rO(t) - rO(e)).map(e => IO(e, !1, null, u, !0)))) : 0 === n.length ? React.default.createElement("p", {
            className: "wt-empty-note"
        }, "No past days logged yet.") : React.default.createElement("div", null, n.map(e => React.default.createElement("button", {
            key: e,
            className: "wt-preset-row",
            style: {
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                border: "none"
            },
            onClick: () => o(e)
        }, React.default.createElement("span", {
            className: "wt-preset-name"
        }, YS(MS(e)))))))) : null
    }

    function BackfillSheet({
        open: e,
        initialDate: t,
        data: n,
        onClose: r,
        onSave: a
    }) {
        let [o, i] = (0, React.useState)(t || HS(new Date)),
            [l, u] = (0, React.useState)(""), [s, c] = (0, React.useState)(""),
            [f, d] = (0, React.useState)(""), [p, m] = (0, React.useState)(""),
            [h, g] = (0, React.useState)(""), [y, v] = (0, React.useState)(""),
            [b, w] = (0, React.useState)(""), [x, E] = (0, React.useState)(""),
            [k, S] = (0, React.useState)(""), [O, P] = (0, React.useState)([]);
        if ((0, React.useEffect)(() => {
                e && (i(t || HS(new Date)), u(""), c(""), d(""), m(""), g(""), v(""), w(""), E(""), S(""), P([]))
            }, [e, t]), !e) return null;
        let C = !1 !== n.settings.showWater,
            j = !1 !== n.settings.showProtein,
            N = !1 !== n.settings.showCalories,
            T = !1 !== n.settings.showSleep,
            A = !1 !== n.settings.showWeight,
            M = !1 !== n.settings.showExercise,
            _ = !1 !== n.settings.showSupplements,
            D = n.settings.supplements,
            z = Number(l) > 0 || Number(f) > 0 || Number(h) > 0 || Number(b) > 0 || Number(x) > 0 || Number(k) > 0 || O.length > 0,
            I = o && z;

        function L(e) {
            P(t => t.some(t => t.name === e) ? t.filter(t => t.name !== e) : [...t, {
                name: e,
                qty: "1"
            }])
        }

        function R(e, t) {
            P(n => n.map(n => n.name === e ? {
                ...n,
                qty: t
            } : n))
        }
        return createPortal(React.default.createElement("div", {
            className: "wt-backdrop",
            style: {
                zIndex: 190
            },
            onClick: r
        }, React.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            style: {
                position: "fixed",
                zIndex: 191,
                bottom: 0,
                left: 0,
                right: 0,
                width: "100%",
                margin: 0,
                boxSizing: "border-box",
                background: "#151A21",
                color: "#FFF6DB",
                "--muted": "#5C7085",
                "--deep": "#1B4F72",
                "--line": "#D5E1EC",
                "--paper": "#F2F5F8"
            },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, "Enter Missed Items"), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 18
        }))), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: -6,
                marginBottom: 16
            }
        }, "Backfilled entries are timestamped 12:00 PM on the date below and marked as entered after the fact — they don't trigger today's goal toasts, and RX & Vitamins doses still adjust inventory but never change the upcoming schedule."), React.default.createElement("label", {
            className: "wt-field"
        }, "Date", React.default.createElement("input", {
            type: "date",
            value: o,
            onChange: e => i(e.target.value),
            "aria-label": "Backfill entry date"
        })), C && React.default.createElement("div", {
            className: "wt-field-row"
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Water (oz)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: l,
            onChange: e => u(e.target.value),
            "aria-label": "Backfill water amount"
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Description (optional)", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Water bottle",
            value: s,
            onChange: e => c(e.target.value)
        }))), j && React.default.createElement("div", {
            className: "wt-field-row"
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Protein (g)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: f,
            onChange: e => d(e.target.value),
            "aria-label": "Backfill protein amount"
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Description (optional)", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Protein shake",
            value: p,
            onChange: e => m(e.target.value)
        }))), N && React.default.createElement("div", {
            className: "wt-field-row"
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Calories", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: h,
            onChange: e => g(e.target.value),
            "aria-label": "Backfill calories amount"
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Description (optional)", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Lunch",
            value: y,
            onChange: e => v(e.target.value)
        }))), T && React.default.createElement("label", {
            className: "wt-field"
        }, "Sleep (hours)", React.default.createElement("input", {
            type: "number",
            inputMode: "decimal",
            placeholder: "0",
            value: b,
            onChange: e => w(e.target.value),
            "aria-label": "Backfill sleep hours"
        })), A && React.default.createElement("label", {
            className: "wt-field"
        }, "Weight (lbs)", React.default.createElement("input", {
            type: "number",
            inputMode: "decimal",
            placeholder: "0",
            value: x,
            onChange: e => E(e.target.value),
            "aria-label": "Backfill weight amount"
        })), M && React.default.createElement("label", {
            className: "wt-field"
        }, "Exercise (minutes)", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: k,
            onChange: e => S(e.target.value),
            "aria-label": "Backfill exercise minutes"
        })), _ && React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                fontWeight: 700,
                color: wD,
                textTransform: "uppercase",
                letterSpacing: ".04em",
                marginBottom: 8
            }
        }, "RX & Vitamins — tap everything taken"), 0 === D.length ? React.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 14
            }
        }, "Nothing set up yet. Add supplements and prescriptions in My Plan first.") : React.default.createElement(React.default.Fragment, null, React.default.createElement("div", {
            className: "wt-chip-row",
            style: {
                marginBottom: O.length > 0 ? 14 : 18
            }
        }, D.map(e => React.default.createElement("button", {
            key: e.id,
            type: "button",
            className: "wt-chip " + (O.some(t => t.name === e.name) ? "active" : ""),
            onClick: () => L(e.name)
        }, e.name))), O.length > 0 && React.default.createElement("div", {
            style: {
                marginBottom: 16
            }
        }, O.map(e => React.default.createElement("div", {
            key: e.name,
            className: "wt-qty-row"
        }, React.default.createElement("span", {
            className: "wt-qty-name"
        }, e.name), React.default.createElement("input", {
            type: "text",
            className: "wt-qty-input",
            placeholder: "Qty (e.g. 1 or 10mg)",
            value: e.qty,
            onChange: t => R(e.name, t.target.value)
        })))))), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginTop: 16
            },
            disabled: !I,
            onClick: () => {
                a(o, {
                    oz: Number(l) || 0,
                    ozDescription: s.trim(),
                    grams: Number(f) || 0,
                    gramsDescription: p.trim(),
                    calories: Number(h) || 0,
                    caloriesDescription: y.trim(),
                    sleepHours: Number(b) || 0,
                    weight: Number(x) || 0,
                    exerciseMinutes: Number(k) || 0,
                    supplements: O.filter(e => e.name)
                }), r()
            }
        }, "Log"))), document.body)
    }

    function RO({
        data: e,
        todayKey: t,
        onDeleteLog: n,
        onEditLogEntry: r,
        onEditNextDue: a,
        onDeleteLogForDate: onDeleteLogForDate,
        onSaveBackfill: onSaveBackfill
    }) {
        let [o, i] = (0, React.useState)(!1), [l, u] = (0, React.useState)(null), [backfillOpen, setBackfillOpen] = (0, React.useState)(!1), s = Object.keys(e.logs).filter(n => n !== t && (e.logs[n] || []).length > 0).sort().reverse(), c = e.logs[t] || [], f = new Set;
        c.forEach(e => {
            NS(e) && (e.items || []).forEach(e => f.add("string" == typeof e ? e : e.name))
        });
        let d = [...e.settings.treatments.map(e => ({
            ...e,
            kind: "treatment",
            status: AS(e, t)
        })).filter(e => "overdue" === e.status.state || "today" === e.status.state), ...e.settings.supplements.filter(e => !f.has(e.name)).map(e => ({
            ...e,
            kind: "supplement",
            status: DS(e, t)
        })).filter(e => "overdue" === e.status.state || "today" === e.status.state)].sort((e, t) => e.status.daysAway - t.status.daysAway);
        return React.default.createElement("div", null, React.default.createElement("div", {
            className: "wt-todo-today-sticky"
        }, React.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg"
        }, "To Do Today"), 0 === d.length ? React.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 22
            }
        }, "All Done for the Day 🎉") : React.default.createElement("div", {
            className: "wt-todo-today-scroll",
            style: {
                marginBottom: 22
            }
        }, d.map(e => React.default.createElement("div", {
            key: `${e.kind}-${e.id}`,
            className: `wt-treatment-row wt-treatment-${e.status.state}`
        }, "supplement" === e.kind ? React.default.createElement(Pill, {
            size: 15,
            className: "wt-log-icon"
        }) : React.default.createElement(Syringe, {
            size: 15,
            className: "wt-log-icon"
        }), React.default.createElement("div", {
            className: "wt-treatment-info"
        }, React.default.createElement("span", {
            className: "wt-treatment-name"
        }, e.name), React.default.createElement("span", {
            className: "wt-treatment-due-label",
            style: {
                display: "inline-flex",
                alignItems: "center",
                gap: 3
            }
        }, "overdue" === e.status.state ? React.default.createElement(React.default.Fragment, null, React.default.createElement(AlertCircle, {
            size: 12,
            "aria-hidden": "true"
        }), `${Math.abs(e.status.daysAway)} day${1===Math.abs(e.status.daysAway)?"":"s"} overdue`) : "Due today")), React.default.createElement("input", {
            type: "date",
            className: "wt-treatment-date-input",
            value: e.status.due,
            onChange: t => a(e.kind, e.id, t.target.value),
            "aria-label": `Change next due date for ${e.name}`
        }))))), React.default.createElement("div", {
            style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }
        }, React.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg",
            style: {
                margin: 0
            }
        }, "Today's log"), React.default.createElement("div", {
            style: {
                display: "flex",
                alignItems: "center",
                gap: 6
            }
        }, React.default.createElement("span", {
            style: {
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink-inverse)"
            }
        }, "Prior Days:"), React.default.createElement("button", {
            className: "wt-icon-btn",
            style: {
                color: "#fff",
                minWidth: 40,
                minHeight: 40,
                justifyContent: "center"
            },
            onClick: () => {
                u(null), i(!0)
            },
            "aria-label": "View past days"
        }, React.default.createElement(Clock, {
            size: 24
        })))), React.default.createElement("div", {
            className: "wt-today-log-scroll"
        }, 0 === c.length ? React.default.createElement("p", {
            className: "wt-empty-note"
        }, "Nothing logged yet today — head to the Log tab to get started.") : React.default.createElement("ul", {
            className: "wt-log-list"
        }, c.slice().sort((e, t) => rO(t) - rO(e)).map(e => IO(e, !0, r, n)))), React.default.createElement(LO, {
            open: o,
            historyDate: l,
            dates: s,
            entriesForDate: l && e.logs[l] || [],
            onClose: () => i(!1),
            onSelectDate: e => u(e),
            onBack: () => u(null),
            onEnterMissed: () => setBackfillOpen(!0),
            onDeleteEntry: t => onDeleteLogForDate(l, t)
        }), React.default.createElement(BackfillSheet, {
            open: backfillOpen,
            initialDate: l || t,
            data: e,
            onClose: () => setBackfillOpen(!1),
            onSave: onSaveBackfill
        }))
    }

    function BO(e) {
        return `${e%12==0?12:e%12}${e>=12?"p":"a"}`
    }

    function $O({
        data: e,
        onBack: t
    }) {
        let n = e.settings.supplements.filter(e => e.trackInventory),
            r = e.settings.treatments.filter(e => e.trackInventory);

        function a(t, n) {
            let r = function(t, n) {
                    let r = [];
                    return Object.keys(e.logs).sort().reverse().forEach(a => {
                        (e.logs[a] || []).forEach(e => {
                            e.type === n && (e.items || []).some(e => ("string" == typeof e ? e : e.name) === t) && r.push(a)
                        })
                    }), r
                }(t.name, n),
                a = QS(t),
                o = t.expirationDate ? YS(MS(t.expirationDate)) : null;
            return React.default.createElement("div", {
                key: t.id,
                className: "wt-card"
            }, React.default.createElement("div", {
                className: "wt-card-title"
            }, t.name), React.default.createElement("div", {
                style: {
                    fontSize: 13,
                    color: wD,
                    marginBottom: 8
                }
            }, `${t.qtyRemaining||0} remaining`, o ? ` · expires ${o}` : ""), a && React.default.createElement("div", {
                style: {
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: bS,
                    marginBottom: 8
                }
            }, a), React.default.createElement("div", {
                style: {
                    fontSize: 12,
                    color: wD,
                    marginBottom: 4,
                    fontWeight: 600
                }
            }, `Used ${r.length} time${1===r.length?"":"s"}`), r.length > 0 && React.default.createElement("div", {
                style: {
                    fontSize: 12,
                    color: wI,
                    lineHeight: 1.6
                }
            }, r.slice(0, 10).map(e => YS(MS(e))).join(", ") + (r.length > 10 ? ` … and ${r.length-10} more` : "")))
        }
        return React.default.createElement("div", null, React.default.createElement("div", {
            className: "wt-segment",
            style: {
                marginBottom: 14
            }
        }, React.default.createElement("button", {
            onClick: t
        }, "← Back to charts")), React.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg"
        }, "Subscriptions"), 0 === n.length && 0 === r.length ? React.default.createElement("p", {
            className: "wt-empty-note"
        }, "No tracked subscriptions yet. Turn on “Track inventory / subscription” for a supplement or treatment in Setup to see it here.") : React.default.createElement(React.default.Fragment, null, n.length > 0 && React.default.createElement("div", {
            className: "wt-section-label wt-section-label-strong"
        }, "RX & Vitamins"), n.map(e => a(e, "supplement")), r.length > 0 && React.default.createElement("div", {
            className: "wt-section-label wt-section-label-strong"
        }, "Treatments"), r.map(e => a(e, "treatment"))))
    }

    function FO({
        data: e,
        onDrShare: t
    }) {
        let [n, r] = (0, React.useState)("water"), [a, o] = (0, React.useState)("week"), [i, l] = (0, React.useState)(new Date), u = "combined" === n, s = "protein" === n ? "g" : "calories" === n ? "cal" : "oz", c = "protein" === n ? e.settings.goalProtein || 0 : "calories" === n ? e.settings.goalCalories || 0 : e.settings.goalOz || 0, f = "protein" === n ? "grams" : "calories" === n ? "calories" : "oz";

        function d(e) {
            r(e), "combined" === e && "day" === a && o("week")
        }
        let p = (0, React.useMemo)(() => {
                let t = {};
                return Object.keys(e.logs).sort().forEach(n => {
                    let r = (e.logs[n] || []).filter(e => "weight" === e.type);
                    if (r.length > 0) {
                        let e = r.slice().sort((e, t) => (t.timeMinutes || 0) - (e.timeMinutes || 0))[0];
                        t[n] = e.value
                    }
                }), Object.keys(t).sort().slice(-60).map(e => ({
                    date: e.slice(5),
                    weight: t[e]
                }))
            }, [e.logs]),
            m = (0, React.useMemo)(() => {
                let t = {};
                return Object.keys(e.logs).sort().forEach(n => {
                    let r = (e.logs[n] || []).reduce((e, t) => e + CS(t), 0);
                    r > 0 && (t[n] = Math.round(10 * r) / 10)
                }), Object.keys(t).sort().slice(-60).map(e => ({
                    date: e.slice(5),
                    hours: t[e]
                }))
            }, [e.logs]),
            {
                series: h,
                rangeLabel: g,
                total: y,
                avg: v,
                metCount: b,
                daysCounted: w,
                isCurrent: x,
                logCount: E
            } = (0, React.useMemo)(() => {
                let t = new Date;
                t.setHours(0, 0, 0, 0);
                let n = e.settings.goalOz || 0,
                    r = e.settings.goalProtein || 0,
                    o = e.settings.goalCalories || 0;
                e.settings.goalSleepHours;
                if (u) {
                    let l = [],
                        u = "",
                        s = !1;
                    if ("week" === a) {
                        let e = qS(i);
                        l = Array.from({
                            length: 7
                        }, (t, n) => VS(e, n)), u = `${YS(l[0])} – ${YS(l[6])}`, s = qS(i).getTime() === qS(t).getTime()
                    } else {
                        let e = GS(i),
                            n = XS(i);
                        l = Array.from({
                            length: n
                        }, (t, n) => VS(e, n)), u = aO(i), s = i.getFullYear() === t.getFullYear() && i.getMonth() === t.getMonth()
                    }
                    let c = l.map(i => {
                            let l = HS(i),
                                u = e.logs[l] || [],
                                s = u.reduce((e, t) => e + kS(t), 0),
                                c = u.reduce((e, t) => e + SS(t), 0),
                                f = u.reduce((e, t) => e + OS(t), 0);
                            return {
                                label: "week" === a ? fS[(i.getDay() + 6) % 7] : String(i.getDate()),
                                Water: n > 0 ? Math.round(s / n * 100) : 0,
                                Protein: r > 0 ? Math.round(c / r * 100) : 0,
                                Calories: o > 0 ? Math.round(f / o * 100) : 0,
                                isFuture: i.getTime() > t.getTime()
                            }
                        }),
                        f = c.filter(e => !e.isFuture),
                        d = f[f.length - 1] || {
                            Water: 0,
                            Protein: 0,
                            Calories: 0
                        };
                    return {
                        series: c,
                        rangeLabel: u,
                        total: 0,
                        avg: 0,
                        metCount: 0,
                        daysCounted: f.length,
                        isCurrent: s,
                        logCount: 0,
                        combinedLast: d
                    }
                }
                if ("day" === a) {
                    let n = HS(i) === HS(t),
                        r = e.logs[HS(i)] || [],
                        a = (new Date).getHours(),
                        o = {};
                    for (let e = 5; e <= 23; e++) o[e] = 0;
                    r.forEach(e => {
                        let t = Number(e[f]) || 0;
                        if (t <= 0) return;
                        let n = Math.floor(rO(e) / 60);
                        n < 5 && (n = 5), n > 23 && (n = 23), o[n] += t
                    });
                    let l = Object.keys(o).map(e => {
                            let t = Number(e);
                            return {
                                label: BO(t),
                                amount: o[t],
                                isFuture: n && t > a
                            }
                        }),
                        u = r.reduce((e, t) => e + (Number(t[f]) || 0), 0),
                        s = n ? "Today" : i.toLocaleDateString(void 0, {
                            weekday: "short",
                            month: "short",
                            day: "numeric"
                        }),
                        c = r.filter(e => (Number(e[f]) || 0) > 0).length;
                    return {
                        series: l,
                        rangeLabel: s,
                        total: u,
                        avg: 0,
                        metCount: 0,
                        daysCounted: 0,
                        isCurrent: n,
                        logCount: c
                    }
                }
                let l = [],
                    s = "",
                    d = !1;
                if ("week" === a) {
                    let e = qS(i);
                    l = Array.from({
                        length: 7
                    }, (t, n) => VS(e, n)), s = `${YS(l[0])} – ${YS(l[6])}`, d = qS(i).getTime() === qS(t).getTime()
                } else {
                    let e = GS(i),
                        n = XS(i);
                    l = Array.from({
                        length: n
                    }, (t, n) => VS(e, n)), s = aO(i), d = i.getFullYear() === t.getFullYear() && i.getMonth() === t.getMonth()
                }
                let p = l.map(n => {
                        let r = HS(n),
                            o = (e.logs[r] || []).reduce((e, t) => e + (Number(t[f]) || 0), 0);
                        return {
                            label: "week" === a ? fS[(n.getDay() + 6) % 7] : String(n.getDate()),
                            amount: o,
                            isFuture: n.getTime() > t.getTime()
                        }
                    }),
                    m = p.filter(e => !e.isFuture),
                    h = m.reduce((e, t) => e + t.amount, 0);
                return {
                    series: p,
                    rangeLabel: s,
                    total: h,
                    avg: m.length ? Math.round(h / m.length) : 0,
                    metCount: c > 0 ? m.filter(e => e.amount >= c).length : 0,
                    daysCounted: m.length,
                    isCurrent: d,
                    logCount: 0
                }
            }, [e, a, i, n]);
        let k = c > 0 ? Math.round(y / c * 100) : null,
            S = "day" === a ? [{
                value: y,
                label: `Total ${s}`
            }, {
                value: E,
                label: "Logs"
            }, {
                value: null != k ? `${k}%` : "—",
                label: "Of goal"
            }] : [{
                value: y,
                label: `Total ${s}`
            }, {
                value: v,
                label: `Avg ${s}/day`
            }, {
                value: `${b}/${w}`,
                label: "Goal met"
            }],
            O = "protein" === n ? "#27AE60" : "calories" === n ? "#E8823A" : "#2F80ED",
            P = u ? 10 * Math.ceil(Math.max(100, ...h.flatMap(e => [e.Water || 0, e.Protein || 0, e.Calories || 0])) / 10) : void 0;
        return "subscriptions" === n ? React.default.createElement($O, {
            data: e,
            onBack: () => d("water")
        }) : React.default.createElement("div", null, React.default.createElement("div", {
            className: "wt-segment",
            style: {
                marginBottom: 8
            }
        }, React.default.createElement("button", {
            className: "water" === n ? "active" : "",
            onClick: () => d("water")
        }, React.default.createElement(Droplet, {
            size: 12,
            style: {
                marginRight: 3,
                verticalAlign: -2
            }
        }), "Water"), React.default.createElement("button", {
            className: "protein" === n ? "active" : "",
            onClick: () => d("protein")
        }, React.default.createElement(Battery, {
            size: 12,
            style: {
                marginRight: 3,
                verticalAlign: -2
            }
        }), "Protein"), React.default.createElement("button", {
            className: "calories" === n ? "active" : "",
            onClick: () => d("calories")
        }, React.default.createElement(Flame, {
            size: 12,
            style: {
                marginRight: 3,
                verticalAlign: -2
            }
        }), "Cal"), React.default.createElement("button", {
            className: u ? "active" : "",
            onClick: () => d("combined")
        }, "All 3"), React.default.createElement("button", {
            className: "",
            onClick: () => d("subscriptions")
        }, "Subs")), React.default.createElement("div", {
            className: "wt-segment"
        }, !u && React.default.createElement("button", {
            className: "day" === a ? "active" : "",
            onClick: () => {
                o("day"), l(new Date)
            }
        }, "Day"), React.default.createElement("button", {
            className: "week" === a ? "active" : "",
            onClick: () => {
                o("week"), l(new Date)
            }
        }, "Week"), React.default.createElement("button", {
            className: "month" === a ? "active" : "",
            onClick: () => {
                o("month"), l(new Date)
            }
        }, "Month")), React.default.createElement("div", {
            className: "wt-range-nav"
        }, React.default.createElement("button", {
            onClick: function() {
                l("day" === a ? e => VS(e, -1) : "week" === a ? e => VS(e, -7) : e => new Date(e.getFullYear(), e.getMonth() - 1, 1))
            },
            "aria-label": "Previous"
        }, React.default.createElement(ChevronLeft, {
            size: 16
        })), React.default.createElement("span", {
            className: "wt-range-label"
        }, g), React.default.createElement("button", {
            onClick: function() {
                l("day" === a ? e => VS(e, 1) : "week" === a ? e => VS(e, 7) : e => new Date(e.getFullYear(), e.getMonth() + 1, 1))
            },
            disabled: x,
            "aria-label": "Next"
        }, React.default.createElement(ChevronRight, {
            size: 16
        }))), u ? React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            className: "wt-card-note",
            style: {
                marginBottom: 10
            }
        }, "Each bar group shows how close you got to each goal that day, as a percentage — so water, protein, and calories can sit on the same scale even though their units don't match."), React.default.createElement("div", {
            className: "wt-card",
            style: {
                paddingBottom: 4
            }
        }, React.default.createElement(ResponsiveContainer, {
            width: "100%",
            height: 220
        }, React.default.createElement(BarChart, {
            data: h,
            margin: {
                top: 8,
                right: 4,
                left: -18,
                bottom: 0
            }
        }, React.default.createElement(CartesianGrid, {
            vertical: !1,
            stroke: vS
        }), React.default.createElement(XAxis, {
            dataKey: "label",
            tick: {
                fontSize: 10,
                fill: wS
            },
            interval: "month" === a ? Math.ceil(h.length / 6) : 0,
            axisLine: {
                stroke: vS
            },
            tickLine: !1
        }), React.default.createElement(YAxis, {
            domain: [0, P],
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: !1,
            tickLine: !1
        }), React.default.createElement(Tooltip, {
            formatter: e => [`${e}%`, "of goal"],
            contentStyle: {
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${vS}`
            }
        }), React.default.createElement(Legend, {
            wrapperStyle: {
                fontSize: 11
            }
        }), React.default.createElement(ReferenceLine, {
            y: 100,
            stroke: dS,
            strokeDasharray: "3 3"
        }), React.default.createElement(Bar, {
            dataKey: "Water",
            fill: "#2F80ED",
            radius: [3, 3, 0, 0]
        }), React.default.createElement(Bar, {
            dataKey: "Protein",
            fill: "#27AE60",
            radius: [3, 3, 0, 0]
        }), React.default.createElement(Bar, {
            dataKey: "Calories",
            fill: "#E8823A",
            radius: [3, 3, 0, 0]
        }))))) : React.default.createElement(React.default.Fragment, null, React.default.createElement("div", {
            className: "wt-stat-row"
        }, S.map(e => React.default.createElement("div", {
            className: "wt-stat",
            key: e.label
        }, React.default.createElement("div", {
            className: "wt-stat-value"
        }, e.value), React.default.createElement("div", {
            className: "wt-stat-label"
        }, e.label)))), React.default.createElement("div", {
            className: "wt-card",
            style: {
                paddingBottom: 4
            }
        }, React.default.createElement(ResponsiveContainer, {
            width: "100%",
            height: 200
        }, React.default.createElement(BarChart, {
            data: h,
            margin: {
                top: 8,
                right: 8,
                left: -18,
                bottom: 0
            }
        }, React.default.createElement(CartesianGrid, {
            vertical: !1,
            stroke: vS
        }), React.default.createElement(XAxis, {
            dataKey: "label",
            tick: {
                fontSize: 10,
                fill: wS
            },
            interval: "month" === a ? Math.ceil(h.length / 6) : "day" === a ? 2 : 0,
            axisLine: {
                stroke: vS
            },
            tickLine: !1
        }), React.default.createElement(YAxis, {
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: !1,
            tickLine: !1
        }), React.default.createElement(Tooltip, {
            formatter: e => [`${e}${s}`, "Logged"],
            contentStyle: {
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${vS}`
            }
        }), "day" !== a && c > 0 && React.default.createElement(ReferenceLine, {
            y: c,
            stroke: hS,
            strokeDasharray: "4 4",
            label: {
                value: "Goal",
                position: "right",
                fontSize: 10,
                fill: wS
            }
        }), React.default.createElement(Bar, {
            dataKey: "amount",
            radius: [4, 4, 0, 0]
        }, h.map((e, t) => React.default.createElement(Cell, {
            key: t,
            fill: "day" !== a && c > 0 && e.amount >= c ? hS : O,
            opacity: e.isFuture ? .25 : 1
        }))))))), React.default.createElement("div", {
            className: "wt-divider"
        }), React.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg"
        }, "Weight Over Time"), 0 === p.length ? React.default.createElement("p", {
            className: "wt-empty-note"
        }, 'No weight logged yet — use "Log Weight" on the Log page to start a trend.') : React.default.createElement("div", {
            style: {
                width: "100%",
                height: 180
            }
        }, React.default.createElement(ResponsiveContainer, null, React.default.createElement(LineChart, {
            data: p,
            margin: {
                top: 8,
                right: 12,
                left: -12,
                bottom: 0
            }
        }, React.default.createElement(CartesianGrid, {
            strokeDasharray: "3 3",
            stroke: vS,
            vertical: !1
        }), React.default.createElement(XAxis, {
            dataKey: "date",
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: {
                stroke: vS
            },
            tickLine: !1
        }), React.default.createElement(YAxis, {
            domain: ["dataMin - 2", "dataMax + 2"],
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: !1,
            tickLine: !1
        }), React.default.createElement(Tooltip, {
            formatter: e => [`${e}lbs`, "Weight"],
            contentStyle: {
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${vS}`
            }
        }), React.default.createElement(Line, {
            type: "monotone",
            dataKey: "weight",
            stroke: "#16A394",
            strokeWidth: 2.5,
            dot: {
                r: 3,
                fill: "#16A394"
            }
        })))), React.default.createElement("div", {
            className: "wt-divider"
        }), React.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg"
        }, "Sleep Over Time"), 0 === m.length ? React.default.createElement("p", {
            className: "wt-empty-note"
        }, "No sleep logged yet — log a night's sleep on the Log page to start a trend.") : React.default.createElement("div", {
            style: {
                width: "100%",
                height: 180
            }
        }, React.default.createElement(ResponsiveContainer, null, React.default.createElement(LineChart, {
            data: m,
            margin: {
                top: 8,
                right: 12,
                left: -12,
                bottom: 0
            }
        }, React.default.createElement(CartesianGrid, {
            strokeDasharray: "3 3",
            stroke: vS,
            vertical: !1
        }), React.default.createElement(XAxis, {
            dataKey: "date",
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: {
                stroke: vS
            },
            tickLine: !1
        }), React.default.createElement(YAxis, {
            domain: [0, "dataMax + 1"],
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: !1,
            tickLine: !1
        }), React.default.createElement(Tooltip, {
            formatter: e => [`${e}hrs`, "Sleep"],
            contentStyle: {
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${vS}`
            }
        }), e.settings.goalSleepHours > 0 && React.default.createElement(ReferenceLine, {
            y: e.settings.goalSleepHours,
            stroke: hS,
            strokeDasharray: "4 4",
            label: {
                value: "Goal",
                position: "right",
                fontSize: 10,
                fill: wS
            }
        }), React.default.createElement(Line, {
            type: "monotone",
            dataKey: "hours",
            stroke: "#7B61FF",
            strokeWidth: 2.5,
            dot: {
                r: 3,
                fill: "#7B61FF"
            }
        })))), React.default.createElement("div", {
            className: "wt-section-label wt-section-label-strong"
        }, "Health Summary"), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("p", {
            className: "wt-card-note",
            style: {
                marginBottom: 12
            }
        }, "A clean summary of your goals, weight trend, supplements, and treatments — ready to print or save as a PDF to bring to a doctor or health advisor."), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%"
            },
            onClick: t
        }, React.default.createElement(ClipboardList, {
            size: 16
        }), " Share with your doctor")))
    }

    function UO({
        data: e,
        notifPermission: t,
        onEnableInApp: n,
        onDisableInApp: r,
        onChangeInAppInterval: a,
        onTestReminder: o,
        onChangeCalendarField: i,
        onDownloadICS: l,
        onTogglePush: u,
        onTestPush: s,
        pushBusy: c,
        pushError: f,
        onChangeBedtime: d,
        onChangeSupplementReminder: p,
        onChangeTreatmentReminder: m
    }) {
        let h = e.settings.reminders.inApp,
            g = e.settings.reminders.calendar,
            y = e.settings.reminders.push,
            v = e.settings.reminders.bedtime,
            b = e.settings.reminders.supplementReminder,
            w = e.settings.reminders.treatmentReminder,
            x = typeof window < "u" && "serviceWorker" in navigator && "PushManager" in window;
        return React.default.createElement("div", null, React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Clock, {
            size: 15
        }), " Reminder schedule"), React.default.createElement("p", {
            className: "wt-card-note"
        }, "Used by both push notifications and the calendar backup below."), React.default.createElement("div", {
            className: "wt-field-row"
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Start time", React.default.createElement("input", {
            type: "time",
            value: g.startTime,
            onChange: e => i("startTime", e.target.value)
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "End time", React.default.createElement("input", {
            type: "time",
            value: g.endTime,
            onChange: e => i("endTime", e.target.value)
        }))), React.default.createElement("label", {
            className: "wt-field"
        }, "Every", React.default.createElement("select", {
            value: g.intervalHours,
            onChange: e => i("intervalHours", Number(e.target.value))
        }, React.default.createElement("option", {
            value: 1
        }, "1 hour"), React.default.createElement("option", {
            value: 1.5
        }, "1.5 hours"), React.default.createElement("option", {
            value: 2
        }, "2 hours"), React.default.createElement("option", {
            value: 3
        }, "3 hours"), React.default.createElement("option", {
            value: 4
        }, "4 hours")))), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Bell, {
            size: 15
        }), " Push notifications (recommended)"), React.default.createElement("p", {
            className: "wt-card-note"
        }, "Real notifications from your own server, on the schedule above — arrive even with this closed. Requires the push server (see README) to be deployed and ", React.default.createElement("code", null, "config.js"), " pointed at it."), x ? React.default.createElement(React.default.Fragment, null, React.default.createElement("div", {
            className: "wt-toggle-row"
        }, React.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, y.subscribed ? "Enabled on this device" : "Enabled"), React.default.createElement("button", {
            className: "wt-switch " + (y.subscribed ? "on" : ""),
            onClick: u,
            disabled: c,
            "aria-label": "Toggle push notifications"
        }, React.default.createElement("span", null))), y.subscribed && React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%"
            },
            onClick: s,
            disabled: c
        }, "Send test push"), f && React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 10,
                marginBottom: 0
            }
        }, f)) : React.default.createElement("p", {
            className: "wt-empty-note"
        }, "Push isn't supported in this browser/context. On iPhone, add this app to your home screen first (Share → Add to Home Screen), then open it from there.")), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Moon, {
            size: 15
        }), " Bedtime reminder"), React.default.createElement("p", {
            className: "wt-card-note"
        }, "A separate push notification at whatever time you want to start winding down — independent of the schedule above, and only sent once a day."), React.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: v.enabled ? 14 : 0
            }
        }, React.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), React.default.createElement("button", {
            className: "wt-switch " + (v.enabled ? "on" : ""),
            onClick: () => d("enabled", !v.enabled),
            "aria-label": "Toggle bedtime reminder"
        }, React.default.createElement("span", null))), v.enabled && React.default.createElement("label", {
            className: "wt-field",
            style: {
                marginBottom: 0
            }
        }, "Lights Out time", React.default.createElement("input", {
            type: "time",
            value: v.time,
            onChange: e => d("time", e.target.value)
        })), v.enabled && !y.subscribed && React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Push notifications are off above — turn those on too, or this won't actually send anything.")), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Pill, {
            size: 15
        }), " Supplement reminder"), React.default.createElement("p", {
            className: "wt-card-note"
        }, "A daily push notification reminding you to take your supplements and prescriptions — pick whatever time works, like 10am."), React.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: b.enabled ? 14 : 0
            }
        }, React.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), React.default.createElement("button", {
            className: "wt-switch " + (b.enabled ? "on" : ""),
            onClick: () => p("enabled", !b.enabled),
            "aria-label": "Toggle supplement reminder"
        }, React.default.createElement("span", null))), b.enabled && React.default.createElement("label", {
            className: "wt-field",
            style: {
                marginBottom: 0
            }
        }, "Reminder time", React.default.createElement("input", {
            type: "time",
            value: b.time,
            onChange: e => p("time", e.target.value)
        })), b.enabled && !y.subscribed && React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Push notifications are off above — turn those on too, or this won't actually send anything.")), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Syringe, {
            size: 15
        }), " Treatment reminder"), React.default.createElement("p", {
            className: "wt-card-note"
        }, "A daily push notification if anything you're tracking in Treatments is due today or overdue — names which one, so you know what to log."), React.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: w.enabled ? 14 : 0
            }
        }, React.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), React.default.createElement("button", {
            className: "wt-switch " + (w.enabled ? "on" : ""),
            onClick: () => m("enabled", !w.enabled),
            "aria-label": "Toggle treatment reminder"
        }, React.default.createElement("span", null))), w.enabled && React.default.createElement("label", {
            className: "wt-field",
            style: {
                marginBottom: 0
            }
        }, "Reminder time", React.default.createElement("input", {
            type: "time",
            value: w.time,
            onChange: e => m("time", e.target.value)
        })), w.enabled && !y.subscribed && React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Push notifications are off above — turn those on too, or this won't actually send anything.")), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Bell, {
            size: 15
        }), " In-app nudge (bonus)"), React.default.createElement("p", {
            className: "wt-card-note"
        }, "A shorter-interval nudge while this tab is open and the screen is on — separate from the schedule above. Goes quiet the moment you lock your phone or switch apps."), React.default.createElement("div", {
            className: "wt-toggle-row"
        }, React.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), React.default.createElement("button", {
            className: "wt-switch " + (h.enabled ? "on" : ""),
            onClick: () => h.enabled ? r() : n(h.intervalMin),
            "aria-label": "Toggle in-app reminder"
        }, React.default.createElement("span", null))), React.default.createElement("label", {
            className: "wt-field"
        }, "Remind me every", React.default.createElement("select", {
            value: h.intervalMin,
            onChange: e => a(Number(e.target.value))
        }, React.default.createElement("option", {
            value: 30
        }, "30 minutes"), React.default.createElement("option", {
            value: 60
        }, "1 hour"), React.default.createElement("option", {
            value: 90
        }, "1.5 hours"), React.default.createElement("option", {
            value: 120
        }, "2 hours"))), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%"
            },
            onClick: o
        }, "Send test reminder"), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Browser notifications: ", "granted" === t ? "allowed on this device" : "denied" === t ? "blocked — you'll still see the in-app banner" : "not yet requested")), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Download, {
            size: 15
        }), " Calendar backup (.ics)"), React.default.createElement("p", {
            className: "wt-card-note"
        }, "No server required. Generates a file with recurring reminders on the schedule above — import it into your phone's Calendar app once for a zero-maintenance fallback."), React.default.createElement("button", {
            className: "wt-btn-primary",
            onClick: l
        }, React.default.createElement(Download, {
            size: 16
        }), " Download calendar reminders"), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                marginTop: 10,
                marginBottom: 0,
                lineHeight: 1.5
            }
        }, 'iPhone: open the file and tap "Add All" in Calendar. Android: open it with the Google Calendar app. These use your device\'s local time, so re-download if you change timezones for a trip.')))
    }

    function TrackerRow({
        icon: Icon,
        iconBg,
        iconColor,
        label,
        goalDisplay,
        on,
        onToggle,
        onOpen
    }) {
        return React.default.createElement("div", {
            className: "wt-plan-card wt-tracker-col-clickable" + (on ? "" : " off"),
            style: {
                border: `2px solid ${iconColor}`
            },
            onClick: onOpen
        }, React.default.createElement("div", {
            className: "wt-plan-card-dim" + (on ? "" : " off")
        }, React.default.createElement("div", {
            style: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                width: "100%",
                paddingRight: 52
            }
        }, React.default.createElement("div", {
            className: "wt-plan-card-icon",
            style: {
                background: iconBg
            }
        }, React.default.createElement(Icon, {
            size: 16,
            color: iconColor,
            fill: iconColor
        })), React.default.createElement("span", {
            className: "wt-plan-card-title"
        }, label)), null !== goalDisplay && React.default.createElement("div", {
            className: "wt-plan-card-goal"
        }, goalDisplay), React.default.createElement("div", {
            className: "wt-plan-card-status" + (on ? "" : " off")
        }, on ? "● Active" : "○ Off")), React.default.createElement("div", {
            className: "wt-plan-card-toggle-area"
        }, React.default.createElement("button", {
            className: "wt-switch " + (on ? "on" : ""),
            onClick: e => {
                e.stopPropagation(), onToggle()
            },
            "aria-label": `Toggle ${label} on Log page`
        }, React.default.createElement("span", null)), React.default.createElement("span", {
            style: {
                fontSize: 10,
                color: "var(--muted)",
                fontWeight: 600,
                marginTop: 2,
                display: "block",
                textAlign: "center"
            }
        }, "Track")))
    }

    function TrackerSheet({
        tracker,
        onClose
    }) {
        return tracker ? React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: onClose
        }, React.default.createElement("div", {
            className: "wt-sheet wt-plan-bottom-sheet",
            style: {
                paddingBottom: 88,
                borderColor: tracker.borderColor
            },
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, tracker.label), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: onClose,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 20
        }))), tracker.hasGoal && React.default.createElement(React.default.Fragment, null, React.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            className: "wt-plan-goal-input",
            value: tracker.value,
            onChange: e => tracker.onChange(e.target.value)
        }), React.default.createElement("div", {
            className: "wt-plan-goal-unit"
        }, tracker.unit)), React.default.createElement("button", {
            className: "wt-btn-primary wt-plan-save-btn",
            style: {
                width: "100%",
                marginTop: 16
            },
            onClick: () => {
                tracker.onCommit(), onClose()
            }
        }, "Save"))) : null
    }

    function RegimenSummaryCard({
        icon: Icon,
        iconBg,
        iconColor,
        label,
        count,
        preview,
        expanded,
        onClick
    }) {
        return React.default.createElement("button", {
            type: "button",
            className: "wt-regimen-card",
            onClick: onClick
        }, React.default.createElement("div", {
            className: "wt-regimen-card-title"
        }, React.default.createElement("span", {
            style: {
                display: "flex",
                alignItems: "center",
                gap: 8
            }
        }, Icon && React.default.createElement("div", {
            className: "wt-plan-card-icon",
            style: {
                background: iconBg,
                width: 32,
                height: 32
            }
        }, React.default.createElement(Icon, {
            size: 18,
            color: iconColor
        })), label), React.default.createElement("span", {
            className: "wt-regimen-card-count"
        }, `(${count}) ${expanded ? "⌄" : "›"}`)), preview && React.default.createElement("div", {
            className: "wt-regimen-card-preview"
        }, preview))
    }

    function PlanSheet({
        title,
        onClose,
        children
    }) {
        return React.default.createElement("div", {
            className: "wt-backdrop",
            onClick: onClose
        }, React.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            onClick: e => e.stopPropagation()
        }, React.default.createElement("div", {
            className: "wt-sheet-header"
        }, React.default.createElement("h3", null, title), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: onClose,
            "aria-label": "Close"
        }, React.default.createElement(XIcon, {
            size: 20
        }))), children))
    }

    function WO({
        data: e,
        onUpdateGoal: t,
        onUpdateGoalProtein: n,
        onUpdateGoalCalories: r,
        onUpdateGoalSleep: a,
        onUpdateGoalWeight: o,
        onUpdateGoalExerciseMinutes: i,
        onToggleShowWater: l,
        onToggleShowProtein: u,
        onToggleShowCalories: s,
        onToggleShowSleep: c,
        onToggleShowWeight: f,
        onToggleShowSupplements: d,
        onToggleShowTreatments: p,
        onToggleShowExercise: m,
        onAddPreset: h,
        onEditPreset: g,
        onDeletePreset: y,
        onAddSupplement: v,
        onEditSupplement: b,
        onDeleteSupplement: w,
        onAddTreatment: x,
        onEditTreatment: E,
        onDeleteTreatment: k
    }) {
        let [S, O] = (0, React.useState)(String(e.settings.goalOz || "")), [P, C] = (0, React.useState)(String(e.settings.goalProtein || "")), [j, N] = (0, React.useState)(String(e.settings.goalCalories || "")), [T, A] = (0, React.useState)(String(e.settings.goalSleepHours || "")), [M, _] = (0, React.useState)(!1), [D, z] = (0, React.useState)(null), [I, L] = (0, React.useState)(!1), [R, B] = (0, React.useState)(null), [$, F] = (0, React.useState)(!1), [U, W] = (0, React.useState)(null), [expandedList, setExpandedList] = (0, React.useState)(null), [openTracker, setOpenTracker] = (0, React.useState)(null), [showAddPartner, setShowAddPartner] = (0, React.useState)(!1);
        (0, React.useEffect)(() => {
            O(String(e.settings.goalOz || ""))
        }, [e.settings.goalOz]), (0, React.useEffect)(() => {
            C(String(e.settings.goalProtein || ""))
        }, [e.settings.goalProtein]), (0, React.useEffect)(() => {
            N(String(e.settings.goalCalories || ""))
        }, [e.settings.goalCalories]), (0, React.useEffect)(() => {
            A(String(e.settings.goalSleepHours || ""))
        }, [e.settings.goalSleepHours]);
        let [H, q] = (0, React.useState)(String(e.settings.goalWeight || "")), [V, G] = (0, React.useState)(String(e.settings.goalExerciseMinutes || ""));
        (0, React.useEffect)(() => {
            q(String(e.settings.goalWeight || ""))
        }, [e.settings.goalWeight]), (0, React.useEffect)(() => {
            G(String(e.settings.goalExerciseMinutes || ""))
        }, [e.settings.goalExerciseMinutes]);
        let X = !1 !== e.settings.showWater,
            Y = !1 !== e.settings.showProtein,
            K = !1 !== e.settings.showCalories,
            Q = !1 !== e.settings.showSleep,
            Z = !1 !== e.settings.showWeight,
            J = !1 !== e.settings.showSupplements,
            ee = !1 !== e.settings.showTreatments,
            te = !1 !== e.settings.showExercise,
            selfManagedItems = [...e.settings.supplements, ...e.settings.treatments].sort((e, t) => e.name.localeCompare(t.name)),
            selfManagedPreview = selfManagedItems.slice(0, 3).map(e => e.name).join(" · ") + (selfManagedItems.length > 3 ? " · ..." : "");
        return React.default.createElement("div", {
            style: {
                overflowX: "hidden"
            }
        }, React.default.createElement("div", {
            className: "wt-plan-section-label"
        }, "What I'm Tracking"), React.default.createElement("div", {
            className: "wt-plan-grid"
        }, React.default.createElement(TrackerRow, {
            icon: Droplet,
            iconBg: "var(--water-chip)",
            iconColor: "var(--water)",
            label: "Water",
            goalDisplay: e.settings.goalOz > 0 ? React.default.createElement(React.default.Fragment, null, React.default.createElement("strong", {
                style: {
                    fontWeight: 700
                }
            }, "Target: "), `${e.settings.goalOz} oz / day`) : "Set a goal",
            on: X,
            onToggle: () => l(!X),
            onOpen: () => setOpenTracker({
                label: "Water",
                unit: "oz / day",
                borderColor: "var(--water)",
                hasGoal: !0,
                value: S,
                onChange: O,
                onCommit: () => {
                    let n = Number(S);
                    n > 0 ? t(n) : O(String(e.settings.goalOz))
                }
            })
        }), React.default.createElement(TrackerRow, {
            icon: Battery,
            iconBg: "var(--protein-chip)",
            iconColor: "var(--protein)",
            label: "Protein",
            goalDisplay: e.settings.goalProtein > 0 ? React.default.createElement(React.default.Fragment, null, React.default.createElement("strong", {
                style: {
                    fontWeight: 700
                }
            }, "Target: "), `${e.settings.goalProtein} g / day`) : "Set a goal",
            on: Y,
            onToggle: () => u(!Y),
            onOpen: () => setOpenTracker({
                label: "Protein",
                unit: "g / day",
                borderColor: "var(--protein)",
                hasGoal: !0,
                value: P,
                onChange: C,
                onCommit: () => {
                    let t = Number(P);
                    t > 0 ? n(t) : C(String(e.settings.goalProtein))
                }
            })
        }), React.default.createElement(TrackerRow, {
            icon: Flame,
            iconBg: "var(--calories-chip)",
            iconColor: "var(--calories)",
            label: "Calories",
            goalDisplay: e.settings.goalCalories > 0 ? React.default.createElement(React.default.Fragment, null, React.default.createElement("strong", {
                style: {
                    fontWeight: 700
                }
            }, "Target: "), `${e.settings.goalCalories} cal / day`) : "Set a goal",
            on: K,
            onToggle: () => s(!K),
            onOpen: () => setOpenTracker({
                label: "Calories",
                unit: "cal / day",
                borderColor: "var(--calories)",
                hasGoal: !0,
                value: j,
                onChange: N,
                onCommit: () => {
                    let t = Number(j);
                    t > 0 ? r(t) : N(String(e.settings.goalCalories))
                }
            })
        }), React.default.createElement(TrackerRow, {
            icon: Bed,
            iconBg: "var(--sleep-chip)",
            iconColor: "var(--sleep)",
            label: "Sleep",
            goalDisplay: e.settings.goalSleepHours > 0 ? React.default.createElement(React.default.Fragment, null, React.default.createElement("strong", {
                style: {
                    fontWeight: 700
                }
            }, "Target: "), `${e.settings.goalSleepHours} hrs / night`) : "Set a goal",
            on: Q,
            onToggle: () => c(!Q),
            onOpen: () => setOpenTracker({
                label: "Sleep",
                unit: "hrs / night",
                borderColor: "var(--sleep)",
                hasGoal: !0,
                value: T,
                onChange: A,
                onCommit: () => {
                    let t = Number(T);
                    t > 0 ? a(t) : A(String(e.settings.goalSleepHours))
                }
            })
        }), React.default.createElement(TrackerRow, {
            icon: Weight,
            iconBg: "var(--weight-chip)",
            iconColor: "var(--weight)",
            label: "Weight",
            goalDisplay: e.settings.goalWeight > 0 ? `Target ${e.settings.goalWeight} lbs` : "Set a goal",
            on: Z,
            onToggle: () => f(!Z),
            onOpen: () => setOpenTracker({
                label: "Weight",
                unit: "lbs target",
                borderColor: "var(--weight)",
                hasGoal: !0,
                value: H,
                onChange: q,
                onCommit: () => {
                    let t = Number(H);
                    t > 0 ? o(t) : q(String(e.settings.goalWeight))
                }
            })
        }), React.default.createElement(TrackerRow, {
            icon: Dumbbell,
            iconBg: "var(--exercise-chip)",
            iconColor: "var(--exercise)",
            label: "Exercise",
            goalDisplay: e.settings.goalExerciseMinutes > 0 ? React.default.createElement(React.default.Fragment, null, React.default.createElement("strong", {
                style: {
                    fontWeight: 700
                }
            }, "Target: "), `${e.settings.goalExerciseMinutes} min / day`) : "Set a goal",
            on: te,
            onToggle: () => m(!te),
            onOpen: () => setOpenTracker({
                label: "Exercise",
                unit: "min / day",
                borderColor: "var(--exercise)",
                hasGoal: !0,
                value: V,
                onChange: G,
                onCommit: () => {
                    let t = Number(V);
                    t > 0 ? i(t) : G(String(e.settings.goalExerciseMinutes))
                }
            })
        }), React.default.createElement(TrackerRow, {
            icon: Pill,
            iconBg: "var(--meds-chip)",
            iconColor: "var(--meds)",
            label: "RX & Vitamins",
            goalDisplay: null,
            on: J,
            onToggle: () => d(!J),
            onOpen: () => setOpenTracker({
                label: "RX & Vitamins",
                borderColor: "var(--meds)",
                hasGoal: !1
            })
        }), React.default.createElement(TrackerRow, {
            icon: Syringe,
            iconBg: "var(--treatment-chip)",
            iconColor: "var(--treatment)",
            label: "Treatments",
            goalDisplay: null,
            on: ee,
            onToggle: () => p(!ee),
            onOpen: () => setOpenTracker({
                label: "Treatments",
                borderColor: "var(--treatment)",
                hasGoal: !1
            })
})), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: "var(--ink-inverse)",
                margin: "6px 0 0",
                textAlign: "center"
            }
        }, "Off trackers stay visible here, dimmed — they're hidden on Log It! and still counted in Reports."), React.default.createElement("div", {
            className: "wt-plan-section-label"
        }, "My Treatments"), React.default.createElement("div", {
            className: "wt-regimen-card clinic"
        }, React.default.createElement("div", {
            className: "wt-regimen-card-title"
        }, React.default.createElement("span", null, "Austin Drip Lounge"), React.default.createElement("span", {
            className: "wt-regimen-live-badge"
        }, "● Live")), React.default.createElement("div", {
            className: "wt-regimen-item-list"
        }, "IV Hydration Protocol", React.default.createElement("br", null), "B12 Injection", React.default.createElement("br", null), "Vitamin D3 (clinic protocol)"), React.default.createElement("div", {
            className: "wt-regimen-clinic-stats"
        }, "3 sessions remaining · Next: Sep 3"), React.default.createElement("div", {
            style: {
                display: "flex",
                gap: 10,
                marginTop: 12
            }
        }, React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                flex: 1
            }
        }, "Log Today"), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            }
        }, "View Details"))), React.default.createElement("button", {
            type: "button",
            className: "wt-regimen-card wt-regimen-add-partner",
            onClick: () => setShowAddPartner(!0)
        }, React.default.createElement(Plus, {
            size: 20
        }), " Add Treatment Provider"), React.default.createElement(RegimenSummaryCard, {
            icon: Users,
            iconBg: "#E0F2F1",
            iconColor: "#00695C",
            label: "Self-Managed",
            count: selfManagedItems.length,
            preview: selfManagedPreview,
            expanded: "selfManaged" === expandedList,
            onClick: () => setExpandedList("selfManaged" === expandedList ? null : "selfManaged")
        }), "selfManaged" === expandedList && React.default.createElement(PlanSheet, {
            title: "Self-Managed",
            onClose: () => setExpandedList(null)
        }, React.default.createElement("div", {
            className: "wt-section-label",
            style: {
                color: "var(--ink-inverse)"
            }
        }, "Supplements & Prescriptions"), 0 === e.settings.supplements.length && React.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 10
            }
        }, "Nothing added yet. Add the vitamins, supplements, and medicines you take regularly so they show up as one-tap options in Log Supplements & Prescriptions."), [...e.settings.supplements].sort((e, t) => e.name.localeCompare(t.name)).map(e => React.default.createElement("div", {
            key: e.id,
            className: "wt-preset-row"
        }, React.default.createElement("span", {
            className: "wt-preset-name"
        }, e.name), QS(e) && React.default.createElement("span", {
            style: {
                fontSize: 11,
                fontWeight: 700,
                color: bS,
                marginRight: 4,
                whiteSpace: "nowrap"
            }
        }, QS(e)), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => {
                B(e), L(!0)
            },
            "aria-label": "Edit item"
        }, React.default.createElement(Pencil, {
            size: 14
        })), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => w(e.id),
            "aria-label": "Delete item"
        }, React.default.createElement(Trash2, {
            size: 14
        })))), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 4
            },
            onClick: () => {
                B(null), L(!0)
            }
        }, React.default.createElement(Plus, {
            size: 15
        }), " Add supplement or medicine"), React.default.createElement("div", {
            className: "wt-section-label",
            style: {
                color: "var(--ink-inverse)"
            }
        }, "Treatments"), 0 === e.settings.treatments.length && React.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 10
            }
        }, "Nothing added yet. Add periodic treatments — drips, shots, PT sessions, anything on a recurring schedule — so you can log them and see when the next one's due."), [...e.settings.treatments].sort((e, t) => e.name.localeCompare(t.name)).map(e => React.default.createElement("div", {
            key: e.id,
            className: "wt-preset-row"
        }, React.default.createElement("span", {
            className: "wt-preset-name"
        }, e.name, e.intervalDays > 0 ? ` · every ${e.intervalDays}d` : " · history only"), QS(e) && React.default.createElement("span", {
            style: {
                fontSize: 11,
                fontWeight: 700,
                color: bS,
                marginRight: 4,
                whiteSpace: "nowrap"
            }
        }, QS(e)), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => {
                W(e), F(!0)
            },
            "aria-label": "Edit treatment"
        }, React.default.createElement(Pencil, {
            size: 14
        })), React.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => k(e.id),
            "aria-label": "Delete treatment"
        }, React.default.createElement(Trash2, {
            size: 14
        })))), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 4
            },
            onClick: () => {
                W(null), F(!0)
            }
        }, React.default.createElement(Plus, {
            size: 15
        }), " Add a treatment")), React.default.createElement(OO, {
            open: M,
            initial: D,
            onClose: () => _(!1),
            onSave: e => {
                D ? g(D.id, e.name, e.oz, e.grams, e.calories) : h(e.name, e.oz, e.grams, e.calories), _(!1)
            }
        }), React.default.createElement(CO, {
            open: I,
            initial: R,
            onClose: () => L(!1),
            onSave: (e, t, n, r, a) => {
                R ? b(R.id, e, t, n, r, a) : v(e, t, n, r, a), L(!1)
            }
        }), React.default.createElement(jO, {
            open: $,
            initial: U,
            onClose: () => F(!1),
            onSave: (e, t, n, r, a) => {
                U ? E(U.id, e, t, n, r, a) : x(e, t, n, r, a), F(!1)
            }
        }), React.default.createElement(TrackerSheet, {
            tracker: openTracker,
            onClose: () => setOpenTracker(null)
        }),
        // PLACEHOLDER — partner onboarding sheet, fields for design review only, no data model wired
        showAddPartner && React.default.createElement(PlanSheet, {
            title: "Add Partner",
            onClose: () => setShowAddPartner(!1)
        }, React.default.createElement("label", {
            className: "wt-field"
        }, "Partner/Clinic name", React.default.createElement("input", {
            type: "text"
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Protocol code", React.default.createElement("input", {
            type: "text"
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Provider contact", React.default.createElement("input", {
            type: "text"
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Number of sessions", React.default.createElement("input", {
            type: "number",
            inputMode: "numeric"
        })), React.default.createElement("label", {
            className: "wt-field"
        }, "Next appointment date", React.default.createElement("input", {
            type: "date"
        })), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginTop: 8
            }
        }, "Request Partnership")))
    }

    function HO({
        data: e,
        onExportCSV: t,
        onExportBackup: n,
        onImportBackup: r,
        onResetAll: a,
        onOpenFeedback: o,
        onToggleFeedbackWatch: i,
        onUpdateTesterName: l,
        onToggleCloudBackup: u,
        onBackupNow: s,
        onRestoreFromCloud: c,
        notifPermission: f,
        onEnableInApp: d,
        onDisableInApp: p,
        onChangeInAppInterval: m,
        onTestReminder: h,
        onChangeCalendarField: g,
        onDownloadICS: y,
        onTogglePush: v,
        onTestPush: b,
        pushBusy: w,
        pushError: x,
        onChangeBedtime: E,
        onChangeSupplementReminder: k,
        onChangeTreatmentReminder: S,
        onRequestLogin: O,
        onSignOut: P,
        onRestoreFromAccount: C,
        onAccountBackupNow: j,
        onOpenDoctorShare: N
    }) {
        let [T, A] = (0, React.useState)(e.settings.testerName || ""), [M, _] = (0, React.useState)(!1), D = e.settings.cloudBackup || {
            enabled: !1,
            code: null,
            lastSavedAt: null
        }, z = e.settings.account || {
            email: null,
            sessionToken: null
        }, [I, L] = (0, React.useState)(""), [R, B] = (0, React.useState)("idle"), [$, F] = (0, React.useState)(""), [U, W] = (0, React.useState)(!1), [H, q] = (0, React.useState)(!1), V = (0, React.useRef)(null);
        return (0, React.useEffect)(() => {
            A(e.settings.testerName || "")
        }, [e.settings.testerName]), React.default.createElement("div", {
            className: "wt-settings-tab"
        }, React.default.createElement("label", {
            className: "wt-field",
            style: {
                marginBottom: 10
            }
        }, "Your name (so we know who's giving feedback)", React.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Sarah M.",
            value: T,
            onChange: e => A(e.target.value),
            onBlur: () => l(T)
        })), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                marginBottom: 12
            },
            onClick: () => q(!0)
        }, "How to use this"), React.default.createElement("button", {
            className: "wt-btn-primary wt-tracker-btn-sleep",
            style: {
                marginBottom: 18
            },
            onClick: o
        }, "Give Feedback"), React.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: 18,
                marginTop: -8
            }
        }, React.default.createElement("span", {
            style: {
                fontSize: 11.5,
                color: "var(--ink-inverse)",
                maxWidth: 260
            }
        }, "Notify me (push) when new feedback comes in"), React.default.createElement("button", {
            className: "wt-switch " + (e.settings.feedbackWatching ? "on" : ""),
            onClick: () => i(!e.settings.feedbackWatching),
            "aria-label": "Toggle feedback notifications"
        }, React.default.createElement("span", null))), React.default.createElement("div", {
            className: "wt-section-label"
        }, "Reminders"), React.default.createElement(UO, {
            data: e,
            notifPermission: f,
            onEnableInApp: d,
            onDisableInApp: p,
            onChangeInAppInterval: m,
            onTestReminder: h,
            onChangeCalendarField: g,
            onDownloadICS: y,
            onTogglePush: v,
            onTestPush: b,
            pushBusy: w,
            pushError: x,
            onChangeBedtime: E,
            onChangeSupplementReminder: k,
            onChangeTreatmentReminder: S
        }), React.default.createElement("div", {
            className: "wt-section-label"
        }, "Account"), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Mail, {
            size: 15
        }), " Sign in"), z.email ? React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            className: "wt-card-note"
        }, "Signed in as ", React.default.createElement("b", null, z.email), ". Your data backs up here automatically too — no recovery code needed on a new device, just sign in."), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginBottom: 8
            },
            onClick: j
        }, "Back up now"), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginBottom: 8
            },
            onClick: C
        }, "Restore from my account"), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%"
            },
            onClick: P
        }, "Sign out")) : "sent" === R ? React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            className: "wt-card-note"
        }, "Check ", React.default.createElement("b", null, I), " for a sign-in link — it works for 15 minutes."), React.default.createElement("button", {
            className: "wt-btn-text",
            onClick: () => B("idle")
        }, "Use a different email")) : React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            className: "wt-card-note"
        }, "Sign in with just your email — no password. This is the first step toward syncing your data across devices; for now, cloud backup below still uses its own separate recovery code."), React.default.createElement("label", {
            className: "wt-field"
        }, "Email", React.default.createElement("input", {
            type: "email",
            value: I,
            onChange: e => L(e.target.value),
            placeholder: "you@example.com"
        })), $ && React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: -8,
                marginBottom: 10
            }
        }, $), React.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%"
            },
            disabled: "sending" === R || !I.trim(),
            onClick: async () => {
                B("sending"), F("");
                try {
                    await O(I.trim()), B("sent")
                } catch (e) {
                    F(e.message || "Could not send a sign-in link."), B("idle")
                }
            }
        }, "sending" === R ? "Sending…" : "Send sign-in link"))), React.default.createElement("div", {
            className: "wt-section-label"
        }, "Backup"), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("div", {
            className: "wt-card-title"
        }, React.default.createElement(Cloud, {
            size: 15
        }), " Automatic cloud backup"), React.default.createElement("p", {
            className: "wt-card-note"
        }, "Keeps a copy of your data on the server so a lost phone or a cleared browser doesn't wipe your history. Saves on its own in the background."), React.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: D.enabled ? 14 : 0
            }
        }, React.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), React.default.createElement("button", {
            className: "wt-switch " + (D.enabled ? "on" : ""),
            onClick: () => u(!D.enabled),
            "aria-label": "Toggle cloud backup"
        }, React.default.createElement("span", null))), D.enabled && D.code && React.default.createElement(React.default.Fragment, null, React.default.createElement("p", {
            style: {
                fontSize: 12,
                fontWeight: 700,
                color: wI,
                margin: "0 0 6px"
            }
        }, "Your recovery code"), React.default.createElement("div", {
            className: "wt-recovery-code"
        }, D.code), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                margin: "8px 0 0",
                lineHeight: 1.5
            }
        }, "Write this down or screenshot it now. It's the only way to get your data back on a new phone — and if this browser's data is cleared, the code goes with it."), React.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wD,
                margin: "8px 0 0"
            }
        }, D.lastSavedAt ? `Last backed up ${new Date(D.lastSavedAt).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}` : "Not backed up yet"), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 12
            },
            onClick: s
        }, "Back up now")), React.default.createElement("button", {
            className: "wt-btn-text",
            onClick: () => _(!0)
        }, "Restore from a recovery code")), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("p", {
            className: "wt-card-note",
            style: {
                marginBottom: 12
            }
        }, "You can also keep your own backup file — useful if you'd rather not rely on the server copy, or want an archive you control."), React.default.createElement("div", {
            style: {
                display: "flex",
                gap: 10
            }
        }, React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            },
            onClick: n
        }, "Export backup"), React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            },
            onClick: () => V.current.click()
        }, "Import backup")), React.default.createElement("input", {
            type: "file",
            accept: "application/json,.json",
            ref: V,
            style: {
                display: "none"
            },
            onChange: function(e) {
                let t = e.target.files[0];
                if (e.target.value = "", !t) return;
                let n = new FileReader;
                n.onload = e => r(e.target.result), n.readAsText(t)
            }
        })), React.default.createElement(PO, {
            open: M,
            onClose: () => _(!1),
            onRestore: c
        }), React.default.createElement("div", {
            className: "wt-section-label"
        }, "Data"), React.default.createElement("div", {
            style: {
                display: "flex",
                gap: 10
            }
        }, React.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            },
            onClick: t
        }, "Export CSV"), React.default.createElement("button", {
            className: "wt-btn-secondary wt-btn-danger",
            style: {
                flex: 1
            },
            onClick: () => W(!0)
        }, "Reset all data")), React.default.createElement("div", {
            className: "wt-section-label"
        }, "About"), React.default.createElement("div", {
            className: "wt-card"
        }, React.default.createElement("p", {
            className: "wt-card-note",
            style: {
                marginBottom: 12
            }
        }, "HydroPro Tracker is a personal project currently in trial with a small group of testers. Your data stays on this device — nothing is sent anywhere except push notification scheduling, if you've turned that on. Things may still change as it's refined. Found a bug, or have an idea? Let me know."), React.default.createElement("a", {
            className: "wt-btn-secondary",
            style: {
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                marginBottom: 12
            },
            href: "mailto:rob@bostonpickleballassociation.org?subject=HydroPro%20Tracker%20feedback"
        }, "Send feedback"), React.default.createElement("p", {
            style: {
                fontSize: 11,
                color: wD,
                margin: 0,
                textAlign: "center"
            }
        }, "Version ", xS), React.default.createElement("p", {
            style: {
                fontSize: 10.5,
                color: wD,
                margin: "6px 0 0",
                textAlign: "center"
            }
        }, "© 2026 HydroPro Tracker Inc. All Rights Reserved.")), React.default.createElement(vO, {
            open: U,
            title: "Reset all data?",
            message: "This clears every logged day, all 4 goals, and all your presets. This can't be undone.",
            danger: !0,
            onCancel: () => W(!1),
            onConfirm: () => {
                a(), W(!1)
            }
        }), React.default.createElement(yO, {
            open: H,
            onClose: () => q(!1)
        }))
    }(0, ReactDOM.createRoot)(document.getElementById("root")).render(React.default.createElement(function() {
        let e = typeof window < "u" ? new URLSearchParams(window.location.search).get("share") : null;
        if (e) return React.default.createElement(zO, {
            shareId: e
        });
        let [t, n] = (0, React.useState)(null), [r, a] = (0, React.useState)("log"), [o, i] = (0, React.useState)(!1), [l, u] = (0, React.useState)(null), [s, c] = (0, React.useState)(null), [manualSheetOpen, setManualSheetOpen] = (0, React.useState)(!1), [f, d] = (0, React.useState)(null), [p, m] = (0, React.useState)(0), [h, g] = (0, React.useState)(!1), [y, v] = (0, React.useState)(0), [b, w] = (0, React.useState)(JS()), [x, E] = (0, React.useState)(null), [k, S] = (0, React.useState)(!1), [O, P] = (0, React.useState)(null), [C, j] = (0, React.useState)(!1), [N, T] = (0, React.useState)(!1), [A, M] = (0, React.useState)(null), [_, D] = (0, React.useState)(!1), [z, I] = (0, React.useState)(null), [L, R] = (0, React.useState)(!1), [B, $] = (0, React.useState)(null), [F, U] = (0, React.useState)(!1), W = (0, React.useRef)(null), H = (0, React.useRef)(null), q = (0, React.useRef)(null), V = (0, React.useRef)(null), G = (0, React.useRef)(!1), X = (0, React.useRef)(null), Y = (0, React.useRef)(null), [K, Q] = (0, React.useState)(null), [Z, J] = (0, React.useState)(null), [ee, te] = (0, React.useState)(typeof Notification < "u" ? Notification.permission : "unsupported"), [ne, re] = (0, React.useState)(!1), [ae, oe] = (0, React.useState)(null), ie = (0, React.useRef)(null), le = (0, React.useRef)(null), ue = (0, React.useRef)(null), se = (0, React.useRef)(!1);

        function ce(e, t) {
            clearTimeout(ie.current), Q({
                message: e,
                undo: t
            }), ie.current = setTimeout(() => Q(null), 4e3)
        }

        function fe() {
            clearTimeout(le.current);
            let e = t && t.logs[HS(new Date)] || [],
                n = t ? function(e, t, n) {
                    let r = e || [],
                        a = [];
                    if (!1 !== t.showWater && t.goalOz > 0) {
                        let e = r.reduce((e, t) => e + kS(t), 0);
                        a.push({
                            label: "water",
                            short: "oz",
                            got: e,
                            goal: t.goalOz,
                            emoji: "💧"
                        })
                    }
                    if (!1 !== t.showProtein && t.goalProtein > 0) {
                        let e = r.reduce((e, t) => e + SS(t), 0);
                        a.push({
                            label: "protein",
                            short: "g",
                            got: e,
                            goal: t.goalProtein,
                            emoji: "💪"
                        })
                    }
                    if (!1 !== t.showCalories && t.goalCalories > 0) {
                        let e = r.reduce((e, t) => e + OS(t), 0);
                        a.push({
                            label: "calories",
                            short: "cal",
                            got: e,
                            goal: t.goalCalories,
                            emoji: "🔥"
                        })
                    }
                    if (0 === a.length) return "💧 Time to log your stats";
                    let o = a.filter(e => e.got < e.goal);
                    if (0 === o.length) return "🎉 All your goals are met today — nice work";
                    o.sort((e, t) => e.got / e.goal - t.got / t.goal);
                    let i = o[0],
                        l = Math.round(i.goal - i.got),
                        u = i.got / i.goal;
                    return "number" == typeof n && n >= 19 ? `${i.emoji} ${l}${i.short} of ${i.label} to go — last stretch of the day` : u >= .75 ? `${i.emoji} Almost there — just ${l}${i.short} of ${i.label} left` : `${i.emoji} ${l}${i.short} of ${i.label} to go`
                }(e, t.settings, (new Date).getHours()) : "💧💪🔥 Time to log your stats";
            J(n), le.current = setTimeout(() => J(null), 8e3);
            try {
                typeof Notification < "u" && "granted" === Notification.permission && new Notification("HydroPro Tracker", {
                    body: n.replace(/^[^\w]+\s*/, "")
                })
            } catch {}
        }

        function de(e) {
            clearInterval(ue.current), ue.current = setInterval(fe, 60 * e * 1e3)
        }

        function pe(e, r, a) {
            let o = HS(new Date),
                i = "number" == typeof a ? a : function() {
                    let e = new Date;
                    return 60 * e.getHours() + e.getMinutes()
                }(),
                l = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                    time: tO(i),
                    timeMinutes: i,
                    label: r,
                    oz: e.oz || 0,
                    grams: e.grams || 0,
                    calories: e.calories || 0
                },
                u = t.logs[o] || [],
                s = [];
            if ([{
                    get: kS,
                    goal: t.settings.goalOz,
                    add: l.oz,
                    name: "water",
                    emoji: "💧"
                }, {
                    get: SS,
                    goal: t.settings.goalProtein,
                    add: l.grams,
                    name: "protein",
                    emoji: "💪"
                }, {
                    get: OS,
                    goal: t.settings.goalCalories,
                    add: l.calories,
                    name: "calorie",
                    emoji: "🔥"
                }].forEach(e => {
                    if (!(e.goal > 0 && e.add > 0)) return;
                    let t = u.reduce((t, n) => t + e.get(n), 0);
                    t < e.goal && t + e.add >= e.goal && s.push(`${e.emoji} ${e.name}`)
                }), n(e => ({
                    ...e,
                    logs: {
                        ...e.logs,
                        [o]: [...e.logs[o] || [], l]
                    }
                })), s.length > 0) {
                return void ce(`🎉 ${1===s.length?`${s[0]} goal`:`${s.join(" + ")} goals`} hit for today!`, () => me(o, l.id))
            }
            let c = [];
            l.oz > 0 && c.push(`${l.oz}oz`), l.grams > 0 && c.push(`${l.grams}g`), l.calories > 0 && c.push(`${l.calories}cal`), ce(`Logged ${c.join(" · ")} · ${r}`, () => me(o, l.id))
        }

        function me(e, t) {
            n(n => {
                let r = (n.logs[e] || []).find(e => e.id === t),
                    a = n.settings;
                return r && "supplement" === r.type && (a = {
                    ...n.settings,
                    supplements: KS(n.settings.supplements, r.items || [], [])
                }), r && "treatment" === r.type && (a = {
                    ...n.settings,
                    treatments: KS(n.settings.treatments, r.items || [], [])
                }), {
                    ...n,
                    settings: a,
                    logs: {
                        ...n.logs,
                        [e]: (n.logs[e] || []).filter(e => e.id !== t)
                    }
                }
            })
        }

        function saveBackfill(e, r) {
            function a() {
                return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`
            }
            let o = (new Date).toISOString(),
                i = [];
            r.oz > 0 && i.push({
                id: a(),
                time: "12:00 PM",
                timeMinutes: 720,
                label: r.ozDescription || "Water",
                oz: r.oz,
                grams: 0,
                calories: 0,
                backfilled: !0,
                enteredAt: o
            }), r.grams > 0 && i.push({
                id: a(),
                time: "12:00 PM",
                timeMinutes: 720,
                label: r.gramsDescription || "Protein",
                oz: 0,
                grams: r.grams,
                calories: 0,
                backfilled: !0,
                enteredAt: o
            }), r.calories > 0 && i.push({
                id: a(),
                time: "12:00 PM",
                timeMinutes: 720,
                label: r.caloriesDescription || "Calories",
                oz: 0,
                grams: 0,
                calories: r.calories,
                backfilled: !0,
                enteredAt: o
            }), r.sleepHours > 0 && function() {
                let e = 720,
                    t = (720 - Math.round(60 * r.sleepHours) + 1440) % 1440;
                i.push({
                    id: a(),
                    type: "sleep",
                    label: "Sleep",
                    time: "12:00 PM",
                    timeMinutes: 720,
                    lightsOutMinutes: t,
                    wokeUpMinutes: e,
                    hours: r.sleepHours,
                    backfilled: !0,
                    enteredAt: o
                })
            }(), r.weight > 0 && i.push({
                id: a(),
                type: "weight",
                label: "Weight",
                time: "12:00 PM",
                timeMinutes: 720,
                value: r.weight,
                backfilled: !0,
                enteredAt: o
            }), r.exerciseMinutes > 0 && i.push({
                id: a(),
                type: "exercise",
                label: "Exercise",
                exerciseType: "Exercise",
                minutes: r.exerciseMinutes,
                description: "",
                time: "12:00 PM",
                timeMinutes: 720,
                backfilled: !0,
                enteredAt: o
            });
            let l = (r.supplements || []).filter(e => e.name);
            if (l.length > 0 && i.push({
                    id: a(),
                    type: "supplement",
                    label: `Took: ${l.map(e=>e.qty?`${e.name} (${e.qty})`:e.name).join(", ")}`,
                    items: l,
                    time: "12:00 PM",
                    timeMinutes: 720,
                    backfilled: !0,
                    enteredAt: o
                }), 0 === i.length) return;
            n(t => ({
                ...t,
                logs: {
                    ...t.logs,
                    [e]: [...t.logs[e] || [], ...i]
                },
                settings: l.length > 0 ? {
                    ...t.settings,
                    supplements: KS(t.settings.supplements, [], l)
                } : t.settings
            })), ce(`Backfilled ${i.length} item${1===i.length?"":"s"} to ${YS(MS(e))}.`)
        }

        function he() {
            c({
                field: f,
                value: p
            }), d(null), u(null), i(!0)
        }

        function ge() {
            if (p <= 0) return void d(null);
            pe({
                [f]: p
            }, {
                oz: "Water",
                grams: "Protein",
                calories: "Calories"
            } [f] || "Logged"), d(null)
        }

        function addPreset(e, t, r, a) {
            n(n => ({
                ...n,
                settings: {
                    ...n.settings,
                    presets: [...n.settings.presets, {
                        id: `${Date.now()}`,
                        name: e,
                        oz: t || 0,
                        grams: r || 0,
                        calories: a || 0
                    }]
                }
            }))
        }

        function editPreset(e, t, r, a, o) {
            n(n => ({
                ...n,
                settings: {
                    ...n.settings,
                    presets: n.settings.presets.map(n => n.id === e ? {
                        ...n,
                        name: t,
                        oz: r || 0,
                        grams: a || 0,
                        calories: o || 0
                    } : n)
                }
            }))
        }

        function deletePreset(e) {
            n(t => ({
                ...t,
                settings: {
                    ...t.settings,
                    presets: t.settings.presets.filter(t => t.id !== e)
                }
            }))
        }

        function ye() {
            let e = HS(new Date),
                n = t.logs[e] || [],
                r = n.reduce((e, t) => e + kS(t), 0),
                a = n.reduce((e, t) => e + SS(t), 0),
                o = n.reduce((e, t) => e + OS(t), 0),
                i = n.filter(e => void 0 === e.type),
                l = i.length > 0 ? Math.max(...i.map(e => e.timeMinutes || 0)) : null;
            return {
                date: e,
                goalOz: t.settings.goalOz || 0,
                consumedOz: r,
                goalProtein: t.settings.goalProtein || 0,
                consumedProtein: a,
                goalCalories: t.settings.goalCalories || 0,
                consumedCalories: o,
                lastLoggedMinutes: l,
                streak: ke(t.logs, t.settings.goalOz),
                treatments: t.settings.treatments.map(e => ({
                    name: e.name,
                    dueDate: TS(e)
                })).filter(e => null !== e.dueDate)
            }
        }

        function ve() {
            let e = {
                ...t.settings
            };
            delete e.feedbackWatching, delete e.cloudBackup, delete e.account;
            let {
                push: r,
                bedtime: a,
                supplementReminder: o,
                treatmentReminder: i,
                ...l
            } = e.reminders;
            return {
                app: "HydroPro Tracker",
                exportedAt: (new Date).toISOString(),
                version: SCHEMA_VERSION,
                logs: t.logs,
                activeSleepSession: t.activeSleepSession,
                settings: {
                    ...e,
                    reminders: l
                }
            }
        }

        function be(e) {
            let {
                exportedAt: t,
                ...n
            } = e;
            return JSON.stringify(n)
        }
        async function we(e) {
            let r = t.settings.cloudBackup;
            if (!r.enabled || !r.code) return;
            let a = ve(),
                o = be(a);
            try {
                let t = await sS(r.code, a);
                W.current = o, n(e => ({
                    ...e,
                    settings: {
                        ...e.settings,
                        cloudBackup: {
                            ...e.settings.cloudBackup,
                            lastSavedAt: t.savedAt
                        }
                    }
                })), "manual" === e && ce("Backed up to the cloud.")
            } catch (t) {
                "manual" === e && ce(t.message || "Backup failed.")
            }
        }

        function xe(e) {
            let r;
            try {
                r = JSON.parse(e)
            } catch {
                return void ce("That file couldn't be read as a backup.")
            }
            if (!r || "object" != typeof r || !r.logs || !r.settings) return void ce("That file doesn't look like a HydroPro backup.");
            let a = t,
                o = migrate(r);
            o.settings = {
                ...o.settings,
                feedbackWatching: t.settings.feedbackWatching,
                cloudBackup: t.settings.cloudBackup,
                account: t.settings.account,
                reminders: {
                    ...o.settings.reminders,
                    push: t.settings.reminders.push,
                    bedtime: t.settings.reminders.bedtime,
                    supplementReminder: t.settings.reminders.supplementReminder,
                    treatmentReminder: t.settings.reminders.treatmentReminder
                }
            };
            n(o), ce("Backup restored.", () => n(a))
        }
        if ((0, React.useEffect)(() => {
                (async function() {
                    try {
                        let e = localStorage.getItem(cS);
                        if (e) {
                            let t = JSON.parse(e);
                            return migrate(t)
                        }
                    } catch {}
                    return JSON.parse(JSON.stringify(ES))
                })().then(e => {
                    n(e), se.current = !0
                }), nS().catch(() => {})
            }, []), (0, React.useEffect)(() => {
                t && se.current && async function(e) {
                    try {
                        localStorage.setItem(cS, JSON.stringify(e))
                    } catch (e) {
                        console.error("Failed to save water tracker data", e)
                    }
                }(t)
            }, [t]), (0, React.useEffect)(() => (t && t.settings.reminders.inApp.enabled && de(t.settings.reminders.inApp.intervalMin), () => clearInterval(ue.current)), [t && t.settings.reminders.inApp.enabled]), (0, React.useEffect)(() => {
                if (!t || G.current) return;
                let e = new URLSearchParams(window.location.search).get("login");
                e && (G.current = !0, async function(e) {
                    let t = rS();
                    if (!t) throw new Error("Account server not configured yet.");
                    let n = await fetch(`${t}/api/auth/verify?token=${encodeURIComponent(e)}`),
                        r = await n.json().catch(() => ({}));
                    if (!n.ok) throw new Error(r.error || "Could not verify sign-in link.");
                    return r
                }(e).then(e => {
                    n(t => ({
                        ...t,
                        settings: {
                            ...t.settings,
                            account: {
                                email: e.email,
                                sessionToken: e.sessionToken
                            }
                        }
                    })), ce(`Signed in as ${e.email}`)
                }).catch(e => {
                    ce(e.message || "That sign-in link did not work.")
                }).finally(() => {
                    let e = new URL(window.location.href);
                    e.searchParams.delete("login"), window.history.replaceState({}, "", e.toString())
                }))
            }, [t]), (0, React.useEffect)(() => {
                if (t && t.settings.cloudBackup && t.settings.cloudBackup.enabled && t.settings.cloudBackup.code && be(ve()) !== W.current) return clearTimeout(H.current), H.current = setTimeout(() => {
                    we("auto")
                }, 2e4), () => clearTimeout(H.current)
            }, [t]), (0, React.useEffect)(() => {
                function e() {
                    typeof document > "u" || "hidden" !== document.visibilityState || !t || !t.settings.cloudBackup || !t.settings.cloudBackup.enabled || be(ve()) === W.current || (clearTimeout(H.current), we("auto"))
                }
                if (!(typeof document > "u")) return document.addEventListener("visibilitychange", e), () => document.removeEventListener("visibilitychange", e)
            }, [t]), (0, React.useEffect)(() => {
                if (!t || !t.settings.account.sessionToken) return;
                let e = ve(),
                    n = be(e);
                return n !== X.current ? (clearTimeout(Y.current), Y.current = setTimeout(() => {
                    lS(t.settings.account.sessionToken, e).then(() => {
                        X.current = n
                    }).catch(() => {})
                }, 2e4), () => clearTimeout(Y.current)) : void 0
            }, [t]), (0, React.useEffect)(() => {
                function e() {
                    if (typeof document > "u" || "hidden" !== document.visibilityState || !t || !t.settings.account.sessionToken) return;
                    let e = ve(),
                        n = be(e);
                    n !== X.current && (clearTimeout(Y.current), lS(t.settings.account.sessionToken, e).then(() => {
                        X.current = n
                    }).catch(() => {}))
                }
                if (!(typeof document > "u")) return document.addEventListener("visibilitychange", e), () => document.removeEventListener("visibilitychange", e)
            }, [t]), (0, React.useEffect)(() => {
                if (!t || !t.settings.reminders.push.subscribed || !t.settings.reminders.push.id) return;
                let e = ye(),
                    n = JSON.stringify(e);
                return n !== q.current ? (clearTimeout(V.current), V.current = setTimeout(() => {
                    uS(t.settings.reminders.push.id, e), q.current = n
                }, 2e4), () => clearTimeout(V.current)) : void 0
            }, [t]), (0, React.useEffect)(() => {
                function e() {
                    if (typeof document > "u" || "hidden" !== document.visibilityState || !t || !t.settings.reminders.push.subscribed || !t.settings.reminders.push.id) return;
                    let e = ye(),
                        n = JSON.stringify(e);
                    n !== q.current && (clearTimeout(V.current), uS(t.settings.reminders.push.id, e), q.current = n)
                }
                if (!(typeof document > "u")) return document.addEventListener("visibilitychange", e), () => document.removeEventListener("visibilitychange", e)
            }, [t]), (0, React.useEffect)(() => {
                wtActivityPing()
            }, []), !t) return React.default.createElement("div", {
            className: "wt-root"
        }, React.default.createElement("style", null, iO), React.default.createElement("div", {
            className: "wt-loading"
        }, "Loading your tracker…"));
        let Ee = HS(new Date);

        function ke(e, t) {
            if (!(t > 0)) return 0;
            let n = 0,
                r = VS(new Date, -1);
            for (r.setHours(0, 0, 0, 0);;) {
                if (!((e[HS(r)] || []).reduce((e, t) => e + kS(t), 0) >= t)) break;
                n++, r = VS(r, -1)
            }
            return n
        }
        return React.default.createElement("div", {
            className: "wt-root"
        }, React.default.createElement("style", null, iO), React.default.createElement("div", {
            className: "wt-topbanner"
        }, React.default.createElement("div", {
            className: "wt-topbanner-inner"
        }, React.default.createElement("div", {
            className: "wt-topbanner-profile",
            "aria-hidden": "true"
        }, React.default.createElement(User, {
            size: 20,
            color: "var(--muted-dark)"
        })), React.default.createElement("div", {
            className: "wt-topbanner-badge"
        }, React.default.createElement("img", {
            src: "gauges/main-logo.png",
            alt: ""
        })), React.default.createElement("div", {
            className: "wt-topbanner-text"
        }, React.default.createElement("span", {
            className: "wt-topbanner-title"
        }, "HydroPro Tracker"))), React.default.createElement("svg", {
            className: "wt-topbanner-wave",
            viewBox: "0 0 400 24",
            preserveAspectRatio: "none"
        }, React.default.createElement("path", {
            d: "M0,14 C33,4 67,24 100,14 C133,4 167,24 200,14 C233,4 267,24 300,14 C333,4 367,24 400,14 L400,24 L0,24 Z"
        }))), React.default.createElement("div", {
            className: "wt-frame"
        }, React.default.createElement("div", {
            className: "wt-header"
        }, React.default.createElement("span", {
            className: "wt-date"
        }, React.default.createElement("span", {
            className: "wt-date-label"
        }, "today" === r ? "Today's Summary for:" : "reports" === r ? "CURRENT STATS FOR:" : "setup" === r ? "My Plan for:" : "settings" === r ? "Settings" : "Tracking for:"), "settings" !== r && React.default.createElement(React.default.Fragment, null, " ", function(e) {
            return e.toLocaleDateString(void 0, {
                weekday: "long",
                month: "short",
                day: "numeric"
            })
        }(new Date)))), "log" === r && React.default.createElement(MO, {
            data: t,
            todayKey: Ee,
            onOpenQuickDial: function(e) {
                d(e), m(0)
            },
            onOpenSleepSheet: () => {
                $(null), R(!0)
            },
            onOpenWeightDial: function() {
                v(0), w(JS()), E(null), g(!0)
            },
            onOpenSupplementSheet: () => {
                P(null), S(!0)
            },
            onOpenTreatmentSheet: () => {
                I(null), j(!0)
            },
            onOpenExerciseSheet: () => {
                M(null), T(!0)
            },
            onOpenPresetSheet: () => {
                i(!0)
            },
            onOpenManualSheet: () => {
                u(null), c(null), setManualSheetOpen(!0)
            }
        }), "today" === r && React.default.createElement(RO, {
            data: t,
            todayKey: Ee,
            onDeleteLog: function(e) {
                me(HS(new Date), e)
            },
            onEditLogEntry: function(e) {
                PS(e) ? ($(e), R(!0)) : jS(e) ? (E(e), v(e.value), w(eO(e.timeMinutes)), g(!0)) : NS(e) ? (P(e), S(!0)) : zS(e) ? (I({
                    ...e,
                    dateKeyStr: HS(new Date)
                }), j(!0)) : IS(e) ? (M(e), T(!0)) : (u(e), setManualSheetOpen(!0))
            },
            onEditNextDue: function(e, t, r) {
                let a = "supplement" === e ? "supplements" : "treatments";
                n(e => ({
                    ...e,
                    settings: {
                        ...e.settings,
                        [a]: e.settings[a].map(e => e.id === t ? {
                            ...e,
                            nextDueOverride: r
                        } : e)
                    }
                }))
            },
            onDeleteLogForDate: me,
            onSaveBackfill: saveBackfill
        }), "reports" === r && React.default.createElement(FO, {
            data: t,
            onDrShare: () => D(!0)
        }), "setup" === r && React.default.createElement(WO, {
            data: t,
            onUpdateGoal: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        goalOz: e
                    }
                }))
            },
            onUpdateGoalProtein: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        goalProtein: e
                    }
                }))
            },
            onUpdateGoalCalories: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        goalCalories: e
                    }
                }))
            },
            onUpdateGoalSleep: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        goalSleepHours: e
                    }
                }))
            },
            onUpdateGoalWeight: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        goalWeight: e
                    }
                }))
            },
            onUpdateGoalExerciseMinutes: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        goalExerciseMinutes: e
                    }
                }))
            },
            onToggleShowWater: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        showWater: e
                    }
                }))
            },
            onToggleShowProtein: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        showProtein: e
                    }
                }))
            },
            onToggleShowCalories: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        showCalories: e
                    }
                }))
            },
            onToggleShowSleep: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        showSleep: e
                    }
                }))
            },
            onToggleShowWeight: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        showWeight: e
                    }
                }))
            },
            onToggleShowSupplements: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        showSupplements: e
                    }
                }))
            },
            onToggleShowTreatments: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        showTreatments: e
                    }
                }))
            },
            onToggleShowExercise: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        showExercise: e
                    }
                }))
            },
            onAddPreset: addPreset,
            onEditPreset: editPreset,
            onDeletePreset: deletePreset,
            onAddSupplement: function(e, t, r, a, o) {
                let i = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                    name: e,
                    intervalDays: t || 1,
                    lastTakenDate: null,
                    nextDueOverride: null,
                    trackInventory: !!r,
                    qtyRemaining: a || 0,
                    expirationDate: o || null
                };
                n(e => ({
                    ...e,
                    settings: {
                        ...e.settings,
                        supplements: [...e.settings.supplements, i]
                    }
                }))
            },
            onEditSupplement: function(e, t, r, a, o, i) {
                n(n => ({
                    ...n,
                    settings: {
                        ...n.settings,
                        supplements: n.settings.supplements.map(n => n.id === e ? {
                            ...n,
                            name: t,
                            intervalDays: r || 1,
                            trackInventory: !!a,
                            qtyRemaining: o || 0,
                            expirationDate: i || null
                        } : n)
                    }
                }))
            },
            onDeleteSupplement: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        supplements: t.settings.supplements.filter(t => t.id !== e)
                    }
                }))
            },
            onAddTreatment: function(e, t, r, a, o) {
                let i = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                    name: e,
                    intervalDays: t,
                    lastTakenDate: null,
                    nextDueOverride: null,
                    trackInventory: !!r,
                    qtyRemaining: a || 0,
                    expirationDate: o || null
                };
                n(e => ({
                    ...e,
                    settings: {
                        ...e.settings,
                        treatments: [...e.settings.treatments, i]
                    }
                }))
            },
            onEditTreatment: function(e, t, r, a, o, i) {
                n(n => ({
                    ...n,
                    settings: {
                        ...n.settings,
                        treatments: n.settings.treatments.map(n => n.id === e ? {
                            ...n,
                            name: t,
                            intervalDays: r,
                            trackInventory: !!a,
                            qtyRemaining: o || 0,
                            expirationDate: i || null
                        } : n)
                    }
                }))
            },
            onDeleteTreatment: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        treatments: t.settings.treatments.filter(t => t.id !== e)
                    }
                }))
            }
        }), "settings" === r && React.default.createElement(HO, {
            data: t,
            onExportCSV: function() {
                let e = function(e) {
                    let t = [
                        ["Date", "Time", "Label", "Water (oz)", "Protein (g)", "Calories", "Sleep Hours", "Lights Out", "Woke Up"]
                    ];
                    return Object.keys(e).sort().forEach(n => {
                        (e[n] || []).forEach(e => {
                            t.push([n, e.time, e.label, String(kS(e)), String(SS(e)), String(OS(e)), String(CS(e)), PS(e) ? tO(e.lightsOutMinutes) : "", PS(e) ? tO(e.wokeUpMinutes) : ""])
                        })
                    }), t.map(e => e.map(e => `"${String(e).replace(/"/g,'""')}"`).join(",")).join("\r\n")
                }(t.logs);
                oO("pro-hydro-export.csv", "text/csv;charset=utf-8", e), ce("CSV exported.")
            },
            onExportBackup: function() {
                oO(`hydropro-backup-${HS(new Date)}.json`, "application/json;charset=utf-8", JSON.stringify(ve(), null, 2)), ce("Backup downloaded.")
            },
            onImportBackup: xe,
            onResetAll: function() {
                t.settings.reminders.push.subscribed && iS(t.settings.reminders.push.id).catch(() => {});
                let e = t.settings.cloudBackup;
                clearTimeout(H.current), W.current = null;
                let r = JSON.parse(JSON.stringify(ES));
                r.settings.cloudBackup = {
                    enabled: !1,
                    code: e.code,
                    lastSavedAt: e.lastSavedAt
                }, n(r), clearInterval(ue.current)
            },
            onOpenFeedback: () => U(!0),
            onToggleFeedbackWatch: async function(e) {
                let r = t.settings.reminders.push.id;
                !e || r ? (n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        feedbackWatching: e
                    }
                })), await async function(e, t) {
                    let n = rS();
                    !n || !e || await fetch(`${n}/api/feedback-watch`, {
                        method: t ? "POST" : "DELETE",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            id: e
                        })
                    }).catch(() => {})
                }(r, e)) : ce("Turn on Push notifications in Settings first, then come back here.")
            },
            onUpdateTesterName: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        testerName: e
                    }
                }))
            },
            onToggleCloudBackup: async function(e) {
                if (!e) return n(e => ({
                    ...e,
                    settings: {
                        ...e.settings,
                        cloudBackup: {
                            ...e.settings.cloudBackup,
                            enabled: !1
                        }
                    }
                })), void ce("Cloud backup turned off. Your saved backup is still there if you turn it back on.");
                let r = t.settings.cloudBackup.code || function() {
                    let e = new Uint8Array(10);
                    if (typeof crypto < "u" && crypto.getRandomValues) crypto.getRandomValues(e);
                    else
                        for (let t = 0; t < e.length; t++) e[t] = Math.floor(256 * Math.random());
                    let t = [...e].map(e => RS[e % 31]);
                    return `${t.slice(0,4).join("")}-${t.slice(4,8).join("")}-${t.slice(8,10).join("")}`
                }();
                n(e => ({
                    ...e,
                    settings: {
                        ...e.settings,
                        cloudBackup: {
                            ...e.settings.cloudBackup,
                            enabled: !0,
                            code: r
                        }
                    }
                }));
                try {
                    let e = await sS(r, ve());
                    W.current = be(ve()), n(t => ({
                        ...t,
                        settings: {
                            ...t.settings,
                            cloudBackup: {
                                ...t.settings.cloudBackup,
                                lastSavedAt: e.savedAt
                            }
                        }
                    })), ce("Cloud backup on — save your recovery code somewhere safe.")
                } catch (e) {
                    ce(e.message || "Could not reach the backup server.")
                }
            },
            onBackupNow: () => we("manual"),
            onRestoreFromCloud: async function(e) {
                let t = function(e) {
                    let t = String(e || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
                    return 10 !== t.length ? null : `${t.slice(0,4)}-${t.slice(4,8)}-${t.slice(8,10)}`
                }(e);
                if (!t) return ce("That code doesn't look right — it should be 10 letters and numbers."), !1;
                try {
                    let e = await async function(e) {
                        let t = rS();
                        if (!t) throw new Error("Backup server not configured yet.");
                        let n = await fetch(`${t}/api/backup/${encodeURIComponent(e)}`);
                        if (404 === n.status) throw new Error("No backup found for that code. Double-check it and try again.");
                        if (!n.ok) throw new Error("Could not reach the backup server — try again in a moment.");
                        return n.json()
                    }(t);
                    return xe(JSON.stringify(e.data)), n(n => ({
                        ...n,
                        settings: {
                            ...n.settings,
                            cloudBackup: {
                                enabled: !0,
                                code: t,
                                lastSavedAt: e.savedAt
                            }
                        }
                    })), !0
                } catch (e) {
                    return ce(e.message || "Restore failed."), !1
                }
            },
            notifPermission: ee,
            onEnableInApp: async function(e) {
                try {
                    if (typeof Notification < "u" && "default" === Notification.permission) {
                        let e = await Notification.requestPermission();
                        te(e)
                    }
                } catch {}
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        reminders: {
                            ...t.settings.reminders,
                            inApp: {
                                ...t.settings.reminders.inApp,
                                enabled: !0,
                                intervalMin: e
                            }
                        }
                    }
                })), de(e), ce("In-app reminders on — keep this tab open to get nudged.")
            },
            onDisableInApp: function() {
                clearInterval(ue.current), n(e => ({
                    ...e,
                    settings: {
                        ...e.settings,
                        reminders: {
                            ...e.settings.reminders,
                            inApp: {
                                ...e.settings.reminders.inApp,
                                enabled: !1
                            }
                        }
                    }
                }))
            },
            onChangeInAppInterval: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        reminders: {
                            ...t.settings.reminders,
                            inApp: {
                                ...t.settings.reminders.inApp,
                                intervalMin: e
                            }
                        }
                    }
                })), t && t.settings.reminders.inApp.enabled && de(e)
            },
            onTestReminder: fe,
            onChangeCalendarField: function(e, t) {
                n(n => {
                    let r = {
                        ...n,
                        settings: {
                            ...n.settings,
                            reminders: {
                                ...n.settings.reminders,
                                calendar: {
                                    ...n.settings.reminders.calendar,
                                    [e]: t
                                }
                            }
                        }
                    };
                    return r.settings.reminders.push.subscribed && oS(r.settings.reminders.push.id, r.settings.reminders.calendar, r.settings.reminders.bedtime, r.settings.reminders.supplementReminder, r.settings.reminders.treatmentReminder).catch(() => {}), r
                })
            },
            onDownloadICS: function() {
                let e = t.settings.reminders.calendar,
                    n = function(e, t, n) {
                        let [r, a] = e.split(":").map(Number), [o, i] = t.split(":").map(Number), l = 60 * r + a, u = 60 * o + i, s = Math.max(15, Math.round(60 * n)), c = [];
                        for (let e = l; e <= u; e += s) c.push(e);
                        0 === c.length && c.push(l);
                        let f = new Date,
                            d = f.getFullYear(),
                            p = WS(f.getMonth() + 1),
                            m = WS(f.getDate()),
                            h = f.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                        return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HydroPro Tracker//EN", "CALSCALE:GREGORIAN", c.map((e, t) => {
                            let n = WS(Math.floor(e / 60)),
                                r = WS(e % 60),
                                a = `${d}${p}${m}T${n}${r}00`,
                                o = e + 10,
                                i = WS(Math.floor(o / 60)),
                                l = WS(o % 60),
                                u = `${d}${p}${m}T${i}${l}00`;
                            return ["BEGIN:VEVENT", `UID:reminder-${t}-${Date.now()}@pro-hydro-coach.local`, `DTSTAMP:${h}`, `DTSTART:${a}`, `DTEND:${u}`, "RRULE:FREQ=DAILY", "SUMMARY:Log water, protein & calories", "DESCRIPTION:Reminder from HydroPro Tracker", "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Log water, protein & calories", "TRIGGER:-PT0M", "END:VALARM", "END:VEVENT"].join("\r\n")
                        }).join("\r\n"), "END:VCALENDAR"].join("\r\n")
                    }(e.startTime, e.endTime, e.intervalHours);
                oO("pro-hydro-reminders.ics", "text/calendar;charset=utf-8", n), ce("Calendar file downloaded — open it to add reminders.")
            },
            onTogglePush: async function() {
                oe(null);
                let e = t.settings.reminders.push;
                re(!0);
                try {
                    if (e.subscribed) await iS(e.id), n(e => ({
                        ...e,
                        settings: {
                            ...e.settings,
                            reminders: {
                                ...e.settings.reminders,
                                push: {
                                    subscribed: !1,
                                    id: null
                                }
                            }
                        }
                    })), ce("Push notifications turned off.");
                    else {
                        let r = await aS(e.id, t.settings.reminders.calendar, t.settings.reminders.bedtime, t.settings.reminders.supplementReminder, t.settings.reminders.treatmentReminder);
                        n(e => ({
                            ...e,
                            settings: {
                                ...e.settings,
                                reminders: {
                                    ...e.settings.reminders,
                                    push: {
                                        subscribed: !0,
                                        id: r
                                    }
                                }
                            }
                        })), ce("Push notifications on for this device.")
                    }
                } catch (e) {
                    oe(e.message || "Something went wrong with push notifications.")
                } finally {
                    re(!1)
                }
            },
            onTestPush: async function() {
                oe(null), re(!0);
                try {
                    await async function(e) {
                        let t = rS();
                        if (!t) throw new Error("Push server not configured yet — set apiBase in config.js.");
                        if (!e) throw new Error("Not subscribed yet.");
                        let n = await fetch(`${t}/api/test-push`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                id: e
                            })
                        });
                        if (!n.ok) {
                            let e = await n.json().catch(() => ({}));
                            throw new Error(e.error || "Test push failed.")
                        }
                        return !0
                    }(t.settings.reminders.push.id), ce("Test push sent — check your notifications.")
                } catch (e) {
                    oe(e.message || "Test push failed.")
                } finally {
                    re(!1)
                }
            },
            pushBusy: ne,
            pushError: ae,
            onChangeBedtime: function(e, t) {
                n(n => {
                    let r = {
                        ...n,
                        settings: {
                            ...n.settings,
                            reminders: {
                                ...n.settings.reminders,
                                bedtime: {
                                    ...n.settings.reminders.bedtime,
                                    [e]: t
                                }
                            }
                        }
                    };
                    return r.settings.reminders.push.subscribed && oS(r.settings.reminders.push.id, r.settings.reminders.calendar, r.settings.reminders.bedtime, r.settings.reminders.supplementReminder, r.settings.reminders.treatmentReminder).catch(() => {}), r
                })
            },
            onChangeSupplementReminder: function(e, t) {
                n(n => {
                    let r = {
                        ...n,
                        settings: {
                            ...n.settings,
                            reminders: {
                                ...n.settings.reminders,
                                supplementReminder: {
                                    ...n.settings.reminders.supplementReminder,
                                    [e]: t
                                }
                            }
                        }
                    };
                    return r.settings.reminders.push.subscribed && oS(r.settings.reminders.push.id, r.settings.reminders.calendar, r.settings.reminders.bedtime, r.settings.reminders.supplementReminder, r.settings.reminders.treatmentReminder).catch(() => {}), r
                })
            },
            onChangeTreatmentReminder: function(e, t) {
                n(n => {
                    let r = {
                        ...n,
                        settings: {
                            ...n.settings,
                            reminders: {
                                ...n.settings.reminders,
                                treatmentReminder: {
                                    ...n.settings.reminders.treatmentReminder,
                                    [e]: t
                                }
                            }
                        }
                    };
                    return r.settings.reminders.push.subscribed && oS(r.settings.reminders.push.id, r.settings.reminders.calendar, r.settings.reminders.bedtime, r.settings.reminders.supplementReminder, r.settings.reminders.treatmentReminder).catch(() => {}), r
                })
            },
            onRequestLogin: async function(e) {
                await async function(e) {
                    let t = rS();
                    if (!t) throw new Error("Account server not configured yet.");
                    let n = await fetch(`${t}/api/auth/request-login`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                email: e
                            })
                        }),
                        r = await n.json().catch(() => ({}));
                    if (!n.ok) throw new Error(r.error || "Could not request a sign-in link.");
                    return r
                }(e)
            },
            onSignOut: async function() {
                let e = t.settings.account.sessionToken;
                n(e => ({
                    ...e,
                    settings: {
                        ...e.settings,
                        account: {
                            email: null,
                            sessionToken: null
                        }
                    }
                })), await async function(e) {
                    let t = rS();
                    !t || !e || await fetch(`${t}/api/auth/session`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${e}`
                        }
                    }).catch(() => {})
                }(e), ce("Signed out.")
            },
            onRestoreFromAccount: async function() {
                let e = t.settings.account.sessionToken;
                if (e) try {
                    let r = await async function(e) {
                        let t = rS();
                        if (!t) throw new Error("Account server not configured yet.");
                        let n = await fetch(`${t}/api/account/backup`, {
                            headers: {
                                Authorization: `Bearer ${e}`
                            }
                        });
                        if (404 === n.status) throw new Error("No backup found for your account yet.");
                        if (!n.ok) throw new Error("Could not reach your account backup.");
                        return n.json()
                    }(e), a = t.settings.account;
                    xe(JSON.stringify(r.data)), n(e => ({
                        ...e,
                        settings: {
                            ...e.settings,
                            account: a
                        }
                    })), ce("Restored from your account.")
                } catch (e) {
                    ce(e.message || "Restore failed.")
                }
            },
            onAccountBackupNow: async function() {
                let e = t.settings.account.sessionToken;
                if (e) try {
                    let t = ve();
                    await lS(e, t), X.current = be(t), ce("Backed up to your account.")
                } catch (e) {
                    ce(e.message || "Backup failed.")
                }
            },
            onOpenDoctorShare: () => D(!0)
        })), React.default.createElement(xO, {
            open: o,
            onClose: () => {
                i(!1)
            },
            presets: t.settings.presets,
            onQuickLogPreset: e => {
                (function(e) {
                    pe({
                        oz: e.oz || 0,
                        grams: e.grams || 0,
                        calories: e.calories || 0
                    }, e.name)
                })(e), i(!1)
            },
            onAddPreset: addPreset,
            onEditPreset: editPreset,
            onDeletePreset: deletePreset
        }), React.default.createElement(ManualMealSheet, {
            open: manualSheetOpen,
            initial: l,
            quickFill: s,
            onClose: () => {
                setManualSheetOpen(!1), u(null), c(null)
            },
            onSubmit: function(e, t, r) {
                let a = nO(t),
                    o = (r || "").trim();
                if (l) {
                    let t = o || l.label;
                    (function(e, t, r, a, o) {
                        n(n => ({
                            ...n,
                            logs: {
                                ...n.logs,
                                [e]: (n.logs[e] || []).map(e => e.id === t ? {
                                    ...e,
                                    oz: r.oz || 0,
                                    grams: r.grams || 0,
                                    calories: r.calories || 0,
                                    label: a,
                                    time: tO(o),
                                    timeMinutes: o
                                } : e)
                            }
                        })), ce("Entry updated.")
                    })(HS(new Date), l.id, e, t, a), u(null)
                } else {
                    let t = [];
                    e.oz > 0 && t.push("Water"), e.grams > 0 && t.push("Protein"), e.calories > 0 && t.push("Calories"), pe(e, o || t.join(" + ") || "Logged item", a)
                }
                setManualSheetOpen(!1)
            }
        }), React.default.createElement(wO, {
            open: "oz" === f,
            title: "Water",
            unit: "oz",
            max: 64,
            value: p,
            color: mS,
            borderColor: "var(--water)",
            onChange: m,
            onClose: he,
            onLogNow: ge,
            onDismiss: () => d(null)
        }), React.default.createElement(wO, {
            open: "grams" === f,
            title: "Protein",
            unit: "g",
            max: 80,
            value: p,
            color: hS,
            borderColor: "var(--protein)",
            onChange: m,
            onClose: he,
            onLogNow: ge,
            onDismiss: () => d(null)
        }), React.default.createElement(wO, {
            open: "calories" === f,
            title: "Calories",
            unit: "cal",
            max: 800,
            value: p,
            color: gS,
            borderColor: "var(--calories)",
            onChange: m,
            onClose: he,
            onLogNow: ge,
            onDismiss: () => d(null)
        }), React.default.createElement(wO, {
            open: h,
            title: x ? "Edit Weight" : "Log Weight",
            unit: "lbs",
            max: 400,
            value: y,
            color: yS,
            borderColor: "var(--weight)",
            onChange: v,
            onClose: function() {
                if (y <= 0) return g(!1), void E(null);
                let e = nO(b);
                if (x) {
                    let t = HS(new Date);
                    return n(n => ({
                        ...n,
                        logs: {
                            ...n.logs,
                            [t]: (n.logs[t] || []).map(t => t.id === x.id ? {
                                ...t,
                                value: y,
                                time: tO(e),
                                timeMinutes: e
                            } : t)
                        }
                    })), ce("Weight updated."), E(null), void g(!1)
                }
                let t = HS(new Date),
                    r = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        type: "weight",
                        label: "Weight",
                        time: tO(e),
                        timeMinutes: e,
                        value: y
                    };
                n(e => ({
                    ...e,
                    logs: {
                        ...e.logs,
                        [t]: [...e.logs[t] || [], r]
                    }
                })), g(!1), ce(`Logged ${y}lbs`, () => me(t, r.id))
            },
            allowDecimal: !0,
            time: b,
            onTimeChange: w
        }), React.default.createElement(NO, {
            open: k,
            supplements: t.settings.supplements,
            initial: O,
            onClose: () => {
                S(!1), P(null)
            },
            onSubmit: function(e, t) {
                if (0 === e.length) return;
                let r = nO(t),
                    a = `Took: ${e.map(e=>e.qty?`${e.name} (${e.qty})`:e.name).join(", ")}`,
                    o = e.map(e => e.name);

                function i(e, t) {
                    return e.settings.supplements.map(e => o.includes(e.name) ? {
                        ...e,
                        lastTakenDate: t,
                        nextDueOverride: null
                    } : e)
                }
                if (O) {
                    let t = HS(new Date);
                    return n(n => ({
                        ...n,
                        logs: {
                            ...n.logs,
                            [t]: (n.logs[t] || []).map(t => t.id === O.id ? {
                                ...t,
                                items: e,
                                label: a,
                                time: tO(r),
                                timeMinutes: r
                            } : t)
                        },
                        settings: {
                            ...n.settings,
                            supplements: KS(i(n, t), O.items || [], e)
                        }
                    })), ce("Entry updated."), P(null), void S(!1)
                }
                let l = HS(new Date),
                    u = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        type: "supplement",
                        label: a,
                        items: e,
                        time: tO(r),
                        timeMinutes: r
                    };
                n(t => ({
                    ...t,
                    logs: {
                        ...t.logs,
                        [l]: [...t.logs[l] || [], u]
                    },
                    settings: {
                        ...t.settings,
                        supplements: KS(i(t, l), [], e)
                    }
                })), S(!1), ce(`Logged ${e.length} item${e.length>1?"s":""}`, () => me(l, u.id))
            },
            onGoToSettings: () => {
                S(!1), a("setup")
            }
        }), React.default.createElement(AO, {
            open: C,
            treatments: t.settings.treatments,
            initial: z,
            onClose: () => {
                j(!1), I(null)
            },
            onSubmit: function(e, t, r) {
                if (0 === e.length) return;
                let a = nO(r),
                    o = `Took: ${e.join(", ")}`,
                    i = !!z,
                    l = {
                        id: i ? z.id : `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        type: "treatment",
                        label: o,
                        items: e,
                        time: tO(a),
                        timeMinutes: a
                    };
                n(n => {
                    let r = {
                        ...n.logs
                    };
                    if (i) {
                        let e = Ee;
                        r[e] = (r[e] || []).filter(e => e.id !== z.id)
                    }
                    r[t] = [...r[t] || [], l];
                    let a = n.settings.treatments.map(n => e.includes(n.name) ? {
                        ...n,
                        lastTakenDate: t,
                        nextDueOverride: null
                    } : n);
                    return {
                        ...n,
                        logs: r,
                        settings: {
                            ...n.settings,
                            treatments: KS(a, i && z.items || [], e)
                        }
                    }
                }), j(!1), I(null), ce(i ? "Entry updated." : `Logged ${e.length} treatment${e.length>1?"s":""}`)
            },
            onGoToSettings: () => {
                j(!1), a("setup")
            }
        }), React.default.createElement(TO, {
            open: N,
            initial: A,
            onClose: () => {
                T(!1), M(null)
            },
            onSubmit: function(e, t, r, a) {
                let o = nO(a),
                    i = !!A,
                    l = HS(new Date),
                    u = {
                        id: i ? A.id : `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        type: "exercise",
                        label: e,
                        exerciseType: e,
                        minutes: t,
                        description: r,
                        time: tO(o),
                        timeMinutes: o
                    };
                n(e => ({
                    ...e,
                    logs: {
                        ...e.logs,
                        [l]: i ? (e.logs[l] || []).map(e => e.id === A.id ? u : e) : [...e.logs[l] || [], u]
                    }
                })), T(!1), M(null), i ? ce("Entry updated.") : ce(`Logged ${t} min of ${e}`, () => me(l, u.id))
            }
        }), React.default.createElement(_O, {
            open: _,
            data: t,
            onClose: () => D(!1)
        }), React.default.createElement(SO, {
            open: L,
            initial: B,
            activeSession: t.activeSleepSession,
            onClose: () => {
                R(!1), $(null)
            },
            onSubmit: function(e, t) {
                let r = LS(e, t),
                    a = HS(new Date);
                if (B) n(n => ({
                    ...n,
                    logs: {
                        ...n.logs,
                        [a]: (n.logs[a] || []).map(n => n.id === B.id ? {
                            ...n,
                            lightsOutMinutes: e,
                            wokeUpMinutes: t,
                            hours: r,
                            time: tO(t),
                            timeMinutes: t
                        } : n)
                    }
                })), ce("Sleep entry updated."), $(null);
                else {
                    let o = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        type: "sleep",
                        label: "Sleep",
                        time: tO(t),
                        timeMinutes: t,
                        lightsOutMinutes: e,
                        wokeUpMinutes: t,
                        hours: r
                    };
                    n(e => ({
                        ...e,
                        logs: {
                            ...e.logs,
                            [a]: [...e.logs[a] || [], o]
                        }
                    })), ce(`Logged ${r}hrs of sleep`, () => me(a, o.id))
                }
                R(!1)
            },
            onStartSleeping: function() {
                n(e => ({
                    ...e,
                    activeSleepSession: {
                        startedAt: (new Date).toISOString()
                    }
                })), R(!1), ce("Sleep session started.")
            },
            onFinishSleeping: function() {
                let e = t.activeSleepSession;
                if (!e) return;
                let r = new Date(e.startedAt),
                    a = new Date,
                    o = Math.round((a.getTime() - r.getTime()) / 36e5 * 10) / 10,
                    i = 60 * r.getHours() + r.getMinutes(),
                    l = 60 * a.getHours() + a.getMinutes(),
                    u = HS(a),
                    s = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        type: "sleep",
                        label: "Sleep",
                        time: tO(l),
                        timeMinutes: l,
                        lightsOutMinutes: i,
                        wokeUpMinutes: l,
                        hours: Math.max(0, o)
                    };
                n(e => ({
                    ...e,
                    activeSleepSession: null,
                    logs: {
                        ...e.logs,
                        [u]: [...e.logs[u] || [], s]
                    }
                })), R(!1), ce(`Logged ${Math.max(0,o)}hrs of sleep`, () => {
                    me(u, s.id), n(t => ({
                        ...t,
                        activeSleepSession: e
                    }))
                })
            },
            onCancelSession: function() {
                n(e => ({
                    ...e,
                    activeSleepSession: null
                })), R(!1), ce("Sleep session canceled.")
            }
        }), React.default.createElement(kO, {
            open: F,
            testerName: t.settings.testerName,
            onClose: () => U(!1),
            onSubmit: async function(e) {
                await async function(e) {
                    let t = rS();
                    if (!t) throw new Error("Feedback server not configured yet.");
                    let n = await fetch(`${t}/api/feedback`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(e)
                    });
                    if (!n.ok) throw new Error("Could not submit feedback — try again in a moment.");
                    return n.json()
                }({
                    ...e,
                    appVersion: xS,
                    name: t.settings.testerName || "(no name set)"
                }), U(!1), ce("Thanks for the feedback!")
            },
            onGoToSettings: () => {
                U(!1), a("settings")
            }
        }), React.default.createElement(gO, {
            toast: K,
            onDismiss: () => Q(null)
        }), Z && React.default.createElement("div", {
            className: "wt-banner"
        }, Z), React.default.createElement("nav", {
            className: "wt-nav"
        }, React.default.createElement("button", {
            className: "wt-nav-btn " + ("log" === r ? "active" : ""),
            "aria-current": "log" === r ? "page" : undefined,
            onClick: () => a("log")
        }, React.default.createElement(Droplet, {
            size: 18
        }), " Log It!"), React.default.createElement("button", {
            className: "wt-nav-btn " + ("today" === r ? "active" : ""),
            "aria-current": "today" === r ? "page" : undefined,
            onClick: () => a("today")
        }, React.default.createElement(ClipboardList, {
            size: 18
        }), " Today"), React.default.createElement("button", {
            className: "wt-nav-btn " + ("reports" === r ? "active" : ""),
            "aria-current": "reports" === r ? "page" : undefined,
            onClick: () => a("reports")
        }, React.default.createElement(BarChart3, {
            size: 18
        }), " Stats"), React.default.createElement("button", {
            className: "wt-nav-btn " + ("setup" === r ? "active" : ""),
            "aria-current": "setup" === r ? "page" : undefined,
            onClick: () => a("setup")
        }, React.default.createElement(SlidersVertical, {
            size: 18
        }), " My Plan"), React.default.createElement("button", {
            className: "wt-nav-btn " + ("settings" === r ? "active" : ""),
            "aria-current": "settings" === r ? "page" : undefined,
            onClick: () => a("settings")
        }, React.default.createElement(Settings, {
            size: 18
        }), " Settings")))
    }))
