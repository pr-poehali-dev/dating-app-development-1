import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/icon";
import { FlagIcon } from "@/components/ui/flag-icon";
import { LANGUAGES, setAppLanguage, type LanguageCode } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setAppLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full transition-all hover:brightness-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, rgba(255,45,120,0.14), rgba(155,89,182,0.14))",
          border: "1px solid rgba(255,255,255,0.16)",
        }}
      >
        <FlagIcon code={current.flagCode}
          className="w-6 h-6 rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.25)" }} />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-white text-sm font-bold">{current.label}</span>
          <span className="hidden sm:block text-white/45 text-[10px]">{t("language.select")}</span>
        </span>
        <Icon name="ChevronDown" size={15} className={`text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden z-40"
          style={{ background: "linear-gradient(160deg,#1e1830,#150f24)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 50px rgba(0,0,0,0.55)" }}
        >
          <div className="px-4 pt-3 pb-2">
            <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wide">{t("language.select")}</p>
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
              style={lang.code === current.code ? { background: "rgba(255,45,120,0.12)" } : undefined}
            >
              <FlagIcon code={lang.flagCode}
                className="w-8 h-8 rounded-full"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }} />
              <div className="flex flex-col leading-tight flex-1 min-w-0">
                <span className="text-white text-sm font-semibold">{lang.label}</span>
                <span className="text-white/40 text-xs truncate">{lang.country}</span>
              </div>
              {lang.code === current.code && (
                <Icon name="Check" size={16} className="text-pink-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;