import { useState } from "react";
import { profilesApi } from "@/lib/api";

// ── SVG-иконки знаков зодиака ─────────────────────────────────────────────────
function ZodiacIcon({ sign, color, size = 22 }: { sign: string; color: string; size?: number }) {
  const s = size;
  const c = color;
  const props = { fill: "none", stroke: c, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  const icons: Record<string, JSX.Element> = {
    // Овен — два завитка рогов с центральным изгибом
    aries: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M12 20 C12 14, 6 14, 6 9 C6 5, 9 3, 12 6" />
      <path d="M12 20 C12 14, 18 14, 18 9 C18 5, 15 3, 12 6" />
      <circle cx="12" cy="6" r="1.2" fill={c} stroke="none" />
    </svg>,

    // Телец — круг с рогами наверху
    taurus: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="14" r="5.5" />
      <path d="M6.5 8.5 C6.5 5, 9 3.5, 12 3.5" />
      <path d="M17.5 8.5 C17.5 5, 15 3.5, 12 3.5" />
    </svg>,

    // Близнецы — две параллельные колонны с горизонталями
    gemini: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <line x1="8" y1="4" x2="8" y2="20" />
      <line x1="16" y1="4" x2="16" y2="20" />
      <path d="M5 4 C7 3, 9 4, 12 4 C15 4, 17 3, 19 4" />
      <path d="M5 20 C7 21, 9 20, 12 20 C15 20, 17 21, 19 20" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>,

    // Рак — два завитка (клешни) с кругами
    cancer: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M6 8 C4 8, 3 10, 4 12 C5 14, 7 14, 9 12 C11 10, 13 10, 15 12 C17 14, 19 14, 20 12 C21 10, 20 8, 18 8" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="7" r="2" />
    </svg>,

    // Лев — завиток с хвостом и гривой
    leo: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <circle cx="11" cy="10" r="4.5" />
      <path d="M15.5 10 C17 10, 19 11, 20 13 C21 15, 20.5 18, 19 19 C17.5 20, 16 19.5, 15.5 18" />
      <path d="M7 6 C5 4, 4 3, 5 2" strokeWidth={1.2} />
      <path d="M9 5 C8 3, 8 2, 10 2" strokeWidth={1.2} />
      <path d="M11 5 C11 3, 12 2, 13 2" strokeWidth={1.2} />
    </svg>,

    // Дева — буква M с петлёй
    virgo: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M6 4 L6 16 C6 18.5, 7.5 20, 10 20 C12.5 20, 14 18.5, 14 16 L14 4" />
      <path d="M6 12 C6 12, 10 12, 10 8 C10 5.5, 8.5 4, 7 4" />
      <path d="M14 12 C14 12, 18 12, 18 8 C18 5.5, 16.5 4, 15 4" />
      <path d="M14 16 C14 18.5, 15.5 20, 17 20" />
    </svg>,

    // Весы — чаши весов на перекладине
    libra: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <line x1="4" y1="19" x2="20" y2="19" />
      <line x1="12" y1="4" x2="12" y2="19" />
      <line x1="6" y1="8" x2="18" y2="8" />
      <path d="M6 8 L4 13 Q6 15, 8 13 L6 8" />
      <path d="M18 8 L16 13 Q18 15, 20 13 L18 8" />
    </svg>,

    // Скорпион — буква M со стрелой-хвостом
    scorpio: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M4 4 L4 14 C4 16, 5.5 17, 7 17" />
      <path d="M4 10 C4 10, 8 10, 8 6 C8 4, 6.5 3, 5 4" />
      <path d="M12 4 L12 14 C12 16, 13.5 17, 15 17" />
      <path d="M12 10 C12 10, 16 10, 16 6 C16 4, 14.5 3, 13 4" />
      <path d="M15 17 C17 17, 19 16, 20 14 C21 12, 20 10, 20 10" />
      <polyline points="18,8 20,10 22,8" />
    </svg>,

    // Стрелец — стрела по диагонали с крестом
    sagittarius: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <line x1="5" y1="19" x2="19" y2="5" strokeWidth={2} />
      <polyline points="12,5 19,5 19,12" />
      <line x1="5" y1="11" x2="11" y2="11" strokeWidth={1.2} />
      <line x1="13" y1="19" x2="13" y2="13" strokeWidth={1.2} />
    </svg>,

    // Козерог — буква V с завитком
    capricorn: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M5 4 L5 15 C5 18, 7 20, 10 20 C13 20, 15 18, 15 15 L15 12" />
      <path d="M5 10 C5 10, 9 10, 9 6 C9 4, 7.5 3, 6 4" />
      <path d="M15 12 C16 14, 18 16, 20 14 C22 12, 21 9, 19 10" />
    </svg>,

    // Водолей — две волнистые линии
    aquarius: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M3 9 C5 7, 7 11, 9 9 C11 7, 13 11, 15 9 C17 7, 19 11, 21 9" strokeWidth={2} />
      <path d="M3 15 C5 13, 7 17, 9 15 C11 13, 13 17, 15 15 C17 13, 19 17, 21 15" strokeWidth={2} />
    </svg>,

    // Рыбы — две дуги рыб со связкой
    pisces: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M12 4 C8 4, 4 7, 4 12 C4 17, 8 20, 12 20" />
      <path d="M12 4 C16 4, 20 7, 20 12 C20 17, 16 20, 12 20" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <path d="M9 4 C10 2, 12 2, 14 4" />
      <path d="M9 20 C10 22, 12 22, 14 20" />
    </svg>,
  };

  return icons[sign] ?? <svg width={s} height={s} viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="8"/></svg>;
}

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
const PICKER_KEYFRAMES = `
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

const ELEMENT_GROUPS = [
  { element: "fire",  label: "Огонь",  icon: "🔥", signs: ["aries","leo","sagittarius"],   bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)"  },
  { element: "earth", label: "Земля",  icon: "🌿", signs: ["taurus","virgo","capricorn"],  bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)"  },
  { element: "air",   label: "Воздух", icon: "💨", signs: ["gemini","libra","aquarius"],   bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)"  },
  { element: "water", label: "Вода",   icon: "💧", signs: ["cancer","scorpio","pisces"],   bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)" },
];

function ZodiacPicker({ current, onSelect, onClose }: {
  current: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const highlighted = hovered ?? current;
  const highlightedZ = ZODIACS.find(z => z.key === highlighted);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", animation: "picker-fade-in 0.2s ease" }}
      onClick={onClose}>

      <style>{PICKER_KEYFRAMES}</style>

      <div className="relative overflow-hidden"
        style={{
          borderRadius: "28px 28px 0 0",
          background: "linear-gradient(170deg,#1c0d30 0%,#0e0720 50%,#080410 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          animation: "picker-slide-up 0.35s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: highlightedZ ? `0 -8px 60px ${highlightedZ.colors.glow}` : "0 -4px 40px rgba(0,0,0,0.6)",
          transition: "box-shadow 0.4s ease",
        }}
        onClick={e => e.stopPropagation()}>

        {/* Фоновые звёзды */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                width: i % 3 === 0 ? 2 : 1,
                height: i % 3 === 0 ? 2 : 1,
                left: `${(i * 17 + 5) % 95}%`,
                top: `${(i * 23 + 8) % 80}%`,
                animation: `star-twinkle ${1.5 + (i % 4) * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.18}s`,
              }} />
          ))}
        </div>

        {/* Цветной gradient-орб под активным знаком */}
        {highlightedZ && (
          <div className="absolute pointer-events-none"
            style={{
              width: 200, height: 200,
              top: -60, right: -40,
              background: `radial-gradient(circle, ${highlightedZ.colors.from}30, transparent 70%)`,
              transition: "background 0.4s ease",
            }} />
        )}

        {/* Шапка */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <p className="text-white font-black text-lg tracking-tight">✨ Знак зодиака</p>
            <p className="text-white/40 text-xs mt-0.5">
              {highlightedZ
                ? <span style={{ color: highlightedZ.colors.text }}>{highlightedZ.label} · {highlightedZ.dates}</span>
                : "Выбери свой знак"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Разделитель с градиентом */}
        <div className="mx-5 mb-3 h-px"
          style={{ background: highlightedZ
            ? `linear-gradient(90deg, transparent, ${highlightedZ.colors.from}60, transparent)`
            : "rgba(255,255,255,0.06)",
            transition: "background 0.4s ease"
          }} />

        {/* Группы по стихиям */}
        <div className="px-4 pb-8 flex flex-col gap-3">
          {ELEMENT_GROUPS.map(group => (
            <div key={group.element}>
              {/* Лейбл стихии */}
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <span className="text-sm">{group.icon}</span>
                <span className="text-white/35 text-[11px] font-bold uppercase tracking-widest">{group.label}</span>
                <div className="flex-1 h-px ml-1" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>

              {/* Карточки знаков */}
              <div className="grid grid-cols-3 gap-2">
                {group.signs.map(key => {
                  const z = ZODIACS.find(x => x.key === key)!;
                  const isActive = current === z.key;
                  const isHighlighted = highlighted === z.key;
                  return (
                    <button key={z.key}
                      onClick={() => { onSelect(z.key); onClose(); }}
                      onMouseEnter={() => setHovered(z.key)}
                      onMouseLeave={() => setHovered(null)}
                      className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl transition-all active:scale-95"
                      style={{
                        background: isActive
                          ? `linear-gradient(145deg, ${z.colors.from}35, ${z.colors.to}20)`
                          : isHighlighted
                            ? `${z.colors.from}18`
                            : "rgba(255,255,255,0.03)",
                        border: isActive
                          ? `1.5px solid ${z.colors.from}70`
                          : isHighlighted
                            ? `1.5px solid ${z.colors.from}35`
                            : "1.5px solid rgba(255,255,255,0.05)",
                        boxShadow: isActive ? `0 4px 20px ${z.colors.glow}, inset 0 1px 0 ${z.colors.from}20` : "none",
                      }}>

                      {/* Иконка в круглом контейнере */}
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${z.colors.from}40, ${z.colors.to}25)`
                            : "rgba(255,255,255,0.05)",
                          border: isActive ? `1px solid ${z.colors.from}50` : "1px solid rgba(255,255,255,0.07)",
                          boxShadow: isActive ? `0 0 16px ${z.colors.glow}` : "none",
                          filter: isActive ? `drop-shadow(0 0 6px ${z.colors.from}88)` : "none",
                          transition: "all 0.25s ease",
                        }}>
                        <ZodiacIcon
                          sign={z.key}
                          color={isActive ? z.colors.text : "rgba(255,255,255,0.35)"}
                          size={24}
                        />
                      </div>

                      {/* Название */}
                      <span className="text-[11px] font-bold text-center leading-tight"
                        style={{ color: isActive ? z.colors.text : "rgba(255,255,255,0.5)" }}>
                        {z.label}
                      </span>

                      {/* Активная точка */}
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full"
                          style={{ background: z.colors.from, boxShadow: `0 0 6px ${z.colors.from}` }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
              {/* SVG иконка с анимацией */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${current.colors.from}30, ${current.colors.to}20)`,
                  border: `1px solid ${current.colors.from}40`,
                  animation: "zodiac-float 3s ease-in-out infinite",
                  boxShadow: `0 0 14px ${current.colors.glow}`,
                  filter: `drop-shadow(0 0 4px ${current.colors.from}88)`,
                }}>
                <ZodiacIcon sign={current.key} color={current.colors.text} size={22} />
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

// ── Read-only баннер для чужого профиля ──────────────────────────────────────
export function ZodiacBadge({ zodiac }: { zodiac: string }) {
  const current = ZODIACS.find(z => z.key === zodiac);
  if (!current) return null;

  return (
    <>
      <style>{ELEMENT_KEYFRAMES}</style>
      <div className="w-full relative overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${current.colors.from}20, ${current.colors.to}15)`,
          border: `1px solid ${current.colors.from}35`,
          boxShadow: `0 2px 16px ${current.colors.glow}`,
        }}>

        <ElementParticles element={current.element} color={current.colors.from} />

        {/* Shimmer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 bottom-0 w-1/3 opacity-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${current.colors.text}, transparent)`,
              animation: "shimmer-slide 3s ease-in-out infinite",
            }} />
        </div>

        <div className="relative z-10 flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${current.colors.from}30, ${current.colors.to}20)`,
              border: `1px solid ${current.colors.from}40`,
              animation: "zodiac-float 3s ease-in-out infinite",
              boxShadow: `0 0 14px ${current.colors.glow}`,
              filter: `drop-shadow(0 0 4px ${current.colors.from}88)`,
            }}>
            <ZodiacIcon sign={current.key} color={current.colors.text} size={22} />
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
        </div>
      </div>
    </>
  );
}

export default ZodiacBanner;