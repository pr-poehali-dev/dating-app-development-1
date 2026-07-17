import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";

// ─── Мини SVG-график (линия) ──────────────────────────────────────────────────
function LineChart({ data, color, height = 80 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 320; const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `0,${h} ` + polyline + ` ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`lg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#lg-${color.replace("#","")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Последняя точка */}
      <circle cx={pts[pts.length-1].split(",")[0]} cy={pts[pts.length-1].split(",")[1]}
        r="4" fill={color} stroke="rgba(15,10,26,1)" strokeWidth="2" />
    </svg>
  );
}

// ─── Горизонтальный бар с анимацией ──────────────────────────────────────────
function HBar({ label, value, max, color, rank }: { label: string; value: number; max: number; color: string; rank?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      {rank !== undefined && (
        <span className="text-white/20 text-[10px] font-bold w-4 text-center flex-shrink-0">{rank}</span>
      )}
      <p className="text-white/60 text-xs flex-shrink-0 truncate" style={{ width: 68 }}>{label}</p>
      <div className="flex-1 relative h-5 flex items-center">
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.85 }} />
        </div>
        <span className="relative ml-2 text-white font-semibold text-xs">{value.toLocaleString("ru")}</span>
      </div>
      <span className="text-white/25 text-[10px] w-8 text-right flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ─── Карточка метрики ─────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, color, large }: {
  label: string; value: string | number; sub?: string; icon: string; color: string; large?: boolean;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}30` }}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
        style={{ background: color, filter: "blur(20px)" }} />
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}>
        <Icon name={icon as "TrendingUp"} size={16} style={{ color }} />
      </div>
      <div>
        <p className={`text-white font-bold ${large ? "text-3xl" : "text-2xl"}`}>
          {typeof value === "number" ? value.toLocaleString("ru") : value}
        </p>
        <p className="text-white/50 text-xs font-medium mt-0.5">{label}</p>
        {sub && <p className="text-white/25 text-[10px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Пончик-диаграмма (SVG) ───────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40; const cx = 56; const cy = 56;
  let offset = -90;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const angle = pct * 360;
    const start = offset;
    offset += angle;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + angle - 0.5));
    const y2 = cy + r * Math.sin(toRad(start + angle - 0.5));
    const large = angle > 180 ? 1 : 0;
    return { ...seg, pct: Math.round(pct * 100), d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 112 112" className="w-24 h-24 flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.04)" />
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={24} fill="#0f0a1a" />
        <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="11" fontWeight="700">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.35)" fontSize="7">всего</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
            <span className="text-white/60 text-xs">{a.label}</span>
            <span className="text-white font-bold text-xs ml-auto pl-3">{a.value.toLocaleString("ru")}</span>
            <span className="text-white/25 text-[10px]">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Секция-заголовок ─────────────────────────────────────────────────────────
function SectionTitle({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}>
        <Icon name={icon as "TrendingUp"} size={11} style={{ color }} />
      </div>
      <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{label}</p>
      <div className="flex-1 h-px" style={{ background: `${color}25` }} />
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────
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
    { id: "activity" as const, label: "Активность", icon: "TrendingUp",  color: "#60A5FA" },
    { id: "demo"     as const, label: "Демография", icon: "PieChart",     color: "#F472B6" },
    { id: "finance"  as const, label: "Финансы",    icon: "DollarSign",   color: "#FCD34D" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Переключатель секций */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={section === s.id
              ? { background: `${s.color}18`, color: s.color, boxShadow: `inset 0 0 0 1px ${s.color}40` }
              : { color: "rgba(255,255,255,0.35)" }}>
            <Icon name={s.icon as "TrendingUp"} size={13} />{s.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ══ АКТИВНОСТЬ ══ */}
          {section === "activity" && activityData && (() => {
            const dauVals = activityData.dau.slice(0, 30).map(d => d.dau).reverse();
            const maxDau  = Math.max(...activityData.dau.map(x => x.dau), 1);
            const maxMau  = Math.max(...activityData.mau.map(x => x.new_users), 1);
            const totalDau = activityData.dau.reduce((s, d) => s + d.dau, 0);
            const peakDau  = maxDau;
            return (
              <div className="flex flex-col gap-4">
                {/* Метрики */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Активных (30 дней)" value={totalDau} icon="Activity" color="#60A5FA" sub="уникальных сессий" />
                  <MetricCard label="Пик активности" value={peakDau} icon="Zap" color="#818CF8" sub="в один день" />
                </div>

                {/* График DAU */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(96,165,250,0.15)" }}>
                  <SectionTitle label="DAU — активность за 30 дней" icon="TrendingUp" color="#60A5FA" />
                  {dauVals.length >= 2
                    ? <LineChart data={dauVals} color="#60A5FA" height={90} />
                    : <p className="text-white/20 text-sm text-center py-6">Недостаточно данных</p>
                  }
                  {activityData.dau.length > 0 && (
                    <div className="mt-4 flex flex-col gap-1.5">
                      {activityData.dau.slice(0, 10).map(d => (
                        <HBar key={d.date} label={d.date.slice(5)} value={d.dau} max={maxDau} color="linear-gradient(90deg,#60A5FA,#818CF8)" />
                      ))}
                    </div>
                  )}
                </div>

                {/* График MAU */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.15)" }}>
                  <SectionTitle label="Новые пользователи по месяцам" icon="Users" color="#A78BFA" />
                  <div className="flex flex-col gap-1.5">
                    {activityData.mau.map((m, i) => (
                      <HBar key={m.month} label={m.month} value={m.new_users} max={maxMau} color="linear-gradient(90deg,#A78BFA,#F472B6)" rank={i + 1} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══ ДЕМОГРАФИЯ ══ */}
          {section === "demo" && demoData && (() => {
            const genderSegs = [
              { key: "male",   label: "Мужчины", color: "#60A5FA" },
              { key: "female", label: "Женщины", color: "#F472B6" },
              { key: "other",  label: "Другое",  color: "#A78BFA" },
            ].map(g => ({ ...g, value: demoData.gender[g.key] || 0 })).filter(g => g.value > 0);

            const ageKeys = ["18-24","25-34","35-44","45+","<18","unknown"].filter(k => demoData.age[k]);
            const maxAge  = Math.max(...ageKeys.map(k => demoData.age[k] || 0), 1);
            const ageColors = ["#34D399","#6EE7B7","#A7F3D0","#10B981","#059669","#6B7280"];

            return (
              <div className="flex flex-col gap-4">
                {/* Пол */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(244,114,182,0.15)" }}>
                  <SectionTitle label="Распределение по полу" icon="Users" color="#F472B6" />
                  {genderSegs.length > 0
                    ? <DonutChart segments={genderSegs} />
                    : <p className="text-white/20 text-sm text-center py-4">Нет данных</p>
                  }
                </div>

                {/* Возраст */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)" }}>
                  <SectionTitle label="Возрастные группы" icon="BarChart2" color="#34D399" />
                  <div className="flex flex-col gap-2">
                    {ageKeys.map((k, i) => (
                      <HBar key={k} label={k + " лет"} value={demoData.age[k] || 0} max={maxAge} color={ageColors[i] || "#34D399"} rank={i + 1} />
                    ))}
                  </div>
                </div>

                {/* Города */}
                {demoData.cities.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(252,211,77,0.15)" }}>
                    <SectionTitle label="Топ городов" icon="MapPin" color="#FCD34D" />
                    <div className="flex flex-col gap-2">
                      {demoData.cities.slice(0, 10).map((c, i) => (
                        <HBar key={c.city} label={c.city || "—"} value={c.count} max={demoData.cities[0]?.count || 1}
                          color={i === 0 ? "#FCD34D" : i < 3 ? "#F59E0B" : "#92400E"} rank={i + 1} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══ ФИНАНСЫ ══ */}
          {section === "finance" && financeData && (() => {
            const maxRev  = Math.max(...financeData.monthly.map(x => x.revenue), 1);
            const totalRev = financeData.monthly.reduce((s, m) => s + m.revenue, 0);
            const revVals  = financeData.monthly.map(m => m.revenue);
            return (
              <div className="flex flex-col gap-4">
                {/* Метрики */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Выручка всего" value={`${Math.round(totalRev).toLocaleString("ru")} ₽`}
                    icon="TrendingUp" color="#FCD34D" large />
                  <MetricCard label="Premium-пользователей" value={financeData.premium_users}
                    icon="Crown" color="#A78BFA" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Подарочных транзакций" value={financeData.total_gift_transactions}
                    icon="Gift" color="#F472B6" />
                  <MetricCard label="Выручка с подарков" value={`${Math.round(financeData.total_gift_revenue).toLocaleString("ru")} ₽`}
                    icon="DollarSign" color="#34D399" />
                </div>

                {/* График выручки */}
                {financeData.monthly.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(252,211,77,0.15)" }}>
                    <SectionTitle label="Выручка по месяцам" icon="BarChart2" color="#FCD34D" />
                    {revVals.length >= 2 && (
                      <div className="mb-4">
                        <LineChart data={revVals} color="#FCD34D" height={80} />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      {financeData.monthly.map((m, i) => (
                        <div key={m.month} className="flex flex-col gap-1">
                          <HBar label={m.month} value={Math.round(m.revenue)} max={maxRev}
                            color="linear-gradient(90deg,#FCD34D,#F59E0B)" rank={i + 1} />
                          {m.count > 0 && (
                            <p className="text-white/20 text-[10px] pl-10">{m.count} транзакций</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}