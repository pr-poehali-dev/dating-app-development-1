import { isStandaloneApp } from "@/lib/isStandalone";

// Публичный домен сайта. В APK/WebView window.location.origin может быть file://
// или локальным адресом, поэтому правовые страницы всегда открываем на боевом домене.
// Браузер сам преобразует кириллицу в punycode при переходе.
const SITE_ORIGIN = "https://полуто-н.рф";

export type LegalTab = "terms" | "privacy" | "offer";

export function legalUrl(tab: LegalTab): string {
  return `${SITE_ORIGIN}/${tab}`;
}

/**
 * Открывает правовой документ во ВНЕШНЕМ браузере, если приложение запущено
 * как установленное (APK / PWA standalone). В обычном браузере ничего не делает.
 *
 * @returns true — документ открыт снаружи (внутренний Sheet показывать не нужно).
 *          false — мы в обычном вебе, показываем документ внутри приложения.
 */
export function openLegalExternally(tab: LegalTab): boolean {
  if (!isStandaloneApp()) return false;

  const url = legalUrl(tab);

  // Median/GoNative WebView: явно просим системный браузер, иначе ссылка
  // откроется внутри той же нативной обёртки.
  try {
    const w = window as unknown as {
      median?: { window?: { open?: (o: { url: string; target?: string }) => void } };
      gonative?: { window?: { open?: (o: { url: string; target?: string }) => void } };
    };
    const bridge = w.median?.window?.open || w.gonative?.window?.open;
    if (bridge) {
      bridge({ url, target: "external" });
      return true;
    }
  } catch {
    /* ignore, попробуем обычный способ ниже */
  }

  // Универсальный способ — открыть в новой вкладке/внешнем браузере.
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    window.location.href = url;
  }
  return true;
}
