/* LoveBloom Service Worker — PWA кеширование + Web Push уведомления */

const CACHE = "lovebloom-v1";
const PRECACHE = ["/", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (
    url.hostname.includes("functions.poehali.dev") ||
    url.hostname.includes("mc.yandex.ru") ||
    url.hostname.includes("cdn.poehali.dev")
  ) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', function(event) {
  let data = { title: 'LoveBloom', body: 'Новое уведомление', url: '/' };
  try {
    if (event.data) data = { ...data, ...JSON.parse(event.data.text()) };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'lovebloom-push',
      renotify: true,
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});