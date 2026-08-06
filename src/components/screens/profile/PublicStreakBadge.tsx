import { useEffect, useState } from "react";
import { streaksApi, type StreakData } from "@/lib/api";
import { STREAK_REWARDS } from "@/lib/streakRewards";

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

function FlameIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C12 2 7 7.5 7 12a5 5 0 0 0 10 0c0-1.5-.5-3-1.5-4.5 0 0-.5 2-2 2.5C14 8 12 2 12 2Z" />
    </svg>
  );
}

const MILESTONE_LABELS: Record<number, string> = {
  3: "Начало", 7: "Неделя", 14: "2 нед.",
  30: "Месяц", 60: "2 мес.", 100: "100 дн.", 365: "Год",
};
const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export function PublicStreakBadge({ userId }: { userId: number }) {
  const [data, setData] = useState<StreakData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const ZERO: StreakData = { current_streak: 0, longest_streak: 0, total_days: 0, active_today: false, streak_frozen: false, next_milestone: 3, reached_milestone: false, milestones: MILESTONES };
    streaksApi.getUser(userId)
      .then(d => setData(d && typeof d.current_streak === "number" ? d : ZERO))
      .catch(() => setData(ZERO));
  }, [userId]);

  if (!data) return null;

  const color = getFlameColor(data.current_streak);
  const reward = STREAK_REWARDS.find(r => r.days > data.current_streak);
  const currentReward = [...STREAK_REWARDS].reverse().find(r => data.current_streak >= r.days);
  const progress = data.next_milestone
    ? Math.min((data.current_streak / data.next_milestone) * 100, 100)
    : 100;

  // Нулевой стрик — минимальная строка
  if (data.current_streak === 0) {
    return (
      <div className="w-full rounded-2xl px-4 py-3 flex items-center gap-2"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <FlameIcon color="#6b7280" size={14} />
        <p className="text-white/30 text-xs flex-1">Стрик не начат</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}15 0%, rgba(155,89,182,0.08) 100%)`,
        border: `1px solid ${color}28`,
      }}>

      {/* Компактная строка */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div style={{ filter: `drop-shadow(0 0 4px ${color}88)`, flexShrink: 0 }}>
          <FlameIcon color={color} size={16} />
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="font-black text-base leading-none" style={{ color }}>{data.current_streak}</span>
          <span className="text-white/30 text-[10px]">дн.</span>
          {currentReward && (
            <span className="text-sm leading-none">{currentReward.badge}</span>
          )}
          <span className="text-white/15 text-xs">·</span>
          <span className="text-white/40 text-[11px]">рекорд {data.longest_streak}</span>
          {data.active_today && (
            <>
              <span className="text-white/15 text-xs">·</span>
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-[10px] font-semibold" style={{ color, opacity: 0.8 }}>сегодня</span>
              </div>
            </>
          )}
        </div>

        {/* Прогресс */}
        {data.next_milestone && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-full rounded-full"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}77, ${color})` }} />
            </div>
            <span className="text-white/25 text-[10px]">{data.next_milestone}д</span>
          </div>
        )}

        <button onClick={() => setShowDetails(v => !v)}
          className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors flex-shrink-0">
          <span className="text-[9px]">{showDetails ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* Раскрывающаяся детализация */}
      {showDetails && (
        <div className="px-3 pb-2.5" style={{ borderTop: `1px solid ${color}15` }}>
          <div className="flex items-center gap-1 pt-2 pb-1">
            {MILESTONES.map(m => {
              const reached = data.current_streak >= m;
              const isCurrent = data.next_milestone === m;
              const r = STREAK_REWARDS.find(x => x.days === m);
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: reached ? (r?.ringColor ?? color) : isCurrent ? `${color}20` : "rgba(255,255,255,0.04)",
                      border: isCurrent ? `1px solid ${color}` : "none",
                      boxShadow: reached ? (r?.glow ?? `0 0 4px ${color}44`) : "none",
                      fontSize: reached ? 10 : 8,
                    }}>
                    <span style={{ color: reached ? "#fff" : isCurrent ? color : "rgba(255,255,255,0.2)" }}>
                      {reached ? (r?.badge ?? "✓") : m >= 100 ? "★" : m}
                    </span>
                  </div>
                  <p className="text-[7px] text-center leading-tight"
                    style={{ color: reached ? (r?.color ?? color) : "rgba(255,255,255,0.15)" }}>
                    {MILESTONE_LABELS[m]}
                  </p>
                </div>
              );
            })}
          </div>
          {reward && (
            <div className="flex items-center gap-2 mt-1 opacity-45">
              <span className="text-[10px]">{reward.badge}</span>
              <p className="text-white/35 text-[10px] flex-1">Следующая: {reward.label} (через {reward.days - data.current_streak} дн.)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
