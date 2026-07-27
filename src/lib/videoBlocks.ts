// Локальный список пользователей, которым запрещены видеозвонки.
// Хранится на устройстве (localStorage). Работает и на входящие, и на исходящие.

const STORAGE_KEY = "poluton_video_blocks";

function read(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    /* ignore */
  }
}

/** Запрещены ли видеозвонки с этим пользователем. */
export function isVideoBlocked(userId?: number | null): boolean {
  if (!userId) return false;
  return read().includes(userId);
}

/** Заблокировать видеозвонки с пользователем. */
export function blockVideo(userId: number) {
  const ids = read();
  if (!ids.includes(userId)) write([...ids, userId]);
}

/** Разрешить видеозвонки с пользователем. */
export function unblockVideo(userId: number) {
  write(read().filter((id) => id !== userId));
}

/** Переключить блокировку. Возвращает новое состояние (true = заблокировано). */
export function toggleVideoBlock(userId: number): boolean {
  const blocked = isVideoBlocked(userId);
  if (blocked) unblockVideo(userId);
  else blockVideo(userId);
  return !blocked;
}
