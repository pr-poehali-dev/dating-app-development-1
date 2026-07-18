import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function AuthSiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <div className="w-full" style={{ background: "#161022", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between flex-wrap gap-4">
        <p className="text-white/70 text-lg font-semibold">{t("footer.copyright")} {year}</p>

        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-white/45 text-sm cursor-default">{t("footer.support")}</span>
          <Link to="/terms" className="text-white/45 text-sm hover:text-pink-400 transition-colors">{t("footer.terms")}</Link>
          <Link to="/privacy" className="text-white/45 text-sm hover:text-pink-400 transition-colors">{t("footer.privacy")}</Link>
        </div>
      </div>
    </div>
  );
}

export default AuthSiteFooter;
