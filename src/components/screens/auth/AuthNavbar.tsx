import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

const LOGO_URL = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png";

export function AuthNavbar({ onLoginClick }: { onLoginClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="w-full sticky top-0 z-30"
      style={{ background: "rgba(15,10,25,0.75)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_URL} className="w-9 h-9 rounded-xl object-cover" alt="Полутон" />
          <span className="font-unbounded text-white text-xl font-black grad-text">Полутон</span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <button onClick={onLoginClick}
            className="px-5 py-2.5 rounded-full text-white text-sm font-bold transition-all active:scale-95 hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 4px 16px rgba(255,45,120,0.35)" }}>
            {t("navbar.login")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthNavbar;
