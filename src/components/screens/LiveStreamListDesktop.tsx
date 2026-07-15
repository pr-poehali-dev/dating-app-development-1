import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type LiveStream, type User } from "@/lib/api";
import { SettingsSheet, ToolsSheet } from "@/components/screens/LiveSheets";
import { LiveRatingTab } from "@/components/screens/LiveRatingTab";
import { FALLBACK_PHOTO, LIVE_TABS, formatScore } from "@/components/screens/LiveStreamConstants";

interface Props {
  currentUser: User;
  streams: LiveStream[];
  loading: boolean;
  activeTab: string;
  tabSearch: string;
  showSettings: boolean;
  showTools: boolean;
  showStart: boolean;
  streamTitle: string;
  onTabChange: (tab: string) => void;
  onTabSearchChange: (val: string) => void;
  onJoin: (stream: LiveStream) => void;
  onShowSettings: (show: boolean) => void;
  onShowTools: (show: boolean) => void;
  onShowStart: (show: boolean) => void;
  onStreamTitleChange: (val: string) => void;
  onStartStream: () => void;
  streamError?: string;
}

function DesktopStreamCard({ stream, big }: { stream: LiveStream; big?: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl transition-all duration-300 group-hover:scale-[1.015]"
      style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
      <img src={stream.author_photo || FALLBACK_PHOTO} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 55%, transparent 75%)" }} />
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: "inset 0 0 0 2px rgba(255,45,120,0.6), 0 0 40px rgba(255,45,120,0.35)" }} />

      {/* LIVE + viewers */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
        <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider"
          style={{ boxShadow: "0 2px 10px rgba(239,68,68,0.5)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      </div>
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 rounded-full"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
        <Icon name="Eye" size={12} className="text-white/85" />
        <span className="text-white text-[11px] font-bold">{stream.viewers_count}</span>
      </div>

      {/* Инфо снизу */}
      <div className={`absolute bottom-0 left-0 right-0 flex items-end gap-3 ${big ? "p-5" : "p-3.5"}`}>
        <img src={stream.author_photo || FALLBACK_PHOTO}
          className={`rounded-full object-cover flex-shrink-0 ${big ? "w-12 h-12 border-2" : "w-9 h-9 border-[1.5px]"}`}
          style={{ borderColor: "rgba(255,255,255,0.3)" }} />
        <div className="flex-1 min-w-0">
          <p className={`text-white font-bold truncate ${big ? "text-base" : "text-[13px]"}`}
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>{stream.title}</p>
          <p className={`text-white/60 truncate ${big ? "text-sm mt-0.5" : "text-[11px]"}`}>{stream.author_name}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={big ? "text-base" : "text-xs"}>❤️</span>
          <span className={`text-white/75 font-semibold ${big ? "text-sm" : "text-[11px]"}`}>{formatScore(stream.hearts_count)}</span>
        </div>
      </div>
    </div>
  );
}

export function LiveStreamListDesktop({
  currentUser, streams, loading, activeTab, tabSearch, showSettings, showTools, showStart, streamTitle,
  onTabChange, onTabSearchChange, onJoin, onShowSettings, onShowTools, onShowStart, onStreamTitleChange,
  onStartStream, streamError,
}: Props) {
  const [searchVal, setSearchVal] = useState(tabSearch);

  let filtered = [...streams];
  if (tabSearch.trim()) {
    const q = tabSearch.toLowerCase();
    filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || (s.author_name || "").toLowerCase().includes(q));
  } else if (activeTab === "popular") {
    filtered = filtered.sort((a, b) => (b.viewers_count + b.hearts_count) - (a.viewers_count + a.hearts_count));
  } else if (activeTab === "new") {
    filtered = filtered.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
  }

  const [featured, ...rest] = filtered;
  const totalViewers = streams.reduce((s, x) => s + x.viewers_count, 0);

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      <style>{`
        @keyframes liveHeroGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.08); }
        }
        @keyframes liveShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .live-hero-title {
          background: linear-gradient(90deg, #fff 20%, #FF9FC8 40%, #fff 60%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: liveShimmer 5s linear infinite;
        }
      `}</style>

      {showSettings && <SettingsSheet onClose={() => onShowSettings(false)} />}
      {showTools && <ToolsSheet currentUser={currentUser} onClose={() => onShowTools(false)} />}

      {showStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md p-7 flex flex-col gap-4 rounded-[28px]"
            style={{ background: "linear-gradient(160deg, #1c1030, #150a22)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                <Icon name="Radio" size={20} className="text-white" />
              </div>
              <h3 className="text-white font-bold text-xl">Начать трансляцию</h3>
            </div>
            <input value={streamTitle} onChange={e => onStreamTitleChange(e.target.value)}
              placeholder="Название трансляции"
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
            {streamError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <span className="text-red-400 flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-red-300 text-xs leading-relaxed">{streamError}</p>
              </div>
            )}
            <div className="flex gap-3 mt-1">
              <button onClick={() => onShowStart(false)}
                className="flex-1 glass-card py-3.5 text-white/60 text-sm font-semibold rounded-2xl hover:text-white/90 transition-colors">Отмена</button>
              <button onClick={onStartStream}
                className="flex-1 btn-grad py-3.5 text-sm font-bold rounded-2xl hover:brightness-110 transition-all">Начать</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero-баннер ── */}
      <div className="relative overflow-hidden px-10 pt-10 pb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,45,120,0.35), transparent 70%)", animation: "liveHeroGlow 5s ease-in-out infinite", filter: "blur(20px)" }} />
        <div className="absolute -top-24 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(155,89,182,0.3), transparent 70%)", animation: "liveHeroGlow 6s ease-in-out infinite 1s", filter: "blur(20px)" }} />

        <div className="relative flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Прямой эфир</span>
            </div>
            <h1 className="live-hero-title font-unbounded text-4xl font-black tracking-tight mb-2">
              Кто в эфире прямо сейчас
            </h1>
            <p className="text-white/45 text-sm">
              {streams.length} {streams.length === 1 ? "трансляция" : "трансляций"} · {formatScore(totalViewers)} зрителей онлайн
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon name="Search" size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={searchVal}
                onChange={e => { setSearchVal(e.target.value); onTabSearchChange(e.target.value); }}
                placeholder="Поиск трансляций..."
                className="bg-white/6 text-white placeholder-white/30 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos w-64 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
            <button onClick={() => onShowTools(true)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Icon name="Sliders" size={17} className="text-white/70" />
            </button>
            <button onClick={() => onShowStart(true)}
              className="btn-grad px-6 py-3 text-sm font-bold flex items-center gap-2 rounded-2xl whitespace-nowrap hover:brightness-110 hover:-translate-y-0.5 transition-all"
              style={{ boxShadow: "0 8px 24px rgba(255,45,120,0.45)" }}>
              <Icon name="Radio" size={17} className="text-white" />
              Выйти в эфир
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="relative flex gap-2 mt-7">
          {LIVE_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all"
                style={isActive ? {
                  background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                  boxShadow: "0 4px 16px rgba(255,45,120,0.4)",
                } : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              >
                <Icon name={tab.icon as "Flame" | "Sparkles" | "MapPin" | "Heart" | "Trophy"} size={15}
                  className={isActive ? "text-white" : "text-white/45"} />
                <span className={`text-[13px] font-semibold ${isActive ? "text-white" : "text-white/45"}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Контент ── */}
      <div className="px-10 py-8">
        {activeTab === "rating" ? (
          <LiveRatingTab onJoin={onJoin} streams={streams} />
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-11 h-11 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="absolute rounded-full border border-pink-500/20"
                  style={{ width: 56 + i * 32, height: 56 + i * 32, animation: `ping ${1 + i * 0.4}s cubic-bezier(0,0,0.2,1) infinite`, animationDelay: `${i * 0.3}s` }} />
              ))}
              <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.14))", border: "1px solid rgba(255,45,120,0.25)", boxShadow: "0 0 30px rgba(255,45,120,0.2)" }}>
                <Icon name="Radio" size={36} className="text-pink-400" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-white/80 text-lg font-bold">Пока никто не в эфире</p>
              <p className="text-white/40 text-sm">Стань первым и собери свою аудиторию</p>
            </div>
            <button onClick={() => onShowStart(true)}
              className="btn-grad px-7 py-3 text-sm font-bold rounded-2xl mt-2 hover:brightness-110 hover:-translate-y-0.5 transition-all">
              Начать трансляцию
            </button>
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {featured && (
              <div className="group cursor-pointer" style={{ gridColumn: "span 2", aspectRatio: "20/9" }}
                onClick={() => onJoin(featured)}>
                <DesktopStreamCard stream={featured} big />
              </div>
            )}
            {rest.map(s => (
              <div key={s.id} className="group cursor-pointer" style={{ aspectRatio: "4/5" }} onClick={() => onJoin(s)}>
                <DesktopStreamCard stream={s} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
