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
  const [showRules, setShowRules] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

  const submit = async () => {
    setError("");
    setEmailTaken(false);
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
      const msg = e instanceof Error ? e.message : "Ошибка";
      if (mode === "register" && msg.toLowerCase().includes("уже занят")) {
        setEmailTaken(true);
      } else {
        setError(msg);
      }
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

        {emailTaken && (
          <div className="flex flex-col gap-2 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.25)" }}>
            <div className="flex items-center gap-2">
              <Icon name="UserCheck" size={15} className="text-pink-400 flex-shrink-0" />
              <p className="text-pink-300 text-sm font-semibold">Этот email уже зарегистрирован</p>
            </div>
            <p className="text-white/50 text-xs">Аккаунт с таким email уже существует. Войди в него или восстанови пароль.</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { setEmailTaken(false); setError(""); setMode("login"); }}
                className="flex-1 py-2 rounded-xl text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                Войти в аккаунт
              </button>
              <button
                onClick={() => { setEmailTaken(false); setShowForgot(true); }}
                className="flex-1 py-2 rounded-xl text-white/60 text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Забыл пароль
              </button>
            </div>
          </div>
        )}

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
          <button onClick={() => setShowRules(true)}
            className="text-white/50 underline underline-offset-2 hover:text-white/70 transition-colors">
            правилами сервиса
          </button>
        </p>
      </div>
    </div>

    {/* Модальное окно — Правила сервиса */}
    {showRules && (
      <div className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={() => setShowRules(false)}>
        <div className="w-full max-h-[88vh] flex flex-col rounded-t-3xl overflow-hidden"
          style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={e => e.stopPropagation()}>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="FileText" size={19} className="text-pink-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Правила сервиса</p>
                <p className="text-white/35 text-xs">Обновлено: 5 мая 2026</p>
              </div>
            </div>
            <button onClick={() => setShowRules(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
            {([
              { icon: "Heart", title: "Уважение и вежливость", text: "Общайтесь так, как хотите, чтобы общались с вами. Оскорбления, харассмент и агрессивное поведение ведут к немедленной блокировке." },
              { icon: "Shield", title: "Достоверность профиля", text: "Используйте только свои реальные фотографии. Запрещены чужие фото, фото знаменитостей, аниме и персонажей. Профиль должен отражать реальный облик." },
              { icon: "Lock", title: "Запрещённый контент", text: "Строго запрещены: материалы 18+ в публичных постах, насилие, экстремизм, пропаганда ненависти, спам и реклама сторонних сервисов." },
              { icon: "UserCheck", title: "Один аккаунт", text: "Создание нескольких аккаунтов для обхода блокировок запрещено. Мультиаккаунты удаляются без предупреждения." },
              { icon: "MessageSquare", title: "Честное общение", text: "Не вводите людей в заблуждение относительно своих намерений, внешности или личных данных. Мошенничество и манипуляции недопустимы." },
              { icon: "AlertTriangle", title: "Нарушения и последствия", text: "За нарушения: предупреждение → временная блокировка → перманентный бан. Тяжкие нарушения (мошенничество, CSAM) — бан без предупреждения с уведомлением властей." },
            ] as const).map((rule) => (
              <div key={rule.title} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(255,45,120,0.1)" }}>
                  <Icon name={rule.icon as "Heart"|"Shield"|"Lock"|"UserCheck"|"MessageSquare"|"AlertTriangle"} size={16} className="text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{rule.title}</p>
                  <p className="text-white/55 text-xs leading-relaxed mt-1">{rule.text}</p>
                </div>
              </div>
            ))}

            <button onClick={() => setShowRules(false)}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mt-2"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              Понятно, принимаю
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}