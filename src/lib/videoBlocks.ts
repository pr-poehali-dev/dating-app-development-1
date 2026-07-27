// Список пользователей, которым запрещены видеозвонки.
// Источник правды — сервер (таблица video_blocks), но для мгновенной синхронной
// проверки (перед стартом звонка / на входящем) держим локальный кэш в localStorage.

import { videoBlocksApi } from "@/lib/api";

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

/** Синхронно: запрещены ли видеозвонки с этим пользователем (по локальному кэшу). */
export function isVideoBlocked(userId?: number | null): boolean {
  if (!userId) return false;
  return read().includes(userId);
}

/** Подтянуть актуальный список с сервера в локальный кэш (при старте приложения). */
export async function syncVideoBlocks(): Promise<void> {
  try {
    const { blocked_ids } = await videoBlocksApi.list();
    write(blocked_ids || []);
  } catch {
    /* нет сети — работаем по локальному кэшу */
  }
}

/** Заблокировать видеозвонки с пользователем (сервер + кэш). */
export function blockVideo(userId: number) {
  const ids = read();
  if (!ids.includes(userId)) write([...ids, userId]);
  videoBlocksApi.block(userId).catch(() => {});
}

/** Разрешить видеозвонки с пользователем (сервер + кэш). */
export function unblockVideo(userId: number) {
  write(read().filter((id) => id !== userId));
  videoBlocksApi.unblock(userId).catch(() => {});
}

/** Переключить блокировку. Возвращает новое состояние (true = заблокировано). */
export function toggleVideoBlock(userId: number): boolean {
  const blocked = isVideoBlocked(userId);
  if (blocked) unblockVideo(userId);
  else blockVideo(userId);
  return !blocked;
}