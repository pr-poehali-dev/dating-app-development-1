// Настройки входящих видеозвонков. Хранятся локально на устройстве —
// это настройки самого приложения, а не профиля.

const KEY = "poluton_call_settings";

export interface CallSettings {
  /** Блокировать все входящие видеочаты */
  blockAll: boolean;
  /** Оповещения о звонках (звук и вибрация) */
  alerts: boolean;
  /** Уведомления с высоким приоритетом (показывать поверх экрана) */
  highPriority: boolean;
}

const DEFAULTS: CallSettings = { blockAll: false, alerts: true, highPriority: true };

export function getCallSettings(): CallSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveCallSettings(next: CallSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Синхронная проверка: пользователь запретил все входящие видеозвонки. */
export function isAllCallsBlocked(): boolean {
  return getCallSettings().blockAll;
}

/** Включены ли звук и вибрация при входящем звонке. */
export function isCallAlertsOn(): boolean {
  return getCallSettings().alerts;
}
