import Icon from "@/components/ui/icon";
import { type LiveStream } from "@/lib/api";
import { FALLBACK_PHOTO, formatScore } from "@/components/screens/LiveStreamConstants";

// ── Карточка трансляции ───────────────────────────────────────────────────────
export function StreamCard({ stream, onJoin }: { stream: LiveStream; onJoin: (s: LiveStream) => void }) {
  return (
    <button onClick={() => onJoin(stream)} className="relative w-full rounded-2xl overflow-hidden active:scale-98 transition-all flex-shrink-0"
      style={{ aspectRatio: "16/9" }}>
      <img src={stream.author_photo || FALLBACK_PHOTO} className="w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)" }} />

      {/* LIVE бейдж */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider">LIVE</span>
      </div>

      {/* Зрители */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <Icon name="Eye" size={11} className="text-white/80" />
        <span className="text-white text-[10px] font-semibold">{stream.viewers_count}</span>
      </div>

      {/* Инфо снизу */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end gap-2">
        <img src={stream.author_photo || FALLBACK_PHOTO}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-white/20" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-xs truncate">{stream.title}</p>
          <p className="text-white/60 text-[10px] truncate">{stream.author_name}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px]">❤️</span>
          <span className="text-white/70 text-[10px] font-medium">{formatScore(stream.hearts_count)}</span>
        </div>
      </div>
    </button>
  );
}

// ── Список трансляций ─────────────────────────────────────────────────────────
export function LiveStreamGrid({ streams, loading, activeTab, tabSearch, onTabSearchChange, onJoin }: {
  streams: LiveStream[];
  loading: boolean;
  activeTab: string;
  tabSearch: string;
  onTabSearchChange: (v: string) => void;
  onJoin: (s: LiveStream) => void;
}) {
  let filtered = [...streams];
  if (activeTab === "search" && tabSearch.trim()) {
    const q = tabSearch.toLowerCase();
    filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || (s.author_name || "").toLowerCase().includes(q));
  } else if (activeTab === "popular") {
    filtered = filtered.sort((a, b) => (b.viewers_count + b.hearts_count) - (a.viewers_count + a.hearts_count));
  } else if (activeTab === "new") {
    filtered = filtered.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="text-5xl">📡</div>
        <p className="text-white/50 text-sm text-center">Нет активных трансляций.<br />Выйди в эфир первым!</p>
      </div>
    );
  }

  const [featured, ...rest] = filtered;

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Главная карточка крупно */}
      {featured && <StreamCard stream={featured} onJoin={onJoin} />}

      {/* Остальные — сетка 2 колонки */}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {rest.map(s => (
            <button key={s.id} onClick={() => onJoin(s)}
              className="relative rounded-xl overflow-hidden active:scale-95 transition-all"
              style={{ aspectRatio: "9/12" }}>
              <img src={s.author_photo || FALLBACK_PHOTO} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 50%)" }} />
              <div className="absolute top-1.5 left-1.5">
                <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">LIVE</span>
              </div>
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(0,0,0,0.5)" }}>
                <Icon name="Eye" size={9} className="text-white/80" />
                <span className="text-white text-[9px] font-semibold">{s.viewers_count}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white font-semibold text-[11px] truncate">{s.author_name}</p>
                <p className="text-white/50 text-[10px] truncate">{s.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
