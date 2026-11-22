const CACHE_NAME = 'tcc-clinic-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.svg',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-maskable-512.png',
  '/apple-touch-icon.png',
  '/tcc-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: Pre-caching asset failed', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL: Never intercept localhost, dev servers, vite HMR, or non-GET requests
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.port === '5173' ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src') ||
    url.pathname.startsWith('/node_modules') ||
    url.pathname.startsWith('/api') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Navigation requests: Network first with fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match('/index.html');
        return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  // Static assets: Cache first, then network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for failed asset fetch
        return new Response('', { status: 404 });
      });
    })
  );
});

// Push notification click handler for cellphone notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Client message listener to trigger notifications from page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, id, url } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'TCC Clinic Alert', {
        body: body || 'You have an important clinic update.',
        icon: '/pwa-icon-192.png',
        badge: '/pwa-icon-192.png',
        tag: `tcc-${id || Date.now()}`,
        vibrate: [250, 100, 250],
        data: { url: url || '/dashboard' }
      })
    );
  }
});

// Web Push event listener
self.addEventListener('push', (event) => {
  let data = { title: 'TCC Clinic Alert', body: 'New clinic notification received.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'TCC Clinic Alert', {
      body: data.body || 'You have an important notification.',
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/dashboard' }
    })
  );
});
