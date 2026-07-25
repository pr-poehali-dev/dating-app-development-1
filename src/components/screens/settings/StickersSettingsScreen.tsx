import { useState } from "react";
import Icon from "@/components/ui/icon";
import { STICKER_PACKS, EMOJI_ROWS, useStickerSettings } from "@/lib/stickers";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-[46px] h-[27px] rounded-full flex-shrink-0 transition-colors relative"
      style={{ background: on ? "linear-gradient(135deg,#FF6A3D,#FF2D78)" : "rgba(255,255,255,0.12)" }}>
      <span className="absolute top-[3px] w-[21px] h-[21px] rounded-full bg-white transition-all"
        style={{ left: on ? "22px" : "3px", boxShadow: "0 1px 4px rgba(0,0,0,0.35)" }} />
    </button>
  );
}

// Эмодзи, доступные для выбора «быстрой реакции»
const QUICK_EMOJIS = ["❤️", "🔥", "😍", "😂", "👍", "🥰", "😮", "😢", "🎉", "💯", "🙏", "👏"];

// ─── Модалка: просмотр всех стикеров ────────────────────────────────────────
function StickersViewer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-h-[85vh] flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white font-bold text-base">Все стикеры</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5" style={{ scrollbarWidth: "none" }}>
          {STICKER_PACKS.map(pack => (
            <div key={pack.id} className="flex flex-col gap-2">
              <p className="text-white/50 text-xs font-semibold">{pack.title} · {pack.stickers.length}</p>
              <div className="grid grid-cols-4 gap-2">
                {pack.stickers.map((s, i) => (
                  <img key={i} src={s.url} alt={s.label}
                    className="w-full rounded-xl object-contain"
                    style={{ aspectRatio: "1/1", background: "rgba(255,255,255,0.05)" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Модалка: просмотр всех эмодзи ──────────────────────────────────────────
function EmojiViewer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-h-[70vh] flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white font-bold text-base">Эмодзи</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 grid grid-cols-8 gap-2 content-start" style={{ scrollbarWidth: "none" }}>
          {EMOJI_ROWS.flat().map((em, i) => (
            <div key={i} className="flex items-center justify-center rounded-xl text-2xl"
              style={{ aspectRatio: "1/1", background: "rgba(255,255,255,0.05)" }}>{em}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Модалка: выбор эмодзи быстрой реакции ──────────────────────────────────
function QuickReactionPicker({ current, onPick, onClose }: { current: string; onPick: (em: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white font-bold text-base">Эмодзи реакции</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>
        <div className="p-4 grid grid-cols-4 gap-2">
          {QUICK_EMOJIS.map(em => (
            <button key={em} onClick={() => { onPick(em); onClose(); }}
              className="flex items-center justify-center rounded-2xl text-3xl transition-all active:scale-90"
              style={{ aspectRatio: "1/1", background: current === em ? "linear-gradient(135deg,rgba(255,45,120,0.3),rgba(155,89,182,0.3))" : "rgba(255,255,255,0.05)", border: current === em ? "1.5px solid #FF2D78" : "1px solid rgba(255,255,255,0.07)" }}>
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StickersSettingsScreen() {
  const { settings, update, togglePack } = useStickerSettings();
  const [view, setView] = useState<"none" | "stickers" | "emoji" | "reaction">("none");

  const totalStickers = STICKER_PACKS.reduce((n, p) => n + p.stickers.length, 0);
  const totalEmoji = EMOJI_ROWS.flat().length;
  const enabledCount = STICKER_PACKS.filter(p => settings.enabledPacks.includes(p.id)).length;

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      {/* Верхние сводные карточки — кликабельные */}
      <div className="px-4 pt-1">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setView("stickers")}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 active:opacity-70 transition-opacity">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,106,61,0.15)" }}>
              <Icon name="Sticker" size={18} className="text-orange-400" />
            </div>
            <span className="text-white text-[15px] font-medium flex-1 text-left">Все стикеры</span>
            <span className="text-pink-400 font-semibold text-[15px]">{totalStickers}</span>
            <Icon name="ChevronRight" size={16} className="text-white/25" />
          </button>
          <button onClick={() => setView("emoji")}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 active:opacity-70 transition-opacity">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.15)" }}>
              <Icon name="Smile" size={18} className="text-blue-400" />
            </div>
            <span className="text-white text-[15px] font-medium flex-1 text-left">Эмодзи</span>
            <span className="text-pink-400 font-semibold text-[15px]">{totalEmoji}</span>
            <Icon name="ChevronRight" size={16} className="text-white/25" />
          </button>
          <button onClick={() => setView("reaction")}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.15)" }}>
              <Icon name="Heart" size={18} className="text-pink-400" style={{ fill: "currentColor" }} />
            </div>
            <span className="text-white text-[15px] font-medium flex-1 text-left">Быстрая реакция</span>
            <span className="text-2xl leading-none">{settings.quickReactionEmoji}</span>
            <Icon name="ChevronRight" size={16} className="text-white/25" />
          </button>
        </div>
        <p className="text-white/35 text-xs leading-snug px-1 mt-2.5">
          Быстрая реакция: дважды коснись сообщения в чате, чтобы поставить {settings.quickReactionEmoji}.
        </p>
      </div>

      {/* Настройки */}
      <div className="px-4 pt-6">
        <p className="text-pink-400 font-semibold text-sm px-1 mb-2.5">Настройки</p>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
            <span className="text-white text-[15px] font-medium flex-1">Двойной тап — реакция</span>
            <Toggle on={settings.quickReaction} onClick={() => update({ quickReaction: !settings.quickReaction })} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
            <span className="text-white text-[15px] font-medium flex-1">Крупные эмодзи</span>
            <Toggle on={settings.largeEmoji} onClick={() => update({ largeEmoji: !settings.largeEmoji })} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-white text-[15px] font-medium flex-1">Сначала недавние</span>
            <Toggle on={settings.recentFirst} onClick={() => update({ recentFirst: !settings.recentFirst })} />
          </div>
        </div>
        <p className="text-white/35 text-xs leading-snug px-1 mt-2.5">
          Автоматически перемещать недавно использованные наборы наверх.
        </p>
      </div>

      {/* Мои наборы стикеров */}
      <div className="px-4 pt-6">
        <p className="text-pink-400 font-semibold text-sm px-1 mb-2.5">
          Мои наборы стикеров <span className="text-white/30 font-normal">· {enabledCount} вкл.</span>
        </p>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {STICKER_PACKS.map((pack, i) => {
            const on = settings.enabledPacks.includes(pack.id);
            return (
              <div key={pack.id}
                className="flex items-center gap-3 px-3.5 py-3"
                style={{ borderBottom: i < STICKER_PACKS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <img src={pack.stickers[0].url} alt={pack.title}
                  className="w-9 h-9 rounded-lg object-contain flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[15px] font-medium leading-tight truncate">{pack.title}</p>
                  <p className="text-white/35 text-xs mt-0.5">{pack.stickers.length} стикеров</p>
                </div>
                <Toggle on={on} onClick={() => togglePack(pack.id)} />
              </div>
            );
          })}
        </div>
      </div>

      {view === "stickers" && <StickersViewer onClose={() => setView("none")} />}
      {view === "emoji" && <EmojiViewer onClose={() => setView("none")} />}
      {view === "reaction" && (
        <QuickReactionPicker
          current={settings.quickReactionEmoji}
          onPick={(em) => update({ quickReactionEmoji: em })}
          onClose={() => setView("none")}
        />
      )}
    </div>
  );
}

export default StickersSettingsScreen;
