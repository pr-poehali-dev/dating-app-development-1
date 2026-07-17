import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useBackHandler } from "@/hooks/backStack";
import { haptic } from "@/hooks/useNative";

const PIN_LEN = 4;

interface PinSetupSheetProps {
  onSave: (pin: string) => Promise<boolean>;
  onClose: () => void;
}

/** Шторка установки/смены PIN-кода: сначала ввод, затем подтверждение */
export function PinSetupSheet({ onSave, onClose }: PinSetupSheetProps) {
  useBackHandler(true, onClose);

  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const current = step === "enter" ? pin : confirmPin;

  const pressDigit = (d: string) => {
    if (current.length >= PIN_LEN) return;
    setError("");
    haptic("light");
    if (step === "enter") {
      const next = pin + d;
      setPin(next);
      if (next.length === PIN_LEN) {
        setTimeout(() => setStep("confirm"), 150);
      }
    } else {
      const next = confirmPin + d;
      setConfirmPin(next);
      if (next.length === PIN_LEN) {
        if (next === pin) {
          setSaving(true);
          onSave(next).then((ok) => {
            setSaving(false);
            if (ok) { haptic("success"); onClose(); }
            else { setError("Не удалось сохранить PIN"); setConfirmPin(""); }
          });
        } else {
          haptic("error");
          setError("PIN не совпадает, попробуй снова");
          setTimeout(() => { setPin(""); setConfirmPin(""); setStep("enter"); }, 500);
        }
      }
    }
  };

  const backspace = () => {
    haptic("light");
    if (step === "enter") setPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full flex flex-col"
        style={{
          background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
        }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <div>
            <p className="text-white font-bold text-lg">
              {step === "enter" ? "Придумай PIN-код" : "Повтори PIN-код"}
            </p>
            <p className="text-white/40 text-xs mt-0.5">
              {step === "enter" ? "4 цифры для быстрого входа" : "Введи ещё раз для подтверждения"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Индикаторы точек */}
        <div className="flex items-center justify-center gap-3 py-6">
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full transition-all"
              style={{
                background: i < current.length ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.1)",
                border: i < current.length ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                transform: i < current.length ? "scale(1.1)" : "scale(1)",
              }} />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-400 text-xs mb-2 px-5">{error}</p>
        )}

        {/* Пин-пад */}
        <div className="grid grid-cols-3 gap-3 px-8 pb-8">
          {["1","2","3","4","5","6","7","8","9"].map(d => (
            <button key={d} onClick={() => pressDigit(d)} disabled={saving}
              className="aspect-square rounded-2xl flex items-center justify-center text-white text-xl font-semibold transition-all active:scale-90 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {d}
            </button>
          ))}
          <div />
          <button onClick={() => pressDigit("0")} disabled={saving}
            className="aspect-square rounded-2xl flex items-center justify-center text-white text-xl font-semibold transition-all active:scale-90 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            0
          </button>
          <button onClick={backspace} disabled={saving || current.length === 0}
            className="aspect-square rounded-2xl flex items-center justify-center text-white/60 transition-all active:scale-90 disabled:opacity-30">
            <Icon name="Delete" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinSetupSheet;
