import Icon from "@/components/ui/icon";
import { useBackHandler } from "@/hooks/backStack";
import { THEME_META, type AppTheme } from "@/hooks/useAppTheme";
import { APP_ICON_META, APP_ICON_ORDER, type AppIcon } from "@/hooks/useAppIcon";

interface ProfileThemeSheetProps {
  appTheme: AppTheme;
  onSelect: (t: AppTheme) => void;
  appIcon: AppIcon;
  iconNative: boolean;
  onSelectIcon: (i: AppIcon) => void;
  onClose: () => void;
}

const THEME_ORDER: AppTheme[] = ["aurora", "midnight", "amber"];

export function ProfileThemeSheet({ appTheme, onSelect, appIcon, iconNative, onSelectIcon, onClose }: ProfileThemeSheetProps) {
  useBackHandler(true, onClose);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col"
      style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)" }}>

      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
        }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white/80" />
        </button>
        <div className="min-w-0">
          <p className="text-white font-bold text-base leading-tight">Тема оформления</p>
          <p className="text-white/35 text-xs">Внешний вид и иконка приложения</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>

        {/* Секция: Тема */}
        <div className="px-4 pt-5 pb-1">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Тема</p>
        </div>
        <div className="px-4 pt-2 flex flex-col gap-2.5">
          {THEME_ORDER.map((key) => {
            const meta = THEME_META[key];
            const active = appTheme === key;
            return (
              <button key={key} onClick={() => onSelect(key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                  border: active ? `1.5px solid ${meta.swatch[0]}` : "1.5px solid rgba(255,255,255,0.08)",
                }}>
                <div className="w-11 h-11 rounded-xl flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${meta.swatch[0]}, ${meta.swatch[1]})`, boxShadow: `0 4px 14px ${meta.swatch[0]}55` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-tight">{meta.label}</p>
                  <p className="text-white/35 text-[11px] leading-tight mt-0.5">{meta.sub}</p>
                </div>
                {active && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${meta.swatch[0]}, ${meta.swatch[1]})` }}>
                    <Icon name="Check" size={13} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Секция: Иконка приложения */}
        <div className="px-4 pt-7 pb-1">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Иконка приложения</p>
          <p className="text-white/30 text-[11px] mt-1">Как приложение выглядит на экране телефона</p>
        </div>

        <div className="px-4 pt-3">
          <div className="grid grid-cols-3 gap-3">
            {APP_ICON_ORDER.map((key) => {
              const meta = APP_ICON_META[key];
              const active = appIcon === key;
              return (
                <button key={key} onClick={() => iconNative && onSelectIcon(key)}
                  disabled={!iconNative}
                  className="flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-45">
                  <div className="relative w-full rounded-2xl flex items-center justify-center py-4 transition-all"
                    style={{
                      background: "#151515",
                      border: active ? "1.5px solid #FF2D5A" : "1.5px solid rgba(255,255,255,0.06)",
                    }}>
                    <img src={meta.url} alt={meta.label}
                      className="w-[62px] h-[62px] rounded-[16px] object-cover block" />
                    {active && (
                      <div className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                        style={{ background: "#FF2D5A" }}>
                        <Icon name="Check" size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className="text-center text-[11px] font-medium leading-tight"
                    style={{ color: active ? "#FF2D5A" : "rgba(255,255,255,0.55)" }}>
                    {meta.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}