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



function FlameIcon({ color, size = 20 }: { color: string; size?: number }) {
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
    <div className="w-full mt-5 mb-3 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${color}28 0%, rgba(155,89,182,0.15) 60%, rgba(255,45,120,0.12) 100%)`,
        border: `1px solid ${color}55`,
        boxShadow: `0 4px 20px ${color}22`,
        borderRadius: "1rem",
        overflow: "clip",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}>
      {/* Шапка */}
      <div className="flex items-center gap-2 px-3 py-2.5">

        {/* Огонь */}
        <div className="flex-shrink-0" style={{ animation: "streak-fire 1.8s ease-in-out infinite" }}>
          <FlameIcon color={color} size={22} />
        </div>

        {/* Счётчики */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-black text-xl leading-none" style={{ color, textShadow: `0 0 12px ${color}88` }}>
              {data.current_streak}
            </span>
            <span className="text-white/60 text-[11px] leading-none mt-0.5 font-semibold">дн.</span>
          </div>
          <span className="text-white/25 text-xs">·</span>
          <div className="flex items-center gap-1">
            <span className="text-white/75 text-xs font-bold">{data.longest_streak}</span>
            <span className="text-white/45 text-[10px] font-medium">рекорд</span>
          </div>
          {data.next_milestone && (
            <>
              <span className="text-white/25 text-xs">·</span>
              <div className="flex-1 max-w-[80px]">
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)", overflow: "clip" }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, transition: "width 0.7s ease" }} />
                </div>
              </div>
              <span className="text-white/50 text-[10px] font-semibold">{data.next_milestone}д</span>
            </>
          )}
        </div>

        {/* Кнопка или статус */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!data.active_today ? (
            <button onClick={handleCheckin}
              className="px-2.5 py-1 rounded-lg text-white text-[11px] font-bold active:scale-95 transition-all"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                boxShadow: `0 2px 10px ${color}55`,

              }}>
              🔥 Отметиться
            </button>
          ) : (
            <span className="text-[11px] font-bold" style={{ color, textShadow: `0 0 8px ${color}66` }}>✓ Сегодня</span>
          )}
          <button onClick={() => setShowDetails(v => !v)}
            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors">
            <span className="text-[10px]">{showDetails ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Раскрывающаяся детализация */}
      {showDetails && (
        <>
          {/* Milestones */}
          <div className="flex items-center gap-1 px-3 pb-2"
            style={{ borderTop: `1px solid ${color}25` }}>
            {data.milestones.map((m, idx) => {
              const reached = data.current_streak >= m;
              const isCurrent = data.next_milestone === m;
              const reward = STREAK_REWARDS.find(r => r.days === m);
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-0.5 pt-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
                    style={{
                      background: reached ? (reward?.ringColor ?? color) : isCurrent ? `${color}30` : "rgba(255,255,255,0.07)",
                      color: reached ? "#fff" : isCurrent ? color : "rgba(255,255,255,0.35)",
                      border: isCurrent ? `2px solid ${color}` : reached ? "none" : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: reached ? (reward?.glow ?? `0 0 8px ${color}66`) : "none",
                      fontSize: reached ? 13 : 9,

                    }}>
                    {reached ? (reward?.badge ?? "✓") : m}
                  </div>
                  <p className="text-[7px] text-center leading-tight font-semibold"
                    style={{ color: reached ? (reward?.color ?? color) : "rgba(255,255,255,0.3)" }}>
                    {MILESTONE_LABELS[m]}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Достижения */}
          <div className="px-3 pb-3 flex flex-col gap-2 mt-8"
            style={{ borderTop: `1px solid rgba(255,255,255,0.07)` }}>
            <p className="text-white/55 text-[10px] font-bold uppercase tracking-widest pt-2">Достижения</p>
            {earned.length === 0 ? (
              <p className="text-white/35 text-[11px] font-medium">Первая награда через {3 - data.current_streak} дн.</p>
            ) : (
              earned.slice(-3).map((r, i) => (
                <div key={r.days} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{
                      background: r.ringColor,
                      boxShadow: r.glow,

                    }}>
                    {r.badge}
                  </div>
                  <p className="text-white/80 text-xs font-bold flex-1">{r.label}</p>
                  <p className="text-white/40 text-[10px] font-medium">{r.days}д+</p>
                </div>
              ))
            )}
            {nextReward && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base flex-shrink-0 opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px dashed rgba(255,255,255,0.2)",
                    animation: "streak-spin 6s linear infinite",
                  }}>
                  {nextReward.badge}
                </div>
                <p className="text-white/45 text-xs font-semibold flex-1">{nextReward.label}</p>
                <p className="text-white/35 text-[10px] font-medium">ещё {nextReward.days - data.current_streak}д</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}