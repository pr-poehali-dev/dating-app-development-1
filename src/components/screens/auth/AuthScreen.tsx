import { useState } from "react";
import Icon from "@/components/ui/icon";
import { authApi, type User } from "@/lib/api";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      let result;
      if (mode === "register") {
        if (!name.trim()) { setError("Введи своё имя"); setLoading(false); return; }
        result = await authApi.register(email, password, name);
      } else {
        result = await authApi.login(email, password);
      }
      onAuth(result.user);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full text-white placeholder-white/40 rounded-2xl px-4 py-3.5 text-sm outline-none border transition-colors font-golos"
    + " focus:border-pink-500/60"
    + " border-white/20";

  return (
    <>
    {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

    {/* Фоновое изображение */}
    <div className="absolute inset-0 z-0">
      <img
        src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4d4aa1bd-fe2c-46ae-b734-3f14fcfaced6.jpg"
        className="w-full h-full object-cover"
        style={{ opacity: 0.45 }}
      />
      {/* Градиентный оверлей снизу */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,22,37,0.3) 0%, rgba(26,22,37,0.7) 45%, rgba(26,22,37,0.98) 75%)" }} />
    </div>

    <div className="relative z-10 flex flex-col h-full">

      {/* Верхняя часть — лого по центру */}
      <div className="flex-1 flex flex-col items-center justify-end pb-8 px-6">
        {/* Иконка приложения */}
        <div className="mb-5 relative flex items-center justify-center">
          {/* Пульсирующее свечение позади */}
          <div className="absolute rounded-3xl"
            style={{
              width: 88, height: 88,
              background: "radial-gradient(circle, rgba(255,45,120,0.55) 0%, rgba(155,89,182,0.3) 60%, transparent 80%)",
              animation: "heartbeat 1.2s ease-in-out infinite",
              filter: "blur(8px)",
            }} />
          {/* Логотип */}
          <img
            src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/877e412e-7952-45c5-a513-2c266868f89f.jpg"
            alt="LoveBloom"
            style={{
              width: 84, height: 84,
              borderRadius: 24,
              animation: "heartbeat 1.2s ease-in-out infinite",
              boxShadow: "0 8px 32px rgba(255,45,120,0.45)",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

        <h1 className="font-unbounded text-white text-4xl font-black mb-2" style={{ textShadow: "0 2px 20px rgba(255,45,120,0.4)" }}>
          LoveBloom
        </h1>
        <p className="text-white/50 text-sm font-medium tracking-wide">Знакомься. Общайся. Влюбляйся.</p>
      </div>

      {/* Нижняя панель — форма */}
      <div className="flex-shrink-0 px-5 pb-8 flex flex-col gap-4">

        {/* Переключатель Вход / Регистрация */}
        <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2.5 text-sm font-semibold transition-all rounded-xl"
              style={mode === m
                ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white", boxShadow: "0 2px 12px rgba(255,45,120,0.35)" }
                : { color: "rgba(255,255,255,0.4)" }}>
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        {/* Поля */}
        <div className="flex flex-col gap-3">
          {mode === "register" && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Icon name="User" size={16} />
              </span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоё имя"
                className={inputCls + " pl-10"}
                style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>
          )}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Icon name="Mail" size={16} />
            </span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
              className={inputCls + " pl-10"}
              style={{ background: "rgba(255,255,255,0.12)" }} />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Icon name="Lock" size={16} />
            </span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль"
              type={showPassword ? "text" : "password"}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className={inputCls + " pl-10 pr-11"}
              style={{ background: "rgba(255,255,255,0.12)" }} />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
              <Icon name={showPassword ? "EyeOff" : "Eye"} size={17} />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Icon name="AlertCircle" size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button onClick={submit} disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #FF2D78 0%, #9B59B6 100%)", boxShadow: "0 4px 24px rgba(255,45,120,0.45)" }}>
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />Загрузка...</span>
            : mode === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
        </button>

        {mode === "login" && (
          <button onClick={() => setShowForgot(true)} className="text-white/35 text-xs text-center hover:text-pink-400 transition-colors">
            Забыл пароль?
          </button>
        )}

        <p className="text-white/20 text-[11px] text-center leading-relaxed">
          Нажимая кнопку, ты соглашаешься с{" "}
          <span className="text-white/35 underline underline-offset-2">правилами сервиса</span>
        </p>
      </div>
    </div>
    </>
  );
}
