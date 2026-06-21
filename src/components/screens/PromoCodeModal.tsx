import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi } from "@/lib/api";

export function PromoCodeModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ discount: number; code: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  const handleActivate = async () => {
    const trimmed = code.trim();
    if (!trimmed) { setError("Введи промокод"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await profilesApi.activatePromo(trimmed);
      setSuccess({ discount: res.discount_percent, code: res.code });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm flex flex-col rounded-t-3xl pb-safe"
        style={{ background: "var(--spark-dark2,#1a1625)", animation: "slideUp 0.28s ease" }}
        onClick={e => e.stopPropagation()}>

        {/* Ручка */}
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: "rgba(255,255,255,0.18)" }} />

        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              <Icon name="Tag" size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Промокод</p>
              <p className="text-white/40 text-xs">Скидка на Premium-подписку</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>

        <div className="px-5 pb-8 flex flex-col gap-4">
          {!success ? (
            <>
              {/* Поле ввода */}
              <div className="relative">
                <input
                  ref={inputRef}
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleActivate()}
                  placeholder="Введи промокод"
                  maxLength={32}
                  className="w-full px-4 py-3.5 rounded-2xl text-white text-sm font-mono font-semibold tracking-widest outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)",
                    caretColor: "#FF2D78",
                  }}
                />
              </div>

              {/* Ошибка */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <Icon name="AlertCircle" size={14} className="text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Кнопка */}
              <button onClick={handleActivate} disabled={loading || !code.trim()}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)" }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Проверяем...
                    </span>
                  : "Активировать"}
              </button>
            </>
          ) : (
            /* Успех */
            <div className="flex flex-col items-center gap-4 py-3">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 8px 32px rgba(255,45,120,0.45)" }}>
                <span style={{ fontSize: 40 }}>🎉</span>
              </div>
              <div className="text-center flex flex-col gap-1">
                <p className="text-white font-black text-2xl">−{success.discount}%</p>
                <p className="text-white font-semibold text-base">Промокод активирован!</p>
                <p className="text-white/45 text-sm">Скидка применится при следующей покупке Premium</p>
              </div>
              <div className="w-full px-4 py-2 rounded-xl text-center font-mono font-bold text-white/60 text-sm"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {success.code}
              </div>
              <button onClick={onClose}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)" }}>
                Отлично!
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
