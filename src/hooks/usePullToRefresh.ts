import { useEffect, useRef, useCallback } from "react";

const THRESHOLD = 120;
const MAX_PULL = 160;
const ACTIVATE_AT = 24;

export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const startY = useRef(0);
  const startX = useRef(0);
  const pulling = useRef(false);
  const indicator = useRef<HTMLDivElement | null>(null);
  const refreshing = useRef(false);

  const getIndicator = useCallback(() => {
    if (indicator.current) return indicator.current;
    const el = document.createElement("div");
    el.id = "__ptr_indicator__";
    el.style.cssText = `
      position: fixed;
      top: env(safe-area-inset-top, 0px);
      left: 50%;
      transform: translateX(-50%) translateY(-60px);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 999px;
      background: linear-gradient(135deg, #FF2D78, #9B59B6);
      color: white;
      font-size: 13px;
      font-weight: 600;
      font-family: system-ui, sans-serif;
      pointer-events: none;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
      opacity: 0;
      box-shadow: 0 4px 20px rgba(255,45,120,0.4);
      white-space: nowrap;
    `;
    el.innerHTML = `
      <svg id="__ptr_arrow__" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.2s">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
      <span id="__ptr_text__">Потяните вниз</span>
    `;
    document.body.appendChild(el);
    indicator.current = el;
    return el;
  }, []);

  const resetIndicator = useCallback((el: HTMLDivElement) => {
    el.style.transform = "translateX(-50%) translateY(-60px)";
    el.style.opacity = "0";
    const arrow = el.querySelector("#__ptr_arrow__") as SVGElement;
    const text = el.querySelector("#__ptr_text__") as HTMLElement;
    setTimeout(() => {
      if (arrow) {
        arrow.style.removeProperty("animation");
        arrow.innerHTML = `<path d="M12 5v14M5 12l7 7 7-7"/>`;
      }
      if (text) text.textContent = "Потяните вниз";
    }, 250);
  }, []);

  useEffect(() => {
    // Проверяем, что ни один скролл-контейнер под пальцем не прокручен вниз.
    // Лента скроллится во вложенном div с overflow, поэтому window.scrollY тут не подходит.
    const isScrolledFromTop = (target: EventTarget | null) => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body && el !== document.documentElement) {
        const oy = getComputedStyle(el).overflowY;
        const scrollable = (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight;
        if (scrollable && el.scrollTop > 0) return true;
        el = el.parentElement;
      }
      return window.scrollY > 0 || document.documentElement.scrollTop > 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      // Запускаем жест только если ничего не прокручено вниз от самого верха
      if (isScrolledFromTop(e.target)) { pulling.current = false; return; }
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing.current) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;

      // Игнорируем, если жест скорее горизонтальный (свайп) или вверх
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { pulling.current = false; return; }

      // Если в процессе контейнер оказался прокручен — отменяем (это обычный скролл)
      if (isScrolledFromTop(e.target)) { pulling.current = false; return; }

      // Пока не потянули достаточно — не вмешиваемся, даём листать ленту нативно
      if (dy < ACTIVATE_AT) return;

      // Подавляем нативный скролл только после активации
      e.preventDefault();

      const adjusted = dy - ACTIVATE_AT;
      const clamped = Math.min(adjusted, MAX_PULL);
      const progress = clamped / THRESHOLD;
      const el = getIndicator();

      const translateY = Math.min(clamped * 0.55, 52);
      el.style.transform = `translateX(-50%) translateY(${translateY}px)`;
      el.style.opacity = `${Math.min(progress, 1)}`;

      const arrow = el.querySelector("#__ptr_arrow__") as SVGElement;
      const text = el.querySelector("#__ptr_text__") as HTMLElement;
      if (progress >= 1) {
        if (arrow) arrow.style.transform = "rotate(180deg)";
        if (text) text.textContent = "Отпустите";
      } else {
        if (arrow) arrow.style.transform = "rotate(0deg)";
        if (text) text.textContent = "Потяните вниз";
      }
    };

    const onTouchEnd = async (e: TouchEvent) => {
      if (!pulling.current || refreshing.current) return;
      pulling.current = false;
      const dy = e.changedTouches[0].clientY - startY.current - ACTIVATE_AT;
      const el = getIndicator();

      if (dy >= THRESHOLD) {
        refreshing.current = true;
        resetIndicator(el);

        try { await onRefresh(); } catch (_e) { /* ignore */ }

        refreshing.current = false;
      } else {
        resetIndicator(el);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, getIndicator, resetIndicator]);
}