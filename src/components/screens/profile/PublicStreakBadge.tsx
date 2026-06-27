import { useEffect, useState } from "react";
import { streaksApi, type StreakData } from "@/lib/api";

const FLAME_COLORS = [
  { min: 0,   color: "#9ca3af" },
  { min: 3,   color: "#f97316" },
  { min: 7,   color: "#ef4444" },
  { min: 30,  color: "#a855f7" },
  { min: 100, color: "#eab308" },
];

function getFlameColor(streak: number) {
  return [...FLAME_COLORS].reverse().find(c => streak >= c.min)?.color ?? "#9ca3af";
}

function FlameIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C12 2 7 7.5 7 12a5 5 0 0 0 10 0c0-1.5-.5-3-1.5-4.5 0 0-.5 2-2 2.5C14 8 12 2 12 2Z" />
    </svg>
  );
}

const MILESTONE_LABELS: Record<number, string> = {
  3: "Начало", 7: "Неделя", 14: "2 недели",
  30: "Месяц", 60: "2 месяца", 100: "100 дней", 365: "Год",
};
const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export function PublicStreakBadge({ userId }: { userId: number }) {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    streaksApi.getUser(userId)
      .then(d => { if (d && typeof d.current_streak === "number") setData(d); })
      .catch(() => {});
  }, [userId]);

  if (!data || data.current_streak === 0) return null;

  const color = getFlameColor(data.current_streak);
  const progress = data.next_milestone
    ? Math.min((data.current_streak / data.next_milestone) * 100, 100)
    : 100;

  return (
    <div className="mx-5 mt-3 mb-1 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}1a 0%, rgba(155,89,182,0.12) 50%, rgba(255,45,120,0.08) 100%)`,
        border: `1px solid ${color}33`,
      }}>

      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}>
            <FlameIcon color={color} size={20} />
          </div>
          <div>
            <p className="text-white/80 font-bold text-sm leading-tight">Стрик активности</p>
            <p className="text-white/35 text-[11px]">
              {data.active_today ? "Заходил сегодня" : "Последний заход вчера"}
            </p>
          </div>
        </div>
        {data.active_today && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-semibold" style={{ color }}>Онлайн</span>
          </div>
        )}
      </div>

      {/* Счётчики */}
      <div className="flex items-stretch px-4 pb-3 gap-2">
        <div className="flex-1 rounded-xl flex flex-col items-center justify-center py-2"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <div className="flex items-center gap-0.5">
            <FlameIcon color={color} size={13} />
            <span className="font-black text-xl leading-none" style={{ color }}>{data.current_streak}</span>
          </div>
          <p className="text-white/35 text-[10px] mt-0.5">текущий</p>
        </div>
        <div className="flex-1 rounded-xl flex flex-col items-center justify-center py-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="font-black text-xl leading-none text-white/70">{data.longest_streak}</span>
          <p className="text-white/35 text-[10px] mt-0.5">рекорд</p>
        </div>
        <div className="flex-1 rounded-xl flex flex-col items-center justify-center py-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="font-black text-xl leading-none text-white/70">{data.total_days}</span>
          <p className="text-white/35 text-[10px] mt-0.5">всего</p>
        </div>
      </div>

      {/* Прогресс */}
      {data.next_milestone && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/30 text-[10px]">До «{MILESTONE_LABELS[data.next_milestone]}»</p>
            <p className="text-white/30 text-[10px]">{data.current_streak} / {data.next_milestone}</p>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="flex items-center gap-1 px-4 pb-3">
        {MILESTONES.map(m => {
          const reached = data.current_streak >= m;
          const isCurrent = data.next_milestone === m;
          return (
            <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{
                  background: reached ? color : isCurrent ? `${color}25` : "rgba(255,255,255,0.05)",
                  color: reached ? "#fff" : isCurrent ? color : "rgba(255,255,255,0.2)",
                  border: isCurrent ? `1.5px solid ${color}` : "none",
                  boxShadow: reached ? `0 0 5px ${color}44` : "none",
                }}>
                {reached ? "✓" : m >= 100 ? "★" : m}
              </div>
              <p className="text-[7px] text-center leading-tight"
                style={{ color: reached ? color : "rgba(255,255,255,0.15)" }}>
                {MILESTONE_LABELS[m]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
