import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import be from "./locales/be.json";
import ko from "./locales/ko.json";
import fa from "./locales/fa.json";
import zh from "./locales/zh.json";

export const LANGUAGES = [
  { code: "ru", label: "Русский", country: "Россия", flag: "🇷🇺", rtl: false },
  { code: "be", label: "Беларуская", country: "Беларусь", flag: "🇧🇾", rtl: false },
  { code: "ko", label: "한국어", country: "КНДР (Северная Корея)", flag: "🇰🇵", rtl: false },
  { code: "fa", label: "فارسی", country: "Иран", flag: "🇮🇷", rtl: true },
  { code: "zh", label: "中文", country: "Китай", flag: "🇨🇳", rtl: false },
] as const;

export type LanguageCode = typeof LANGUAGES[number]["code"];

const STORAGE_KEY = "poluton_lang";

const savedLang = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || "ru";

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    be: { translation: be },
    ko: { translation: ko },
    fa: { translation: fa },
    zh: { translation: zh },
  },
  lng: savedLang,
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

export function setAppLanguage(code: LanguageCode) {
  i18n.changeLanguage(code);
  localStorage.setItem(STORAGE_KEY, code);
  const meta = LANGUAGES.find(l => l.code === code);
  document.documentElement.lang = code;
  document.documentElement.dir = meta?.rtl ? "rtl" : "ltr";
}

// Применяем направление письма сразу при загрузке
const initialMeta = LANGUAGES.find(l => l.code === savedLang);
if (typeof document !== "undefined") {
  document.documentElement.lang = savedLang;
  document.documentElement.dir = initialMeta?.rtl ? "rtl" : "ltr";
}

export default i18n;
