import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <Icon name={icon as "TrendingUp"} size={16} style={{ color }} />
      <p className="text-white font-bold text-2xl mt-1">{typeof value === "number" ? value.toLocaleString("ru") : value}</p>
      <p className="text-white/60 text-xs font-semibold">{label}</p>
      {sub && <p className="text-white/30 text-[10px]">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-white/50 text-xs w-20 flex-shrink-0 truncate">{label}</p>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-white/60 text-xs w-8 text-right flex-shrink-0">{value}</p>
    </div>
  );
}

export function AnalyticsTab({ token }: { token: string }) {
  const [section, setSection] = useState<"activity" | "demo" | "finance">("activity");
  const [activityData, setActivityData] = useState<{ dau: { date: string; dau: number }[]; mau: { month: string; new_users: number }[] } | null>(null);
  const [demoData, setDemoData] = useState<{ gender: Record<string, number>; age: Record<string, number>; cities: { city: string; count: number }[] } | null>(null);
  const [financeData, setFinanceData] = useState<{ total_gift_transactions: number; total_gift_revenue: number; premium_users: number; monthly: { month: string; count: number; revenue: number }[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (section === "activity") {
      adminApi.analyticsActivity(token).then(setActivityData).catch(() => {}).finally(() => setLoading(false));
    } else if (section === "demo") {
      adminApi.analyticsDemo(token).then(setDemoData).catch(() => {}).finally(() => setLoading(false));
    } else {
      adminApi.analyticsFinance(token).then(setFinanceData).catch(() => {}).finally(() => setLoading(false));
    }
  }, [token, section]);

  const sections = [
    { id: "activity" as const, label: "Активность", icon: "TrendingUp" },
    { id: "demo"     as const, label: "Демография", icon: "PieChart" },
    { id: "finance"  as const, label: "Финансы",    icon: "DollarSign" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Переключатель */}
      <div className="flex gap-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={section === s.id
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
              : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
            <Icon name={s.icon as "TrendingUp"} size={13} />{s.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── Активность ── */}
          {section === "activity" && activityData && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="flex-1 h-px" style={{ background: "rgba(99,179,237,0.3)" }} />
                  DAU — Активность за 30 дней
                  <span className="flex-1 h-px" style={{ background: "rgba(99,179,237,0.3)" }} />
                </p>
                {activityData.dau.length === 0 ? (
                  <p className="text-white/25 text-sm text-center py-4">Нет данных</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {activityData.dau.slice(0, 14).map(d => {
                      const maxDau = Math.max(...activityData.dau.map(x => x.dau));
                      return <Bar key={d.date} label={d.date.slice(5)} value={d.dau} max={maxDau} color="#60A5FA" />;
                    })}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="flex-1 h-px" style={{ background: "rgba(167,139,250,0.3)" }} />
                  Новые пользователи по месяцам
                  <span className="flex-1 h-px" style={{ background: "rgba(167,139,250,0.3)" }} />
                </p>
                <div className="flex flex-col gap-1.5">
                  {activityData.mau.map(m => {
                    const maxMau = Math.max(...activityData.mau.map(x => x.new_users));
                    return <Bar key={m.month} label={m.month} value={m.new_users} max={maxMau} color="#A78BFA" />;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Демография ── */}
          {section === "demo" && demoData && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Пол</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "male",   label: "Мужчины", color: "#60A5FA" },
                    { key: "female", label: "Женщины", color: "#F472B6" },
                    { key: "other",  label: "Другое",  color: "#A78BFA" },
                  ].map(g => (
                    <div key={g.key} className="rounded-2xl p-3 text-center"
                      style={{ background: `${g.color}12`, border: `1px solid ${g.color}30` }}>
                      <p className="text-white font-bold text-xl">{(demoData.gender[g.key] || 0).toLocaleString("ru")}</p>
                      <p className="text-white/50 text-xs mt-0.5">{g.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Возраст</p>
                <div className="flex flex-col gap-1.5">
                  {["18-24","25-34","35-44","45+","<18","unknown"].filter(k => demoData.age[k]).map(k => {
                    const maxAge = Math.max(...Object.values(demoData.age));
                    return <Bar key={k} label={k} value={demoData.age[k] || 0} max={maxAge} color="#34D399" />;
                  })}
                </div>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Топ городов</p>
                <div className="flex flex-col gap-1.5">
                  {demoData.cities.map((c, i) => (
                    <Bar key={c.city} label={c.city} value={c.count} max={demoData.cities[0]?.count || 1} color={i === 0 ? "#FCD34D" : "#F59E0B"} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Финансы ── */}
          {section === "finance" && financeData && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatCard label="Подарочных транзакций" value={financeData.total_gift_transactions} color="#F59E0B" icon="Gift" />
                <StatCard label="Выручка с подарков" value={`${Math.round(financeData.total_gift_revenue).toLocaleString("ru")} ₽`} color="#FCD34D" icon="DollarSign" />
                <StatCard label="Premium-пользователей" value={financeData.premium_users} color="#A78BFA" icon="Crown" />
              </div>
              {financeData.monthly.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Выручка по месяцам</p>
                  <div className="flex flex-col gap-1.5">
                    {financeData.monthly.map(m => {
                      const maxRev = Math.max(...financeData.monthly.map(x => x.revenue));
                      return <Bar key={m.month} label={m.month} value={Math.round(m.revenue)} max={maxRev || 1} color="#FCD34D" />;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AnalyticsTab;
