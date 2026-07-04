/**
 * Живые SVG-персонажи подарков. У каждого независимо двигаются части
 * (лепестки, лапки, блики, грани), а не трясётся вся картинка целиком.
 * Работает офлайн, без внешних файлов.
 */

interface SceneProps {
  variant?: number;
}

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
`;

// Цвета сердец по variant
const HEART_COLORS = ["#FF4D6D", "#FF2D55", "#FF6B35", "#FFB300", "#4FC3F7", "#B388FF", "#546E7A", "#FF7AB0"];
const ROSE_COLORS = ["#E63950", "#FF6B9D", "#C2185B", "#FF4081", "#FFB300", "#BA68C8", "#EF5350", "#F06292"];
const BEAR_COLORS = ["#A9713E", "#C68642", "#8D6E63", "#455A64", "#D4A017", "#6D4C41", "#B08D57", "#795548"];
const RING_COLORS = ["#FFD700", "#C0C0C0", "#FFC107", "#E53935", "#4FC3F7", "#FFD700", "#B388FF", "#FFECB3"];

function pick(arr: string[], v: number) { return arr[v % arr.length]; }

// ─── Сердце ──────────────────────────────────────────────────────────────────
export function HeartScene({ variant = 0 }: SceneProps) {
  const c = pick(HEART_COLORS, variant);
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} style={{ transformOrigin: "100px 100px", animation: `gsTwinkle 2.2s ${i * 0.4}s ease-in-out infinite` }}>
          <circle cx={100 + [55, -55, 45, -45][i]} cy={100 + [-40, -30, 45, 40][i]} r="5" fill="#fff" />
        </g>
      ))}
      <g style={{ transformOrigin: "100px 105px", animation: "gsPulse 1.1s ease-in-out infinite" }}>
        <path d="M100 165 C40 120 30 75 60 55 C82 40 100 60 100 72 C100 60 118 40 140 55 C170 75 160 120 100 165 Z" fill={c} />
        <path d="M78 72 C72 66 66 70 68 80 C72 74 78 76 78 72 Z" fill="rgba(255,255,255,0.6)" />
      </g>
    </svg>
  );
}

// ─── Роза ────────────────────────────────────────────────────────────────────
export function RoseScene({ variant = 0 }: SceneProps) {
  const c = pick(ROSE_COLORS, variant);
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      {/* Стебель (гнётся) */}
      <g style={{ transformOrigin: "100px 170px", animation: "gsSway 3s ease-in-out infinite" }}>
        <path d="M100 175 Q96 130 100 95" stroke="#2E7D32" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M100 140 Q78 128 70 145 Q92 150 100 140 Z" fill="#43A047" style={{ transformOrigin: "100px 140px", animation: "gsPetal 2.4s ease-in-out infinite" }} />
        <path d="M100 120 Q122 108 130 125 Q108 130 100 120 Z" fill="#43A047" style={{ transformOrigin: "100px 120px", animation: "gsPetal 2.4s 0.3s ease-in-out infinite" }} />
        {/* Бутон (покачивается) */}
        <g style={{ transformOrigin: "100px 80px", animation: "gsFloat 2.6s ease-in-out infinite" }}>
          <circle cx="100" cy="78" r="34" fill={c} />
          <path d="M100 78 Q78 60 100 48 Q122 60 100 78 Z" fill="rgba(0,0,0,0.12)" />
          <path d="M100 78 Q118 66 122 88 Q104 92 100 78 Z" fill="rgba(255,255,255,0.22)" />
          <circle cx="100" cy="76" r="10" fill="rgba(0,0,0,0.18)" />
        </g>
      </g>
    </svg>
  );
}

// ─── Мишка ───────────────────────────────────────────────────────────────────
export function BearScene({ variant = 0 }: SceneProps) {
  const c = pick(BEAR_COLORS, variant);
  const belly = "#E8C39E";
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      {/* Тело */}
      <g style={{ transformOrigin: "100px 150px", animation: "gsFloat 2.4s ease-in-out infinite" }}>
        <ellipse cx="100" cy="140" rx="42" ry="38" fill={c} />
        <ellipse cx="100" cy="148" rx="26" ry="24" fill={belly} />
        {/* Машущая лапка */}
        <g style={{ transformOrigin: "138px 120px", animation: "gsWave 1s ease-in-out infinite" }}>
          <ellipse cx="146" cy="112" rx="13" ry="16" fill={c} />
        </g>
        <ellipse cx="58" cy="150" rx="13" ry="16" fill={c} />
        {/* Ножки */}
        <ellipse cx="80" cy="176" rx="14" ry="10" fill={c} />
        <ellipse cx="120" cy="176" rx="14" ry="10" fill={c} />
      </g>
      {/* Голова */}
      <g style={{ transformOrigin: "100px 80px", animation: "gsHead 2.6s ease-in-out infinite" }}>
        {/* Ушки */}
        <circle cx="68" cy="52" r="15" fill={c} />
        <circle cx="132" cy="52" r="15" fill={c} />
        <circle cx="68" cy="52" r="7" fill={belly} />
        <circle cx="132" cy="52" r="7" fill={belly} />
        {/* Морда */}
        <circle cx="100" cy="80" r="40" fill={c} />
        <ellipse cx="100" cy="94" rx="24" ry="20" fill={belly} />
        {/* Глаза (моргают) */}
        <g style={{ transformOrigin: "84px 74px", animation: "gsBlink 3.2s ease-in-out infinite" }}>
          <circle cx="84" cy="74" r="6" fill="#2A1A0E" />
          <circle cx="86" cy="72" r="2" fill="#fff" />
        </g>
        <g style={{ transformOrigin: "116px 74px", animation: "gsBlink 3.2s ease-in-out infinite" }}>
          <circle cx="116" cy="74" r="6" fill="#2A1A0E" />
          <circle cx="118" cy="72" r="2" fill="#fff" />
        </g>
        {/* Носик */}
        <ellipse cx="100" cy="90" rx="6" ry="4.5" fill="#2A1A0E" />
        <path d="M100 94 Q92 102 86 98 M100 94 Q108 102 114 98" stroke="#2A1A0E" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─── Кольцо ──────────────────────────────────────────────────────────────────
export function RingScene({ variant = 0 }: SceneProps) {
  const metal = pick(RING_COLORS, variant);
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      {/* Искры вокруг */}
      {[0, 1, 2].map((i) => (
        <g key={i} style={{ transformOrigin: "100px 118px", animation: `gsTwinkle 2s ${i * 0.5}s ease-in-out infinite` }}>
          <path d={`M${[150, 55, 100][i]} ${[70, 80, 40][i]} l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z`} fill="#fff" />
        </g>
      ))}
      {/* Кольцо (медленно вращается) */}
      <g style={{ transformOrigin: "100px 125px", animation: "gsFloat 3s ease-in-out infinite" }}>
        <ellipse cx="100" cy="132" rx="34" ry="38" fill="none" stroke={metal} strokeWidth="12" />
        <ellipse cx="100" cy="132" rx="34" ry="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
        {/* Бриллиант (сверкает) */}
        <g style={{ transformOrigin: "100px 78px", animation: "gsShimmer 1.4s ease-in-out infinite" }}>
          <path d="M100 55 L120 74 L100 100 L80 74 Z" fill="#B3E5FC" />
          <path d="M100 55 L120 74 L100 74 Z" fill="#E1F5FE" />
          <path d="M100 55 L80 74 L100 74 Z" fill="#81D4FA" />
          <path d="M80 74 L100 100 L100 74 Z" fill="#4FC3F7" />
          <path d="M120 74 L100 100 L100 74 Z" fill="#29B6F6" />
        </g>
      </g>
    </svg>
  );
}

// ─── Пёс (special) ───────────────────────────────────────────────────────────
export function DogScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}>
      {/* Хвост */}
      <g style={{ transformOrigin: "56px 128px", animation: "gsSway 0.6s ease-in-out infinite" }}>
        <path d="M56 128 Q30 120 26 96 Q40 108 58 118 Z" fill="#7A5230" />
      </g>
      <ellipse cx="72" cy="168" rx="14" ry="9" fill="#6B4423" />
      <ellipse cx="128" cy="168" rx="14" ry="9" fill="#6B4423" />
      {/* Корпус */}
      <g style={{ transformOrigin: "100px 150px", animation: "gsFloat 0.9s ease-in-out infinite" }}>
        <ellipse cx="100" cy="140" rx="46" ry="40" fill="#A9713E" />
        <ellipse cx="100" cy="150" rx="30" ry="26" fill="#E8C39E" />
        <ellipse cx="84" cy="176" rx="12" ry="8" fill="#8A5A2B" />
        <ellipse cx="116" cy="176" rx="12" ry="8" fill="#8A5A2B" />
      </g>
      {/* Голова */}
      <g style={{ transformOrigin: "100px 90px", animation: "gsHead 2s ease-in-out infinite" }}>
        <g style={{ transformOrigin: "66px 62px", animation: "gsPetal 1.2s ease-in-out infinite" }}>
          <path d="M66 62 Q46 66 50 100 Q64 92 74 78 Z" fill="#7A5230" />
        </g>
        <g style={{ transformOrigin: "134px 62px", animation: "gsPetal 1.2s 0.2s ease-in-out infinite" }}>
          <path d="M134 62 Q154 66 150 100 Q136 92 126 78 Z" fill="#7A5230" />
        </g>
        <circle cx="100" cy="86" r="42" fill="#A9713E" />
        <ellipse cx="100" cy="104" rx="30" ry="26" fill="#E8C39E" />
        <g style={{ transformOrigin: "86px 82px", animation: "gsBlink 3.4s ease-in-out infinite" }}>
          <circle cx="86" cy="82" r="7" fill="#2A1A0E" /><circle cx="88" cy="79" r="2.4" fill="#fff" />
        </g>
        <g style={{ transformOrigin: "114px 82px", animation: "gsBlink 3.4s ease-in-out infinite" }}>
          <circle cx="114" cy="82" r="7" fill="#2A1A0E" /><circle cx="116" cy="79" r="2.4" fill="#fff" />
        </g>
        <ellipse cx="100" cy="100" rx="7" ry="5" fill="#2A1A0E" />
        <g style={{ transformOrigin: "100px 108px", animation: "gsPulse 0.7s ease-in-out infinite" }}>
          <path d="M94 108 Q100 124 106 108 Z" fill="#FF7A8A" />
        </g>
      </g>
    </svg>
  );
}

export type GiftSceneCategory = "heart" | "rose" | "bear" | "ring" | "special";

export function GiftScene({ category, variant = 0 }: { category: GiftSceneCategory; variant?: number }) {
  switch (category) {
    case "heart":   return <HeartScene variant={variant} />;
    case "rose":    return <RoseScene variant={variant} />;
    case "bear":    return <BearScene variant={variant} />;
    case "ring":    return <RingScene variant={variant} />;
    case "special": return <DogScene />;
  }
}

export default GiftScene;
