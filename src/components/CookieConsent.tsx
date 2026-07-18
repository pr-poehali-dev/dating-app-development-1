import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const STORAGE_KEY = "poluton_cookie_consent";

export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "accepted");
      setVisible(false);
    }, 350);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed z-[60] left-1/2 bottom-4 md:bottom-6 w-[calc(100%-24px)] max-w-lg"
      style={{
        transform: "translateX(-50%)",
        animation: closing
          ? "cookieSlideDown 0.35s ease forwards"
          : "cookieSlideUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards",
      }}
    >
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-3xl"
        style={{
          background: "linear-gradient(160deg, rgba(30,24,48,0.92), rgba(21,15,36,0.96))",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,45,120,0.08)",
        }}
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 6px 20px rgba(255,45,120,0.4)" }}>
          <Icon name="Cookie" size={22} className="text-white" />
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <p className="text-white/70 text-sm leading-relaxed">
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

          <button
            onClick={handleAccept}
            className="self-start px-6 py-2.5 rounded-full text-white text-sm font-bold transition-all active:scale-95 hover:brightness-110 sm:hidden"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 4px 16px rgba(255,45,120,0.4)" }}
          >
            {t("cookieConsent.accept")}
          </button>
        </div>

        <button
          onClick={handleAccept}
          className="hidden sm:block px-6 py-3 rounded-full text-white text-sm font-bold transition-all active:scale-95 hover:brightness-110 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 4px 16px rgba(255,45,120,0.4)" }}
        >
          {t("cookieConsent.accept")}
        </button>
      </div>
    </div>
  );
}

export default CookieConsent;
