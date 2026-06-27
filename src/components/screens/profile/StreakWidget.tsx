import { useEffect, useState } from "react";
import { streaksApi, type StreakData } from "@/lib/api";
import { STREAK_REWARDS, getEarnedRewards } from "@/lib/streakRewards";

const MILESTONE_LABELS: Record<number, string> = {
  3:   "Начало",
  7:   "Неделя",
  14:  "2 недели",
  30:  "Месяц",
  60:  "2 месяца",
  100: "100 дней",
  365: "Год",
};

const FLAME_COLORS = [
  { min: 0,   color: "#9ca3af" }, // серый
  { min: 3,   color: "#f97316" }, // оранжевый
  { min: 7,   color: "#ef4444" }, // красный
  { min: 30,  color: "#a855f7" }, // фиолетовый
  { min: 100, color: "#eab308" }, // золото
];

function getFlameColor(streak: number) {
  return [...FLAME_COLORS].reverse().find(c => streak >= c.min)?.color ?? "#9ca3af";
}

function FlameIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C12 2 7 7.5 7 12a5 5 0 0 0 10 0c0-1.5-.5-3-1.5-4.5 0 0-.5 2-2 2.5C14 8 12 2 12 2Z" />
    </svg>
  );
}

export function StreakWidget({ onCheckin }: { onCheckin?: () => void }) {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  const FALLBACK: StreakData = { current_streak: 0, longest_streak: 0, total_days: 0, active_today: false, streak_frozen: false, next_milestone: 3, reached_milestone: false, milestones: [3,7,14,30,60,100,365] };

  useEffect(() => {
    streaksApi.get()
      .then(d => {
        setData(d && typeof d.current_streak === "number" ? d : FALLBACK);
        setLoading(false);
      })
      .catch(() => {
        setData(FALLBACK);
        setLoading(false);
      });
  }, []);

  const handleCheckin = async () => {
    if (data?.active_today) return;
    try {
      const updated = await streaksApi.checkin();
      if (updated && typeof updated.current_streak === "number") {
        if (updated.reached_milestone) setCelebrating(true);
        setData(updated);
        onCheckin?.();
        setTimeout(() => setCelebrating(false), 2000);
      }
    } catch { /* ignore */ }
  };

  if (loading || !data) return null;

  const color = getFlameColor(data.current_streak);
  const progress = data.next_milestone
    ? Math.min((data.current_streak / data.next_milestone) * 100, 100)
    : 100;

  return (
    <div className="mx-5 mt-4 mb-4 rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}22 0%, rgba(155,89,182,0.15) 50%, rgba(255,45,120,0.1) 100%)`,
        border: `1px solid ${color}44`,
        boxShadow: `0 4px 24px ${color}22`,
      }}>

      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className={`transition-transform ${celebrating ? "scale-125" : ""}`}
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}>
            <FlameIcon color={color} size={26} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Стрик активности</p>
            <p className="text-white/40 text-[11px]">Заходи каждый день</p>
          </div>
        </div>

        {/* Кнопка чекина */}
        {!data.active_today ? (
          <button onClick={handleCheckin}
            className="px-3 py-1.5 rounded-xl text-white text-xs font-bold active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)`, boxShadow: `0 2px 12px ${color}44` }}>
            Отметиться
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
            ✓ Сегодня
          </div>
        )}
      </div>

      {/* Основные цифры */}
      <div className="flex items-stretch px-4 pb-3 gap-3">
        {/* Текущий стрик */}
        <div className="flex-1 rounded-2xl flex flex-col items-center justify-center py-3"
          style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
          <div className="flex items-center gap-1">
            <FlameIcon color={color} size={16} />
            <span className="text-white font-black text-2xl" style={{ color }}>{data.current_streak}</span>
          </div>
          <p className="text-white/40 text-[10px] mt-0.5">текущий</p>
        </div>

        {/* Рекорд */}
        <div className="flex-1 rounded-2xl flex flex-col items-center justify-center py-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-white font-black text-2xl">{data.longest_streak}</span>
          <p className="text-white/40 text-[10px] mt-0.5">рекорд</p>
        </div>

        {/* Всего дней */}
        <div className="flex-1 rounded-2xl flex flex-col items-center justify-center py-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-white font-black text-2xl">{data.total_days}</span>
          <p className="text-white/40 text-[10px] mt-0.5">всего</p>
        </div>
      </div>

      {/* Прогресс до следующего milestone */}
      {data.next_milestone && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-white/40 text-[11px]">До «{MILESTONE_LABELS[data.next_milestone]}»</p>
            <p className="text-white/40 text-[11px]">{data.current_streak} / {data.next_milestone} дней</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
          </div>
        </div>
      )}

      {/* Milestones ряд */}
      <div className="flex items-center gap-1 px-4 pb-3">
        {data.milestones.map(m => {
          const reached = data.current_streak >= m;
          const isCurrent = data.next_milestone === m;
          const reward = STREAK_REWARDS.find(r => r.days === m);
          return (
            <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: reached ? (reward?.ringColor ?? color) : isCurrent ? `${color}33` : "rgba(255,255,255,0.06)",
                  color: reached ? "#fff" : isCurrent ? color : "rgba(255,255,255,0.25)",
                  border: isCurrent ? `1.5px solid ${color}` : "none",
                  boxShadow: reached ? (reward?.glow ?? `0 0 6px ${color}55`) : "none",
                  fontSize: reached ? 11 : undefined,
                }}>
                {reached ? (reward?.badge ?? "✓") : m}
              </div>
              <p className="text-[8px] text-center leading-tight"
                style={{ color: reached ? (reward?.color ?? color) : "rgba(255,255,255,0.2)" }}>
                {MILESTONE_LABELS[m]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Раздел достижений */}
      {(() => {
        const earned = getEarnedRewards(data.current_streak);
        const next = STREAK_REWARDS.find(r => r.days > data.current_streak);
        return (
          <div className="mx-3 mb-3 rounded-2xl overflow-hidden"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="px-3 pt-2.5 pb-1.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-white/50 text-[11px] font-semibold">Достижения</p>
            </div>
            <div className="px-3 py-2 flex flex-col gap-1.5">
              {earned.length === 0 ? (
                <p className="text-white/25 text-xs py-1">Продолжай заходить — первая награда за 3 дня</p>
              ) : (
                earned.map(r => (
                  <div key={r.days} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: r.ringColor, boxShadow: r.glow }}>
                      {r.badge}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-xs font-semibold leading-tight">{r.label}</p>
                      <p className="text-white/30 text-[10px]">Стрик {r.days}+ дней</p>
                    </div>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: r.ringColor }}>
                      <span className="text-[9px] text-white">✓</span>
                    </div>
                  </div>
                ))
              )}
              {next && (
                <div className="flex items-center gap-2.5 opacity-40 mt-0.5"
                  style={{ borderTop: earned.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", paddingTop: earned.length > 0 ? 6 : 0 }}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px dashed rgba(255,255,255,0.15)" }}>
                    {next.badge}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 text-xs font-semibold leading-tight">{next.label}</p>
                    <p className="text-white/30 text-[10px]">Ещё {next.days - data.current_streak} дней</p>
                  </div>
                  <p className="text-white/30 text-[10px] flex-shrink-0">🔒</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}