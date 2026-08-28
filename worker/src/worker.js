import { buildPushHTTPRequest } from '@pushforge/builder';
const __name = (target, value) => Object.defineProperty(target, "name", { value, configurable: true });

// src/worker.js
function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateToken, "generateToken");
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var LOGIN_TOKEN_TTL_MIN = 15;
async function createLoginToken(db, email) {
  const token = generateToken();
  const now = /* @__PURE__ */ new Date();
  const expires = new Date(now.getTime() + LOGIN_TOKEN_TTL_MIN * 6e4);
  await db.prepare(
    "INSERT INTO login_tokens (token, email, created_at, expires_at, used_at) VALUES (?, ?, ?, ?, NULL)"
  ).bind(token, email.toLowerCase().trim(), now.toISOString(), expires.toISOString()).run();
  return token;
}
__name(createLoginToken, "createLoginToken");
async function verifyLoginToken(db, token) {
  const row = await db.prepare("SELECT * FROM login_tokens WHERE token = ?").bind(token).first();
  if (!row)
    return { error: "invalid" };
  if (row.used_at)
    return { error: "used" };
  if (new Date(row.expires_at).getTime() < Date.now())
    return { error: "expired" };
  await db.prepare("UPDATE login_tokens SET used_at = ? WHERE token = ?").bind((/* @__PURE__ */ new Date()).toISOString(), token).run();
  let user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(row.email).first();
  if (!user) {
    const userId = crypto.randomUUID();
    await db.prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)").bind(userId, row.email, (/* @__PURE__ */ new Date()).toISOString()).run();
    user = { id: userId, email: row.email };
  }
  const sessionToken = generateToken();
  await db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)").bind(sessionToken, user.id, (/* @__PURE__ */ new Date()).toISOString()).run();
  return { sessionToken, email: user.email, userId: user.id };
}
__name(verifyLoginToken, "verifyLoginToken");
async function verifySession(db, sessionToken) {
  if (!sessionToken)
    return null;
  const row = await db.prepare(
    "SELECT sessions.user_id as userId, users.email as email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?"
  ).bind(sessionToken).first();
  return row || null;
}
__name(verifySession, "verifySession");
async function sendLoginEmail(env, email, token) {
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured - login email not sent (token still created).");
    return { sent: false, reason: "not_configured" };
  }
  const loginUrl = `https://hydroprotracker.com/app/?login=${token}`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || "HydroPro Tracker <login@hydroprotracker.com>",
        to: email,
        subject: "Your HydroPro Tracker sign-in link",
        html: `<p>Tap the link below to sign in. It works for ${LOGIN_TOKEN_TTL_MIN} minutes.</p><p><a href="${loginUrl}">Sign in to HydroPro Tracker</a></p><p>If you didn't request this, you can ignore this email.</p>`
      })
    });
    return { sent: res.ok, status: res.status };
  } catch (e) {
    console.error("Resend request failed:", e.message);
    return { sent: false, reason: "network_error" };
  }
}
__name(sendLoginEmail, "sendLoginEmail");
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
__name(json, "json");

// ── Smart Entry (PROD-10/11/12) ──────────────────────────────────────────────
var SMART_ENTRY_MODEL = "claude-haiku-4-5-20251001";
var SMART_ENTRY_DAILY_CAP = 25;
var SMART_ENTRY_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
// Bump this every time buildInterpretSystemPrompt's text changes — it's folded into the cache
// key below, so a bump invalidates every previously-cached interpretation in one move (old
// interp:v<N>: keys are simply never read again and expire naturally via their own TTL). Without
// this, a prompt fix is invisible to anyone who already triggered that phrase — they'd stay
// frozen on the old interpretation for up to 30 days.
var SMART_ENTRY_PROMPT_VERSION = 3;

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");

function normalizeInterpretText(text) {
  return String(text || "").toLowerCase().trim().replace(/\s+/g, " ");
}
__name(normalizeInterpretText, "normalizeInterpretText");

function enabledTrackerNames(trackers) {
  return Object.entries(trackers || {})
    .filter(([, t]) => t && t.on)
    .map(([name]) => name)
    .sort();
}
__name(enabledTrackerNames, "enabledTrackerNames");

async function interpretCacheKey(text, trackers) {
  const hash = await sha256Hex(`${normalizeInterpretText(text)}|${enabledTrackerNames(trackers).join(",")}`);
  return `interp:v${SMART_ENTRY_PROMPT_VERSION}:${hash}`;
}
__name(interpretCacheKey, "interpretCacheKey");

function buildInterpretSystemPrompt(trackers, userItems) {
  const enabled = Object.entries(trackers || {}).filter(([, t]) => t && t.on);
  const trackerLines = enabled.length
    ? enabled.map(([name, t]) => `- ${name} (unit: ${t.unit || "n/a"})`).join("\n")
    : "(none enabled — do not propose any entries)";
  const itemLines = (arr) => Array.isArray(arr) && arr.length
    ? arr.map((i) => `- "${i.name}" (id: ${i.id})`).join("\n")
    : "(none configured)";
  const items = userItems || {};
  return `You convert a user's plain-language description of what they consumed or did into structured entries for the HydroPro Tracker app. You estimate and capture data — you are never a health advisor, and you never comment on whether anything is healthy, appropriate, or advisable.

OUTPUT FORMAT — critical, follow exactly:
Respond with STRICT JSON ONLY. No prose before or after it, no markdown code fences.
{
  "entries": [{"tracker": string, "value": number, "unit": string, "source": string, "confidence": "high"|"medium"|"low"}],
  "unmatched": [string],
  "candidates": [{"tracker": "treatment"|"rx"|"supplement", "heard": string (short fragment only, not the full sentence), "options": [{"id": string, "name": string}]}],
  "declined": string | null
}

THREE INTERPRETATION CLASSES — apply the right one per phrase:
1. Consumable / time-based trackers (water, protein, calories, sleep, exercise): interpret and estimate a reasonable value for any NAMED food, drink, or activity. A single food or drink can and should produce MULTIPLE entries — one per applicable enabled tracker, never just one entry per item. For example, a grilled cheese sandwich (with calories and protein both enabled) should produce a "calories" entry AND a separate "protein" entry, each with "source" set to the same phrase ("grilled cheese sandwich"). Every entry you produce MUST carry a "source" field — the exact phrase from the user's text that produced it. Never output a value with no source phrase behind it.

   ESTIMATES ARE APPROXIMATE, NOT PRECISE — a typical-serving-size guess is exactly what's wanted, not a certified figure. The user reviews and can edit every value on a confirm screen before anything is saved, so an approximate estimate is always more useful than no entry.

   CONFIDENCE RUBRIC — set "confidence" using this scale:
   - "high": a single named item with a standard, well-known portion (e.g. "a banana", "a can of soda", "a diet coke").
   - "medium": a composed dish with a variable recipe (e.g. "a grilled cheese sandwich", "a burrito", "a salad").
   - "low": a named food or drink whose portion is heavily variable or unstated beyond the name itself (e.g. "some chips", "a bowl of pasta", "a beer" with no size given).

   UNMATCHED BOUNDARY — the rule is "approximate a typical serving of a NAMED food, drink, or activity," not "approximate anything food-shaped." "Grilled cheese", "a banana", and "some chips" all name a specific item — estimate them (at the confidence level above) even without a brand, recipe, or exact portion. "I had lunch," "I ate something," and "I worked out" name nothing specific — there is no estimable content, so these belong in "unmatched," never a guessed value. Test: can you point to the word(s) naming what was actually consumed or done? If yes, estimate it. If no, it's unmatched.
2. Treatments, RX (prescriptions), and Supplements: match ONLY against the user's own configured items listed below — never against general drug or treatment knowledge you may otherwise have. If the match is anything below high confidence, put it under "candidates" (never "entries"). Never guess at an inventory-affecting item — when unsure, it belongs in "candidates," not a forced pick in "entries."

   CANDIDATE FIELDS — both are commonly gotten wrong, follow exactly:
   - "tracker" is the tracker TYPE — exactly one of "treatment", "rx", or "supplement" — NEVER the matched item's name. A Metformin match has "tracker": "rx", not "tracker": "Metformin".
   - "heard" is ONLY the specific word or phrase fragment that needs disambiguating — NEVER the full sentence the user said. The confirm card renders it as literally the sentence 'You said "<heard>" — did you mean:', so it must read naturally in that sentence.
   - Worked example: user says "took my metfor this morning" and "Metformin" is a configured rx item → {"tracker": "rx", "heard": "metfor", "options": [{"id": "r1", "name": "Metformin"}]}. NOT {"tracker": "Metformin", "heard": "took my metfor this morning", ...}.
3. Measured readings (weight): capture the number exactly as the user stated it. Do not interpret, round, or estimate. If the user says "I weigh 181," the value is 181, verbatim.

ENABLED TRACKERS — only propose "entries" for these; ignore anything the user mentions that isn't in this list:
${trackerLines}

USER'S CONFIGURED TREATMENTS:
${itemLines(items.treatments)}

USER'S CONFIGURED PRESCRIPTIONS (RX):
${itemLines(items.rx)}

USER'S CONFIGURED SUPPLEMENTS:
${itemLines(items.supplements)}

ESTIMATION RULE, must stay visible to the user via "source":
Non-water beverages (coffee, soda, diet coke, tea, juice, etc.) DO count toward the water tracker. When a non-water beverage contributes a water entry, its "source" phrase must name the beverage (e.g. "diet coke") so the user can see on screen exactly what produced the ounces — never a bare number they can't trace back to what they said.

REFUSE — set "declined" to a short plain-language reason, and return empty arrays for "entries"/"unmatched"/"candidates", for:
- Health advice, or any opinion on whether something is healthy or advisable
- Dosing guidance for any medication or supplement
- Interpretation of what the user's logged data means for their health
- Anything that is not describing something to log (small talk, unrelated questions, etc.)

If some part of the text doesn't match any enabled tracker or configured item but the request is otherwise in scope, list the unrecognized phrase(s) in "unmatched" — do not decline just because part of the text didn't match.`;
}
__name(buildInterpretSystemPrompt, "buildInterpretSystemPrompt");

function extractJsonText(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}
__name(extractJsonText, "extractJsonText");

async function callAnthropicInterpret(env, systemPrompt, userText) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: SMART_ENTRY_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }]
    })
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock || !textBlock.text) throw new Error("No text content in Anthropic response");
  return JSON.parse(extractJsonText(textBlock.text));
}
__name(callAnthropicInterpret, "callAnthropicInterpret");

function normalizeInterpretResult(raw, trackers) {
  const enabledSet = new Set(enabledTrackerNames(trackers));
  const entries = Array.isArray(raw && raw.entries)
    ? raw.entries.filter((e) => e && typeof e.tracker === "string" && enabledSet.has(e.tracker) &&
        typeof e.value === "number" && Number.isFinite(e.value) &&
        typeof e.source === "string" && e.source.trim().length > 0)
    : [];
  const candidates = Array.isArray(raw && raw.candidates) ? raw.candidates : [];
  const unmatched = Array.isArray(raw && raw.unmatched) ? raw.unmatched : [];
  const declined = typeof (raw && raw.declined) === "string" ? raw.declined : null;
  return { entries, unmatched, candidates, declined };
}
__name(normalizeInterpretResult, "normalizeInterpretResult");

async function getSmartEntryUsage(env, deviceId, day) {
  if (!env.DB) return { calls: 0, cache_hits: 0 };
  try {
    const row = await env.DB.prepare(
      "SELECT calls, cache_hits FROM smart_entry_usage WHERE device_id = ? AND day = ?"
    ).bind(deviceId, day).first();
    return row || { calls: 0, cache_hits: 0 };
  } catch (e) {
    console.error("smart_entry_usage read failed:", e.message);
    return { calls: 0, cache_hits: 0 };
  }
}
__name(getSmartEntryUsage, "getSmartEntryUsage");

async function bumpSmartEntryUsage(env, deviceId, day, field) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      `INSERT INTO smart_entry_usage (device_id, day, calls, cache_hits) VALUES (?, ?, ?, ?)
       ON CONFLICT(device_id, day) DO UPDATE SET ${field} = ${field} + 1`
    ).bind(deviceId, day, field === "calls" ? 1 : 0, field === "cache_hits" ? 1 : 0).run();
  } catch (e) {
    console.error("smart_entry_usage write failed:", e.message);
  }
}
__name(bumpSmartEntryUsage, "bumpSmartEntryUsage");

function slotMinutes(startTime, endTime, intervalHours) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const step = Math.max(15, Math.round(Number(intervalHours) * 60));
  const slots = [];
  for (let t = start; t <= end; t += step)
    slots.push(t);
  return slots;
}
__name(slotMinutes, "slotMinutes");
function buildProgressMessage(progress, minutes) {
  const candidates = [];
  if (progress.goalOz > 0)
    candidates.push({ label: "water", short: "oz", got: progress.consumedOz || 0, goal: progress.goalOz, emoji: "\u{1F4A7}" });
  if (progress.goalProtein > 0)
    candidates.push({ label: "protein", short: "g", got: progress.consumedProtein || 0, goal: progress.goalProtein, emoji: "\u{1F4AA}" });
  if (progress.goalCalories > 0)
    candidates.push({ label: "calories", short: "cal", got: progress.consumedCalories || 0, goal: progress.goalCalories, emoji: "\u{1F525}" });
  if (candidates.length === 0)
    return null;
  const behind = candidates.filter((c) => c.got < c.goal);
  if (behind.length === 0)
    return "\u{1F389} All your goals are met today — nice work";
  behind.sort((a, b) => a.got / a.goal - b.got / b.goal);
  const worst = behind[0];
  const remaining = Math.round(worst.goal - worst.got);
  const pct = worst.got / worst.goal;
  const hour = Math.floor(minutes / 60);
  if (hour >= 19)
    return `${worst.emoji} ${remaining}${worst.short} of ${worst.label} to go — last stretch of the day`;
  if (pct >= 0.75)
    return `${worst.emoji} Almost there — just ${remaining}${worst.short} of ${worst.label} left`;
  return `${worst.emoji} ${remaining}${worst.short} of ${worst.label} to go`;
}
__name(buildProgressMessage, "buildProgressMessage");
var RECENTLY_LOGGED_WINDOW_MIN = 90;
function loggedRecently(progress, dateStr, minutes) {
  if (!progress || progress.date !== dateStr || typeof progress.lastLoggedMinutes !== "number")
    return false;
  return minutes - progress.lastLoggedMinutes < RECENTLY_LOGGED_WINDOW_MIN && minutes - progress.lastLoggedMinutes >= 0;
}
__name(loggedRecently, "loggedRecently");
function localTimeParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = fmt.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  let hour = Number(parts.hour);
  if (hour === 24)
    hour = 0;
  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hour * 60 + Number(parts.minute)
  };
}
__name(localTimeParts, "localTimeParts");
async function sendPush(env, record, payload) {
  const privateJWK = JSON.parse(env.VAPID_PRIVATE_KEY);
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK,
    subscription: record.subscription,
    message: {
      payload,
      adminContact: env.VAPID_CONTACT_EMAIL || "mailto:admin@example.com",
      options: { ttl: 3600, urgency: "high", topic: "water-reminder" }
    }
  });
  return fetch(endpoint, { method: "POST", headers, body });
}
__name(sendPush, "sendPush");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (url.pathname === "/api/vapid-public-key" && request.method === "GET") {
      return json({ publicKey: env.VAPID_PUBLIC_KEY });
    }
    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      const { id, subscription, schedule, bedtime, supplementReminder, treatmentReminder, timezone } = payload;
      if (!subscription || !subscription.endpoint) {
        return json({ error: "Missing subscription." }, 400);
      }
      const recordId = id || crypto.randomUUID();
      const key = `sub:${recordId}`;
      let existing = null;
      try {
        const raw = await env.WATER_KV.get(key);
        if (raw)
          existing = JSON.parse(raw);
      } catch (e) {
      }
      const record = {
        // Start from whatever already exists (progress data, lastSent* tracking fields,
        // etc) so this endpoint only ever overwrites the specific fields it's actually
        // meant to update. Previously this rebuilt the record from scratch every time,
        // which silently erased the separate /api/progress data (including the
        // treatments list below) the moment someone toggled any reminder setting.
        ...existing || {},
        subscription,
        schedule: schedule || { startTime: "08:00", endTime: "20:00", intervalHours: 2 },
        bedtime: bedtime || { enabled: false, time: "22:00" },
        supplementReminder: supplementReminder || { enabled: false, time: "10:00" },
        treatmentReminder: treatmentReminder || { enabled: false, time: "09:00" },
        timezone: timezone || "UTC",
        lastSentSlot: existing ? existing.lastSentSlot : null,
        lastSentBedtimeDate: existing ? existing.lastSentBedtimeDate : null,
        lastSentSupplementDate: existing ? existing.lastSentSupplementDate : null,
        lastSentTreatmentDate: existing ? existing.lastSentTreatmentDate : null,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await env.WATER_KV.put(key, JSON.stringify(record));
      return json({ id: recordId });
    }
    if (url.pathname === "/api/subscribe" && request.method === "DELETE") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      if (payload.id)
        await env.WATER_KV.delete(`sub:${payload.id}`);
      return json({ ok: true });
    }
    if (url.pathname === "/api/test-push" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      if (!payload.id)
        return json({ error: "Missing id." }, 400);
      const raw = await env.WATER_KV.get(`sub:${payload.id}`);
      if (!raw)
        return json({ error: "Subscription not found. Try re-enabling push." }, 404);
      const record = JSON.parse(raw);
      try {
        const res = await sendPush(env, record, {
          title: "HydroPro Tracker",
          body: "Test push — if you see this, it works! \u{1F4A7}"
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return json({ error: `Push service rejected the message (${res.status}). ${text}`.trim() }, 502);
        }
        return json({ ok: true });
      } catch (e) {
        return json({ error: e.message || "Failed to send test push." }, 500);
      }
    }
    if (url.pathname === "/api/feedback-watch" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      if (!payload.id)
        return json({ error: "Missing id." }, 400);
      let watchers = [];
      try {
        const raw = await env.WATER_KV.get("admin:feedback-watchers");
        if (raw)
          watchers = JSON.parse(raw);
      } catch (e) {
      }
      if (!watchers.includes(payload.id))
        watchers.push(payload.id);
      await env.WATER_KV.put("admin:feedback-watchers", JSON.stringify(watchers));
      return json({ ok: true, watching: true });
    }
    if (url.pathname === "/api/feedback-watch" && request.method === "DELETE") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      let watchers = [];
      try {
        const raw = await env.WATER_KV.get("admin:feedback-watchers");
        if (raw)
          watchers = JSON.parse(raw);
      } catch (e) {
      }
      watchers = watchers.filter((id) => id !== payload.id);
      await env.WATER_KV.put("admin:feedback-watchers", JSON.stringify(watchers));
      return json({ ok: true, watching: false });
    }
    if (url.pathname === "/api/auth/request-login" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      const email = String(payload.email || "").trim();
      if (!EMAIL_RE.test(email))
        return json({ error: "That doesn't look like a valid email address." }, 400);
      if (!env.DB)
        return json({ error: "Accounts are not set up on this server yet." }, 501);
      const token = await createLoginToken(env.DB, email);
      const result = await sendLoginEmail(env, email, token);
      if (!result.sent)
        console.error("Login email did not send:", result.reason || result.status);
      return json({ ok: true, message: "If that email is valid, a sign-in link is on its way." });
    }
    if (url.pathname === "/api/auth/verify" && request.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token)
        return json({ error: "Missing token." }, 400);
      if (!env.DB)
        return json({ error: "Accounts are not set up on this server yet." }, 501);
      const result = await verifyLoginToken(env.DB, token);
      if (result.error === "invalid")
        return json({ error: "That sign-in link is not valid." }, 400);
      if (result.error === "used")
        return json({ error: "That sign-in link has already been used. Request a new one." }, 400);
      if (result.error === "expired")
        return json({ error: "That sign-in link has expired. Request a new one." }, 400);
      return json({ sessionToken: result.sessionToken, email: result.email });
    }
    if (url.pathname === "/api/auth/session" && request.method === "GET") {
      if (!env.DB)
        return json({ error: "Accounts are not set up on this server yet." }, 501);
      const auth = request.headers.get("Authorization") || "";
      const sessionToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      const session = await verifySession(env.DB, sessionToken);
      if (!session)
        return json({ error: "Not signed in." }, 401);
      return json({ email: session.email });
    }
    if (url.pathname === "/api/auth/session" && request.method === "DELETE") {
      if (!env.DB)
        return json({ error: "Accounts are not set up on this server yet." }, 501);
      const auth = request.headers.get("Authorization") || "";
      const sessionToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (sessionToken)
        await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(sessionToken).run();
      return json({ ok: true });
    }
    if (url.pathname === "/api/feedback" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      const id = crypto.randomUUID();
      const record = { ...payload, submittedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await env.WATER_KV.put(`feedback:${id}`, JSON.stringify(record));
      try {
        const raw = await env.WATER_KV.get("admin:feedback-watchers");
        const watchers = raw ? JSON.parse(raw) : [];
        for (const watcherId of watchers) {
          try {
            const subRaw = await env.WATER_KV.get(`sub:${watcherId}`);
            if (!subRaw)
              continue;
            const subRecord = JSON.parse(subRaw);
            await sendPush(env, subRecord, {
              title: "HydroPro Tracker",
              body: `New feedback from ${payload.name || "someone"} — overall: ${payload.overall || "n/a"}`
            });
          } catch (e) {
          }
        }
      } catch (e) {
      }
      return json({ ok: true, id });
    }
    if (url.pathname === "/api/interpret" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      const { text, deviceId, trackers, userItems, bypassCache: bypassCacheRequested } = payload;
      // Gated: bypassCache is a diagnostic escape hatch, not a public feature — an unauthenticated
      // caller could otherwise force every request to hit the paid model instead of the free
      // cache, multiplying real spend. Fails closed by default: if SMART_ENTRY_DEBUG_SECRET isn't
      // set as a Worker secret, the header check below can never pass and bypassCache is always
      // ignored, regardless of what the request body asks for.
      const bypassCache = !!(bypassCacheRequested && env.SMART_ENTRY_DEBUG_SECRET &&
        request.headers.get("x-smart-entry-debug") === env.SMART_ENTRY_DEBUG_SECRET);
      if (!text || typeof text !== "string" || !text.trim()) {
        return json({ error: "Missing text." }, 400);
      }
      if (!deviceId || typeof deviceId !== "string") {
        return json({ error: "Missing deviceId." }, 400);
      }
      if (!userItems || typeof userItems !== "object") {
        return json({ error: "Missing userItems." }, 400);
      }
      if (!env.ANTHROPIC_API_KEY) {
        console.error("ANTHROPIC_API_KEY not configured - Smart Entry unavailable.");
        return json({ entries: [], unmatched: [], candidates: [], declined: "temporarily_unavailable" });
      }

      // Cap is tracked against the server's actual calendar day, not the request's `date` field
      // (which is which day the entry gets LOGGED to, e.g. a backfill — a separate concept from
      // when the API call itself happened; using it for the cap would let backfill-dated requests
      // dodge the daily limit entirely).
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const cacheKey = await interpretCacheKey(text, trackers);

      // Cache check first — a cache hit never touches the daily cap. `bypassCache: true` in the
      // request body skips this read (testing-only escape hatch, e.g. to re-check one phrase
      // against the current prompt without waiting on a version bump or the 30-day TTL) — the
      // fresh result below still overwrites the stale KV entry, so it also fixes that one phrase
      // for every future caller, not just this request.
      const cached = bypassCache ? null : await env.WATER_KV.get(cacheKey);
      if (cached) {
        await bumpSmartEntryUsage(env, deviceId, today, "cache_hits");
        return json(JSON.parse(cached));
      }

      const usage = await getSmartEntryUsage(env, deviceId, today);
      if (usage.calls >= SMART_ENTRY_DAILY_CAP) {
        return json({ entries: [], unmatched: [], candidates: [], declined: "daily_limit" });
      }

      let result;
      try {
        const systemPrompt = buildInterpretSystemPrompt(trackers, userItems);
        const raw = await callAnthropicInterpret(env, systemPrompt, text);
        result = normalizeInterpretResult(raw, trackers);
      } catch (e) {
        console.error("Smart Entry interpret failed:", e.message);
        return json({ entries: [], unmatched: [], candidates: [], declined: "temporarily_unavailable" });
      }

      await env.WATER_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: SMART_ENTRY_CACHE_TTL_SECONDS });
      await bumpSmartEntryUsage(env, deviceId, today, "calls");

      return json(result);
    }
    if (url.pathname === '/api/progress' && request.method === 'POST') {
      let payload;
      try { payload = await request.json(); } catch (e) {
        return json({ error: 'Invalid JSON body.' }, 400);
      }
      const { id } = payload;
      if (!id) return json({ error: 'Missing id.' }, 400);

      // 1. D1 retention write — always, for ANY id (push or device-id).
      //    Fire and forget: a D1 hiccup must never break the KV save below.
      const today = new Date().toISOString().slice(0, 10); // UTC, server-assigned
      if (env.DB) {
        try {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO user_activity (user_id, activity_date) VALUES (?, ?)'
          ).bind(id, today).run();
        } catch (e) { /* intentionally swallowed */ }
      }

      // 2. KV progress save — only for push subscribers (preserves cron behavior).
      const key = `sub:${id}`;
      const raw = await env.WATER_KV.get(key);
      if (!raw) return json({ ok: true }); // device-id ping: retention recorded, no KV entry

      const record = JSON.parse(raw);
      record.progress = {
        date: payload.date || null,
        goalOz: Number(payload.goalOz) || 0,
        consumedOz: Number(payload.consumedOz) || 0,
        goalProtein: Number(payload.goalProtein) || 0,
        consumedProtein: Number(payload.consumedProtein) || 0,
        goalCalories: Number(payload.goalCalories) || 0,
        consumedCalories: Number(payload.consumedCalories) || 0,
        lastLoggedMinutes: typeof payload.lastLoggedMinutes === 'number'
          ? payload.lastLoggedMinutes : null,
        streak: Number(payload.streak) || 0,
        treatments: Array.isArray(payload.treatments)
          ? payload.treatments.filter(t => t && typeof t.name === 'string'
              && typeof t.dueDate === 'string').map(t => ({ name: t.name, dueDate: t.dueDate }))
          : []
      };
      await env.WATER_KV.put(key, JSON.stringify(record));
      return json({ ok: true });
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    __name(escapeHtml, "escapeHtml");
    function fmtShareDate(key) {
      const [y, m, d] = String(key).split("-").map(Number);
      if (!y || !m || !d)
        return key;
      return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    }
    __name(fmtShareDate, "fmtShareDate");
    function renderShareHtml(summary) {
      const s = summary;
      const testerName = s.testerName || "";
      const rows = /* @__PURE__ */ __name((arr, cols) => arr.map((r) => `<tr>${cols.map((c) => `<td>${escapeHtml(c(r))}</td>`).join("")}</tr>`).join(""), "rows");
      const weightSection = !s.weight || s.weight.entries.length === 0 ? '<p class="empty">No weight logged in this period.</p>' : `<p>${s.weight.first.value}lbs (${fmtShareDate(s.weight.first.date)}) &rarr; ${s.weight.last.value}lbs (${fmtShareDate(s.weight.last.date)})` + (s.weight.change !== null ? ` &mdash; <b>${s.weight.change > 0 ? `+${s.weight.change}` : s.weight.change}lbs</b>` : "") + `</p><table><thead><tr><th>Date</th><th>Weight</th></tr></thead><tbody>${rows(s.weight.entries, [(e) => fmtShareDate(e.date), (e) => `${e.value}lbs`])}</tbody></table>`;
      const suppSection = !s.supplements || s.supplements.length === 0 ? '<p class="empty">None logged in this period.</p>' : `<table><thead><tr><th>Name</th><th>Days taken (of ${s.daysInRange})</th></tr></thead><tbody>${rows(s.supplements, [(x) => x.name, (x) => String(x.daysTaken)])}</tbody></table>`;
      const treatSection = !s.treatments || s.treatments.length === 0 ? '<p class="empty">None logged in this period.</p>' : `<table><thead><tr><th>Name</th><th>Dates</th></tr></thead><tbody>${rows(s.treatments, [(x) => x.name, (x) => x.dates.map(fmtShareDate).join(", ")])}</tbody></table>`;
      return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HydroPro Tracker - Health Summary</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#EEF3F7; color:#0B2038; margin:0; padding:20px; }
.wrap { max-width:640px; margin:0 auto; background:#EEF3F7; }
.header { text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #0B2038; }
.header h1 { font-size:19px; margin:0 0 4px; }
.name { font-weight:700; font-size:15px; margin:0 0 2px; }
.dates { font-size:13px; color:#5C7085; margin:0; }
.section { margin-bottom:22px; }
.section h2 { font-size:14px; text-transform:uppercase; letter-spacing:.03em; color:#1B4F72; border-bottom:1px solid #DCE6EE; padding-bottom:6px; margin:0 0 10px; }
.empty { font-size:13px; color:#5C7085; font-style:italic; }
table { width:100%; border-collapse:collapse; font-size:13px; }
th { text-align:left; font-weight:700; color:#5C7085; font-size:11.5px; text-transform:uppercase; padding:4px 8px; border-bottom:1.5px solid #DCE6EE; }
td { padding:6px 8px; border-bottom:1px solid #E7EEF4; }
.disclaimer { font-size:11px; color:#5C7085; margin-top:30px; padding-top:14px; border-top:1px solid #DCE6EE; line-height:1.5; }
.print-btn { display:block; width:100%; padding:12px; background:#1B4F72; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; margin-bottom:20px; cursor:pointer; }
@media print { .print-btn { display:none; } body { background:#fff; padding:0; } }
</style></head>
<body><div class="wrap">
<button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
<div class="header">
  <h1>HydroPro Tracker &mdash; Health Summary</h1>
  ${testerName ? `<p class="name">${escapeHtml(testerName)}</p>` : ""}
  <p class="dates">${fmtShareDate(s.rangeStart)} &ndash; ${fmtShareDate(s.rangeEnd)} (${s.daysInRange} days, logged on ${s.daysWithAnyLog})</p>
</div>
<div class="section"><h2>Daily Averages</h2>
<table><thead><tr><th>Metric</th><th>Average</th><th>Goal</th></tr></thead><tbody>
<tr><td>Water</td><td>${s.averages.avgOz}oz</td><td>${s.goals.goalOz > 0 ? `${s.goals.goalOz}oz` : "&mdash;"}</td></tr>
<tr><td>Protein</td><td>${s.averages.avgProtein}g</td><td>${s.goals.goalProtein > 0 ? `${s.goals.goalProtein}g` : "&mdash;"}</td></tr>
<tr><td>Calories</td><td>${s.averages.avgCalories}cal</td><td>${s.goals.goalCalories > 0 ? `${s.goals.goalCalories}cal` : "&mdash;"}</td></tr>
<tr><td>Sleep</td><td>${s.averages.avgSleepHours}hrs</td><td>${s.goals.goalSleepHours > 0 ? `${s.goals.goalSleepHours}hrs` : "&mdash;"}</td></tr>
</tbody></table></div>
<div class="section"><h2>Weight</h2>${weightSection}</div>
<div class="section"><h2>Supplements &amp; Prescriptions</h2>${suppSection}</div>
<div class="section"><h2>Treatments</h2>${treatSection}</div>
<p class="disclaimer">This summary is self-reported by the user via the HydroPro Tracker app and is provided for informational purposes only. It is not a clinical record and may include gaps, estimates, or user error.</p>
</div></body></html>`;
    }
    __name(renderShareHtml, "renderShareHtml");
    async function requireUser(env2, request2) {
      if (!env2.DB)
        return null;
      const auth = request2.headers.get("Authorization") || "";
      const sessionToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!sessionToken)
        return null;
      return verifySession(env2.DB, sessionToken);
    }
    __name(requireUser, "requireUser");
    if (url.pathname === "/api/share" && request.method === "POST") {
      const user = await requireUser(env, request);
      if (!user)
        return json({ error: "Not signed in." }, 401);
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      if (!payload.summary || typeof payload.summary !== "object")
        return json({ error: "Missing summary data." }, 400);
      const shareId = generateToken();
      const now = /* @__PURE__ */ new Date();
      const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1e3);
      await env.DB.prepare("INSERT INTO shares (id, user_id, summary_json, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").bind(shareId, user.userId, JSON.stringify(payload.summary), now.toISOString(), expires.toISOString()).run();
      const shareUrl = `${url.origin}/share/${shareId}`;
      return json({ id: shareId, url: shareUrl, expiresAt: expires.toISOString() });
    }
    if (url.pathname.startsWith("/share/") && request.method === "GET") {
      if (!env.DB)
        return new Response("Sharing is not set up on this server yet.", { status: 501, headers: { "Content-Type": "text/plain" } });
      const shareId = decodeURIComponent(url.pathname.slice("/share/".length) || "");
      if (!shareId)
        return new Response("Missing share id.", { status: 400, headers: { "Content-Type": "text/plain" } });
      const row = await env.DB.prepare("SELECT summary_json, expires_at FROM shares WHERE id = ?").bind(shareId).first();
      if (!row)
        return new Response("This share link was not found.", { status: 404, headers: { "Content-Type": "text/plain" } });
      if (new Date(row.expires_at).getTime() < Date.now())
        return new Response("This share link has expired.", { status: 410, headers: { "Content-Type": "text/plain" } });
      const html = renderShareHtml(JSON.parse(row.summary_json));
      return new Response(html, { status: 200, headers: { "Content-Type": "text/html;charset=utf-8" } });
    }
    if (url.pathname.startsWith("/api/share/") && request.method === "GET") {
      if (!env.DB)
        return json({ error: "Sharing is not set up on this server yet." }, 501);
      const shareId = decodeURIComponent(url.pathname.slice("/api/share/".length) || "");
      if (!shareId)
        return json({ error: "Missing share id." }, 400);
      const row = await env.DB.prepare("SELECT summary_json, created_at, expires_at FROM shares WHERE id = ?").bind(shareId).first();
      if (!row)
        return json({ error: "This share link was not found." }, 404);
      if (new Date(row.expires_at).getTime() < Date.now())
        return json({ error: "This share link has expired." }, 410);
      return json({ summary: JSON.parse(row.summary_json), createdAt: row.created_at, expiresAt: row.expires_at });
    }
    if (url.pathname === "/api/account/backup" && request.method === "POST") {
      const user = await requireUser(env, request);
      if (!user)
        return json({ error: "Not signed in." }, 401);
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      if (!payload.data || typeof payload.data !== "object")
        return json({ error: "Missing backup data." }, 400);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await env.DB.prepare(
        "INSERT INTO account_backups (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
      ).bind(user.userId, JSON.stringify(payload.data), now).run();
      return json({ ok: true, savedAt: now });
    }
    if (url.pathname === "/api/account/backup" && request.method === "GET") {
      const user = await requireUser(env, request);
      if (!user)
        return json({ error: "Not signed in." }, 401);
      const row = await env.DB.prepare("SELECT data, updated_at FROM account_backups WHERE user_id = ?").bind(user.userId).first();
      if (!row)
        return json({ error: "No backup found for this account yet." }, 404);
      return json({ data: JSON.parse(row.data), savedAt: row.updated_at });
    }
    if (url.pathname === "/api/backup" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      const { code, data } = payload;
      if (typeof code !== "string" || code.length < 10) {
        return json({ error: "Invalid recovery code." }, 400);
      }
      if (!data || typeof data !== "object") {
        return json({ error: "Missing backup data." }, 400);
      }
      const record = { data, savedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await env.WATER_KV.put(`backup:${code.toUpperCase()}`, JSON.stringify(record));
      return json({ ok: true, savedAt: record.savedAt });
    }
    if (url.pathname.startsWith("/api/backup/") && request.method === "GET") {
      const code = decodeURIComponent(url.pathname.slice("/api/backup/".length) || "").toUpperCase();
      if (!code || code.length < 10)
        return json({ error: "Invalid recovery code." }, 400);
      const raw = await env.WATER_KV.get(`backup:${code}`);
      if (!raw)
        return json({ error: "No backup found for that code." }, 404);
      return json(JSON.parse(raw));
    }
    if (url.pathname === "/api/backup" && request.method === "DELETE") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400);
      }
      if (payload.code)
        await env.WATER_KV.delete(`backup:${String(payload.code).toUpperCase()}`);
      return json({ ok: true });
    }
    return json({ error: "Not found." }, 404);
  },
  async scheduled(controller, env, ctx) {
    const list = await env.WATER_KV.list({ prefix: "sub:" });
    const now = /* @__PURE__ */ new Date();
    for (const key of list.keys) {
      ctx.waitUntil(processOne(key.name, env, now));
    }
  }
};
async function processOne(key, env, now) {
  const raw = await env.WATER_KV.get(key);
  if (!raw)
    return;
  let record;
  try {
    record = JSON.parse(raw);
  } catch (e) {
    return;
  }
  const { schedule, bedtime, supplementReminder, treatmentReminder, timezone } = record;
  const { dateStr, minutes } = localTimeParts(now, timezone || "UTC");
  let changed = false;
  if (bedtime && bedtime.enabled && bedtime.time) {
    const [bh, bm] = bedtime.time.split(":").map(Number);
    const bedtimeMinutes = bh * 60 + bm;
    const due = minutes >= bedtimeMinutes && minutes < bedtimeMinutes + 20;
    if (due && record.lastSentBedtimeDate !== dateStr) {
      try {
        const res = await sendPush(env, record, {
          title: "HydroPro Tracker",
          body: "Lights out soon \u{1F319} — sweet dreams"
        });
        if (res.status === 404 || res.status === 410) {
          await env.WATER_KV.delete(key);
          return;
        }
        record.lastSentBedtimeDate = dateStr;
        changed = true;
      } catch (e) {
      }
    }
  }
  if (supplementReminder && supplementReminder.enabled && supplementReminder.time) {
    const [sh, sm] = supplementReminder.time.split(":").map(Number);
    const supplementMinutes = sh * 60 + sm;
    const due = minutes >= supplementMinutes && minutes < supplementMinutes + 20;
    if (due && record.lastSentSupplementDate !== dateStr) {
      try {
        const res = await sendPush(env, record, {
          title: "HydroPro Tracker",
          body: "Time to take your supplements & prescriptions \u{1F48A}"
        });
        if (res.status === 404 || res.status === 410) {
          await env.WATER_KV.delete(key);
          return;
        }
        record.lastSentSupplementDate = dateStr;
        changed = true;
      } catch (e) {
      }
    }
  }
  if (treatmentReminder && treatmentReminder.enabled && treatmentReminder.time) {
    const [th, tm] = treatmentReminder.time.split(":").map(Number);
    const treatmentMinutes = th * 60 + tm;
    const due = minutes >= treatmentMinutes && minutes < treatmentMinutes + 20;
    if (due && record.lastSentTreatmentDate !== dateStr) {
      const dueList = record.progress && Array.isArray(record.progress.treatments) ? record.progress.treatments : [];
      const dueNow = dueList.filter((t) => t.dueDate <= dateStr);
      if (dueNow.length > 0) {
        const names = dueNow.map((t) => t.name).join(", ");
        try {
          const res = await sendPush(env, record, {
            title: "HydroPro Tracker",
            body: `\u{1F489} ${names} due — log it when you're able`
          });
          if (res.status === 404 || res.status === 410) {
            await env.WATER_KV.delete(key);
            return;
          }
          record.lastSentTreatmentDate = dateStr;
          changed = true;
        } catch (e) {
        }
      } else {
        record.lastSentTreatmentDate = dateStr;
        changed = true;
      }
    }
  }
  if (schedule && schedule.startTime && schedule.endTime) {
    const slots = slotMinutes(schedule.startTime, schedule.endTime, schedule.intervalHours);
    const dueSlot = slots.find((m) => minutes >= m && minutes < m + 20);
    if (dueSlot != null) {
      const slotKey = `${dateStr}T${dueSlot}`;
      if (record.lastSentSlot !== slotKey) {
        if (loggedRecently(record.progress, dateStr, minutes)) {
          record.lastSentSlot = slotKey;
          changed = true;
        } else {
          const progressMsg = record.progress && record.progress.date === dateStr ? buildProgressMessage(record.progress, minutes) : null;
          const body = progressMsg || "Time to log your stats \u{1F4A7}\u{1F4AA}\u{1F525}";
          try {
            const res = await sendPush(env, record, { title: "HydroPro Tracker", body });
            if (res.status === 404 || res.status === 410) {
              await env.WATER_KV.delete(key);
              return;
            }
            record.lastSentSlot = slotKey;
            changed = true;
          } catch (e) {
          }
        }
      }
    }
  }
  if (changed) {
    await env.WATER_KV.put(key, JSON.stringify(record));
  }
}
__name(processOne, "processOne");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
