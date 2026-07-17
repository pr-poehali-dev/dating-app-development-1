import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type LiveStream, type User } from "@/lib/api";
import { SettingsSheet, ToolsSheet } from "@/components/screens/LiveSheets";
import { LiveRatingTab } from "@/components/screens/LiveRatingTab";
import { LiveStreamGrid } from "@/components/screens/LiveStreamGrid";
import { LIVE_TABS } from "@/components/screens/LiveStreamConstants";

interface LiveStreamListProps {
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

export function LiveStreamList({
  currentUser,
  streams,
  loading,
  activeTab,
  tabSearch,
  showSettings,
  showTools,
  showStart,
  streamTitle,
  onTabChange,
  onTabSearchChange,
  onJoin,
  onShowSettings,
  onShowTools,
  onShowStart,
  onStreamTitleChange,
  onStartStream,
  streamError,
}: LiveStreamListProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {showSettings && <SettingsSheet onClose={() => onShowSettings(false)} />}
      {showTools && <ToolsSheet currentUser={currentUser} onClose={() => onShowTools(false)} />}

      {/* Модалка старта */}
      {showStart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm animate-slide-up p-6 flex flex-col gap-4"
            style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}>
            <h3 className="text-white font-bold text-lg">Начать трансляцию</h3>
            <input value={streamTitle} onChange={e => onStreamTitleChange(e.target.value)}
              placeholder="Название трансляции"
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
            {streamError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <span className="text-red-400 flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-red-300 text-xs leading-relaxed">{streamError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => onShowStart(false)}
                className="flex-1 glass-card py-3 text-white/60 text-sm font-semibold rounded-2xl">Отмена</button>
              <button onClick={onStartStream}
                className="flex-1 btn-grad py-3 text-sm font-semibold rounded-2xl">Начать</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Хедер */}
        <div className="flex-shrink-0 px-4 pb-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white font-black text-xl tracking-tight">
              Live <span className="text-pink-500">•</span>
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setSearchOpen(v => !v)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: searchOpen ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.08)" }}>
                <Icon name="Search" size={16} className="text-white" />
              </button>
              <button onClick={() => onShowTools(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <Icon name="Sliders" size={16} className="text-white/70" />
              </button>
            </div>
          </div>

          {/* Поиск */}
          {searchOpen && (
            <div className="relative mb-3">
              <Icon name="Search" size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={tabSearch} onChange={e => onTabSearchChange(e.target.value)}
                placeholder="Поиск трансляций..."
                autoFocus
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
            </div>
          )}

          {/* Вкладки */}
          <div className="rounded-2xl p-1 flex gap-0.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {LIVE_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => onTabChange(tab.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all active:scale-95"
                  style={isActive ? {
                    background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                    boxShadow: "0 2px 10px rgba(255,45,120,0.4)",
                  } : {}}>
                  <Icon
                    name={tab.icon as "Flame"|"Sparkles"|"MapPin"|"Heart"|"Trophy"}
                    size={16}
                    className={isActive ? "text-white" : "text-white/40"}
                  />
                  <span className={`text-[10px] font-bold leading-none ${isActive ? "text-white" : "text-white/40"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-4" style={{ scrollbarWidth: "none" }}>
          {activeTab === "rating" ? (
            <LiveRatingTab onJoin={onJoin} streams={streams} />
          ) : (
            <LiveStreamGrid
              streams={streams}
              loading={loading}
              activeTab={activeTab}
              tabSearch={tabSearch}
              onJoin={onJoin}
            />
          )}
        </div>

        {/* Нижняя панель — только кнопка эфира */}
        {activeTab !== "rating" && (
          <div className="flex-shrink-0 px-4 pb-5 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => onShowStart(true)}
              className="btn-grad w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl">
              <Icon name="Radio" size={18} className="text-white" />
              Выйти в эфир
            </button>
          </div>
        )}
      </div>
    </>
  );
}