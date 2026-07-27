import { useState, useCallback, useEffect } from "react";

export type AppIcon = "default" | "gradient" | "dark" | "ocean" | "gold" | "minimal";

export const APP_ICON_META: Record<AppIcon, { label: string; sub: string; url: string; medianAlias: string }> = {
  default:  { label: "Основная", sub: "Розово-фиолетовое сердце", url: "/appicon-default.png", medianAlias: "default" },
  gradient: { label: "Градиент", sub: "Сердце на градиенте",      url: "/appicon-gradient.png", medianAlias: "gradient" },
  dark:     { label: "Тёмная",   sub: "Неоновое сердце",           url: "/appicon-dark.png", medianAlias: "dark" },
  ocean:    { label: "Океан",    sub: "Сине-голубые тона",         url: "/appicon-ocean.png", medianAlias: "ocean" },
  gold:     { label: "Золото",   sub: "Янтарно-золотое сердце",    url: "/appicon-gold.png", medianAlias: "gold" },
  minimal:  { label: "Минимал",  sub: "Контурное сердце",          url: "/appicon-minimal.png", medianAlias: "minimal" },
};

export const APP_ICON_ORDER: AppIcon[] = ["default", "gradient", "dark"];

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