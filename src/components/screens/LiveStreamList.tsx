import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { liveApi, type LiveStream, type User, type LeaderboardEntry } from "@/lib/api";
import { SettingsSheet, ToolsSheet } from "@/components/screens/LiveSheets";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

const LIVE_TABS = [
  { id: "popular",   label: "Популярное", icon: "Flame" },
  { id: "new",       label: "Новое",      icon: "Sparkles" },
  { id: "nearby",    label: "Рядом",      icon: "MapPin" },
  { id: "following", label: "Подписки",   icon: "Heart" },
  { id: "rating",    label: "Рейтинг",    icon: "Trophy" },
];

const RATING_PERIODS = [
  { id: "live",  label: "В прямом эфире" },
  { id: "today", label: "Сегодня" },
  { id: "week",  label: "На этой неделе" },
  { id: "all",   label: "За всё время" },
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];
const RANK_COLORS = [
  "from-yellow-400/20 to-amber-500/10 border-yellow-400/40",
  "from-slate-300/20 to-slate-400/10 border-slate-300/40",
  "from-orange-400/20 to-amber-600/10 border-orange-400/40",
];

function formatScore(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// ── Профиль в рейтинге ────────────────────────────────────────────────────────
function RatingProfile({ entry, rank, onBack, onJoin, streams }: {
  entry: LeaderboardEntry;
  rank: number;
  onBack: () => void;
  onJoin: (s: LiveStream) => void;
  streams: LiveStream[];
}) {
  const liveStream = entry.stream_id
    ? streams.find(s => s.id === entry.stream_id)
    : streams.find(s => s.user_id === entry.user_id);

  return (
    <div className="flex flex-col h-full">
      {/* Фото-шапка */}
      <div className="relative flex-shrink-0" style={{ height: 320 }}>
        <img
          src={entry.photo_url || FALLBACK_PHOTO}
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.75)" }}
        />
        {/* Градиент снизу */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(15,10,25,0.95) 100%)"
        }} />

        {/* Назад */}
        <button onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>

        {/* ··· */}
        <div className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
          <Icon name="MoreHorizontal" size={18} className="text-white" />
        </div>

        {/* ПОДПИСАТЬСЯ */}
        {liveStream && (
          <button onClick={() => onJoin(liveStream)}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 px-8 py-2.5 rounded-full font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#FF8C00,#FFB300)", color: "#fff", boxShadow: "0 4px 20px rgba(255,140,0,0.5)" }}>
            СМОТРЕТЬ ЭФИР
          </button>
        )}

        {/* Имя + ник */}
        <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            {entry.premium && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                <span style={{ fontSize: 10 }}>✦</span>
              </div>
            )}
            <span className="text-white font-bold text-lg">{entry.name}</span>
            {liveStream && (
              <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">LIVE</span>
            )}
          </div>
          <p className="text-white/50 text-xs mt-0.5">#{rank + 1} в рейтинге</p>
        </div>
      </div>

      {/* Статы — золотой баннер */}
      <div className="flex-shrink-0 mx-4 -mt-1 rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(255,200,50,0.08))", border: "1.5px solid rgba(212,160,23,0.35)" }}>
        {/* Корона */}
        <div className="flex justify-center -mt-3 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#D4A017,#FFD700)", boxShadow: "0 2px 12px rgba(212,160,23,0.6)" }}>
            <span style={{ fontSize: 16 }}>👑</span>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/10 pb-3">
          <div className="flex flex-col items-center gap-0.5 px-2">
            <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wider">Бриллианты</span>
            <span className="text-white font-black text-base">{entry.hearts.toLocaleString("ru")}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
              {rank === 0 ? "Золото I" : rank === 1 ? "Серебро I" : rank === 2 ? "Бронза I" : `Топ ${rank + 1}`}
            </span>
            <div className="w-5 h-5 flex items-center justify-center">
              <span style={{ fontSize: 18 }}>{rank < 3 ? RANK_MEDALS[rank] : "⭐"}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-2">
            <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wider">Подписчиков</span>
            <span className="text-white font-black text-base">{entry.viewers.toLocaleString("ru")}</span>
          </div>
        </div>
        {/* Цветные флажки под колонками */}
        <div className="grid grid-cols-3 pb-2">
          {["#22C3FF", "#D4A017", "#FFB700"].map((c, i) => (
            <div key={i} className="flex justify-center">
              <div style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `14px solid ${c}` }} />
            </div>
          ))}
        </div>
      </div>

      {/* О себе — заглушка */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 mt-4 flex flex-col gap-4">
        <div>
          <p className="text-pink-400 font-bold text-sm mb-2">О себе</p>
          <div className="glass-card p-4 rounded-2xl">
            <p className="text-white/60 text-sm leading-relaxed">
              {liveStream ? `Сейчас в прямом эфире: "${liveStream.title}"` : "Нет активного эфира"}
            </p>
          </div>
        </div>

        {/* Топ-дарители-заглушка */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-pink-400 font-bold text-sm">Топ-дарители</p>
            <span className="text-white/30 text-xs">Показать все</span>
          </div>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg,#2a7a1a,#3a9b28)" }}>
            <div className="flex items-center justify-center py-6 gap-3">
              <Icon name="Diamond" size={16} className="text-cyan-300" />
              <span className="text-white/60 text-sm">Нет данных</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Список рейтинга ───────────────────────────────────────────────────────────
function RatingTab({ onJoin, streams }: { onJoin: (s: LiveStream) => void; streams: LiveStream[] }) {
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
      <RatingProfile
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

              {/* Стрелка / звезда */}
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

// ── Карточка трансляции ───────────────────────────────────────────────────────
function StreamCard({ stream, onJoin }: { stream: LiveStream; onJoin: (s: LiveStream) => void }) {
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
function StreamList({ streams, loading, activeTab, tabSearch, onTabSearchChange, onJoin }: {
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

// ── Props ─────────────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
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
        <div className="flex-shrink-0 px-4 pt-2 pb-3">
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
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {LIVE_TABS.map(tab => (
              <button key={tab.id} onClick={() => onTabChange(tab.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${activeTab === tab.id ? "text-white" : "bg-white/8 text-white/50"}`}
                style={activeTab === tab.id
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 12px rgba(255,45,120,0.35)" }
                  : { background: "rgba(255,255,255,0.07)" }}>
                <Icon name={tab.icon as "Flame"|"Sparkles"|"MapPin"|"Heart"|"Trophy"} size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-4" style={{ scrollbarWidth: "none" }}>
          {activeTab === "rating" ? (
            <RatingTab onJoin={onJoin} streams={streams} />
          ) : (
            <StreamList
              streams={streams}
              loading={loading}
              activeTab={activeTab}
              tabSearch={tabSearch}
              onTabSearchChange={onTabSearchChange}
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
