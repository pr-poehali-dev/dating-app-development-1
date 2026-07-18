import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/icon";
import { LANGUAGES, setAppLanguage, type LanguageCode } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
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
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-white/70 text-sm font-semibold transition-all hover:text-white hover:bg-white/5"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <Icon name="ChevronDown" size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-40"
          style={{ background: "linear-gradient(160deg,#1e1830,#150f24)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
              style={lang.code === current.code ? { background: "rgba(255,45,120,0.1)" } : undefined}
            >
              <span className="text-xl leading-none flex-shrink-0">{lang.flag}</span>
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
