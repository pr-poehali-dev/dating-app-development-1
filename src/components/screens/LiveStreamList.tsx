import Icon from "@/components/ui/icon";
import { type LiveStream, type User } from "@/lib/api";
import { SettingsSheet, ToolsSheet } from "@/components/screens/LiveSheets";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

const LIVE_TABS = [
  { id: "search",    label: "Поиск" },
  { id: "popular",   label: "Популярное" },
  { id: "nearby",    label: "Рядом" },
  { id: "following", label: "Подписки" },
  { id: "date",      label: "Свидание" },
  { id: "new",       label: "Новое" },
  { id: "rating",    label: "Рейтинг" },
];

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
  return (
    <>
      {showSettings && <SettingsSheet onClose={() => onShowSettings(false)} />}
      {showTools && <ToolsSheet currentUser={currentUser} onClose={() => onShowTools(false)} />}

      {showStart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm animate-slide-up p-6 flex flex-col gap-4"
            style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}>
            <h3 className="text-white font-bold text-lg">Начать трансляцию</h3>
            <input value={streamTitle} onChange={(e) => onStreamTitleChange(e.target.value)}
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
                className="flex-1 glass-card py-3 text-white/60 text-sm font-semibold">Отмена</button>
              <button onClick={onStartStream}
                className="flex-1 btn-grad py-3 text-sm font-semibold">Начать</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Вкладки */}
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {LIVE_TABS.map((tab) => (
              <button key={tab.id} onClick={() => onTabChange(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeTab === tab.id ? "text-white" : "bg-white/10 text-white/60"}`}
                style={activeTab === tab.id
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                  : undefined}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "search" && (
            <div className="relative mt-2">
              <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={tabSearch} onChange={(e) => onTabSearchChange(e.target.value)}
                placeholder="Поиск трансляций..."
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
            </div>
          )}
        </div>

        {/* Список трансляций */}
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-24">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && (() => {
            let filtered = [...streams];
            if (activeTab === "search" && tabSearch.trim()) {
              const q = tabSearch.toLowerCase();
              filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.author_name.toLowerCase().includes(q));
            } else if (activeTab === "popular") {
              filtered = filtered.sort((a, b) => (b.viewers_count + b.hearts_count) - (a.viewers_count + a.hearts_count));
            } else if (activeTab === "new") {
              filtered = filtered.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
            } else if (activeTab === "rating") {
              filtered = filtered.sort((a, b) => b.hearts_count - a.hearts_count);
            }
            if (filtered.length === 0) return (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="text-5xl">📡</div>
                <p className="text-white/50 text-sm text-center">Нет активных трансляций.<br />Выйди в эфир первым!</p>
              </div>
            );
            return filtered.map((s) => (
              <button key={s.id} onClick={() => onJoin(s)}
                className="glass-card p-4 flex items-center gap-3 w-full text-left">
                <div className="relative flex-shrink-0">
                  <img src={s.author_photo || FALLBACK_PHOTO} className="w-14 h-14 rounded-full object-cover" />
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">LIVE</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{s.title}</p>
                  <p className="text-white/50 text-xs">{s.author_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-white/40 text-xs flex items-center gap-1"><Icon name="Eye" size={11} />{s.viewers_count}</span>
                    <span className="text-white/40 text-xs flex items-center gap-1">❤️ {s.hearts_count}</span>
                  </div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-white/30 flex-shrink-0" />
              </button>
            ));
          })()}
        </div>

        {/* Нижняя панель */}
        <div className="flex-shrink-0 px-4 pb-5 pt-3 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => onShowTools(true)}
            className="glass-card px-3 py-3.5 flex flex-col items-center gap-1 active:scale-95 transition-all flex-shrink-0"
            style={{ minWidth: 72 }}>
            <Icon name="Wrench" size={18} className="text-white/70" />
            <span className="text-white/60 text-[10px] font-medium">Инструменты</span>
          </button>
          <button onClick={() => onShowStart(true)}
            className="btn-grad flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl">
            <Icon name="Radio" size={18} className="text-white" />
            Выйти в эфир
          </button>
          <button onClick={() => onShowSettings(true)}
            className="glass-card px-3 py-3.5 flex flex-col items-center gap-1 active:scale-95 transition-all flex-shrink-0"
            style={{ minWidth: 72 }}>
            <Icon name="Settings" size={18} className="text-white/70" />
            <span className="text-white/60 text-[10px] font-medium">Настройки</span>
          </button>
        </div>
      </div>
    </>
  );
}