import { useEffect, useRef } from "react";

/**
 * Подписывается на глобальное событие "app:refresh" (срабатывает при
 * свайпе вниз для обновления) и вызывает переданный колбэк — без
 * перезагрузки всей страницы. Колбэк всегда берётся из последнего рендера.
 */
export function useAppRefresh(callback: () => void | Promise<void>) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const handler = () => { cbRef.current(); };
    window.addEventListener("app:refresh", handler);
    return () => window.removeEventListener("app:refresh", handler);
  }, []);
}
