import { useEffect, useRef, useState } from "react";

export function useScreenshotProtection() {
  const [showWarning, setShowWarning] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerWarning = () => {
    setShowWarning(true);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => setShowWarning(false), 4000);
  };

  useEffect(() => {
    // ── Android / iOS PWA: когда приложение уходит в фон (скриншот, свёртывание) ──
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Мгновенно блюрим контент
        setIsBlurred(true);
      } else {
        // Возвращаемся — показываем предупреждение и убираем блюр через 600ms
        triggerWarning();
        if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
        blurTimerRef.current = setTimeout(() => setIsBlurred(false), 600);
      }
    };

    // ── Потеря фокуса окна (Android свёртывание, Recents, скриншот) ──
    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      triggerWarning();
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => setIsBlurred(false), 600);
    };

    // ── Клавиатурные комбинации скриншота на десктопе ──
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        setIsBlurred(true);
        triggerWarning();
        setTimeout(() => setIsBlurred(false), 1500);
      }
      // Cmd+Shift+3 / Cmd+Shift+4 (macOS)
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "s")) {
        setIsBlurred(true);
        triggerWarning();
        setTimeout(() => setIsBlurred(false), 1500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("keydown", handleKeyDown);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  return { showWarning, isBlurred };
}
