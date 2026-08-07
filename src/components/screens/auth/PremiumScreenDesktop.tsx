import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { postsApi2, profilesApi } from "@/lib/api";

const LOGO_URL = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png";

const DEFAULT_PLANS = [
  { plan: "1month",  label: "1 месяц",    price_per_month: 699,  total_amount: 699,  duration_months: 1,  popular: false },
  { plan: "3month",  label: "3 месяца",   price_per_month: 449,  total_amount: 1347, duration_months: 3,  popular: true  },
  { plan: "12month", label: "12 месяцев", price_per_month: 249,  total_amount: 2988, duration_months: 12, popular: false },
];

const FEATURES = [
  { icon: "Heart",       label: "Безлимитные лайки",           desc: "Без дневных ограничений" },
  { icon: "Eye",         label: "Кто тебя лайкнул",            desc: "Видно всех без размытия" },
  { icon: "Zap",         label: "Приоритет в поиске",          desc: "Анкета выше остальных" },
  { icon: "RefreshCw",   label: "Отмена свайпа",               desc: "Верни последний свайп" },
  { icon: "Star",        label: "Суперлайки каждый день",      desc: "Выделяйся из толпы" },
  { icon: "Shield",      label: "Режим инкогнито",             desc: "Смотри анкеты незаметно" },
  { icon: "MapPin",      label: "Люди рядом без границ",       desc: "Меняй город поиска" },
  { icon: "Filter",      label: "Расширенные фильтры",         desc: "Поиск по параметрам" },
  { icon: "MessageCircle", label: "Сообщения без совпадения",  desc: "Пиши первым, кому хочешь" },
  { icon: "Rocket",      label: "Буст профиля",                desc: "Подними анкету в топ" },
  { icon: "BadgeCheck",  label: "Значок Premium",              desc: "Золотой бейдж у имени" },
  { icon: "Sparkles",    label: "Поиск по гороскопу",          desc: "По знаку и совместимости" },
];

export function PremiumScreenDesktop({ onClose, currentUser }: { onClose: () => void; currentUser?: { id: number; email: string; name: string } | null }) {
  const [rawPlans, setRawPlans] = useState(DEFAULT_PLANS);

  useEffect(() => {
    postsApi2.getPremiumPlans()
      .then((d) => { if (d.plans?.length) setRawPlans(d.plans); })
      .catch(() => {});
  }, []);

  const plans = rawPlans.map((p) => ({
    label: p.label,
    price: `${p.price_per_month.toLocaleString("ru")} ₽`,
    amount: p.total_amount,
    per: "/мес",
    popular: p.popular,
    total: p.duration_months > 1 ? `${p.total_amount.toLocaleString("ru")} ₽` : "",
    plan: p.plan,
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

  const handlePay = async () => {
    if (!currentUser) { setError("Войди в аккаунт для оплаты"); return; }
    setPaying(true); setError("");
    try {
      const plan = plans[selected];
      const rawAmount = plan.amount;
      const finalAmount = promoDiscount > 0 ? Math.round(rawAmount * (1 - promoDiscount / 100)) : rawAmount;
      const res = await fetch("https://functions.poehali.dev/d866e377-6dac-43c2-a709-799c346ac3ef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          description: `Полутон Premium — ${plan.label}${promoApplied ? ` (промокод ${promoApplied})` : ""}`,
          user_email: currentUser.email,
          return_url: window.location.origin + "/?payment=success",
          metadata: {
            user_id: String(currentUser.id),
            user_name: currentUser.name,
            plan: plan.plan,
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
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(160deg, #130d22 0%, #1e1235 45%, #2a1545 100%)", scrollbarWidth: "thin" }}>
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
        @keyframes logoPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,45,120,0.5), 0 0 40px rgba(255,45,120,0.3); }
          50%  { box-shadow: 0 0 0 20px rgba(255,45,120,0), 0 0 70px rgba(255,45,120,0.5); }
          100% { box-shadow: 0 0 0 0 rgba(255,45,120,0), 0 0 40px rgba(255,45,120,0.3); }
        }
        @keyframes glowRingPulse {
          0%   { opacity: 0.6; transform: scale(1); }
          50%  { opacity: 0.95; transform: scale(1.08); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        @keyframes premFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes premDrift1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-20px) scale(1.1);} }
        @keyframes premDrift2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-25px,25px) scale(1.05);} }
        .prem-d-logo-ring {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6, #3B82F6, #FF2D78);
          background-size: 400% 400%;
          animation: premSpin 4s ease infinite, logoPulse 1.6s ease-in-out infinite;
          border-radius: 32px;
          padding: 4px;
        }
        .prem-d-logo-inner { background: #130d22; border-radius: 28px; overflow: hidden; width: 100%; height: 100%; }
        .prem-d-logo-img { animation: logoHeartbeat 1.6s ease-in-out infinite; }
        .prem-d-plan-border {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6, #FF2D78);
          background-size: 300% 300%;
          animation: premSpin 4s ease infinite;
          border-radius: 28px;
          padding: 2.5px;
        }
        .prem-d-plan-border-idle { background: rgba(255,255,255,0.08); border-radius: 28px; padding: 2.5px; }
        .prem-d-plan-inner {
          background: rgba(10,5,20,0.9);
          backdrop-filter: blur(16px);
          border-radius: 25.5px;
          width: 100%; height: 100%;
        }
        .prem-d-btn {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6, #3B82F6, #FF2D78);
          background-size: 300% 300%;
          animation: premSpin 4s ease infinite;
          box-shadow: 0 0 40px rgba(255,45,120,0.5), 0 8px 30px rgba(155,89,182,0.35);
        }
        .prem-d-feature-icon {
          background: linear-gradient(135deg, #FF2D78, #9B59B6, #FF6B35);
          background-size: 200% 200%;
          animation: premSpin 5s ease infinite;
        }
        .prem-d-check { background: linear-gradient(135deg, #FF2D78, #FFD700); background-size: 200% 200%; animation: premSpin 4s ease infinite reverse; }
        .prem-d-badge {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700);
          background-size: 200% 200%;
          animation: premSpin 3s ease infinite;
          border-radius: 99px; padding: 4px 16px; font-size: 12px; font-weight: 800; color: white; letter-spacing: 0.03em;
        }
        .prem-d-price {
          background: linear-gradient(90deg,#FF2D78,#FFD700,#9B59B6);
          background-size: 200% 100%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: premSpin 4s ease infinite;
        }
        .prem-d-feature-card { transition: all 0.25s cubic-bezier(0.2,0.8,0.2,1); }
        .prem-d-feature-card:hover { background: rgba(255,255,255,0.06) !important; transform: translateY(-3px); border-color: rgba(255,45,120,0.3) !important; }
        .prem-d-plan-card { transition: all 0.25s cubic-bezier(0.2,0.8,0.2,1); }
        .prem-d-plan-card:hover { transform: translateY(-6px); }
      `}</style>

      {/* Кнопка закрытия */}
      <div className="flex items-center justify-end px-10 pt-8">
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/15 hover:rotate-90 duration-300"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="X" size={19} className="text-white/70" />
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden px-10 pt-4 pb-14">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,45,120,0.28), transparent 70%)", filter: "blur(30px)", animation: "premDrift1 9s ease-in-out infinite" }} />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(155,89,182,0.25), transparent 70%)", filter: "blur(30px)", animation: "premDrift2 11s ease-in-out infinite" }} />

        <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="relative mb-6" style={{ animation: "premFloat 4s ease-in-out infinite" }}>
            <div className="absolute inset-0 rounded-[36px]"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", filter: "blur(26px)", opacity: 0.65, animation: "glowRingPulse 1.6s ease-in-out infinite", transform: "scale(1.2)" }} />
            <div className="prem-d-logo-ring relative" style={{ width: 120, height: 120 }}>
              <div className="prem-d-logo-inner">
                <img src={LOGO_URL} alt="Полутон" className="prem-d-logo-img w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <h1 className="font-unbounded text-white font-black text-5xl tracking-tight">Полутон</h1>
            <span className="prem-d-badge">PREMIUM</span>
          </div>
          <p className="text-white/55 text-lg leading-relaxed max-w-lg">
            Знакомься быстрее, находи лучшее — открой все возможности без ограничений
          </p>
        </div>
      </div>

      {/* ── Планы ── */}
      <div className="px-10 mb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <button key={p.label} onClick={() => setSelected(i)}
              className={`prem-d-plan-card relative text-left ${selected === i ? "prem-d-plan-border" : "prem-d-plan-border-idle"}`}>
              <div className="prem-d-plan-inner px-6 py-8 flex flex-col items-center text-center">
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="prem-d-badge whitespace-nowrap">🔥 ВЫГОДНЕЕ ВСЕГО</span>
                  </div>
                )}
                <p className="text-white/50 text-sm font-semibold uppercase tracking-wide mb-3">{p.label}</p>
                <div className="mb-1">
                  <span className="prem-d-price font-unbounded font-black text-4xl">{p.price}</span>
                  <span className="text-white/40 text-lg">{p.per}</span>
                </div>
                {p.total && <p className="text-white/35 text-xs mb-4">{p.total} всего</p>}
                {!p.total && <div className="mb-4" />}
                <div className={`w-full py-2.5 rounded-2xl text-sm font-bold transition-all ${selected === i ? "text-white" : "text-white/40"}`}
                  style={selected === i ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : { background: "rgba(255,255,255,0.05)" }}>
                  {selected === i ? "✓ Выбрано" : "Выбрать"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Фичи ── */}
      <div className="px-10 mb-14">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-white font-black text-2xl mb-1">Что входит в подписку</p>
            <p className="text-white/40 text-sm">Полный доступ ко всем возможностям Полутон</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="prem-d-feature-card flex items-start gap-3.5 p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 prem-d-feature-icon">
                  <Icon name={f.icon as "Heart"} size={17} className="text-white" fallback="Sparkles" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm">{f.label}</span>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 prem-d-check">
                      <Icon name="Check" size={9} className="text-white" />
                    </div>
                  </div>
                  <p className="text-white/45 text-xs leading-snug mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Промокод + Оплата ── */}
      <div className="px-10 pb-16">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {!promoApplied ? (
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
                placeholder="Промокод"
                maxLength={32}
                className="flex-1 px-4 py-3 rounded-2xl text-white text-sm font-mono font-semibold tracking-widest outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: promoError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)", caretColor: "#FF2D78" }}
              />
              <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}
                className="px-5 py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-40 transition-all hover:bg-pink-500/35"
                style={{ background: "rgba(255,45,120,0.25)", border: "1px solid rgba(255,45,120,0.3)" }}>
                {promoLoading ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin block" /> : "Применить"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Tag" size={15} className="text-emerald-400" />
                <span className="text-emerald-400 text-sm font-bold font-mono">{promoApplied}</span>
                <span className="text-emerald-400 text-sm font-black">−{promoDiscount}%</span>
              </div>
              <button onClick={() => { setPromoApplied(""); setPromoDiscount(0); setPromoCode(""); }}
                className="text-white/30 hover:text-white/60 transition-colors">
                <Icon name="X" size={15} />
              </button>
            </div>
          )}
          {promoError && <p className="text-red-400 text-xs px-1">{promoError}</p>}

  
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button disabled={paying} onClick={handlePay}
            className="prem-d-btn w-full py-4 rounded-2xl text-base font-black text-white disabled:opacity-60 flex items-center justify-center gap-2 hover:brightness-110 hover:-translate-y-0.5 transition-all">
            {paying
              ? <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />Создаём платёж...</>
              : promoDiscount > 0
                ? `Оплатить ${Math.round(plans[selected].amount * (1 - promoDiscount / 100)).toLocaleString("ru")} ₽`
                : `Оплатить ${plans[selected].total || plans[selected].price}`
            }
          </button>
          <p className="text-white/25 text-xs text-center leading-relaxed">
            Подписка продлевается автоматически · Отмена в любой момент
          </p>
        </div>
      </div>
    </div>
  );
}

export default PremiumScreenDesktop;
