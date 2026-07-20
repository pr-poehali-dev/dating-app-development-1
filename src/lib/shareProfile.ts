import { nativeShare } from "@/hooks/useNative";

// Публичный домен сайта. В APK/WebView window.location.origin может быть file://
// или локальным адресом, поэтому ссылку на профиль всегда строим на боевой домен.
const SITE_ORIGIN = "https://полуто-н.рф";

export function profileUrl(userId: number): string {
  return `${SITE_ORIGIN}/?user=${userId}`;
}

/**
 * Делится профилем пользователя: системный шэринг, либо копирование ссылки.
 * Возвращает true, если ссылка была скопирована (для показа тоста).
 */
export async function shareProfile(userId: number, name: string): Promise<"shared" | "copied" | "fail"> {
  const url = profileUrl(userId);
  if (navigator.share) {
    try {
      await navigator.share({ title: `${name} — Полутон`, text: `Познакомься с ${name} в Полутон!`, url });
      return "shared";
    } catch {
      return "fail";
    }
  }
  const ok = await nativeShare({ title: name, url });
  return ok ? "copied" : "fail";
}
