/**
 * Mr. DIVA Smart Learning School LMS - Security-Hardened Service Worker (Fase 2)
 *
 * SECURITY POLICY (ZERO-SENSITIVE-CACHE):
 * 1. NEVER cache any `/api/*` endpoints (auth, sessions, grades, exams, master keys, attendance, storage files, notifications).
 * 2. NEVER cache non-GET requests.
 * 3. Only cache static UI shell assets, icons, and fonts for fast loading & offline shell resilience.
 * 4. Support Web Push (`push` and `notificationclick`) when VAPID push notifications are triggered.
 */

const CACHE_NAME = 'mrdiva-static-shell-v2';
const FONT_CACHE_NAME = 'mrdiva-fonts-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

// Sensitive URL patterns that MUST NEVER be stored in Service Worker Cache Storage
function isSensitiveOrApiRequest(url) {
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname.includes('/storage/')) return true;
  if (url.pathname.includes('/auth/')) return true;
  if (url.pathname.includes('/exams')) return true;
  if (url.pathname.includes('/attendance')) return true;
  if (url.pathname.includes('/admin')) return true;
  if (url.pathname.includes('/security')) return true;
  return false;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Ignore individual asset failure during dev mode
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key !== FONT_CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1. Strictly bypass non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // 2. STRICT SECURITY RULE: Never cache any API, auth, exam, grade, attendance, or file storage responses
  if (isSensitiveOrApiRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // 3. Bypass Vite HMR / internal dev modules in development
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // 4. Google Fonts: Cache-First strategy
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const response = await fetch(req);
        if (response && response.status === 200) {
          cache.put(req, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // 5. Navigation / HTML requests: Network-First with fallback to cached shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || new Response('Offline - Periksa koneksi internet Anda.', { status: 503 });
        })
    );
    return;
  }

  // 6. Static assets (icons, manifest, built CSS/JS bundles): Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((networkResp) => {
            if (
              networkResp &&
              networkResp.status === 200 &&
              networkResp.type === 'basic' &&
              !isSensitiveOrApiRequest(url)
            ) {
              cache.put(req, networkResp.clone());
            }
            return networkResp;
          })
          .catch(() => cached);

        return cached || networkPromise;
      })
    );
  }
});

// Web Push Event Listener (RFC 8030) for Task Deadline Reminders
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Pengingat Pintar Mr. DIVA LMS',
    body: 'Periksa jadwal tugas harian Anda yang mendekati batas waktu.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'mrdiva-task-reminder',
    data: { url: '/?tab=tugas' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-192x192.png',
      tag: payload.tag || 'mrdiva-task-reminder',
      data: payload.data || { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
