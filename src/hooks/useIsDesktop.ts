import { useState, useEffect } from "react";

const DESKTOP_BREAKPOINT = 900;

/**
 * Определяет, показывать ли десктопную версию интерфейса (боковая навигация,
 * широкая сетка). В собранном APK/мобильном вебвью ширина экрана всегда узкая,
 * поэтому там всегда рендерится мобильный интерфейс.
 */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}
