// Определяет, запущено ли приложение как установленное (APK / PWA standalone),
// а не в обычной вкладке браузера. В APK manifest использует display: fullscreen,
// поэтому проверяем все display-режимы полноэкранного/приложенческого вида.
export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const mm = (mode: string) => window.matchMedia?.(`(display-mode: ${mode})`).matches;
    if (mm("standalone") || mm("fullscreen") || mm("minimal-ui")) return true;
    // iOS Safari «Добавить на экран Домой»
    if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true;
    // Android TWA передаёт этот referrer
    if (document.referrer.startsWith("android-app://")) return true;
  } catch {
    /* ignore */
  }
  return false;
}
