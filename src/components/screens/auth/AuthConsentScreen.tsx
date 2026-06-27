import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { AuthLegalContent } from "./AuthLegalContent";

const LOGO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/877e412e-7952-45c5-a513-2c266868f89f.jpg";

export function AuthConsentScreen({
  pendingUser,
  consentTab,
  onTabChange,
  onAccept,
}: {
  pendingUser: User;
  consentTab: "terms" | "privacy";
  onTabChange: (tab: "terms" | "privacy") => void;
  onAccept: () => void;
}) {
  void pendingUser;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-h-[92dvh] flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: "#fff" }}>

        {/* Шапка */}
        <div className="flex flex-col items-center pt-7 pb-5 px-6">
          <img src={LOGO} alt="LoveBloom"
            className="w-16 h-16 rounded-2xl mb-4 object-cover"
            style={{ boxShadow: "0 4px 16px rgba(255,45,120,0.3)" }} />
          <h2 className="text-gray-900 font-bold text-lg text-center leading-snug">
            Разрешить LoveBloom использовать<br />ваши персональные данные<br />в указанных ниже целях?
          </h2>
        </div>

        {/* Пункты */}
        <div className="px-5 flex flex-col gap-3 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.1)" }}>
              <Icon name="User" size={18} className="text-pink-500" />
            </div>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Персонализированный подбор анкет, определение совместимости, аналитика активности и улучшение сервиса
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.1)" }}>
              <Icon name="Smartphone" size={18} className="text-pink-500" />
            </div>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Хранение данных и доступ к информации на устройстве (cookie, идентификаторы сессии)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.1)" }}>
              <Icon name="Lock" size={18} className="text-pink-500" />
            </div>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Обеспечение безопасности аккаунта и защита от мошеннических действий
            </p>
          </div>

          {/* Подробнее */}
          <button
            onClick={() => setShowDetails(v => !v)}
            className="flex items-center gap-2 mt-1 text-gray-500 text-sm font-medium"
          >
            <div className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center">
              <Icon name={showDetails ? "ChevronUp" : "ChevronDown"} size={14} className="text-gray-500" />
            </div>
            Подробнее
          </button>

          {showDetails && (
            <div className="rounded-2xl overflow-y-auto flex flex-col gap-3 max-h-52"
              style={{ background: "#f7f7f9", padding: "12px 14px", scrollbarWidth: "none" }}>
              <div className="flex rounded-xl overflow-hidden mb-1"
                style={{ background: "rgba(0,0,0,0.06)" }}>
                {([{ id: "terms", label: "Соглашение" }, { id: "privacy", label: "Конфиденциальность" }] as const).map(tab => (
                  <button key={tab.id} onClick={() => onTabChange(tab.id)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold transition-all rounded-xl ${consentTab === tab.id ? "text-white" : "text-gray-500"}`}
                    style={consentTab === tab.id ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : undefined}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="text-gray-600 text-[11px] leading-relaxed [&_p]:text-gray-600 [&_p]:text-[11px] [&_span]:text-gray-500">
                <AuthLegalContent tab={consentTab} />
              </div>
            </div>
          )}

          <p className="text-gray-400 text-[11px] leading-relaxed text-center mt-1">
            Ваши персональные данные обрабатываются в соответствии с ФЗ-152 «О персональных данных».
            Данные хранятся на территории РФ и не передаются третьим лицам.
          </p>
        </div>

        {/* Кнопки */}
        <div className="px-5 pb-8 pt-2 flex flex-col gap-3"
          style={{ borderTop: "1px solid #f0f0f0" }}>
          <button onClick={onAccept}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 20px rgba(255,45,120,0.35)" }}>
            Соглашаюсь
          </button>
          <button
            className="w-full py-3 text-gray-500 font-semibold text-sm"
            onClick={onAccept}>
            Настройки
          </button>
        </div>
      </div>
    </div>
  );
}
