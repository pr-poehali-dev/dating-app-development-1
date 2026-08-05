import { useEffect, useRef, useState } from "react";
import { GiftScene, GIFT_SCENE_KEYFRAMES, type GiftSceneCategory } from "./GiftScenes";

interface AnimatedGiftProps {
  size?: number;
  /** Категория персонажа */
  category?: GiftSceneCategory;
  /** Вариант (влияет на цвет) */
  variant?: number;
  /** Показывать анимированный фон-подложку (как в Telegram) */
  withBackground?: boolean;
  /** Запустить приветственную анимацию появления (при отправке/открытии) */
  burst?: boolean;
  /** Цветовая тема фона */
  bgFrom?: string;
  bgTo?: string;
}

// У каждого подарка (по variant) — свой уникальный градиент фона.
// 8 вариантов на категорию: от простого к премиальному.
const BG_PALETTE: Record<GiftSceneCategory, [string, string][]> = {
  heart: [
    ["#8B3A52", "#4A1D2E"], ["#B5304E", "#5A1626"], ["#C24A2E", "#5A1E14"], ["#B8862B", "#5A3E10"],
    ["#2E6E8B", "#123444"], ["#5A3E8B", "#241A44"], ["#3A4A55", "#161E24"], ["#B5407A", "#5A1E3D"],
  ],
  rose: [
    ["#8B2E44", "#4A1622"], ["#B54A7A", "#5A1E3D"], ["#7A2E55", "#3D162A"], ["#C2306E", "#5A1636"],
    ["#B8862B", "#5A3E10"], ["#6E4AA0", "#2E1E52"], ["#B53A3A", "#5A1616"], ["#C2508B", "#5A2444"],
  ],
  bear: [
    ["#7A5A3A", "#3D2A1A"], ["#A06A2E", "#4A2E10"], ["#6E5A4A", "#2E241E"], ["#3A4E5A", "#161E24"],
    ["#B8862B", "#5A3E10"], ["#5A3E2A", "#241A10"], ["#8B6A3A", "#44301A"], ["#5A4030", "#241810"],
  ],
  ring: [
    ["#B8862B", "#5A3E10"], ["#5A6A7A", "#242E38"], ["#B89030", "#5A4410"], ["#B53A3A", "#5A1616"],
    ["#2E7A9A", "#12364A"], ["#B89040", "#5A4416"], ["#6E4AA0", "#2E1E52"], ["#B8A050", "#5A4A20"],
  ],
  special: [
    ["#8B4A52", "#5A2A33"], ["#3A6E7A", "#163438"], ["#7A5A9A", "#2E1E4A"], ["#9A6A3A", "#4A301A"],
    ["#5A7A3A", "#243818"], ["#9A3A6A", "#4A1636"], ["#3A5A9A", "#16244A"], ["#7A3A3A", "#381616"],
    ["#8B2E6E", "#1B1030"],
  ],
};

// Разные стили движения персонажа по variant
const MOTION = ["gsFloat", "gsBob", "gsSwayBig", "gsBounce", "gsPendulum", "gsFloat", "gsBounce", "gsSwayBig"];
// Разные анимации появления при отправке
const APPEAR = ["agPopIn", "agDropIn", "agSpinIn", "agZoomIn", "agFlipIn", "agPopIn", "agSpinIn", "agDropIn"];

/**
 * Анимированный подарок «в стиле Telegram»: живой SVG-персонаж, у которого
 * независимо двигаются части (лепестки, лапки, блики), а не трясётся картинка.
 * Работает офлайн, без внешних файлов.
 */
export default function AnimatedGift({
  size = 200,
  category = "special",
  variant = 0,
  withBackground = true,
  burst = false,
  bgFrom,
  bgTo,
}: AnimatedGiftProps) {
  const [playBurst, setPlayBurst] = useState(false);
  const prevBurst = useRef(false);

  const palette = BG_PALETTE[category] || BG_PALETTE.special;
  const [themeFrom, themeTo] = palette[variant % palette.length];
  const gradFrom = bgFrom ?? themeFrom;
  const gradTo = bgTo ?? themeTo;
  const motionAnim = MOTION[variant % MOTION.length];
  const appearAnim = APPEAR[variant % APPEAR.length];
  // Угол градиента тоже разный — фон визуально отличается
  const gradAngle = 40 + (variant % 8) * 15;

  useEffect(() => {
    if (burst && !prevBurst.current) {
      setPlayBurst(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setPlayBurst(true)));
      const t = setTimeout(() => setPlayBurst(false), 900);
      return () => clearTimeout(t);
    }
    prevBurst.current = burst;
  }, [burst]);

  const pattern = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><g fill="rgba(255,255,255,0.10)"><path d="M30 22c-6 0-10 4-10 9 0 4 3 7 7 8l-1 4h8l-1-4c4-1 7-4 7-8 0-5-4-9-10-9zm-13 6c-3 0-5 2-5 4s2 3 4 3l1-7zm26 0l1 7c2 0 4-1 4-3s-2-4-5-4z"/></g></svg>`
  );

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes agSpinGlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes agBurst { 0% { transform: scale(0.3); opacity: 0.9; } 100% { transform: scale(2.2); opacity: 0; } }
        /* Появления */
        @keyframes agPopIn   { 0% { transform: scale(0.2) rotate(-20deg); opacity: 0; } 60% { transform: scale(1.1) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes agDropIn  { 0% { transform: translateY(-120%) scale(0.6); opacity: 0; } 70% { transform: translateY(6%) scale(1.05); opacity: 1; } 100% { transform: translateY(0) scale(1); } }
        @keyframes agSpinIn  { 0% { transform: rotate(-360deg) scale(0.2); opacity: 0; } 100% { transform: rotate(0deg) scale(1); opacity: 1; } }
        @keyframes agZoomIn  { 0% { transform: scale(2.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes agFlipIn  { 0% { transform: perspective(400px) rotateY(90deg) scale(0.6); opacity: 0; } 100% { transform: perspective(400px) rotateY(0deg) scale(1); opacity: 1; } }
        /* Движения (idle) — gsFloat/gsSway уже в GIFT_SCENE_KEYFRAMES */
        @keyframes gsBob       { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8%); } }
        @keyframes gsSwayBig   { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
        @keyframes gsBounce    { 0%,100% { transform: translateY(0) scaleY(1); } 30% { transform: translateY(-12%) scaleY(1.05); } 55% { transform: translateY(0) scaleY(0.95); } 70% { transform: translateY(-4%) scaleY(1.02); } }
        @keyframes gsPendulum  { 0%,100% { transform: rotate(-9deg) translateY(0); } 50% { transform: rotate(9deg) translateY(-3%); } }
        ${GIFT_SCENE_KEYFRAMES}
      `}</style>

      {withBackground && (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%, ${gradFrom} 0%, ${gradTo} 100%)` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${gradAngle}deg, ${gradFrom}00 0%, ${gradTo}88 100%)`, mixBlendMode: "overlay" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,${pattern}")`, backgroundSize: `${size * 0.3}px ${size * 0.3}px`, opacity: 0.4 }} />
          <div style={{ position: "absolute", width: size * 1.4, height: size * 1.4, left: "50%", top: "50%", marginLeft: -(size * 1.4) / 2, marginTop: -(size * 1.4) / 2, background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.16) 20%, transparent 40%)", animation: "agSpinGlow 8s linear infinite", pointerEvents: "none" }} />
        </>
      )}

      {playBurst && (
        <div style={{ position: "absolute", width: size * 0.7, height: size * 0.7, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,220,120,0.95) 0%, transparent 65%)", animation: "agBurst 0.85s ease-out forwards", pointerEvents: "none", zIndex: 4 }} />
      )}

      {/* Живой SVG-персонаж: своя idle-анимация и своё появление по variant */}
      <div style={{ position: "relative", width: size * 0.82, height: size * 0.82, zIndex: 2, animation: playBurst ? `${appearAnim} 0.7s cubic-bezier(0.22,1,0.36,1)` : `${motionAnim} ${2.6 + (variant % 4) * 0.4}s ease-in-out infinite` }}>
        <GiftScene category={category} variant={variant} />
      </div>
    </div>
  );
}