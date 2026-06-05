const CACHE_NAME = "mohalla-app-shell-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/icons/icon-192x192.png",
  "/manifest.json",
  "/favicon.ico"
];

// Install event - cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Cache First strategy for app shell
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

// Push event - display notification
self.addEventListener('push', (event) => {
  let notification = {
    title: 'Mohalla Alert',
    body: 'You have a new notification.',
    icon: '/icons/icon-192x192.png',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notification = {
        title: payload.title || notification.title,
        body: payload.body || notification.body,
        icon: payload.icon || notification.icon,
        data: payload.data || {}
      };
    } catch (error) {
      console.error('Failed to parse push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      data: notification.data,
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true
    })
  );
});

// Notification click event - navigate to appropriate page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/feed';

  if (data.sosId) {
    targetUrl = '/emergency';
  } else if (data.groupId) {
    targetUrl = '/messages';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open with the target URL
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
