// ── Данные знаков зодиака ─────────────────────────────────────────────────────
export const ZODIACS = [
  { key: "aries",       label: "Овен",       emoji: "♈", dates: "21 мар — 19 апр", element: "fire",  colors: { from: "#ef4444", to: "#f97316", glow: "#ef444455", text: "#fca5a5" } },
  { key: "taurus",      label: "Телец",      emoji: "♉", dates: "20 апр — 20 май", element: "earth", colors: { from: "#16a34a", to: "#65a30d", glow: "#16a34a55", text: "#86efac" } },
  { key: "gemini",      label: "Близнецы",   emoji: "♊", dates: "21 май — 20 июн", element: "air",   colors: { from: "#eab308", to: "#f59e0b", glow: "#eab30855", text: "#fde68a" } },
  { key: "cancer",      label: "Рак",        emoji: "♋", dates: "21 июн — 22 июл", element: "water", colors: { from: "#0ea5e9", to: "#6366f1", glow: "#0ea5e955", text: "#bae6fd" } },
  { key: "leo",         label: "Лев",        emoji: "♌", dates: "23 июл — 22 авг", element: "fire",  colors: { from: "#f59e0b", to: "#ef4444", glow: "#f59e0b55", text: "#fed7aa" } },
  { key: "virgo",       label: "Дева",       emoji: "♍", dates: "23 авг — 22 сен", element: "earth", colors: { from: "#8b5cf6", to: "#6366f1", glow: "#8b5cf655", text: "#ddd6fe" } },
  { key: "libra",       label: "Весы",       emoji: "♎", dates: "23 сен — 22 окт", element: "air",   colors: { from: "#ec4899", to: "#a855f7", glow: "#ec489955", text: "#fbcfe8" } },
  { key: "scorpio",     label: "Скорпион",   emoji: "♏", dates: "23 окт — 21 ноя", element: "water", colors: { from: "#7c3aed", to: "#1d4ed8", glow: "#7c3aed55", text: "#c4b5fd" } },
  { key: "sagittarius", label: "Стрелец",    emoji: "♐", dates: "22 ноя — 21 дек", element: "fire",  colors: { from: "#f97316", to: "#eab308", glow: "#f9731655", text: "#fdba74" } },
  { key: "capricorn",   label: "Козерог",    emoji: "♑", dates: "22 дек — 19 янв", element: "earth", colors: { from: "#475569", to: "#0f172a", glow: "#47556955", text: "#cbd5e1" } },
  { key: "aquarius",    label: "Водолей",    emoji: "♒", dates: "20 янв — 18 фев", element: "water", colors: { from: "#3b82f6", to: "#06b6d4", glow: "#3b82f655", text: "#bfdbfe" } },
  { key: "pisces",      label: "Рыбы",       emoji: "♓", dates: "19 фев — 20 мар", element: "water", colors: { from: "#06b6d4", to: "#8b5cf6", glow: "#06b6d455", text: "#a5f3fc" } },
];

// ── Группы знаков по стихиям ──────────────────────────────────────────────────
export const ELEMENT_GROUPS = [
  { element: "fire",  label: "Огонь",  icon: "🔥", signs: ["aries","leo","sagittarius"],   bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)"  },
  { element: "earth", label: "Земля",  icon: "🌿", signs: ["taurus","virgo","capricorn"],  bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)"  },
  { element: "air",   label: "Воздух", icon: "💨", signs: ["gemini","libra","aquarius"],   bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)"  },
  { element: "water", label: "Вода",   icon: "💧", signs: ["cancer","scorpio","pisces"],   bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)" },
];

// ── Анимации стихий (баннер) ──────────────────────────────────────────────────
export const ELEMENT_KEYFRAMES = `
@keyframes zodiac-fire {
  0%,100% { transform: scaleY(1) translateX(0); opacity: 0.7; }
  25% { transform: scaleY(1.15) translateX(-2px); opacity: 1; }
  75% { transform: scaleY(0.9) translateX(2px); opacity: 0.8; }
}
@keyframes zodiac-water {
  0%,100% { transform: translateX(0) translateY(0); }
  33% { transform: translateX(-6px) translateY(2px); }
  66% { transform: translateX(6px) translateY(-2px); }
}
@keyframes zodiac-air {
  0%,100% { transform: rotate(0deg) scale(1); opacity: 0.6; }
  50% { transform: rotate(180deg) scale(1.1); opacity: 1; }
}
@keyframes zodiac-earth {
  0%,100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(-3px); opacity: 1; }
}
@keyframes zodiac-float {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
@keyframes zodiac-pulse {
  0%,100% { box-shadow: 0 0 0 0 transparent; }
  50% { box-shadow: 0 0 20px 4px var(--zodiac-glow); }
}
@keyframes shimmer-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
`;

// ── Анимации пикера ───────────────────────────────────────────────────────────
export const PICKER_KEYFRAMES = `
@keyframes picker-slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes picker-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes star-twinkle {
  0%,100% { opacity: 0.2; transform: scale(1); }
  50%      { opacity: 0.8; transform: scale(1.4); }
}
`;

// ── Вспомогательная функция лейбла стихии ────────────────────────────────────
export function elementLabel(element: string): string {
  if (element === "fire")  return "🔥 Огонь";
  if (element === "water") return "💧 Вода";
  if (element === "air")   return "💨 Воздух";
  return "🌿 Земля";
}
