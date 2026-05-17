import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { liveApi, type User, type LiveStream, type LiveMessage } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  void currentUser;

  const loadStreams = () => {
    liveApi.list()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStreams(); }, []);

  useEffect(() => {
    if (!activeStream) { if (pollRef.current) clearInterval(pollRef.current); return; }
    const poll = async () => {
      try {
        const res = await liveApi.poll(activeStream.id, lastMsgId);
        if (res.stream.status === 'ended' && !isStreaming) {
          setActiveStream(null); setChatMsgs([]); setLastMsgId(0);
          loadStreams(); return;
        }
        setActiveStream((prev) => prev ? { ...prev, viewers_count: res.stream.viewers_count, hearts_count: res.stream.hearts_count } : prev);
        if (res.messages.length > 0) {
          setChatMsgs((prev) => [...prev, ...res.messages]);
          setLastMsgId(res.messages[res.messages.length - 1].id);
        }
      } catch (e: unknown) { void e; }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeStream?.id, isStreaming]);

  const handleJoin = async (stream: LiveStream) => {
    setActiveStream(stream); setChatMsgs([]); setLastMsgId(0);
    try { await liveApi.join(stream.id); } catch (e: unknown) { void e; }
  };

  const handleLeave = async () => {
    if (!activeStream) return;
    if (isStreaming) {
      await liveApi.end();
      setIsStreaming(false);
    } else {
      try { await liveApi.leave(activeStream.id); } catch (e: unknown) { void e; }
    }
    setActiveStream(null); setChatMsgs([]); setLastMsgId(0);
    loadStreams();
  };

  const handleStartStream = async () => {
    if (!streamTitle.trim()) return;
    try {
      const res = await liveApi.start(streamTitle.trim());
      setIsStreaming(true);
      setShowStart(false);
      setStreamTitle("");
      setActiveStream(res.stream);
      setChatMsgs([]); setLastMsgId(0);
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
      setChatMsgs((prev) => [...prev, res.message]);
      setLastMsgId(res.message.id);
    } catch (e: unknown) { void e; }
  };

  if (activeStream) {
    return (
      <div className="flex flex-col h-full relative" style={{ background: "#0a0014" }}>
        <div className="relative flex-shrink-0" style={{ height: "45%" }}>
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#1a0030,#2d0050)" }}>
            {isStreaming
              ? <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full btn-grad flex items-center justify-center">
                    <Icon name="Video" size={28} className="text-white" />
                  </div>
                  <p className="text-white/60 text-sm">Вы ведёте трансляцию</p>
                </div>
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
            <button onClick={handleLeave}
              className="glass-card px-3 py-1.5 text-white/70 text-xs flex items-center gap-1.5">
              <Icon name="X" size={13} />{isStreaming ? "Завершить" : "Выйти"}
            </button>
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

  return (
    <>
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
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-white font-golos font-bold text-2xl">Live</h2>
            <p className="text-white/40 text-xs mt-0.5">{streams.length > 0 ? `${streams.length} трансляций` : "Прямые эфиры"}</p>
          </div>
          <button onClick={() => setShowStart(true)} className="btn-grad px-4 py-2 text-sm flex items-center gap-2">
            <Icon name="Video" size={15} className="text-white" />Начать
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && streams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-5xl">📡</div>
              <p className="text-white/50 text-sm text-center">Нет активных трансляций.<br />Начни первым!</p>
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
      </div>
    </>
  );
}
