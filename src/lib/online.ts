// Единая логика онлайн-статуса по времени последней активности.
// Пользователь считается онлайн, если был в сети меньше 5 минут назад.

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function lastSeenMs(last_seen?: string | null): number {
  if (!last_seen) return 0;
  const iso = last_seen.endsWith("Z") ? last_seen : last_seen + "Z";
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

/**
 * Реальный онлайн-статус.
 * Если есть last_seen — считаем по нему (надёжно).
 * Если last_seen нет в данных — используем флаг online как запасной вариант.
 */
export function isUserOnline(last_seen?: string | null, onlineFlag?: boolean): boolean {
  const ts = lastSeenMs(last_seen);
  if (ts > 0) return Date.now() - ts < ONLINE_THRESHOLD_MS;
  return !!onlineFlag;
}

/** Человекочитаемый статус: "был(а) N мин. назад" и т.п. */
export function lastSeenLabel(last_seen?: string | null, onlineFlag?: boolean): string {
  if (isUserOnline(last_seen, onlineFlag)) return "онлайн";
  const ts = lastSeenMs(last_seen);
  if (!ts) return "не в сети";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `был(а) ${mins} мин. назад`;
  if (hours < 24) return `был(а) ${hours} ч. назад`;
  if (days < 7) return `был(а) ${days} дн. назад`;
  return "давно не в сети";
}
