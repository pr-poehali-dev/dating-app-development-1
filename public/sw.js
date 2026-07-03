/* Полутон Service Worker v2 — офлайн, кеш, push, фоновая синхронизация */

const APP_VERSION = "polyuton-v2";
const STATIC_CACHE = `${APP_VERSION}-static`;
const DYNAMIC_CACHE = `${APP_VERSION}-dynamic`;
const IMAGE_CACHE = `${APP_VERSION}-images`;

/* Файлы приложения — кешируются при установке */
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

/* Хосты, которые никогда не кешируем */
const BYPASS_HOSTS = [
  "functions.poehali.dev",
  "mc.yandex.ru",
  "intertnal",
];

/* Офлайн-страница (HTML inline) */
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Полутон — нет соединения</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#1a1025;color:#fff;font-family:system-ui,sans-serif;
       display:flex;flex-direction:column;align-items:center;justify-content:center;
       min-height:100vh;gap:16px;padding:24px;text-align:center}
  .icon{font-size:64px;animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
  h1{font-size:22px;font-weight:800}
  p{color:rgba(255,255,255,0.55);font-size:14px;max-width:280px;line-height:1.6}
  button{margin-top:8px;padding:12px 28px;border-radius:16px;border:none;cursor:pointer;
         font-size:15px;font-weight:700;color:#fff;
         background:linear-gradient(135deg,#FF2D78,#9B59B6)}
</style>
</head>
<body>
  <div class="icon">💘</div>
  <h1>Нет соединения</h1>
  <p>Проверь интернет-соединение и попробуй снова. Твои чаты сохранены локально.</p>
  <button onclick="location.reload()">Обновить</button>
</body>
</html>`;

/* ─── INSTALL ─────────────────────────────────────────────────────────────── */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

/* ─── ACTIVATE ────────────────────────────────────────────────────────────── */
self.addEventListener("activate", (e) => {
  const keepCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !keepCaches.includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ─── Помощники ───────────────────────────────────────────────────────────── */
function shouldBypass(url) {
  return BYPASS_HOSTS.some((h) => url.hostname.includes(h));
}

function isImage(url) {
  return /\.(png|jpe?g|webp|gif|svg|ico)(\?.*)?$/i.test(url.pathname);
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf)(\?.*)?$/i.test(url.pathname);
}

/* Стратегия: Network-first (живые данные) с фолбэком на кеш */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(OFFLINE_HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

/* Стратегия: Cache-first (статика и картинки) */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}

/* ─── FETCH ───────────────────────────────────────────────────────────────── */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  /* Пропускаем API, аналитику и внешние CDN */
  if (shouldBypass(url)) return;

  /* Картинки — cache-first (долгое хранение) */
  if (isImage(url)) {
    e.respondWith(cacheFirst(e.request, IMAGE_CACHE));
    return;
  }

  /* Статические ассеты (JS/CSS/шрифты) — cache-first */
  if (isStaticAsset(url)) {
    e.respondWith(cacheFirst(e.request, STATIC_CACHE));
    return;
  }

  /* Навигационные запросы и всё остальное — network-first */
  e.respondWith(networkFirst(e.request, DYNAMIC_CACHE));
});

/* ─── BACKGROUND SYNC ─────────────────────────────────────────────────────── */
self.addEventListener("sync", (e) => {
  if (e.tag === "sync-messages") {
    e.waitUntil(syncPendingMessages());
  }
});

async function syncPendingMessages() {
  try {
    const db = await openDB();
    const pending = await getFromDB(db, "pending-messages");
    if (!pending || !pending.length) return;
    /* Попытка отправить отложенные сообщения при восстановлении сети */
    for (const msg of pending) {
      try {
        await fetch(msg.url, {
          method: "POST",
          headers: msg.headers,
          body: JSON.stringify(msg.body),
        });
      } catch {
        /* Оставляем в очереди до следующей попытки */
      }
    }
  } catch {
    /* IndexedDB недоступен — пропускаем */
  }
}

/* Минимальный IndexedDB-хелпер */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("lovebloom-sw", 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("pending-messages", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}

function getFromDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}

/* ─── PUSH УВЕДОМЛЕНИЯ ────────────────────────────────────────────────────── */
self.addEventListener("push", (e) => {
  let data = { title: "LoveBloom 💘", body: "Новое уведомление", url: "/" };
  try {
    if (e.data) data = { ...data, ...JSON.parse(e.data.text()) };
  } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/7f6a4d91-3e00-44d9-a406-f95ab5bd0fed.png",
      badge: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/03cd7dfb-872e-4460-b1fa-a3e2f995275b.png",
      tag: data.tag || "lovebloom-push",
      renotify: true,
      requireInteraction: false,
      data: { url: data.url || "/" },
      vibrate: [200, 100, 200],
      actions: [
        { action: "open", title: "Открыть" },
        { action: "close", title: "Закрыть" },
      ],
    })
  );
});

/* ─── КЛИК ПО УВЕДОМЛЕНИЮ ────────────────────────────────────────────────── */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  if (e.action === "close") return;

  const url = (e.notification.data && e.notification.data.url) || "/";

  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        /* Фокусируем существующую вкладку */
        for (const client of list) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "NAVIGATE", url });
            return client.focus();
          }
        }
        /* Или открываем новую */
        return clients.openWindow(url);
      })
  );
});

/* ─── ЗАКРЫТИЕ УВЕДОМЛЕНИЯ ───────────────────────────────────────────────── */
self.addEventListener("notificationclose", () => {
  /* Можно логировать отклонённые уведомления */
});

/* ─── СООБЩЕНИЯ ОТ ПРИЛОЖЕНИЯ ────────────────────────────────────────────── */
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (e.data && e.data.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});