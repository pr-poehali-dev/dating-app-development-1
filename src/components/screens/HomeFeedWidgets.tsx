import Icon from "@/components/ui/icon";
import { type Post, type LiveStream } from "@/lib/api";

export const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

export function timeAgo(dt: string) {
  const d = (Date.now() - new Date(dt).getTime()) / 1000;
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
export function TrendingBadge({ posts }: { posts: Post[] }) {
  const top = posts.slice().sort((a, b) => b.likes_count - a.likes_count).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="TrendingUp" size={13} className="text-orange-400" />
        <span className="text-white/60 text-xs font-medium">В тренде</span>
      </div>
      <div className="flex gap-2">
        {top.map((p) => (
          <div key={p.id} className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ width: 80, height: 80 }}>
            <img src={p.photo_url} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-1"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
              <Icon name="Heart" size={10} style={{ color: "#FF2D78" }} />
              <span className="text-white text-[9px] font-bold">{p.likes_count}</span>
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
    { icon: "Image", label: "Опубликовать фото", sub: "Поделись моментом", action: onPhoto, color: "#FF2D78" },
    { icon: "Film", label: "Видеоистория", sub: "Короткое видео на 24 часа", action: onStory, color: "#9B59B6" },
    { icon: "Radio", label: "Начать Live", sub: "Прямой эфир для всех", action: onLive, color: "#EF4444" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />
        <p className="text-white/40 text-xs uppercase tracking-widest px-5 mb-3">Создать</p>
        <div className="flex flex-col pb-8">
          {items.map((item) => (
            <button key={item.label}
              onClick={() => { item.action(); onClose(); }}
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}22` }}>
                <Icon name={item.icon as "Image" | "Film" | "Radio"} size={20} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
