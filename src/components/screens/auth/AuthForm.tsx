import Icon from "@/components/ui/icon";

export function AuthForm({
  mode,
  name,
  email,
  password,
  loading,
  error,
  emailTaken,
  showPassword,
  onModeChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onShowPasswordToggle,
  onSubmit,
  onShowForgot,
  onOpenTerms,
  onOpenPrivacy,
  onEmailTakenDismiss,
}: {
  mode: "login" | "register";
  name: string;
  email: string;
  password: string;
  loading: boolean;
  error: string;
  emailTaken: boolean;
  showPassword: boolean;
  onModeChange: (m: "login" | "register") => void;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onShowPasswordToggle: () => void;
  onSubmit: () => void;
  onShowForgot: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onEmailTakenDismiss: () => void;
}) {
  const inputCls =
    "w-full text-white placeholder-white/40 rounded-2xl px-4 py-3.5 text-sm outline-none border transition-colors font-golos" +
    " focus:border-pink-500/60" +
    " border-white/20";

  return (
    <>
      {/* Фоновое изображение */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4d4aa1bd-fe2c-46ae-b734-3f14fcfaced6.jpg"
          alt=""
          loading="eager"
          className="w-full h-full object-cover"
          style={{ opacity: 0.45 }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,22,37,0.3) 0%, rgba(26,22,37,0.7) 45%, rgba(26,22,37,0.98) 75%)" }} />
      </div>

      <div
        className="relative z-10 flex flex-col h-full"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >

        {/* Верхняя часть — лого */}
        <div className="flex-1 flex flex-col items-center justify-end pb-8 px-6">
          <div className="mb-5 relative flex items-center justify-center">
            <div className="absolute rounded-3xl"
              style={{
                width: 88, height: 88,
                background: "radial-gradient(circle, rgba(255,45,120,0.55) 0%, rgba(155,89,182,0.3) 60%, transparent 80%)",
                animation: "heartbeat 1.2s ease-in-out infinite",
                filter: "blur(8px)",
              }} />
            <img
              src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/38a015fd-cfd8-4bad-9fae-1106d60ea1d2.jpg"
              alt="Полутон"
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
            Полутон
          </h1>
          <p className="text-white/50 text-sm font-medium tracking-wide">Знакомься. Общайся. Влюбляйся.</p>
        </div>

        {/* Нижняя панель — форма */}
        <div className="flex-shrink-0 px-5 pb-8 flex flex-col gap-4">

          {/* Переключатель Вход / Регистрация */}
          <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => onModeChange(m)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-xl ${mode === m ? "text-white" : "text-white/40"}`}
                style={mode === m
                  ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 2px 12px rgba(255,45,120,0.35)" }
                  : undefined}>
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
                <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Твоё имя"
                  className={inputCls + " pl-10"}
                  style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Icon name="Mail" size={16} />
              </span>
              <input value={email} onChange={(e) => onEmailChange(e.target.value)} placeholder="Email" type="email"
                className={inputCls + " pl-10"}
                style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Icon name="Lock" size={16} />
              </span>
              <input value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="Пароль"
                type={showPassword ? "text" : "password"}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                className={inputCls + " pl-10 pr-11"}
                style={{ background: "rgba(255,255,255,0.12)" }} />
              <button type="button" onClick={onShowPasswordToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                <Icon name={showPassword ? "EyeOff" : "Eye"} size={17} />
              </button>
            </div>
          </div>

          {/* Email занят */}
          {emailTaken && (
            <div className="flex flex-col gap-2 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.25)" }}>
              <div className="flex items-center gap-2">
                <Icon name="UserCheck" size={15} className="text-pink-400 flex-shrink-0" />
                <p className="text-pink-300 text-sm font-semibold">Этот email уже зарегистрирован</p>
              </div>
              <p className="text-white/50 text-xs">Аккаунт с таким email уже существует. Войди в него или восстанови пароль.</p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => { onEmailTakenDismiss(); onModeChange("login"); }}
                  className="flex-1 py-2 rounded-xl text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  Войти в аккаунт
                </button>
                <button
                  onClick={() => { onEmailTakenDismiss(); onShowForgot(); }}
                  className="flex-1 py-2 rounded-xl text-white/60 text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Забыл пароль
                </button>
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Icon name="AlertCircle" size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Кнопка submit */}
          <button onClick={onSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #FF2D78 0%, #9B59B6 100%)", boxShadow: "0 4px 24px rgba(255,45,120,0.45)" }}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />Загрузка...</span>
              : mode === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
          </button>

          {mode === "login" && (
            <button onClick={onShowForgot} className="text-white/35 text-xs text-center hover:text-pink-400 transition-colors">
              Забыл пароль?
            </button>
          )}

          <p className="text-white/40 text-xs text-center leading-relaxed px-2">
            Продолжая, ты принимаешь{" "}
            <button onClick={onOpenTerms} className="text-white font-bold hover:text-pink-300 transition-colors">
              Лицензионное соглашение
            </button>
            {" "}и{" "}
            <button onClick={onOpenPrivacy} className="text-white font-bold hover:text-pink-300 transition-colors">
              Политику конфиденциальности
            </button>
            {" "}LoveBloom
          </p>
        </div>
      </div>
    </>
  );
}