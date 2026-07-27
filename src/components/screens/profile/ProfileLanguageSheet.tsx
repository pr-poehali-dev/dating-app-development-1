import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/icon";
import { FlagIcon } from "@/components/ui/flag-icon";
import { useBackHandler } from "@/hooks/backStack";
import { LANGUAGES, setAppLanguage, type LanguageCode } from "@/i18n";

interface ProfileLanguageSheetProps {
  onClose: () => void;
}

export function ProfileLanguageSheet({ onClose }: ProfileLanguageSheetProps) {
  const { i18n } = useTranslation();
  useBackHandler(true, onClose);

  const current = i18n.language;

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
          <p className="text-white font-bold text-base leading-tight">Выбор языка</p>
          <p className="text-white/35 text-xs">Язык интерфейса приложения</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 flex flex-col gap-2.5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        {LANGUAGES.map((lang) => {
          const active = lang.code === current;
          return (
            <button key={lang.code} onClick={() => setAppLanguage(lang.code as LanguageCode)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                background: active ? "rgba(255,45,120,0.1)" : "rgba(255,255,255,0.03)",
                border: active ? "1.5px solid #FF2D5A" : "1.5px solid rgba(255,255,255,0.08)",
              }}>
              <FlagIcon code={lang.flagCode}
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">{lang.label}</p>
                <p className="text-white/35 text-[11px] leading-tight mt-0.5 truncate">{lang.country}</p>
              </div>
              {active && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#FF2D5A" }}>
                  <Icon name="Check" size={13} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ProfileLanguageSheet;
