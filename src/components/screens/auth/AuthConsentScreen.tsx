import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { AuthLegalContent } from "./AuthLegalContent";

const LOGO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/877e412e-7952-45c5-a513-2c266868f89f.jpg";

const DATA_SETTINGS = [
  {
    title: "Персонализация подбора анкет",
    desc: "Информация о вашей активности в сервисе (лайки, просмотры, предпочтения) используется для подбора наиболее подходящих вам людей и улучшения алгоритмов совместимости.",
    key: "personalization",
  },
  {
    title: "Хранение и доступ к информации на устройстве",
    desc: "Данные для входа, настройки и идентификаторы сессии сохраняются в защищённом хранилище вашего устройства (cookie, localStorage) для обеспечения работы сервиса.",
    key: "storage",
  },
  {
    title: "Обеспечение безопасности и предотвращение мошенничества",
    desc: "Ваши данные могут использоваться для мониторинга и предотвращения подозрительных действий, защиты аккаунта и выявления нарушений правил сервиса.",
    key: "security",
  },
  {
    title: "Улучшение сервиса и аналитика",
    desc: "Агрегированные данные об использовании сервиса помогают нам улучшать функциональность, исправлять ошибки и развивать новые возможности для пользователей.",
    key: "analytics",
  },
  {
    title: "Идентификация устройства",
    desc: "Ваше устройство может быть идентифицировано на основе технических параметров (IP-адрес, тип браузера, операционная система) для обеспечения безопасности и корректной работы сервиса.",
    key: "device",
  },
  {
    title: "Использование данных геолокации",
    desc: "С вашего согласия ваше местоположение может использоваться для показа людей рядом с вами. Данные геолокации обрабатываются только при наличии явного разрешения.",
    key: "geo",
  },
];

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative flex-shrink-0 transition-all"
      style={{
        width: 44, height: 26,
        borderRadius: 13,
        background: value ? "#FF2D78" : "#d1d5db",
      }}>
      <div className="absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all"
        style={{ left: value ? 22 : 3, width: 18, height: 18, top: 4 }} />
    </button>
  );
}

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
  const [showSettings, setShowSettings] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    personalization: false,
    storage: false,
    security: true,
    analytics: false,
    device: false,
    geo: false,
  });

  const toggleConsent = (key: string) =>
    setConsents(p => ({ ...p, [key]: !p[key] }));

  const acceptAll = () => {
    setConsents(Object.fromEntries(DATA_SETTINGS.map(s => [s.key, true])));
    setTimeout(onAccept, 150);
  };

  /* ── Экран настроек ── */
  if (showSettings) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="w-full max-h-[92dvh] flex flex-col rounded-t-3xl overflow-hidden"
          style={{ background: "#f5f5f7" }}>

          {/* Шапка */}
          <div className="flex items-center gap-3 px-4 pt-5 pb-3 bg-white"
            style={{ borderBottom: "1px solid #e5e7eb" }}>
            <button onClick={() => setShowSettings(false)}
              className="w-8 h-8 flex items-center justify-center text-gray-600">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <p className="text-gray-900 font-semibold text-base flex-1 text-center pr-8">
              Настройки обработки данных
            </p>
          </div>

          {/* Карточки */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
            style={{ scrollbarWidth: "none" }}>
            {DATA_SETTINGS.map(item => (
              <div key={item.key} className="rounded-2xl bg-white px-4 py-4 flex flex-col gap-2"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <p className="text-gray-900 font-semibold text-sm leading-snug">{item.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {expanded === item.key ? item.desc : item.desc.slice(0, 80) + "..."}
                </p>
                <button
                  onClick={() => setExpanded(expanded === item.key ? null : item.key)}
                  className="text-pink-500 text-xs font-medium text-left">
                  {expanded === item.key ? "Скрыть" : "Подробнее"}
                </button>
                {item.key !== "security" && (
                  <div className="flex items-center justify-between pt-1"
                    style={{ borderTop: "1px solid #f3f4f6" }}>
                    <p className="text-gray-400 text-xs">Согласие</p>
                    <Toggle value={consents[item.key]} onChange={() => toggleConsent(item.key)} />
                  </div>
                )}
              </div>
            ))}
            <div className="rounded-2xl bg-white px-4 py-4"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p className="text-gray-500 text-xs leading-relaxed">
                Ваши настройки конфиденциальности хранятся в защищённом виде и применяются
                ко всем сессиям. Данные обрабатываются в соответствии с ФЗ-152 «О персональных данных».
                Срок хранения настроек — до момента удаления аккаунта.
              </p>
            </div>
          </div>

          {/* Кнопки */}
          <div className="px-4 pb-8 pt-3 bg-white flex flex-col gap-2"
            style={{ borderTop: "1px solid #e5e7eb" }}>
            <button onClick={onAccept}
              className="w-full py-4 rounded-2xl text-white font-bold text-base active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 20px rgba(255,45,120,0.3)" }}>
              Подтвердить
            </button>
            <button onClick={acceptAll}
              className="w-full py-3 text-gray-600 font-semibold text-sm">
              Принять все
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Основной экран ── */
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
            className="flex items-center gap-2 mt-1 text-gray-500 text-sm font-medium">
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
              <div className="text-gray-600 text-[11px] leading-relaxed">
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
          <button onClick={() => setShowSettings(true)}
            className="w-full py-3 text-gray-500 font-semibold text-sm">
            Настройки
          </button>
        </div>
      </div>
    </div>
  );
}
