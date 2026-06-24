import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { type LiveStream, type LeaderboardEntry, subscriptionsApi, blocksApi } from "@/lib/api";
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

  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    subscriptionsApi.status(entry.user_id)
      .then(d => setSubscribed(d.subscribed))
      .catch(() => {});
  }, [entry.user_id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSubscribe = async () => {
    if (subLoading) return;
    setSubLoading(true);
    try {
      const res = await subscriptionsApi.toggle(entry.user_id);
      setSubscribed(res.subscribed);
      showToast(res.subscribed ? `Вы подписались на ${entry.name}` : "Подписка отменена");
    } catch {
      showToast("Ошибка. Попробуй ещё раз");
    } finally {
      setSubLoading(false);
    }
  };

  const handleBlock = async () => {
    if (blockLoading) return;
    setMenuOpen(false);
    setBlockLoading(true);
    try {
      if (blocked) {
        await blocksApi.unblock(entry.user_id);
        setBlocked(false);
        showToast("Пользователь разблокирован");
      } else {
        await blocksApi.block(entry.user_id);
        setBlocked(true);
        showToast(`${entry.name} заблокирован`);
      }
    } catch {
      showToast("Ошибка. Попробуй ещё раз");
    } finally {
      setBlockLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-lg"
          style={{ background: "rgba(30,20,50,0.95)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", maxWidth: 280, textAlign: "center" }}>
          {toast}
        </div>
      )}

      {/* Меню ··· */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={() => setMenuOpen(false)}
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-sm mb-6 mx-4 rounded-2xl overflow-hidden"
            style={{ background: "rgba(28,18,48,0.98)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-white font-bold text-sm text-center">{entry.name}</p>
            </div>
            <button onClick={handleBlock}
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-all active:bg-white/5"
              disabled={blockLoading}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: blocked ? "rgba(255,45,120,0.15)" : "rgba(239,68,68,0.12)" }}>
                <Icon name={blocked ? "ShieldCheck" : "ShieldX"} size={16}
                  className={blocked ? "text-pink-400" : "text-red-400"} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-semibold ${blocked ? "text-pink-300" : "text-red-300"}`}>
                  {blockLoading ? "Загрузка..." : blocked ? "Разблокировать" : "Заблокировать"}
                </p>
                <p className="text-white/30 text-xs">
                  {blocked ? "Снять блокировку с пользователя" : "Пользователь больше не будет вас беспокоить"}
                </p>
              </div>
            </button>
            <button onClick={() => setMenuOpen(false)}
              className="w-full py-3 text-white/40 text-sm font-semibold border-t border-white/8 transition-all active:bg-white/5">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Фото-шапка */}
      <div className="relative flex-shrink-0" style={{ height: 260 }}>
        <img src={entry.photo_url || FALLBACK_PHOTO} className="w-full h-full object-cover" />
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
        <button onClick={() => setMenuOpen(true)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="MoreHorizontal" size={16} className="text-white" />
        </button>

        {/* Имя + позиция */}
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

      {/* Кнопки действий */}
      <div className="flex-shrink-0 px-4 mt-3 flex gap-2">
        {/* Подписаться / Отписаться */}
        <button onClick={handleSubscribe} disabled={subLoading}
          className="flex-1 py-2.5 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95"
          style={subscribed
            ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }
            : { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "#fff", boxShadow: "0 4px 16px rgba(255,45,120,0.4)" }}>
          {subLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            <Icon name={subscribed ? "UserCheck" : "UserPlus"} size={15} className={subscribed ? "text-white/60" : "text-white"} />
          )}
          {subscribed ? "Подписан" : "Подписаться"}
        </button>

        {/* Смотреть эфир */}
        {liveStream && (
          <button onClick={() => onJoin(liveStream)}
            className="flex-1 py-2.5 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#FF8C00,#FFB300)", color: "#fff", boxShadow: "0 4px 16px rgba(255,140,0,0.4)" }}>
            <Icon name="Play" size={14} className="text-white" />
            Эфир
          </button>
        )}
      </div>

      {/* Статус-баннер */}
      <div className="flex-shrink-0 mx-4 mt-3 rounded-2xl p-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="grid grid-cols-3 gap-0">
          <div className="flex flex-col items-center gap-1 px-2 border-r border-white/8">
            <div className="flex items-center gap-1">
              <Icon name="Diamond" size={11} className="text-cyan-400" />
              <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wide">Брилл.</span>
            </div>
            <span className="text-white font-black text-sm leading-none">{formatScore(entry.hearts)}</span>
          </div>

          <div className="flex flex-col items-center gap-1 px-2 border-r border-white/8">
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 13 }}>{rank < 3 ? RANK_MEDALS[rank] : "⭐"}</span>
            </div>
            <span className="font-black text-[11px] leading-none" style={{ color: rc.glow.replace("rgba(", "rgb(").replace(/,[\d.]+\)$/, ")") }}>
              {rankLabel}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 px-2">
            <div className="flex items-center gap-1">
              <Icon name="Eye" size={11} className="text-white/40" />
              <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wide">Зрит.</span>
            </div>
            <span className="text-white font-black text-sm leading-none">{formatScore(entry.viewers)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 mt-2.5 gap-2">
          {[
            { color: "#22C3FF" },
            { color: rc.glow.replace(/,[\d.]+\)$/, ",1)").replace("rgba", "rgb") },
            { color: "#9B9B9B" },
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
