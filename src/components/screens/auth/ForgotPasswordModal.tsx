import { useState } from "react";
import Icon from "@/components/ui/icon";
import { authApi } from "@/lib/api";

export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.includes("@")) { setError("Введи корректный email"); return; }
    setError(""); setLoading(true);
    try {
      await authApi.resetPassword(email);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm p-6 flex flex-col gap-5"
        style={{ background: "linear-gradient(180deg, #1e1830 0%, #17112a 100%)", borderRadius: "32px 32px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none" }}>

        {/* Хэндл */}
        <div className="flex justify-center -mt-1 mb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Кнопка закрытия */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-golos font-bold text-xl">Восстановление пароля</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>

        {done ? (
          /* ── Успех ── */
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Анимированная иконка */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full" style={{ background: "rgba(74,222,128,0.15)", animation: "heartbeat 1.5s ease-in-out infinite" }} />
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.25), rgba(16,185,129,0.15))", border: "1px solid rgba(74,222,128,0.3)" }}>
                <Icon name="MailCheck" size={30} className="text-green-400" />
              </div>
            </div>
            <div className="text-center flex flex-col gap-1.5">
              <p className="text-white font-bold text-lg">Письмо отправлено!</p>
              <p className="text-white/45 text-sm leading-relaxed">
                Проверь почту<br />
                <span className="text-pink-400 font-medium">{email}</span>
              </p>
              <p className="text-white/30 text-xs mt-1">Там новый пароль для входа. Не забудь проверить папку «Спам».</p>
            </div>
            <button onClick={onClose}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mt-1 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #FF2D78 0%, #9B59B6 100%)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)" }}>
              Войти в аккаунт
            </button>
          </div>
        ) : (
          /* ── Форма ── */
          <>
            {/* Иконка сверху */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(155,89,182,0.2))", border: "1px solid rgba(255,45,120,0.2)" }}>
                <Icon name="KeyRound" size={26} className="text-pink-400" />
              </div>
              <p className="text-white/45 text-sm text-center leading-relaxed">
                Введи свой email — мы пришлём<br />новый пароль для входа
              </p>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Icon name="Mail" size={16} />
              </span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                placeholder="Твой email" onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full text-white placeholder-white/35 rounded-2xl pl-10 pr-4 py-3.5 text-sm outline-none border font-golos transition-colors focus:border-pink-500/60"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <Icon name="AlertCircle" size={15} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button onClick={submit} disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #FF2D78 0%, #9B59B6 100%)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)" }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                    Отправляем...
                  </span>
                : "Отправить новый пароль"}
            </button>
          </>
        )}

        {/* Отступ для safe area */}
        <div className="h-2" />
      </div>
    </div>
  );
}
