import { RefObject } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  input: string;
  recording: boolean;
  recordSecs: number;
  showPlus: boolean;
  showEmoji: boolean;
  geoLoading: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  fileRef: RefObject<HTMLInputElement | null>;
  cameraRef: RefObject<HTMLInputElement | null>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onStopRecording: (cancel: boolean) => void;
  onTogglePlus: () => void;
  onToggleEmoji: () => void;
  onEmojiPick: (em: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenVanishPicker: () => void;
  onSendLocation: () => void;
  onOpenVideoCall: () => void;
  onOpenAwardPicker: () => void;
  onOpenVideoCircle: () => void;
}

export function ChatInputBar({
  input, recording, recordSecs, showPlus, showEmoji, geoLoading,
  inputRef, fileRef, cameraRef,
  onInputChange, onSend, onStartRecording, onStopRecording,
  onTogglePlus, onToggleEmoji, onEmojiPick,
  onFileSelect, onOpenVanishPicker, onSendLocation, onOpenVideoCall, onOpenAwardPicker, onOpenVideoCircle,
}: Props) {
  return (
    <>
      {showPlus && (
        <div className="px-4 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="grid grid-cols-4 gap-2 pt-3 pb-1">
            {[
              { icon: "Image", label: "Галерея", action: () => { fileRef.current?.click(); onTogglePlus(); } },
              { icon: "Timer", label: "Исчезающее", action: onOpenVanishPicker },
              { icon: "MapPin", label: "Локация", action: onSendLocation, loading: geoLoading },
              { icon: "Circle", label: "Кружок", action: onOpenVideoCircle },
            ].map(({ icon, label, action, loading }) => (
              <button key={label} onClick={action} disabled={loading}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.2))" }}>
                  {loading
                    ? <Icon name="Loader2" size={20} className="animate-spin" style={{ color: "#FF2D78" }} />
                    : <Icon name={icon} size={20} style={{ color: "#FF2D78" }} />}
                </div>
                <span className="text-white/60 text-[11px]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileSelect} />

      {showEmoji && (
        <div className="px-3 pb-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            ["😍","🥰","❤️","🔥","😘","💋","🫦","💕"],
            ["😂","🤣","😭","🥺","😅","🙈","😏","🤤"],
            ["👋","🤙","💪","🙏","👅","💦","🥵","🫠"],
            ["🎉","🏆","💎","🌹","🍓","🦋","✨","💯"],
          ].map((row, i) => (
            <div key={i} className="flex justify-between mb-1">
              {row.map(em => (
                <button key={em} onClick={() => onEmojiPick(em)}
                  className="text-2xl w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-75 hover:bg-white/10">
                  {em}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3 flex items-center gap-2"
        style={{ borderTop: (showPlus || showEmoji) ? "none" : "1px solid rgba(255,255,255,0.08)" }}>

        {recording ? (
          <>
            <button onClick={() => onStopRecording(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
              <Icon name="Trash2" size={18} className="text-white/60" />
            </button>
            <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5"
              style={{ background: "rgba(255,45,120,0.12)", border: "1.5px solid rgba(255,45,120,0.35)" }}>
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              <span className="text-white/80 text-sm font-mono">
                {String(Math.floor(recordSecs / 60)).padStart(2, "0")}:{String(recordSecs % 60).padStart(2, "0")}
              </span>
              <span className="text-white/40 text-xs flex-1">Идёт запись...</span>
            </div>
            <button onClick={() => onStopRecording(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              <Icon name="Send" size={16} className="text-white" />
            </button>
          </>
        ) : (
          <>
            <button onClick={onTogglePlus}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
              style={{
                background: showPlus ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.1)",
                border: "1.5px solid rgba(255,255,255,0.15)"
              }}>
              <Icon name={showPlus ? "X" : "Plus"} size={18} className="text-white" />
            </button>
            <input ref={inputRef} value={input} onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              onFocus={() => { if (showPlus) onTogglePlus(); if (showEmoji) onToggleEmoji(); }}
              placeholder="Написать..."
              className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
            <button onClick={onToggleEmoji}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 text-xl"
              style={{ background: showEmoji ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
              {showEmoji ? <Icon name="X" size={16} className="text-white" /> : "😊"}
            </button>
            {input.trim() ? (
              <button onClick={onSend} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0 active:scale-90 transition-all">
                <Icon name="Send" size={16} className="text-white" />
              </button>
            ) : (
              <button onClick={onStartRecording}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
                <Icon name="Mic" size={18} className="text-white/80" />
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default ChatInputBar;