import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { AuthLegalContent } from "./AuthLegalContent";

const LOGO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/877e412e-7952-45c5-a513-2c266868f89f.jpg";

const DATA_SETTINGS = [
  {
    title: "Персонализация подбора анкет",
    desc: "Информация о вашей активности в сервисе (лайки, просмотры, предпочтения) используется для подбора наиболее подходящих вам людей и улучшения алгоритмов совместимости. Мы анализируем взаимные реакции пользователей, чтобы повысить качество рекомендаций.",
    key: "personalization",
    hasLegitimate: false,
  },
  {
    title: "Хранение и доступ к информации на устройстве",
    desc: "Данные для входа, настройки и идентификаторы сессии сохраняются в защищённом хранилище вашего устройства (cookie, localStorage) для обеспечения работы сервиса. Без этого авторизация и сохранение настроек невозможны.",
    key: "storage",
    hasLegitimate: false,
  },
  {
    title: "Обеспечение безопасности и предотвращение мошенничества",
    desc: "Ваши данные могут использоваться для мониторинга и предотвращения подозрительных действий, защиты аккаунта и выявления нарушений правил сервиса. Обработка в целях безопасности осуществляется на основании законного интереса.",
    key: "security",
    hasLegitimate: true,
    legitimateOn: true,
  },
  {
    title: "Улучшение сервиса и аналитика",
    desc: "Агрегированные данные об использовании сервиса помогают нам улучшать функциональность, исправлять ошибки и развивать новые возможности. Информация о вашем взаимодействии с функциями сервиса может быть очень полезна для его совершенствования.",
    key: "analytics",
    hasLegitimate: true,
    legitimateOn: true,
  },
  {
    title: "Определение эффективности контента",
    desc: "Информация о том, какой контент продемонстрирован вам и как вы взаимодействуете с ним, может быть использована для определения того, насколько эффективно контент достигает своей цели.",
    key: "effectiveness",
    hasLegitimate: true,
    legitimateOn: true,
  },
  {
    title: "Понимание аудитории с помощью статистики",
    desc: "Отчёты могут создаваться на основе комбинации наборов данных (таких как профили пользователей, статистика активности) для понимания характеристик аудитории сервиса в совокупности.",
    key: "audience",
    hasLegitimate: true,
    legitimateOn: true,
  },
  {
    title: "Разработка и совершенствование сервисов",
    desc: "Информация о вашей деятельности на этом сервисе, например ваше взаимодействие с контентом, может быть очень полезна для разработки и совершенствования функций и возможностей LoveBloom.",
    key: "development",
    hasLegitimate: true,
    legitimateOn: true,
  },
  {
    title: "Использование ограниченных данных для выбора контента",
    desc: "Контент, продемонстрированный вам на этом сервисе, может быть основан на ограниченных данных, таких как веб-сайт или приложение, которые вы используете, ваше приблизительное местоположение или тип устройства.",
    key: "limited",
    hasLegitimate: true,
    legitimateOn: true,
  },
  {
    title: "Идентификация устройства",
    desc: "Ваше устройство может быть идентифицировано на основе технических параметров (IP-адрес, тип браузера, операционная система) для обеспечения безопасности и корректной работы сервиса.",
    key: "device",
    hasLegitimate: false,
  },
  {
    title: "Использование данных геолокации",
    desc: "С вашего согласия ваше точное местоположение (в радиусе менее 500 м) может использоваться для показа людей рядом с вами, указанного в настоящем уведомлении. Данные геолокации обрабатываются только при наличии явного разрешения.",
    key: "geo",
    hasLegitimate: false,
  },
];

function Toggle({ value, onChange, disabled, color }: { value: boolean; onChange: () => void; disabled?: boolean; color?: string }) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      className="relative flex-shrink-0 transition-all"
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? (color || "#FF2D78") : "#d1d5db",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !value ? 0.5 : 1,
      }}>
      <div className="absolute rounded-full bg-white shadow-sm transition-all"
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
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(DATA_SETTINGS.map(s => [s.key, false]))
  );

  const toggleConsent = (key: string) => setConsents(p => ({ ...p, [key]: !p[key] }));

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
          <div className="flex-1 overflow-y-auto flex flex-col gap-0"
            style={{ scrollbarWidth: "none" }}>

            {/* Управление данными */}
            <div className="px-5 pt-5 pb-4 bg-white">
              <h3 className="text-gray-900 font-bold text-lg mb-2">Управление данными</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Вы можете указать, как следует использовать ваши персональные данные. Ниже приведён список того, для чего сервису нужно ваше разрешение.
              </p>
            </div>

            {/* Подзаголовок */}
            <div className="flex items-center gap-2 px-5 py-2.5"
              style={{ background: "#f0f0f2" }}>
              <p className="text-gray-500 text-xs flex-1">Параметры обработки данных LoveBloom</p>
              <button onClick={() => setInfoKey(infoKey === "_tcf" ? null : "_tcf")}
                className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
                <Icon name="HelpCircle" size={11} className="text-gray-400" />
              </button>
            </div>
            {infoKey === "_tcf" && (
              <div className="px-5 py-3 text-xs text-gray-500 leading-relaxed"
                style={{ background: "#f7f7f9", borderBottom: "1px solid #e5e7eb" }}>
                Параметры обработки данных определяют, в каких целях LoveBloom и его технические партнёры
                могут обрабатывать ваши персональные данные. Для каждого параметра вы можете дать
                или отозвать своё согласие. Некоторые виды обработки осуществляются на основании
                законного интереса и не требуют вашего согласия, однако вы вправе возразить против них.
              </div>
            )}

            <div className="px-4 py-3 flex flex-col gap-3">
            {DATA_SETTINGS.map(item => (
              <div key={item.key} className="rounded-2xl bg-white px-4 py-4 flex flex-col gap-2"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>

                <div className="flex items-start justify-between gap-2">
                  <p className="text-gray-900 font-bold text-sm leading-snug flex-1">{item.title}</p>
                  {item.hasLegitimate && (
                    <button
                      onClick={() => setInfoKey(infoKey === item.key ? null : item.key)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="HelpCircle" size={13} className="text-gray-400" />
                    </button>
                  )}
                </div>

                <p className="text-gray-500 text-xs leading-relaxed">
                  {expanded === item.key ? item.desc : item.desc.slice(0, 90) + "..."}
                </p>
                <button
                  onClick={() => setExpanded(expanded === item.key ? null : item.key)}
                  className="text-pink-500 text-xs font-medium text-left">
                  {expanded === item.key ? "Скрыть" : "Подробнее"}
                </button>

                {infoKey === item.key && (
                  <div className="rounded-xl px-3 py-2 text-xs text-gray-500 leading-relaxed"
                    style={{ background: "#f7f7f9", border: "1px solid #e5e7eb" }}>
                    Законный интерес означает, что обработка данных в этих целях осуществляется
                    без отдельного согласия, на основании обоснованного интереса оператора
                    в соответствии со ст. 6 ФЗ-152. Вы можете возразить против такой обработки
                    через службу поддержки: info@lbloom.ru
                  </div>
                )}

                <div className="flex flex-col gap-1.5 pt-1"
                  style={{ borderTop: "1px solid #f3f4f6" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-xs">Согласие</p>
                    <Toggle value={consents[item.key]} onChange={() => toggleConsent(item.key)} />
                  </div>
                  {item.hasLegitimate && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <p className="text-gray-400 text-xs">Законный интерес</p>
                        <button
                          onClick={() => setInfoKey(infoKey === item.key ? null : item.key)}
                          className="text-gray-300">
                          <Icon name="HelpCircle" size={12} />
                        </button>
                      </div>
                      <Toggle
                        value={item.legitimateOn ?? true}
                        onChange={() => {}}
                        disabled
                        color="#FF2D78"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>

            <div className="px-4 pb-3 flex flex-col gap-3">
            {/* Хранение настроек */}
            <div className="rounded-2xl bg-white px-4 py-4 flex flex-col gap-2"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
              <p className="text-gray-900 font-bold text-sm leading-snug">
                Использование настроек и их хранение
              </p>
              <p className="text-gray-500 text-xs leading-relaxed">
                Настройки, касающиеся целей обработки данных, которые вы указываете здесь,
                применяются ко всем вашим сессиям. Мы храним эти настройки, чтобы следовать им
                при дальнейшем использовании сервиса.
              </p>
              <div className="text-xs text-gray-500 leading-relaxed flex flex-col gap-1 mt-1">
                <p>• Настройки хранятся в защищённом хранилище устройства</p>
                <p>• Срок хранения настроек — до момента удаления аккаунта или отзыва согласия</p>
                <p>• Вы можете изменить настройки в любое время через раздел «Конфиденциальность» в настройках</p>
              </div>
            </div>

            {/* Настройки доступа */}
            <button className="py-3 text-center w-full"
              style={{ color: "#FF2D78" }}
              onClick={() => {}}>
              <p className="font-semibold text-sm">Настройки доступа поставщиков</p>
            </button>
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

        <div className="flex flex-col items-center pt-7 pb-5 px-6">
          <img src={LOGO} alt="LoveBloom"
            className="w-16 h-16 rounded-2xl mb-4 object-cover"
            style={{ boxShadow: "0 4px 16px rgba(255,45,120,0.3)" }} />
          <h2 className="text-gray-900 font-bold text-lg text-center leading-snug">
            Разрешить LoveBloom использовать<br />ваши персональные данные<br />в указанных ниже целях?
          </h2>
        </div>

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
                <AuthLegalContent tab={consentTab} lightBg />
              </div>
            </div>
          )}

          <p className="text-gray-400 text-[11px] leading-relaxed text-center mt-1">
            Ваши персональные данные обрабатываются в соответствии с ФЗ-152 «О персональных данных».
            Данные хранятся на территории РФ и не передаются третьим лицам.
          </p>
        </div>

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