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

  await loadSdk();
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId,
      serviceWorkerPath: "OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/onesignal/" },
      allowLocalhostAsSecureOrigin: true,
    });
  });
}

/** Показать запрос подписки на пуши. Возвращает true, если разрешение получено. */
export async function promptOneSignal(): Promise<boolean> {
  await initOneSignal();
  return new Promise<boolean>((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        resolve(!!OneSignal.Notifications.permission);
      } catch {
        resolve(false);
      }
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