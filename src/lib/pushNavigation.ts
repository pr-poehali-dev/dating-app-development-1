// Переход на нужный экран при нажатии на push-уведомление.
// Работает и в веб-версии (через service worker), и в нативной обёртке
// (через deep-link вида poluton://open/чат?id=12).

/** Превращает любую ссылку из уведомления в путь внутри приложения. */
export function pushUrlToPath(raw: string): string {
  if (!raw) return "/";
  let url = raw.trim();

  // Deep-link собственной схемы: poluton://open/path?x=1
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url) && !/^https?:/i.test(url)) {
    const afterScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    const slash = afterScheme.indexOf("/");
    url = slash === -1 ? "/" : afterScheme.slice(slash);
    return url || "/";
  }

  // Обычный адрес сайта — берём только путь
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname + u.search + u.hash;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

/** Переводит приложение на путь из уведомления без перезагрузки страницы. */
export function navigateFromPush(raw: string) {
  const path = pushUrlToPath(raw);
  if (!path || path === window.location.pathname + window.location.search) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.dispatchEvent(new CustomEvent("app:push-navigate", { detail: { path } }));
}

/**
 * Подключает слушателей перехода по уведомлению:
 * — сообщение NAVIGATE от service worker (веб / PWA);
 * — событие deep-link от нативной обёртки приложения.
 */
export function initPushNavigation() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (e: MessageEvent) => {
      const data = e.data as { type?: string; url?: string } | undefined;
      if (data?.type === "NAVIGATE" && data.url) navigateFromPush(data.url);
    });
  }

  // Нативная обёртка передаёт открытый deep-link через это событие
  const onDeepLink = (e: Event) => {
    const detail = (e as CustomEvent).detail as { url?: string; path?: string } | undefined;
    const target = detail?.url || detail?.path;
    if (target) navigateFromPush(target);
  };
  window.addEventListener("deeplink", onDeepLink);
  window.addEventListener("appUrlOpen", onDeepLink);

  // Некоторые обёртки кладут стартовый путь в window — читаем при запуске
  const initial = (window as unknown as { __APP_DEEPLINK__?: string }).__APP_DEEPLINK__;
  if (initial) navigateFromPush(initial);
}
