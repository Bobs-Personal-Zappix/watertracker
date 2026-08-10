import { buildPushHTTPRequest } from '@pushforge/builder';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function slotMinutes(startTime, endTime, intervalHours) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const step = Math.max(15, Math.round(Number(intervalHours) * 60));
  const slots = [];
  for (let t = start; t <= end; t += step) slots.push(t);
  return slots;
}

function localTimeParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0; // some ICU implementations report midnight as 24
  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hour * 60 + Number(parts.minute),
  };
}

async function sendPush(env, record, payload) {
  const privateJWK = JSON.parse(env.VAPID_PRIVATE_KEY);
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK,
    subscription: record.subscription,
    message: {
      payload,
      adminContact: env.VAPID_CONTACT_EMAIL || 'mailto:admin@example.com',
      options: { ttl: 3600, urgency: 'high', topic: 'water-reminder' },
    },
  });
  return fetch(endpoint, { method: 'POST', headers, body });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === '/api/vapid-public-key' && request.method === 'GET') {
      return json({ publicKey: env.VAPID_PUBLIC_KEY });
    }

    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: 'Invalid JSON body.' }, 400);
      }
      const { id, subscription, schedule, timezone } = payload;
      if (!subscription || !subscription.endpoint) {
        return json({ error: 'Missing subscription.' }, 400);
      }
      const recordId = id || crypto.randomUUID();
      const key = `sub:${recordId}`;
      let existing = null;
      try {
        const raw = await env.WATER_KV.get(key);
        if (raw) existing = JSON.parse(raw);
      } catch (e) { /* ignore */ }
      const record = {
        subscription,
        schedule: schedule || { startTime: '08:00', endTime: '20:00', intervalHours: 2 },
        timezone: timezone || 'UTC',
        lastSentSlot: existing ? existing.lastSentSlot : null,
        updatedAt: new Date().toISOString(),
      };
      await env.WATER_KV.put(key, JSON.stringify(record));
      return json({ id: recordId });
    }

    if (url.pathname === '/api/subscribe' && request.method === 'DELETE') {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: 'Invalid JSON body.' }, 400);
      }
      if (payload.id) await env.WATER_KV.delete(`sub:${payload.id}`);
      return json({ ok: true });
    }

    if (url.pathname === '/api/test-push' && request.method === 'POST') {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: 'Invalid JSON body.' }, 400);
      }
      if (!payload.id) return json({ error: 'Missing id.' }, 400);
      const raw = await env.WATER_KV.get(`sub:${payload.id}`);
      if (!raw) return json({ error: 'Subscription not found. Try re-enabling push.' }, 404);
      const record = JSON.parse(raw);
      try {
        const res = await sendPush(env, record, {
          title: 'Water Tracker',
          body: 'Test push — if you see this, it works! 💧',
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          return json({ error: `Push service rejected the message (${res.status}). ${text}`.trim() }, 502);
        }
        return json({ ok: true });
      } catch (e) {
        return json({ error: e.message || 'Failed to send test push.' }, 500);
      }
    }

    return json({ error: 'Not found.' }, 404);
  },

  async scheduled(controller, env, ctx) {
    const list = await env.WATER_KV.list({ prefix: 'sub:' });
    const now = new Date();

    for (const key of list.keys) {
      ctx.waitUntil(processOne(key.name, env, now));
    }
  },
};

async function processOne(key, env, now) {
  const raw = await env.WATER_KV.get(key);
  if (!raw) return;
  let record;
  try {
    record = JSON.parse(raw);
  } catch (e) {
    return;
  }
  const { schedule, timezone } = record;
  if (!schedule || !schedule.startTime || !schedule.endTime) return;

  const { dateStr, minutes } = localTimeParts(now, timezone || 'UTC');
  const slots = slotMinutes(schedule.startTime, schedule.endTime, schedule.intervalHours);
  // "due" if we're within 20 minutes past a slot's start time (grace window for cron jitter)
  const dueSlot = slots.find((m) => minutes >= m && minutes < m + 20);
  if (dueSlot == null) return;

  const slotKey = `${dateStr}T${dueSlot}`;
  if (record.lastSentSlot === slotKey) return; // already sent this slot today

  try {
    const res = await sendPush(env, record, {
      title: 'Water Tracker',
      body: 'Time to drink water 💧',
    });
    if (res.status === 404 || res.status === 410) {
      // subscription is gone (browser data cleared, uninstalled, etc.)
      await env.WATER_KV.delete(key);
      return;
    }
  } catch (e) {
    return; // try again next tick
  }

  record.lastSentSlot = slotKey;
  await env.WATER_KV.put(key, JSON.stringify(record));
}
