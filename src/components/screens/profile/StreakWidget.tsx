import { useEffect, useState } from "react";
import { streaksApi, type StreakData } from "@/lib/api";
import { STREAK_REWARDS, getEarnedRewards } from "@/lib/streakRewards";

const MILESTONE_LABELS: Record<number, string> = {
  3: "Начало", 7: "Неделя", 14: "2 нед.", 30: "Месяц",
  60: "2 мес.", 100: "100 дн.", 365: "Год",
};

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

export function StreakWidget({ onCheckin }: { onCheckin?: () => void }) {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const FALLBACK: StreakData = { current_streak: 0, longest_streak: 0, total_days: 0, active_today: false, streak_frozen: false, next_milestone: 3, reached_milestone: false, milestones: [3,7,14,30,60,100,365] };

  useEffect(() => {
    streaksApi.get()
      .then(d => { setData(d && typeof d.current_streak === "number" ? d : FALLBACK); setLoading(false); })
      .catch(() => { setData(FALLBACK); setLoading(false); });
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
  const earned = getEarnedRewards(data.current_streak);
  const nextReward = STREAK_REWARDS.find(r => r.days > data.current_streak);

  return (
    <div className="w-full mt-5 mb-3 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, rgba(155,89,182,0.1) 60%, rgba(255,45,120,0.07) 100%)`,
        border: `1px solid ${color}35`,
        boxShadow: `0 2px 16px ${color}15`,
      }}>

      {/* Компактная шапка */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className={`transition-transform flex-shrink-0 ${celebrating ? "scale-125" : ""}`}
          style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}>
          <FlameIcon color={color} size={20} />
        </div>

        {/* Счётчики в строку */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-black text-lg leading-none" style={{ color }}>{data.current_streak}</span>
            <span className="text-white/35 text-[10px] leading-none mt-0.5">дн.</span>
          </div>
          <span className="text-white/15 text-xs">·</span>
          <div className="flex items-center gap-1">
            <span className="text-white/50 text-xs font-semibold">{data.longest_streak}</span>
            <span className="text-white/25 text-[10px]">рекорд</span>
          </div>
          {data.next_milestone && (
            <>
              <span className="text-white/15 text-xs">·</span>
              <div className="flex-1 max-w-[80px]">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
                </div>
              </div>
              <span className="text-white/30 text-[10px]">{data.next_milestone}д</span>
            </>
          )}
        </div>

        {/* Кнопка или статус */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!data.active_today ? (
            <button onClick={handleCheckin}
              className="px-2.5 py-1 rounded-lg text-white text-[11px] font-bold active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)`, boxShadow: `0 1px 8px ${color}44` }}>
              Отметиться
            </button>
          ) : (
            <span className="text-[11px] font-semibold" style={{ color, opacity: 0.8 }}>✓ Сегодня</span>
          )}
          <button onClick={() => setShowDetails(v => !v)}
            className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <span className="text-[10px]">{showDetails ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Раскрывающаяся детализация */}
      {showDetails && (
        <>
          {/* Milestones */}
          <div className="flex items-center gap-1 px-3 pb-2"
            style={{ borderTop: `1px solid ${color}18` }}>
            {data.milestones.map(m => {
              const reached = data.current_streak >= m;
              const isCurrent = data.next_milestone === m;
              const reward = STREAK_REWARDS.find(r => r.days === m);
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-0.5 pt-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: reached ? (reward?.ringColor ?? color) : isCurrent ? `${color}25` : "rgba(255,255,255,0.05)",
                      color: reached ? "#fff" : isCurrent ? color : "rgba(255,255,255,0.2)",
                      border: isCurrent ? `1.5px solid ${color}` : "none",
                      boxShadow: reached ? (reward?.glow ?? `0 0 5px ${color}44`) : "none",
                      fontSize: reached ? 11 : undefined,
                    }}>
                    {reached ? (reward?.badge ?? "✓") : m}
                  </div>
                  <p className="text-[7px] text-center leading-tight"
                    style={{ color: reached ? (reward?.color ?? color) : "rgba(255,255,255,0.18)" }}>
                    {MILESTONE_LABELS[m]}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Достижения */}
          <div className="px-3 pb-2.5 flex flex-col gap-1.5"
            style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>
            <p className="text-white/35 text-[10px] font-semibold pt-2">Достижения</p>
            {earned.length === 0 ? (
              <p className="text-white/20 text-[11px]">Первая награда через {3 - data.current_streak} дн.</p>
            ) : (
              earned.slice(-3).map(r => (
                <div key={r.days} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: r.ringColor, boxShadow: r.glow }}>
                    {r.badge}
                  </div>
                  <p className="text-white/65 text-xs font-semibold flex-1">{r.label}</p>
                  <p className="text-white/25 text-[10px]">{r.days}д+</p>
                </div>
              ))
            )}
            {nextReward && (
              <div className="flex items-center gap-2 opacity-40">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.15)" }}>
                  {nextReward.badge}
                </div>
                <p className="text-white/40 text-xs flex-1">{nextReward.label}</p>
                <p className="text-white/25 text-[10px]">ещё {nextReward.days - data.current_streak}д</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}