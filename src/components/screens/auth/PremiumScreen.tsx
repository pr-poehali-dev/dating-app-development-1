import { useState } from "react";
import Icon from "@/components/ui/icon";

const LOGO_URL = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/defb6829-9c31-4270-b350-feadf9619079.jpg";

export function PremiumScreen({ onClose, currentUser }: { onClose: () => void; currentUser?: { id: number; email: string; name: string } | null }) {
  const plans = [
    { label: "1 месяц",    price: "699 ₽",  amount: 699,  per: "/мес", popular: false, total: "",        plan: "1month"  },
    { label: "3 месяца",   price: "449 ₽",  amount: 1347, per: "/мес", popular: true,  total: "1 347 ₽", plan: "3month"  },
    { label: "12 месяцев", price: "249 ₽",  amount: 2988, per: "/мес", popular: false, total: "2 988 ₽", plan: "12month" },
  ];
  const [selected, setSelected] = useState(1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const features = [
    { icon: "Heart",     label: "Безлимитные лайки каждый день" },
    { icon: "Eye",       label: "Смотри, кто тебя лайкнул" },
    { icon: "Zap",       label: "Приоритет в поиске — больше показов" },
    { icon: "RefreshCw", label: "Отмена последнего свайпа" },
    { icon: "Star",      label: "Суперлайки каждый день" },
    { icon: "Shield",    label: "Режим инкогнито" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "linear-gradient(160deg, #130d22 0%, #1e1235 50%, #2a1545 100%)" }}>
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
          50%  { box-shadow: 0 0 0 16px rgba(255,45,120,0), 0 0 60px rgba(255,45,120,0.5); }
          100% { box-shadow: 0 0 0 0 rgba(255,45,120,0), 0 0 40px rgba(255,45,120,0.3); }
        }
        @keyframes glowRingPulse {
          0%   { opacity: 0.7; transform: scale(1); }
          50%  { opacity: 1;   transform: scale(1.06); }
          100% { opacity: 0.7; transform: scale(1); }
        }
        .prem-logo-img {
          animation: logoHeartbeat 1.4s ease-in-out infinite;
        }
        .prem-logo-ring {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6, #3B82F6, #FF2D78);
          background-size: 400% 400%;
          animation: premSpin 4s ease infinite, logoPulse 1.4s ease-in-out infinite;
          border-radius: 28px;
          padding: 3px;
        }
        .prem-logo-inner {
          background: #130d22;
          border-radius: 25px;
          overflow: hidden;
          width: 100%;
          height: 100%;
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
          border-radius: 20px;
          padding: 2px;
        }
        .prem-plan-border-idle {
          background: rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2px;
        }
        .prem-plan-inner {
          background: rgba(10,5,20,0.88);
          backdrop-filter: blur(12px);
          border-radius: 18px;
          width: 100%;
          height: 100%;
        }
        .prem-btn {
          background: linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6, #3B82F6, #FF2D78);
          background-size: 300% 300%;
          animation: premSpin 4s ease infinite;
          border-radius: 18px;
          box-shadow: 0 0 30px rgba(255,45,120,0.5), 0 4px 20px rgba(155,89,182,0.3);
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
          padding: 3px 14px;
          font-size: 11px;
          font-weight: 800;
          color: white;
          letter-spacing: 0.03em;
        }
        .prem-stars {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          border-radius: 28px;
        }
      `}</style>

      {/* Кнопка закрытия */}
      <div className="flex items-center justify-end px-5 pt-5 pb-0">
        <button onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="X" size={18} className="text-white/60" />
        </button>
      </div>

      {/* Hero: логотип + заголовок */}
      <div className="flex flex-col items-center px-5 pt-4 pb-6">
        {/* Логотип с heartbeat */}
        <div className="relative mb-5">
          {/* Внешнее кольцо-glow */}
          <div className="absolute inset-0 rounded-[30px]"
            style={{
              background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
              filter: "blur(18px)",
              opacity: 0.6,
              animation: "glowRingPulse 1.4s ease-in-out infinite",
              transform: "scale(1.15)",
            }} />
          {/* Рамка-градиент */}
          <div className="prem-logo-ring relative" style={{ width: 100, height: 100 }}>
            <div className="prem-logo-inner">
              <img
                src={LOGO_URL}
                alt="LoveBloom"
                className="prem-logo-img w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-unbounded text-white font-black text-2xl text-center tracking-wide">LoveBloom</h2>
          <span className="prem-badge">PREMIUM</span>
        </div>
        <p className="text-white/45 text-sm text-center leading-relaxed">
          Знакомься быстрее · Находи лучшее
        </p>
      </div>

      {/* Фичи */}
      <div className="mx-4 mb-4 rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex flex-col gap-3.5">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 prem-feature-icon">
                <Icon name={f.icon as "Heart"|"Eye"|"Zap"|"RefreshCw"|"Star"|"Shield"} size={15} className="text-white" />
              </div>
              <span className="text-white/80 text-sm flex-1">{f.label}</span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 prem-check">
                <Icon name="Check" size={10} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Планы */}
      <div className="mx-4 flex flex-col gap-3 mb-5">
        {plans.map((p, i) => (
          <button key={p.label} onClick={() => setSelected(i)}
            className={`relative text-left transition-all active:scale-[0.98] ${selected === i ? "prem-plan-border" : "prem-plan-border-idle"}`}>
            <div className="prem-plan-inner px-4 py-3.5">
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="prem-badge">🔥 ВЫГОДНЕЕ ВСЕГО</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{p.label}</p>
                  {p.total && <p className="text-white/35 text-xs mt-0.5">{p.total} всего</p>}
                </div>
                <div className="text-right">
                  <span className="font-black text-xl"
                    style={{ background: "linear-gradient(90deg,#FF2D78,#FFD700,#9B59B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% 100%", animation: "premSpin 4s ease infinite" }}>
                    {p.price}
                  </span>
                  <span className="text-white/40 text-sm">{p.per}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Кнопка оплаты */}
      <div className="px-4 pb-8">
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
                  metadata: { user_id: String(currentUser.id), user_name: currentUser.name, plan: plan.plan },
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
          className="prem-btn w-full py-4 text-base font-black text-white disabled:opacity-60 flex items-center justify-center gap-2">
          {paying
            ? <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />Создаём платёж...</>
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