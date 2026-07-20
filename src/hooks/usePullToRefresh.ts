import { useEffect, useRef, useCallback } from "react";

// Порог активации подобран под комфортный жест одним пальцем (не через весь экран).
const THRESHOLD = 80;
const MAX_PULL = 130;
const ACTIVATE_AT = 24;

function haptic() {
  try { navigator.vibrate?.(12); } catch { /* ignore */ }
}

export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const startY = useRef(0);
  const startX = useRef(0);
  const pulling = useRef(false);
  const indicator = useRef<HTMLDivElement | null>(null);
  const refreshing = useRef(false);
  const armed = useRef(false); // достигнут ли порог (для haptic + смены иконки)

  // Круглый нативно-выглядящий индикатор со спиннером
  const getIndicator = useCallback(() => {
    if (indicator.current) return indicator.current;
    const el = document.createElement("div");
    el.id = "__ptr_indicator__";
    el.style.cssText = `
      position: fixed;
      top: calc(env(safe-area-inset-top, 0px) + 8px);
      left: 50%;
      z-index: 9999;
      width: 40px;
      height: 40px;
      margin-left: -20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #1a1330;
      box-shadow: 0 6px 22px rgba(255,45,120,0.45), 0 0 0 1px rgba(255,255,255,0.06);
      transform: translateY(-64px) scale(0.6);
      opacity: 0;
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
      pointer-events: none;
    `;
    el.innerHTML = `
      <svg id="__ptr_svg__" width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="url(#__ptr_grad__)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
        style="transition:transform 0.2s">
        <defs>
          <linearGradient id="__ptr_grad__" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0" stop-color="#FF2D78"/>
            <stop offset="1" stop-color="#9B59B6"/>
          </linearGradient>
        </defs>
        <path id="__ptr_path__" d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
    `;
    document.body.appendChild(el);
    indicator.current = el;
    return el;
  }, []);

  const showRefreshing = useCallback((el: HTMLDivElement) => {
    el.style.transform = "translateY(0px) scale(1)";
    el.style.opacity = "1";
    const svg = el.querySelector("#__ptr_svg__") as SVGElement | null;
    const path = el.querySelector("#__ptr_path__") as SVGElement | null;
    if (path) path.setAttribute("d", "M21 12a9 9 0 1 1-9-9");
    if (svg) {
      svg.style.transform = "rotate(0deg)";
      svg.style.animation = "ptr-spin 0.7s linear infinite";
    }
    haptic();
  }, []);

  const resetIndicator = useCallback((el: HTMLDivElement) => {
    el.style.transform = "translateY(-64px) scale(0.6)";
    el.style.opacity = "0";
    const svg = el.querySelector("#__ptr_svg__") as SVGElement;
    const path = el.querySelector("#__ptr_path__") as SVGElement;
    setTimeout(() => {
      if (svg) { svg.style.removeProperty("animation"); svg.style.transform = "rotate(0deg)"; }
      if (path) path.setAttribute("d", "M12 5v14M5 12l7 7 7-7");
    }, 280);
  }, []);

  useEffect(() => {
    if (!document.getElementById("__ptr_keyframes__")) {
      const style = document.createElement("style");
      style.id = "__ptr_keyframes__";
      style.textContent = "@keyframes ptr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
      document.head.appendChild(style);
    }

    // Скроллящийся контейнер под пальцем — чтобы физически «оттягивать» его вниз.
    let scrollEl: HTMLElement | null = null;

    const findScrollEl = (target: EventTarget | null): HTMLElement | null => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body && el !== document.documentElement) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) return el;
        el = el.parentElement;
      }
      return null;
    };

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

    const clearPull = () => {
      if (scrollEl) {
        scrollEl.style.transition = "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)";
        scrollEl.style.transform = "";
        const el = scrollEl;
        setTimeout(() => { if (el && !pulling.current && !refreshing.current) el.style.transition = ""; }, 300);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing.current || isScrolledFromTop(e.target)) { pulling.current = false; return; }
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      pulling.current = true;
      armed.current = false;
      scrollEl = findScrollEl(e.target);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing.current) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;

      if (dy <= 0 || Math.abs(dx) > Math.abs(dy) + 20) { pulling.current = false; return; }
      if (isScrolledFromTop(e.target)) { pulling.current = false; return; }
      if (dy < ACTIVATE_AT) return;

      e.preventDefault();

      const adjusted = dy - ACTIVATE_AT;
      const clamped = Math.min(adjusted, MAX_PULL);
      const progress = clamped / THRESHOLD;
      const el = getIndicator();

      // Физически оттягиваем контент вниз с сопротивлением — это и даёт ощущение обновления
      if (scrollEl) {
        scrollEl.style.transition = "none";
        scrollEl.style.transform = `translateY(${clamped * 0.5}px)`;
      }

      el.style.transition = "opacity 0.15s";
      el.style.transform = `translateY(${Math.min(clamped * 0.55, 56) - 20}px) scale(${Math.min(0.6 + progress * 0.4, 1)})`;
      el.style.opacity = `${Math.min(progress, 1)}`;

      const svg = el.querySelector("#__ptr_svg__") as SVGElement;
      if (progress >= 1) {
        if (!armed.current) { armed.current = true; haptic(); }
        if (svg) svg.style.transform = "rotate(180deg)";
      } else {
        armed.current = false;
        if (svg) svg.style.transform = "rotate(0deg)";
      }
    };

    const onTouchEnd = async (e: TouchEvent) => {
      if (!pulling.current || refreshing.current) return;
      pulling.current = false;
      const dy = e.changedTouches[0].clientY - startY.current - ACTIVATE_AT;
      const el = getIndicator();
      el.style.transition = "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s";

      if (dy >= THRESHOLD) {
        refreshing.current = true;
        clearPull();
        showRefreshing(el);
        const minDelay = new Promise((r) => setTimeout(r, 600));
        try { await Promise.all([onRefresh(), minDelay]); } catch { /* ignore */ }
        resetIndicator(el);
        refreshing.current = false;
      } else {
        clearPull();
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
  }, [onRefresh, getIndicator, resetIndicator, showRefreshing]);
}
