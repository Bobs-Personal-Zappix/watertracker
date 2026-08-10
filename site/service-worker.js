const CACHE_NAME = 'water-tracker-v1';
const APP_SHELL = [
  './',
  './index.html',
  './bundle.js',
  './config.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});

// --- Web Push ---

self.addEventListener('push', (event) => {
  let data = { title: 'Water Tracker', body: 'Time to drink water 💧' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    /* fall back to default text */
  }
  const title = data.title || 'Water Tracker';
  const options = {
    body: data.body || 'Time to drink water 💧',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'water-reminder',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow('./');
    })
  );
});
