import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/icon";
import { AuthLegalContent } from "@/components/screens/auth/AuthLegalContent";

export default function LegalPage({ tab }: { tab: "terms" | "privacy" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTerms = tab === "terms";
  const title = isTerms ? t("legal.termsTitle") : t("legal.privacyTitle");

  useEffect(() => {
    document.title = `${title} — Полутон`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-screen w-full" style={{ background: "#ffffff" }}>
      {/* Верхняя панель с кнопкой назад */}
      <div className="sticky top-0 z-10 w-full"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
            <Icon name="ArrowLeft" size={18} className="text-gray-700" />
          </button>
          <span className="text-gray-500 text-sm font-medium">{t("legal.backHome")}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Заголовок с розовой подсветкой — как в референсе */}
        <div className="inline-block relative mb-8">
          <span className="absolute left-0 bottom-1 right-0 h-3.5"
            style={{ background: "rgba(255,45,120,0.35)", zIndex: 0 }} />
          <h1 className="relative text-2xl md:text-3xl font-black text-gray-900 px-1">{title}</h1>
        </div>

        {/* Контент документа на светлом фоне */}
        <div className="flex flex-col gap-5">
          <AuthLegalContent tab={tab} lightBg />
        </div>

        <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <p className="text-gray-400 text-xs">{t("legal.copyright")} {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}