import { useState, useCallback, useEffect } from "react";

export type AppIcon = "default" | "gradient" | "dark" | "ocean" | "gold" | "minimal";

export const APP_ICON_META: Record<AppIcon, { label: string; sub: string; url: string; medianAlias: string }> = {
  default:  { label: "Основная", sub: "Розово-фиолетовое сердце", url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/87e87f49-8dbc-4d97-814b-fa5070124434.png", medianAlias: "default" },
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

type MedianBridge = {
  median?: { appIcon?: { select?: (o: { icon: string }) => void }; run?: (cmd: string) => void };
  gonative?: { appIcon?: { select?: (o: { icon: string }) => void }; run?: (cmd: string) => void };
};

/**
 * Определяет, запущено ли приложение внутри нативной APK/iOS-обёртки Median (GoNative).
 * Иконку на рабочем столе телефона можно менять ТОЛЬКО здесь — в обычном браузере
 * и в PWA это технически невозможно.
 */
export function isNativeApp(): boolean {
  const w = window as unknown as MedianBridge;
  if (w.median || w.gonative) return true;
  const ua = navigator.userAgent || "";
  return /median|gonative/i.test(ua);
}

/**
 * Меняет иконку приложения на домашнем экране телефона через нативный мост Median.
 * Алиасы (default/gradient/dark/ocean/gold/minimal) должны быть заранее заведены
 * в сборке APK/iOS (плагин Alternate App Icons). Возвращает true, если команда отправлена.
 */
function applyNativeIcon(icon: AppIcon): boolean {
  const alias = APP_ICON_META[icon].medianAlias;
  try {
    const w = window as unknown as MedianBridge;
    const bridge = w.median?.appIcon || w.gonative?.appIcon;
    if (bridge?.select) {
      bridge.select({ icon: alias });
      return true;
    }
    // Резервный способ — прямой вызов по протоколу JS Bridge (median:// или gonative://)
    if (w.median || w.gonative) {
      const scheme = w.gonative && !w.median ? "gonative" : "median";
      const frame = document.createElement("iframe");
      frame.style.display = "none";
      frame.src = `${scheme}://appIcon/select?icon=${encodeURIComponent(alias)}`;
      document.body.appendChild(frame);
      setTimeout(() => frame.remove(), 300);
      return true;
    }
  } catch {
    /* нет нативной обёртки */
  }
  return false;
}

/**
 * Хук управления иконкой приложения на домашнем экране (только внутри APK/iOS-обёртки Median).
 * В обычном браузере смена невозможна — native = false, выбор не применяется.
 */
export function useAppIcon() {
  const [icon, setIconState] = useState<AppIcon>(getSaved);
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(isNativeApp());
  }, []);

  const setIcon = useCallback((next: AppIcon) => {
    const ok = applyNativeIcon(next);
    if (!ok) return; // в браузере/PWA ничего не меняем
    setIconState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { icon, setIcon, native };
}