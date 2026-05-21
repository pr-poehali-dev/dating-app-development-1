import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { liveApi, type User, type LiveStream, type LiveMessage } from "@/lib/api";

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

// ─── SettingsSheet ─────────────────────────────────────────────────────────────
function SettingsSheet({ onClose }: { onClose: () => void }) {
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
                  className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={lang === lg.v
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
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

// ─── ToolsSheet ────────────────────────────────────────────────────────────────
function ToolsSheet({ currentUser, onClose }: { currentUser: User; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const liveId = `LB${currentUser.id.toString().padStart(8, "0")}`;

  const copyId = () => {
    navigator.clipboard?.writeText(liveId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toolItems = [
    { icon: "Clock", label: "Недавние трансляции", sub: "История твоих эфиров" },
    { icon: "Share2", label: "Социальные сети", sub: "Поделиться профилем" },
    { icon: "Ban", label: "Чёрный список", sub: "Заблокированные пользователи" },
    { icon: "MessageSquare", label: "Отправить отзыв", sub: "Помоги нам стать лучше" },
  ];

  return (
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)", color: copied ? "#4ADE80" : "rgba(255,255,255,0.6)" }}>
              <Icon name={copied ? "Check" : "Copy"} size={14} />
              {copied ? "Скопировано!" : "Копировать"}
            </button>
          </div>

          {/* Пункты меню */}
          {toolItems.map((item) => (
            <button key={item.label}
              className="glass-card flex items-center gap-4 px-4 py-3.5 w-full text-left hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,45,120,0.1)" }}>
                <Icon name={item.icon as "Clock"|"Share2"|"Ban"|"MessageSquare"} size={18} className="text-pink-400" />
              </div>
              <div className="flex-1">
                <p className="text-white/85 text-sm">{item.label}</p>
                <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
              </div>
              <Icon name="ChevronRight" size={15} className="text-white/25 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LiveScreen ───────────────────────────────────────────────────────────────
export function LiveScreen({ currentUser }: { currentUser: User }) {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<LiveMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [heartsAnim, setHeartsAnim] = useState<number[]>([]);
  const [showStart, setShowStart] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [lastMsgId, setLastMsgId] = useState(0);
  const lastMsgIdRef = useRef(0);
  const [activeTab, setActiveTab] = useState("popular");
  const [tabSearch, setTabSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadStreams = () => {
    liveApi.list()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStreams(); }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  useEffect(() => {
    if (!activeStream) { if (pollRef.current) clearInterval(pollRef.current); return; }
    const poll = async () => {
      try {
        const res = await liveApi.poll(activeStream.id, lastMsgIdRef.current);
        if (res.stream.status === 'ended' && !isStreaming) {
          setActiveStream(null); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
          loadStreams(); return;
        }
        setActiveStream((prev) => prev ? { ...prev, viewers_count: res.stream.viewers_count, hearts_count: res.stream.hearts_count } : prev);
        if (res.messages.length > 0) {
          const newId = res.messages[res.messages.length - 1].id;
          lastMsgIdRef.current = newId;
          setLastMsgId(newId);
          setChatMsgs((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = res.messages.filter((m: LiveMessage) => !existingIds.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
      } catch (e: unknown) { void e; }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeStream?.id, isStreaming]);

  const handleJoin = async (stream: LiveStream) => {
    setActiveStream(stream); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    try { await liveApi.join(stream.id); } catch (e: unknown) { void e; }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const handleLeave = async () => {
    if (!activeStream) return;
    setLeaving(true);
    await new Promise((r) => setTimeout(r, 350));
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    const streamId = activeStream.id;
    stopCamera();
    setActiveStream(null); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    setLeaving(false);
    if (isStreaming) {
      setIsStreaming(false);
      try { await liveApi.end(); } catch (e: unknown) { void e; }
    } else {
      try { await liveApi.leave(streamId); } catch (e: unknown) { void e; }
    }
    loadStreams();
  };

  const handleFlipCamera = async () => {
    if (switchingCamera || !streamRef.current) return;
    setSwitchingCamera(true);
    const nextFacing = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: nextFacing }, audio: true });
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
      setFacingMode(nextFacing);
    } catch (e: unknown) { void e; }
    setSwitchingCamera(false);
  };

  const handleStartStream = async () => {
    if (!streamTitle.trim()) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = mediaStream;
      setFacingMode("user");
      const res = await liveApi.start(streamTitle.trim());
      setIsStreaming(true);
      setShowStart(false);
      setStreamTitle("");
      setActiveStream(res.stream);
      setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    } catch (e: unknown) { void e; }
  };

  const handleHeart = async () => {
    if (!activeStream) return;
    const id = Date.now();
    setHeartsAnim((prev) => [...prev, id]);
    setTimeout(() => setHeartsAnim((prev) => prev.filter((x) => x !== id)), 1500);
    try { const res = await liveApi.heart(activeStream.id); setActiveStream((prev) => prev ? { ...prev, hearts_count: res.hearts_count } : prev); }
    catch (e: unknown) { void e; }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeStream) return;
    const text = chatInput.trim(); setChatInput("");
    try {
      const res = await liveApi.chat(activeStream.id, text);
      lastMsgIdRef.current = res.message.id;
      setLastMsgId(res.message.id);
      setChatMsgs((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
    } catch (e: unknown) { void e; }
  };

  // ── Активный просмотр трансляции ──────────────────────────────────────────
  if (activeStream) {
    return (
      <div className="flex flex-col h-full relative"
        style={{ background: "#0a0014", opacity: leaving ? 0 : 1, transform: leaving ? "scale(0.97)" : "scale(1)", transition: "opacity 0.35s ease, transform 0.35s ease" }}>
        <div className="relative flex-shrink-0" style={{ height: "45%" }}>
          <div className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{ background: "linear-gradient(135deg,#1a0030,#2d0050)" }}>
            {isStreaming
              ? <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current && !el.srcObject) {
                      el.srcObject = streamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay muted playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none", transition: "transform 0.3s" }}
                />
              : <div className="flex flex-col items-center gap-2">
                  <img src={activeStream.author_photo || FALLBACK_PHOTO} className="w-20 h-20 rounded-full object-cover border-4 border-pink-500" />
                  <p className="text-white font-semibold">{activeStream.author_name}</p>
                </div>
            }
          </div>
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">LIVE</span>
              <span className="glass-card px-2 py-0.5 text-white/80 text-xs flex items-center gap-1">
                <Icon name="Eye" size={11} />{activeStream.viewers_count}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isStreaming && (
                <button onClick={handleFlipCamera} disabled={switchingCamera}
                  className="glass-card w-8 h-8 flex items-center justify-center"
                  style={{ opacity: switchingCamera ? 0.5 : 1, transition: "opacity 0.2s" }}>
                  <Icon name="RefreshCw" size={14} className="text-white/80"
                    style={{ transform: switchingCamera ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.4s ease" }} />
                </button>
              )}
              <button onClick={handleLeave}
                className="glass-card px-3 py-1.5 text-white/70 text-xs flex items-center gap-1.5">
                <Icon name="X" size={13} />{isStreaming ? "Завершить" : "Выйти"}
              </button>
            </div>
          </div>
          <div className="absolute bottom-3 left-4">
            <p className="text-white font-semibold text-sm">{activeStream.title}</p>
          </div>
          {heartsAnim.map((id) => (
            <div key={id} className="absolute bottom-16 right-6 pointer-events-none animate-bounce text-2xl">❤️</div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-0">
          {chatMsgs.map((m) => (
            <div key={m.id} className="flex items-start gap-2">
              <img src={m.author_photo || FALLBACK_PHOTO} className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5" />
              <div className="glass-card px-2.5 py-1.5 max-w-[85%]">
                <span className="text-pink-400 text-xs font-semibold">{m.author_name} </span>
                <span className="text-white/80 text-xs">{m.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 pb-4 pt-2 flex gap-2 items-center flex-shrink-0">
          <button onClick={handleHeart}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,45,120,0.2)", border: "1px solid rgba(255,45,120,0.4)" }}>
            <span className="text-lg">❤️</span>
          </button>
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            placeholder="Написать в чат..."
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
          <button onClick={handleSendChat}
            className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={15} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // ── Главный экран Live ─────────────────────────────────────────────────────
  return (
    <>
      {/* Модалки */}
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      {showTools && <ToolsSheet currentUser={currentUser} onClose={() => setShowTools(false)} />}

      {showStart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm animate-slide-up p-6 flex flex-col gap-4"
            style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}>
            <h3 className="text-white font-bold text-lg">Начать трансляцию</h3>
            <input value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)}
              placeholder="Название трансляции"
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
            <div className="flex gap-3">
              <button onClick={() => setShowStart(false)}
                className="flex-1 glass-card py-3 text-white/60 text-sm font-semibold">Отмена</button>
              <button onClick={handleStartStream}
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={activeTab === tab.id
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                  : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Строка поиска — только на вкладке Поиск */}
          {activeTab === "search" && (
            <div className="relative mt-2">
              <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={tabSearch} onChange={(e) => setTabSearch(e.target.value)}
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
          {!loading && streams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-5xl">📡</div>
              <p className="text-white/50 text-sm text-center">Нет активных трансляций.<br />Выйди в эфир первым!</p>
            </div>
          )}
          {streams.map((s) => (
            <button key={s.id} onClick={() => handleJoin(s)}
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
          ))}
        </div>

        {/* Нижняя панель: Инструменты + Выйти в эфир + Настройки */}
        <div className="flex-shrink-0 px-4 pb-5 pt-3 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => setShowTools(true)}
            className="glass-card px-3 py-3.5 flex flex-col items-center gap-1 active:scale-95 transition-all flex-shrink-0"
            style={{ minWidth: 72 }}>
            <Icon name="Wrench" size={18} className="text-white/70" />
            <span className="text-white/60 text-[10px] font-medium">Инструменты</span>
          </button>
          <button onClick={() => setShowStart(true)}
            className="btn-grad flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl">
            <Icon name="Radio" size={18} className="text-white" />
            Выйти в эфир
          </button>
          <button onClick={() => setShowSettings(true)}
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