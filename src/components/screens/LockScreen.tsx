import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { haptic } from "@/hooks/useNative";
import { usePinLock } from "@/hooks/usePinLock";
import { useBiometrics, isBiometricRegistered } from "@/hooks/useBiometrics";
import { authApi } from "@/lib/api";

const PIN_LEN = 4;

interface LockScreenProps {
  userId: number;
  onUnlock: () => void;
  onLogout: () => void;
}

/**
 * Экран блокировки при запуске приложения. Показывается, если у пользователя
 * включён PIN-код или отпечаток пальца. Предлагает биометрию автоматически
 * (если доступна), иначе — ввод PIN-кода. Есть выход в аккаунт как запасной путь.
 */
export function LockScreen({ userId, onUnlock, onLogout }: LockScreenProps) {
  const { verifyPin } = usePinLock(userId);
  const biometrics = useBiometrics(userId);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [bioTried, setBioTried] = useState(false);
  const bioAutoRan = useRef(false);

  const tryBiometric = useCallback(async () => {
    if (!isBiometricRegistered(userId) || checking) return;
    setChecking(true);
    setError("");
    const ok = await biometrics.verify();
    setChecking(false);
    setBioTried(true);
    if (ok) { haptic("success"); onUnlock(); }
    else { haptic("error"); }
  }, [userId, biometrics, checking, onUnlock]);

  // Автоматически предлагаем биометрию один раз при открытии экрана
  useEffect(() => {
    if (bioAutoRan.current) return;
    if (isBiometricRegistered(userId) && biometrics.supported) {
      bioAutoRan.current = true;
      tryBiometric();
    }
  }, [userId, biometrics.supported, tryBiometric]);

  const pressDigit = (d: string) => {
    if (pin.length >= PIN_LEN || checking) return;
    setError("");
    haptic("light");
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LEN) {
      setChecking(true);
      verifyPin(next).then((ok) => {
        setChecking(false);
        if (ok) { haptic("success"); onUnlock(); }
        else { haptic("error"); setError("Неверный PIN-код"); setPin(""); }
      });
    }
  };

  const backspace = () => {
    if (checking) return;
    haptic("light");
    setPin(p => p.slice(0, -1));
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: "var(--spark-dark,#0f0a1a)" }}>
      <div className="app-hearts-layer" />

      <div className="relative flex flex-col items-center gap-2 mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 8px 24px rgba(255,45,120,0.4)" }}>
          <Icon name="Lock" size={26} className="text-white" />
        </div>
        <h1 className="font-unbounded text-white text-xl font-black">Полутон</h1>
        <p className="text-white/40 text-sm">Введи PIN-код для входа</p>
      </div>

      {/* Индикаторы точек */}
      <div className="relative flex items-center justify-center gap-3 mb-3">
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <div key={i} className="w-3.5 h-3.5 rounded-full transition-all"
            style={{
              background: i < pin.length ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.1)",
              border: i < pin.length ? "none" : "1.5px solid rgba(255,255,255,0.2)",
              transform: i < pin.length ? "scale(1.1)" : "scale(1)",
            }} />
        ))}
      </div>

      <div className="relative h-5 mb-2">
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* Пин-пад */}
      <div className="relative grid grid-cols-3 gap-3 px-8 mb-4">
        {["1","2","3","4","5","6","7","8","9"].map(d => (
          <button key={d} onClick={() => pressDigit(d)} disabled={checking}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-semibold transition-all active:scale-90 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {d}
          </button>
        ))}

        {biometrics.supported && isBiometricRegistered(userId) ? (
          <button onClick={tryBiometric} disabled={checking}
            className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
            style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.25)" }}>
            <Icon name="Fingerprint" size={24} style={{ color: "#FF2D78" }} />
          </button>
        ) : <div />}

        <button onClick={() => pressDigit("0")} disabled={checking}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-semibold transition-all active:scale-90 disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          0
        </button>
        <button onClick={backspace} disabled={checking || pin.length === 0}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white/60 transition-all active:scale-90 disabled:opacity-30">
          <Icon name="Delete" size={20} />
        </button>
      </div>

      {bioTried && biometrics.supported && isBiometricRegistered(userId) && (
        <button onClick={tryBiometric} disabled={checking}
          className="relative flex items-center gap-1.5 text-white/40 text-xs mb-2 transition-colors active:text-white/70">
          <Icon name="Fingerprint" size={13} />
          Повторить попытку
        </button>
      )}

      <button onClick={handleLogout}
        className="relative text-white/30 text-xs mt-4 transition-colors active:text-white/60">
        Выйти из другого аккаунта
      </button>
    </div>
  );
}

export default LockScreen;
