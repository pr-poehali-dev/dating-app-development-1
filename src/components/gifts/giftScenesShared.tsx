/* eslint-disable react-refresh/only-export-components */
/**
 * Общие keyframes, цветовые палитры и переиспользуемые декоративные
 * SVG-элементы (искры, крылья, корона, ореол), на которых строятся
 * все сцены подарков в GiftScenesPrimary/GiftScenesSpecial.
 */

// ─── Общие keyframes для всех сцен ───────────────────────────────────────────
export const GIFT_SCENE_KEYFRAMES = `
  @keyframes gsPulse    { 0%,100% { transform: scale(1); } 45% { transform: scale(1.12); } 60% { transform: scale(1.04); } }
  @keyframes gsFloat    { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-5%) rotate(2deg); } }
  @keyframes gsSpin     { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes gsSway     { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
  @keyframes gsBlink    { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
  @keyframes gsWave     { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-22deg); } }
  @keyframes gsHead     { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
  @keyframes gsTwinkle  { 0%,60%,100% { transform: scale(0); opacity: 0; } 75% { transform: scale(1.3); opacity: 1; } }
  @keyframes gsPetal    { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(6deg); } }
  @keyframes gsShimmer  { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
  @keyframes gsWingFlap { 0%,100% { transform: rotateY(0deg) scaleX(1); } 50% { transform: rotateY(0deg) scaleX(0.82); } }
  @keyframes gsFlame    { 0%,100% { transform: scaleY(1) scaleX(1); } 50% { transform: scaleY(1.18) scaleX(0.9); } }
  @keyframes gsBob      { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8%); } }
  @keyframes gsBounce   { 0%,100% { transform: translateY(0) scaleY(1); } 30% { transform: translateY(-12%) scaleY(1.05); } 55% { transform: translateY(0) scaleY(0.95); } 70% { transform: translateY(-4%) scaleY(1.02); } }
  @keyframes gsSwayBig  { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
`;

// Цвета по variant
export const HEART_COLORS = ["#FF4D6D", "#FF2D55", "#FF6B35", "#FFB300", "#4FC3F7", "#B388FF", "#1a1a1a", "#FF7AB0"];
export const ROSE_COLORS = ["#E63950", "#FF6B9D", "#C2185B", "#FF4081", "#FFB300", "#BA68C8", "#EF5350", "#F06292"];
export const BEAR_COLORS = ["#A9713E", "#C68642", "#8D6E63", "#2A2A2A", "#D4A017", "#6D4C41", "#B08D57", "#795548"];
export const RING_COLORS = ["#FFD700", "#C0C0C0", "#FFC107", "#E53935", "#4FC3F7", "#FFD700", "#B388FF", "#FFECB3"];
export const RAINBOW = ["#FF4D6D", "#FF9800", "#FFEB3B", "#4CAF50", "#29B6F6", "#7C4DFF"];

export function pick(arr: string[], v: number) { return arr[v % arr.length]; }
/** 0=common 1=rare 2=epic 3=legendary — совпадает с шагом редкости в GIFTS */
export function tierOf(variant: number) { return variant < 2 ? 0 : variant < 4 ? 1 : variant < 6 ? 2 : 3; }

// ─── Общие декоративные элементы (растут вместе с редкостью) ─────────────────
export function Sparkles({ cx, cy, r, count = 4 }: { cx: number; cy: number; r: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return (
          <g key={i} style={{ transformOrigin: `${x}px ${y}px`, animation: `gsTwinkle 2.1s ${i * 0.3}s ease-in-out infinite` }}>
            <path d={`M${x} ${y - 5} l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6 z`} fill="#fff" />
          </g>
        );
      })}
    </>
  );
}

export function Wings({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <g style={{ transformOrigin: `${cx - 6}px ${cy}px`, animation: "gsWingFlap 1s ease-in-out infinite" }}>
        <path d={`M${cx - 6} ${cy} C${cx - 40} ${cy - 22} ${cx - 52} ${cy - 4} ${cx - 44} ${cy + 14} C${cx - 30} ${cy + 6} ${cx - 14} ${cy + 6} ${cx - 6} ${cy} Z`} fill="rgba(255,255,255,0.85)" />
      </g>
      <g style={{ transformOrigin: `${cx + 6}px ${cy}px`, animation: "gsWingFlap 1s 0.1s ease-in-out infinite" }}>
        <path d={`M${cx + 6} ${cy} C${cx + 40} ${cy - 22} ${cx + 52} ${cy - 4} ${cx + 44} ${cy + 14} C${cx + 30} ${cy + 6} ${cx + 14} ${cy + 6} ${cx + 6} ${cy} Z`} fill="rgba(255,255,255,0.85)" />
      </g>
    </>
  );
}

export function Crown({ cx, top }: { cx: number; top: number }) {
  return (
    <g style={{ transformOrigin: `${cx}px ${top}px`, animation: "gsBob 1.6s ease-in-out infinite" }}>
      <path d={`M${cx - 20} ${top + 16} L${cx - 20} ${top} L${cx - 10} ${top + 10} L${cx} ${top - 8} L${cx + 10} ${top + 10} L${cx + 20} ${top} L${cx + 20} ${top + 16} Z`} fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
      <circle cx={cx} cy={top + 4} r="3" fill="#FF4D6D" />
      <circle cx={cx - 12} cy={top + 10} r="2.2" fill="#4FC3F7" />
      <circle cx={cx + 12} cy={top + 10} r="2.2" fill="#4FC3F7" />
    </g>
  );
}

export function HaloRing({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6 8" opacity="0.55"
      style={{ transformOrigin: `${cx}px ${cy}px`, animation: "gsSpin 6s linear infinite" }} />
  );
}