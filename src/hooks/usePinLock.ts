/**
 * usePinLock — хранение и проверка PIN-кода для быстрой блокировки приложения.
 * PIN хранится локально (только хеш, не сам код) в localStorage, привязан
 * к конкретному пользователю (по id), чтобы при смене аккаунта на одном
 * устройстве не сработал чужой PIN.
 */
import { useState, useCallback } from "react";

const PIN_HASH_KEY = "spark_pin_hash";
const PIN_USER_KEY = "spark_pin_user";
const PIN_ENABLED_KEY = "spark_pin_enabled";

/** Простой синхронный хеш (SubtleCrypto недоступен синхронно) — используем async SHA-256 */
async function hashPin(pin: string, userId: number): Promise<string> {
  const enc = new TextEncoder().encode(`polyuton_pin_v1:${userId}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function isPinEnabled(): boolean {
  return localStorage.getItem(PIN_ENABLED_KEY) === "1" && !!localStorage.getItem(PIN_HASH_KEY);
}

export function getPinUserId(): number | null {
  const raw = localStorage.getItem(PIN_USER_KEY);
  return raw ? Number(raw) : null;
}

export function disablePin() {
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(PIN_USER_KEY);
  localStorage.removeItem(PIN_ENABLED_KEY);
}

export function usePinLock(userId: number | undefined) {
  const [enabled, setEnabled] = useState(isPinEnabled);

  const setPin = useCallback(async (pin: string) => {
    if (!userId) return false;
    if (!/^\d{4,6}$/.test(pin)) return false;
    const h = await hashPin(pin, userId);
    localStorage.setItem(PIN_HASH_KEY, h);
    localStorage.setItem(PIN_USER_KEY, String(userId));
    localStorage.setItem(PIN_ENABLED_KEY, "1");
    setEnabled(true);
    return true;
  }, [userId]);

  const verifyPin = useCallback(async (pin: string) => {
    if (!userId) return false;
    const stored = localStorage.getItem(PIN_HASH_KEY);
    const storedUser = localStorage.getItem(PIN_USER_KEY);
    if (!stored || storedUser !== String(userId)) return false;
    const h = await hashPin(pin, userId);
    return h === stored;
  }, [userId]);

  const removePin = useCallback(() => {
    disablePin();
    setEnabled(false);
  }, []);

  return { enabled, setPin, verifyPin, removePin };
}

export default usePinLock;
