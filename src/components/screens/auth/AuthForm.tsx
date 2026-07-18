import { useTranslation } from "react-i18next";
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
  onOAuth,
  oauthLoading,
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
  onOAuth: (provider: "vk" | "mailru") => void;
  oauthLoading: "vk" | "mailru" | null;
}) {
  const { t } = useTranslation();
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
        className="relative z-10 flex flex-col h-full overflow-y-auto"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >

        {/* Верхняя часть — лого */}
        <div className="flex-1 flex flex-col items-center justify-end pb-8 px-6" style={{ minHeight: 220 }}>
          <div className="mb-5 relative flex items-center justify-center">
            <div className="absolute rounded-3xl"
              style={{
                width: 88, height: 88,
                background: "radial-gradient(circle, rgba(255,45,120,0.55) 0%, rgba(155,89,182,0.3) 60%, transparent 80%)",
                animation: "heartbeat 1.2s ease-in-out infinite",
                filter: "blur(8px)",
              }} />
            <img
              src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png"
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
          <p className="text-white/50 text-sm font-medium tracking-wide">{t("auth.tagline")}</p>
        </div>

        {/* Нижняя панель — форма */}
        <div className="flex-shrink-0 px-5 pb-5 flex flex-col gap-4">

          {/* Переключатель Вход / Регистрация */}
          <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => onModeChange(m)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-xl ${mode === m ? "text-white" : "text-white/40"}`}
                style={mode === m
                  ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 2px 12px rgba(255,45,120,0.35)" }
                  : undefined}>
                {m === "login" ? t("auth.login") : t("auth.register")}
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
                <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder={t("auth.namePlaceholder")}
                  className={inputCls + " pl-10"}
                  style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Icon name="Mail" size={16} />
              </span>
              <input value={email} onChange={(e) => onEmailChange(e.target.value)} placeholder={t("auth.emailPlaceholder")} type="email"
                className={inputCls + " pl-10"}
                style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Icon name="Lock" size={16} />
              </span>
              <input value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder={t("auth.passwordPlaceholder")}
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
                <p className="text-pink-300 text-sm font-semibold">{t("auth.emailTakenTitle")}</p>
              </div>
              <p className="text-white/50 text-xs">{t("auth.emailTakenText")}</p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => { onEmailTakenDismiss(); onModeChange("login"); }}
                  className="flex-1 py-2 rounded-xl text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  {t("auth.loginToAccount")}
                </button>
                <button
                  onClick={() => { onEmailTakenDismiss(); onShowForgot(); }}
                  className="flex-1 py-2 rounded-xl text-white/60 text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {t("auth.forgotPasswordShort")}
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
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />{t("auth.loading")}</span>
              : mode === "login" ? t("auth.loginToAccount") : t("auth.createAccount")}
          </button>

          {mode === "login" && (
            <button onClick={onShowForgot} className="text-white/35 text-xs text-center hover:text-pink-400 transition-colors">
              {t("auth.forgotPassword")}
            </button>
          )}

          {/* Разделитель */}
          <div className="flex items-center gap-3 py-0.5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
            <span className="text-white/35 text-xs">{t("auth.orViaSocial")}</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          </div>

          {/* Кнопки соцсетей */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOAuth("vk")}
              disabled={oauthLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "#0077FF", boxShadow: "0 4px 16px rgba(0,119,255,0.35)" }}
            >
              {oauthLoading === "vk"
                ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                : <><span className="font-black text-base leading-none">VK</span>ВКонтакте</>}
            </button>
            <button
              type="button"
              onClick={() => onOAuth("mailru")}
              disabled={oauthLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#005FF9,#7000FF)", boxShadow: "0 4px 16px rgba(112,0,255,0.35)" }}
            >
              {oauthLoading === "mailru"
                ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                : <><Icon name="Mail" size={17} />Mail.ru</>}
            </button>
          </div>

          <p className="text-white/40 text-xs text-center leading-relaxed px-2">
            {t("auth.agreementPrefix")}{" "}
            <button onClick={onOpenTerms} className="text-white font-bold hover:text-pink-300 transition-colors">
              {t("footer.terms")}
            </button>
            {" "}{t("auth.agreementMiddle")}{" "}
            <button onClick={onOpenPrivacy} className="text-white font-bold hover:text-pink-300 transition-colors">
              {t("footer.privacy")}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}