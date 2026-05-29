import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type PremiumPlan } from "@/lib/api";

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Icon name="Loader2" size={28} className="text-pink-400 animate-spin" />
    </div>
  );
}

// ─── Редактор одного тарифа ───────────────────────────────────────────────────
function PlanEditor({
  plan,
  salesCount,
  onSave,
}: {
  plan: PremiumPlan;
  salesCount: number;
  onSave: (id: number, fields: Partial<PremiumPlan>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState(plan.label);
  const [pricePerMonth, setPricePerMonth] = useState(String(plan.price_per_month));
  const [totalAmount, setTotalAmount] = useState(String(plan.total_amount));
  const [popular, setPopular] = useState(plan.popular);
  const [active, setActive] = useState(plan.active);

  const reset = () => {
    setLabel(plan.label);
    setPricePerMonth(String(plan.price_per_month));
    setTotalAmount(String(plan.total_amount));
    setPopular(plan.popular);
    setActive(plan.active);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(plan.id, {
        label,
        price_per_month: parseFloat(pricePerMonth),
        total_amount: parseFloat(totalAmount),
        popular,
        active,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: active
          ? "1px solid rgba(255,45,120,0.25)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            <Icon name="Crown" size={15} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{plan.label}</p>
            <p className="text-white/30 text-[10px]">plan_key: {plan.plan_key}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {popular && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,45,120,0.2)", color: "#FF2D78" }}>
              Популярный
            </span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${active ? "text-green-400" : "text-white/30"}`}
            style={{ background: active ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)" }}>
            {active ? "Активен" : "Скрыт"}
          </span>
          <button
            onClick={() => setEditing(!editing)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <Icon name={editing ? "ChevronUp" : "Pencil"} size={13} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-0" style={{ borderBottom: editing ? "1px solid rgba(255,255,255,0.06)" : undefined }}>
        <div className="flex flex-col items-center py-3 px-2"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-white font-bold text-base">{plan.price_per_month.toLocaleString("ru")} ₽</p>
          <p className="text-white/30 text-[10px] mt-0.5">в месяц</p>
        </div>
        <div className="flex flex-col items-center py-3 px-2"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-white font-bold text-base">{plan.total_amount.toLocaleString("ru")} ₽</p>
          <p className="text-white/30 text-[10px] mt-0.5">итого</p>
        </div>
        <div className="flex flex-col items-center py-3 px-2">
          <p className="text-white font-bold text-base">{salesCount}</p>
          <p className="text-white/30 text-[10px] mt-0.5">продаж</p>
        </div>
      </div>

      {/* Редактор */}
      {editing && (
        <div className="px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-white/40 text-xs">Название тарифа</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-xs">Цена / месяц (₽)</label>
              <input
                type="number"
                value={pricePerMonth}
                onChange={(e) => setPricePerMonth(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-xs">Итого (₽)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setPopular(!popular)}
                className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                style={{ background: popular ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}
              >
                <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                  style={{ left: popular ? "calc(100% - 18px)" : "2px" }} />
              </div>
              <span className="text-white/60 text-xs">Популярный</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setActive(!active)}
                className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                style={{ background: active ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.12)" }}
              >
                <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                  style={{ left: active ? "calc(100% - 18px)" : "2px" }} />
              </div>
              <span className="text-white/60 text-xs">Активен</span>
            </label>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}
            >
              {saving ? <Icon name="Loader2" size={13} className="animate-spin" /> : <><Icon name="Check" size={13} />Сохранить</>}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Вкладка Подписки ─────────────────────────────────────────────────────────
export function SubscriptionsTab({ token }: { token: string }) {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [totalPremium, setTotalPremium] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedId, setSavedId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.plans(token)
      .then((d) => {
        setPlans(d.plans);
        setStats(d.stats);
        setTotalPremium(d.total_premium);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const handleSave = async (id: number, fields: Partial<PremiumPlan>) => {
    await adminApi.updatePlan(token, id, fields);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2000);
    load();
  };

  if (loading) return <Spinner />;

  const totalRevenue = Object.entries(stats).reduce((sum, [key, count]) => {
    const plan = plans.find((p) => p.plan_key === key);
    return sum + (plan ? plan.total_amount * count : 0);
  }, 0);

  const totalSales = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Сводная статистика */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Активных подписок", value: totalPremium, icon: "Crown", color: "#FF2D78" },
          { label: "Продаж всего", value: totalSales, icon: "ShoppingCart", color: "#9B59B6" },
          { label: "Выручка ₽", value: totalRevenue.toLocaleString("ru"), icon: "TrendingUp", color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-1"
              style={{ background: `${s.color}22` }}>
              <Icon name={s.icon as "Crown"} size={14} style={{ color: s.color }} />
            </div>
            <p className="text-white font-bold text-base leading-none">{s.value}</p>
            <p className="text-white/30 text-[10px] leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Тарифы */}
      <div className="flex flex-col gap-1 mb-1">
        <p className="text-white font-semibold text-sm">Тарифные планы</p>
        <p className="text-white/30 text-xs">Редактируйте цены, названия и видимость планов</p>
      </div>

      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <div key={plan.id} className="relative">
            {savedId === plan.id && (
              <div className="absolute -top-2 right-3 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full text-green-400"
                style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}>
                ✓ Сохранено
              </div>
            )}
            <PlanEditor
              plan={plan}
              salesCount={stats[plan.plan_key] || 0}
              onSave={handleSave}
            />
          </div>
        ))}
      </div>

      {/* Подсказка */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: "rgba(255,45,120,0.07)", border: "1px solid rgba(255,45,120,0.15)" }}>
        <Icon name="Info" size={15} className="text-pink-400 flex-shrink-0 mt-0.5" />
        <p className="text-white/50 text-xs leading-relaxed">
          Изменения цен вступают в силу сразу для новых покупок. Текущие подписки не затрагиваются.
          Поле «Итого» — полная сумма за весь период (именно она списывается при оплате).
        </p>
      </div>
    </div>
  );
}
