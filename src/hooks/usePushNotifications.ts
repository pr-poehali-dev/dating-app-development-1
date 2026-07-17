import { useEffect, useRef, useCallback } from "react";
import { pushApi } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(enabled: boolean) {
  const subscribedRef = useRef(false);

  const subscribe = useCallback(async () => {
    if (subscribedRef.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      // Регистрируем SW
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // Получаем публичный ключ
      const { public_key } = await pushApi.vapidPublicKey();
      if (!public_key) return;

      // Проверяем разрешение
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // Подписываемся
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key) as BufferSource,
      });

      await pushApi.subscribe(sub.toJSON() as PushSubscriptionJSON);
      subscribedRef.current = true;
    } catch {
      // Тихо игнорируем — push не критичен
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Небольшая задержка чтобы не мешать загрузке приложения
    const t = setTimeout(subscribe, 3000);
    return () => clearTimeout(t);
  }, [enabled, subscribe]);
}

export default usePushNotifications;