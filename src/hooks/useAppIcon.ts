import { useState, useCallback } from "react";

export type AppIcon = "default" | "gradient" | "dark" | "ocean" | "gold" | "minimal";

export const APP_ICON_META: Record<AppIcon, { label: string; sub: string; url: string; medianAlias: string }> = {
  default:  { label: "Основная", sub: "Розово-фиолетовое сердце", url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ac307e11-92ac-4980-a16e-79a0e7633113.jpg", medianAlias: "default" },
  gradient: { label: "Градиент", sub: "Сердце на градиенте",      url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/586e5a5f-3f2d-432c-af20-cdda4901e840.jpg", medianAlias: "gradient" },
  dark:     { label: "Тёмная",   sub: "Неоновое сердце",           url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/e6f79ac3-ab5d-4321-8d37-11acd1d894ea.jpg", medianAlias: "dark" },
  ocean:    { label: "Океан",    sub: "Сине-голубые тона",         url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/012d7f80-cfb8-4f86-bad5-5c98228bf889.jpg", medianAlias: "ocean" },
  gold:     { label: "Золото",   sub: "Янтарно-золотое сердце",    url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/305d50f7-3b66-4b0a-af38-3ee4abf503a3.jpg", medianAlias: "gold" },
  minimal:  { label: "Минимал",  sub: "Контурное сердце",          url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/545544ca-d8bb-40d1-b61a-6f490268781a.jpg", medianAlias: "minimal" },
};

export const APP_ICON_ORDER: AppIcon[] = ["default", "gradient", "dark", "ocean", "gold", "minimal"];

const STORAGE_KEY = "app_icon";

function getSaved(): AppIcon {
  const v = localStorage.getItem(STORAGE_KEY) as AppIcon | null;
  return v && APP_ICON_META[v] ? v : "default";
}

/** Меняет favicon и apple-touch-icon в <head> на выбранную иконку. */
function applyFavicon(icon: AppIcon) {
  const url = APP_ICON_META[icon].url;
  const selectors = ['link[rel="icon"]', 'link[rel="apple-touch-icon"]'];
  selectors.forEach((sel) => {
    document.querySelectorAll<HTMLLinkElement>(sel).forEach((link) => {
      link.href = url;
    });
  });
}

/**
 * Пытается сменить иконку нативно, если приложение запущено внутри APK-обёртки Median (GoNative).
 * Если моста нет (обычный браузер) — тихо ничего не делает.
 */
function applyNativeIcon(icon: AppIcon) {
  const alias = APP_ICON_META[icon].medianAlias;
  try {
    const w = window as unknown as {
      median?: { appIcon?: { select?: (o: { icon: string }) => void } };
      gonative?: { appIcon?: { select?: (o: { icon: string }) => void } };
    };
    const bridge = w.median?.appIcon || w.gonative?.appIcon;
    if (bridge?.select) {
      bridge.select({ icon: alias });
      return;
    }
    // Резервный способ Median — навигация по спец-ссылке JS Bridge
    if (w.median || w.gonative) {
      const frame = document.createElement("iframe");
      frame.style.display = "none";
      frame.src = `median://appIcon/select?icon=${encodeURIComponent(alias)}`;
      document.body.appendChild(frame);
      setTimeout(() => frame.remove(), 300);
    }
  } catch {
    /* нет нативной обёртки — работаем как обычный сайт */
  }
}

/** Применяется один раз при загрузке приложения. */
export function initAppIcon() {
  applyFavicon(getSaved());
}

/**
 * Хук управления иконкой приложения.
 * Меняет favicon/PWA-иконку сразу и пытается применить нативную иконку в APK (Median).
 */
export function useAppIcon() {
  const [icon, setIconState] = useState<AppIcon>(getSaved);

  const setIcon = useCallback((next: AppIcon) => {
    setIconState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyFavicon(next);
    applyNativeIcon(next);
  }, []);

  return { icon, setIcon };
}
