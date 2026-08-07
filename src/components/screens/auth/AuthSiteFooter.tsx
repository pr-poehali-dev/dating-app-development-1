import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SupportModal } from "@/components/screens/auth/SupportModal";
import { openLegalExternally, type LegalTab } from "@/lib/openLegal";

export function AuthSiteFooter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const [showSupport, setShowSupport] = useState(false);

  const openLegal = (tab: LegalTab) => {
    if (!openLegalExternally(tab)) navigate(`/${tab}`);
  };

  return (
    <div className="w-full" style={{ background: "#161022", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between flex-wrap gap-4">
        <p className="text-white/70 text-lg font-semibold">{t("footer.copyright")} {year}</p>

        <div className="flex items-center gap-6 flex-wrap">
          <button onClick={() => setShowSupport(true)}
            className="text-white/45 text-sm hover:text-pink-400 transition-colors">{t("footer.support")}</button>
          <button onClick={() => openLegal("terms")}
            className="text-white/45 text-sm hover:text-pink-400 transition-colors">{t("footer.terms")}</button>
          <button onClick={() => openLegal("privacy")}
            className="text-white/45 text-sm hover:text-pink-400 transition-colors">{t("footer.privacy")}</button>
          <button onClick={() => openLegal("offer")}
            className="text-white/45 text-sm hover:text-pink-400 transition-colors">Публичная оферта</button>
        </div>
      </div>
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
    </div>
  );
}

export default AuthSiteFooter;