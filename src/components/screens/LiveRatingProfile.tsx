import Icon from "@/components/ui/icon";
import { type LiveStream, type LeaderboardEntry } from "@/lib/api";
import { FALLBACK_PHOTO, RANK_MEDALS, formatScore } from "@/components/screens/LiveStreamConstants";

export function LiveRatingProfile({ entry, rank, onBack, onJoin, streams }: {
  entry: LeaderboardEntry;
  rank: number;
  onBack: () => void;
  onJoin: (s: LiveStream) => void;
  streams: LiveStream[];
}) {
  const liveStream = entry.stream_id
    ? streams.find(s => s.id === entry.stream_id)
    : streams.find(s => s.user_id === entry.user_id);

  const rankLabel = rank === 0 ? "Золото I" : rank === 1 ? "Серебро I" : rank === 2 ? "Бронза I" : `Топ ${rank + 1}`;
  const rankColors = [
    { bg: "linear-gradient(135deg,#D4A017,#FFD700)", glow: "rgba(212,160,23,0.5)" },
    { bg: "linear-gradient(135deg,#8A9BA8,#C0C8D0)", glow: "rgba(160,170,180,0.4)" },
    { bg: "linear-gradient(135deg,#CD7F32,#E8A060)", glow: "rgba(205,127,50,0.4)" },
  ];
  const rc = rankColors[rank] || { bg: "linear-gradient(135deg,#555,#777)", glow: "rgba(100,100,100,0.3)" };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Фото-шапка — компактнее */}
      <div className="relative flex-shrink-0" style={{ height: 260 }}>
        <img
          src={entry.photo_url || FALLBACK_PHOTO}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 35%, rgba(10,6,20,1) 100%)"
        }} />

        {/* Назад */}
        <button onClick={onBack}
          className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="ChevronLeft" size={18} className="text-white" />
        </button>

        {/* ··· */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="MoreHorizontal" size={16} className="text-white" />
        </div>

        {/* Имя + позиция поверх фото снизу */}
        <div className="absolute bottom-3 left-0 right-0 px-4">
          <div className="flex items-center gap-2 justify-center">
            {entry.premium && (
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                <span style={{ fontSize: 8 }}>✦</span>
              </div>
            )}
            <span className="text-white font-black text-xl drop-shadow-lg">{entry.name}</span>
            {liveStream && (
              <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-wide">LIVE</span>
            )}
          </div>
          <p className="text-white/40 text-xs text-center mt-0.5">#{rank + 1} в рейтинге</p>
        </div>
      </div>

      {/* Кнопка смотреть — отдельно, не поверх фото */}
      {liveStream && (
        <div className="flex-shrink-0 px-4 mt-3">
          <button onClick={() => onJoin(liveStream)}
            className="w-full py-2.5 rounded-2xl font-bold text-sm tracking-wide"
            style={{ background: "linear-gradient(135deg,#FF8C00,#FFB300)", color: "#fff", boxShadow: "0 4px 20px rgba(255,140,0,0.4)" }}>
            ▶ СМОТРЕТЬ ЭФИР
          </button>
        </div>
      )}

      {/* Статус-баннер — компактный */}
      <div className="flex-shrink-0 mx-4 mt-3 rounded-2xl p-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="grid grid-cols-3 gap-0">

          {/* Бриллианты */}
          <div className="flex flex-col items-center gap-1 px-2 border-r border-white/8">
            <div className="flex items-center gap-1">
              <Icon name="Diamond" size={11} className="text-cyan-400" />
              <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wide">Брилл.</span>
            </div>
            <span className="text-white font-black text-sm leading-none">{formatScore(entry.hearts)}</span>
          </div>

          {/* Ранг по центру */}
          <div className="flex flex-col items-center gap-1 px-2 border-r border-white/8">
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 13 }}>{rank < 3 ? RANK_MEDALS[rank] : "⭐"}</span>
            </div>
            <span className="font-black text-[11px] leading-none" style={{ color: rc.glow.replace("rgba(", "rgb(").replace(/,[\d.]+\)$/, ")") }}>
              {rankLabel}
            </span>
          </div>

          {/* Зрители */}
          <div className="flex flex-col items-center gap-1 px-2">
            <div className="flex items-center gap-1">
              <Icon name="Eye" size={11} className="text-white/40" />
              <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wide">Зрит.</span>
            </div>
            <span className="text-white font-black text-sm leading-none">{formatScore(entry.viewers)}</span>
          </div>
        </div>

        {/* Цветные флажки — тонкая полоска */}
        <div className="grid grid-cols-3 mt-2.5 gap-2">
          {[
            { color: "#22C3FF", label: "Бриллианты" },
            { color: rc.glow.replace(/,[\d.]+\)$/, ",1)").replace("rgba", "rgb"), label: rankLabel },
            { color: "#9B9B9B", label: "Зрители" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-full h-0.5 rounded-full" style={{ background: item.color, opacity: 0.6 }} />
              <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `8px solid ${item.color}`, opacity: 0.7 }} />
            </div>
          ))}
        </div>
      </div>

      {/* О себе */}
      <div className="flex-shrink-0 px-4 mt-3">
        <p className="text-pink-400 font-bold text-xs uppercase tracking-wider mb-2">О себе</p>
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white/55 text-sm leading-relaxed">
            {liveStream ? `🎥 В прямом эфире: "${liveStream.title}"` : "Нет активного эфира"}
          </p>
        </div>
      </div>

      {/* Топ-дарители */}
      <div className="flex-shrink-0 px-4 mt-3 pb-24">
        <div className="flex items-center justify-between mb-2">
          <p className="text-pink-400 font-bold text-xs uppercase tracking-wider">Топ-дарители</p>
          <span className="text-white/25 text-xs">Показать все</span>
        </div>
        <div className="rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(34,120,20,0.3),rgba(50,150,35,0.15))", border: "1px solid rgba(60,150,40,0.25)" }}>
          <div className="flex items-center justify-center py-5 gap-2">
            <Icon name="Diamond" size={14} className="text-cyan-400/60" />
            <span className="text-white/35 text-sm">Нет данных</span>
          </div>
        </div>
      </div>
    </div>
  );
}
