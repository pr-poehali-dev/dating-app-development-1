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

  const plusItems = [
    { icon: "Image",  label: "Галерея",    action: () => { fileRef.current?.click(); onTogglePlus(); }, color: "#3B82F6" },
    { icon: "Timer",  label: "Исчезает",   action: onOpenVanishPicker,                                   color: "#9B59B6" },
    { icon: "MapPin", label: "Локация",    action: onSendLocation, loading: geoLoading,                  color: "#10B981" },
    { icon: "Circle", label: "Кружок",     action: onOpenVideoCircle,                                    color: "#FF6B35" },
  ] as const;

  return (
    <>
      {/* Плюс-меню */}
      {showPlus && (
        <div className="px-3 pb-3 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,10,26,0.6)" }}>
          <div className="grid grid-cols-4 gap-2">
            {plusItems.map(({ icon, label, action, color, ...rest }) => {
              const loading = 'loading' in rest ? rest.loading : false;
              return (
                <button key={label} onClick={action} disabled={loading}
                  className="flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${color}22` }}>
                    {loading
                      ? <Icon name="Loader2" size={19} className="animate-spin" style={{ color }} />
                      : <Icon name={icon} size={19} style={{ color }} />}
                  </div>
                  <span className="text-white/55 text-[11px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileSelect} />

      {/* Эмодзи-панель */}
      {showEmoji && (
        <div className="px-3 pb-3 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,10,26,0.6)" }}>
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

      {/* Строка ввода */}
      <div className="px-3 py-3 flex items-center gap-2"
        style={{ borderTop: (showPlus || showEmoji) ? "none" : "1px solid rgba(255,255,255,0.07)" }}>

        {recording ? (
          /* Режим записи голоса */
          <>
            <button onClick={() => onStopRecording(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Icon name="Trash2" size={17} className="text-white/55" />
            </button>
            <div className="flex-1 flex items-center gap-2.5 rounded-full px-4 py-2.5"
              style={{ background: "rgba(255,45,120,0.1)", border: "1.5px solid rgba(255,45,120,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              <span className="text-white/90 text-sm font-mono font-semibold">
                {String(Math.floor(recordSecs / 60)).padStart(2, "0")}:{String(recordSecs % 60).padStart(2, "0")}
              </span>
              <span className="text-white/40 text-xs flex-1">Идёт запись...</span>
            </div>
            <button onClick={() => onStopRecording(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }}>
              <Icon name="Send" size={15} className="text-white" />
            </button>
          </>
        ) : (
          /* Обычный режим */
          <>
            {/* Плюс */}
            <button onClick={onTogglePlus}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
              style={showPlus
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 8px rgba(255,45,120,0.4)" }
                : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Icon name={showPlus ? "X" : "Plus"} size={18} className="text-white" />
            </button>

            {/* Поле ввода */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                onFocus={() => { if (showPlus) onTogglePlus(); if (showEmoji) onToggleEmoji(); }}
                placeholder="Написать..."
                className="w-full text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border transition-colors font-golos pr-10"
                style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>

            {/* Эмодзи */}
            <button onClick={onToggleEmoji}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 text-xl"
              style={showEmoji
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 8px rgba(255,45,120,0.4)" }
                : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              {showEmoji ? <Icon name="X" size={16} className="text-white" /> : "😊"}
            </button>

            {/* Отправить / Микрофон */}
            {input.trim() ? (
              <button onClick={onSend}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }}>
                <Icon name="Send" size={15} className="text-white" />
              </button>
            ) : (
              <button onClick={onStartRecording}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <Icon name="Mic" size={17} className="text-white/70" />
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default ChatInputBar;
