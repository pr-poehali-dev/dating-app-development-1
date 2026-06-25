import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { type LiveStream, type LiveMessage } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

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

  const tapToPlay = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    setViewerMuted(false);
    el.play().catch(() => {});
  };

  // Если через 12 секунд видео не пошло — прячем спиннер
  useEffect(() => {
    if (!isStreaming) {
      const t = setTimeout(() => setConnectTimeout(true), 12000);
      return () => clearTimeout(t);
    }
  }, [isStreaming]);

  return (
    <div className="flex flex-col h-full relative"
      style={{ background: "#0a0014", opacity: leaving ? 0 : 1, transform: leaving ? "scale(0.97)" : "scale(1)", transition: "opacity 0.35s ease, transform 0.35s ease" }}>
      <div className="relative flex-shrink-0" style={{ height: "68%" }}>
        <div className="w-full h-full flex items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg,#1a0030,#2d0050)" }}>
          {/* Видео всегда рендерится — стример видит себя, зритель получает поток через WebRTC */}
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
            className="w-full h-full object-cover"
            style={{
              transform: isStreaming && facingMode === "user" ? "scaleX(-1)" : "none",
              transition: "transform 0.3s",
              display: "block",
            }}
          />

          {/* Кнопка включения звука для зрителя */}
          {!isStreaming && videoPlaying && viewerMuted && (
            <button onClick={tapToPlay}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold active:scale-95 transition-all"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Icon name="VolumeX" size={14} className="text-white" />
              Нажми для звука
            </button>
          )}
          {/* Плейсхолдер — пока видео не заиграло у зрителя */}
          {!isStreaming && !videoPlaying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
              style={{ background: "linear-gradient(135deg,#1a0030,#2d0050)", pointerEvents: "none" }}
              id="viewer-placeholder">
              <div className="relative">
                <img src={activeStream.author_photo || FALLBACK_PHOTO}
                  className="w-24 h-24 rounded-full object-cover"
                  style={{ border: "3px solid #FF2D78", boxShadow: "0 0 0 6px rgba(255,45,120,0.2)" }} />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-lg">{activeStream.author_name}</p>
                <p className="text-white/50 text-sm mt-0.5">{activeStream.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <Icon name="Eye" size={13} className="text-white/60" />
                  <span className="text-white/80 text-xs font-semibold">{activeStream.viewers_count}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <span className="text-sm">❤️</span>
                  <span className="text-white/80 text-xs font-semibold">{activeStream.hearts_count}</span>
                </div>
              </div>
              {connectTimeout ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-white/40 text-xs text-center">Не удалось получить видео.<br />Возможно, трансляция завершилась.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/30 text-xs">
                  <div className="w-3 h-3 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                  Подключение к трансляции...
                </div>
              )}
            </div>
          )}
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
              <>
                <button onClick={onToggleMic}
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: micMuted ? "rgba(239,68,68,0.85)" : "rgba(255,255,255,0.15)", transition: "background 0.2s" }}>
                  <Icon name={micMuted ? "MicOff" : "Mic"} size={14} className="text-white" />
                </button>
                <button onClick={onFlipCamera} disabled={switchingCamera}
                  className="glass-card w-8 h-8 flex items-center justify-center"
                  style={{ opacity: switchingCamera ? 0.5 : 1, transition: "opacity 0.2s" }}>
                  <Icon name="RefreshCw" size={14} className="text-white/80"
                    style={{ transform: switchingCamera ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.4s ease" }} />
                </button>
              </>
            )}
            <button onClick={onLeave}
              className="glass-card px-3 py-1.5 text-white/70 text-xs flex items-center gap-1.5">
              <Icon name="X" size={13} />{isStreaming ? "Завершить" : "Выйти"}
            </button>
          </div>
        </div>

        <div className="absolute bottom-3 left-4">
          <p className="text-white font-semibold text-sm">{activeStream.title}</p>
        </div>

        {heartsAnim.map((id, i) => (
          <div key={id}
            className="absolute pointer-events-none text-2xl"
            style={{
              bottom: 60 + (i % 3) * 20,
              right: 16 + (id % 5) * 14,
              animation: "heartFloat 1.5s ease-out forwards",
            }}>❤️</div>
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
        <button onClick={onHeart}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,45,120,0.2)", border: "1px solid rgba(255,45,120,0.4)" }}>
          <span className="text-lg">❤️</span>
        </button>
        <input value={chatInput} onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSendChat()}
          placeholder="Написать в чат..."
          className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
        <button onClick={onSendChat}
          className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
          <Icon name="Send" size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}