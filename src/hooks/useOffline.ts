/**
 * useOffline — офлайн-режим и синхронизация данных
 * - Детект потери/восстановления сети
 * - IndexedDB кэш: профили, матчи, сообщения
 * - Очередь отложенных действий (отправка сообщений офлайн)
 * - Автосинхронизация при восстановлении соединения
 */
import { useState, useEffect, useCallback } from "react";

const DB_NAME = "lovebloom-offline";
const DB_VERSION = 2;

/* ─── IndexedDB helper ────────────────────────────────────────────────────── */

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("profiles")) {
        db.createObjectStore("profiles", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("matches")) {
        db.createObjectStore("matches", { keyPath: "match_id" });
      }
      if (!db.objectStoreNames.contains("messages")) {
        db.createObjectStore("messages", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending-actions")) {
        db.createObjectStore("pending-actions", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(db: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dbPutAll(db: IDBDatabase, store: string, items: unknown[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    items.forEach((item) => os.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dbGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(db: IDBDatabase, store: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ─── Публичный API кэша ──────────────────────────────────────────────────── */

let _db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (!_db) _db = await openOfflineDB();
  return _db;
}

/** Сохранить профили в кэш */
export async function cacheProfiles(profiles: unknown[]) {
  try {
    const db = await getDB();
    await dbPutAll(db, "profiles", profiles);
  } catch { /* IndexedDB может быть недоступен */ }
}

/** Сохранить матчи (чаты) в кэш */
export async function cacheMatches(matches: unknown[]) {
  try {
    const db = await getDB();
    await dbPutAll(db, "matches", matches);
  } catch { /* */ }
}

/** Сохранить сообщения в кэш */
export async function cacheMessages(messages: unknown[]) {
  try {
    const db = await getDB();
    await dbPutAll(db, "messages", messages);
  } catch { /* */ }
}

/** Прочитать закэшированные матчи */
export async function getCachedMatches<T>(): Promise<T[]> {
  try {
    const db = await getDB();
    return await dbGetAll<T>(db, "matches");
  } catch {
    return [];
  }
}

/** Прочитать закэшированные сообщения */
export async function getCachedMessages<T>(): Promise<T[]> {
  try {
    const db = await getDB();
    return await dbGetAll<T>(db, "messages");
  } catch {
    return [];
  }
}

/** Добавить действие в очередь (отправка сообщения офлайн) */
export async function queueAction(action: { type: string; payload: unknown }) {
  try {
    const db = await getDB();
    await dbPut(db, "pending-actions", { ...action, timestamp: Date.now() });
  } catch { /* */ }
}

/** Получить все отложенные действия */
export async function getPendingActions<T>(): Promise<T[]> {
  try {
    const db = await getDB();
    return await dbGetAll<T>(db, "pending-actions");
  } catch {
    return [];
  }
}

/** Удалить выполненное действие из очереди */
export async function removePendingAction(id: number) {
  try {
    const db = await getDB();
    await dbDelete(db, "pending-actions", id);
  } catch { /* */ }
}

/** Сохранить метаданные (timestamp последней синхронизации) */
export async function setMeta(key: string, value: unknown) {
  try {
    const db = await getDB();
    await dbPut(db, "meta", { key, value });
  } catch { /* */ }
}

/* ─── Синхронизация при восстановлении сети ──────────────────────────────── */

type SyncHandler = (actions: { id: number; type: string; payload: unknown }[]) => Promise<void>;

let _syncHandler: SyncHandler | null = null;

export function registerSyncHandler(handler: SyncHandler) {
  _syncHandler = handler;
}

async function runSync() {
  if (!_syncHandler) return;
  try {
    const actions = await getPendingActions<{ id: number; type: string; payload: unknown }>();
    if (actions.length > 0) {
      await _syncHandler(actions);
    }
    await setMeta("lastSync", Date.now());
  } catch { /* */ }
}

/* ─── Хук ─────────────────────────────────────────────────────────────────── */

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;   // Только что восстановили соединение
  pendingCount: number;  // Кол-во действий в очереди
  lastSyncAt: number | null;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    wasOffline: false,
    pendingCount: 0,
    lastSyncAt: null,
  });

  const refreshPendingCount = useCallback(async () => {
    const actions = await getPendingActions<{ id: number }>();
    setState((s) => ({ ...s, pendingCount: actions.length }));
  }, []);

  useEffect(() => {
    let wasOfflineFlag = !navigator.onLine;

    const onOnline = async () => {
      setState((s) => ({ ...s, isOnline: true, wasOffline: wasOfflineFlag }));
      if (wasOfflineFlag) {
        // Восстановление — запускаем синхронизацию
        await runSync();
        await refreshPendingCount();
        setState((s) => ({ ...s, lastSyncAt: Date.now() }));
        // Убираем флаг wasOffline через 4 секунды
        setTimeout(() => setState((s) => ({ ...s, wasOffline: false })), 4000);
      }
      wasOfflineFlag = false;
    };

    const onOffline = () => {
      wasOfflineFlag = true;
      setState((s) => ({ ...s, isOnline: false, wasOffline: false }));
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    refreshPendingCount();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refreshPendingCount]);

  return state;
}

export default useOffline;
