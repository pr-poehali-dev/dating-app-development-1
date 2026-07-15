import { useState, useCallback } from "react";

export type AppTheme = "aurora" | "midnight" | "amber";

export const THEME_META: Record<AppTheme, { label: string; sub: string; swatch: [string, string] }> = {
  aurora:   { label: "Аврора",   sub: "Розово-фиолетовое сияние", swatch: ["#FF2D78", "#9B59B6"] },
  midnight: { label: "Полночь",  sub: "Холодные синие тона",      swatch: ["#00D4FF", "#3B82F6"] },
  amber:    { label: "Янтарь",   sub: "Тёплое золотое свечение",  swatch: ["#FFB300", "#FF5A5F"] },
};

const THEME_CLASSES: Record<AppTheme, string | null> = {
  aurora: null,
  midnight: "theme-midnight",
  amber: "theme-amber",
};

function applyThemeClass(theme: AppTheme) {
  const root = document.documentElement;
  Object.values(THEME_CLASSES).forEach(cls => { if (cls) root.classList.remove(cls); });
  const cls = THEME_CLASSES[theme];
  if (cls) root.classList.add(cls);
}

/** Применяется один раз при загрузке приложения (до первого рендера React). */
export function initAppTheme() {
  const saved = (localStorage.getItem("app_theme") as AppTheme | null) || "aurora";
  applyThemeClass(saved);
}

/**
 * Хук управления темой оформления приложения.
 * Три тёмные темы на выбор: Aurora (по умолчанию), Полночь, Янтарь.
 */
export function useAppTheme() {
  const [theme, setThemeState] = useState<AppTheme>(
    () => (localStorage.getItem("app_theme") as AppTheme | null) || "aurora"
  );

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    localStorage.setItem("app_theme", next);
    applyThemeClass(next);
  }, []);

  return { theme, setTheme };
}
