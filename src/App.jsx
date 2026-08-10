import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Droplet, Plus, X, Trash2, Settings as SettingsIcon, BarChart3, Bell,
  Download, ChevronLeft, ChevronRight, Pencil, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';
import {
  registerServiceWorker, subscribeToPush, updatePushSchedule, unsubscribeFromPush, sendTestPush,
} from './push.js';

/* ---------------------------------------------------------------------- */
/* Constants                                                              */
/* ---------------------------------------------------------------------- */

const STORAGE_KEY = 'water-tracker-data';
const QUICK_OZ = [8, 12, 16, 20, 24, 32];
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLORS = {
  ink: '#0E2A2E',
  deep: '#155055',
  teal: '#2B8C87',
  tealLight: '#79CFC5',
  mist: '#DCEEEA',
  citrus: '#E3A83B',
  paper: '#F3F5F3',
  line: '#D8E2DF',
  danger: '#C1523E',
  muted: '#5B6B69',
};

const DEFAULT_DATA = {
  logs: {},
  settings: {
    goalOz: 64,
    presets: [],
    reminders: {
      inApp: { enabled: false, intervalMin: 60 },
      calendar: { startTime: '08:00', endTime: '20:00', intervalHours: 2 },
      push: { subscribed: false, id: null },
    },
  },
};

/* ---------------------------------------------------------------------- */
/* Date / format helpers                                                  */
/* ---------------------------------------------------------------------- */

const pad2 = (n) => String(n).padStart(2, '0');

function dateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d, n) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function fmtShortDate(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function fmtTime(d) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function fmtMonthYear(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
function fmtHeaderDate(d) {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/* ---------------------------------------------------------------------- */
/* Storage                                                                */
/* ---------------------------------------------------------------------- */

async function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        logs: parsed.logs || {},
        settings: {
          goalOz: parsed.settings && parsed.settings.goalOz ? parsed.settings.goalOz : DEFAULT_DATA.settings.goalOz,
          presets: (parsed.settings && parsed.settings.presets) || [],
          reminders: {
            inApp: {
              ...DEFAULT_DATA.settings.reminders.inApp,
              ...((parsed.settings && parsed.settings.reminders && parsed.settings.reminders.inApp) || {}),
            },
            calendar: {
              ...DEFAULT_DATA.settings.reminders.calendar,
              ...((parsed.settings && parsed.settings.reminders && parsed.settings.reminders.calendar) || {}),
            },
            push: {
              ...DEFAULT_DATA.settings.reminders.push,
              ...((parsed.settings && parsed.settings.reminders && parsed.settings.reminders.push) || {}),
            },
          },
        },
      };
    }
  } catch (e) {
    /* no saved data yet, or storage unavailable */
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

async function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save water tracker data', e);
  }
}

/* ---------------------------------------------------------------------- */
/* Export helpers (.ics + .csv)                                           */
/* ---------------------------------------------------------------------- */

function buildICS(startTime, endTime, intervalHours) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const stepMin = Math.max(15, Math.round(intervalHours * 60));

  const slots = [];
  for (let t = startMin; t <= endMin; t += stepMin) slots.push(t);
  if (slots.length === 0) slots.push(startMin);

  const now = new Date();
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  const stampZ = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events = slots.map((t, i) => {
    const hh = pad2(Math.floor(t / 60));
    const mm = pad2(t % 60);
    const dtStart = `${y}${m}${d}T${hh}${mm}00`;
    const endTotal = t + 10;
    const endHH = pad2(Math.floor(endTotal / 60));
    const endMM = pad2(endTotal % 60);
    const dtEnd = `${y}${m}${d}T${endHH}${endMM}00`;
    const uid = `water-reminder-${i}-${Date.now()}@water-tracker.local`;
    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stampZ}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      'RRULE:FREQ=DAILY',
      'SUMMARY:Drink water',
      'DESCRIPTION:Reminder from your Water Tracker',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Drink water',
      'TRIGGER:-PT0M',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  }).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Water Tracker//EN',
    'CALSCALE:GREGORIAN',
    events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function buildCSV(logs) {
  const rows = [['Date', 'Time', 'Label', 'Ounces']];
  Object.keys(logs).sort().forEach((key) => {
    (logs[key] || []).forEach((entry) => {
      rows.push([key, entry.time, entry.label, String(entry.oz)]);
    });
  });
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

function downloadTextFile(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------------- */
/* Styles                                                                  */
/* ---------------------------------------------------------------------- */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');

.wt-root, .wt-root * { box-sizing: border-box; }
.wt-root {
  --ink:#0E2A2E; --deep:#155055; --teal:#2B8C87; --teal-light:#79CFC5;
  --mist:#DCEEEA; --citrus:#E3A83B; --paper:#F3F5F3; --line:#D8E2DF;
  --danger:#C1523E; --muted:#5B6B69;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  background:var(--paper); color:var(--ink); min-height:100vh; position:relative;
  padding-bottom:78px;
}
.wt-root :focus-visible { outline:2px solid var(--teal); outline-offset:2px; }
@media (prefers-reduced-motion: reduce) {
  .wt-root * { animation:none !important; transition:none !important; }
}

.wt-frame { max-width:420px; margin:0 auto; padding:18px 18px 4px; }

.wt-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.wt-brand { display:flex; align-items:center; gap:6px; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:17px; color:var(--deep); }
.wt-date { font-size:12.5px; color:var(--muted); }
.wt-streak { font-size:12px; background:var(--citrus); color:var(--ink); border-radius:999px; padding:3px 9px; font-weight:600; }

.wt-vessel-row { display:flex; justify-content:center; align-items:flex-end; gap:16px; margin:10px auto 8px; }
.wt-vessel { position:relative; width:118px; height:188px; border:3px solid var(--deep); border-radius:16px 16px 22px 22px; background:var(--mist); overflow:hidden; flex-shrink:0; }
.wt-vessel-fill { position:absolute; left:0; right:0; bottom:0; background:linear-gradient(180deg,var(--teal-light),var(--teal)); transition:height .7s cubic-bezier(.22,1,.36,1); animation:wt-bob 4s ease-in-out infinite alternate; }
.wt-wave { position:absolute; top:-9px; left:0; width:100%; height:14px; fill:var(--teal-light); }
.wt-overflow { position:absolute; top:6px; left:0; right:0; margin:0 auto; width:fit-content; text-align:center; font-family:'Space Grotesk',sans-serif; font-size:10.5px; font-weight:600; color:var(--ink); background:var(--citrus); border-radius:999px; padding:2px 8px; }
.wt-ticks { display:flex; flex-direction:column; justify-content:space-between; height:188px; padding-top:2px; }
.wt-ticks span { display:block; font-family:'Space Grotesk',sans-serif; font-size:10.5px; color:var(--muted); border-top:1px solid var(--line); padding-top:3px; min-width:36px; }
@keyframes wt-bob { from{ transform:translateY(0); } to{ transform:translateY(-3px); } }

.wt-today-number { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:38px; text-align:center; line-height:1; margin-top:6px; }
.wt-today-number .unit { font-size:16px; font-weight:500; color:var(--muted); margin-left:3px; }
.wt-today-sub { text-align:center; font-size:13px; color:var(--muted); margin-top:4px; margin-bottom:16px; }

.wt-btn-primary { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; background:var(--deep); color:#fff; border:none; border-radius:12px; padding:13px 16px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }
.wt-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
.wt-btn-secondary { display:flex; align-items:center; justify-content:center; gap:6px; background:#fff; color:var(--deep); border:1.5px solid var(--line); border-radius:12px; padding:11px 14px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
.wt-btn-ghost { background:none; border:none; color:var(--muted); font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
.wt-btn-danger { color:var(--danger); }

.wt-presets-row { display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 4px; }
.wt-chip { display:flex; align-items:center; gap:6px; background:#fff; border:1.5px solid var(--line); border-radius:999px; padding:8px 13px; font-size:13.5px; font-weight:600; color:var(--ink); cursor:pointer; font-family:inherit; }
.wt-chip-oz { color:var(--teal); font-weight:700; }
.wt-chip-ghost { color:var(--muted); border-style:dashed; }

.wt-section-label { font-family:'Space Grotesk',sans-serif; font-size:12.5px; font-weight:600; letter-spacing:.02em; color:var(--muted); text-transform:uppercase; margin:22px 0 8px; }
.wt-empty-note { font-size:13.5px; color:var(--muted); background:#fff; border:1px dashed var(--line); border-radius:12px; padding:14px; text-align:center; }

.wt-log-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
.wt-log-row { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--line); border-radius:10px; padding:9px 10px; font-size:13.5px; }
.wt-log-icon { color:var(--muted); flex-shrink:0; }
.wt-log-time { color:var(--muted); width:64px; flex-shrink:0; }
.wt-log-label { flex:1; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.wt-log-oz { color:var(--teal); font-weight:700; margin-right:4px; }
.wt-icon-btn { background:none; border:none; color:var(--muted); padding:4px; display:flex; cursor:pointer; }
.wt-icon-btn:hover { color:var(--danger); }

.wt-backdrop { position:fixed; inset:0; background:rgba(14,42,46,.45); display:flex; align-items:flex-end; justify-content:center; z-index:50; }
.wt-backdrop.wt-center { align-items:center; padding:20px; }
.wt-sheet { width:100%; max-width:420px; background:var(--paper); border-radius:20px 20px 0 0; padding:18px 18px 26px; }
.wt-modal { width:100%; max-width:360px; background:var(--paper); border-radius:16px; padding:18px; }
.wt-sheet-header, .wt-modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.wt-sheet-header h3, .wt-modal-header h3 { font-family:'Space Grotesk',sans-serif; font-size:16px; margin:0; }

.wt-oz-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
.wt-oz-chip { background:#fff; border:1.5px solid var(--line); border-radius:10px; padding:12px 0; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
.wt-oz-chip.active { background:var(--deep); color:#fff; border-color:var(--deep); }

.wt-field { display:block; font-size:12.5px; color:var(--muted); font-weight:600; margin-bottom:14px; }
.wt-field input, .wt-field select { display:block; width:100%; margin-top:6px; padding:11px 12px; border:1.5px solid var(--line); border-radius:10px; font-size:15px; font-family:inherit; background:#fff; color:var(--ink); }
.wt-field-row { display:flex; gap:10px; }
.wt-field-row .wt-field { flex:1; }

.wt-toast { position:fixed; left:50%; bottom:88px; transform:translateX(-50%); background:var(--ink); color:#fff; padding:10px 16px; border-radius:999px; font-size:13.5px; display:flex; align-items:center; gap:12px; z-index:60; box-shadow:0 6px 18px rgba(0,0,0,.18); max-width:90%; }
.wt-toast button { background:none; border:none; color:var(--teal-light); font-weight:700; cursor:pointer; font-family:inherit; flex-shrink:0; }

.wt-banner { position:fixed; top:14px; left:50%; transform:translateX(-50%); background:var(--citrus); color:var(--ink); padding:11px 18px; border-radius:12px; font-size:13.5px; font-weight:600; z-index:60; box-shadow:0 6px 18px rgba(0,0,0,.15); }

.wt-nav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:min(420px,100%); background:#fff; border-top:1px solid var(--line); display:flex; padding:8px 6px calc(8px + env(safe-area-inset-bottom,0px)); z-index:40; }
.wt-nav-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; color:var(--muted); font-size:11px; font-weight:600; padding:6px 0; cursor:pointer; font-family:inherit; border-radius:10px; }
.wt-nav-btn.active { color:var(--deep); background:var(--mist); }

.wt-segment { display:flex; background:#fff; border:1.5px solid var(--line); border-radius:11px; padding:3px; margin-bottom:14px; }
.wt-segment button { flex:1; background:none; border:none; padding:8px 0; font-size:13.5px; font-weight:600; color:var(--muted); border-radius:8px; cursor:pointer; font-family:inherit; }
.wt-segment button.active { background:var(--deep); color:#fff; }

.wt-range-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.wt-range-nav button { background:#fff; border:1.5px solid var(--line); border-radius:8px; padding:6px; display:flex; cursor:pointer; color:var(--deep); }
.wt-range-nav button:disabled { opacity:.35; cursor:not-allowed; }
.wt-range-label { font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600; }

.wt-stat-row { display:flex; gap:8px; margin-bottom:16px; }
.wt-stat { flex:1; background:#fff; border:1px solid var(--line); border-radius:12px; padding:10px; text-align:center; }
.wt-stat-value { font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:700; }
.wt-stat-label { font-size:10.5px; color:var(--muted); margin-top:2px; }

.wt-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px; margin-bottom:16px; }
.wt-card-title { display:flex; align-items:center; gap:7px; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:14.5px; margin-bottom:4px; }
.wt-card-note { font-size:12.5px; color:var(--muted); margin-bottom:12px; line-height:1.5; }
.wt-toggle-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.wt-switch { width:42px; height:24px; border-radius:999px; background:var(--line); position:relative; border:none; cursor:pointer; flex-shrink:0; }
.wt-switch.on { background:var(--teal); }
.wt-switch span { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:transform .2s ease; }
.wt-switch.on span { transform:translateX(18px); }

.wt-preset-row { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--line); border-radius:10px; padding:10px 11px; margin-bottom:8px; }
.wt-preset-name { flex:1; font-weight:600; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.wt-preset-oz { color:var(--teal); font-weight:700; font-size:13.5px; margin-right:2px; }

.wt-loading { padding:60px 20px; text-align:center; color:var(--muted); font-family:inherit; }
`;

/* ---------------------------------------------------------------------- */
/* Small reusable pieces                                                  */
/* ---------------------------------------------------------------------- */

function VesselGraphic({ consumedOz, goalOz }) {
  const pct = Math.max(0, Math.min(100, (consumedOz / Math.max(1, goalOz)) * 100));
  const over = consumedOz > goalOz && goalOz > 0;
  const ticks = [1, 0.75, 0.5, 0.25].map((f) => Math.round(goalOz * f));

  return (
    <div className="wt-vessel-row">
      <div className="wt-vessel">
        <div className="wt-vessel-fill" style={{ height: `${pct}%` }}>
          <svg className="wt-wave" viewBox="0 0 400 20" preserveAspectRatio="none">
            <path d="M0,10 C25,0 75,20 100,10 C125,0 175,20 200,10 C225,0 275,20 300,10 C325,0 375,20 400,10 L400,20 L0,20 Z" />
          </svg>
        </div>
        {over && <div className="wt-overflow">+{consumedOz - goalOz}oz</div>}
      </div>
      <div className="wt-ticks">
        {ticks.map((oz, i) => <span key={i}>{oz}oz</span>)}
      </div>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className="wt-toast">
      <span>{toast.message}</span>
      {toast.undo && (
        <button onClick={() => { toast.undo(); onDismiss(); }}>Undo</button>
      )}
    </div>
  );
}

function ConfirmModal({ open, title, message, danger, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="wt-backdrop wt-center" onClick={onCancel}>
      <div className="wt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wt-modal-header"><h3>{title}</h3></div>
        <p style={{ fontSize: 13.5, color: COLORS.muted, marginTop: 0, marginBottom: 18 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="wt-btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button
            className="wt-btn-primary"
            style={{ flex: 1, background: danger ? COLORS.danger : COLORS.deep }}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function LogSheet({ open, onClose, onSubmit }) {
  const [selected, setSelected] = useState(16);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (open) { setSelected(16); setCustom(''); }
  }, [open]);

  if (!open) return null;

  const amount = custom !== '' ? Number(custom) : selected;
  const valid = amount > 0 && amount <= 200;

  return (
    <div className="wt-backdrop" onClick={onClose}>
      <div className="wt-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="wt-sheet-header">
          <h3>Log water</h3>
          <button className="wt-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="wt-oz-grid">
          {QUICK_OZ.map((oz) => (
            <button
              key={oz}
              className={`wt-oz-chip ${custom === '' && selected === oz ? 'active' : ''}`}
              onClick={() => { setSelected(oz); setCustom(''); }}
            >
              {oz}oz
            </button>
          ))}
        </div>
        <label className="wt-field">
          Custom amount (oz)
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 10"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </label>
        <button
          className="wt-btn-primary"
          disabled={!valid}
          onClick={() => onSubmit(amount)}
        >
          <Droplet size={16} /> Log {valid ? amount : '--'} oz
        </button>
      </div>
    </div>
  );
}

function PresetModal({ open, initial, onClose, onSave }) {
  const [name, setName] = useState('');
  const [oz, setOz] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial ? initial.name : '');
      setOz(initial ? String(initial.oz) : '');
    }
  }, [open, initial]);

  if (!open) return null;
  const valid = name.trim().length > 0 && Number(oz) > 0;

  return (
    <div className="wt-backdrop wt-center" onClick={onClose}>
      <div className="wt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wt-modal-header">
          <h3>{initial ? 'Edit preset' : 'Add preset'}</h3>
          <button className="wt-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <label className="wt-field">
          Name
          <input type="text" placeholder="e.g. Gatorade Zero" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="wt-field">
          Amount of H2O (oz)
          <input type="number" inputMode="numeric" placeholder="e.g. 12" value={oz} onChange={(e) => setOz(e.target.value)} />
        </label>
        <button
          className="wt-btn-primary"
          disabled={!valid}
          onClick={() => onSave({ name: name.trim(), oz: Number(oz) })}
        >
          Save preset
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Tabs                                                                    */
/* ---------------------------------------------------------------------- */

function LogTab({ data, todayKey, onLogWater, onQuickLog, onDeleteLog, onOpenSheet, onGoToSettings }) {
  const todayEntries = data.logs[todayKey] || [];
  const consumedOz = todayEntries.reduce((s, e) => s + Number(e.oz), 0);
  const goalOz = data.settings.goalOz || 0;
  const remaining = goalOz - consumedOz;

  return (
    <div>
      <VesselGraphic consumedOz={consumedOz} goalOz={goalOz} />
      <div className="wt-today-number">{consumedOz}<span className="unit">oz</span></div>
      <div className="wt-today-sub">
        {goalOz <= 0
          ? 'Set a daily goal in Settings to track progress.'
          : remaining > 0
            ? `${remaining}oz to reach your ${goalOz}oz goal`
            : `Goal reached — ${consumedOz - goalOz}oz over ${goalOz}oz 🎉`}
      </div>

      <button className="wt-btn-primary" onClick={onOpenSheet}>
        <Droplet size={16} /> Log water
      </button>

      <div className="wt-presets-row">
        {data.settings.presets.map((p) => (
          <button key={p.id} className="wt-chip" onClick={() => onQuickLog(p)}>
            {p.name} <span className="wt-chip-oz">+{p.oz}oz</span>
          </button>
        ))}
        <button className="wt-chip wt-chip-ghost" onClick={onGoToSettings}>
          <Plus size={13} /> Add preset
        </button>
      </div>

      <div className="wt-section-label">Today's log</div>
      {todayEntries.length === 0 ? (
        <p className="wt-empty-note">Nothing logged yet today — tap "Log water" to start.</p>
      ) : (
        <ul className="wt-log-list">
          {todayEntries.slice().reverse().map((entry) => (
            <li key={entry.id} className="wt-log-row">
              <Clock size={13} className="wt-log-icon" />
              <span className="wt-log-time">{entry.time}</span>
              <span className="wt-log-label">{entry.label}</span>
              <span className="wt-log-oz">{entry.oz}oz</span>
              <button className="wt-icon-btn" onClick={() => onDeleteLog(entry.id)} aria-label="Delete entry">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReportsTab({ data }) {
  const [mode, setMode] = useState('week');
  const [refDate, setRefDate] = useState(new Date());

  const { series, rangeLabel, totalOz, avg, metCount, daysCounted, isCurrent } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let dates = [];
    let rangeLabel = '';
    let isCurrent = false;

    if (mode === 'week') {
      const start = startOfWeek(refDate);
      dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      rangeLabel = `${fmtShortDate(dates[0])} – ${fmtShortDate(dates[6])}`;
      isCurrent = startOfWeek(refDate).getTime() === startOfWeek(today).getTime();
    } else {
      const start = startOfMonth(refDate);
      const n = daysInMonth(refDate);
      dates = Array.from({ length: n }, (_, i) => addDays(start, i));
      rangeLabel = fmtMonthYear(refDate);
      isCurrent = refDate.getFullYear() === today.getFullYear() && refDate.getMonth() === today.getMonth();
    }

    const series = dates.map((d) => {
      const key = dateKey(d);
      const oz = (data.logs[key] || []).reduce((s, e) => s + Number(e.oz), 0);
      return {
        label: mode === 'week' ? WEEKDAY_LABELS[(d.getDay() + 6) % 7] : String(d.getDate()),
        oz,
        isFuture: d.getTime() > today.getTime(),
      };
    });

    const counted = series.filter((s) => !s.isFuture);
    const totalOz = counted.reduce((s, x) => s + x.oz, 0);
    const avg = counted.length ? Math.round(totalOz / counted.length) : 0;
    const goalOz = data.settings.goalOz || 0;
    const metCount = goalOz > 0 ? counted.filter((x) => x.oz >= goalOz).length : 0;

    return { series, rangeLabel, totalOz, avg, metCount, daysCounted: counted.length, isCurrent };
  }, [data, mode, refDate]);

  const goalOz = data.settings.goalOz || 0;
  const step = mode === 'week' ? 7 : null;

  function goPrev() {
    if (mode === 'week') setRefDate((d) => addDays(d, -7));
    else setRefDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function goNext() {
    if (mode === 'week') setRefDate((d) => addDays(d, 7));
    else setRefDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  return (
    <div>
      <div className="wt-segment">
        <button className={mode === 'week' ? 'active' : ''} onClick={() => { setMode('week'); setRefDate(new Date()); }}>Week</button>
        <button className={mode === 'month' ? 'active' : ''} onClick={() => { setMode('month'); setRefDate(new Date()); }}>Month</button>
      </div>

      <div className="wt-range-nav">
        <button onClick={goPrev} aria-label="Previous"><ChevronLeft size={16} /></button>
        <span className="wt-range-label">{rangeLabel}</span>
        <button onClick={goNext} disabled={isCurrent} aria-label="Next"><ChevronRight size={16} /></button>
      </div>

      <div className="wt-stat-row">
        <div className="wt-stat">
          <div className="wt-stat-value">{totalOz}</div>
          <div className="wt-stat-label">Total oz</div>
        </div>
        <div className="wt-stat">
          <div className="wt-stat-value">{avg}</div>
          <div className="wt-stat-label">Avg oz/day</div>
        </div>
        <div className="wt-stat">
          <div className="wt-stat-value">{metCount}/{daysCounted}</div>
          <div className="wt-stat-label">Goal met</div>
        </div>
      </div>

      <div className="wt-card" style={{ paddingBottom: 4 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={COLORS.line} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: COLORS.muted }}
              interval={mode === 'month' ? Math.ceil(series.length / 6) : 0}
              axisLine={{ stroke: COLORS.line }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10, fill: COLORS.muted }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [`${value} oz`, 'Consumed']} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.line}` }} />
            {goalOz > 0 && (
              <ReferenceLine y={goalOz} stroke={COLORS.citrus} strokeDasharray="4 4" label={{ value: 'Goal', position: 'right', fontSize: 10, fill: COLORS.muted }} />
            )}
            <Bar dataKey="oz" radius={[4, 4, 0, 0]}>
              {series.map((entry, i) => (
                <Cell key={i} fill={goalOz > 0 && entry.oz >= goalOz ? COLORS.citrus : COLORS.teal} opacity={entry.isFuture ? 0.25 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RemindersTab({
  data, notifPermission, onEnableInApp, onDisableInApp, onChangeInAppInterval, onTestReminder,
  onChangeCalendarField, onDownloadICS, onTogglePush, onTestPush, pushBusy, pushError,
}) {
  const inApp = data.settings.reminders.inApp;
  const cal = data.settings.reminders.calendar;
  const push = data.settings.reminders.push;
  const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <div>
      <div className="wt-card">
        <div className="wt-card-title"><Clock size={15} /> Reminder schedule</div>
        <p className="wt-card-note">Used by both push notifications and the calendar backup below.</p>
        <div className="wt-field-row">
          <label className="wt-field">
            Start time
            <input type="time" value={cal.startTime} onChange={(e) => onChangeCalendarField('startTime', e.target.value)} />
          </label>
          <label className="wt-field">
            End time
            <input type="time" value={cal.endTime} onChange={(e) => onChangeCalendarField('endTime', e.target.value)} />
          </label>
        </div>
        <label className="wt-field">
          Every
          <select value={cal.intervalHours} onChange={(e) => onChangeCalendarField('intervalHours', Number(e.target.value))}>
            <option value={1}>1 hour</option>
            <option value={1.5}>1.5 hours</option>
            <option value={2}>2 hours</option>
            <option value={3}>3 hours</option>
            <option value={4}>4 hours</option>
          </select>
        </label>
      </div>

      <div className="wt-card">
        <div className="wt-card-title"><Bell size={15} /> Push notifications (recommended)</div>
        <p className="wt-card-note">
          Real notifications from your own server, on the schedule above — arrive even with this closed. Requires the push server (see README) to be deployed and <code>config.js</code> pointed at it.
        </p>
        {!pushSupported ? (
          <p className="wt-empty-note">Push isn't supported in this browser/context. On iPhone, add this app to your home screen first (Share → Add to Home Screen), then open it from there.</p>
        ) : (
          <>
            <div className="wt-toggle-row">
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{push.subscribed ? 'Enabled on this device' : 'Enabled'}</span>
              <button
                className={`wt-switch ${push.subscribed ? 'on' : ''}`}
                onClick={onTogglePush}
                disabled={pushBusy}
                aria-label="Toggle push notifications"
              >
                <span />
              </button>
            </div>
            {push.subscribed && (
              <button className="wt-btn-secondary" style={{ width: '100%' }} onClick={onTestPush} disabled={pushBusy}>
                Send test push
              </button>
            )}
            {pushError && <p style={{ fontSize: 11.5, color: COLORS.danger, marginTop: 10, marginBottom: 0 }}>{pushError}</p>}
          </>
        )}
      </div>

      <div className="wt-card">
        <div className="wt-card-title"><Download size={15} /> Calendar backup (.ics)</div>
        <p className="wt-card-note">
          No server required. Generates a file with recurring reminders on the schedule above — import it into your phone's Calendar app once for a zero-maintenance fallback.
        </p>
        <button className="wt-btn-primary" onClick={onDownloadICS}>
          <Download size={16} /> Download calendar reminders
        </button>
        <p style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
          iPhone: open the file and tap "Add All" in Calendar. Android: open it with the Google Calendar app. These use your device's local time, so re-download if you change timezones for a trip.
        </p>
      </div>

      <div className="wt-card">
        <div className="wt-card-title"><Bell size={15} /> In-app nudge (bonus)</div>
        <p className="wt-card-note">
          A shorter-interval nudge while this tab is open and the screen is on — separate from the schedule above. Goes quiet the moment you lock your phone or switch apps.
        </p>
        <div className="wt-toggle-row">
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Enabled</span>
          <button
            className={`wt-switch ${inApp.enabled ? 'on' : ''}`}
            onClick={() => (inApp.enabled ? onDisableInApp() : onEnableInApp(inApp.intervalMin))}
            aria-label="Toggle in-app reminder"
          >
            <span />
          </button>
        </div>
        <label className="wt-field">
          Remind me every
          <select value={inApp.intervalMin} onChange={(e) => onChangeInAppInterval(Number(e.target.value))}>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </label>
        <button className="wt-btn-secondary" style={{ width: '100%' }} onClick={onTestReminder}>Send test reminder</button>
        <p style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 10, marginBottom: 0 }}>
          Browser notifications: {notifPermission === 'granted' ? 'allowed on this device' : notifPermission === 'denied' ? "blocked — you'll still see the in-app banner" : 'not yet requested'}
        </p>
      </div>
    </div>
  );
}

function SettingsTab({ data, onUpdateGoal, onAddPreset, onEditPreset, onDeletePreset, onExportCSV, onResetAll }) {
  const [goalInput, setGoalInput] = useState(String(data.settings.goalOz || ''));
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { setGoalInput(String(data.settings.goalOz || '')); }, [data.settings.goalOz]);

  return (
    <div>
      <div className="wt-section-label">Daily goal</div>
      <div className="wt-card">
        <label className="wt-field">
          Ounces per day
          <input
            type="number"
            inputMode="numeric"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onBlur={() => { const n = Number(goalInput); if (n > 0) onUpdateGoal(n); else setGoalInput(String(data.settings.goalOz)); }}
          />
        </label>
        <p style={{ fontSize: 11.5, color: COLORS.muted, margin: 0 }}>A common starting point is 64oz (about eight 8oz glasses) — adjust to whatever your own target is.</p>
      </div>

      <div className="wt-section-label">Preset drinks</div>
      {data.settings.presets.length === 0 && (
        <p className="wt-empty-note" style={{ marginBottom: 10 }}>No presets yet. Add a drink like "Gatorade Zero" with its water content to log it in one tap.</p>
      )}
      {data.settings.presets.map((p) => (
        <div key={p.id} className="wt-preset-row">
          <span className="wt-preset-name">{p.name}</span>
          <span className="wt-preset-oz">{p.oz}oz H2O</span>
          <button className="wt-icon-btn" onClick={() => { setEditingPreset(p); setPresetModalOpen(true); }} aria-label="Edit preset"><Pencil size={14} /></button>
          <button className="wt-icon-btn" onClick={() => onDeletePreset(p.id)} aria-label="Delete preset"><Trash2 size={14} /></button>
        </div>
      ))}
      <button className="wt-btn-secondary" style={{ width: '100%', marginTop: 4 }} onClick={() => { setEditingPreset(null); setPresetModalOpen(true); }}>
        <Plus size={15} /> Add preset
      </button>

      <div className="wt-section-label">Data</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="wt-btn-secondary" style={{ flex: 1 }} onClick={onExportCSV}>Export CSV</button>
        <button className="wt-btn-secondary wt-btn-danger" style={{ flex: 1 }} onClick={() => setConfirmReset(true)}>Reset all data</button>
      </div>

      <PresetModal
        open={presetModalOpen}
        initial={editingPreset}
        onClose={() => setPresetModalOpen(false)}
        onSave={(vals) => {
          if (editingPreset) onEditPreset(editingPreset.id, vals.name, vals.oz);
          else onAddPreset(vals.name, vals.oz);
          setPresetModalOpen(false);
        }}
      />
      <ConfirmModal
        open={confirmReset}
        title="Reset all data?"
        message="This clears every logged day, your goal, and your presets. This can't be undone."
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { onResetAll(); setConfirmReset(false); }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* App                                                                     */
/* ---------------------------------------------------------------------- */

export default function WaterTrackerApp() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('log');
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState(null);

  const toastTimer = useRef(null);
  const bannerTimer = useRef(null);
  const reminderIntervalRef = useRef(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    loadData().then((d) => { setData(d); loadedOnce.current = true; });
    registerServiceWorker().catch(() => {});
  }, []);

  useEffect(() => {
    if (data && loadedOnce.current) saveData(data);
  }, [data]);

  function showToast(message, undo) {
    clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function fireReminder() {
    clearTimeout(bannerTimer.current);
    setBanner('💧 Time to drink some water');
    bannerTimer.current = setTimeout(() => setBanner(null), 8000);
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('💧 Time to drink water', { body: 'Log your next glass in the tracker.' });
      }
    } catch (e) {
      /* notifications unsupported in this context — in-app banner already covers it */
    }
  }

  function armInAppReminder(intervalMin) {
    clearInterval(reminderIntervalRef.current);
    reminderIntervalRef.current = setInterval(fireReminder, intervalMin * 60 * 1000);
  }

  useEffect(() => {
    if (data && data.settings.reminders.inApp.enabled) {
      armInAppReminder(data.settings.reminders.inApp.intervalMin);
    }
    return () => clearInterval(reminderIntervalRef.current);
  }, [data && data.settings.reminders.inApp.enabled]);

  async function handleEnableInApp(intervalMin) {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
      }
    } catch (e) { /* ignore */ }
    setData((prev) => ({ ...prev, settings: { ...prev.settings, reminders: { ...prev.settings.reminders, inApp: { ...prev.settings.reminders.inApp, enabled: true, intervalMin } } } }));
    armInAppReminder(intervalMin);
    showToast('In-app reminders on — keep this tab open to get nudged.');
  }
  function handleDisableInApp() {
    clearInterval(reminderIntervalRef.current);
    setData((prev) => ({ ...prev, settings: { ...prev.settings, reminders: { ...prev.settings.reminders, inApp: { ...prev.settings.reminders.inApp, enabled: false } } } }));
  }
  function handleChangeInAppInterval(intervalMin) {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, reminders: { ...prev.settings.reminders, inApp: { ...prev.settings.reminders.inApp, intervalMin } } } }));
    if (data && data.settings.reminders.inApp.enabled) armInAppReminder(intervalMin);
  }
  function handleChangeCalendarField(field, value) {
    setData((prev) => {
      const next = { ...prev, settings: { ...prev.settings, reminders: { ...prev.settings.reminders, calendar: { ...prev.settings.reminders.calendar, [field]: value } } } };
      if (next.settings.reminders.push.subscribed) {
        updatePushSchedule(next.settings.reminders.push.id, next.settings.reminders.calendar).catch(() => {});
      }
      return next;
    });
  }
  function handleDownloadICS() {
    const cfg = data.settings.reminders.calendar;
    const ics = buildICS(cfg.startTime, cfg.endTime, cfg.intervalHours);
    downloadTextFile('water-reminders.ics', 'text/calendar;charset=utf-8', ics);
    showToast('Calendar file downloaded — open it to add reminders.');
  }

  async function handleTogglePush() {
    setPushError(null);
    const push = data.settings.reminders.push;
    setPushBusy(true);
    try {
      if (push.subscribed) {
        await unsubscribeFromPush(push.id);
        setData((prev) => ({ ...prev, settings: { ...prev.settings, reminders: { ...prev.settings.reminders, push: { subscribed: false, id: null } } } }));
        showToast('Push notifications turned off.');
      } else {
        const id = await subscribeToPush(push.id, data.settings.reminders.calendar);
        setData((prev) => ({ ...prev, settings: { ...prev.settings, reminders: { ...prev.settings.reminders, push: { subscribed: true, id } } } }));
        showToast('Push notifications on for this device.');
      }
    } catch (e) {
      setPushError(e.message || 'Something went wrong with push notifications.');
    } finally {
      setPushBusy(false);
    }
  }

  async function handleTestPush() {
    setPushError(null);
    setPushBusy(true);
    try {
      await sendTestPush(data.settings.reminders.push.id);
      showToast('Test push sent — check your notifications.');
    } catch (e) {
      setPushError(e.message || 'Test push failed.');
    } finally {
      setPushBusy(false);
    }
  }

  function addLog(oz, label) {
    const key = dateKey(new Date());
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: fmtTime(new Date()), oz, label };
    setData((prev) => ({ ...prev, logs: { ...prev.logs, [key]: [...(prev.logs[key] || []), entry] } }));
    showToast(`Logged ${oz}oz · ${label}`, () => removeLog(key, entry.id));
  }
  function removeLog(key, id) {
    setData((prev) => ({ ...prev, logs: { ...prev.logs, [key]: (prev.logs[key] || []).filter((e) => e.id !== id) } }));
  }
  function handleLogWater(oz) {
    addLog(oz, 'Water');
    setShowLogSheet(false);
  }
  function handleQuickLog(preset) {
    addLog(preset.oz, preset.name);
  }
  function handleDeleteLog(id) {
    const key = dateKey(new Date());
    removeLog(key, id);
  }

  function handleUpdateGoal(goalOz) {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, goalOz } }));
  }
  function handleAddPreset(name, oz) {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, presets: [...prev.settings.presets, { id: `${Date.now()}`, name, oz }] } }));
  }
  function handleEditPreset(id, name, oz) {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, presets: prev.settings.presets.map((p) => (p.id === id ? { ...p, name, oz } : p)) } }));
  }
  function handleDeletePreset(id) {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, presets: prev.settings.presets.filter((p) => p.id !== id) } }));
  }
  function handleExportCSV() {
    const csv = buildCSV(data.logs);
    downloadTextFile('water-log-export.csv', 'text/csv;charset=utf-8', csv);
    showToast('CSV exported.');
  }
  function handleResetAll() {
    if (data.settings.reminders.push.subscribed) {
      unsubscribeFromPush(data.settings.reminders.push.id).catch(() => {});
    }
    setData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
    clearInterval(reminderIntervalRef.current);
  }

  if (!data) {
    return <div className="wt-root"><style>{STYLES}</style><div className="wt-loading">Loading your tracker…</div></div>;
  }

  const todayKey = dateKey(new Date());

  let streak = 0;
  {
    let d = addDays(new Date(), -1); d.setHours(0, 0, 0, 0);
    const goalOz = data.settings.goalOz || 0;
    while (goalOz > 0) {
      const key = dateKey(d);
      const total = (data.logs[key] || []).reduce((s, e) => s + Number(e.oz), 0);
      if (total >= goalOz) { streak++; d = addDays(d, -1); } else break;
    }
  }

  return (
    <div className="wt-root">
      <style>{STYLES}</style>
      <div className="wt-frame">
        <div className="wt-header">
          <div className="wt-brand"><Droplet size={19} /> Water</div>
          {streak > 0 ? <span className="wt-streak">🔥 {streak}-day streak</span> : <span className="wt-date">{fmtHeaderDate(new Date())}</span>}
        </div>

        {activeTab === 'log' && (
          <LogTab
            data={data}
            todayKey={todayKey}
            onOpenSheet={() => setShowLogSheet(true)}
            onQuickLog={handleQuickLog}
            onDeleteLog={handleDeleteLog}
            onGoToSettings={() => setActiveTab('settings')}
          />
        )}
        {activeTab === 'reports' && <ReportsTab data={data} />}
        {activeTab === 'reminders' && (
          <RemindersTab
            data={data}
            notifPermission={notifPermission}
            onEnableInApp={handleEnableInApp}
            onDisableInApp={handleDisableInApp}
            onChangeInAppInterval={handleChangeInAppInterval}
            onTestReminder={fireReminder}
            onChangeCalendarField={handleChangeCalendarField}
            onDownloadICS={handleDownloadICS}
            onTogglePush={handleTogglePush}
            onTestPush={handleTestPush}
            pushBusy={pushBusy}
            pushError={pushError}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            data={data}
            onUpdateGoal={handleUpdateGoal}
            onAddPreset={handleAddPreset}
            onEditPreset={handleEditPreset}
            onDeletePreset={handleDeletePreset}
            onExportCSV={handleExportCSV}
            onResetAll={handleResetAll}
          />
        )}
      </div>

      <LogSheet open={showLogSheet} onClose={() => setShowLogSheet(false)} onSubmit={handleLogWater} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      {banner && <div className="wt-banner">{banner}</div>}

      <nav className="wt-nav">
        <button className={`wt-nav-btn ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>
          <Droplet size={18} /> Log
        </button>
        <button className={`wt-nav-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <BarChart3 size={18} /> Reports
        </button>
        <button className={`wt-nav-btn ${activeTab === 'reminders' ? 'active' : ''}`} onClick={() => setActiveTab('reminders')}>
          <Bell size={18} /> Remind
        </button>
        <button className={`wt-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <SettingsIcon size={18} /> Settings
        </button>
      </nav>
    </div>
  );
}
