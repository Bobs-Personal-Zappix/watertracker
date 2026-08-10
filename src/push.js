// Web Push client helpers. Talks to the Cloudflare Worker backend configured
// in site/config.js (window.WATER_TRACKER_CONFIG.apiBase).

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('./service-worker.js');
}

function apiBase() {
  const base = (typeof window !== 'undefined' && window.WATER_TRACKER_CONFIG && window.WATER_TRACKER_CONFIG.apiBase) || '';
  return base.replace(/\/$/, '');
}

export async function fetchVapidPublicKey() {
  const base = apiBase();
  if (!base) throw new Error('Push server not configured yet — set apiBase in config.js.');
  const res = await fetch(`${base}/api/vapid-public-key`);
  if (!res.ok) throw new Error('Could not reach the push server.');
  const data = await res.json();
  return data.publicKey;
}

export async function subscribeToPush(existingId, schedule) {
  const base = apiBase();
  if (!base) throw new Error('Push server not configured yet — set apiBase in config.js.');
  if (!('Notification' in window)) throw new Error('Notifications are not supported in this browser.');

  const registration = await registerServiceWorker();
  if (!registration) throw new Error('Service workers are not supported in this browser.');

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notification permission was not granted.');

  const publicKey = await fetchVapidPublicKey();
  let sub = await registration.pushManager.getSubscription();
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await fetch(`${base}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: existingId || undefined, subscription: sub.toJSON(), schedule, timezone }),
  });
  if (!res.ok) throw new Error('Could not register with the push server.');
  const data = await res.json();
  return data.id;
}

export async function updatePushSchedule(id, schedule) {
  if (!id) return;
  const base = apiBase();
  if (!base) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const sub = registration && (await registration.pushManager.getSubscription());
  if (!sub) return;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  await fetch(`${base}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, subscription: sub.toJSON(), schedule, timezone }),
  });
}

export async function unsubscribeFromPush(id) {
  const base = apiBase();
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }
  } catch (e) { /* best effort */ }
  if (id && base) {
    await fetch(`${base}/api/subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }
}

export async function sendTestPush(id) {
  const base = apiBase();
  if (!base) throw new Error('Push server not configured yet — set apiBase in config.js.');
  if (!id) throw new Error('Not subscribed yet.');
  const res = await fetch(`${base}/api/test-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Test push failed.');
  }
  return true;
}
