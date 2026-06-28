import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { type LiveStream, type LiveMessage } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

const HEART_KEYFRAMES = `
@keyframes heartFloat {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  60%  { transform: translateY(-120px) scale(1.2) rotate(-8deg); opacity: 0.8; }
  100% { transform: translateY(-200px) scale(0.6) rotate(12deg); opacity: 0; }
}
@keyframes heartPop {
  0%   { transform: scale(0.5); opacity: 0; }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes livePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
  50%     { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
}
`;

interface LiveActiveStreamProps {
  activeStream: LiveStream;
  isStreaming: boolean;
  leaving: boolean;
  facingMode: "user" | "environment";
  micMuted: boolean;
  switchingCamera: boolean;
  heartsAnim: number[];
  chatMsgs: LiveMessage[];
  chatInput: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamRef: React.RefObject<MediaStream | null>;
  onLeave: () => void;
  onToggleMic: () => void;
  onFlipCamera: () => void;
  onHeart: () => void;
  onSendChat: () => void;
  onChatInputChange: (val: string) => void;
}

export function LiveActiveStream({
  activeStream,
  isStreaming,
  leaving,
  facingMode,
  micMuted,
  switchingCamera,
  heartsAnim,
  chatMsgs,
  chatInput,
  videoRef,
  streamRef,
  onLeave,
  onToggleMic,
  onFlipCamera,
  onHeart,
  onSendChat,
  onChatInputChange,
}: LiveActiveStreamProps) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [viewerMuted, setViewerMuted] = useState(true);
  const [connectTimeout, setConnectTimeout] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const tapToPlay = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    setViewerMuted(false);
    el.play().catch(() => {});
  };

  useEffect(() => {
    setVideoPlaying(false);
    setViewerMuted(true);
    setConnectTimeout(false);
  }, [activeStream.id]);

  useEffect(() => {
    if (!isStreaming) {
      const t = setTimeout(() => setConnectTimeout(true), 30000);
      return () => clearTimeout(t);
    }
  }, [isStreaming, activeStream.id]);

  // Авто-скролл чата вниз
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  return (
    <div className="fixed inset-0 z-50"
      style={{
        background: "#000",
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(0.96)" : "scale(1)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}>
      <style>{HEART_KEYFRAMES}</style>

      {/* ── Видео на весь экран ── */}
      <video
        ref={(el) => {
          (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
          if (el && isStreaming && streamRef.current && !el.srcObject) {
            el.srcObject = streamRef.current;
            el.play().catch(() => {});
          }
        }}
        autoPlay
        muted={isStreaming ? true : viewerMuted}
        playsInline
        onPlaying={() => setVideoPlaying(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: isStreaming && facingMode === "user" ? "scaleX(-1)" : "none",
          transition: "transform 0.3s",
        }}
      />

      {/* Плейсхолдер пока видео не идёт (только зритель) */}
      {!isStreaming && !videoPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ background: "linear-gradient(160deg,#1a0030,#2d0050,#1a0030)" }}>
          <div className="relative">
            <img src={activeStream.author_photo || FALLBACK_PHOTO}
              className="w-28 h-28 rounded-full object-cover"
              style={{ border: "3px solid #FF2D78", boxShadow: "0 0 0 8px rgba(255,45,120,0.15)" }} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1"
              style={{ animation: "livePulse 2s infinite" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">{activeStream.author_name}</p>
            <p className="text-white/50 text-sm mt-1">{activeStream.title}</p>
          </div>
          {connectTimeout ? (
            <p className="text-white/40 text-xs text-center px-8">Не удалось подключиться.<br/>Трансляция могла завершиться.</p>
          ) : (
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <div className="w-3 h-3 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
              Подключение...
            </div>
          )}
        </div>
      )}

      {/* ── Верхняя панель ── */}
      <div className="absolute top-0 left-0 right-0 z-20"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)", paddingTop: "env(safe-area-inset-top, 12px)" }}>
        <div className="flex items-center justify-between px-4 pt-3 pb-6">

          {/* Левая часть: аватар + имя + LIVE + счётчик */}
          <div className="flex items-center gap-2.5">
            <img src={activeStream.author_photo || FALLBACK_PHOTO}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid #FF2D78" }} />
            <div>
              <p className="text-white font-bold text-sm leading-tight">{activeStream.author_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wide"
                  style={{ animation: "livePulse 2s infinite" }}>LIVE</span>
                <div className="flex items-center gap-0.5">
                  <Icon name="Eye" size={10} className="text-white/60" />
                  <span className="text-white/70 text-[11px] font-semibold">{activeStream.viewers_count?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Правая часть: управление */}
          <div className="flex items-center gap-2">
            {isStreaming && (
              <>
                <button onClick={onToggleMic}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{ background: micMuted ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Icon name={micMuted ? "MicOff" : "Mic"} size={16} className="text-white" />
                </button>
                <button onClick={onFlipCamera} disabled={switchingCamera}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", opacity: switchingCamera ? 0.5 : 1 }}>
                  <Icon name="RefreshCw" size={16} className="text-white"
                    style={{ transform: switchingCamera ? "rotate(180deg)" : "none", transition: "transform 0.4s" }} />
                </button>
              </>
            )}
            <button onClick={onLeave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-90"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <Icon name="X" size={14} className="text-white" />
              <span className="text-white text-xs font-semibold">{isStreaming ? "Завершить" : "Выйти"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Кнопка звука для зрителя */}
      {!isStreaming && videoPlaying && viewerMuted && (
        <button onClick={tapToPlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white text-sm active:scale-95 transition-all"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <Icon name="VolumeX" size={16} />
          Нажми для звука
        </button>
      )}

      {/* ── Нижняя зона: градиент + чат + ввод ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col justify-end"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>

        {/* Чат */}
        <div className="px-3 pt-4 pb-2 flex flex-col gap-1.5 max-h-52 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {chatMsgs.slice(-20).map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <img src={m.author_photo || FALLBACK_PHOTO}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }} />
              <div className="px-2.5 py-1.5 rounded-2xl max-w-[85%]"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
                <span className="text-pink-400 text-xs font-bold">{m.author_name} </span>
                <span className="text-white/90 text-xs">{m.text}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Поле ввода */}
        <div className="flex items-center gap-2 px-3 pb-4 pt-1">
          <input value={chatInput} onChange={e => onChatInputChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSendChat()}
            placeholder="Написать сообщение..."
            className="flex-1 text-white placeholder-white/40 text-sm outline-none rounded-full px-4 py-2.5 font-golos"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }} />

          {/* Кнопка сердечка */}
          <button onClick={onHeart}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{
              background: "linear-gradient(135deg,#FF2D78,#c0255e)",
              boxShadow: "0 4px 16px rgba(255,45,120,0.5)",
              animation: "heartPop 0.3s ease",
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Летящие сердечки ── */}
      {heartsAnim.map((id, i) => (
        <div key={id} className="absolute pointer-events-none z-30"
          style={{
            bottom: 80,
            right: 20 + (id % 4) * 18,
            animation: "heartFloat 1.8s ease-out forwards",
            animationDelay: `${(i % 3) * 0.12}s`,
          }}>
          <svg width={18 + (id % 3) * 6} height={18 + (id % 3) * 6} viewBox="0 0 24 24"
            fill={["#FF2D78","#ff6b9d","#ff4d8a"][id % 3]}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      ))}
    </div>
  );
}
