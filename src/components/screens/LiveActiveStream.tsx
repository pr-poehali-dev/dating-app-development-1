import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { type LiveStream, type LiveMessage } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

const HEART_KEYFRAMES = `
@keyframes hf0 {
  0%   { transform: translateY(0)   translateX(0)    scale(0.4) rotate(0deg);   opacity:0; }
  8%   { transform: translateY(-16px) translateX(4px)  scale(1.25) rotate(-6deg); opacity:1; }
  40%  { transform: translateY(-100px) translateX(-14px) scale(1.05) rotate(8deg);  opacity:0.9; }
  75%  { transform: translateY(-190px) translateX(10px)  scale(0.85) rotate(-12deg); opacity:0.5; }
  100% { transform: translateY(-260px) translateX(-6px)  scale(0.4) rotate(5deg);  opacity:0; }
}
@keyframes hf1 {
  0%   { transform: translateY(0)   translateX(0)    scale(0.3) rotate(0deg);   opacity:0; }
  8%   { transform: translateY(-12px) translateX(-8px) scale(1.3) rotate(10deg);  opacity:1; }
  45%  { transform: translateY(-110px) translateX(18px) scale(1.0) rotate(-8deg);  opacity:0.85; }
  80%  { transform: translateY(-200px) translateX(-12px) scale(0.7) rotate(15deg); opacity:0.4; }
  100% { transform: translateY(-270px) translateX(8px)   scale(0.3) rotate(-5deg); opacity:0; }
}
@keyframes hf2 {
  0%   { transform: translateY(0)   translateX(0)    scale(0.5) rotate(0deg);   opacity:0; }
  10%  { transform: translateY(-20px) translateX(12px) scale(1.2) rotate(-14deg); opacity:1; }
  50%  { transform: translateY(-130px) translateX(-8px) scale(0.95) rotate(6deg);  opacity:0.8; }
  85%  { transform: translateY(-210px) translateX(16px) scale(0.65) rotate(-10deg); opacity:0.35; }
  100% { transform: translateY(-280px) translateX(-4px) scale(0.3) rotate(8deg);   opacity:0; }
}
@keyframes hf3 {
  0%   { transform: translateY(0)   translateX(0)    scale(0.35) rotate(0deg);  opacity:0; }
  9%   { transform: translateY(-14px) translateX(-6px) scale(1.35) rotate(8deg); opacity:1; }
  42%  { transform: translateY(-105px) translateX(14px) scale(1.05) rotate(-9deg); opacity:0.9; }
  78%  { transform: translateY(-195px) translateX(-10px) scale(0.75) rotate(13deg); opacity:0.45; }
  100% { transform: translateY(-265px) translateX(6px)  scale(0.3) rotate(-6deg); opacity:0; }
}
@keyframes heartBurst {
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,45,120,0.8); }
  30%  { transform: scale(1.35); box-shadow: 0 0 0 12px rgba(255,45,120,0); }
  60%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}
@keyframes heartPop {
  0%   { transform: scale(0.5); opacity: 0; }
  50%  { transform: scale(1.35); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes livePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
  50%     { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
}
@keyframes sparkle {
  0%   { transform: scale(0) rotate(0deg); opacity:1; }
  50%  { transform: scale(1.2) rotate(180deg); opacity:0.8; }
  100% { transform: scale(0) rotate(360deg); opacity:0; }
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
            className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{
              background: "linear-gradient(145deg,#FF2D78,#9B59B6)",
              boxShadow: "0 4px 20px rgba(255,45,120,0.6), 0 0 0 2px rgba(255,45,120,0.2)",
              animation: heartsAnim.length > 0 ? "heartBurst 0.4s ease" : undefined,
            }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))" }}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Летящие сердечки ── */}
      {heartsAnim.map((id, i) => {
        const colors   = ["#FF2D78","#ff6b9d","#ff4d8a","#ff1493","#c0255e","#ff85b3","#9B59B6","#ff2d78"];
        const sizes    = [20, 26, 18, 30, 22, 16, 28, 24];
        const col      = colors[id % colors.length];
        const sz       = sizes[id % sizes.length];
        const anim     = `hf${id % 4}`;
        const dur      = 1.6 + (id % 5) * 0.18;
        const delay    = (i % 6) * 0.08;
        const rightPos = 14 + (id % 5) * 16;
        // Блёстки вокруг сердечка
        const sparkles = [
          { dx: -14, dy: -10, rot: 15 },
          { dx:  12, dy: -14, rot: -20 },
          { dx:  16, dy:   8, rot: 45 },
          { dx:  -8, dy:  12, rot: -35 },
        ];
        return (
          <div key={id} className="absolute pointer-events-none z-30"
            style={{ bottom: 90, right: rightPos, animation: `${anim} ${dur}s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s forwards` }}>
            {/* Блёстки */}
            {id % 3 === 0 && sparkles.map((sp, si) => (
              <div key={si} className="absolute"
                style={{
                  width: 5, height: 5,
                  left: `calc(50% + ${sp.dx}px)`,
                  top: `calc(50% + ${sp.dy}px)`,
                  background: col,
                  borderRadius: "50%",
                  animation: `sparkle ${0.5 + si * 0.08}s ease-out ${delay + 0.05}s forwards`,
                  boxShadow: `0 0 4px ${col}`,
                }} />
            ))}
            {/* Сердечко */}
            <div style={{ filter: `drop-shadow(0 0 6px ${col}cc)` }}>
              <svg width={sz} height={sz} viewBox="0 0 24 24" fill={col}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}