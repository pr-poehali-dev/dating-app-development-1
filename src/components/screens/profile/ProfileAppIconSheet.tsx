import Icon from "@/components/ui/icon";
import { useBackHandler } from "@/hooks/backStack";
import { APP_ICON_META, APP_ICON_ORDER, type AppIcon } from "@/hooks/useAppIcon";

interface ProfileAppIconSheetProps {
  appIcon: AppIcon;
  onSelect: (i: AppIcon) => void;
  onClose: () => void;
}

export function ProfileAppIconSheet({ appIcon, onSelect, onClose }: ProfileAppIconSheetProps) {
  useBackHandler(true, onClose);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full flex flex-col"
        style={{
          background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
          maxHeight: "80dvh",
        }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div>
            <p className="text-white font-bold text-lg">Иконка приложения</p>
            <p className="text-white/40 text-xs mt-0.5">Выбери, как приложение выглядит на экране</p>
          </div>
          <button onClick={onClose} className="text-white/40">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Ряд иконок (как в Telegram) */}
        <div className="px-4 pb-5 overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-1">
            {APP_ICON_ORDER.map((key) => {
              const meta = APP_ICON_META[key];
              const active = appIcon === key;
              return (
                <button key={key} onClick={() => onSelect(key)}
                  className="flex flex-col items-center gap-2 transition-all active:scale-95 flex-shrink-0"
                  style={{ width: 78 }}>
                  <div className="relative rounded-[20px] p-[3px] transition-all"
                    style={{
                      background: active
                        ? "linear-gradient(135deg, #FF2D78, #9B59B6)"
                        : "rgba(255,255,255,0.08)",
                    }}>
                    <img src={meta.url} alt={meta.label}
                      className="w-[68px] h-[68px] rounded-[17px] object-cover block"
                      style={{ background: "#120818" }} />
                    {active && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", border: "2px solid #120818" }}>
                        <Icon name="Check" size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-center text-[11px] font-semibold leading-tight"
                    style={{ color: active ? "#FF2D78" : "rgba(255,255,255,0.55)" }}>
                    {meta.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Подсказка про APK */}
        <div className="px-5 pb-7">
          <div className="flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Icon name="Info" size={15} className="text-white/40 flex-shrink-0 mt-0.5" />
            <p className="text-white/45 text-[11px] leading-snug">
              Иконка меняется на вкладке и при установке приложения. На домашнем экране обновление может занять до минуты.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
