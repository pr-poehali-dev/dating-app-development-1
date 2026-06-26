import { useEffect, useRef } from "react";

const MIN_SWIPE_X = 55;
const MAX_SWIPE_Y = 80;

export function useSwipeNav(
  screens: string[],
  current: string,
  onChange: (screen: string) => void,
  enabled: boolean,
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      swiping.current = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!swiping.current) return;
      swiping.current = false;

      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current);

      if (Math.abs(dx) < MIN_SWIPE_X || dy > MAX_SWIPE_Y) return;

      const idx = screens.indexOf(current);
      if (idx === -1) return;

      if (dx < 0 && idx < screens.length - 1) {
        onChange(screens[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        onChange(screens[idx - 1]);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!swiping.current) return;
      const dx = Math.abs(e.touches[0].clientX - startX.current);
      const dy = Math.abs(e.touches[0].clientY - startY.current);
      // Если горизонтальный свайп — блокируем вертикальный скролл
      if (dx > dy && dx > 10) e.preventDefault();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [screens, current, onChange, enabled]);
}
