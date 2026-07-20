import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { isStandaloneApp } from "@/lib/isStandalone";

const STORAGE_KEY = "poluton_cookie_consent_v2";

interface ConsentPrefs {
  necessary: true;
  analytics: boolean;
  functional: boolean;
}

function saveConsent(prefs: ConsentPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function MiniToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
      style={{
        background: checked ? "linear-gradient(135deg, #FF2D78, #9B59B6)" : "rgba(255,255,255,0.15)",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: checked ? "22px" : "2px", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
      />
    </button>
  );
}

export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [functional, setFunctional] = useState(true);

  useEffect(() => {
    // В установленном приложении (APK/PWA) cookie-баннер не показываем — он нужен
    // только на сайте в браузере.
    if (isStandaloneApp()) return;
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setSettingsOpen(false);
    }, 350);
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, analytics: true, functional: true });
    close();
  };

  const handleSaveSettings = () => {
    saveConsent({ necessary: true, analytics, functional });
    close();
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed z-[60] left-0 right-0 bottom-0 w-full px-3 pb-3 md:px-6 md:pb-6"
        style={{
          animation: closing
            ? "cookieSlideDown 0.35s ease forwards"
            : "cookieSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        }}
      >
        <div
          className="w-full max-w-7xl mx-auto rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(30,24,48,0.96), rgba(18,13,30,0.98))",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 -10px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,45,120,0.1)",
          }}
        >
          {/* Верхняя декоративная полоса-градиент */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #FF2D78, #9B59B6, #FF2D78)" }} />

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 p-6 md:p-8">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 8px 28px rgba(255,45,120,0.45)" }}>
                <Icon name="Cookie" size={28} className="text-white" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-white font-unbounded font-black text-lg">{t("cookieConsent.title")}</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
                  {t("cookieConsent.text")}{" "}
                  <Link to="/privacy" className="text-pink-400 font-semibold hover:text-pink-300 transition-colors underline underline-offset-2">
                    {t("cookieConsent.cookiesLink")}
                  </Link>
                  {" "}{t("cookieConsent.and")}{" "}
                  <Link to="/privacy" className="text-pink-400 font-semibold hover:text-pink-300 transition-colors underline underline-offset-2">
                    {t("cookieConsent.dataLink")}
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 w-full lg:w-auto">
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-full text-white/80 text-sm font-semibold transition-all hover:text-white hover:bg-white/5 active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <Icon name="Settings2" size={16} />
                {t("cookieConsent.settings")}
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 lg:flex-none px-7 py-3 rounded-full text-white text-sm font-bold transition-all active:scale-95 hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 6px 24px rgba(255,45,120,0.45)" }}
              >
                {t("cookieConsent.accept")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setSettingsOpen(false)}>
          <div
            className="w-full md:max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5"
            style={{
              background: "linear-gradient(180deg, #1e1830 0%, #17112a 100%)",
              borderRadius: "28px 28px 0 0",
              border: "1px solid rgba(255,255,255,0.1)",
              borderBottom: "none",
              animation: "scaleIn 0.3s ease forwards",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center -mt-1 mb-1 md:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-white font-unbounded font-black text-xl">{t("cookieConsent.settingsTitle")}</h3>
              <button onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <Icon name="X" size={16} className="text-white/60" />
              </button>
            </div>

            <p className="text-white/50 text-sm leading-relaxed -mt-2">{t("cookieConsent.settingsDescription")}</p>

            <div className="flex flex-col gap-3">
              {/* Необходимые — всегда включены */}
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(74,222,128,0.15)" }}>
                  <Icon name="ShieldCheck" size={18} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{t("cookieConsent.necessaryTitle")}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{t("cookieConsent.necessaryText")}</p>
                </div>
                <MiniToggle checked disabled onChange={() => {}} />
              </div>

              {/* Функциональные */}
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(155,89,182,0.15)" }}>
                  <Icon name="Sparkles" size={18} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{t("cookieConsent.functionalTitle")}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{t("cookieConsent.functionalText")}</p>
                </div>
                <MiniToggle checked={functional} onChange={() => setFunctional(v => !v)} />
              </div>

              {/* Аналитические */}
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,45,120,0.15)" }}>
                  <Icon name="BarChart3" size={18} className="text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{t("cookieConsent.analyticsTitle")}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{t("cookieConsent.analyticsText")}</p>
                </div>
                <MiniToggle checked={analytics} onChange={() => setAnalytics(v => !v)} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {t("cookieConsent.saveSettings")}
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #FF2D78 0%, #9B59B6 100%)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)" }}
              >
                {t("cookieConsent.accept")}
              </button>
            </div>

            <div className="h-2 md:hidden" />
          </div>
        </div>
      )}
    </>
  );
}

export default CookieConsent;