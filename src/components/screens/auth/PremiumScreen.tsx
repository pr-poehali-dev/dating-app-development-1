import { useState } from "react";
import Icon from "@/components/ui/icon";

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
