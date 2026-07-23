import Icon from "@/components/ui/icon";
import { STICKER_PACKS, useStickerSettings } from "@/lib/stickers";

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

export function StickersSettingsScreen() {
  const { settings, update, togglePack } = useStickerSettings();

  const totalStickers = STICKER_PACKS.reduce((n, p) => n + p.stickers.length, 0);
  const enabledCount = STICKER_PACKS.filter(p => settings.enabledPacks.includes(p.id)).length;

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      {/* Верхние сводные карточки */}
      <div className="px-4 pt-1">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,106,61,0.15)" }}>
              <Icon name="Sticker" size={18} className="text-orange-400" />
            </div>
            <span className="text-white text-[15px] font-medium flex-1">Все стикеры</span>
            <span className="text-pink-400 font-semibold text-[15px]">{totalStickers}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.15)" }}>
              <Icon name="Smile" size={18} className="text-blue-400" />
            </div>
            <span className="text-white text-[15px] font-medium flex-1">Эмодзи</span>
            <span className="text-pink-400 font-semibold text-[15px]">32</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.15)" }}>
              <Icon name="Heart" size={18} className="text-pink-400" style={{ fill: "currentColor" }} />
            </div>
            <span className="text-white text-[15px] font-medium flex-1">Быстрая реакция</span>
            <span className="text-2xl leading-none">❤️</span>
          </div>
        </div>
      </div>

      {/* Настройки */}
      <div className="px-4 pt-6">
        <p className="text-pink-400 font-semibold text-sm px-1 mb-2.5">Настройки</p>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
                  className="w-11 h-11 rounded-xl object-contain flex-shrink-0"
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
    </div>
  );
}

export default StickersSettingsScreen;
