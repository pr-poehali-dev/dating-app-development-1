import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { type User, type BlockedUser, type MyStream, blocksApi, liveApi, feedbackApi } from "@/lib/api";
import { UserAvatar } from "@/components/ui/UserAvatar";

// ─── SettingsSheet ─────────────────────────────────────────────────────────────
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [lang, setLang] = useState("ru");
  const [location, setLocation] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const detectGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const d = await r.json();
        setLocation(d.address?.city || d.address?.town || d.address?.country || "");
      } catch { /* ignore */ }
      setGeoLoading(false);
    }, () => setGeoLoading(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-base">Настройки</h3>
          <button onClick={onClose}><Icon name="X" size={20} className="text-white/40" /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-5 pb-10">
          {/* Местоположение */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Местоположение</p>
            <div className="flex gap-2">
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Ваш город..."
                className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
              <button onClick={detectGeo} disabled={geoLoading}
                className="glass-card px-3 py-2.5 text-white/60 text-xs flex items-center gap-1.5 disabled:opacity-50">
                {geoLoading
                  ? <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                  : <Icon name="LocateFixed" size={14} />}
                GPS
              </button>
            </div>
          </div>
          {/* Язык */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Язык</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: "ru", l: "Русский" }, { v: "en", l: "English" }, { v: "tr", l: "Türkçe" }].map((lg) => (
                <button key={lg.v} onClick={() => setLang(lg.v)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${lang === lg.v ? "text-white" : "text-white/60"}`}
                  style={lang === lg.v
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                    : { background: "rgba(255,255,255,0.08)" }}>
                  {lg.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BlacklistSheet ────────────────────────────────────────────────────────────
function BlacklistSheet({ onClose }: { onClose: () => void }) {
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  useEffect(() => {
    blocksApi.list()
      .then((d) => setBlocks(d.blocks))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnblock = async (userId: number) => {
    setUnblockingId(userId);
    try {
      await blocksApi.unblock(userId);
      setBlocks((prev) => prev.filter((b) => b.id !== userId));
    } catch { /* ignore */ }
    setUnblockingId(null);
  };


  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "80dvh" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-base">Чёрный список</h3>
          <button onClick={onClose}><Icon name="X" size={20} className="text-white/40" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-10 flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" size={24} className="text-white/30 animate-spin" />
            </div>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.15)" }}>
                <Icon name="Ban" size={26} className="text-pink-400/60" />
              </div>
              <p className="text-white/50 text-sm">Список пуст</p>
              <p className="text-white/25 text-xs">Заблокированные пользователи появятся здесь</p>
            </div>
          ) : blocks.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <UserAvatar src={user.photo_url} className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user.name}{user.age ? `, ${user.age}` : ""}</p>
                <p className="text-white/30 text-xs">Заблокирован</p>
              </div>
              <button
                onClick={() => handleUnblock(user.id)}
                disabled={unblockingId === user.id}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "rgba(255,45,120,0.12)", border: "1px solid rgba(255,45,120,0.2)", color: "#FF2D78" }}>
                {unblockingId === user.id
                  ? <Icon name="Loader2" size={13} className="animate-spin" />
                  : "Разблокировать"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RecentStreamsSheet ─────────────────────────────────────────────────────────
function RecentStreamsSheet({ onClose }: { onClose: () => void }) {
  const [streams, setStreams] = useState<MyStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    liveApi.myStreams()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setClearing(true);
    try {
      await liveApi.clearMyStreams();
      setStreams([]);
      setConfirmClear(false);
    } catch { /* ignore */ }
    setClearing(false);
  };

  const fmt = (sec: number | null) => {
    if (!sec) return null;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}ч ${m}м`;
    if (m > 0) return `${m}м ${s}с`;
    return `${s}с`;
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "80dvh" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-base">Недавние трансляции</h3>
          <div className="flex items-center gap-2">
            {streams.length > 0 && (
              <button onClick={handleClear} disabled={clearing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={confirmClear
                  ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }
                  : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                {clearing
                  ? <Icon name="Loader2" size={12} className="animate-spin" />
                  : <Icon name="Trash2" size={12} />}
                {confirmClear ? "Точно?" : "Очистить"}
              </button>
            )}
            <button onClick={onClose}><Icon name="X" size={20} className="text-white/40" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-10 flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" size={24} className="text-white/30 animate-spin" />
            </div>
          ) : streams.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.15)" }}>
                <Icon name="Clock" size={26} className="text-pink-400/60" />
              </div>
              <p className="text-white/50 text-sm">Трансляций пока нет</p>
              <p className="text-white/25 text-xs">Проведи первый эфир — он появится здесь</p>
            </div>
          ) : streams.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.status === "active" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)" }}>
                {s.status === "active"
                  ? <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  : <Icon name="Video" size={16} className="text-white/30" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{s.title}</p>
                <p className="text-white/35 text-xs">{fmtDate(s.started_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-2 text-white/40 text-[11px]">
                  <span className="flex items-center gap-0.5"><Icon name="Eye" size={11} /> {s.viewers_count}</span>
                  <span className="flex items-center gap-0.5">❤️ {s.hearts_count}</span>
                </div>
                {fmt(s.duration_sec) && (
                  <span className="text-white/25 text-[10px]">{fmt(s.duration_sec)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FeedbackSheet ─────────────────────────────────────────────────────────────
function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState("general");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const CATEGORIES = [
    { id: "general", label: "Общее" },
    { id: "bug", label: "Ошибка" },
    { id: "idea", label: "Идея" },
    { id: "live", label: "Трансляции" },
  ];

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await feedbackApi.send(text.trim(), rating ?? undefined, category);
      setSent(true);
    } catch { /* ignore */ }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-base">Отправить отзыв</h3>
          <button onClick={onClose}><Icon name="X" size={20} className="text-white/40" /></button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 px-5 py-10 pb-14 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 6px 20px rgba(255,45,120,0.4)" }}>
              <Icon name="Check" size={28} className="text-white" />
            </div>
            <p className="text-white font-bold text-lg">Спасибо!</p>
            <p className="text-white/40 text-sm">Твой отзыв отправлен. Мы обязательно его прочитаем.</p>
            <button onClick={onClose} className="btn-grad px-8 py-2.5 text-sm font-semibold rounded-2xl mt-2">
              Закрыть
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 pb-10 flex flex-col gap-4">
            {/* Рейтинг */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Оценка</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)}
                    className="flex-1 py-2 rounded-xl text-lg transition-all active:scale-90"
                    style={{ background: rating !== null && star <= rating ? "rgba(255,45,120,0.15)" : "rgba(255,255,255,0.06)", border: rating !== null && star <= rating ? "1px solid rgba(255,45,120,0.3)" : "1px solid rgba(255,255,255,0.07)" }}>
                    {rating !== null && star <= rating ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            {/* Категория */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Тема</p>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={category === c.id
                      ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                      : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Текст */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Сообщение</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Напиши, что думаешь..."
                rows={4}
                className="w-full bg-white/8 text-white placeholder-white/25 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/40 font-golos resize-none"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            </div>

            <button onClick={handleSend} disabled={!text.trim() || sending}
              className="w-full btn-grad py-3.5 text-sm font-bold rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2">
              {sending
                ? <><Icon name="Loader2" size={16} className="animate-spin" /> Отправка...</>
                : <><Icon name="Send" size={16} /> Отправить</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ToolsSheet ────────────────────────────────────────────────────────────────
export function ToolsSheet({ currentUser, onClose }: { currentUser: User; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const liveId = `LB${currentUser.id.toString().padStart(8, "0")}`;

  const copyId = () => {
    navigator.clipboard?.writeText(liveId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toolItems = [
    { icon: "Clock", label: "Недавние трансляции", sub: "История твоих эфиров", onClick: () => setShowRecent(true) },
    { icon: "Share2", label: "Социальные сети", sub: "Поделиться профилем", onClick: undefined },
    { icon: "Ban", label: "Чёрный список", sub: "Заблокированные пользователи", onClick: () => setShowBlacklist(true) },
    { icon: "MessageSquare", label: "Отправить отзыв", sub: "Помоги нам стать лучше", onClick: () => setShowFeedback(true) },
  ];

  return (
    <>
      {showBlacklist && <BlacklistSheet onClose={() => setShowBlacklist(false)} />}
      {showRecent && <RecentStreamsSheet onClose={() => setShowRecent(false)} />}
      {showFeedback && <FeedbackSheet onClose={() => setShowFeedback(false)} />}

      <div className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)" }} onClick={onClose}>
        <div className="w-full max-w-sm animate-slide-up flex flex-col"
          style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "85dvh" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-white font-bold text-base">Инструменты</h3>
            <button onClick={onClose}><Icon name="X" size={20} className="text-white/40" /></button>
          </div>

          <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4 pb-10">
            {/* Статистика */}
            <div className="glass-card p-4 grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center gap-1 py-2">
                <span className="text-white font-bold text-2xl">{currentUser.followers ?? 0}</span>
                <span className="text-white/40 text-xs">Подписчиков</span>
              </div>
              <div className="flex flex-col items-center gap-1 py-2" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-lg">💎</span>
                  <span className="text-white font-bold text-2xl">0</span>
                </div>
                <span className="text-white/40 text-xs">Бриллиантов</span>
              </div>
            </div>

            {/* Статус */}
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,45,120,0.15)" }}>
                <Icon name="Award" size={20} className="text-pink-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Статус: Новичок</p>
                <p className="text-white/40 text-xs">Уровень 1 · Проведи первый эфир!</p>
              </div>
            </div>

            {/* Live ID */}
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-xs mb-1">Мой Live ID</p>
                <p className="text-white font-mono font-bold text-base">{liveId}</p>
              </div>
              <button onClick={copyId}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${copied ? "" : "text-white/60"}`}
                style={{ background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)", ...(copied ? { color: "#4ADE80" } : {}) }}>
                <Icon name={copied ? "Check" : "Copy"} size={14} />
                {copied ? "Скопировано!" : "Копировать"}
              </button>
            </div>

            {/* Пункты меню */}
            {toolItems.map((item) => (
              <button key={item.label}
                onClick={item.onClick}
                className="glass-card flex items-center gap-4 px-4 py-3.5 w-full text-left hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,45,120,0.1)" }}>
                  <Icon name={item.icon as "Clock"|"Share2"|"Ban"|"MessageSquare"} size={18} className="text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white/85 text-sm">{item.label}</p>
                  <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
                </div>
                <Icon name="ChevronRight" size={15} className="text-white/20" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}