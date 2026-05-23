import Icon from "@/components/ui/icon";
import { type Message } from "@/lib/api";

// ─── Контекстное меню сообщения ───────────────────────────────────────────────
interface ContextMenuProps {
  msg: Message;
  onDelete: (msg: Message) => void;
  onClose: () => void;
}

export function ChatContextMenu({ msg, onDelete, onClose }: ContextMenuProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-white/40 text-xs mb-1.5">Сообщение</p>
          <p className="text-white/80 text-sm line-clamp-3">{msg.text}</p>
        </div>
        <button
          onClick={() => onDelete(msg)}
          className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,45,78,0.15)" }}>
            <Icon name="Trash2" size={18} style={{ color: "#FF2D4E" }} />
          </div>
          <div>
            <p className="text-red-400 font-semibold text-sm">Удалить сообщение</p>
            <p className="text-white/30 text-xs">Удалится у обоих участников</p>
          </div>
        </button>
        <button
          onClick={() => { navigator.clipboard?.writeText(msg.text); onClose(); }}
          className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="Copy" size={18} className="text-white/60" />
          </div>
          <p className="text-white/80 font-semibold text-sm">Скопировать текст</p>
        </button>
        <div className="px-5 pb-6 pt-1">
          <button onClick={onClose}
            className="w-full glass-card py-3 text-white/50 text-sm font-medium">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Пикер исчезающих фото ────────────────────────────────────────────────────
interface VanishPickerProps {
  photos: { id: number; photo_url: string }[];
  onPick: (url: string) => void;
  onClose: () => void;
}

export function ChatVanishPicker({ photos, onPick, onClose }: VanishPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up pb-6 px-4"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between py-4">
          <p className="text-white font-semibold">Выбери исчезающее фото</p>
          <button onClick={onClose}>
            <Icon name="X" size={20} className="text-white/50" />
          </button>
        </div>
        {photos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Icon name="Image" size={32} className="text-white/20" />
            <p className="text-white/40 text-sm text-center">В галерее нет фото. Добавь фото в профиле.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 pb-2">
            {photos.map(p => (
              <button key={p.id} onClick={() => onPick(p.photo_url)}
                className="aspect-square rounded-xl overflow-hidden active:scale-95 transition-all">
                <img src={p.photo_url} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Меню чата (предоставить / запросить доступ к фото) ───────────────────────
interface ChatMenuProps {
  onGrantPhoto: () => void;
  onRequestPhoto: () => void;
  onClose: () => void;
}

export function ChatMenu({ onGrantPhoto, onRequestPhoto, onClose }: ChatMenuProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm pb-8 px-4"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between py-4">
          <p className="text-white font-semibold text-base">Действия</p>
          <button onClick={onClose}>
            <Icon name="X" size={20} className="text-white/50" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onGrantPhoto}
            className="flex items-center gap-4 px-4 py-4 rounded-2xl w-full text-left transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(100,200,100,0.15)" }}>
              <Icon name="ImagePlus" size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Предоставить доступ к фото</p>
              <p className="text-white/40 text-xs mt-0.5">Открыть свои приватные фото для этого пользователя</p>
            </div>
          </button>
          <button
            onClick={onRequestPhoto}
            className="flex items-center gap-4 px-4 py-4 rounded-2xl w-full text-left transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.15)" }}>
              <Icon name="Lock" size={20} className="text-pink-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Запросить доступ к приватным фото</p>
              <p className="text-white/40 text-xs mt-0.5">Отправить запрос на просмотр приватного альбома</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Пикер наград ─────────────────────────────────────────────────────────────
interface AwardPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export function ChatAwardPicker({ onPick, onClose }: AwardPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up pb-6 px-4"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between py-4">
          <p className="text-white font-semibold">Вручить награду</p>
          <button onClick={onClose}>
            <Icon name="X" size={20} className="text-white/50" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 pb-2">
          {["🏆","🥇","🎖️","👑","💎","🌟","🔥","💝","🦋","🌹","🎁","✨"].map(emoji => (
            <button key={emoji} onClick={() => onPick(emoji)}
              className="aspect-square rounded-2xl flex items-center justify-center text-3xl active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
