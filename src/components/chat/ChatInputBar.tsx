import { RefObject, useState } from "react";
import Icon from "@/components/ui/icon";

const ANIME_STICKERS = [
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/67b035e6-7f16-4d34-9d88-ab0ed2e18b43.jpg", label: "Любовь" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a7091a63-e89b-4f2b-bbec-891f462322f8.jpg", label: "Смущение" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/9e5ae811-669b-49ee-837a-9e6bc293bc18.jpg", label: "Радость" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4b23033d-7bdd-4f95-8eff-917be9a87a01.jpg", label: "Злость" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/975d66a4-d787-4915-b2d5-7444020b1339.jpg", label: "Круто" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/e82df3f1-2efc-47ff-9996-5c2338b77655.jpg", label: "Сонный" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ff7ea746-566e-403e-b50a-82103b7920f2.jpg", label: "Восторг" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/82cfc3f0-6d3b-4304-975c-bad64f3a8249.jpg", label: "Грусть" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/9d36609f-b83e-40cd-a0d3-540b68150758.jpg", label: "Флирт" },
  { url: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/76c8840e-f484-426e-b7db-69c2877a5b97.jpg", label: "Вместе" },
];

interface Props {
  input: string;
  recording: boolean;
  recordSecs: number;
  showPlus: boolean;
  showEmoji: boolean;
  showStickers: boolean;
  geoLoading: boolean;
  inputRef: RefObject<HTMLInputElement>;
  fileRef: RefObject<HTMLInputElement>;
  cameraRef: RefObject<HTMLInputElement>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onStopRecording: (cancel: boolean) => void;
  onTogglePlus: () => void;
  onToggleEmoji: () => void;
  onToggleStickers: () => void;
  onEmojiPick: (em: string) => void;
  onSendSticker: (url: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenVanishPicker: () => void;
  onSendLocation: () => void;
  onOpenVideoCall: () => void;
  onOpenAwardPicker: () => void;
  onOpenVideoCircle: () => void;
}

export function ChatInputBar({
  input, recording, recordSecs, showPlus, showEmoji, showStickers, geoLoading,
  inputRef, fileRef, cameraRef,
  onInputChange, onSend, onStartRecording, onStopRecording,
  onTogglePlus, onToggleEmoji, onToggleStickers, onEmojiPick, onSendSticker,
  onFileSelect, onOpenVanishPicker, onSendLocation, onOpenVideoCall, onOpenAwardPicker, onOpenVideoCircle,
}: Props) {

  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // Кнопки «Видеозвонок» и «Награда» скрыты из меню «+» по требованию.
  void onOpenVideoCall;
  void onOpenAwardPicker;

  const plusItems = [
    { icon: "Image",  label: "Галерея",    action: () => { setShowPhotoMenu(true); setTimeout(onTogglePlus, 300); }, color: "#3B82F6" },
    { icon: "Timer",  label: "Исчезает",   action: onOpenVanishPicker,                                   color: "#9B59B6" },
    { icon: "MapPin", label: "Локация",    action: onSendLocation, loading: geoLoading,                  color: "#10B981" },
    { icon: "Circle", label: "Кружок",     action: onOpenVideoCircle,                                    color: "#FF6B35" },
  ] as const;

  return (
    <>
      {/* Меню выбора фото (вместо системного диалога) */}
      {showPhotoMenu && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowPhotoMenu(false)}>
          <div className="w-full px-4 pb-8 pt-2" onClick={e => e.stopPropagation()}>
            <div className="rounded-2xl overflow-hidden mb-3"
              style={{ background: "rgba(30,20,45,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
              <p className="text-white/40 text-xs text-center py-3 border-b border-white/5 font-medium uppercase tracking-widest">
                Добавить фото
              </p>
              <button
                className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/5 transition-colors border-b border-white/5"
                onClick={() => { setShowPhotoMenu(false); cameraRef.current?.click(); }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,45,120,0.15)" }}>
                  <Icon name="Camera" size={18} className="text-pink-400" />
                </div>
                <span className="text-white text-base font-medium">Сделать фото</span>
              </button>
              <button
                className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/5 transition-colors"
                onClick={() => { setShowPhotoMenu(false); fileRef.current?.click(); }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(59,130,246,0.15)" }}>
                  <Icon name="Image" size={18} className="text-blue-400" />
                </div>
                <span className="text-white text-base font-medium">Выбрать из галереи</span>
              </button>
            </div>
            <button
              className="w-full py-4 rounded-2xl text-white font-semibold text-base active:opacity-70 transition-opacity"
              style={{ background: "rgba(30,20,45,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={() => setShowPhotoMenu(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}

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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", zIndex: -1, left: 0, bottom: 0 }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileSelect}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", zIndex: -1, left: 0, bottom: 0 }}
      />

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

      {/* Аниме-стикеры */}
      {showStickers && (
        <div className="pb-3 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,10,26,0.6)" }}>
          {/* Заголовок */}
          <div className="flex items-center gap-2 px-4 mb-3">
            <span className="text-base">🎌</span>
            <span className="text-white/60 text-xs font-semibold tracking-wide uppercase">Аниме-стикеры</span>
          </div>
          {/* Сетка стикеров */}
          <div className="grid grid-cols-5 gap-2 px-3">
            {ANIME_STICKERS.map((s) => (
              <button
                key={s.url}
                onClick={() => { onSendSticker(s.url); }}
                className="flex flex-col items-center gap-1 rounded-2xl p-1.5 active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src={s.url} alt={s.label}
                  className="w-12 h-12 object-contain rounded-xl" />
                <span className="text-white/35 text-[9px] font-medium leading-tight text-center">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Строка ввода */}
      <div className="px-3 py-2.5"
        style={{ borderTop: (showPlus || showEmoji) ? "none" : "1px solid rgba(255,255,255,0.06)" }}>

        {recording ? (
          /* Режим записи голоса */
          <div className="flex items-center gap-2">
            <button onClick={() => onStopRecording(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>
              <Icon name="Trash2" size={17} className="text-white/55" />
            </button>
            <div className="flex-1 flex items-center gap-2.5 rounded-full px-4 py-3"
              style={{ background: "rgba(0,0,0,0.35)", border: "1.5px solid rgba(255,255,255,0.14)" }}>
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              <span className="text-white/90 text-sm font-mono font-semibold">
                {String(Math.floor(recordSecs / 60)).padStart(2, "0")}:{String(recordSecs % 60).padStart(2, "0")}
              </span>
              <span className="text-white/40 text-xs flex-1">Идёт запись...</span>
            </div>
            <button onClick={() => onStopRecording(false)}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
              style={{ background: "linear-gradient(135deg,#FF6A3D,#FF2D78)", boxShadow: "0 2px 10px rgba(255,60,90,0.4)" }}>
              <Icon name="Send" size={16} className="text-white" />
            </button>
          </div>
        ) : (
          /* Обычный режим — единая капсула, как в референсе */
          <div className="flex items-center gap-2.5 rounded-full pl-1.5 pr-1.5 py-1.5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}>

            {/* Плюс */}
            <button onClick={onTogglePlus}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
              style={{ color: "rgba(255,255,255,0.6)" }}>
              <Icon name={showPlus ? "X" : "Plus"} size={22} />
            </button>

            {/* Стикеры (иконка чата с молнией) */}
            <button onClick={onToggleStickers}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 text-lg"
              style={showStickers ? { color: "#FF6B35" } : {}}>
              {showStickers ? <Icon name="X" size={18} className="text-white/60" /> : "🎌"}
            </button>

            {/* Поле ввода */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              onFocus={() => { if (showPlus) onTogglePlus(); if (showEmoji) onToggleEmoji(); }}
              placeholder="Напиши сообщение..."
              className="flex-1 min-w-0 bg-transparent text-white placeholder-white/35 outline-none text-[15px] font-golos"
            />

            {/* Отправить / Микрофон */}
            {input.trim() ? (
              <button onClick={onSend}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                style={{ background: "linear-gradient(135deg,#FF6A3D,#FF2D78)", boxShadow: "0 2px 10px rgba(255,60,90,0.4)" }}>
                <Icon name="Send" size={15} className="text-white" />
              </button>
            ) : (
              <button onClick={onStartRecording}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                style={{ color: "rgba(255,255,255,0.6)" }}>
                <Icon name="Mic" size={20} />
              </button>
            )}

            {/* Эмодзи */}
            <button onClick={onToggleEmoji}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
              style={showEmoji ? { color: "#FF2D78" } : { color: "rgba(255,255,255,0.6)" }}>
              {showEmoji ? <Icon name="X" size={18} /> : <Icon name="Smile" size={20} />}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default ChatInputBar;