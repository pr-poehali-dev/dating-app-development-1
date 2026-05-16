import { useState } from "react";
import Icon from "@/components/ui/icon";
import { authApi, type User } from "@/lib/api";

type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live" | "verify" | "admin_verify";

// ─── AuthScreen ───────────────────────────────────────────────────────────────
export function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="flex flex-col h-full justify-center px-6 gap-6">
      <div className="text-center mb-4">
        <h1 className="font-unbounded text-white text-3xl font-black grad-text mb-2">LoveBloom</h1>
        <p className="text-white/40 text-sm">Знакомься. Общайся. Влюбляйся.</p>
      </div>

      <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="flex-1 py-2.5 text-sm font-medium transition-all"
              style={mode === m ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white", borderRadius: "16px" } : { color: "rgba(255,255,255,0.5)" }}>
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоё имя"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" type="password"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button onClick={submit} disabled={loading} className="btn-grad py-3.5 text-base font-semibold">
          {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </div>

      <p className="text-white/30 text-xs text-center">Нажимая кнопку, ты соглашаешься с правилами сервиса</p>
    </div>
  );
}

// ─── PremiumScreen ────────────────────────────────────────────────────────────
export function PremiumScreen({ onClose }: { onClose: () => void }) {
  const plans = [
    { label: "1 месяц", price: "699 ₽", per: "/мес", popular: false, total: "" },
    { label: "3 месяца", price: "449 ₽", per: "/мес", popular: true, total: "1 347 ₽" },
    { label: "12 месяцев", price: "249 ₽", per: "/мес", popular: false, total: "2 988 ₽" },
  ];
  const [selected, setSelected] = useState(1);

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
      <div className="flex items-center justify-end px-5 pt-5 pb-2">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><Icon name="X" size={22} /></button>
      </div>
      <div className="flex flex-col items-center px-5 pt-2 pb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 0 40px rgba(255,45,120,0.5)" }}>
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="font-unbounded text-white font-black text-2xl text-center mb-2">LoveBloom PREMIUM</h2>
        <p className="text-white/50 text-sm text-center">Знакомься быстрее, находи лучшее</p>
      </div>
      <div className="mx-5 glass-card p-4 mb-5">
        <div className="flex flex-col gap-3">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(155,89,182,0.2))" }}>
                <Icon name={f.icon as "Heart" | "Eye" | "Zap" | "RefreshCw" | "Star" | "Shield"} size={15} className="text-pink-400" />
              </div>
              <span className="text-white/80 text-sm">{f.label}</span>
              <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                <Icon name="Check" size={10} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-5 flex flex-col gap-2.5 mb-5">
        {plans.map((p, i) => (
          <button key={p.label} onClick={() => setSelected(i)}
            className="relative p-4 rounded-2xl text-left transition-all"
            style={selected === i
              ? { background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(155,89,182,0.2))", border: "2px solid #FF2D78" }
              : { background: "rgba(255,255,255,0.05)", border: "2px solid rgba(255,255,255,0.1)" }}>
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="premium-badge px-3 py-1">🔥 ВЫГОДНЕЕ ВСЕГО</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{p.label}</p>
                {p.total && <p className="text-white/40 text-xs">{p.total} всего</p>}
              </div>
              <div className="text-right">
                <span className="text-white font-bold text-xl">{p.price}</span>
                <span className="text-white/50 text-sm">{p.per}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="px-5 pb-8">
        <button className="btn-grad w-full py-4 text-base font-bold">Попробовать Premium</button>
        <p className="text-white/30 text-xs text-center mt-3">Автопродление. Отмена в любой момент.</p>
      </div>
    </div>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
export function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const items: { screen: Screen; icon: string; label: string; badge?: number }[] = [
    { screen: "discover", icon: "Flame", label: "Поиск" },
    { screen: "photos", icon: "Image", label: "Фото" },
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
            <Icon name={item.icon as "Flame" | "Image" | "Radio" | "MessageCircle" | "User"} size={22} />
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
