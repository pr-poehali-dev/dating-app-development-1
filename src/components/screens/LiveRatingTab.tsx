import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { liveApi, type LiveStream, type LeaderboardEntry } from "@/lib/api";
import { LiveRatingProfile } from "@/components/screens/LiveRatingProfile";
import {
  FALLBACK_PHOTO,
  RATING_PERIODS,
  RANK_MEDALS,
  RANK_COLORS,
  formatScore,
} from "@/components/screens/LiveStreamConstants";

export function LiveRatingTab({ onJoin, streams }: { onJoin: (s: LiveStream) => void; streams: LiveStream[] }) {
  const [period, setPeriod] = useState<"live" | "today" | "week" | "all">("week");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);
  const [selectedRank, setSelectedRank] = useState(0);

  useEffect(() => {
    setLoading(true);
    liveApi.leaderboard(period)
      .then(d => setEntries(d.entries))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [period]);

  if (selected) {
    return (
      <LiveRatingProfile
        entry={selected}
        rank={selectedRank}
        onBack={() => setSelected(null)}
        onJoin={onJoin}
        streams={streams}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Период */}
      <div className="flex-shrink-0 px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {RATING_PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id as typeof period)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${period === p.id ? "text-white" : "bg-white/10 text-white/50"}`}
              style={period === p.id ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : undefined}>
              {p.label}
            </button>
          ))}
        </div>
        {period === "week" && (
          <p className="text-pink-500 text-[11px] font-semibold mt-2">
            Сбрасывается в Понедельник в 12:00 по московскому времени
          </p>
        )}
      </div>

      {/* Список */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-0">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-5xl">🏆</div>
            <p className="text-white/40 text-sm text-center">Пока нет данных<br />для этого периода</p>
          </div>
        )}

        {!loading && entries.map((entry, i) => {
          const isTop3 = i < 3;
          const liveNow = streams.some(s => s.user_id === entry.user_id);

          return (
            <button key={entry.user_id} onClick={() => { setSelected(entry); setSelectedRank(i); }}
              className={`w-full flex items-center gap-3 py-3 text-left transition-all active:scale-98 ${i < entries.length - 1 ? "border-b border-white/[0.06]" : ""}`}>

              {/* Место */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                {isTop3 ? (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${RANK_COLORS[i]}`}
                    style={{ border: `1px solid ${["rgba(212,160,23,0.5)", "rgba(180,180,180,0.4)", "rgba(205,127,50,0.4)"][i]}` }}>
                    <span style={{ fontSize: 16 }}>{RANK_MEDALS[i]}</span>
                  </div>
                ) : (
                  <span className="text-white/30 text-sm font-bold w-8 text-center">{i + 1}</span>
                )}
              </div>

              {/* Аватар */}
              <div className="relative flex-shrink-0">
                <img src={entry.photo_url || FALLBACK_PHOTO}
                  className="w-12 h-12 rounded-full object-cover"
                  style={isTop3 ? { boxShadow: `0 0 0 2px ${["#D4A017", "#A8A8A8", "#CD7F32"][i]}` } : undefined} />
                {liveNow && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full w-3.5 h-3.5 border-2 border-[#120c1c]" />
                )}
              </div>

              {/* Имя + очки */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {entry.premium && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                      <span style={{ fontSize: 8 }}>✦</span>
                    </div>
                  )}
                  <span className="text-white font-semibold text-sm truncate">{entry.name}</span>
                  {liveNow && <span className="text-[9px] text-red-400 font-bold flex-shrink-0">● LIVE</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Icon name="Diamond" size={11} className="text-cyan-400 flex-shrink-0" />
                  <span className="text-cyan-400 text-xs font-bold">{formatScore(entry.score)}</span>
                </div>
              </div>

              {/* Звезда */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                <Icon name="Star" size={14} className="text-white/30" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
