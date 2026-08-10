process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // local self-signed cert, test only

import worker from '../src/worker.js';
import { startFakePushService } from './fake-push-service.mjs';

function makeMockKV() {
  const store = new Map();
  return {
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value) { store.set(key, value); },
    async delete(key) { store.delete(key); },
    async list({ prefix } = {}) {
      const keys = [...store.keys()].filter((k) => !prefix || k.startsWith(prefix)).map((name) => ({ name }));
      return { keys };
    },
    _store: store,
  };
}

async function req(base, path, opts, env) {
  const url = `${base}${path}`;
  const r = new Request(url, opts || {});
  return worker.fetch(r, env);
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`  ok  - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name}`, extra ?? ''); }
}

async function main() {
  const { server, port, received } = await startFakePushService();
  const KV = makeMockKV();
  const env = {
    WATER_KV: KV,
    VAPID_PUBLIC_KEY: 'BEn2T8S2RtoO7mVpmtX_sOPL4YQnOUw4jNUgwSLXhK0PXK3eJxxXmfQavgiJiuxAsJtbJEIuS3z4BfwIVO5Kijc',
    VAPID_PRIVATE_KEY: JSON.stringify({ alg: 'ES256', key_ops: ['sign'], ext: true, kty: 'EC', x: 'SfZPxLZG2g7uZWma1f-w48vhhCc5TDiM1SDBIteErQ8', y: 'XK3eJxxXmfQavgiJiuxAsJtbJEIuS3z4BfwIVO5Kijc', crv: 'P-256', d: 'eEpU2_vJ1FoFi4okrbWiyt9Uatp5mDxpqx-9zt1kf2U' }),
    VAPID_CONTACT_EMAIL: 'mailto:test@example.com',
  };
  const base = 'https://worker.test';

  console.log('\n1. GET /api/vapid-public-key');
  let res = await req(base, '/api/vapid-public-key', { method: 'GET' }, env);
  let body = await res.json();
  check('status 200', res.status === 200);
  check('returns public key', body.publicKey === env.VAPID_PUBLIC_KEY, body);

  console.log('\n2. POST /api/subscribe (new subscription)');
  const subscription = {
    endpoint: `https://127.0.0.1:${port}/fake-endpoint-device-A`,
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    },
  };
  res = await req(base, '/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription,
      schedule: { startTime: '08:00', endTime: '20:00', intervalHours: 2 },
      timezone: 'America/New_York',
    }),
  }, env);
  body = await res.json();
  check('status 200', res.status === 200, body);
  check('returns an id', typeof body.id === 'string' && body.id.length > 10, body);
  const subId = body.id;
  check('KV has one record', KV._store.size === 1);

  console.log('\n3. POST /api/subscribe again with same id (update schedule)');
  res = await req(base, '/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: subId,
      subscription,
      schedule: { startTime: '09:00', endTime: '21:00', intervalHours: 3 },
      timezone: 'America/New_York',
    }),
  }, env);
  body = await res.json();
  check('same id returned', body.id === subId, body);
  check('KV still has exactly one record (upsert, not duplicate)', KV._store.size === 1);
  const stored = JSON.parse(await KV.get(`sub:${subId}`));
  check('schedule was updated', stored.schedule.startTime === '09:00', stored);

  console.log('\n4. POST /api/test-push (real delivery to fake local push service)');
  res = await req(base, '/api/test-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: subId }),
  }, env);
  body = await res.json();
  check('status 200', res.status === 200, body);
  check('fake push service received exactly 1 request', received.length === 1, received);
  if (received[0]) {
    check('request had a body (encrypted payload)', received[0].bodyLength > 0, received[0]);
    check('request had VAPID authorization header', !!received[0].headers.authorization, received[0].headers);
  }

  const pending = [];
  const ctx = { waitUntil: (p) => { pending.push(p); } };
  async function runScheduledAndWait(controller) {
    pending.length = 0;
    await worker.scheduled(controller, env, ctx);
    await Promise.all(pending);
  }

  console.log('\n5. scheduled() — subscriber whose schedule matches "now"');
  const nowNY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const [nowH] = nowNY.split(':').map(Number);
  const dueStart = `${String(nowH).padStart(2, '0')}:00`;
  res = await req(base, '/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: subId,
      subscription,
      schedule: { startTime: dueStart, endTime: '23:00', intervalHours: 1 },
      timezone: 'America/New_York',
    }),
  }, env);
  received.length = 0;
  await runScheduledAndWait({ cron: '*/15 * * * *' });
  check('scheduled run sent exactly 1 push for the due slot', received.length === 1, received);
  const afterFirst = JSON.parse(await KV.get(`sub:${subId}`));
  check('lastSentSlot was recorded', !!afterFirst.lastSentSlot, afterFirst);

  console.log('\n6. scheduled() — running again immediately should NOT re-send the same slot');
  received.length = 0;
  await runScheduledAndWait({ cron: '*/15 * * * *' });
  check('no duplicate push sent for the same slot', received.length === 0, received);

  console.log('\n7. scheduled() — subscriber outside their window should be skipped');
  await KV.put(`sub:${subId}`, JSON.stringify({
    subscription, schedule: { startTime: '02:00', endTime: '03:00', intervalHours: 1 }, timezone: 'America/New_York', lastSentSlot: null,
  }));
  received.length = 0;
  await runScheduledAndWait({ cron: '*/15 * * * *' });
  check('no push sent when current time is outside the schedule window', received.length === 0, received);

  console.log('\n8. scheduled() — 410 Gone response should delete the KV record');
  await KV.put(`sub:${subId}`, JSON.stringify({
    subscription: { ...subscription, endpoint: `https://127.0.0.1:${port}/gone` },
    schedule: { startTime: dueStart, endTime: '23:00', intervalHours: 1 },
    timezone: 'America/New_York',
    lastSentSlot: null,
  }));
  await runScheduledAndWait({ cron: '*/15 * * * *' });
  const afterGone = await KV.get(`sub:${subId}`);
  check('KV record removed after 410 Gone from push service', afterGone === null);

  console.log('\n9. DELETE /api/subscribe cleans up (re-create first)');
  await KV.put(`sub:${subId}`, JSON.stringify({ subscription, schedule: {}, timezone: 'UTC', lastSentSlot: null }));
  res = await req(base, '/api/subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: subId }),
  }, env);
  body = await res.json();
  check('delete returns ok', body.ok === true, body);
  check('KV record actually removed', (await KV.get(`sub:${subId}`)) === null);

  console.log('\n10. CORS preflight');
  res = await req(base, '/api/subscribe', { method: 'OPTIONS' }, env);
  check('OPTIONS returns CORS headers', res.headers.get('Access-Control-Allow-Origin') === '*', [...res.headers.entries()]);

  server.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('CRASHED:', e); process.exit(1); });
