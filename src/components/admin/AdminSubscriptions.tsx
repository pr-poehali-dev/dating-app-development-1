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

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)}
      className="w-10 h-5 rounded-full relative transition-all flex-shrink-0 cursor-pointer"
      style={{ background: value ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}>
      <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
        style={{ left: value ? "calc(100% - 18px)" : "2px" }} />
    </div>
  );
}

// ─── Редактор одного тарифа ───────────────────────────────────────────────────
function PlanEditor({
  plan, salesCount, onSave, onDelete,
}: {
  plan: PremiumPlan;
  salesCount: number;
  onSave: (id: number, fields: Partial<PremiumPlan>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [label, setLabel] = useState(plan.label);
  const [pricePerMonth, setPricePerMonth] = useState(String(plan.price_per_month));
  const [totalAmount, setTotalAmount] = useState(String(plan.total_amount));
  const [durationMonths, setDurationMonths] = useState(String(plan.duration_months));
  const [popular, setPopular] = useState(plan.popular);
  const [active, setActive] = useState(plan.active);

  const reset = () => {
    setLabel(plan.label);
    setPricePerMonth(String(plan.price_per_month));
    setTotalAmount(String(plan.total_amount));
    setDurationMonths(String(plan.duration_months));
    setPopular(plan.popular);
    setActive(plan.active);
    setEditing(false);
    setConfirmDelete(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(plan.id, {
        label,
        price_per_month: parseFloat(pricePerMonth),
        total_amount: parseFloat(totalAmount),
        duration_months: parseInt(durationMonths),
        popular,
        active,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(plan.id); } finally { setDeleting(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: active ? "1px solid rgba(255,45,120,0.25)" : "1px solid rgba(255,255,255,0.07)",
      }}>
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
            <p className="text-white/30 text-[10px]">key: {plan.plan_key} · {plan.duration_months} мес.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {popular && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,45,120,0.2)", color: "#FF2D78" }}>
              Хит
            </span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${active ? "text-green-400" : "text-white/30"}`}
            style={{ background: active ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)" }}>
            {active ? "Активен" : "Скрыт"}
          </span>
          <button onClick={() => { setEditing(!editing); setConfirmDelete(false); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name={editing ? "ChevronUp" : "Pencil"} size={13} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Цифры */}
      <div className="grid grid-cols-3 gap-0"
        style={{ borderBottom: editing ? "1px solid rgba(255,255,255,0.06)" : undefined }}>
        {[
          { label: "в месяц", value: `${plan.price_per_month.toLocaleString("ru")} ₽` },
          { label: "итого",   value: `${plan.total_amount.toLocaleString("ru")} ₽` },
          { label: "продаж",  value: salesCount },
        ].map((c, i) => (
          <div key={c.label} className="flex flex-col items-center py-3 px-2"
            style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : undefined }}>
            <p className="text-white font-bold text-base">{c.value}</p>
            <p className="text-white/30 text-[10px] mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Редактор */}
      {editing && (
        <div className="px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-white/40 text-xs">Название</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Цена/мес (₽)", val: pricePerMonth, set: setPricePerMonth },
              { label: "Итого (₽)",    val: totalAmount,   set: setTotalAmount   },
              { label: "Месяцев",      val: durationMonths, set: setDurationMonths },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px]">{f.label}</label>
                <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Toggle value={popular} onChange={setPopular} />
              <span className="text-white/60 text-xs">Популярный</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Toggle value={active} onChange={setActive} />
              <span className="text-white/60 text-xs">Активен</span>
            </label>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              {saving ? <Icon name="Loader2" size={13} className="animate-spin" /> : <><Icon name="Check" size={13} />Сохранить</>}
            </button>
            <button onClick={reset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              Отмена
            </button>
          </div>

          {/* Удаление */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors">
                <Icon name="Trash2" size={12} />Удалить тариф
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs flex-1">Удалить навсегда?</span>
                <button onClick={handleDelete} disabled={deleting}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 flex items-center gap-1 active:scale-95"
                  style={{ background: "rgba(239,68,68,0.8)" }}>
                  {deleting ? <Icon name="Loader2" size={11} className="animate-spin" /> : "Да, удалить"}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/40"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  Нет
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Форма создания нового тарифа ─────────────────────────────────────────────
function CreatePlanForm({ onCreated }: { onCreated: () => void; token: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [planKey, setPlanKey] = useState("");
  const [label, setLabel] = useState("");
  const [pricePerMonth, setPricePerMonth] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("1");
  const [popular, setPopular] = useState(false);
  const token = (window as unknown as { __adminToken?: string }).__adminToken || "";

  const reset = () => {
    setPlanKey(""); setLabel(""); setPricePerMonth(""); setTotalAmount("");
    setDurationMonths("1"); setPopular(false); setError(""); setOpen(false);
  };

  const create = async () => {
    if (!planKey || !label || !pricePerMonth || !totalAmount) {
      setError("Заполните все поля"); return;
    }
    setSaving(true); setError("");
    try {
      await adminApi.createPlan(token, {
        plan_key: planKey.trim().toLowerCase().replace(/\s+/g, "_"),
        label,
        price_per_month: parseFloat(pricePerMonth),
        total_amount: parseFloat(totalAmount),
        duration_months: parseInt(durationMonths),
        popular,
        active: true,
        sort_order: 99,
      });
      reset();
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors active:scale-95"
        style={{ border: "2px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
        <Icon name="Plus" size={16} />Добавить тариф
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "rgba(255,45,120,0.06)", border: "1px solid rgba(255,45,120,0.2)" }}>
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm flex items-center gap-2">
          <Icon name="Plus" size={15} className="text-pink-400" />Новый тариф
        </p>
        <button onClick={reset} className="w-6 h-6 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="X" size={12} className="text-white/50" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-white/40 text-[10px]">Ключ (латиница)</label>
          <input placeholder="6month" value={planKey} onChange={(e) => setPlanKey(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-white/40 text-[10px]">Название</label>
          <input placeholder="6 месяцев" value={label} onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Цена/мес (₽)", val: pricePerMonth, set: setPricePerMonth, ph: "349" },
          { label: "Итого (₽)",    val: totalAmount,   set: setTotalAmount,   ph: "2094" },
          { label: "Месяцев",      val: durationMonths, set: setDurationMonths, ph: "6" },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <label className="text-white/40 text-[10px]">{f.label}</label>
            <input type="number" placeholder={f.ph} value={f.val} onChange={(e) => f.set(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <Toggle value={popular} onChange={setPopular} />
        <span className="text-white/60 text-xs">Отметить как популярный</span>
      </label>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button onClick={create} disabled={saving}
        className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
        {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <><Icon name="Plus" size={14} />Создать тариф</>}
      </button>
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

  // Пробрасываем токен для CreatePlanForm через window (без prop drilling)
  useEffect(() => {
    (window as unknown as { __adminToken?: string }).__adminToken = token;
  }, [token]);

  const load = () => {
    setLoading(true);
    adminApi.plans(token)
      .then((d) => { setPlans(d.plans); setStats(d.stats); setTotalPremium(d.total_premium); })
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

  const handleDelete = async (id: number) => {
    await adminApi.deletePlan(token, id);
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
          { label: "Активных подписок", value: totalPremium,                       icon: "Crown",       color: "#FF2D78" },
          { label: "Продаж всего",       value: totalSales,                         icon: "ShoppingCart", color: "#9B59B6" },
          { label: "Выручка ₽",          value: totalRevenue.toLocaleString("ru"),  icon: "TrendingUp",  color: "#F59E0B" },
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">Тарифные планы</p>
          <p className="text-white/30 text-xs">{plans.length} тарифа · редактируйте цены и видимость</p>
        </div>
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
              onDelete={handleDelete}
            />
          </div>
        ))}

        {/* Форма создания */}
        <CreatePlanForm token={token} onCreated={load} />
      </div>

      {/* Подсказка */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: "rgba(255,45,120,0.07)", border: "1px solid rgba(255,45,120,0.15)" }}>
        <Icon name="Info" size={15} className="text-pink-400 flex-shrink-0 mt-0.5" />
        <p className="text-white/50 text-xs leading-relaxed">
          Изменения вступают в силу сразу. «Итого» — полная сумма за весь период, именно она списывается при оплате.
          Скрытые тарифы не отображаются пользователям.
        </p>
      </div>
    </div>
  );
}
