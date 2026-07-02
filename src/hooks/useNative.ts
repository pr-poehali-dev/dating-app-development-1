/**
 * useNative — нативные возможности устройства через Web API
 * Haptics (вибрация), Share (поделиться), StatusBar, Clipboard, Badge
 * Работает как в браузере, так и в PWA/WebView без сторонних зависимостей
 */

/* ─── Haptics ─────────────────────────────────────────────────────────────── */

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

const HAPTIC_PATTERNS: Record<HapticStyle, number[]> = {
  light:     [30],
  medium:    [60],
  heavy:     [100],
  success:   [40, 30, 40],
  warning:   [80, 40, 80],
  error:     [120, 60, 120, 60, 120],
  selection: [20],
};

export function haptic(style: HapticStyle = "light") {
  if (!navigator.vibrate) return;
  navigator.vibrate(HAPTIC_PATTERNS[style]);
}

/* ─── Share ───────────────────────────────────────────────────────────────── */

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export async function nativeShare(data: ShareData): Promise<boolean> {
  if (navigator.share && navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }
  // Fallback — копируем ссылку в буфер
  if (data.url && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(data.url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/* ─── Clipboard ───────────────────────────────────────────────────────────── */

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback для старых браузеров
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/* ─── App Badge (иконка приложения) ──────────────────────────────────────── */

export async function setAppBadge(count: number) {
  if ("setAppBadge" in navigator) {
    try {
      if (count > 0) {
        await (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> }).setAppBadge(count);
      } else {
        await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }
    } catch { /* не критично */ }
  }
}

/* ─── Screen Wake Lock (экран не гаснет при видеозвонке) ─────────────────── */

let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch { /* не поддерживается */ }
}

export async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}

/* ─── Fullscreen ──────────────────────────────────────────────────────────── */

export function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
}

export function exitFullscreen() {
  if (document.exitFullscreen && document.fullscreenElement) {
    document.exitFullscreen();
  }
}

/* ─── Network Info ────────────────────────────────────────────────────────── */

export function getConnectionType(): string {
  const conn = (navigator as Navigator & {
    connection?: { effectiveType: string }
  }).connection;
  return conn?.effectiveType ?? "unknown";
}

/* ─── useNative hook ──────────────────────────────────────────────────────── */

const useNative = () => ({
  haptic,
  share: nativeShare,
  copy: copyToClipboard,
  setAppBadge,
  requestWakeLock,
  releaseWakeLock,
  requestFullscreen,
  exitFullscreen,
  getConnectionType,
  /** Проверка: поддерживается ли нативный шаринг */
  canShare: !!navigator.share,
  /** Поддерживается ли вибрация */
  canVibrate: !!navigator.vibrate,
});

export default useNative;
