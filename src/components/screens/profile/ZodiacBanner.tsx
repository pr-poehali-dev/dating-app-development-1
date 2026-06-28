import { useState } from "react";
import { profilesApi } from "@/lib/api";

// ── Данные знаков зодиака ─────────────────────────────────────────────────────
const ZODIACS = [
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

// ── Анимации по стихиям ──────────────────────────────────────────────────────
const ELEMENT_KEYFRAMES = `
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

function ElementParticles({ element, color }: { element: string; color: string }) {
  if (element === "fire") return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute bottom-0 rounded-full opacity-40"
          style={{
            width: 6 + i * 3, height: 12 + i * 5,
            left: `${10 + i * 15}%`,
            background: `linear-gradient(to top, ${color}, transparent)`,
            animation: `zodiac-fire ${0.8 + i * 0.2}s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }} />
      ))}
    </div>
  );

  if (element === "water") return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-20"
          style={{
            width: 40 + i * 15, height: 8,
            left: `${-5 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            background: color,
            borderRadius: "50%",
            animation: `zodiac-water ${2 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
      ))}
    </div>
  );

  if (element === "air") return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="absolute opacity-15"
          style={{
            width: 30 + i * 10, height: 30 + i * 10,
            left: `${5 + i * 18}%`, top: `${10 + (i % 2) * 40}%`,
            border: `2px solid ${color}`,
            borderRadius: "50%",
            animation: `zodiac-air ${3 + i * 0.5}s linear infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
      ))}
    </div>
  );

  if (element === "earth") return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute opacity-20"
          style={{
            width: 8, height: 8,
            left: `${8 + i * 15}%`, top: `${20 + (i % 3) * 20}%`,
            background: color, borderRadius: 2,
            animation: `zodiac-earth ${1.5 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.25}s`,
          }} />
      ))}
    </div>
  );

  return null;
}

// ── Модальный выбор знака ────────────────────────────────────────────────────
function ZodiacPicker({ current, onSelect, onClose }: {
  current: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <div className="rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(180deg,#1a0e2e,#0d0618)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}>

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-white font-bold text-base">Знак зодиака</p>
            <p className="text-white/40 text-xs mt-0.5">Выбери свой знак</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <span className="text-white/60 text-lg leading-none">×</span>
          </button>
        </div>

        {/* Сетка знаков */}
        <div className="grid grid-cols-4 gap-2 px-4 pb-6">
          {ZODIACS.map(z => {
            const isActive = current === z.key;
            return (
              <button key={z.key} onClick={() => { onSelect(z.key); onClose(); }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${z.colors.from}33, ${z.colors.to}22)`
                    : "rgba(255,255,255,0.04)",
                  border: isActive
                    ? `1.5px solid ${z.colors.from}66`
                    : "1.5px solid rgba(255,255,255,0.06)",
                  boxShadow: isActive ? `0 0 12px ${z.colors.glow}` : "none",
                }}>
                <span className="text-2xl" style={{ filter: isActive ? `drop-shadow(0 0 6px ${z.colors.from})` : "none" }}>
                  {z.emoji}
                </span>
                <span className="text-[10px] font-semibold text-center leading-tight"
                  style={{ color: isActive ? z.colors.text : "rgba(255,255,255,0.5)" }}>
                  {z.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Основной баннер ──────────────────────────────────────────────────────────
export function ZodiacBanner({
  zodiac,
  onUpdate,
}: {
  zodiac?: string;
  onUpdate: (zodiac: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = ZODIACS.find(z => z.key === zodiac);

  const handleSelect = async (key: string) => {
    setSaving(true);
    try {
      await profilesApi.updateMe({ zodiac: key });
      onUpdate(key);
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  return (
    <>
      <style>{ELEMENT_KEYFRAMES}</style>

      {showPicker && (
        <ZodiacPicker
          current={zodiac ?? ""}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      <button
        onClick={() => setShowPicker(true)}
        className="w-full relative overflow-hidden rounded-2xl text-left active:scale-[0.98] transition-transform"
        style={current ? {
          background: `linear-gradient(135deg, ${current.colors.from}20, ${current.colors.to}15)`,
          border: `1px solid ${current.colors.from}35`,
          boxShadow: `0 2px 16px ${current.colors.glow}`,
          ["--zodiac-glow" as string]: current.colors.glow,
        } : {
          background: "rgba(255,255,255,0.04)",
          border: "1.5px dashed rgba(255,255,255,0.15)",
        }}>

        {/* Частицы стихии */}
        {current && <ElementParticles element={current.element} color={current.colors.from} />}

        {/* Shimmer */}
        {current && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 bottom-0 w-1/3 opacity-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${current.colors.text}, transparent)`,
                animation: "shimmer-slide 3s ease-in-out infinite",
              }} />
          </div>
        )}

        <div className="relative z-10 flex items-center gap-3 px-4 py-3">
          {current ? (
            <>
              {/* Эмодзи с анимацией */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{
                  background: `linear-gradient(135deg, ${current.colors.from}30, ${current.colors.to}20)`,
                  border: `1px solid ${current.colors.from}40`,
                  animation: "zodiac-float 3s ease-in-out infinite",
                  boxShadow: `0 0 12px ${current.colors.glow}`,
                }}>
                {current.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: current.colors.text }}>
                    {current.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                    style={{ background: `${current.colors.from}25`, color: current.colors.text, opacity: 0.8 }}>
                    {current.element === "fire" ? "🔥 Огонь" :
                     current.element === "water" ? "💧 Вода" :
                     current.element === "air" ? "💨 Воздух" : "🌿 Земля"}
                  </span>
                </div>
                <p className="text-white/35 text-[11px] mt-0.5">{current.dates}</p>
              </div>

              <div className="flex-shrink-0 opacity-40">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.15)" }}>
                ✨
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-sm font-medium">Знак зодиака</p>
                <p className="text-white/30 text-xs mt-0.5">Нажми, чтобы выбрать</p>
              </div>
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin flex-shrink-0" />}
            </>
          )}
        </div>
      </button>
    </>
  );
}

export default ZodiacBanner;
