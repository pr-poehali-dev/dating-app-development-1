import { useState } from "react";
import Icon from "@/components/ui/icon";
import { authApi, type User } from "@/lib/api";

// ─── ForgotPasswordModal ───────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm animate-slide-up p-6 flex flex-col gap-4"
        style={{ background: "var(--spark-dark2, #1a1625)", borderRadius: "28px 28px 0 0" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-golos font-bold text-lg">Восстановление пароля</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(74,222,128,0.15)" }}>
              <Icon name="Mail" size={28} className="text-green-400" />
            </div>
            <p className="text-white font-semibold text-center">Письмо отправлено!</p>
            <p className="text-white/50 text-sm text-center">Проверь почту {email} — там новый пароль для входа.</p>
            <button onClick={onClose} className="btn-grad w-full py-3 text-sm font-semibold mt-2">Войти</button>
          </div>
        ) : (
          <>
            <p className="text-white/50 text-sm">Введи email — пришлём новый пароль.</p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              placeholder="Email" onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={submit} disabled={loading} className="btn-grad py-3 text-sm font-semibold disabled:opacity-50">
              {loading ? "Отправляем..." : "Отправить новый пароль"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live" | "verify" | "admin_verify";

// ─── AuthScreen ───────────────────────────────────────────────────────────────
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

// ─── PremiumScreen ────────────────────────────────────────────────────────────
export function PremiumScreen({ onClose, currentUser }: { onClose: () => void; currentUser?: { id: number; email: string; name: string } | null }) {
  const plans = [
    { label: "1 месяц",   price: "699 ₽",  amount: 699,  per: "/мес", popular: false, total: "",        plan: "1month"  },
    { label: "3 месяца",  price: "449 ₽",  amount: 1347, per: "/мес", popular: true,  total: "1 347 ₽", plan: "3month"  },
    { label: "12 месяцев",price: "249 ₽",  amount: 2988, per: "/мес", popular: false, total: "2 988 ₽", plan: "12month" },
  ];
  const [selected, setSelected] = useState(1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const features = [
    { icon: "Heart", label: "Безлимитные лайки каждый день" },
    { icon: "Eye", label: "Смотри, кто тебя лайкнул" },
    { icon: "Zap", label: "Приоритет в поиске — больше показов" },
    { icon: "RefreshCw", label: "Отмена последнего свайпа" },
    { icon: "Star", label: "Суперлайки каждый день" },
    { icon: "Shield", label: "Режим инкогнито" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "linear-gradient(160deg, #1A1625, #2D1B3D)" }}>
      <style>{`
        @keyframes premSpin {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 100% 0%; }
          50%  { background-position: 100% 100%; }
          75%  { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes premOrbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .prem-glow-ring {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6, #3B82F6, #FF2D78);
          background-size: 400% 400%;
          animation: premSpin 5s ease infinite;
          border-radius: 9999px;
          padding: 3px;
          box-shadow: 0 0 50px rgba(255,45,120,0.6), 0 0 100px rgba(155,89,182,0.3);
        }
        .prem-glow-inner {
          background: #1A1625;
          border-radius: 9999px;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prem-plan-border {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6, #FF2D78);
          background-size: 300% 300%;
          animation: premSpin 4s ease infinite;
          border-radius: 18px;
          padding: 2px;
        }
        .prem-plan-border-idle {
          background: rgba(255,255,255,0.1);
          border-radius: 18px;
          padding: 2px;
        }
        .prem-plan-inner {
          background: rgba(10,5,20,0.85);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          width: 100%;
          height: 100%;
        }
        .prem-btn {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6, #3B82F6, #FF2D78);
          background-size: 300% 300%;
          animation: premSpin 4s ease infinite;
          border-radius: 16px;
          box-shadow: 0 0 30px rgba(255,45,120,0.5);
        }
        .prem-feature-icon {
          background: linear-gradient(135deg, #FF2D78, #9B59B6, #FF6B35);
          background-size: 200% 200%;
          animation: premSpin 5s ease infinite;
        }
        .prem-check {
          background: linear-gradient(135deg, #FF2D78, #FFD700);
          background-size: 200% 200%;
          animation: premSpin 4s ease infinite reverse;
        }
        .prem-badge {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700);
          background-size: 200% 200%;
          animation: premSpin 3s ease infinite;
          border-radius: 99px;
          padding: 2px 12px;
          font-size: 11px;
          font-weight: 800;
          color: white;
          letter-spacing: 0.03em;
        }
      `}</style>
      <div className="flex items-center justify-end px-5 pt-5 pb-2">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><Icon name="X" size={22} /></button>
      </div>
      <div className="flex flex-col items-center px-5 pt-2 pb-6">
        <div className="prem-glow-ring w-20 h-20 mb-4">
          <div className="prem-glow-inner">
            <span className="text-4xl">✨</span>
          </div>
        </div>
        <h2 className="font-unbounded text-white font-black text-2xl text-center mb-2">LoveBloom PREMIUM</h2>
        <p className="text-white/50 text-sm text-center">Знакомься быстрее, находи лучшее</p>
      </div>
      <div className="mx-5 glass-card p-4 mb-5">
        <div className="flex flex-col gap-3">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 prem-feature-icon">
                <Icon name={f.icon as "Heart" | "Eye" | "Zap" | "RefreshCw" | "Star" | "Shield"} size={15} className="text-white" />
              </div>
              <span className="text-white/80 text-sm">{f.label}</span>
              <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 prem-check">
                <Icon name="Check" size={10} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-5 flex flex-col gap-3 mb-5">
        {plans.map((p, i) => (
          <button key={p.label} onClick={() => setSelected(i)}
            className={`relative text-left transition-all active:scale-[0.98] ${selected === i ? "prem-plan-border" : "prem-plan-border-idle"}`}>
            <div className="prem-plan-inner p-4">
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="prem-badge">🔥 ВЫГОДНЕЕ ВСЕГО</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{p.label}</p>
                {p.total && <p className="text-white/40 text-xs">{p.total} всего</p>}
              </div>
              <div className="text-right">
                <span className="font-bold text-xl" style={{ background: "linear-gradient(90deg,#FF2D78,#FFD700,#9B59B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% 100%", animation: "premSpin 4s ease infinite" }}>{p.price}</span>
                <span className="text-white/50 text-sm">{p.per}</span>
              </div>
            </div>
            </div>
          </button>
        ))}
      </div>
      <div className="px-5 pb-8">
        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
        <button
          disabled={paying}
          onClick={async () => {
            if (!currentUser) { setError("Войди в аккаунт для оплаты"); return; }
            setPaying(true); setError("");
            try {
              const plan = plans[selected];
              const res = await fetch("https://functions.poehali.dev/d866e377-6dac-43c2-a709-799c346ac3ef", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: plan.amount,
                  description: `LoveBloom Premium — ${plan.label}`,
                  user_email: currentUser.email,
                  return_url: window.location.origin + "/?payment=success",
                  metadata: {
                    user_id: String(currentUser.id),
                    user_name: currentUser.name,
                    plan: plan.plan,
                  },
                }),
              });
              const data = await res.json();
              if (data.payment_url) {
                window.location.href = data.payment_url;
              } else {
                setError("Ошибка создания платежа. Попробуй ещё раз.");
              }
            } catch {
              setError("Ошибка соединения. Попробуй ещё раз.");
            } finally {
              setPaying(false);
            }
          }}
          className="prem-btn w-full py-4 text-base font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2">
          {paying
            ? <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />Создаём платёж...</>
            : `Оплатить ${plans[selected].total || plans[selected].price}`}
        </button>
        <p className="text-white/30 text-xs text-center mt-3">Безопасная оплата через ЮKassa</p>
      </div>
    </div>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
export function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const items: { screen: Screen; icon: string; label: string; badge?: number }[] = [
    { screen: "discover", icon: "Home", label: "Главная" },
    { screen: "photos", icon: "Search", label: "Поиск" },
    { screen: "live", icon: "Radio", label: "Live" },
    { screen: "matches", icon: "MessageCircle", label: "Чаты" },
    { screen: "profile", icon: "User", label: "Профиль" },
  ];

  return (
    <div className="flex items-center justify-around px-4 py-2 relative z-10"
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(26,22,37,0.95)", backdropFilter: "blur(20px)" }}>
      {items.map((item) => (
        <button key={item.screen}
          className={`nav-item relative ${active === item.screen ? "active" : ""}`}
          onClick={() => onChange(item.screen)}>
          <div className="relative">
            <Icon name={item.icon as "Home" | "Search" | "Radio" | "MessageCircle" | "User"} size={22} />
            {item.badge && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                {item.badge}
              </div>
            )}
          </div>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}