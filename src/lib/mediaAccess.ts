// ─── Диагностика доступа к микрофону / камере ───────────────────────────────
// Возвращает понятное сообщение об ошибке ДО вызова getUserMedia,
// либо разбирает исключение ПОСЛЕ него.

/** Открыт ли сайт внутри iframe (например, в превью-окне редактора) */
export function isInsideIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // доступ к window.top заблокирован — значит мы в кросс-доменном iframe
  }
}

/**
 * Проверяет предусловия для доступа к медиа.
 * Возвращает строку-ошибку, если доступ заведомо невозможен, иначе null.
 */
export function checkMediaPrereqs(kind: "микрофону" | "микрофону и камере"): string | null {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return "Доступ недоступен: открой сайт по защищённому адресу (https://).";
  }
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    if (isInsideIframe()) {
      return `Доступ к ${kind} заблокирован в этом окне предпросмотра. Открой сайт в отдельной вкладке браузера.`;
    }
    return `Твой браузер не поддерживает доступ к ${kind}. Обнови браузер.`;
  }
  return null;
}

interface MediaErrorLike { name?: string }

/** Разбирает исключение getUserMedia в понятное сообщение */
export async function describeMediaError(
  e: unknown,
  kind: "микрофону" | "микрофону и камере",
  device: "microphone" | "camera",
): Promise<string> {
  const err = e as MediaErrorLike;
  const name = err?.name;

  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    if (isInsideIframe()) {
      return `Доступ к ${kind} заблокирован в окне предпросмотра. Открой сайт в отдельной вкладке браузера и разреши доступ.`;
    }
    let deniedBySystem = false;
    try {
      const perm = await navigator.permissions?.query({ name: device as PermissionName });
      if (perm?.state === "denied") deniedBySystem = true;
    } catch { /* Permissions API может не поддерживаться */ }

    if (deniedBySystem) {
      return `Доступ к ${kind} запрещён. Нажми на 🔒 в адресной строке браузера → Разрешения → включи доступ, затем обнови страницу.`;
    }
    return `Нужен доступ к ${kind}. Повтори действие и разреши доступ во всплывающем окне браузера.`;
  }
  if (name === "NotReadableError") {
    return "Устройство занято другим приложением. Закрой его и попробуй снова.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return device === "camera"
      ? "Камера или микрофон не найдены на устройстве."
      : "Микрофон не найден на устройстве.";
  }
  return `Не удалось получить доступ к ${kind}. Попробуй ещё раз.`;
}
