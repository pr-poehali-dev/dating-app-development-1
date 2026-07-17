import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { type Post, type LiveStream } from "@/lib/api";

export const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1ce048c9-36f3-4eb8-a0bc-4117b2b48365.jpg";

export function timeAgo(dt: string) {
  // Бэкенд отдаёт время в UTC без суффикса зоны (например "2026-07-17T09:40:11").
  // Без явного 'Z' браузер трактует такую строку как локальное время,
  // из-за чего расчёт "сколько времени прошло" сдвигается на разницу с UTC.
  const utcDt = /[zZ]|[+-]\d{2}:?\d{2}$/.test(dt) ? dt : `${dt}Z`;
  const d = (Date.now() - new Date(utcDt).getTime()) / 1000;
  if (d < 60) return "только что";
  if (d < 3600) return `${Math.floor(d / 60)} мин назад`;
  if (d < 86400) return `${Math.floor(d / 3600)} ч назад`;
  return `${Math.floor(d / 86400)} дн назад`;
}

// ─── DeleteConfirm ────────────────────────────────────────────────────────────
export function DeleteConfirm({ onConfirm, onCancel, loading }: {
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="px-5 pb-2 flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
            style={{ background: "rgba(239,68,68,0.12)" }}>
            <Icon name="Trash2" size={24} style={{ color: "#F87171" }} />
          </div>
          <p className="text-white font-bold text-base">Удалить публикацию?</p>
          <p className="text-white/40 text-sm">Это действие нельзя отменить. Фото и комментарии будут удалены.</p>
        </div>
        <div className="px-5 pb-8 pt-5 flex flex-col gap-2.5">
          <button onClick={onConfirm} disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#EF4444,#B91C1C)" }}>
            {loading ? "Удаляем..." : "Удалить"}
          </button>
          <button onClick={onCancel}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white/60 glass-card">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LiveBadge ────────────────────────────────────────────────────────────────
export function LiveBadge({ streams, onJoin }: { streams: LiveStream[]; onJoin: (s: LiveStream) => void }) {
  if (streams.length === 0) return null;
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
        <span className="text-white/60 text-xs font-medium">В эфире сейчас</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {streams.map((s) => (
          <button key={s.id} onClick={() => onJoin(s)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden"
                style={{ border: "2px solid #EF4444", boxShadow: "0 0 0 2px rgba(239,68,68,0.3)" }}>
                <img src={s.author_photo || FALLBACK_PHOTO} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                LIVE
              </div>
            </div>
            <span className="text-white/70 text-[10px] max-w-[60px] truncate">{s.author_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── TrendingBadge ────────────────────────────────────────────────────────────
const CARD_W = 90; // ширина карточки + gap

export function TrendingBadge({ posts, streams = [], onJoinLive }: {
  posts: Post[];
  streams?: LiveStream[];
  onJoinLive?: (s: LiveStream) => void;
}) {
  const topPosts = posts.slice().sort((a, b) => b.likes_count - a.likes_count).slice(0, 15);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const totalItems = streams.length + topPosts.length;

  if (totalItems === 0) return null;

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? CARD_W * 3 : -CARD_W * 3, behavior: "smooth" });
  };

  return (
    <div className="pt-3 pb-3">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FF6B35,#FF2D78)" }}>
            <Icon name="TrendingUp" size={12} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">В тренде</span>
          <span className="text-white/30 text-xs font-medium">{totalItems}</span>
        </div>
        {/* Кнопки листания (на планшетах/десктопе) */}
        <div className="flex items-center gap-1">
          <button onClick={() => scroll("left")} disabled={!canLeft}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-20"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="ChevronLeft" size={15} className="text-white" />
          </button>
          <button onClick={() => scroll("right")} disabled={!canRight}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-20"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="ChevronRight" size={15} className="text-white" />
          </button>
        </div>
      </div>

      {/* Лента с сенсорным свайпом */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-2.5 overflow-x-auto pb-1 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

        {/* Live-стримеры */}
        {streams.map((s) => (
          <button key={`live-${s.id}`} onClick={() => onJoinLive?.(s)}
            className="relative rounded-2xl overflow-hidden flex-shrink-0 active:scale-95 transition-transform"
            style={{ width: 82, height: 110, boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}>
            <img src={s.author_photo || FALLBACK_PHOTO} className="w-full h-full object-cover" />
            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: "inset 0 0 0 2px #EF4444" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }} />
            <div className="absolute top-2 left-2">
              <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse tracking-wide flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-white inline-block" />LIVE
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
              <p className="text-white text-[10px] font-semibold truncate">{s.author_name}</p>
            </div>
          </button>
        ))}

        {/* Топ-15 постов */}
        {topPosts.map((p) => (
          <div key={p.id} className="relative rounded-2xl overflow-hidden flex-shrink-0"
            style={{ width: 82, height: 110 }}>
            <img src={p.photo_url} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
            {/* Лайки */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <Icon name="Heart" size={10} style={{ color: "#FF2D78" }} />
              <span className="text-white text-[10px] font-bold">{p.likes_count}</span>
            </div>
            {/* Имя автора */}
            <div className="absolute top-2 left-2 right-2">
              <p className="text-white/80 text-[9px] font-semibold truncate">{p.author_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CreateMenu ───────────────────────────────────────────────────────────────
export function CreateMenu({ onPhoto, onStory, onLive, onClose }: {
  onPhoto: () => void;
  onStory: () => void;
  onLive: () => void;
  onClose: () => void;
}) {
  const items = [
    { icon: "Image", label: "Опубликовать фото", sub: "Поделись моментом", action: onPhoto, color: "#FF2D78", soon: false },
    { icon: "Film", label: "Видеоистория", sub: "Короткое видео на 24 часа", action: onStory, color: "#9B59B6", soon: false },
    { icon: "Radio", label: "Начать Live", sub: "Прямой эфир для всех", action: onLive, color: "#EF4444", soon: false },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "linear-gradient(180deg, #1e1830 0%, #17112a 100%)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />
        <p className="text-white/40 text-xs uppercase tracking-widest px-5 mb-3">Создать</p>
        <div className="flex flex-col pb-8">
          {items.map((item) => (
            <button key={item.label} disabled={item.soon}
              onClick={() => { if (item.soon) return; item.action(); onClose(); }}
              className={`flex items-center gap-4 px-5 py-4 transition-all text-left active:scale-[0.98] ${item.soon ? "cursor-not-allowed opacity-50" : "hover:bg-white/5"}`}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}22`, border: `1px solid ${item.color}33`, boxShadow: `0 2px 10px ${item.color}25` }}>
                <Icon name={item.icon as "Image" | "Film" | "Radio"} size={20} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  {item.soon && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
                      СКОРО
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-0.5">{item.soon ? "Появится в следующем обновлении" : item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}