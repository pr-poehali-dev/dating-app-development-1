import { useEffect } from "react";
import { configApi } from "@/lib/api";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: OneSignalApi) => void>;
    __oneSignalInited?: boolean;
  }
}

interface OneSignalApi {
  init: (config: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  Slidedown: { promptPush: () => Promise<void> };
  User?: {
    PushSubscription?: {
      optIn?: () => Promise<void>;
      optOut?: () => Promise<void>;
      optedIn?: boolean;
    };
  };
  Notifications: {
    permission: boolean;
    requestPermission: () => Promise<void>;
  };
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    if (document.getElementById("onesignal-sdk")) return resolve();
    const s = document.createElement("script");
    s.id = "onesignal-sdk";
    s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("OneSignal SDK не загрузился"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export async function initOneSignal(): Promise<void> {
  if (window.__oneSignalInited) return;
  let appId = "";
  try {
    const r = await configApi.oneSignalAppId();
    appId = (r.app_id || "").trim();
  } catch { return; }
  if (!appId) return;
  window.__oneSignalInited = true;

  try {
    await loadSdk();
  } catch { window.__oneSignalInited = false; return; }
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.init({
        appId,
        serviceWorkerPath: "OneSignalSDKWorker.js",
        serviceWorkerParam: { scope: "/onesignal/" },
        allowLocalhostAsSecureOrigin: true,
      });
    } catch { /* OneSignal init failed — не мешаем приложению */ }
  });
}

/** Запущено ли приложение внутри нативной APK/iOS-обёртки Median (GoNative). */
function isNativeApp(): boolean {
  const w = window as unknown as { median?: unknown; gonative?: unknown };
  if (w.median || w.gonative) return true;
  return /median|gonative/i.test(navigator.userAgent || "");
}

/**
 * Запрос разрешения на пуши внутри APK-обёртки Median.
 * В нативном приложении OneSignal Web SDK не работает — используем нативный мост Median,
 * который управляет системным разрешением на push. Возвращает true, если команда отправлена.
 */
function promptNativePush(): boolean {
  try {
    const w = window as unknown as {
      median?: { onesignal?: { promptForPushNotifications?: () => void; register?: () => void } };
      gonative?: { onesignal?: { promptForPushNotifications?: () => void; register?: () => void } };
    };
    const bridge = w.median?.onesignal || w.gonative?.onesignal;
    if (bridge?.promptForPushNotifications) { bridge.promptForPushNotifications(); return true; }
    if (bridge?.register) { bridge.register(); return true; }
    // Резервный способ — вызов по протоколу JS Bridge
    const scheme = (w as { gonative?: unknown; median?: unknown }).gonative && !(w as { median?: unknown }).median ? "gonative" : "median";
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = `${scheme}://onesignal/promptForPushNotifications`;
    document.body.appendChild(frame);
    setTimeout(() => frame.remove(), 300);
    return true;
  } catch {
    return false;
  }
}

/** Показать запрос подписки на пуши. Возвращает true, если разрешение получено. */
export async function promptOneSignal(): Promise<boolean> {
  // В APK OneSignal Web SDK не отвечает — идём через нативный мост Median
  if (isNativeApp()) {
    return promptNativePush();
  }

  await initOneSignal();
  return new Promise<boolean>((resolve) => {
    // Страховочный таймаут: если OneSignal SDK не ответил за 12 секунд — не зависаем
    const timer = setTimeout(() => resolve(false), 12000);
    const done = (v: boolean) => { clearTimeout(timer); resolve(v); };
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        // Заново подписываем, если ранее отписывался тумблером
        try { await OneSignal.User?.PushSubscription?.optIn?.(); } catch { /* ignore */ }
        done(!!OneSignal.Notifications.permission);
      } catch {
        done(false);
      }
    });
  });
}

export type PushStatus = "default" | "granted" | "denied" | "unsupported";

/** Текущий статус системного разрешения на push-уведомления. */
export function getPushStatus(): PushStatus {
  if (isNativeApp()) {
    // В нативной обёртке точный статус недоступен из JS — считаем "по умолчанию"
    return "default";
  }
  if (typeof Notification === "undefined") return "unsupported";
  const p = Notification.permission;
  if (p === "granted") return "granted";
  if (p === "denied") return "denied";
  return "default";
}

/**
 * Открыть системные настройки приложения (чтобы вручную включить уведомления).
 * Возвращает true ТОЛЬКО если реально удалось вызвать нативный мост.
 * Если моста нет — возвращаем false, чтобы показать инструкцию, а не открывать
 * левую ссылку (иначе телефон предложит «установить приложение банка» и т.п.).
 */
export function openNativeAppSettings(): boolean {
  try {
    const w = window as unknown as {
      median?: { open?: { appSettings?: () => void } };
      gonative?: { open?: { appSettings?: () => void } };
    };

    // Прямой вызов функции JS-моста Median/GoNative, если библиотека внедрена
    const bridgeOpen = w.median?.open?.appSettings || w.gonative?.open?.appSettings;
    if (typeof bridgeOpen === "function") { bridgeOpen(); return true; }

    // Моста нет — НЕ пытаемся открыть через iframe-протокол (это и даёт ложное
    // окно «установите приложение банка»). Просто сообщаем, что не удалось.
    return false;
  } catch {
    return false;
  }
}

/** Отписаться от push-уведомлений (выключение тумблера). */
export async function disableOneSignal(): Promise<boolean> {
  if (isNativeApp()) {
    // В нативной обёртке системное разрешение отзывается только в настройках телефона
    return false;
  }
  if (!window.__oneSignalInited) return true;
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(true), 8000);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try { await OneSignal.User?.PushSubscription?.optOut?.(); } catch { /* ignore */ }
      clearTimeout(timer);
      resolve(true);
    });
  });
}

/** Связать текущего пользователя с OneSignal (External ID = наш user id). */
export async function loginOneSignal(userId: number): Promise<void> {
  await initOneSignal();
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try { await OneSignal.login(String(userId)); } catch { /* ignore */ }
  });
}

/** Отвязать пользователя (при выходе). */
export function logoutOneSignal(): void {
  if (!window.__oneSignalInited) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try { await OneSignal.logout(); } catch { /* ignore */ }
  });
}

/** Автоматическая тихая инициализация при загрузке приложения. */
export function useOneSignal(): void {
  useEffect(() => {
    const t = setTimeout(() => { void initOneSignal(); }, 2500);
    return () => clearTimeout(t);
  }, []);
}