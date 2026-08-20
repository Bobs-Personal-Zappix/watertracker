import * as er from "react";
import * as Jn from "react-dom/client";

// recharts is installed at v3.10.1 (package.json pins "latest"); the vendor code
// this app was originally bundled against looks like an older recharts major
// (e.g. class-component Legend). Export names below are unchanged across that
// gap, but runtime prop/behavior differences are possible and haven't been
// verified yet.
import {
  ResponsiveContainer as zl,
  CartesianGrid as rE,
  XAxis as IE,
  YAxis as XE,
  Tooltip as Pl,
  Legend as Ii,
  ReferenceLine as zw,
  Bar as Xb,
  Cell as Il,
  Line as SE,
  LineChart as Jk,
  BarChart as eS,
} from "recharts";

import {
  BarChart3 as ur,
  Battery as sr,
  Bed as cr,
  Bell as fr,
  ChevronLeft as dr,
  ChevronRight as pr,
  ClipboardList as mr,
  Clock as hr,
  Cloud as gr,
  Download as yr,
  Droplet as vr,
  Dumbbell as br,
  Flame as wr,
  Mail as xr,
  Moon as Er,
  Pencil as kr,
  Pill as Sr,
  Plus as Or,
  Settings as Pr,
  SlidersVertical as Cr,
  Syringe as jr,
  Trash2 as Nr,
  Weight as Tr,
  X as Ar,
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
        xS = "3.13.0",
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
    var iO = "\n@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');\n\n.wt-root, .wt-root * { box-sizing: border-box; }\n.wt-root {\n  --ink:#0B2038; --deep:#1B4F72; --teal:#2E86C1; --teal-light:#8AC4E8;\n  --mist:#DCEAF5; --citrus:#E3A83B; --success:#2F8F5B; --light-green:#8DDD9B; --orange:#F0923B; --paper:#F2F5F8; --line:#D5E1EC;\n  --danger:#C1523E; --muted:#5C7085;\n  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\n  background:var(--paper); color:var(--ink); min-height:100vh; position:relative;\n  padding-bottom:78px;\n}\n.wt-root :focus-visible { outline:2px solid var(--teal); outline-offset:2px; }\n@media (prefers-reduced-motion: reduce) {\n  .wt-root * { animation:none !important; transition:none !important; }\n}\n\n.wt-topbanner { position:relative; background:linear-gradient(135deg, #0B4F72 0%, #158FB0 52%, #35D6E8 100%); padding:22px 16px 28px; overflow:hidden; }\n.wt-topbanner-inner { display:flex; align-items:center; justify-content:center; gap:12px; position:relative; z-index:1; }\n.wt-topbanner-badge { width:82px; height:82px; flex-shrink:0; filter:drop-shadow(0 4px 10px rgba(4,40,54,.45)); }\n.wt-topbanner-badge img { width:100%; height:100%; object-fit:contain; }\n.wt-topbanner-text { display:flex; flex-direction:column; align-items:flex-start; line-height:1.18; }\n.wt-topbanner-title { font-family:'Space Grotesk',sans-serif; font-size:27px; font-weight:700; color:#fff; letter-spacing:.01em; }\n.wt-topbanner-wave { position:absolute; bottom:-1px; left:0; width:100%; height:20px; display:block; }\n.wt-topbanner-wave path { fill:var(--paper); }\n\n.wt-frame { max-width:420px; margin:0 auto; padding:18px 18px 4px; }\n\n.wt-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }\n.wt-date { font-size:16px; color:var(--muted); }\n.wt-date-label { font-weight:700; color:var(--ink); text-transform:uppercase; }\n\n.wt-trackers-row { display:flex; gap:6px; margin:8px 0 6px; align-items:stretch; }\n.wt-trackers-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0 6px; }\n.wt-tracker-col { flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; background:#fff; border:1px solid var(--line); border-radius:14px; padding:8px 4px; }\n.wt-tracker-col-clickable { cursor:pointer; transition:transform .1s ease, box-shadow .1s ease; -webkit-tap-highlight-color:transparent; }\n.wt-tracker-col-clickable:active { transform:scale(0.97); box-shadow:0 1px 4px rgba(0,0,0,.08); }\n.wt-full-width-btn { width:100%; margin-top:10px; background:var(--indigo); }\n.wt-full-width-btn-pill { background:var(--success); }\n.wt-full-width-btn-treatment { background:var(--orange); }\n.wt-tracker-label { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:16px; color:var(--ink); text-transform:uppercase; letter-spacing:.01em; margin-bottom:3px; display:flex; align-items:center; gap:4px; white-space:nowrap; }\n.wt-tracker-goal { font-size:11.5px; color:var(--muted); margin-bottom:3px; font-weight:600; }\n.wt-divider { border-top:1px solid var(--line); margin:20px 0 4px; }\n.wt-tracker-number { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:22px; text-align:center; line-height:1; margin-top:3px; }\n.wt-tracker-in-label { text-align:center; font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; margin-top:1px; margin-bottom:4px; }\n.wt-tracker-number .unit { font-size:10px; font-weight:500; color:var(--muted); margin-left:1px; }\n.wt-tracker-sub { text-align:center; font-size:13px; font-weight:700; color:var(--ink); margin-top:1px; margin-bottom:4px; line-height:1.2; min-height:28px; display:flex; align-items:center; justify-content:center; }\n.wt-tracker-btn { padding:9px 4px; font-size:13.5px; font-weight:700; width:100%; gap:4px; background:var(--deep); }\n.wt-tracker-btn-sleep { background:var(--indigo); }\n.wt-btn-text { display:block; width:100%; background:none; border:none; padding:10px 4px; font-size:13.5px; font-weight:600; color:var(--deep); cursor:pointer; font-family:inherit; text-align:center; }\n.wt-btn-text-danger { color:var(--danger); }\n.wt-inline-link { display:inline; background:none; border:none; padding:0; margin:0; font:inherit; font-weight:700; color:inherit; text-decoration:underline; cursor:pointer; }\n.wt-tracker-presets { display:flex; flex-wrap:wrap; justify-content:center; gap:4px; margin-top:8px; }\n.wt-chip-sm { padding:5px 9px; font-size:11px; }\n\n.wt-gauge-wrap { position:relative; margin:0 auto; }\n.wt-gauge-svg { display:block; }\n.wt-gauge-ring { width:82px; height:82px; }\n.wt-gauge-ring circle[stroke-dasharray] { transition:stroke-dashoffset .7s cubic-bezier(.22,1,.36,1); }\n.wt-sleep-preview { text-align:center; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:17px; color:var(--deep); background:var(--mist); border-radius:10px; padding:10px; margin-bottom:16px; }\n.wt-overflow { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:fit-content; text-align:center; font-family:'Space Grotesk',sans-serif; font-size:9px; font-weight:700; color:var(--ink); background:var(--citrus); border-radius:999px; padding:3px 7px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,.18); }\n\n.wt-today-number { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:38px; text-align:center; line-height:1; margin-top:6px; }\n.wt-today-number .unit { font-size:16px; font-weight:500; color:var(--muted); margin-left:3px; }\n.wt-today-sub { text-align:center; font-size:13px; color:var(--muted); margin-top:4px; margin-bottom:16px; }\n\n.wt-btn-primary { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; background:var(--deep); color:#fff; border:none; border-radius:12px; padding:13px 16px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }\n.wt-btn-primary:disabled { opacity:.4; cursor:not-allowed; }\n.wt-btn-secondary { display:flex; align-items:center; justify-content:center; gap:6px; background:#fff; color:var(--deep); border:1.5px solid var(--line); border-radius:12px; padding:11px 14px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }\n.wt-btn-ghost { background:none; border:none; color:var(--muted); font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }\n.wt-btn-danger { color:var(--danger); }\n\n.wt-preset-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0 4px; }\n.wt-preset-btn { background:#fff; border:1.5px solid var(--line); border-radius:11px; padding:12px 10px; font-size:13.5px; font-weight:600; color:var(--ink); cursor:pointer; font-family:inherit; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }\n.wt-preset-add-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; background:#fff; border:1.5px dashed var(--line); border-radius:12px; padding:14px 10px; margin:10px 0 4px; font-size:14.5px; font-weight:700; color:var(--deep); cursor:pointer; font-family:inherit; }\n.wt-chip { display:flex; align-items:center; gap:6px; background:#fff; border:1.5px solid var(--line); border-radius:999px; padding:8px 13px; font-size:13.5px; font-weight:600; color:var(--ink); cursor:pointer; font-family:inherit; }\n.wt-chip-oz { color:var(--teal); font-weight:700; }\n.wt-chip-ghost { color:var(--muted); border-style:dashed; }\n\n.wt-section-label { font-family:'Space Grotesk',sans-serif; font-size:12.5px; font-weight:600; letter-spacing:.02em; color:var(--muted); text-transform:uppercase; margin:22px 0 8px; }\n.wt-section-label-lg { font-size:16px; }\n.wt-empty-note { font-size:13.5px; color:var(--muted); background:#fff; border:1px dashed var(--line); border-radius:12px; padding:14px; text-align:center; }\n\n.wt-log-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }\n.wt-log-row { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--line); border-radius:10px; padding:9px 10px; font-size:13.5px; }\n.wt-todo-today-sticky { position:sticky; top:0; z-index:5; background:var(--paper); padding-top:2px; margin-bottom:2px; }\n.wt-todo-today-scroll { max-height:34vh; overflow-y:auto; -webkit-overflow-scrolling:touch; }\n.wt-today-log-scroll { min-height:50vh; max-height:62vh; overflow-y:auto; -webkit-overflow-scrolling:touch; }\n.wt-treatment-row { display:flex; align-items:center; gap:10px; background:#fff; border:1.5px solid var(--line); border-radius:12px; padding:11px 12px; margin-bottom:8px; }\n.wt-treatment-overdue { border-color:var(--danger); background:#FBEEEC; }\n.wt-treatment-today { border-color:var(--orange); background:#FEF3E8; }\n.wt-treatment-info { flex:1; min-width:0; display:flex; flex-direction:column; }\n.wt-treatment-name { font-weight:700; font-size:14px; color:var(--ink); }\n.wt-treatment-due-label { font-size:12px; font-weight:600; color:var(--muted); }\n.wt-treatment-overdue .wt-treatment-due-label { color:var(--danger); }\n.wt-treatment-today .wt-treatment-due-label { color:var(--orange); }\n.wt-treatment-date-input { border:1.5px solid var(--line); border-radius:8px; padding:6px 8px; font-size:12.5px; font-family:inherit; width:132px; flex-shrink:0; }\n\n.wt-doctor-share-overlay { position:fixed; inset:0; background:var(--paper); z-index:80; overflow-y:auto; }\n.wt-doctor-share-toolbar { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--line); background:#fff; position:sticky; top:0; z-index:2; }\n.wt-doctor-share-toolbar h3 { margin:0; font-size:16px; }\n.wt-doctor-share-controls { padding:14px 18px; background:#fff; border-bottom:1px solid var(--line); }\n.wt-doctor-share-range-label { font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; display:block; margin-bottom:8px; }\n.wt-doctor-share-content { max-width:640px; margin:0 auto; padding:24px 20px 60px; }\n.wt-doctor-share-header { text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid var(--ink); }\n.wt-doctor-share-header h1 { font-size:19px; margin:0 0 4px; }\n.wt-doctor-share-name { font-weight:700; font-size:15px; margin:0 0 2px; }\n.wt-doctor-share-dates { font-size:13px; color:var(--muted); margin:0; }\n.wt-doctor-share-section { margin-bottom:22px; }\n.wt-doctor-share-section h2 { font-size:14px; text-transform:uppercase; letter-spacing:.03em; color:var(--deep); border-bottom:1px solid var(--line); padding-bottom:6px; margin:0 0 10px; }\n.wt-doctor-share-empty { font-size:13px; color:var(--muted); font-style:italic; }\n.wt-doctor-share-table { width:100%; border-collapse:collapse; font-size:13px; }\n.wt-doctor-share-table th { text-align:left; font-weight:700; color:var(--muted); font-size:11.5px; text-transform:uppercase; padding:4px 8px; border-bottom:1.5px solid var(--line); }\n.wt-doctor-share-table td { padding:6px 8px; border-bottom:1px solid var(--mist); }\n.wt-doctor-share-disclaimer { font-size:11px; color:var(--muted); margin-top:30px; padding-top:14px; border-top:1px solid var(--line); line-height:1.5; }\n.wt-share-link-box { font-size:12px; word-break:break-all; background:var(--mist); border:1.5px dashed var(--deep); border-radius:8px; padding:10px; color:var(--ink); user-select:all; }\n\n@media print {\n  .wt-no-print { display:none !important; }\n  /* Hide every other direct child of the app's root wrapper - display:none removes\n     them from layout entirely, unlike visibility:hidden (which was the original,\n     broken approach: hidden elements still occupy space, so everything above the\n     doctor-share overlay in the DOM pushed it thousands of pixels off-screen). */\n  .wt-root > *:not(.wt-doctor-share-overlay) { display:none !important; }\n  .wt-doctor-share-overlay { position:static !important; overflow:visible !important; }\n  .wt-doctor-share-content { max-width:none; padding:0; margin:0; }\n}\n.wt-log-icon { color:var(--muted); flex-shrink:0; }\n.wt-log-time { color:var(--ink); font-weight:700; width:64px; flex-shrink:0; }\n.wt-log-label { flex:1; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n.wt-log-oz { color:var(--teal); font-weight:700; margin-right:4px; }\n.wt-log-metrics { display:flex; align-items:center; font-size:13px; margin-right:4px; white-space:nowrap; }\n.wt-icon-btn { background:none; border:none; color:var(--muted); padding:4px; display:flex; cursor:pointer; }\n.wt-icon-btn:hover { color:var(--danger); }\n\n.wt-backdrop { position:fixed; inset:0; background:rgba(14,42,46,.45); display:flex; align-items:flex-end; justify-content:center; z-index:50; }\n.wt-backdrop.wt-center { align-items:center; padding:20px; }\n.wt-sheet { width:100%; max-width:420px; background:var(--paper); border-radius:20px 20px 0 0; padding:18px 18px 26px; }\n.wt-modal { width:100%; max-width:360px; background:var(--paper); border-radius:16px; padding:18px; }\n.wt-modal-tall { max-height:80vh; overflow-y:auto; }\n.wt-help-section { margin-bottom:18px; }\n.wt-help-section:last-child { margin-bottom:0; }\n.wt-help-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:14px; margin:0 0 6px; color:var(--ink); }\n.wt-help-list { margin:0; padding-left:18px; font-size:13px; color:var(--muted); line-height:1.5; }\n.wt-help-list li { margin-bottom:4px; }\n.wt-sheet-header, .wt-modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }\n.wt-sheet-header h3, .wt-modal-header h3 { font-family:'Space Grotesk',sans-serif; font-size:16px; margin:0; }\n\n\n\n.wt-field { display:block; font-size:12.5px; color:var(--muted); font-weight:600; margin-bottom:14px; }\n.wt-field input, .wt-field select, .wt-field textarea { display:block; width:100%; margin-top:6px; padding:11px 12px; border:1.5px solid var(--line); border-radius:10px; font-size:15px; font-family:inherit; background:#fff; color:var(--ink); }\n.wt-field-row { display:flex; gap:10px; }\n.wt-dial-trigger { width:100%; padding:11px 8px; border-radius:10px; border:1.5px solid var(--line); background:#fff; font-size:17px; font-weight:700; font-family:'Space Grotesk',sans-serif; color:var(--ink); text-align:center; cursor:pointer; }\n.wt-dial { width:220px; height:220px; display:block; margin:6px auto 0; touch-action:none; cursor:grab; }\n.wt-dial-number { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:44px; fill:var(--ink); user-select:none; }\n.wt-dial-tick { font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:13px; fill:var(--muted); user-select:none; }\n.wt-field-row .wt-field { flex:1; }\n.wt-feedback-q { margin-bottom: 16px; }\n.wt-feedback-label { font-size:13px; font-weight:700; color:var(--ink); margin:0 0 8px; }\n.wt-chip-row { display:flex; flex-wrap:wrap; gap:8px; }\n.wt-chip { padding:9px 14px; border-radius:20px; border:1.5px solid var(--line); background:#fff; font-size:12.5px; font-weight:600; color:var(--muted); cursor:pointer; font-family:inherit; }\n.wt-chip.active { background:var(--deep); border-color:var(--deep); color:#fff; }\n.wt-qty-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--line); }\n.wt-qty-row:last-child { border-bottom:none; }\n.wt-qty-name { flex:1; font-size:13.5px; font-weight:600; color:var(--ink); }\n.wt-recovery-code { font-family:'Space Grotesk',monospace; font-size:22px; font-weight:700; letter-spacing:.08em; text-align:center; color:var(--ink); background:var(--mist); border:1.5px dashed var(--deep); border-radius:10px; padding:12px 8px; user-select:all; }\n.wt-qty-input { width:120px; padding:8px 10px; border:1.5px solid var(--line); border-radius:8px; font-size:13.5px; font-family:inherit; }\n.wt-sheet-tall { max-height:85vh; overflow-y:auto; }\n\n.wt-toast { position:fixed; left:50%; bottom:88px; transform:translateX(-50%); background:var(--ink); color:#fff; padding:10px 16px; border-radius:999px; font-size:13.5px; display:flex; align-items:center; gap:12px; z-index:60; box-shadow:0 6px 18px rgba(0,0,0,.18); max-width:90%; }\n.wt-toast button { background:none; border:none; color:var(--teal-light); font-weight:700; cursor:pointer; font-family:inherit; flex-shrink:0; }\n\n.wt-banner { position:fixed; top:14px; left:50%; transform:translateX(-50%); background:var(--citrus); color:var(--ink); padding:11px 18px; border-radius:12px; font-size:13.5px; font-weight:600; z-index:60; box-shadow:0 6px 18px rgba(0,0,0,.15); }\n\n.wt-nav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:min(420px,100%); background:#fff; border-top:1px solid var(--line); display:flex; padding:8px 6px calc(8px + env(safe-area-inset-bottom,0px)); z-index:40; }\n.wt-nav-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; color:var(--muted); font-size:11px; font-weight:600; padding:6px 0; cursor:pointer; font-family:inherit; border-radius:10px; }\n.wt-nav-btn.active { color:var(--deep); background:var(--mist); }\n.wt-nav-btn-soon { position:relative; opacity:0.55; cursor:default; }\n.wt-soon-badge { position:absolute; top:-2px; left:50%; transform:translateX(-50%) rotate(-6deg); background:var(--citrus); color:var(--ink); font-size:6.5px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; padding:1.5px 5px; border-radius:5px; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,.25); }\n\n.wt-segment { display:flex; background:#fff; border:1.5px solid var(--line); border-radius:11px; padding:3px; margin-bottom:14px; }\n.wt-segment button { flex:1; background:none; border:none; padding:8px 0; font-size:13.5px; font-weight:600; color:var(--muted); border-radius:8px; cursor:pointer; font-family:inherit; }\n.wt-segment button.active { background:var(--deep); color:#fff; }\n\n.wt-range-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }\n.wt-range-nav button { background:#fff; border:1.5px solid var(--line); border-radius:8px; padding:6px; display:flex; cursor:pointer; color:var(--deep); }\n.wt-range-nav button:disabled { opacity:.35; cursor:not-allowed; }\n.wt-range-label { font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600; }\n\n.wt-stat-row { display:flex; gap:8px; margin-bottom:16px; }\n.wt-stat { flex:1; background:#fff; border:1px solid var(--line); border-radius:12px; padding:10px; text-align:center; }\n.wt-stat-value { font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:700; }\n.wt-stat-label { font-size:10.5px; color:var(--muted); margin-top:2px; }\n\n.wt-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px; margin-bottom:16px; }\n.wt-card-title { display:flex; align-items:center; gap:7px; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:14.5px; margin-bottom:4px; }\n.wt-card-note { font-size:12.5px; color:var(--muted); margin-bottom:12px; line-height:1.5; }\n.wt-toggle-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }\n.wt-switch { width:42px; height:24px; border-radius:999px; background:var(--line); position:relative; border:none; cursor:pointer; flex-shrink:0; }\n.wt-switch.on { background:var(--teal); }\n.wt-switch span { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:transform .2s ease; }\n.wt-switch.on span { transform:translateX(18px); }\n\n.wt-preset-row { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--line); border-radius:10px; padding:10px 11px; margin-bottom:8px; }\n.wt-preset-name { flex:1; font-weight:600; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n.wt-preset-oz { color:var(--teal); font-weight:700; font-size:13.5px; margin-right:2px; }\n\n.wt-loading { padding:60px 20px; text-align:center; color:var(--muted); font-family:inherit; }\n";

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
        return er.default.createElement("div", {
            className: "wt-gauge-wrap"
        }, er.default.createElement("svg", {
            viewBox: "0 0 100 100",
            className: "wt-gauge-svg wt-gauge-ring"
        }, er.default.createElement("defs", null, er.default.createElement("clipPath", {
            id: `ring-clip-${r}`
        }, er.default.createElement("circle", {
            cx: "50",
            cy: "50",
            r: "34"
        }))), er.default.createElement("image", {
            href: `${o}/${r}.png`,
            x: "12",
            y: "12",
            width: "76",
            height: "76",
            clipPath: `url(#ring-clip-${r})`
        }), er.default.createElement("circle", {
            cx: "50",
            cy: "50",
            r: 42,
            fill: "none",
            stroke: a,
            strokeWidth: "7.5",
            opacity: "0.42"
        }), er.default.createElement("circle", {
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
        }), er.default.createElement("circle", {
            cx: c,
            cy: f,
            r: "5.5",
            fill: "#fff",
            stroke: a,
            strokeWidth: "2.5"
        })), t && er.default.createElement("div", {
            className: "wt-overflow"
        }, n))
    }

    function uO({
        todayValue: e,
        goal: t,
        recordedToday: n
    }) {
        let r = n && t > 0 ? e / t * 100 : 0;
        return er.default.createElement(lO, {
            pct: r,
            over: !1,
            overText: "",
            imageSrc: "weight",
            ringColor: yS,
            folder: "tile-icons"
        })
    }

    function sO({
        pct: e
    }) {
        return er.default.createElement(lO, {
            pct: e,
            over: !1,
            overText: "",
            imageSrc: "supplements",
            ringColor: hS,
            folder: "tile-icons"
        })
    }

    function cO({
        pct: e
    }) {
        return er.default.createElement(lO, {
            pct: e,
            over: !1,
            overText: "",
            imageSrc: "treatments",
            ringColor: mS,
            folder: "tile-icons"
        })
    }

    function fO({
        minutes: e,
        goalMinutes: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0;
        return er.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${e-t}min`,
            imageSrc: "exercise",
            ringColor: gS,
            folder: "tile-icons"
        })
    }

    function dO({
        consumedOz: e,
        goalOz: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0;
        return er.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${e-t}oz`,
            imageSrc: "water",
            ringColor: mS
        })
    }

    function pO({
        consumedGrams: e,
        goalGrams: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0;
        return er.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${e-t}g`,
            imageSrc: "protein",
            ringColor: hS
        })
    }

    function mO({
        consumedCal: e,
        goalCal: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0;
        return er.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${e-t}cal`,
            imageSrc: "calories",
            ringColor: gS
        })
    }

    function hO({
        hours: e,
        goalHours: t
    }) {
        let n = e / Math.max(1, t) * 100,
            r = e > t && t > 0,
            a = Math.round(10 * (e - t)) / 10;
        return er.default.createElement(lO, {
            pct: n,
            over: r,
            overText: `+${a}hrs`,
            imageSrc: "sleep",
            ringColor: yS
        })
    }

    function gO({
        toast: e,
        onDismiss: t
    }) {
        return e ? er.default.createElement("div", {
            className: "wt-toast"
        }, er.default.createElement("span", null, e.message), e.undo && er.default.createElement("button", {
            onClick: () => {
                e.undo(), t()
            }
        }, "Undo")) : null
    }

    function yO({
        open: e,
        onClose: t
    }) {
        return e ? er.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: t
        }, er.default.createElement("div", {
            className: "wt-modal wt-modal-tall",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-modal-header"
        }, er.default.createElement("h3", null, "How to use this"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: t,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("div", {
            className: "wt-help-section"
        }, er.default.createElement("p", {
            className: "wt-help-title"
        }, "Getting started"), er.default.createElement("ul", {
            className: "wt-help-list"
        }, er.default.createElement("li", null, "Add this to your home screen (share icon → Add to Home Screen) so it opens like a real app."), er.default.createElement("li", null, "Set your daily goals for water, protein, and calories in Setup — the defaults are just a starting point."), er.default.createElement("li", null, "Turn on notifications under Remind if you want reminders through the day."))), er.default.createElement("div", {
            className: "wt-help-section"
        }, er.default.createElement("p", {
            className: "wt-help-title"
        }, "Logging something"), er.default.createElement("ul", {
            className: "wt-help-list"
        }, er.default.createElement("li", null, "Tap Log under Water, Protein, or Calories on the main screen."), er.default.createElement("li", null, "Pick a quick amount, or enter a custom one and adjust the time if you're catching up on something from earlier."), er.default.createElement("li", null, "Sleep works differently — tap Log Sleep and enter Lights Out and Woke Up times; the hours are calculated for you, including overnight sessions that cross midnight. Naps use the same button and add to the day's total."), er.default.createElement("li", null, "Made a mistake? Tap the trash icon next to the entry in Today's log to remove it."))), er.default.createElement("div", {
            className: "wt-help-section"
        }, er.default.createElement("p", {
            className: "wt-help-title"
        }, "Presets — one-tap logging"), er.default.createElement("ul", {
            className: "wt-help-list"
        }, er.default.createElement("li", null, "In Settings, add anything you log often — a drink, a shake, a usual snack — with its amount."), er.default.createElement("li", null, "It shows up as a button on the main screen. One tap logs it, no typing."))), er.default.createElement("div", {
            className: "wt-help-section"
        }, er.default.createElement("p", {
            className: "wt-help-title"
        }, "Reports"), er.default.createElement("ul", {
            className: "wt-help-list"
        }, er.default.createElement("li", null, 'Switch between Water / Protein / Cal / Sleep at the top, or pick "All 4" to compare all of them at once.'), er.default.createElement("li", null, '"All 4" shows each as a percentage of its own goal, since oz, grams, calories, and hours don\'t share a scale.'), er.default.createElement("li", null, "Switch between Day / Week / Month, and use the arrows to look back at previous ones."))), er.default.createElement("div", {
            className: "wt-help-section"
        }, er.default.createElement("p", {
            className: "wt-help-title"
        }, "Reminders"), er.default.createElement("ul", {
            className: "wt-help-list"
        }, er.default.createElement("li", null, "Push notifications: real alerts even with the app closed. Turn on in Settings."), er.default.createElement("li", null, "Bedtime reminder: a separate, once-a-day push at whatever time you want to start winding down — set it in Remind too."), er.default.createElement("li", null, "In-app nudge: only works while this is open on screen — a lighter backup, not the main way."), er.default.createElement("li", null, "Calendar file: a one-time download that adds recurring reminders to your phone's own calendar."))), er.default.createElement("div", {
            className: "wt-help-section"
        }, er.default.createElement("p", {
            className: "wt-help-title"
        }, "Backing up your data"), er.default.createElement("ul", {
            className: "wt-help-list"
        }, er.default.createElement("li", null, "In Settings → Backup, export a backup before switching phones or reinstalling."), er.default.createElement("li", null, "Import it on the new device to bring your history back — nothing is stored anywhere else."))), er.default.createElement("p", {
            style: {
                fontSize: 12,
                color: wS,
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
        return e ? er.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: a
        }, er.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-modal-header"
        }, er.default.createElement("h3", null, t)), er.default.createElement("p", {
            style: {
                fontSize: 13.5,
                color: wS,
                marginTop: 0,
                marginBottom: 18
            }
        }, n), er.default.createElement("div", {
            style: {
                display: "flex",
                gap: 10
            }
        }, er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            },
            onClick: a
        }, "Cancel"), er.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                flex: 1,
                background: r ? bS : pS
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
        let a = (0, er.useRef)(null),
            o = (0, er.useRef)(!1);

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
        return er.default.createElement("svg", {
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
        }, er.default.createElement("circle", {
            cx: u,
            cy: s,
            r: "98",
            fill: "transparent"
        }), er.default.createElement("circle", {
            cx: u,
            cy: s,
            r: 70,
            fill: "none",
            stroke: n,
            strokeWidth: "16",
            opacity: "0.18"
        }), er.default.createElement("circle", {
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
        }), p.map((e, t) => er.default.createElement("text", {
            key: t,
            x: e.pos.x,
            y: e.pos.y,
            textAnchor: "middle",
            dominantBaseline: "middle",
            className: "wt-dial-tick"
        }, e.val)), er.default.createElement("circle", {
            cx: d.x,
            cy: d.y,
            r: "15",
            fill: "#fff",
            stroke: n,
            strokeWidth: "4"
        }), er.default.createElement("text", {
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
        return er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: e => {
                e.stopPropagation(), p()
            }
        }, er.default.createElement("div", {
            className: "wt-sheet",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, t), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: p,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -6,
                marginBottom: 16,
                textAlign: "center"
            }
        }, u ? "Drag the dial for a rough number, or type the exact amount down below." : f ? 'Drag the dial or type an amount, then log it. Want to pick from your presets, or add a description or different time? Use "Manual or Presets Entry".' : "Drag the dial to the amount you consumed, or manually type in the exact amount down below."), er.default.createElement(bO, {
            value: a,
            max: r,
            color: o,
            onChange: i
        }), er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginTop: 18
            }
        }, n, er.default.createElement("input", {
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
        })), c && er.default.createElement("label", {
            className: "wt-field"
        }, "Time", er.default.createElement("input", {
            type: "time",
            value: s,
            onChange: e => c(e.target.value)
        })), f ? er.default.createElement(er.default.Fragment, null, er.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                marginTop: 16
            },
            disabled: a <= 0,
            onClick: f
        }, a > 0 ? `Log ${a}${n}` : "Log"), er.default.createElement("button", {
            className: "wt-btn-text",
            onClick: l
        }, "Manual or Presets Entry")) : er.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                marginTop: 16
            },
            onClick: l
        }, "Done")))
    }

    function xO({
        open: e,
        initial: t,
        quickFill: n,
        onClose: r,
        onSubmit: a,
        presets: o,
        onQuickLogPreset: i
    }) {
        let [l, u] = (0, er.useState)(""), [s, c] = (0, er.useState)(""), [f, d] = (0, er.useState)(""), [p, m] = (0, er.useState)(""), [h, g] = (0, er.useState)(JS()), [y, v] = (0, er.useState)(null);
        if ((0, er.useEffect)(() => {
                e && (u(t && t.oz ? String(t.oz) : n && "oz" === n.field ? String(n.value) : ""), c(t && t.grams ? String(t.grams) : n && "grams" === n.field ? String(n.value) : ""), d(t && t.calories ? String(t.calories) : n && "calories" === n.field ? String(n.value) : ""), m(t ? t.label : ""), g(t ? eO(t.timeMinutes) : JS()), v(null))
            }, [e, t, n]), !e) return null;
        let b = Number(l) || 0,
            w = Number(s) || 0,
            x = Number(f) || 0,
            E = (b > 0 || w > 0 || x > 0) && "" !== h;
        return er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, er.default.createElement("div", {
            className: "wt-sheet",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, t ? "Edit entry" : "Log"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -6,
                marginBottom: 16
            }
        }, "Fill in whichever apply — leave the rest blank."), !t && o && o.length > 0 && er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                fontWeight: 700,
                color: wS,
                textTransform: "uppercase",
                letterSpacing: ".04em",
                marginBottom: 8
            }
        }, "Presets — tap to log instantly"), er.default.createElement("div", {
            className: "wt-preset-grid",
            style: {
                maxHeight: 160,
                overflowY: "auto",
                marginBottom: 8
            }
        }, [...o].sort((e, t) => e.name.localeCompare(t.name)).map(e => er.default.createElement("button", {
            key: e.id,
            className: "wt-preset-btn",
            onClick: () => i(e)
        }, e.name))), er.default.createElement("div", {
            className: "wt-divider",
            style: {
                margin: "4px 0 18px"
            }
        })), er.default.createElement("div", {
            className: "wt-field-row"
        }, er.default.createElement("label", {
            className: "wt-field"
        }, "Water (oz)", er.default.createElement("button", {
            type: "button",
            className: "wt-dial-trigger",
            onClick: () => v("oz")
        }, l || "0")), er.default.createElement("label", {
            className: "wt-field"
        }, "Protein (g)", er.default.createElement("button", {
            type: "button",
            className: "wt-dial-trigger",
            onClick: () => v("grams")
        }, s || "0")), er.default.createElement("label", {
            className: "wt-field"
        }, "Calories", er.default.createElement("button", {
            type: "button",
            className: "wt-dial-trigger",
            onClick: () => v("calories")
        }, f || "0"))), er.default.createElement("label", {
            className: "wt-field"
        }, "Description (optional)", er.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Post-workout shake",
            value: p,
            onChange: e => m(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Time", er.default.createElement("input", {
            type: "time",
            value: h,
            onChange: e => g(e.target.value)
        })), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -8,
                marginBottom: 14
            }
        }, "Defaults to now — change it if you're catching up on something from earlier today."), er.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: !E,
            onClick: () => a({
                oz: b,
                grams: w,
                calories: x
            }, h, p)
        }, t ? "Save changes" : "Log Items")), er.default.createElement(wO, {
            open: "oz" === y,
            title: "Water",
            unit: "oz",
            max: 64,
            value: b,
            color: mS,
            onChange: e => u(String(e)),
            onClose: () => v(null)
        }), er.default.createElement(wO, {
            open: "grams" === y,
            title: "Protein",
            unit: "g",
            max: 80,
            value: w,
            color: hS,
            onChange: e => c(String(e)),
            onClose: () => v(null)
        }), er.default.createElement(wO, {
            open: "calories" === y,
            title: "Calories",
            unit: "cal",
            max: 800,
            value: x,
            color: gS,
            onChange: e => d(String(e)),
            onClose: () => v(null)
        }))
    }

    function EO({
        label: e,
        options: t,
        value: n,
        onChange: r
    }) {
        return er.default.createElement("div", {
            className: "wt-feedback-q"
        }, er.default.createElement("p", {
            className: "wt-feedback-label"
        }, e), er.default.createElement("div", {
            className: "wt-chip-row"
        }, t.map(e => er.default.createElement("button", {
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
        let [o, i] = (0, er.useState)(""), [l, u] = (0, er.useState)(""), [s, c] = (0, er.useState)(""), [f, d] = (0, er.useState)(""), [p, m] = (0, er.useState)(""), [h, g] = (0, er.useState)(""), [y, v] = (0, er.useState)(""), [b, w] = (0, er.useState)(!1), [x, E] = (0, er.useState)("");
        if ((0, er.useEffect)(() => {
                e && (i(""), u(""), c(""), d(""), m(""), g(""), v(""), w(!1), E(""))
            }, [e]), !e) return null;
        let k = "" !== o;
        return er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: n
        }, er.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, "Feedback"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -6,
                marginBottom: 16
            }
        }, "Takes about 30 seconds — only the first question is required."), t ? er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -4,
                marginBottom: 16
            }
        }, "Submitting as ", er.default.createElement("b", {
            style: {
                color: dS
            }
        }, t), ".") : er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: -4,
                marginBottom: 16
            }
        }, "No name set — this will be submitted anonymously.", " ", er.default.createElement("button", {
            type: "button",
            className: "wt-inline-link",
            onClick: a
        }, "Add your name")), er.default.createElement(EO, {
            label: "Overall, how's it going?",
            options: ["Great", "Good", "OK", "Frustrating"],
            value: o,
            onChange: i
        }), er.default.createElement(EO, {
            label: "Are you using it every day?",
            options: ["Yes, every day", "Most days", "A few times a week", "Not really"],
            value: l,
            onChange: u
        }), er.default.createElement(EO, {
            label: "Do you enter things immediately or more in bunches?",
            options: ["Right away, each time", "In a batch, later", "A mix of both"],
            value: s,
            onChange: c
        }), er.default.createElement(EO, {
            label: "Do you like the dials for entry?",
            options: ["Love them", "They're fine", "Prefer typing", "Haven't tried them"],
            value: f,
            onChange: d
        }), er.default.createElement("label", {
            className: "wt-field"
        }, "What's working well? (optional)", er.default.createElement("textarea", {
            rows: "2",
            value: p,
            onChange: e => m(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "What's frustrating or missing? (optional)", er.default.createElement("textarea", {
            rows: "2",
            value: h,
            onChange: e => g(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Anything specific you'd want added? (optional)", er.default.createElement("textarea", {
            rows: "2",
            value: y,
            onChange: e => v(e.target.value)
        })), x && er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 4,
                marginBottom: 10
            }
        }, x), er.default.createElement("button", {
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
        let [u, s] = (0, er.useState)(!1), [c, f] = (0, er.useState)("22:00"), [d, p] = (0, er.useState)("06:00");
        if ((0, er.useEffect)(() => {
                e && (s(!!t), f(t ? eO(t.lightsOutMinutes) : "22:00"), p(t ? eO(t.wokeUpMinutes) : JS()))
            }, [e, t]), !e) return null;
        let m = nO(c),
            h = nO(d),
            g = LS(m, h),
            y = function(e, t) {
                return e > t
            }(m, h),
            v = g > 0;
        if (t || u) return er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, er.default.createElement("div", {
            className: "wt-sheet",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, t ? "Edit sleep" : "Log Sleep"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -6,
                marginBottom: 16
            }
        }, "If Lights Out was last night, just pick that time — crossing into today is handled automatically."), er.default.createElement("div", {
            className: "wt-field-row"
        }, er.default.createElement("label", {
            className: "wt-field"
        }, "Lights Out", er.default.createElement("input", {
            type: "time",
            value: c,
            onChange: e => f(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Woke Up", er.default.createElement("input", {
            type: "time",
            value: d,
            onChange: e => p(e.target.value)
        }))), er.default.createElement("div", {
            className: "wt-sleep-preview"
        }, "= ", g, "hrs", y ? " (overnight)" : " (nap)"), er.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: !v,
            onClick: () => a(m, h)
        }, t ? "Save changes" : "Log Sleep"), !t && er.default.createElement("button", {
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
            return er.default.createElement("div", {
                className: "wt-backdrop",
                onClick: r
            }, er.default.createElement("div", {
                className: "wt-sheet",
                onClick: e => e.stopPropagation()
            }, er.default.createElement("div", {
                className: "wt-sheet-header"
            }, er.default.createElement("h3", null, "Sleeping"), er.default.createElement("button", {
                className: "wt-icon-btn",
                onClick: r,
                "aria-label": "Close"
            }, er.default.createElement(Ar, {
                size: 18
            }))), er.default.createElement("p", {
                style: {
                    fontSize: 13.5,
                    color: dS,
                    marginTop: -6,
                    marginBottom: 18,
                    textAlign: "center"
                }
            }, "Started at ", a, " — about ", t, "hrs ago"), o && er.default.createElement("p", {
                style: {
                    fontSize: 11.5,
                    color: bS,
                    marginTop: -12,
                    marginBottom: 14,
                    textAlign: "center"
                }
            }, "That's a long stretch — double check this is right, or enter times manually instead."), er.default.createElement("button", {
                className: "wt-btn-primary wt-tracker-btn-sleep",
                style: {
                    marginBottom: 12
                },
                onClick: i
            }, "Finish Sleeping"), er.default.createElement("button", {
                className: "wt-btn-text",
                onClick: () => s(!0)
            }, "Enter times manually instead"), er.default.createElement("button", {
                className: "wt-btn-text wt-btn-text-danger",
                onClick: l
            }, "Cancel — started by mistake")))
        }
        return er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, er.default.createElement("div", {
            className: "wt-sheet",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, "Sleep"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("p", {
            style: {
                fontSize: 13,
                color: wS,
                marginTop: -6,
                marginBottom: 18,
                textAlign: "center"
            }
        }, "Tap when you're about to fall asleep, then again when you wake up."), er.default.createElement("button", {
            className: "wt-btn-primary wt-tracker-btn-sleep",
            style: {
                marginBottom: 12
            },
            onClick: o
        }, "Start Sleeping"), er.default.createElement("button", {
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
        let [a, o] = (0, er.useState)(""), [i, l] = (0, er.useState)(""), [u, s] = (0, er.useState)(""), [c, f] = (0, er.useState)("");
        if ((0, er.useEffect)(() => {
                e && (o(t ? t.name : ""), l(t && t.oz ? String(t.oz) : ""), s(t && t.grams ? String(t.grams) : ""), f(t && t.calories ? String(t.calories) : ""))
            }, [e, t]), !e) return null;
        let d = Number(i) || 0,
            p = Number(u) || 0,
            m = Number(c) || 0,
            h = a.trim().length > 0 && (d > 0 || p > 0 || m > 0);
        return er.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: n
        }, er.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-modal-header"
        }, er.default.createElement("h3", null, t ? "Edit preset" : "Add preset"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("label", {
            className: "wt-field"
        }, "Name", er.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Protein shake",
            value: a,
            onChange: e => o(e.target.value)
        })), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -8,
                marginBottom: 14
            }
        }, "Fill in whichever apply — leave the rest blank. A protein shake might have all three; a black coffee just water."), er.default.createElement("div", {
            className: "wt-field-row"
        }, er.default.createElement("label", {
            className: "wt-field"
        }, "Water (oz)", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: i,
            onChange: e => l(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Protein (g)", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: u,
            onChange: e => s(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Calories", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "0",
            value: c,
            onChange: e => f(e.target.value)
        }))), er.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: !h,
            onClick: () => r({
                name: a.trim(),
                oz: d,
                grams: p,
                calories: m
            })
        }, "Save preset")))
    }

    function PO({
        open: e,
        onClose: t,
        onRestore: n
    }) {
        let [r, a] = (0, er.useState)(""), [o, i] = (0, er.useState)(!1);
        if ((0, er.useEffect)(() => {
                e && (a(""), i(!1))
            }, [e]), !e) return null;
        return er.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: t
        }, er.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-modal-header"
        }, er.default.createElement("h3", null, "Restore from backup"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: t,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("p", {
            style: {
                fontSize: 12,
                color: bS,
                marginTop: -4,
                marginBottom: 14,
                lineHeight: 1.5
            }
        }, "This replaces everything currently in the app on this device with whatever was backed up under that code."), er.default.createElement("label", {
            className: "wt-field"
        }, "Recovery code", er.default.createElement("input", {
            type: "text",
            placeholder: "ABCD-EFGH-JK",
            autoCapitalize: "characters",
            autoCorrect: "off",
            value: r,
            onChange: e => a(e.target.value)
        })), er.default.createElement("button", {
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
        let [a, o] = (0, er.useState)(""), [i, l] = (0, er.useState)("1"), [u, s] = (0, er.useState)(!1), [c, f] = (0, er.useState)(""), [d, p] = (0, er.useState)("");
        if ((0, er.useEffect)(() => {
                e && (o(t ? t.name : ""), l(t && null != t.intervalDays ? String(t.intervalDays) : "1"), s(!(!t || !t.trackInventory)), f(t && null != t.qtyRemaining ? String(t.qtyRemaining) : ""), p(t && t.expirationDate ? t.expirationDate : ""))
            }, [e, t]), !e) return null;
        let m = a.trim().length > 0;
        return er.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: n
        }, er.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-modal-header"
        }, er.default.createElement("h3", null, t ? "Edit item" : "Add supplement or medicine"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("label", {
            className: "wt-field"
        }, "Name", er.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Vitamin D, Metformin",
            value: a,
            onChange: e => o(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Take every (days)", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: "1",
            placeholder: "1",
            value: i,
            onChange: e => l(e.target.value)
        })), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -8,
                marginBottom: 14
            }
        }, "Most people leave this at 1 (daily). Set it to 2, 3, 7, etc. for anything you take less often — like every other day, or once a week."), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: u ? 12 : 4
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Track inventory / subscription"), er.default.createElement("button", {
            className: "wt-switch " + (u ? "on" : ""),
            onClick: () => s(!u),
            "aria-label": "Toggle inventory tracking"
        }, er.default.createElement("span", null))), u && er.default.createElement("label", {
            className: "wt-field"
        }, "Units remaining", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: "0",
            placeholder: "e.g. 30",
            value: c,
            onChange: e => f(e.target.value)
        })), u && er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginTop: 12,
                marginBottom: 14
            }
        }, "Expiration date", er.default.createElement("input", {
            type: "date",
            value: d,
            onChange: e => p(e.target.value)
        })), er.default.createElement("button", {
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
        let [a, o] = (0, er.useState)(""), [i, l] = (0, er.useState)(""), [u, s] = (0, er.useState)(!1), [c, f] = (0, er.useState)(""), [d, p] = (0, er.useState)("");
        if ((0, er.useEffect)(() => {
                e && (o(t ? t.name : ""), l(t && t.intervalDays ? String(t.intervalDays) : ""), s(!(!t || !t.trackInventory)), f(t && null != t.qtyRemaining ? String(t.qtyRemaining) : ""), p(t && t.expirationDate ? t.expirationDate : ""))
            }, [e, t]), !e) return null;
        let m = a.trim().length > 0;
        return er.default.createElement("div", {
            className: "wt-backdrop wt-center",
            onClick: n
        }, er.default.createElement("div", {
            className: "wt-modal",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-modal-header"
        }, er.default.createElement("h3", null, t ? "Edit treatment" : "Add a treatment"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("label", {
            className: "wt-field"
        }, "Name", er.default.createElement("input", {
            type: "text",
            placeholder: "e.g. B12 Shot, IV Drip, Allergy Shot",
            value: a,
            onChange: e => o(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Repeats every (optional)", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "e.g. 14 (leave blank to just track history)",
            value: i,
            onChange: e => l(e.target.value)
        })), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -8,
                marginBottom: 14
            }
        }, 'Leave the interval blank if you just want to log when you had it, with no "next due" reminder.'), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: u ? 12 : 4
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Track inventory / subscription"), er.default.createElement("button", {
            className: "wt-switch " + (u ? "on" : ""),
            onClick: () => s(!u),
            "aria-label": "Toggle inventory tracking"
        }, er.default.createElement("span", null))), u && er.default.createElement("label", {
            className: "wt-field"
        }, "Sessions/doses remaining", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            min: "0",
            placeholder: "e.g. 12",
            value: c,
            onChange: e => f(e.target.value)
        })), u && er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginTop: 12,
                marginBottom: 14
            }
        }, "Expiration date", er.default.createElement("input", {
            type: "date",
            value: d,
            onChange: e => p(e.target.value)
        })), er.default.createElement("button", {
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
        let [i, l] = (0, er.useState)([]), [u, s] = (0, er.useState)(JS());
        if ((0, er.useEffect)(() => {
                if (e)
                    if (n) {
                        let e = (n.items || []).map(e => "string" == typeof e ? {
                            name: e,
                            qty: ""
                        } : e);
                        l(e), s(eO(n.timeMinutes))
                    } else l([]), s(JS())
            }, [e, n]), !e) return null;
        return er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, er.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, n ? "Edit entry" : "Supplements & Prescriptions"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), 0 === t.length ? er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            style: {
                fontSize: 13,
                color: wS,
                marginTop: -6,
                marginBottom: 18,
                textAlign: "center"
            }
        }, "Nothing set up yet. Add the supplements, vitamins, and medicines you take regularly in Setup, and they'll show up here to log with one tap."), er.default.createElement("button", {
            className: "wt-btn-primary",
            onClick: o
        }, "Go to Settings")) : er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -6,
                marginBottom: 16,
                textAlign: "center"
            }
        }, "Tap everything you're taking right now."), er.default.createElement("div", {
            className: "wt-chip-row",
            style: {
                marginBottom: i.length > 0 ? 14 : 18
            }
        }, t.map(e => er.default.createElement("button", {
            key: e.id,
            type: "button",
            className: "wt-chip " + (i.some(t => t.name === e.name) ? "active" : ""),
            onClick: () => function(e) {
                l(t => t.some(t => t.name === e) ? t.filter(t => t.name !== e) : [...t, {
                    name: e,
                    qty: ""
                }])
            }(e.name)
        }, e.name))), i.length > 0 && er.default.createElement("div", {
            style: {
                marginBottom: 16
            }
        }, i.map(e => er.default.createElement("div", {
            key: e.name,
            className: "wt-qty-row"
        }, er.default.createElement("span", {
            className: "wt-qty-name"
        }, e.name), er.default.createElement("input", {
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
        })))), er.default.createElement("label", {
            className: "wt-field"
        }, "Time", er.default.createElement("input", {
            type: "time",
            value: u,
            onChange: e => s(e.target.value)
        })), er.default.createElement("button", {
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
        let [a, o] = (0, er.useState)(""), [i, l] = (0, er.useState)(""), [u, s] = (0, er.useState)(""), [c, f] = (0, er.useState)(JS());
        if ((0, er.useEffect)(() => {
                e && (o(t ? t.exerciseType : ""), l(t ? String(t.minutes) : ""), s(t && t.description || ""), f(t ? eO(t.timeMinutes) : JS()))
            }, [e, t]), !e) return null;
        let d = Number(i) || 0,
            p = a.trim().length > 0 && d > 0;
        return er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: n
        }, er.default.createElement("div", {
            className: "wt-sheet",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, t ? "Edit exercise" : "Log Exercise"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("label", {
            className: "wt-field"
        }, "Type", er.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Running, Weights, Yoga",
            value: a,
            onChange: e => o(e.target.value)
        })), er.default.createElement("div", {
            className: "wt-field-row"
        }, er.default.createElement("label", {
            className: "wt-field"
        }, "Minutes", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            placeholder: "30",
            value: i,
            onChange: e => l(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Time", er.default.createElement("input", {
            type: "time",
            value: c,
            onChange: e => f(e.target.value)
        }))), er.default.createElement("label", {
            className: "wt-field"
        }, "Description (optional)", er.default.createElement("textarea", {
            rows: "2",
            placeholder: "e.g. 5k around the park",
            value: u,
            onChange: e => s(e.target.value)
        })), er.default.createElement("button", {
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
        let [i, l] = (0, er.useState)([]), [u, s] = (0, er.useState)(""), [c, f] = (0, er.useState)(JS());
        if ((0, er.useEffect)(() => {
                e && (n ? (l(n.items || []), s(n.dateKeyStr || HS(new Date)), f(eO(n.timeMinutes))) : (l([]), s(HS(new Date)), f(JS())))
            }, [e, n]), !e) return null;
        return er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: r
        }, er.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, n ? "Edit entry" : "Log Treatment"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: r,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), 0 === t.length ? er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            style: {
                fontSize: 13,
                color: wS,
                marginTop: -6,
                marginBottom: 18,
                textAlign: "center"
            }
        }, "Nothing set up yet. Add periodic treatments — drips, shots, sessions — in Setup, and they'll show up here to log with one tap."), er.default.createElement("button", {
            className: "wt-btn-primary",
            onClick: o
        }, "Go to Settings")) : er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: -6,
                marginBottom: 16,
                textAlign: "center"
            }
        }, "Tap everything you had, and set the date if it wasn't today."), er.default.createElement("div", {
            className: "wt-chip-row",
            style: {
                marginBottom: 18
            }
        }, t.map(e => er.default.createElement("button", {
            key: e.id,
            type: "button",
            className: "wt-chip " + (i.includes(e.name) ? "active" : ""),
            onClick: () => function(e) {
                l(t => t.includes(e) ? t.filter(t => t !== e) : [...t, e])
            }(e.name)
        }, e.name))), er.default.createElement("label", {
            className: "wt-field"
        }, "Date", er.default.createElement("input", {
            type: "date",
            value: u,
            onChange: e => s(e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "Time", er.default.createElement("input", {
            type: "time",
            value: c,
            onChange: e => f(e.target.value)
        })), er.default.createElement("button", {
            className: "wt-btn-primary",
            disabled: 0 === i.length,
            onClick: () => a(i, u, c)
        }, n ? "Save changes" : "Log " + (i.length > 0 ? `(${i.length})` : "")))))
    }

    function MO({
        data: e,
        todayKey: t,
        onOpenQuickDial: n,
        onOpenSleepSheet: r,
        onOpenWeightDial: a,
        onOpenSupplementSheet: o,
        onOpenTreatmentSheet: i,
        onOpenExerciseSheet: l
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
        return er.default.createElement("div", null, er.default.createElement("div", {
            className: "wt-trackers-grid"
        }, x && er.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            onClick: () => n("oz"),
            role: "button",
            tabIndex: 0
        }, er.default.createElement("div", {
            className: "wt-tracker-label"
        }, er.default.createElement(vr, {
            size: 16
        }), " Water"), er.default.createElement("div", {
            className: "wt-tracker-goal"
        }, "Goal ", p, "oz"), er.default.createElement("div", {
            className: "wt-tracker-sub"
        }, p <= 0 ? "Set a goal" : y > 0 ? `${y}oz to go` : s - p + "oz over 🎉"), er.default.createElement(dO, {
            consumedOz: s,
            goalOz: p
        }), er.default.createElement("div", {
            className: "wt-tracker-number"
        }, s, er.default.createElement("span", {
            className: "unit"
        }, "oz")), er.default.createElement("div", {
            className: "wt-tracker-in-label"
        }, "In")), E && er.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            onClick: () => n("grams"),
            role: "button",
            tabIndex: 0
        }, er.default.createElement("div", {
            className: "wt-tracker-label"
        }, er.default.createElement(sr, {
            size: 16
        }), " Protein"), er.default.createElement("div", {
            className: "wt-tracker-goal"
        }, "Goal ", m, "g"), er.default.createElement("div", {
            className: "wt-tracker-sub"
        }, m <= 0 ? "Set a goal" : v > 0 ? `${v}g to go` : c - m + "g over 🎉"), er.default.createElement(pO, {
            consumedGrams: c,
            goalGrams: m
        }), er.default.createElement("div", {
            className: "wt-tracker-number"
        }, c, er.default.createElement("span", {
            className: "unit"
        }, "g")), er.default.createElement("div", {
            className: "wt-tracker-in-label"
        }, "In")), k && er.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            onClick: () => n("calories"),
            role: "button",
            tabIndex: 0
        }, er.default.createElement("div", {
            className: "wt-tracker-label"
        }, er.default.createElement(wr, {
            size: 16
        }), " Calories"), er.default.createElement("div", {
            className: "wt-tracker-goal"
        }, "Goal ", h, "cal"), er.default.createElement("div", {
            className: "wt-tracker-sub"
        }, h <= 0 ? "Set a goal" : b > 0 ? `${b}cal left` : f - h + "cal over"), er.default.createElement(mO, {
            consumedCal: f,
            goalCal: h
        }), er.default.createElement("div", {
            className: "wt-tracker-number"
        }, f, er.default.createElement("span", {
            className: "unit"
        }, "cal")), er.default.createElement("div", {
            className: "wt-tracker-in-label"
        }, "In")), S && er.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            onClick: r,
            role: "button",
            tabIndex: 0
        }, er.default.createElement("div", {
            className: "wt-tracker-label"
        }, er.default.createElement(cr, {
            size: 16
        }), " Sleep"), er.default.createElement("div", {
            className: "wt-tracker-goal"
        }, "Goal ", g, "hrs"), er.default.createElement("div", {
            className: "wt-tracker-sub"
        }, e.activeSleepSession ? er.default.createElement("span", {
            style: {
                color: yS
            }
        }, "😴 Sleeping…") : g <= 0 ? "Set a goal" : w > 0 ? `${w}hrs to go` : `${Math.abs(w)}hrs over 🎉`), er.default.createElement(hO, {
            hours: d,
            goalHours: g
        }), er.default.createElement("div", {
            className: "wt-tracker-number"
        }, d, er.default.createElement("span", {
            className: "unit"
        }, "hrs")), er.default.createElement("div", {
            className: "wt-tracker-in-label"
        }, "Slept")), !N && er.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                width: "100%"
            }
        }, "All trackers are hidden from this screen. Turn one back on in Setup → Daily goals.")), er.default.createElement("div", {
            className: "wt-trackers-grid",
            style: {
                marginTop: 14
            }
        }, O && er.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            onClick: a,
            role: "button",
            tabIndex: 0
        }, er.default.createElement("div", {
            className: "wt-tracker-label"
        }, er.default.createElement(Tr, {
            size: 16
        }), " Weight"), er.default.createElement("div", {
            className: "wt-tracker-goal"
        }, $ <= 0 ? "Set a goal" : `Goal ${$}lbs`), er.default.createElement("div", {
            className: "wt-tracker-sub"
        }, W), er.default.createElement(uO, {
            todayValue: B ? T.value : 0,
            goal: $,
            recordedToday: B
        }), er.default.createElement("div", {
            className: "wt-tracker-number"
        }, B ? T.value : "—", er.default.createElement("span", {
            className: "unit"
        }, "lbs")), er.default.createElement("div", {
            className: "wt-tracker-in-label"
        }, "Today")), j && er.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            onClick: l,
            role: "button",
            tabIndex: 0
        }, er.default.createElement("div", {
            className: "wt-tracker-label"
        }, er.default.createElement(br, {
            size: 16
        }), " Exercise"), er.default.createElement("div", {
            className: "wt-tracker-goal"
        }, F <= 0 ? "Set a goal" : `Goal ${F}min`), er.default.createElement("div", {
            className: "wt-tracker-sub"
        }, K), er.default.createElement(fO, {
            minutes: R,
            goalMinutes: F
        }), er.default.createElement("div", {
            className: "wt-tracker-number"
        }, R, er.default.createElement("span", {
            className: "unit"
        }, "min")), er.default.createElement("div", {
            className: "wt-tracker-in-label"
        }, "Today")), C && er.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            onClick: i,
            role: "button",
            tabIndex: 0
        }, er.default.createElement("div", {
            className: "wt-tracker-label"
        }, er.default.createElement(jr, {
            size: 16
        }), " Treatments"), er.default.createElement("div", {
            className: "wt-tracker-goal"
        }, 0 === z.length ? "Add in Setup" : G > 0 ? `Goal ${G} today` : "Nothing planned"), er.default.createElement("div", {
            className: "wt-tracker-sub"
        }, Z ? `${L} · ${Z}` : L), er.default.createElement(cO, {
            pct: Y
        }), er.default.createElement("div", {
            className: "wt-tracker-number"
        }, X), er.default.createElement("div", {
            className: "wt-tracker-in-label"
        }, "Done")), P && er.default.createElement("div", {
            className: "wt-tracker-col wt-tracker-col-clickable",
            onClick: o,
            role: "button",
            tabIndex: 0
        }, er.default.createElement("div", {
            className: "wt-tracker-label"
        }, er.default.createElement(Sr, {
            size: 16
        }), " RX & Supplements"), er.default.createElement("div", {
            className: "wt-tracker-goal"
        }, 0 === A ? "Add in Setup" : H > 0 ? `Goal ${H} today` : "Nothing due"), er.default.createElement("div", {
            className: "wt-tracker-sub"
        }, Q ? `${_} · ${Q}` : _), er.default.createElement(sO, {
            pct: q
        }), er.default.createElement("div", {
            className: "wt-tracker-number"
        }, M.size), er.default.createElement("div", {
            className: "wt-tracker-in-label"
        }, "Taken")), !O && !P && !C && !j && er.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                width: "100%"
            }
        }, "All of these trackers are hidden from this screen. Turn one back on in Setup.")), er.default.createElement("div", {
            className: "wt-divider"
        }))
    }

    function _O({
        open: e,
        data: t,
        onClose: n
    }) {
        let [r, a] = (0, er.useState)(30), [o, i] = (0, er.useState)("idle"), [l, u] = (0, er.useState)(""), [s, c] = (0, er.useState)(""), [f, d] = (0, er.useState)(!1);
        if ((0, er.useEffect)(() => {
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
        return er.default.createElement("div", {
            className: "wt-doctor-share-overlay"
        }, er.default.createElement("div", {
            className: "wt-doctor-share-toolbar wt-no-print"
        }, er.default.createElement("h3", null, "Health Summary"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: n,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), er.default.createElement("div", {
            className: "wt-doctor-share-controls wt-no-print"
        }, er.default.createElement("span", {
            className: "wt-doctor-share-range-label"
        }, "Time period"), er.default.createElement("div", {
            className: "wt-chip-row"
        }, [7, 30, 90].map(e => er.default.createElement("button", {
            key: e,
            type: "button",
            className: "wt-chip " + (r === e ? "active" : ""),
            onClick: () => a(e)
        }, "Last ", e, " days"))), er.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%",
                marginTop: 14
            },
            onClick: () => window.print()
        }, "Print / Save as PDF"), h ? er.default.createElement("div", {
            style: {
                marginTop: 12
            }
        }, "ready" !== o && er.default.createElement("button", {
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
        }, "generating" === o ? "Generating…" : "Generate a link to share"), "error" === o && er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 8,
                marginBottom: 0
            }
        }, s), "ready" === o && er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginBottom: 6
            }
        }, "Anyone with this link can view this summary — no account needed. It expires in 90 days."), er.default.createElement("div", {
            className: "wt-share-link-box"
        }, l), er.default.createElement("button", {
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
        }, f ? "Copied!" : "Copy link"))) : er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Sign in (below, in Account) to generate a shareable link instead of printing.")), er.default.createElement(DO, {
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
        return er.default.createElement("div", {
            className: "wt-doctor-share-content"
        }, er.default.createElement("div", {
            className: "wt-doctor-share-header"
        }, er.default.createElement("h1", null, "HydroPro Tracker — Health Summary"), t && er.default.createElement("p", {
            className: "wt-doctor-share-name"
        }, t), er.default.createElement("p", {
            className: "wt-doctor-share-dates"
        }, r(e.rangeStart), " – ", r(e.rangeEnd), " (", e.daysInRange, " days, logged on ", e.daysWithAnyLog, ")")), er.default.createElement("div", {
            className: "wt-doctor-share-section"
        }, er.default.createElement("h2", null, "Daily Averages"), er.default.createElement("table", {
            className: "wt-doctor-share-table"
        }, er.default.createElement("thead", null, er.default.createElement("tr", null, er.default.createElement("th", null, "Metric"), er.default.createElement("th", null, "Average"), er.default.createElement("th", null, "Goal"))), er.default.createElement("tbody", null, er.default.createElement("tr", null, er.default.createElement("td", null, "Water"), er.default.createElement("td", null, e.averages.avgOz, "oz"), er.default.createElement("td", null, e.goals.goalOz > 0 ? `${e.goals.goalOz}oz` : "—")), er.default.createElement("tr", null, er.default.createElement("td", null, "Protein"), er.default.createElement("td", null, e.averages.avgProtein, "g"), er.default.createElement("td", null, e.goals.goalProtein > 0 ? `${e.goals.goalProtein}g` : "—")), er.default.createElement("tr", null, er.default.createElement("td", null, "Calories"), er.default.createElement("td", null, e.averages.avgCalories, "cal"), er.default.createElement("td", null, e.goals.goalCalories > 0 ? `${e.goals.goalCalories}cal` : "—")), er.default.createElement("tr", null, er.default.createElement("td", null, "Sleep"), er.default.createElement("td", null, e.averages.avgSleepHours, "hrs"), er.default.createElement("td", null, e.goals.goalSleepHours > 0 ? `${e.goals.goalSleepHours}hrs` : "—"))))), er.default.createElement("div", {
            className: "wt-doctor-share-section"
        }, er.default.createElement("h2", null, "Weight"), 0 === e.weight.entries.length ? er.default.createElement("p", {
            className: "wt-doctor-share-empty"
        }, "No weight logged in this period.") : er.default.createElement(er.default.Fragment, null, er.default.createElement("p", null, e.weight.first.value, "lbs (", r(e.weight.first.date), ") → ", e.weight.last.value, "lbs (", r(e.weight.last.date), ")", null !== e.weight.change && er.default.createElement(er.default.Fragment, null, " — ", er.default.createElement("b", null, e.weight.change > 0 ? `+${e.weight.change}` : e.weight.change, "lbs"))), er.default.createElement("table", {
            className: "wt-doctor-share-table"
        }, er.default.createElement("thead", null, er.default.createElement("tr", null, er.default.createElement("th", null, "Date"), er.default.createElement("th", null, "Weight"))), er.default.createElement("tbody", null, e.weight.entries.map((e, t) => er.default.createElement("tr", {
            key: t
        }, er.default.createElement("td", null, r(e.date)), er.default.createElement("td", null, e.value, "lbs"))))))), er.default.createElement("div", {
            className: "wt-doctor-share-section"
        }, er.default.createElement("h2", null, "Supplements & Prescriptions"), 0 === e.supplements.length ? er.default.createElement("p", {
            className: "wt-doctor-share-empty"
        }, "None logged in this period.") : er.default.createElement("table", {
            className: "wt-doctor-share-table"
        }, er.default.createElement("thead", null, er.default.createElement("tr", null, er.default.createElement("th", null, "Name"), er.default.createElement("th", null, "Days taken (of ", e.daysInRange, ")"))), er.default.createElement("tbody", null, e.supplements.map((e, t) => er.default.createElement("tr", {
            key: t
        }, er.default.createElement("td", null, e.name), er.default.createElement("td", null, e.daysTaken)))))), er.default.createElement("div", {
            className: "wt-doctor-share-section"
        }, er.default.createElement("h2", null, "Treatments"), 0 === e.treatments.length ? er.default.createElement("p", {
            className: "wt-doctor-share-empty"
        }, "None logged in this period.") : er.default.createElement("table", {
            className: "wt-doctor-share-table"
        }, er.default.createElement("thead", null, er.default.createElement("tr", null, er.default.createElement("th", null, "Name"), er.default.createElement("th", null, "Dates"))), er.default.createElement("tbody", null, e.treatments.map((e, t) => er.default.createElement("tr", {
            key: t
        }, er.default.createElement("td", null, e.name), er.default.createElement("td", null, e.dates.map(e => r(e)).join(", "))))))), er.default.createElement("p", {
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
        let [t, n] = (0, er.useState)("loading"), [r, a] = (0, er.useState)(null), [o, i] = (0, er.useState)("");
        return (0, er.useEffect)(() => {
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
        }, [e]), er.default.createElement("div", {
            className: "wt-doctor-share-overlay",
            style: {
                position: "static"
            }
        }, er.default.createElement("style", null, iO), "loading" === t && er.default.createElement("div", {
            className: "wt-doctor-share-content"
        }, er.default.createElement("p", null, "Loading shared summary…")), "error" === t && er.default.createElement("div", {
            className: "wt-doctor-share-content"
        }, er.default.createElement("p", {
            style: {
                color: bS,
                fontWeight: 600
            }
        }, o), er.default.createElement("p", {
            style: {
                fontSize: 13,
                color: wS
            }
        }, "This link may have expired, or may no longer exist.")), "ready" === t && er.default.createElement(er.default.Fragment, null, er.default.createElement("div", {
            className: "wt-doctor-share-controls wt-no-print",
            style: {
                textAlign: "center"
            }
        }, er.default.createElement("button", {
            className: "wt-btn-primary",
            onClick: () => window.print()
        }, "Print / Save as PDF")), er.default.createElement(DO, {
            summary: r,
            testerName: "",
            generatedAt: new Date
        })))
    }

    function IO(e, t, n, r) {
        return er.default.createElement("li", {
            key: e.id,
            className: "wt-log-row"
        }, PS(e) ? er.default.createElement(er.default.Fragment, null, er.default.createElement(cr, {
            size: 13,
            className: "wt-log-icon"
        }), er.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), er.default.createElement("span", {
            className: "wt-log-label"
        }, "Sleep"), er.default.createElement("span", {
            className: "wt-log-metrics"
        }, er.default.createElement("span", {
            style: {
                color: yS,
                fontWeight: 700,
                fontSize: 12
            }
        }, tO(e.lightsOutMinutes), " → ", tO(e.wokeUpMinutes), " · ", e.hours, "hrs"))) : jS(e) ? er.default.createElement(er.default.Fragment, null, er.default.createElement(Tr, {
            size: 13,
            className: "wt-log-icon"
        }), er.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), er.default.createElement("span", {
            className: "wt-log-label"
        }, "Weight"), er.default.createElement("span", {
            className: "wt-log-metrics"
        }, er.default.createElement("span", {
            style: {
                color: yS,
                fontWeight: 700
            }
        }, e.value, "lbs"))) : NS(e) ? er.default.createElement(er.default.Fragment, null, er.default.createElement(Sr, {
            size: 13,
            className: "wt-log-icon"
        }), er.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), er.default.createElement("span", {
            className: "wt-log-label",
            style: {
                flex: 2
            }
        }, e.label)) : zS(e) ? er.default.createElement(er.default.Fragment, null, er.default.createElement(jr, {
            size: 13,
            className: "wt-log-icon"
        }), er.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), er.default.createElement("span", {
            className: "wt-log-label",
            style: {
                flex: 2
            }
        }, e.label)) : IS(e) ? er.default.createElement(er.default.Fragment, null, er.default.createElement(br, {
            size: 13,
            className: "wt-log-icon"
        }), er.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), er.default.createElement("span", {
            className: "wt-log-label",
            style: {
                flex: 2
            }
        }, e.exerciseType, e.description ? ` — ${e.description}` : ""), er.default.createElement("span", {
            className: "wt-log-metrics"
        }, er.default.createElement("span", {
            style: {
                color: gS,
                fontWeight: 700
            }
        }, e.minutes, "min"))) : er.default.createElement(er.default.Fragment, null, er.default.createElement(hr, {
            size: 13,
            className: "wt-log-icon"
        }), er.default.createElement("span", {
            className: "wt-log-time"
        }, e.time), er.default.createElement("span", {
            className: "wt-log-label"
        }, e.label), er.default.createElement("span", {
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
        }(e).map((e, t) => er.default.createElement("span", {
            key: t,
            style: {
                color: e.color,
                fontWeight: 700
            }
        }, t > 0 && er.default.createElement("span", {
            style: {
                color: vS
            }
        }, " · "), e.amount, e.unit)))), t && er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => n(e),
            "aria-label": "Edit entry"
        }, er.default.createElement(kr, {
            size: 14
        })), t && er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => r(e.id),
            "aria-label": "Delete entry"
        }, er.default.createElement(Nr, {
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
        onBack: i
    }) {
        return e ? er.default.createElement("div", {
            className: "wt-backdrop",
            onClick: a
        }, er.default.createElement("div", {
            className: "wt-sheet wt-sheet-tall",
            onClick: e => e.stopPropagation()
        }, er.default.createElement("div", {
            className: "wt-sheet-header"
        }, er.default.createElement("h3", null, t ? YS(MS(t)) : "Past days"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: a,
            "aria-label": "Close"
        }, er.default.createElement(Ar, {
            size: 18
        }))), t ? er.default.createElement(er.default.Fragment, null, er.default.createElement("button", {
            className: "wt-btn-text",
            style: {
                textAlign: "left",
                padding: "0 0 12px"
            },
            onClick: i
        }, "← All past days"), 0 === r.length ? er.default.createElement("p", {
            className: "wt-empty-note"
        }, "No entries logged that day.") : er.default.createElement("ul", {
            className: "wt-log-list"
        }, r.slice().sort((e, t) => rO(t) - rO(e)).map(e => IO(e, !1, null, null)))) : 0 === n.length ? er.default.createElement("p", {
            className: "wt-empty-note"
        }, "No past days logged yet.") : er.default.createElement("div", null, n.map(e => er.default.createElement("button", {
            key: e,
            className: "wt-preset-row",
            style: {
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                border: "none"
            },
            onClick: () => o(e)
        }, er.default.createElement("span", {
            className: "wt-preset-name"
        }, YS(MS(e)))))))) : null
    }

    function RO({
        data: e,
        todayKey: t,
        onDeleteLog: n,
        onEditLogEntry: r,
        onEditNextDue: a
    }) {
        let [o, i] = (0, er.useState)(!1), [l, u] = (0, er.useState)(null), s = Object.keys(e.logs).filter(n => n !== t && (e.logs[n] || []).length > 0).sort().reverse(), c = e.logs[t] || [], f = new Set;
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
        return er.default.createElement("div", null, er.default.createElement("div", {
            className: "wt-todo-today-sticky"
        }, er.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg"
        }, "To Do Today"), 0 === d.length ? er.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 22
            }
        }, "All Done for the Day 🎉") : er.default.createElement("div", {
            className: "wt-todo-today-scroll",
            style: {
                marginBottom: 22
            }
        }, d.map(e => er.default.createElement("div", {
            key: `${e.kind}-${e.id}`,
            className: `wt-treatment-row wt-treatment-${e.status.state}`
        }, "supplement" === e.kind ? er.default.createElement(Sr, {
            size: 15,
            className: "wt-log-icon"
        }) : er.default.createElement(jr, {
            size: 15,
            className: "wt-log-icon"
        }), er.default.createElement("div", {
            className: "wt-treatment-info"
        }, er.default.createElement("span", {
            className: "wt-treatment-name"
        }, e.name), er.default.createElement("span", {
            className: "wt-treatment-due-label"
        }, "overdue" === e.status.state ? `${Math.abs(e.status.daysAway)} day${1===Math.abs(e.status.daysAway)?"":"s"} overdue` : "Due today")), er.default.createElement("input", {
            type: "date",
            className: "wt-treatment-date-input",
            value: e.status.due,
            onChange: t => a(e.kind, e.id, t.target.value),
            "aria-label": `Change next due date for ${e.name}`
        }))))), er.default.createElement("div", {
            style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }
        }, er.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg",
            style: {
                margin: 0
            }
        }, "Today's log"), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => {
                u(null), i(!0)
            },
            "aria-label": "View past days"
        }, er.default.createElement(hr, {
            size: 18
        }))), er.default.createElement("div", {
            className: "wt-today-log-scroll"
        }, 0 === c.length ? er.default.createElement("p", {
            className: "wt-empty-note"
        }, "Nothing logged yet today — head to the Log tab to get started.") : er.default.createElement("ul", {
            className: "wt-log-list"
        }, c.slice().sort((e, t) => rO(t) - rO(e)).map(e => IO(e, !0, r, n)))), er.default.createElement(LO, {
            open: o,
            historyDate: l,
            dates: s,
            entriesForDate: l && e.logs[l] || [],
            onClose: () => i(!1),
            onSelectDate: e => u(e),
            onBack: () => u(null)
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
            return er.default.createElement("div", {
                key: t.id,
                className: "wt-card"
            }, er.default.createElement("div", {
                className: "wt-card-title"
            }, t.name), er.default.createElement("div", {
                style: {
                    fontSize: 13,
                    color: wS,
                    marginBottom: 8
                }
            }, `${t.qtyRemaining||0} remaining`, o ? ` · expires ${o}` : ""), a && er.default.createElement("div", {
                style: {
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: bS,
                    marginBottom: 8
                }
            }, a), er.default.createElement("div", {
                style: {
                    fontSize: 12,
                    color: wS,
                    marginBottom: 4,
                    fontWeight: 600
                }
            }, `Used ${r.length} time${1===r.length?"":"s"}`), r.length > 0 && er.default.createElement("div", {
                style: {
                    fontSize: 12,
                    color: dS,
                    lineHeight: 1.6
                }
            }, r.slice(0, 10).map(e => YS(MS(e))).join(", ") + (r.length > 10 ? ` … and ${r.length-10} more` : "")))
        }
        return er.default.createElement("div", null, er.default.createElement("div", {
            className: "wt-segment",
            style: {
                marginBottom: 14
            }
        }, er.default.createElement("button", {
            onClick: t
        }, "← Back to charts")), er.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg"
        }, "Subscriptions"), 0 === n.length && 0 === r.length ? er.default.createElement("p", {
            className: "wt-empty-note"
        }, "No tracked subscriptions yet. Turn on “Track inventory / subscription” for a supplement or treatment in Setup to see it here.") : er.default.createElement(er.default.Fragment, null, n.length > 0 && er.default.createElement("div", {
            className: "wt-section-label"
        }, "RX & Supplements"), n.map(e => a(e, "supplement")), r.length > 0 && er.default.createElement("div", {
            className: "wt-section-label"
        }, "Treatments"), r.map(e => a(e, "treatment"))))
    }

    function FO({
        data: e,
        onDrShare: t
    }) {
        let [n, r] = (0, er.useState)("water"), [a, o] = (0, er.useState)("week"), [i, l] = (0, er.useState)(new Date), u = "combined" === n, s = "protein" === n ? "g" : "calories" === n ? "cal" : "oz", c = "protein" === n ? e.settings.goalProtein || 0 : "calories" === n ? e.settings.goalCalories || 0 : e.settings.goalOz || 0, f = "protein" === n ? "grams" : "calories" === n ? "calories" : "oz";

        function d(e) {
            r(e), "combined" === e && "day" === a && o("week")
        }
        let p = (0, er.useMemo)(() => {
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
            m = (0, er.useMemo)(() => {
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
            } = (0, er.useMemo)(() => {
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
            O = "protein" === n ? hS : "calories" === n ? gS : mS,
            P = u ? 10 * Math.ceil(Math.max(100, ...h.flatMap(e => [e.Water || 0, e.Protein || 0, e.Calories || 0])) / 10) : void 0;
        return "subscriptions" === n ? er.default.createElement($O, {
            data: e,
            onBack: () => d("water")
        }) : er.default.createElement("div", null, er.default.createElement("div", {
            className: "wt-segment",
            style: {
                marginBottom: 8
            }
        }, er.default.createElement("button", {
            className: "water" === n ? "active" : "",
            onClick: () => d("water")
        }, er.default.createElement(vr, {
            size: 12,
            style: {
                marginRight: 3,
                verticalAlign: -2
            }
        }), "Water"), er.default.createElement("button", {
            className: "protein" === n ? "active" : "",
            onClick: () => d("protein")
        }, er.default.createElement(sr, {
            size: 12,
            style: {
                marginRight: 3,
                verticalAlign: -2
            }
        }), "Protein"), er.default.createElement("button", {
            className: "calories" === n ? "active" : "",
            onClick: () => d("calories")
        }, er.default.createElement(wr, {
            size: 12,
            style: {
                marginRight: 3,
                verticalAlign: -2
            }
        }), "Cal"), er.default.createElement("button", {
            className: u ? "active" : "",
            onClick: () => d("combined")
        }, "All 3"), er.default.createElement("button", {
            className: "",
            onClick: () => d("subscriptions")
        }, "Subs")), er.default.createElement("div", {
            className: "wt-segment"
        }, !u && er.default.createElement("button", {
            className: "day" === a ? "active" : "",
            onClick: () => {
                o("day"), l(new Date)
            }
        }, "Day"), er.default.createElement("button", {
            className: "week" === a ? "active" : "",
            onClick: () => {
                o("week"), l(new Date)
            }
        }, "Week"), er.default.createElement("button", {
            className: "month" === a ? "active" : "",
            onClick: () => {
                o("month"), l(new Date)
            }
        }, "Month")), er.default.createElement("div", {
            className: "wt-range-nav"
        }, er.default.createElement("button", {
            onClick: function() {
                l("day" === a ? e => VS(e, -1) : "week" === a ? e => VS(e, -7) : e => new Date(e.getFullYear(), e.getMonth() - 1, 1))
            },
            "aria-label": "Previous"
        }, er.default.createElement(dr, {
            size: 16
        })), er.default.createElement("span", {
            className: "wt-range-label"
        }, g), er.default.createElement("button", {
            onClick: function() {
                l("day" === a ? e => VS(e, 1) : "week" === a ? e => VS(e, 7) : e => new Date(e.getFullYear(), e.getMonth() + 1, 1))
            },
            disabled: x,
            "aria-label": "Next"
        }, er.default.createElement(pr, {
            size: 16
        }))), u ? er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            className: "wt-card-note",
            style: {
                marginBottom: 10
            }
        }, "Each bar group shows how close you got to each goal that day, as a percentage — so water, protein, and calories can sit on the same scale even though their units don't match."), er.default.createElement("div", {
            className: "wt-card",
            style: {
                paddingBottom: 4
            }
        }, er.default.createElement(zl, {
            width: "100%",
            height: 220
        }, er.default.createElement(eS, {
            data: h,
            margin: {
                top: 8,
                right: 4,
                left: -18,
                bottom: 0
            }
        }, er.default.createElement(rE, {
            vertical: !1,
            stroke: vS
        }), er.default.createElement(IE, {
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
        }), er.default.createElement(XE, {
            domain: [0, P],
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: !1,
            tickLine: !1
        }), er.default.createElement(Pl, {
            formatter: e => [`${e}%`, "of goal"],
            contentStyle: {
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${vS}`
            }
        }), er.default.createElement(Ii, {
            wrapperStyle: {
                fontSize: 11
            }
        }), er.default.createElement(zw, {
            y: 100,
            stroke: dS,
            strokeDasharray: "3 3"
        }), er.default.createElement(Xb, {
            dataKey: "Water",
            fill: mS,
            radius: [3, 3, 0, 0]
        }), er.default.createElement(Xb, {
            dataKey: "Protein",
            fill: hS,
            radius: [3, 3, 0, 0]
        }), er.default.createElement(Xb, {
            dataKey: "Calories",
            fill: gS,
            radius: [3, 3, 0, 0]
        }))))) : er.default.createElement(er.default.Fragment, null, er.default.createElement("div", {
            className: "wt-stat-row"
        }, S.map(e => er.default.createElement("div", {
            className: "wt-stat",
            key: e.label
        }, er.default.createElement("div", {
            className: "wt-stat-value"
        }, e.value), er.default.createElement("div", {
            className: "wt-stat-label"
        }, e.label)))), er.default.createElement("div", {
            className: "wt-card",
            style: {
                paddingBottom: 4
            }
        }, er.default.createElement(zl, {
            width: "100%",
            height: 200
        }, er.default.createElement(eS, {
            data: h,
            margin: {
                top: 8,
                right: 8,
                left: -18,
                bottom: 0
            }
        }, er.default.createElement(rE, {
            vertical: !1,
            stroke: vS
        }), er.default.createElement(IE, {
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
        }), er.default.createElement(XE, {
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: !1,
            tickLine: !1
        }), er.default.createElement(Pl, {
            formatter: e => [`${e}${s}`, "Logged"],
            contentStyle: {
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${vS}`
            }
        }), "day" !== a && c > 0 && er.default.createElement(zw, {
            y: c,
            stroke: hS,
            strokeDasharray: "4 4",
            label: {
                value: "Goal",
                position: "right",
                fontSize: 10,
                fill: wS
            }
        }), er.default.createElement(Xb, {
            dataKey: "amount",
            radius: [4, 4, 0, 0]
        }, h.map((e, t) => er.default.createElement(Il, {
            key: t,
            fill: "day" !== a && c > 0 && e.amount >= c ? hS : O,
            opacity: e.isFuture ? .25 : 1
        }))))))), er.default.createElement("div", {
            className: "wt-divider"
        }), er.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg"
        }, "Weight Over Time"), 0 === p.length ? er.default.createElement("p", {
            className: "wt-empty-note"
        }, 'No weight logged yet — use "Log Weight" on the Log page to start a trend.') : er.default.createElement("div", {
            style: {
                width: "100%",
                height: 180
            }
        }, er.default.createElement(zl, null, er.default.createElement(Jk, {
            data: p,
            margin: {
                top: 8,
                right: 12,
                left: -12,
                bottom: 0
            }
        }, er.default.createElement(rE, {
            strokeDasharray: "3 3",
            stroke: vS,
            vertical: !1
        }), er.default.createElement(IE, {
            dataKey: "date",
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: {
                stroke: vS
            },
            tickLine: !1
        }), er.default.createElement(XE, {
            domain: ["dataMin - 2", "dataMax + 2"],
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: !1,
            tickLine: !1
        }), er.default.createElement(Pl, {
            formatter: e => [`${e}lbs`, "Weight"],
            contentStyle: {
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${vS}`
            }
        }), er.default.createElement(SE, {
            type: "monotone",
            dataKey: "weight",
            stroke: yS,
            strokeWidth: 2.5,
            dot: {
                r: 3,
                fill: yS
            }
        })))), er.default.createElement("div", {
            className: "wt-divider"
        }), er.default.createElement("div", {
            className: "wt-section-label wt-section-label-lg"
        }, "Sleep Over Time"), 0 === m.length ? er.default.createElement("p", {
            className: "wt-empty-note"
        }, "No sleep logged yet — log a night's sleep on the Log page to start a trend.") : er.default.createElement("div", {
            style: {
                width: "100%",
                height: 180
            }
        }, er.default.createElement(zl, null, er.default.createElement(Jk, {
            data: m,
            margin: {
                top: 8,
                right: 12,
                left: -12,
                bottom: 0
            }
        }, er.default.createElement(rE, {
            strokeDasharray: "3 3",
            stroke: vS,
            vertical: !1
        }), er.default.createElement(IE, {
            dataKey: "date",
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: {
                stroke: vS
            },
            tickLine: !1
        }), er.default.createElement(XE, {
            domain: [0, "dataMax + 1"],
            tick: {
                fontSize: 10,
                fill: wS
            },
            axisLine: !1,
            tickLine: !1
        }), er.default.createElement(Pl, {
            formatter: e => [`${e}hrs`, "Sleep"],
            contentStyle: {
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${vS}`
            }
        }), e.settings.goalSleepHours > 0 && er.default.createElement(zw, {
            y: e.settings.goalSleepHours,
            stroke: hS,
            strokeDasharray: "4 4",
            label: {
                value: "Goal",
                position: "right",
                fontSize: 10,
                fill: wS
            }
        }), er.default.createElement(SE, {
            type: "monotone",
            dataKey: "hours",
            stroke: yS,
            strokeWidth: 2.5,
            dot: {
                r: 3,
                fill: yS
            }
        })))), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Health Summary"), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("p", {
            className: "wt-card-note",
            style: {
                marginBottom: 12
            }
        }, "A clean summary of your goals, weight trend, supplements, and treatments — ready to print or save as a PDF to bring to a doctor or health advisor."), er.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                width: "100%"
            },
            onClick: t
        }, er.default.createElement(mr, {
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
        return er.default.createElement("div", null, er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(hr, {
            size: 15
        }), " Reminder schedule"), er.default.createElement("p", {
            className: "wt-card-note"
        }, "Used by both push notifications and the calendar backup below."), er.default.createElement("div", {
            className: "wt-field-row"
        }, er.default.createElement("label", {
            className: "wt-field"
        }, "Start time", er.default.createElement("input", {
            type: "time",
            value: g.startTime,
            onChange: e => i("startTime", e.target.value)
        })), er.default.createElement("label", {
            className: "wt-field"
        }, "End time", er.default.createElement("input", {
            type: "time",
            value: g.endTime,
            onChange: e => i("endTime", e.target.value)
        }))), er.default.createElement("label", {
            className: "wt-field"
        }, "Every", er.default.createElement("select", {
            value: g.intervalHours,
            onChange: e => i("intervalHours", Number(e.target.value))
        }, er.default.createElement("option", {
            value: 1
        }, "1 hour"), er.default.createElement("option", {
            value: 1.5
        }, "1.5 hours"), er.default.createElement("option", {
            value: 2
        }, "2 hours"), er.default.createElement("option", {
            value: 3
        }, "3 hours"), er.default.createElement("option", {
            value: 4
        }, "4 hours")))), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(fr, {
            size: 15
        }), " Push notifications (recommended)"), er.default.createElement("p", {
            className: "wt-card-note"
        }, "Real notifications from your own server, on the schedule above — arrive even with this closed. Requires the push server (see README) to be deployed and ", er.default.createElement("code", null, "config.js"), " pointed at it."), x ? er.default.createElement(er.default.Fragment, null, er.default.createElement("div", {
            className: "wt-toggle-row"
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, y.subscribed ? "Enabled on this device" : "Enabled"), er.default.createElement("button", {
            className: "wt-switch " + (y.subscribed ? "on" : ""),
            onClick: u,
            disabled: c,
            "aria-label": "Toggle push notifications"
        }, er.default.createElement("span", null))), y.subscribed && er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%"
            },
            onClick: s,
            disabled: c
        }, "Send test push"), f && er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 10,
                marginBottom: 0
            }
        }, f)) : er.default.createElement("p", {
            className: "wt-empty-note"
        }, "Push isn't supported in this browser/context. On iPhone, add this app to your home screen first (Share → Add to Home Screen), then open it from there.")), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(Er, {
            size: 15
        }), " Bedtime reminder"), er.default.createElement("p", {
            className: "wt-card-note"
        }, "A separate push notification at whatever time you want to start winding down — independent of the schedule above, and only sent once a day."), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: v.enabled ? 14 : 0
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), er.default.createElement("button", {
            className: "wt-switch " + (v.enabled ? "on" : ""),
            onClick: () => d("enabled", !v.enabled),
            "aria-label": "Toggle bedtime reminder"
        }, er.default.createElement("span", null))), v.enabled && er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginBottom: 0
            }
        }, "Lights Out time", er.default.createElement("input", {
            type: "time",
            value: v.time,
            onChange: e => d("time", e.target.value)
        })), v.enabled && !y.subscribed && er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Push notifications are off above — turn those on too, or this won't actually send anything.")), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(Sr, {
            size: 15
        }), " Supplement reminder"), er.default.createElement("p", {
            className: "wt-card-note"
        }, "A daily push notification reminding you to take your supplements and prescriptions — pick whatever time works, like 10am."), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: b.enabled ? 14 : 0
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), er.default.createElement("button", {
            className: "wt-switch " + (b.enabled ? "on" : ""),
            onClick: () => p("enabled", !b.enabled),
            "aria-label": "Toggle supplement reminder"
        }, er.default.createElement("span", null))), b.enabled && er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginBottom: 0
            }
        }, "Reminder time", er.default.createElement("input", {
            type: "time",
            value: b.time,
            onChange: e => p("time", e.target.value)
        })), b.enabled && !y.subscribed && er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Push notifications are off above — turn those on too, or this won't actually send anything.")), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(jr, {
            size: 15
        }), " Treatment reminder"), er.default.createElement("p", {
            className: "wt-card-note"
        }, "A daily push notification if anything you're tracking in Treatments is due today or overdue — names which one, so you know what to log."), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: w.enabled ? 14 : 0
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), er.default.createElement("button", {
            className: "wt-switch " + (w.enabled ? "on" : ""),
            onClick: () => m("enabled", !w.enabled),
            "aria-label": "Toggle treatment reminder"
        }, er.default.createElement("span", null))), w.enabled && er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginBottom: 0
            }
        }, "Reminder time", er.default.createElement("input", {
            type: "time",
            value: w.time,
            onChange: e => m("time", e.target.value)
        })), w.enabled && !y.subscribed && er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Push notifications are off above — turn those on too, or this won't actually send anything.")), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(fr, {
            size: 15
        }), " In-app nudge (bonus)"), er.default.createElement("p", {
            className: "wt-card-note"
        }, "A shorter-interval nudge while this tab is open and the screen is on — separate from the schedule above. Goes quiet the moment you lock your phone or switch apps."), er.default.createElement("div", {
            className: "wt-toggle-row"
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), er.default.createElement("button", {
            className: "wt-switch " + (h.enabled ? "on" : ""),
            onClick: () => h.enabled ? r() : n(h.intervalMin),
            "aria-label": "Toggle in-app reminder"
        }, er.default.createElement("span", null))), er.default.createElement("label", {
            className: "wt-field"
        }, "Remind me every", er.default.createElement("select", {
            value: h.intervalMin,
            onChange: e => a(Number(e.target.value))
        }, er.default.createElement("option", {
            value: 30
        }, "30 minutes"), er.default.createElement("option", {
            value: 60
        }, "1 hour"), er.default.createElement("option", {
            value: 90
        }, "1.5 hours"), er.default.createElement("option", {
            value: 120
        }, "2 hours"))), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%"
            },
            onClick: o
        }, "Send test reminder"), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: 10,
                marginBottom: 0
            }
        }, "Browser notifications: ", "granted" === t ? "allowed on this device" : "denied" === t ? "blocked — you'll still see the in-app banner" : "not yet requested")), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(yr, {
            size: 15
        }), " Calendar backup (.ics)"), er.default.createElement("p", {
            className: "wt-card-note"
        }, "No server required. Generates a file with recurring reminders on the schedule above — import it into your phone's Calendar app once for a zero-maintenance fallback."), er.default.createElement("button", {
            className: "wt-btn-primary",
            onClick: l
        }, er.default.createElement(yr, {
            size: 16
        }), " Download calendar reminders"), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                marginTop: 10,
                marginBottom: 0,
                lineHeight: 1.5
            }
        }, 'iPhone: open the file and tap "Add All" in Calendar. Android: open it with the Google Calendar app. These use your device\'s local time, so re-download if you change timezones for a trip.')))
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
        let [S, O] = (0, er.useState)(String(e.settings.goalOz || "")), [P, C] = (0, er.useState)(String(e.settings.goalProtein || "")), [j, N] = (0, er.useState)(String(e.settings.goalCalories || "")), [T, A] = (0, er.useState)(String(e.settings.goalSleepHours || "")), [M, _] = (0, er.useState)(!1), [D, z] = (0, er.useState)(null), [I, L] = (0, er.useState)(!1), [R, B] = (0, er.useState)(null), [$, F] = (0, er.useState)(!1), [U, W] = (0, er.useState)(null);
        (0, er.useEffect)(() => {
            O(String(e.settings.goalOz || ""))
        }, [e.settings.goalOz]), (0, er.useEffect)(() => {
            C(String(e.settings.goalProtein || ""))
        }, [e.settings.goalProtein]), (0, er.useEffect)(() => {
            N(String(e.settings.goalCalories || ""))
        }, [e.settings.goalCalories]), (0, er.useEffect)(() => {
            A(String(e.settings.goalSleepHours || ""))
        }, [e.settings.goalSleepHours]);
        let [H, q] = (0, er.useState)(String(e.settings.goalWeight || "")), [V, G] = (0, er.useState)(String(e.settings.goalExerciseMinutes || ""));
        (0, er.useEffect)(() => {
            q(String(e.settings.goalWeight || ""))
        }, [e.settings.goalWeight]), (0, er.useEffect)(() => {
            G(String(e.settings.goalExerciseMinutes || ""))
        }, [e.settings.goalExerciseMinutes]);
        let X = !1 !== e.settings.showWater,
            Y = !1 !== e.settings.showProtein,
            K = !1 !== e.settings.showCalories,
            Q = !1 !== e.settings.showSleep,
            Z = !1 !== e.settings.showWeight,
            J = !1 !== e.settings.showSupplements,
            ee = !1 !== e.settings.showTreatments,
            te = !1 !== e.settings.showExercise;
        return er.default.createElement("div", null, er.default.createElement("div", {
            className: "wt-section-label"
        }, "Daily goals"), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("label", {
            className: "wt-field"
        }, "Water — ounces per day", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            value: S,
            onChange: e => O(e.target.value),
            onBlur: () => {
                let n = Number(S);
                n > 0 ? t(n) : O(String(e.settings.goalOz))
            }
        })), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: 16
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 12.5,
                color: wS
            }
        }, "Show on Log page"), er.default.createElement("button", {
            className: "wt-switch " + (X ? "on" : ""),
            onClick: () => l(!X),
            "aria-label": "Toggle water on Log page"
        }, er.default.createElement("span", null))), er.default.createElement("label", {
            className: "wt-field"
        }, "Protein — grams per day", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            value: P,
            onChange: e => C(e.target.value),
            onBlur: () => {
                let t = Number(P);
                t > 0 ? n(t) : C(String(e.settings.goalProtein))
            }
        })), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: 16
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 12.5,
                color: wS
            }
        }, "Show on Log page"), er.default.createElement("button", {
            className: "wt-switch " + (Y ? "on" : ""),
            onClick: () => u(!Y),
            "aria-label": "Toggle protein on Log page"
        }, er.default.createElement("span", null))), er.default.createElement("label", {
            className: "wt-field"
        }, "Calories — per day", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            value: j,
            onChange: e => N(e.target.value),
            onBlur: () => {
                let t = Number(j);
                t > 0 ? r(t) : N(String(e.settings.goalCalories))
            }
        })), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: 16
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 12.5,
                color: wS
            }
        }, "Show on Log page"), er.default.createElement("button", {
            className: "wt-switch " + (K ? "on" : ""),
            onClick: () => s(!K),
            "aria-label": "Toggle calories on Log page"
        }, er.default.createElement("span", null))), er.default.createElement("label", {
            className: "wt-field"
        }, "Sleep — hours per night", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            value: T,
            onChange: e => A(e.target.value),
            onBlur: () => {
                let t = Number(T);
                t > 0 ? a(t) : A(String(e.settings.goalSleepHours))
            }
        })), er.default.createElement("div", {
            className: "wt-toggle-row"
        }, er.default.createElement("span", {
            style: {
                fontSize: 12.5,
                color: wS
            }
        }, "Show on Log page"), er.default.createElement("button", {
            className: "wt-switch " + (Q ? "on" : ""),
            onClick: () => c(!Q),
            "aria-label": "Toggle sleep on Log page"
        }, er.default.createElement("span", null))), er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginTop: 16
            }
        }, "Weight — target in lbs", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            value: H,
            onChange: e => q(e.target.value),
            onBlur: () => {
                let t = Number(H);
                t > 0 ? o(t) : q(String(e.settings.goalWeight))
            }
        })), er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginTop: 12
            }
        }, "Exercise — minutes per day", er.default.createElement("input", {
            type: "number",
            inputMode: "numeric",
            value: V,
            onChange: e => G(e.target.value),
            onBlur: () => {
                let t = Number(V);
                t > 0 ? i(t) : G(String(e.settings.goalExerciseMinutes))
            }
        })), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                margin: "12px 0 0"
            }
        }, "Turning a tracker off here just hides it from the main screen — it's still counted in Reports.")), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Other trackers"), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-toggle-row"
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Weight"), er.default.createElement("button", {
            className: "wt-switch " + (Z ? "on" : ""),
            onClick: () => f(!Z),
            "aria-label": "Toggle weight on Log page"
        }, er.default.createElement("span", null))), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginTop: 10
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "RX & Supplements"), er.default.createElement("button", {
            className: "wt-switch " + (J ? "on" : ""),
            onClick: () => d(!J),
            "aria-label": "Toggle supplements on Log page"
        }, er.default.createElement("span", null))), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginTop: 10
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Treatments"), er.default.createElement("button", {
            className: "wt-switch " + (ee ? "on" : ""),
            onClick: () => p(!ee),
            "aria-label": "Toggle treatments on Log page"
        }, er.default.createElement("span", null))), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginTop: 10
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Exercise"), er.default.createElement("button", {
            className: "wt-switch " + (te ? "on" : ""),
            onClick: () => m(!te),
            "aria-label": "Toggle exercise on Log page"
        }, er.default.createElement("span", null))), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                margin: "12px 0 0"
            }
        }, "Turning one off here just hides its tile from the Log page.")), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Presets"), 0 === e.settings.presets.length && er.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 10
            }
        }, "No presets yet. Add something you log often — a drink, a shake, a usual snack — with whichever of water, protein, or calories apply."), [...e.settings.presets].sort((e, t) => e.name.localeCompare(t.name)).map(e => {
            let t = [];
            return e.oz > 0 && t.push(`${e.oz}oz`), e.grams > 0 && t.push(`${e.grams}g`), e.calories > 0 && t.push(`${e.calories}cal`), er.default.createElement("div", {
                key: e.id,
                className: "wt-preset-row"
            }, er.default.createElement("span", {
                className: "wt-preset-name"
            }, e.name), er.default.createElement("span", {
                className: "wt-preset-oz"
            }, t.join(" · ")), er.default.createElement("button", {
                className: "wt-icon-btn",
                onClick: () => {
                    z(e), _(!0)
                },
                "aria-label": "Edit preset"
            }, er.default.createElement(kr, {
                size: 14
            })), er.default.createElement("button", {
                className: "wt-icon-btn",
                onClick: () => y(e.id),
                "aria-label": "Delete preset"
            }, er.default.createElement(Nr, {
                size: 14
            })))
        }), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 4
            },
            onClick: () => {
                z(null), _(!0)
            }
        }, er.default.createElement(Or, {
            size: 15
        }), " Add preset"), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Supplements & Prescriptions"), 0 === e.settings.supplements.length && er.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 10
            }
        }, "Nothing added yet. Add the vitamins, supplements, and medicines you take regularly so they show up as one-tap options in Log Supplements & Prescriptions."), [...e.settings.supplements].sort((e, t) => e.name.localeCompare(t.name)).map(e => er.default.createElement("div", {
            key: e.id,
            className: "wt-preset-row"
        }, er.default.createElement("span", {
            className: "wt-preset-name"
        }, e.name), QS(e) && er.default.createElement("span", {
            style: {
                fontSize: 11,
                fontWeight: 700,
                color: bS,
                marginRight: 4,
                whiteSpace: "nowrap"
            }
        }, QS(e)), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => {
                B(e), L(!0)
            },
            "aria-label": "Edit item"
        }, er.default.createElement(kr, {
            size: 14
        })), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => w(e.id),
            "aria-label": "Delete item"
        }, er.default.createElement(Nr, {
            size: 14
        })))), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 4
            },
            onClick: () => {
                B(null), L(!0)
            }
        }, er.default.createElement(Or, {
            size: 15
        }), " Add supplement or medicine"), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Treatments"), 0 === e.settings.treatments.length && er.default.createElement("p", {
            className: "wt-empty-note",
            style: {
                marginBottom: 10
            }
        }, "Nothing added yet. Add periodic treatments — drips, shots, PT sessions, anything on a recurring schedule — so you can log them and see when the next one's due."), [...e.settings.treatments].sort((e, t) => e.name.localeCompare(t.name)).map(e => er.default.createElement("div", {
            key: e.id,
            className: "wt-preset-row"
        }, er.default.createElement("span", {
            className: "wt-preset-name"
        }, e.name, e.intervalDays > 0 ? ` · every ${e.intervalDays}d` : " · history only"), QS(e) && er.default.createElement("span", {
            style: {
                fontSize: 11,
                fontWeight: 700,
                color: bS,
                marginRight: 4,
                whiteSpace: "nowrap"
            }
        }, QS(e)), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => {
                W(e), F(!0)
            },
            "aria-label": "Edit treatment"
        }, er.default.createElement(kr, {
            size: 14
        })), er.default.createElement("button", {
            className: "wt-icon-btn",
            onClick: () => k(e.id),
            "aria-label": "Delete treatment"
        }, er.default.createElement(Nr, {
            size: 14
        })))), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 4
            },
            onClick: () => {
                W(null), F(!0)
            }
        }, er.default.createElement(Or, {
            size: 15
        }), " Add a treatment"), er.default.createElement(OO, {
            open: M,
            initial: D,
            onClose: () => _(!1),
            onSave: e => {
                D ? g(D.id, e.name, e.oz, e.grams, e.calories) : h(e.name, e.oz, e.grams, e.calories), _(!1)
            }
        }), er.default.createElement(CO, {
            open: I,
            initial: R,
            onClose: () => L(!1),
            onSave: (e, t, n, r, a) => {
                R ? b(R.id, e, t, n, r, a) : v(e, t, n, r, a), L(!1)
            }
        }), er.default.createElement(jO, {
            open: $,
            initial: U,
            onClose: () => F(!1),
            onSave: (e, t, n, r, a) => {
                U ? E(U.id, e, t, n, r, a) : x(e, t, n, r, a), F(!1)
            }
        }))
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
        let [T, A] = (0, er.useState)(e.settings.testerName || ""), [M, _] = (0, er.useState)(!1), D = e.settings.cloudBackup || {
            enabled: !1,
            code: null,
            lastSavedAt: null
        }, z = e.settings.account || {
            email: null,
            sessionToken: null
        }, [I, L] = (0, er.useState)(""), [R, B] = (0, er.useState)("idle"), [$, F] = (0, er.useState)(""), [U, W] = (0, er.useState)(!1), [H, q] = (0, er.useState)(!1), V = (0, er.useRef)(null);
        return (0, er.useEffect)(() => {
            A(e.settings.testerName || "")
        }, [e.settings.testerName]), er.default.createElement("div", null, er.default.createElement("button", {
            className: "wt-btn-primary",
            style: {
                marginBottom: 12
            },
            onClick: () => q(!0)
        }, "How to use this"), er.default.createElement("label", {
            className: "wt-field",
            style: {
                marginBottom: 10
            }
        }, "Your name (so we know who's giving feedback)", er.default.createElement("input", {
            type: "text",
            placeholder: "e.g. Sarah M.",
            value: T,
            onChange: e => A(e.target.value),
            onBlur: () => l(T)
        })), er.default.createElement("button", {
            className: "wt-btn-primary wt-tracker-btn-sleep",
            style: {
                marginBottom: 18
            },
            onClick: o
        }, "Give Feedback"), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: 18,
                marginTop: -8
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 11.5,
                color: wS,
                maxWidth: 260
            }
        }, "Notify me (push) when new feedback comes in"), er.default.createElement("button", {
            className: "wt-switch " + (e.settings.feedbackWatching ? "on" : ""),
            onClick: () => i(!e.settings.feedbackWatching),
            "aria-label": "Toggle feedback notifications"
        }, er.default.createElement("span", null))), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Reminders"), er.default.createElement(UO, {
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
        }), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Account"), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(xr, {
            size: 15
        }), " Sign in"), z.email ? er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            className: "wt-card-note"
        }, "Signed in as ", er.default.createElement("b", null, z.email), ". Your data backs up here automatically too — no recovery code needed on a new device, just sign in."), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginBottom: 8
            },
            onClick: j
        }, "Back up now"), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginBottom: 8
            },
            onClick: C
        }, "Restore from my account"), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%"
            },
            onClick: P
        }, "Sign out")) : "sent" === R ? er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            className: "wt-card-note"
        }, "Check ", er.default.createElement("b", null, I), " for a sign-in link — it works for 15 minutes."), er.default.createElement("button", {
            className: "wt-btn-text",
            onClick: () => B("idle")
        }, "Use a different email")) : er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            className: "wt-card-note"
        }, "Sign in with just your email — no password. This is the first step toward syncing your data across devices; for now, cloud backup below still uses its own separate recovery code."), er.default.createElement("label", {
            className: "wt-field"
        }, "Email", er.default.createElement("input", {
            type: "email",
            value: I,
            onChange: e => L(e.target.value),
            placeholder: "you@example.com"
        })), $ && er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                marginTop: -8,
                marginBottom: 10
            }
        }, $), er.default.createElement("button", {
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
        }, "sending" === R ? "Sending…" : "Send sign-in link"))), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Backup"), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("div", {
            className: "wt-card-title"
        }, er.default.createElement(gr, {
            size: 15
        }), " Automatic cloud backup"), er.default.createElement("p", {
            className: "wt-card-note"
        }, "Keeps a copy of your data on the server so a lost phone or a cleared browser doesn't wipe your history. Saves on its own in the background."), er.default.createElement("div", {
            className: "wt-toggle-row",
            style: {
                marginBottom: D.enabled ? 14 : 0
            }
        }, er.default.createElement("span", {
            style: {
                fontSize: 13.5,
                fontWeight: 600
            }
        }, "Enabled"), er.default.createElement("button", {
            className: "wt-switch " + (D.enabled ? "on" : ""),
            onClick: () => u(!D.enabled),
            "aria-label": "Toggle cloud backup"
        }, er.default.createElement("span", null))), D.enabled && D.code && er.default.createElement(er.default.Fragment, null, er.default.createElement("p", {
            style: {
                fontSize: 12,
                fontWeight: 700,
                color: dS,
                margin: "0 0 6px"
            }
        }, "Your recovery code"), er.default.createElement("div", {
            className: "wt-recovery-code"
        }, D.code), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: bS,
                margin: "8px 0 0",
                lineHeight: 1.5
            }
        }, "Write this down or screenshot it now. It's the only way to get your data back on a new phone — and if this browser's data is cleared, the code goes with it."), er.default.createElement("p", {
            style: {
                fontSize: 11.5,
                color: wS,
                margin: "8px 0 0"
            }
        }, D.lastSavedAt ? `Last backed up ${new Date(D.lastSavedAt).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}` : "Not backed up yet"), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                width: "100%",
                marginTop: 12
            },
            onClick: s
        }, "Back up now")), er.default.createElement("button", {
            className: "wt-btn-text",
            onClick: () => _(!0)
        }, "Restore from a recovery code")), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("p", {
            className: "wt-card-note",
            style: {
                marginBottom: 12
            }
        }, "You can also keep your own backup file — useful if you'd rather not rely on the server copy, or want an archive you control."), er.default.createElement("div", {
            style: {
                display: "flex",
                gap: 10
            }
        }, er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            },
            onClick: n
        }, "Export backup"), er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            },
            onClick: () => V.current.click()
        }, "Import backup")), er.default.createElement("input", {
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
        })), er.default.createElement(PO, {
            open: M,
            onClose: () => _(!1),
            onRestore: c
        }), er.default.createElement("div", {
            className: "wt-section-label"
        }, "Data"), er.default.createElement("div", {
            style: {
                display: "flex",
                gap: 10
            }
        }, er.default.createElement("button", {
            className: "wt-btn-secondary",
            style: {
                flex: 1
            },
            onClick: t
        }, "Export CSV"), er.default.createElement("button", {
            className: "wt-btn-secondary wt-btn-danger",
            style: {
                flex: 1
            },
            onClick: () => W(!0)
        }, "Reset all data")), er.default.createElement("div", {
            className: "wt-section-label"
        }, "About"), er.default.createElement("div", {
            className: "wt-card"
        }, er.default.createElement("p", {
            className: "wt-card-note",
            style: {
                marginBottom: 12
            }
        }, "HydroPro Tracker is a personal project currently in trial with a small group of testers. Your data stays on this device — nothing is sent anywhere except push notification scheduling, if you've turned that on. Things may still change as it's refined. Found a bug, or have an idea? Let me know."), er.default.createElement("a", {
            className: "wt-btn-secondary",
            style: {
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                marginBottom: 12
            },
            href: "mailto:rob@bostonpickleballassociation.org?subject=HydroPro%20Tracker%20feedback"
        }, "Send feedback"), er.default.createElement("p", {
            style: {
                fontSize: 11,
                color: wS,
                margin: 0,
                textAlign: "center"
            }
        }, "Version ", xS), er.default.createElement("p", {
            style: {
                fontSize: 10.5,
                color: wS,
                margin: "6px 0 0",
                textAlign: "center"
            }
        }, "© 2026 HydroPro Tracker Inc. All Rights Reserved.")), er.default.createElement(vO, {
            open: U,
            title: "Reset all data?",
            message: "This clears every logged day, all 4 goals, and all your presets. This can't be undone.",
            danger: !0,
            onCancel: () => W(!1),
            onConfirm: () => {
                a(), W(!1)
            }
        }), er.default.createElement(yO, {
            open: H,
            onClose: () => q(!1)
        }))
    }(0, Jn.createRoot)(document.getElementById("root")).render(er.default.createElement(function() {
        let e = typeof window < "u" ? new URLSearchParams(window.location.search).get("share") : null;
        if (e) return er.default.createElement(zO, {
            shareId: e
        });
        let [t, n] = (0, er.useState)(null), [r, a] = (0, er.useState)("log"), [o, i] = (0, er.useState)(!1), [l, u] = (0, er.useState)(null), [s, c] = (0, er.useState)(null), [f, d] = (0, er.useState)(null), [p, m] = (0, er.useState)(0), [h, g] = (0, er.useState)(!1), [y, v] = (0, er.useState)(0), [b, w] = (0, er.useState)(JS()), [x, E] = (0, er.useState)(null), [k, S] = (0, er.useState)(!1), [O, P] = (0, er.useState)(null), [C, j] = (0, er.useState)(!1), [N, T] = (0, er.useState)(!1), [A, M] = (0, er.useState)(null), [_, D] = (0, er.useState)(!1), [z, I] = (0, er.useState)(null), [L, R] = (0, er.useState)(!1), [B, $] = (0, er.useState)(null), [F, U] = (0, er.useState)(!1), W = (0, er.useRef)(null), H = (0, er.useRef)(null), q = (0, er.useRef)(null), V = (0, er.useRef)(null), G = (0, er.useRef)(!1), X = (0, er.useRef)(null), Y = (0, er.useRef)(null), [K, Q] = (0, er.useState)(null), [Z, J] = (0, er.useState)(null), [ee, te] = (0, er.useState)(typeof Notification < "u" ? Notification.permission : "unsupported"), [ne, re] = (0, er.useState)(!1), [ae, oe] = (0, er.useState)(null), ie = (0, er.useRef)(null), le = (0, er.useRef)(null), ue = (0, er.useRef)(null), se = (0, er.useRef)(!1);

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
            return {
                app: "HydroPro Tracker",
                exportedAt: (new Date).toISOString(),
                version: 2,
                logs: t.logs,
                activeSleepSession: t.activeSleepSession,
                settings: {
                    goalOz: t.settings.goalOz,
                    goalProtein: t.settings.goalProtein,
                    goalCalories: t.settings.goalCalories,
                    goalSleepHours: t.settings.goalSleepHours,
                    showWater: t.settings.showWater,
                    showProtein: t.settings.showProtein,
                    showCalories: t.settings.showCalories,
                    showSleep: t.settings.showSleep,
                    showWeight: t.settings.showWeight,
                    showSupplements: t.settings.showSupplements,
                    showTreatments: t.settings.showTreatments,
                    showExercise: t.settings.showExercise,
                    testerName: t.settings.testerName,
                    presets: t.settings.presets,
                    supplements: t.settings.supplements,
                    treatments: t.settings.treatments,
                    reminders: {
                        inApp: t.settings.reminders.inApp,
                        calendar: t.settings.reminders.calendar
                    }
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
                o = {
                    logs: $S(r.logs || {}),
                    activeSleepSession: r.activeSleepSession || null,
                    settings: {
                        goalOz: r.settings.goalOz || ES.settings.goalOz,
                        goalProtein: r.settings.goalProtein || ES.settings.goalProtein,
                        goalCalories: r.settings.goalCalories || ES.settings.goalCalories,
                        goalSleepHours: r.settings.goalSleepHours || ES.settings.goalSleepHours,
                        showWater: "boolean" == typeof r.settings.showWater ? r.settings.showWater : ES.settings.showWater,
                        showProtein: "boolean" == typeof r.settings.showProtein ? r.settings.showProtein : ES.settings.showProtein,
                        showCalories: "boolean" == typeof r.settings.showCalories ? r.settings.showCalories : ES.settings.showCalories,
                        showSleep: "boolean" == typeof r.settings.showSleep ? r.settings.showSleep : ES.settings.showSleep,
                        showWeight: "boolean" == typeof r.settings.showWeight ? r.settings.showWeight : ES.settings.showWeight,
                        showSupplements: "boolean" == typeof r.settings.showSupplements ? r.settings.showSupplements : ES.settings.showSupplements,
                        showTreatments: "boolean" == typeof r.settings.showTreatments ? r.settings.showTreatments : ES.settings.showTreatments,
                        showExercise: "boolean" == typeof r.settings.showExercise ? r.settings.showExercise : ES.settings.showExercise,
                        testerName: "string" == typeof r.settings.testerName ? r.settings.testerName : ES.settings.testerName,
                        presets: FS(r.settings),
                        supplements: US(r.settings),
                        treatments: Array.isArray(r.settings.treatments) ? r.settings.treatments : ES.settings.treatments,
                        feedbackWatching: t.settings.feedbackWatching,
                        cloudBackup: t.settings.cloudBackup,
                        account: t.settings.account,
                        reminders: {
                            inApp: {
                                ...ES.settings.reminders.inApp,
                                ...r.settings.reminders && r.settings.reminders.inApp || {}
                            },
                            calendar: {
                                ...ES.settings.reminders.calendar,
                                ...r.settings.reminders && r.settings.reminders.calendar || {}
                            },
                            push: t.settings.reminders.push,
                            bedtime: t.settings.reminders.bedtime,
                            supplementReminder: t.settings.reminders.supplementReminder,
                            treatmentReminder: t.settings.reminders.treatmentReminder
                        }
                    }
                };
            n(o), ce("Backup restored.", () => n(a))
        }
        if ((0, er.useEffect)(() => {
                (async function() {
                    try {
                        let e = localStorage.getItem(cS);
                        if (e) {
                            let t = JSON.parse(e);
                            return {
                                logs: $S(t.logs || {}),
                                activeSleepSession: t.activeSleepSession || null,
                                settings: {
                                    goalOz: t.settings && t.settings.goalOz ? t.settings.goalOz : ES.settings.goalOz,
                                    goalProtein: t.settings && t.settings.goalProtein ? t.settings.goalProtein : ES.settings.goalProtein,
                                    goalCalories: t.settings && t.settings.goalCalories ? t.settings.goalCalories : ES.settings.goalCalories,
                                    goalSleepHours: t.settings && t.settings.goalSleepHours ? t.settings.goalSleepHours : ES.settings.goalSleepHours,
                                    goalWeight: t.settings && t.settings.goalWeight ? t.settings.goalWeight : ES.settings.goalWeight,
                                    goalExerciseMinutes: t.settings && t.settings.goalExerciseMinutes ? t.settings.goalExerciseMinutes : ES.settings.goalExerciseMinutes,
                                    showWater: t.settings && "boolean" == typeof t.settings.showWater ? t.settings.showWater : ES.settings.showWater,
                                    showProtein: t.settings && "boolean" == typeof t.settings.showProtein ? t.settings.showProtein : ES.settings.showProtein,
                                    showCalories: t.settings && "boolean" == typeof t.settings.showCalories ? t.settings.showCalories : ES.settings.showCalories,
                                    showSleep: t.settings && "boolean" == typeof t.settings.showSleep ? t.settings.showSleep : ES.settings.showSleep,
                                    showWeight: t.settings && "boolean" == typeof t.settings.showWeight ? t.settings.showWeight : ES.settings.showWeight,
                                    showSupplements: t.settings && "boolean" == typeof t.settings.showSupplements ? t.settings.showSupplements : ES.settings.showSupplements,
                                    showTreatments: t.settings && "boolean" == typeof t.settings.showTreatments ? t.settings.showTreatments : ES.settings.showTreatments,
                                    showExercise: t.settings && "boolean" == typeof t.settings.showExercise ? t.settings.showExercise : ES.settings.showExercise,
                                    feedbackWatching: t.settings && "boolean" == typeof t.settings.feedbackWatching ? t.settings.feedbackWatching : ES.settings.feedbackWatching,
                                    testerName: t.settings && "string" == typeof t.settings.testerName ? t.settings.testerName : ES.settings.testerName,
                                    cloudBackup: {
                                        ...ES.settings.cloudBackup,
                                        ...t.settings && t.settings.cloudBackup || {}
                                    },
                                    account: {
                                        ...ES.settings.account,
                                        ...t.settings && t.settings.account || {}
                                    },
                                    presets: FS(t.settings),
                                    supplements: US(t.settings),
                                    treatments: t.settings && Array.isArray(t.settings.treatments) ? t.settings.treatments : ES.settings.treatments,
                                    reminders: {
                                        inApp: {
                                            ...ES.settings.reminders.inApp,
                                            ...t.settings && t.settings.reminders && t.settings.reminders.inApp || {}
                                        },
                                        calendar: {
                                            ...ES.settings.reminders.calendar,
                                            ...t.settings && t.settings.reminders && t.settings.reminders.calendar || {}
                                        },
                                        push: {
                                            ...ES.settings.reminders.push,
                                            ...t.settings && t.settings.reminders && t.settings.reminders.push || {}
                                        },
                                        bedtime: {
                                            ...ES.settings.reminders.bedtime,
                                            ...t.settings && t.settings.reminders && t.settings.reminders.bedtime || {}
                                        },
                                        supplementReminder: {
                                            ...ES.settings.reminders.supplementReminder,
                                            ...t.settings && t.settings.reminders && t.settings.reminders.supplementReminder || {}
                                        },
                                        treatmentReminder: {
                                            ...ES.settings.reminders.treatmentReminder,
                                            ...t.settings && t.settings.reminders && t.settings.reminders.treatmentReminder || {}
                                        }
                                    }
                                }
                            }
                        }
                    } catch {}
                    return JSON.parse(JSON.stringify(ES))
                })().then(e => {
                    n(e), se.current = !0
                }), nS().catch(() => {})
            }, []), (0, er.useEffect)(() => {
                t && se.current && async function(e) {
                    try {
                        localStorage.setItem(cS, JSON.stringify(e))
                    } catch (e) {
                        console.error("Failed to save water tracker data", e)
                    }
                }(t)
            }, [t]), (0, er.useEffect)(() => (t && t.settings.reminders.inApp.enabled && de(t.settings.reminders.inApp.intervalMin), () => clearInterval(ue.current)), [t && t.settings.reminders.inApp.enabled]), (0, er.useEffect)(() => {
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
            }, [t]), (0, er.useEffect)(() => {
                if (t && t.settings.cloudBackup && t.settings.cloudBackup.enabled && t.settings.cloudBackup.code && be(ve()) !== W.current) return clearTimeout(H.current), H.current = setTimeout(() => {
                    we("auto")
                }, 2e4), () => clearTimeout(H.current)
            }, [t]), (0, er.useEffect)(() => {
                function e() {
                    typeof document > "u" || "hidden" !== document.visibilityState || !t || !t.settings.cloudBackup || !t.settings.cloudBackup.enabled || be(ve()) === W.current || (clearTimeout(H.current), we("auto"))
                }
                if (!(typeof document > "u")) return document.addEventListener("visibilitychange", e), () => document.removeEventListener("visibilitychange", e)
            }, [t]), (0, er.useEffect)(() => {
                if (!t || !t.settings.account.sessionToken) return;
                let e = ve(),
                    n = be(e);
                return n !== X.current ? (clearTimeout(Y.current), Y.current = setTimeout(() => {
                    lS(t.settings.account.sessionToken, e).then(() => {
                        X.current = n
                    }).catch(() => {})
                }, 2e4), () => clearTimeout(Y.current)) : void 0
            }, [t]), (0, er.useEffect)(() => {
                function e() {
                    if (typeof document > "u" || "hidden" !== document.visibilityState || !t || !t.settings.account.sessionToken) return;
                    let e = ve(),
                        n = be(e);
                    n !== X.current && (clearTimeout(Y.current), lS(t.settings.account.sessionToken, e).then(() => {
                        X.current = n
                    }).catch(() => {}))
                }
                if (!(typeof document > "u")) return document.addEventListener("visibilitychange", e), () => document.removeEventListener("visibilitychange", e)
            }, [t]), (0, er.useEffect)(() => {
                if (!t || !t.settings.reminders.push.subscribed || !t.settings.reminders.push.id) return;
                let e = ye(),
                    n = JSON.stringify(e);
                return n !== q.current ? (clearTimeout(V.current), V.current = setTimeout(() => {
                    uS(t.settings.reminders.push.id, e), q.current = n
                }, 2e4), () => clearTimeout(V.current)) : void 0
            }, [t]), (0, er.useEffect)(() => {
                function e() {
                    if (typeof document > "u" || "hidden" !== document.visibilityState || !t || !t.settings.reminders.push.subscribed || !t.settings.reminders.push.id) return;
                    let e = ye(),
                        n = JSON.stringify(e);
                    n !== q.current && (clearTimeout(V.current), uS(t.settings.reminders.push.id, e), q.current = n)
                }
                if (!(typeof document > "u")) return document.addEventListener("visibilitychange", e), () => document.removeEventListener("visibilitychange", e)
            }, [t]), (0, er.useEffect)(() => {
                wtActivityPing()
            }, []), !t) return er.default.createElement("div", {
            className: "wt-root"
        }, er.default.createElement("style", null, iO), er.default.createElement("div", {
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
        return er.default.createElement("div", {
            className: "wt-root"
        }, er.default.createElement("style", null, iO), er.default.createElement("div", {
            className: "wt-topbanner"
        }, er.default.createElement("div", {
            className: "wt-topbanner-inner"
        }, er.default.createElement("div", {
            className: "wt-topbanner-badge"
        }, er.default.createElement("img", {
            src: "gauges/main-logo.png",
            alt: ""
        })), er.default.createElement("div", {
            className: "wt-topbanner-text"
        }, er.default.createElement("span", {
            className: "wt-topbanner-title"
        }, "HydroPro Tracker"))), er.default.createElement("svg", {
            className: "wt-topbanner-wave",
            viewBox: "0 0 400 24",
            preserveAspectRatio: "none"
        }, er.default.createElement("path", {
            d: "M0,14 C33,4 67,24 100,14 C133,4 167,24 200,14 C233,4 267,24 300,14 C333,4 367,24 400,14 L400,24 L0,24 Z"
        }))), er.default.createElement("div", {
            className: "wt-frame"
        }, er.default.createElement("div", {
            className: "wt-header"
        }, er.default.createElement("span", {
            className: "wt-date"
        }, er.default.createElement("span", {
            className: "wt-date-label"
        }, "today" === r ? "Day Planner:" : "reports" === r ? "TO DATE STATS:" : "setup" === r ? "Setup for:" : "settings" === r ? "Settings" : "Day Tracker:"), "settings" !== r && er.default.createElement(er.default.Fragment, null, " ", function(e) {
            return e.toLocaleDateString(void 0, {
                weekday: "long",
                month: "short",
                day: "numeric"
            })
        }(new Date)))), "log" === r && er.default.createElement(MO, {
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
            }
        }), "today" === r && er.default.createElement(RO, {
            data: t,
            todayKey: Ee,
            onDeleteLog: function(e) {
                me(HS(new Date), e)
            },
            onEditLogEntry: function(e) {
                PS(e) ? ($(e), R(!0)) : jS(e) ? (E(e), v(e.value), w(eO(e.timeMinutes)), g(!0)) : NS(e) ? (P(e), S(!0)) : zS(e) ? (I({
                    ...e,
                    dateKeyStr: HS(new Date)
                }), j(!0)) : IS(e) ? (M(e), T(!0)) : (u(e), i(!0))
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
            }
        }), "reports" === r && er.default.createElement(FO, {
            data: t,
            onDrShare: () => D(!0)
        }), "setup" === r && er.default.createElement(WO, {
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
            onAddPreset: function(e, t, r, a) {
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
            },
            onEditPreset: function(e, t, r, a, o) {
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
            },
            onDeletePreset: function(e) {
                n(t => ({
                    ...t,
                    settings: {
                        ...t.settings,
                        presets: t.settings.presets.filter(t => t.id !== e)
                    }
                }))
            },
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
        }), "settings" === r && er.default.createElement(HO, {
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
        })), er.default.createElement(xO, {
            open: o,
            initial: l,
            quickFill: s,
            onClose: () => {
                i(!1), u(null), c(null)
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
                })(e), i(!1), u(null), c(null)
            }
        }), er.default.createElement(wO, {
            open: "oz" === f,
            title: "Water",
            unit: "oz",
            max: 64,
            value: p,
            color: mS,
            onChange: m,
            onClose: he,
            onLogNow: ge,
            onDismiss: () => d(null)
        }), er.default.createElement(wO, {
            open: "grams" === f,
            title: "Protein",
            unit: "g",
            max: 80,
            value: p,
            color: hS,
            onChange: m,
            onClose: he,
            onLogNow: ge,
            onDismiss: () => d(null)
        }), er.default.createElement(wO, {
            open: "calories" === f,
            title: "Calories",
            unit: "cal",
            max: 800,
            value: p,
            color: gS,
            onChange: m,
            onClose: he,
            onLogNow: ge,
            onDismiss: () => d(null)
        }), er.default.createElement(wO, {
            open: h,
            title: x ? "Edit Weight" : "Log Weight",
            unit: "lbs",
            max: 400,
            value: y,
            color: yS,
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
        }), er.default.createElement(NO, {
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
        }), er.default.createElement(AO, {
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
        }), er.default.createElement(TO, {
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
        }), er.default.createElement(_O, {
            open: _,
            data: t,
            onClose: () => D(!1)
        }), er.default.createElement(SO, {
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
        }), er.default.createElement(kO, {
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
        }), er.default.createElement(gO, {
            toast: K,
            onDismiss: () => Q(null)
        }), Z && er.default.createElement("div", {
            className: "wt-banner"
        }, Z), er.default.createElement("nav", {
            className: "wt-nav"
        }, er.default.createElement("button", {
            className: "wt-nav-btn " + ("log" === r ? "active" : ""),
            onClick: () => a("log")
        }, er.default.createElement(vr, {
            size: 18
        }), " Log It!"), er.default.createElement("button", {
            className: "wt-nav-btn " + ("today" === r ? "active" : ""),
            onClick: () => a("today")
        }, er.default.createElement(mr, {
            size: 18
        }), " Today"), er.default.createElement("button", {
            className: "wt-nav-btn " + ("reports" === r ? "active" : ""),
            onClick: () => a("reports")
        }, er.default.createElement(ur, {
            size: 18
        }), " Stats"), er.default.createElement("button", {
            className: "wt-nav-btn " + ("setup" === r ? "active" : ""),
            onClick: () => a("setup")
        }, er.default.createElement(Cr, {
            size: 18
        }), " Setup"), er.default.createElement("button", {
            className: "wt-nav-btn " + ("settings" === r ? "active" : ""),
            onClick: () => a("settings")
        }, er.default.createElement(Pr, {
            size: 18
        }), " Settings")))
    }))
