import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { gamificationApi, type DailyTask } from "@/lib/api";

export function DailyTasksWidget() {
  const [coins, setCoins] = useState(0);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [pop, setPop] = useState<number | null>(null);

  const load = useCallback(() => {
    gamificationApi.state()
      .then(d => {
        if (d && typeof d.coins === "number") { setCoins(d.coins); setTasks(d.tasks || []); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener("app:refresh", onRefresh);
    window.addEventListener("gamification:update", onRefresh);
    return () => {
      window.removeEventListener("app:refresh", onRefresh);
      window.removeEventListener("gamification:update", onRefresh);
    };
  }, [load]);

  const handleClaim = async (key: string, reward: number) => {
    setClaiming(key);
    try {
      const d = await gamificationApi.claim(key);
      if (d && typeof d.coins === "number") {
        setCoins(d.coins);
        setTasks(d.tasks || []);
        setPop(reward);
        setTimeout(() => setPop(null), 1400);
      }
    } catch { /* ignore */ } finally { setClaiming(null); }
  };

  if (loading) return null;

  const readyCount = tasks.filter(t => t.done && !t.claimed).length;
  const doneCount = tasks.filter(t => t.claimed).length;

  return (
    <div className="w-full mt-3 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,193,7,0.16) 0%, rgba(255,45,120,0.12) 60%, rgba(155,89,182,0.12) 100%)",
        border: "1px solid rgba(255,193,7,0.4)",
        boxShadow: "0 4px 20px rgba(255,193,7,0.14)",
      }}>
      {/* Шапка: баланс + переключатель */}
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
          style={{ background: "linear-gradient(135deg,#FFD54F,#FFB300)", boxShadow: "0 2px 12px rgba(255,179,0,0.5)" }}>
          <Icon name="Coins" size={18} className="text-white" />
          {pop !== null && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-black whitespace-nowrap"
              style={{ color: "#FFD54F", animation: "coin-pop 1.4s ease-out forwards", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
              +{pop}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg leading-none text-white" style={{ textShadow: "0 0 12px rgba(255,193,7,0.5)" }}>{coins}</span>
            <span className="text-white/55 text-[11px] font-semibold">монет</span>
          </div>
          <p className="text-white/45 text-[10px] font-medium mt-0.5">
            {readyCount > 0 ? `Забери награду за ${readyCount} задани${readyCount === 1 ? "е" : "я"}!` : `Заданий выполнено: ${doneCount}/${tasks.length}`}
          </p>
        </div>
        {readyCount > 0 && (
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
            style={{ background: "#FF2D78", boxShadow: "0 0 10px rgba(255,45,120,0.6)" }}>{readyCount}</span>
        )}
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/40 flex-shrink-0" />
      </button>

      {/* Список заданий */}
      {open && (
        <div className="px-2.5 pb-2.5 flex flex-col gap-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest pt-2 px-1">Задания на сегодня</p>
          {tasks.map(t => {
            const pct = Math.min((t.progress / t.goal) * 100, 100);
            return (
              <div key={t.key} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                style={{ background: t.claimed ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: t.claimed ? "rgba(74,222,128,0.15)" : "rgba(255,193,7,0.15)" }}>
                  <Icon name={(t.claimed ? "Check" : t.icon) as "Heart"} size={15}
                    className={t.claimed ? "text-green-400" : "text-amber-300"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-semibold ${t.claimed ? "text-white/40 line-through" : "text-white/90"}`}>{t.title}</p>
                  {!t.claimed && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#FFD54F,#FFB300)", transition: "width 0.5s" }} />
                      </div>
                      <span className="text-white/40 text-[9px] font-semibold">{t.progress}/{t.goal}</span>
                    </div>
                  )}
                </div>
                {t.claimed ? (
                  <span className="text-green-400/70 text-[10px] font-bold flex-shrink-0">Готово</span>
                ) : t.done ? (
                  <button onClick={() => handleClaim(t.key, t.reward)} disabled={claiming === t.key}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-black text-white flex items-center gap-1 flex-shrink-0 active:scale-95 transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#FFB300,#FF8F00)", boxShadow: "0 2px 8px rgba(255,143,0,0.5)" }}>
                    {claiming === t.key ? <Icon name="Loader2" size={11} className="animate-spin" /> : <>+{t.reward} <Icon name="Coins" size={11} /></>}
                  </button>
                ) : (
                  <span className="text-amber-300/80 text-[11px] font-black flex items-center gap-0.5 flex-shrink-0">+{t.reward}<Icon name="Coins" size={11} /></span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DailyTasksWidget;
