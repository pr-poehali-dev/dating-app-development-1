/**
 * useBiometrics — вход по отпечатку пальца / Face ID через WebAuthn
 * (Web Authentication API, platform authenticator). Работает в браузере,
 * PWA и в WebView собранного APK/приложения (Android WebView и Chrome
 * поддерживают WebAuthn начиная с Android 9+, iOS Safari — с iOS 14+).
 *
 * Приватный ключ никогда не покидает устройство — сервер хранит только
 * публичный ключ и credential id, привязанные к пользователю.
 */
import { useState, useEffect, useCallback } from "react";

const CRED_ID_KEY = "spark_biometric_cred_id";
const CRED_USER_KEY = "spark_biometric_user";

function b64urlToBuf(b64url: string): ArrayBuffer {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(b64url.length + (4 - (b64url.length % 4)) % 4, "=");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isBiometricRegistered(userId: number | undefined): boolean {
  if (!userId) return false;
  return localStorage.getItem(CRED_USER_KEY) === String(userId) && !!localStorage.getItem(CRED_ID_KEY);
}

export function clearBiometric() {
  localStorage.removeItem(CRED_ID_KEY);
  localStorage.removeItem(CRED_USER_KEY);
}

export function useBiometrics(userId: number | undefined) {
  const [supported, setSupported] = useState(false);
  const [checking, setChecking] = useState(true);
  const [registered, setRegistered] = useState(() => isBiometricRegistered(userId));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hasApi = typeof window !== "undefined" && !!window.PublicKeyCredential;
        if (!hasApi) { if (!cancelled) { setSupported(false); setChecking(false); } return; }
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!cancelled) { setSupported(available); setChecking(false); }
      } catch {
        if (!cancelled) { setSupported(false); setChecking(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setRegistered(isBiometricRegistered(userId));
  }, [userId]);

  /** Регистрирует новый биометрический ключ на этом устройстве для пользователя */
  const register = useCallback(async (userName: string): Promise<boolean> => {
    if (!userId || !supported) return false;
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userIdBuf = new TextEncoder().encode(String(userId));
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Полутон" },
          user: { id: userIdBuf, name: userName || `user_${userId}`, displayName: userName || "Пользователь" },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },   // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
          attestation: "none",
        },
      }) as PublicKeyCredential | null;
      if (!cred) return false;
      localStorage.setItem(CRED_ID_KEY, bufToB64url(cred.rawId));
      localStorage.setItem(CRED_USER_KEY, String(userId));
      setRegistered(true);
      return true;
    } catch {
      return false;
    }
  }, [userId, supported]);

  /** Запрашивает подтверждение отпечатком/Face ID по ранее сохранённому ключу */
  const verify = useCallback(async (): Promise<boolean> => {
    if (!userId || !supported) return false;
    const credId = localStorage.getItem(CRED_ID_KEY);
    const credUser = localStorage.getItem(CRED_USER_KEY);
    if (!credId || credUser !== String(userId)) return false;
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: b64urlToBuf(credId), type: "public-key" }],
          userVerification: "required",
          timeout: 60000,
        },
      });
      return !!assertion;
    } catch {
      return false;
    }
  }, [userId, supported]);

  const remove = useCallback(() => {
    clearBiometric();
    setRegistered(false);
  }, []);

  return { supported, checking, registered, register, verify, remove };
}

export default useBiometrics;
