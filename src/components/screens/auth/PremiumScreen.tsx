import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { postsApi2, profilesApi } from "@/lib/api";

const LOGO_URL = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png";
const BG_URL = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/566a84d5-251d-4644-9509-2e4e44d143af.jpg";

const DEFAULT_PLANS = [
  { plan: "1month",  label: "1 месяц",    price_per_month: 699,  total_amount: 699,  duration_months: 1,  popular: false },
  { plan: "3month",  label: "3 месяца",   price_per_month: 449,  total_amount: 1347, duration_months: 3,  popular: true  },
  { plan: "12month", label: "12 месяцев", price_per_month: 249,  total_amount: 2988, duration_months: 12, popular: false },
];

type TierKey = "start" | "plus" | "gold";

interface Tier {
  key: TierKey;
  name: string;
  tagline: string;
  accent: string;
  accent2: string;
  features: { icon: string; label: string }[];
}

const TIERS: Tier[] = [
  {
    key: "start",
    name: "СТАРТ",
    tagline: "Первые шаги к знакомствам",
    accent: "#3B82F6",
    accent2: "#9B59B6",
    features: [
      { icon: "Heart", label: "Безлимитные лайки" },
      { icon: "RefreshCw", label: "Отмена свайпа" },
      { icon: "Filter", label: "Базовые фильтры поиска" },
      { icon: "Image", label: "1 приватное фото" },
    ],
  },
  {
    key: "plus",
    name: "ПЛЮС",
    tagline: "Больше внимания и контроля",
    accent: "#FF2D78",
    accent2: "#FF6B35",
    features: [
      { icon: "Heart", label: "Всё из тарифа Старт, и…" },
      { icon: "Eye", label: "Кто тебя лайкнул — без размытия" },
      { icon: "Zap", label: "Приоритет анкеты в поиске" },
      { icon: "Star", label: "Суперлайки каждый день" },
      { icon: "Image", label: "2 приватных фото" },
      { icon: "Sparkles", label: "Поиск по гороскопу" },
    ],
  },
  {
    key: "gold",
    name: "ЗОЛОТО",
    tagline: "Полный доступ без ограничений",
    accent: "#FFD700",
    accent2: "#FF2D78",
    features: [
      { icon: "Heart", label: "Всё из тарифа Плюс, и…" },
      { icon: "Shield", label: "Режим инкогнито" },
      { icon: "Rocket", label: "Буст профиля в топ" },
      { icon: "BadgeCheck", label: "Золотой значок Premium" },
      { icon: "MessageCircle", label: "Сообщения без совпадения" },
      { icon: "MapPin", label: "Поиск в любом городе" },
    ],
  },
];

export function PremiumScreen({ onClose, currentUser }: { onClose: () => void; currentUser?: { id: number; email: string; name: string } | null }) {
  const [rawPlans, setRawPlans] = useState(DEFAULT_PLANS);
  const [tier, setTier] = useState<TierKey>("plus");

  useEffect(() => {
    postsApi2.getPremiumPlans()
      .then((d) => { if (d.plans?.length) setRawPlans(d.plans); })
      .catch(() => {});
  }, []);

  const plans = rawPlans.map((p) => ({
    label:   p.label,
    price:   `${p.price_per_month.toLocaleString("ru")} ₽`,
    amount:  p.total_amount,
    per:     "/мес",
    popular: p.popular,
    total:   p.duration_months > 1 ? `${p.total_amount.toLocaleString("ru")} ₽` : "",
    plan:    p.plan,
  }));

  const defaultSelected = plans.findIndex((p) => p.popular);
  const [selected, setSelected] = useState(defaultSelected >= 0 ? defaultSelected : 1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState("");

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true); setPromoError("");
    try {
      const res = await profilesApi.activatePromo(code);
      setPromoDiscount(res.discount_percent);
      setPromoApplied(res.code);
      setPromoError("");
    } catch (e: unknown) {
      setPromoDiscount(0); setPromoApplied("");
      setPromoError(e instanceof Error ? e.message : "Промокод не найден");
    } finally {
      setPromoLoading(false);
    }
  };

  const active = TIERS.find((t) => t.key === tier)!;

  return (
    <div className="flex flex-col h-full overflow-y-auto relative" style={{ background: "#0f0a1a" }}>
      {/* Фоновая картинка */}
      <div className="absolute inset-0 pointer-events-none" style={{ height: 420 }}>
        <img src={BG_URL} className="w-full h-full object-cover" style={{ opacity: 0.5 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(15,10,26,0.15) 0%, #0f0a1a 92%)" }} />
      </div>

      <style>{`
        @keyframes premSpin {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 100% 0%; }
          50%  { background-position: 100% 100%; }
          75%  { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes logoHeartbeat {
          0%   { transform: scale(1); }
          14%  { transform: scale(1.13); }
          28%  { transform: scale(1); }
          42%  { transform: scale(1.07); }
          56%  { transform: scale(1); }
          100% { transform: scale(1); }
        }
        @keyframes glowRingPulse {
          0%   { opacity: 0.7; transform: scale(1); }
          50%  { opacity: 1;   transform: scale(1.06); }
          100% { opacity: 0.7; transform: scale(1); }
        }
        .prem-logo-img { animation: logoHeartbeat 1.4s ease-in-out infinite; }
        .prem-plan-inner {
          background: rgba(10,5,20,0.88);
          backdrop-filter: blur(12px);
          border-radius: 18px;
          width: 100%;
          height: 100%;
        }
        .prem-btn {
          background-size: 300% 300%;
          animation: premSpin 4s ease infinite;
          border-radius: 18px;
        }
      `}</style>

      {/* Кнопка закрытия */}
      <div className="relative flex items-center justify-end px-5 pb-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <Icon name="X" size={18} className="text-white/70" />
        </button>
      </div>

      {/* Hero: логотип + заголовок */}
      <div className="relative flex flex-col items-center px-5 pt-3 pb-5">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-[30px]"
            style={{
              background: `linear-gradient(135deg,${active.accent},${active.accent2})`,
              filter: "blur(18px)",
              opacity: 0.55,
              animation: "glowRingPulse 1.4s ease-in-out infinite",
              transform: "scale(1.15)",
            }} />
          <div className="relative rounded-[28px] p-[3px]" style={{ width: 84, height: 84, background: `linear-gradient(135deg,${active.accent},${active.accent2})` }}>
            <div className="rounded-[25px] overflow-hidden w-full h-full" style={{ background: "#130d22" }}>
              <img src={LOGO_URL} alt="Полутон" className="prem-logo-img w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <h2 className="font-unbounded text-white font-black text-2xl text-center tracking-wide mb-1">Полутон</h2>
        <p className="text-white/45 text-sm text-center leading-relaxed">
          Знакомься быстрее · Находи лучшее
        </p>
      </div>

      {/* Табы тарифов */}
      <div className="relative mx-4 mb-5 p-1 rounded-2xl flex" style={{ background: "rgba(255,255,255,0.06)" }}>
        {TIERS.map((t) => (
          <button key={t.key} onClick={() => setTier(t.key)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={tier === t.key
              ? { background: "#fff", color: "#130d22" }
              : { background: "transparent", color: "rgba(255,255,255,0.55)" }}>
            {t.name}
          </button>
        ))}
      </div>

      {/* Заголовок тарифа */}
      <div className="relative px-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-black text-xs uppercase tracking-widest" style={{ color: active.accent }}>
            Полутон {active.name}
          </span>
        </div>
        <p className="text-white font-bold text-xl mb-1">{active.tagline}</p>
      </div>

      {/* Фичи тарифа */}
      <div className="relative px-5 mb-6 flex flex-col gap-3.5">
        {active.features.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${active.accent}33,${active.accent2}33)` }}>
              <Icon name={f.icon as "Heart"} size={16} style={{ color: active.accent }} fallback="Sparkles" />
            </div>
            <span className="text-white/85 text-[15px] font-medium">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Планы длительности */}
      <div className="relative mx-4 flex flex-col gap-2.5 mb-5">
        {plans.map((p, i) => (
          <button key={p.label} onClick={() => setSelected(i)}
            className="relative text-left transition-all active:scale-[0.98] rounded-2xl p-[2px]"
            style={selected === i
              ? { background: `linear-gradient(135deg,${active.accent},${active.accent2})` }
              : { background: "rgba(255,255,255,0.08)" }}>
            <div className="prem-plan-inner px-4 py-3">
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="rounded-full px-3 py-0.5 text-[10px] font-black text-white"
                    style={{ background: `linear-gradient(135deg,${active.accent},${active.accent2})` }}>
                    ЛУЧШАЯ ЦЕНА
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={selected === i
                      ? { background: `linear-gradient(135deg,${active.accent},${active.accent2})` }
                      : { border: "2px solid rgba(255,255,255,0.25)" }}>
                    {selected === i && <Icon name="Check" size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{p.label}</p>
                    {p.total && <p className="text-white/35 text-xs mt-0.5">{p.total} всего</p>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-white font-black text-lg">{p.price}</span>
                  <span className="text-white/40 text-sm">{p.per}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Промокод */}
      <div className="relative px-4 mb-4">
        {!promoApplied ? (
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
              onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
              placeholder="Промокод"
              maxLength={32}
              className="flex-1 px-3.5 py-2.5 rounded-2xl text-white text-sm font-mono font-semibold tracking-widest outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: promoError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)",
                caretColor: active.accent,
              }}
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="px-4 py-2.5 rounded-2xl text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
              style={{ background: `${active.accent}33`, border: `1px solid ${active.accent}55` }}>
              {promoLoading
                ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin block" />
                : "Применить"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="flex items-center gap-2">
              <Icon name="Tag" size={14} className="text-emerald-400" />
              <span className="text-emerald-400 text-sm font-bold font-mono">{promoApplied}</span>
              <span className="text-emerald-400 text-sm font-black">−{promoDiscount}%</span>
            </div>
            <button onClick={() => { setPromoApplied(""); setPromoDiscount(0); setPromoCode(""); }}
              className="text-white/30 hover:text-white/60 transition-colors">
              <Icon name="X" size={14} />
            </button>
          </div>
        )}
        {promoError && <p className="text-red-400 text-xs mt-1.5 px-1">{promoError}</p>}
      </div>

      {/* Кнопка оплаты */}
      <div className="relative px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}>
        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
        <button
          disabled={paying}
          onClick={async () => {
            if (!currentUser) { setError("Войди в аккаунт для оплаты"); return; }
            setPaying(true); setError("");
            try {
              const plan = plans[selected];
              const rawAmount = plan.amount;
              const finalAmount = promoDiscount > 0
                ? Math.round(rawAmount * (1 - promoDiscount / 100))
                : rawAmount;
              const res = await fetch("https://functions.poehali.dev/d866e377-6dac-43c2-a709-799c346ac3ef", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: finalAmount,
                  description: `Полутон ${active.name} — ${plan.label}${promoApplied ? ` (промокод ${promoApplied})` : ""}`,
                  user_email: currentUser.email,
                  return_url: window.location.origin + "/?payment=success",
                  metadata: {
                    user_id: String(currentUser.id),
                    user_name: currentUser.name,
                    plan: plan.plan,
                    tier: active.key,
                    promo_code: promoApplied || undefined,
                    promo_discount: promoDiscount || undefined,
                  },
                }),
              });
              const data = await res.json();
              if (data.payment_url) {
                window.location.href = data.payment_url;
              } else {
                setError(data.error || "Ошибка создания платежа. Попробуй ещё раз.");
              }
            } catch {
              setError("Ошибка соединения. Попробуй ещё раз.");
            } finally {
              setPaying(false);
            }
          }}
          className="prem-btn w-full py-4 text-base font-black text-white disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundImage: `linear-gradient(135deg,${active.accent},${active.accent2},${active.accent})` }}>
          {paying
            ? <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />Создаём платёж...</>
            : promoDiscount > 0
              ? `Оплатить ${Math.round(plans[selected].amount * (1 - promoDiscount / 100)).toLocaleString("ru")} ₽`
              : `Оплатить ${plans[selected].total || plans[selected].price}`
          }
        </button>
        <p className="text-white/20 text-xs text-center mt-3 leading-relaxed">
          Подписка продлевается автоматически · Отмена в любой момент
        </p>
      </div>
    </div>
  );
}

export default PremiumScreen;