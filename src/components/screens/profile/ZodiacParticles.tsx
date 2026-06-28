import { useState } from "react";
import { ZODIACS, ELEMENT_GROUPS, PICKER_KEYFRAMES } from "@/components/screens/profile/ZodiacData";
import { ZodiacIcon } from "@/components/screens/profile/ZodiacIcon";

// ── Частицы стихии (фоновая анимация баннера) ─────────────────────────────────
export function ElementParticles({ element, color }: { element: string; color: string }) {
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

// ── Модальный пикер знака зодиака ─────────────────────────────────────────────
export function ZodiacPicker({ current, onSelect, onClose }: {
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

        {/* Цветной gradient-орб */}
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
          style={{
            background: highlightedZ
              ? `linear-gradient(90deg, transparent, ${highlightedZ.colors.from}60, transparent)`
              : "rgba(255,255,255,0.06)",
            transition: "background 0.4s ease",
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
