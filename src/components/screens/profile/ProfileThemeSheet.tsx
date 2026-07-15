import Icon from "@/components/ui/icon";
import { useBackHandler } from "@/hooks/backStack";
import { THEME_META, type AppTheme } from "@/hooks/useAppTheme";

interface ProfileThemeSheetProps {
  appTheme: AppTheme;
  onSelect: (t: AppTheme) => void;
  onClose: () => void;
}

const THEME_ORDER: AppTheme[] = ["aurora", "midnight", "amber"];

export function ProfileThemeSheet({ appTheme, onSelect, onClose }: ProfileThemeSheetProps) {
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
            <p className="text-white font-bold text-lg">Тема оформления</p>
            <p className="text-white/40 text-xs mt-0.5">Выбери настроение приложения</p>
          </div>
          <button onClick={onClose} className="text-white/40">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Варианты тем */}
        <div className="px-4 pb-6 flex flex-col gap-2.5 overflow-y-auto">
          {THEME_ORDER.map((key) => {
            const meta = THEME_META[key];
            const active = appTheme === key;
            return (
              <button key={key} onClick={() => { onSelect(key); onClose(); }}
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
      </div>
    </div>
  );
}
