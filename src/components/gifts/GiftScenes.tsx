/**
 * Живые SVG-персонажи подарков. У каждого независимо двигаются части
 * (лепестки, лапки, блики, грани, крылья), а форма и декор меняются
 * по variant — от простых до легендарных. Работает офлайн, без внешних файлов.
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
  @keyframes gsWingFlap { 0%,100% { transform: rotateY(0deg) scaleX(1); } 50% { transform: rotateY(0deg) scaleX(0.82); } }
  @keyframes gsFlame    { 0%,100% { transform: scaleY(1) scaleX(1); } 50% { transform: scaleY(1.18) scaleX(0.9); } }
  @keyframes gsBob      { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8%); } }
  @keyframes gsBounce   { 0%,100% { transform: translateY(0) scaleY(1); } 30% { transform: translateY(-12%) scaleY(1.05); } 55% { transform: translateY(0) scaleY(0.95); } 70% { transform: translateY(-4%) scaleY(1.02); } }
  @keyframes gsSwayBig  { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
`;

// Цвета по variant
const HEART_COLORS = ["#FF4D6D", "#FF2D55", "#FF6B35", "#FFB300", "#4FC3F7", "#B388FF", "#1a1a1a", "#FF7AB0"];
const ROSE_COLORS = ["#E63950", "#FF6B9D", "#C2185B", "#FF4081", "#FFB300", "#BA68C8", "#EF5350", "#F06292"];
const BEAR_COLORS = ["#A9713E", "#C68642", "#8D6E63", "#2A2A2A", "#D4A017", "#6D4C41", "#B08D57", "#795548"];
const RING_COLORS = ["#FFD700", "#C0C0C0", "#FFC107", "#E53935", "#4FC3F7", "#FFD700", "#B388FF", "#FFECB3"];
const RAINBOW = ["#FF4D6D", "#FF9800", "#FFEB3B", "#4CAF50", "#29B6F6", "#7C4DFF"];

function pick(arr: string[], v: number) { return arr[v % arr.length]; }
/** 0=common 1=rare 2=epic 3=legendary — совпадает с шагом редкости в GIFTS */
function tierOf(variant: number) { return variant < 2 ? 0 : variant < 4 ? 1 : variant < 6 ? 2 : 3; }

// ─── Общие декоративные элементы (растут вместе с редкостью) ─────────────────
function Sparkles({ cx, cy, r, count = 4 }: { cx: number; cy: number; r: number; count?: number }) {
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

function Wings({ cx, cy }: { cx: number; cy: number }) {
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

function Crown({ cx, top }: { cx: number; top: number }) {
  return (
    <g style={{ transformOrigin: `${cx}px ${top}px`, animation: "gsBob 1.6s ease-in-out infinite" }}>
      <path d={`M${cx - 20} ${top + 16} L${cx - 20} ${top} L${cx - 10} ${top + 10} L${cx} ${top - 8} L${cx + 10} ${top + 10} L${cx + 20} ${top} L${cx + 20} ${top + 16} Z`} fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
      <circle cx={cx} cy={top + 4} r="3" fill="#FF4D6D" />
      <circle cx={cx - 12} cy={top + 10} r="2.2" fill="#4FC3F7" />
      <circle cx={cx + 12} cy={top + 10} r="2.2" fill="#4FC3F7" />
    </g>
  );
}

function HaloRing({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6 8" opacity="0.55"
      style={{ transformOrigin: `${cx}px ${cy}px`, animation: "gsSpin 6s linear infinite" }} />
  );
}

// ─── Сердце ──────────────────────────────────────────────────────────────────
export function HeartScene({ variant = 0 }: SceneProps) {
  const c = pick(HEART_COLORS, variant);
  const tier = tierOf(variant);
  const isFlame = variant === 2;
  const isFaceted = variant === 4;
  const isRainbow = variant === 7;

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      <defs>
        <linearGradient id={`heartRb${variant}`} x1="0" y1="0" x2="1" y2="1">
          {RAINBOW.map((rc, i) => <stop key={i} offset={`${(i / (RAINBOW.length - 1)) * 100}%`} stopColor={rc} />)}
        </linearGradient>
      </defs>

      {tier >= 2 && <HaloRing cx={100} cy={105} r={70} color={isRainbow ? "url(#heartRb0)" : c} />}
      <Sparkles cx={100} cy={100} r={62} count={tier === 0 ? 3 : tier === 1 ? 4 : tier === 2 ? 5 : 7} />

      {tier === 3 && <Wings cx={100} cy={100} />}

      <g style={{ transformOrigin: "100px 105px", animation: "gsPulse 1.1s ease-in-out infinite" }}>
        <path d="M100 165 C40 120 30 75 60 55 C82 40 100 60 100 72 C100 60 118 40 140 55 C170 75 160 120 100 165 Z"
          fill={isRainbow ? `url(#heartRb${variant})` : c} />
        {isFaceted ? (
          <>
            <path d="M100 72 L70 90 L100 165 L130 90 Z" fill="rgba(255,255,255,0.18)" />
            <path d="M100 72 L60 55 L70 90 Z" fill="rgba(255,255,255,0.3)" />
            <path d="M100 72 L140 55 L130 90 Z" fill="rgba(255,255,255,0.12)" />
          </>
        ) : (
          <path d="M78 72 C72 66 66 70 68 80 C72 74 78 76 78 72 Z" fill="rgba(255,255,255,0.6)" />
        )}
        {isFlame && (
          <g style={{ transformOrigin: "100px 60px", animation: "gsFlame 0.7s ease-in-out infinite" }}>
            <path d="M100 22 C88 40 84 54 94 62 C90 50 96 46 100 38 C104 46 112 52 106 64 C118 56 118 40 100 22 Z" fill="#FF6B35" />
            <path d="M100 40 C94 50 92 58 98 62 C96 54 100 52 100 48 C102 52 106 56 102 62 C110 58 110 48 100 40 Z" fill="#FFC107" />
          </g>
        )}
      </g>

      {tier === 3 && <Crown cx={100} top={30} />}
    </svg>
  );
}

// ─── Роза ────────────────────────────────────────────────────────────────────
function RoseBlossom({ x, y, scale = 1, color, delay = 0 }: { x: number; y: number; scale?: number; color: string; delay?: number }) {
  return (
    <g style={{ transformOrigin: `${x}px ${y}px`, animation: `gsFloat 2.6s ${delay}s ease-in-out infinite` }}>
      <circle cx={x} cy={y} r={34 * scale} fill={color} />
      <path d={`M${x} ${y} Q${x - 22 * scale} ${y - 18 * scale} ${x} ${y - 30 * scale} Q${x + 22 * scale} ${y - 18 * scale} ${x} ${y} Z`} fill="rgba(0,0,0,0.12)" />
      <path d={`M${x} ${y} Q${x + 18 * scale} ${y - 12 * scale} ${x + 22 * scale} ${y + 10 * scale} Q${x + 4 * scale} ${y + 14 * scale} ${x} ${y} Z`} fill="rgba(255,255,255,0.22)" />
      <circle cx={x} cy={y - 2 * scale} r={10 * scale} fill="rgba(0,0,0,0.18)" />
    </g>
  );
}

export function RoseScene({ variant = 0 }: SceneProps) {
  const c = pick(ROSE_COLORS, variant);
  const tier = tierOf(variant);
  const isRainbow = variant === 7;
  const blossomCount = variant === 1 ? 2 : variant === 2 ? 3 : 1;
  const crystalDome = variant === 5 || variant === 6;

  const positions = blossomCount === 3
    ? [{ x: 100, y: 74, s: 0.72 }, { x: 68, y: 96, s: 0.6 }, { x: 132, y: 96, s: 0.6 }]
    : blossomCount === 2
    ? [{ x: 84, y: 78, s: 0.8 }, { x: 118, y: 90, s: 0.68 }]
    : [{ x: 100, y: 78, s: 1 }];

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      <defs>
        <linearGradient id={`roseRb${variant}`} x1="0" y1="0" x2="1" y2="1">
          {RAINBOW.map((rc, i) => <stop key={i} offset={`${(i / (RAINBOW.length - 1)) * 100}%`} stopColor={rc} />)}
        </linearGradient>
      </defs>

      {tier >= 2 && <HaloRing cx={100} cy={110} r={72} color={c} />}
      <Sparkles cx={100} cy={90} r={64} count={tier === 0 ? 2 : tier === 1 ? 3 : tier === 2 ? 5 : 7} />

      {/* Стебель */}
      <g style={{ transformOrigin: "100px 170px", animation: "gsSway 3s ease-in-out infinite" }}>
        <path d="M100 175 Q96 130 100 95" stroke="#2E7D32" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M100 140 Q78 128 70 145 Q92 150 100 140 Z" fill="#43A047" style={{ transformOrigin: "100px 140px", animation: "gsPetal 2.4s ease-in-out infinite" }} />
        <path d="M100 120 Q122 108 130 125 Q108 130 100 120 Z" fill="#43A047" style={{ transformOrigin: "100px 120px", animation: "gsPetal 2.4s 0.3s ease-in-out infinite" }} />
        {positions.map((p, i) => (
          <RoseBlossom key={i} x={p.x} y={p.y} scale={p.s} color={isRainbow ? `url(#roseRb${variant})` : c} delay={i * 0.2} />
        ))}
      </g>

      {crystalDome && (
        <ellipse cx="100" cy="82" rx="58" ry="62" fill="rgba(180,230,255,0.10)" stroke="rgba(200,240,255,0.55)" strokeWidth="2.5" />
      )}
      {tier === 3 && <Crown cx={100} top={20} />}
    </svg>
  );
}

// ─── Мишка ───────────────────────────────────────────────────────────────────
export function BearScene({ variant = 0 }: SceneProps) {
  const isPanda = variant === 3;
  const c = isPanda ? "#F5F5F5" : pick(BEAR_COLORS, variant);
  const belly = isPanda ? "#ffffff" : "#E8C39E";
  const patch = "#232323";
  const tier = tierOf(variant);
  const hasHeart = variant === 2;
  const isRainbow = variant === 7;

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      <defs>
        <linearGradient id={`bearRb${variant}`} x1="0" y1="0" x2="1" y2="1">
          {RAINBOW.map((rc, i) => <stop key={i} offset={`${(i / (RAINBOW.length - 1)) * 100}%`} stopColor={rc} />)}
        </linearGradient>
      </defs>

      {tier >= 2 && <HaloRing cx={100} cy={110} r={78} color={isRainbow ? `url(#bearRb${variant})` : c} />}
      <Sparkles cx={100} cy={70} r={58} count={tier === 0 ? 0 : tier === 1 ? 3 : tier === 2 ? 5 : 7} />
      {tier === 3 && <Wings cx={100} cy={130} />}

      {/* Тело */}
      <g style={{ transformOrigin: "100px 150px", animation: "gsFloat 2.4s ease-in-out infinite" }}>
        <ellipse cx="100" cy="140" rx="42" ry="38" fill={isRainbow ? `url(#bearRb${variant})` : c} />
        <ellipse cx="100" cy="148" rx="26" ry="24" fill={belly} />
        {hasHeart && (
          <g style={{ transformOrigin: "100px 148px", animation: "gsPulse 1.1s ease-in-out infinite" }}>
            <path d="M100 158 C84 146 80 132 90 126 C96 122 100 128 100 132 C100 128 104 122 110 126 C120 132 116 146 100 158 Z" fill="#FF4D6D" />
          </g>
        )}
        {/* Машущая лапка */}
        <g style={{ transformOrigin: "138px 120px", animation: "gsWave 1s ease-in-out infinite" }}>
          <ellipse cx="146" cy="112" rx="13" ry="16" fill={isRainbow ? `url(#bearRb${variant})` : c} />
        </g>
        <ellipse cx="58" cy="150" rx="13" ry="16" fill={isRainbow ? `url(#bearRb${variant})` : c} />
        {/* Ножки */}
        <ellipse cx="80" cy="176" rx="14" ry="10" fill={isRainbow ? `url(#bearRb${variant})` : c} />
        <ellipse cx="120" cy="176" rx="14" ry="10" fill={isRainbow ? `url(#bearRb${variant})` : c} />
      </g>
      {/* Голова */}
      <g style={{ transformOrigin: "100px 80px", animation: "gsHead 2.6s ease-in-out infinite" }}>
        <circle cx="68" cy="52" r="15" fill={isRainbow ? `url(#bearRb${variant})` : c} />
        <circle cx="132" cy="52" r="15" fill={isRainbow ? `url(#bearRb${variant})` : c} />
        <circle cx="68" cy="52" r="7" fill={isPanda ? patch : belly} />
        <circle cx="132" cy="52" r="7" fill={isPanda ? patch : belly} />
        <circle cx="100" cy="80" r="40" fill={isRainbow ? `url(#bearRb${variant})` : c} />
        <ellipse cx="100" cy="94" rx="24" ry="20" fill={belly} />
        {isPanda && (
          <>
            <ellipse cx="82" cy="72" rx="13" ry="16" fill={patch} style={{ transformOrigin: "82px 72px", animation: "gsBlink 3.2s ease-in-out infinite" }} />
            <ellipse cx="118" cy="72" rx="13" ry="16" fill={patch} style={{ transformOrigin: "118px 72px", animation: "gsBlink 3.2s ease-in-out infinite" }} />
          </>
        )}
        <g style={{ transformOrigin: "84px 74px", animation: "gsBlink 3.2s ease-in-out infinite" }}>
          <circle cx="84" cy="74" r="6" fill="#2A1A0E" />
          <circle cx="86" cy="72" r="2" fill="#fff" />
        </g>
        <g style={{ transformOrigin: "116px 74px", animation: "gsBlink 3.2s ease-in-out infinite" }}>
          <circle cx="116" cy="74" r="6" fill="#2A1A0E" />
          <circle cx="118" cy="72" r="2" fill="#fff" />
        </g>
        <ellipse cx="100" cy="90" rx="6" ry="4.5" fill="#2A1A0E" />
        <path d="M100 94 Q92 102 86 98 M100 94 Q108 102 114 98" stroke="#2A1A0E" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {tier === 3 && <Crown cx={100} top={22} />}
    </svg>
  );
}

// ─── Кольцо ──────────────────────────────────────────────────────────────────
export function RingScene({ variant = 0 }: SceneProps) {
  const metal = pick(RING_COLORS, variant);
  const tier = tierOf(variant);
  const isRuby = variant === 3;
  const isBig = variant === 4;
  const isRainbow = variant === 7;
  const gemColor = isRuby ? ["#FF6B6B", "#FF8A8A", "#E53935", "#FF5252", "#D32F2F"] : ["#B3E5FC", "#E1F5FE", "#81D4FA", "#4FC3F7", "#29B6F6"];

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      <defs>
        <linearGradient id={`ringRb${variant}`} x1="0" y1="0" x2="1" y2="1">
          {RAINBOW.map((rc, i) => <stop key={i} offset={`${(i / (RAINBOW.length - 1)) * 100}%`} stopColor={rc} />)}
        </linearGradient>
      </defs>

      {tier >= 2 && <HaloRing cx={100} cy={118} r={68} color={metal} />}
      <Sparkles cx={100} cy={118} r={56} count={tier === 0 ? 3 : tier === 1 ? 4 : tier === 2 ? 5 : 7} />
      {tier === 3 && <Wings cx={100} cy={130} />}

      <g style={{ transformOrigin: "100px 125px", animation: "gsFloat 3s ease-in-out infinite" }}>
        {variant === 6 ? (
          <>
            <ellipse cx="82" cy="132" rx="26" ry="30" fill="none" stroke={metal} strokeWidth="10" />
            <ellipse cx="118" cy="132" rx="26" ry="30" fill="none" stroke={metal} strokeWidth="10" />
          </>
        ) : (
          <>
            <ellipse cx="100" cy="132" rx="34" ry="38" fill="none" stroke={isRainbow ? `url(#ringRb${variant})` : metal} strokeWidth="12" />
            <ellipse cx="100" cy="132" rx="34" ry="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
          </>
        )}
        <g style={{ transformOrigin: "100px 78px", animation: "gsShimmer 1.4s ease-in-out infinite" }}>
          <path d={`M100 ${isBig ? 42 : 55} L${isBig ? 128 : 120} 74 L100 ${isBig ? 110 : 100} L${isBig ? 72 : 80} 74 Z`} fill={gemColor[0]} />
          <path d={`M100 ${isBig ? 42 : 55} L${isBig ? 128 : 120} 74 L100 74 Z`} fill={gemColor[1]} />
          <path d={`M100 ${isBig ? 42 : 55} L${isBig ? 72 : 80} 74 L100 74 Z`} fill={gemColor[2]} />
          <path d={`M${isBig ? 72 : 80} 74 L100 ${isBig ? 110 : 100} L100 74 Z`} fill={gemColor[3]} />
          <path d={`M${isBig ? 128 : 120} 74 L100 ${isBig ? 110 : 100} L100 74 Z`} fill={gemColor[4]} />
        </g>
      </g>
      {tier === 3 && <Crown cx={100} top={20} />}
    </svg>
  );
}

// ─── Пёс ─────────────────────────────────────────────────────────────────────
export function DogScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}>
      <g style={{ transformOrigin: "56px 128px", animation: "gsSway 0.6s ease-in-out infinite" }}>
        <path d="M56 128 Q30 120 26 96 Q40 108 58 118 Z" fill="#7A5230" />
      </g>
      <ellipse cx="72" cy="168" rx="14" ry="9" fill="#6B4423" />
      <ellipse cx="128" cy="168" rx="14" ry="9" fill="#6B4423" />
      <g style={{ transformOrigin: "100px 150px", animation: "gsFloat 0.9s ease-in-out infinite" }}>
        <ellipse cx="100" cy="140" rx="46" ry="40" fill="#A9713E" />
        <ellipse cx="100" cy="150" rx="30" ry="26" fill="#E8C39E" />
        <ellipse cx="84" cy="176" rx="12" ry="8" fill="#8A5A2B" />
        <ellipse cx="116" cy="176" rx="12" ry="8" fill="#8A5A2B" />
      </g>
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

// ─── Кот ─────────────────────────────────────────────────────────────────────
export function CatScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      <g style={{ transformOrigin: "146px 150px", animation: "gsSwayBig 1.4s ease-in-out infinite" }}>
        <path d="M146 150 Q176 150 178 118 Q166 132 148 138 Z" fill="#8A8A8F" />
      </g>
      <g style={{ transformOrigin: "100px 150px", animation: "gsFloat 2.2s ease-in-out infinite" }}>
        <ellipse cx="100" cy="142" rx="40" ry="36" fill="#A6A6AD" />
        <ellipse cx="100" cy="150" rx="24" ry="20" fill="#F0EEEA" />
        <ellipse cx="78" cy="176" rx="12" ry="8" fill="#8A8A8F" />
        <ellipse cx="122" cy="176" rx="12" ry="8" fill="#8A8A8F" />
      </g>
      <g style={{ transformOrigin: "100px 82px", animation: "gsHead 2.4s ease-in-out infinite" }}>
        <path d="M66 56 L58 24 L86 48 Z" fill="#A6A6AD" />
        <path d="M134 56 L142 24 L114 48 Z" fill="#A6A6AD" />
        <path d="M68 50 L64 32 L82 46 Z" fill="#F5B7C6" />
        <path d="M132 50 L136 32 L118 46 Z" fill="#F5B7C6" />
        <circle cx="100" cy="80" r="38" fill="#A6A6AD" />
        <ellipse cx="100" cy="92" rx="22" ry="18" fill="#F0EEEA" />
        <g style={{ transformOrigin: "84px 76px", animation: "gsBlink 3s ease-in-out infinite" }}>
          <ellipse cx="84" cy="76" rx="6" ry="7" fill="#3AA757" /><circle cx="84" cy="76" r="2.6" fill="#0f0a06" />
        </g>
        <g style={{ transformOrigin: "116px 76px", animation: "gsBlink 3s ease-in-out infinite" }}>
          <ellipse cx="116" cy="76" rx="6" ry="7" fill="#3AA757" /><circle cx="116" cy="76" r="2.6" fill="#0f0a06" />
        </g>
        <path d="M100 90 L94 96 L106 96 Z" fill="#E8899B" />
        <path d="M60 92 L28 86 M60 98 L26 98 M140 92 L172 86 M140 98 L174 98" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─── Кролик ──────────────────────────────────────────────────────────────────
export function RabbitScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      <g style={{ transformOrigin: "100px 155px", animation: "gsBounce 1.1s ease-in-out infinite" }}>
        <ellipse cx="100" cy="146" rx="38" ry="34" fill="#F2E9E4" />
        <ellipse cx="100" cy="154" rx="22" ry="18" fill="#FBD6DE" />
        <circle cx="72" cy="174" r="11" fill="#F2E9E4" />
        <circle cx="128" cy="174" r="11" fill="#F2E9E4" />
      </g>
      <g style={{ transformOrigin: "100px 80px", animation: "gsHead 2.2s ease-in-out infinite" }}>
        <g style={{ transformOrigin: "82px 40px", animation: "gsSwayBig 1.8s ease-in-out infinite" }}>
          <ellipse cx="82" cy="30" rx="12" ry="34" fill="#F2E9E4" />
          <ellipse cx="82" cy="30" rx="6" ry="24" fill="#FBD6DE" />
        </g>
        <g style={{ transformOrigin: "118px 40px", animation: "gsSwayBig 1.8s 0.15s ease-in-out infinite" }}>
          <ellipse cx="118" cy="30" rx="12" ry="34" fill="#F2E9E4" />
          <ellipse cx="118" cy="30" rx="6" ry="24" fill="#FBD6DE" />
        </g>
        <circle cx="100" cy="82" r="38" fill="#F2E9E4" />
        <ellipse cx="100" cy="94" rx="22" ry="18" fill="#FBD6DE" />
        <g style={{ transformOrigin: "86px 78px", animation: "gsBlink 3.1s ease-in-out infinite" }}>
          <circle cx="86" cy="78" r="6" fill="#5B3A2E" /><circle cx="88" cy="76" r="2" fill="#fff" />
        </g>
        <g style={{ transformOrigin: "114px 78px", animation: "gsBlink 3.1s ease-in-out infinite" }}>
          <circle cx="114" cy="78" r="6" fill="#5B3A2E" /><circle cx="116" cy="76" r="2" fill="#fff" />
        </g>
        <g style={{ transformOrigin: "100px 92px", animation: "gsPulse 0.6s ease-in-out infinite" }}>
          <ellipse cx="100" cy="92" rx="5" ry="3.5" fill="#E8899B" />
        </g>
      </g>
    </svg>
  );
}

// ─── Ракета ──────────────────────────────────────────────────────────────────
export function RocketScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}>
      <Sparkles cx={100} cy={70} r={70} count={5} />
      <g style={{ transformOrigin: "100px 100px", animation: "gsBob 1.4s ease-in-out infinite" }}>
        <g style={{ transformOrigin: "100px 160px", animation: "gsFlame 0.4s ease-in-out infinite" }}>
          <path d="M88 156 Q100 190 112 156 Q100 168 88 156 Z" fill="#FF6B35" />
          <path d="M93 156 Q100 178 107 156 Q100 164 93 156 Z" fill="#FFC107" />
        </g>
        <path d="M100 30 C124 56 128 100 118 148 L82 148 C72 100 76 56 100 30 Z" fill="#ECEFF1" />
        <path d="M100 30 C112 44 118 62 120 82 L80 82 C82 62 88 44 100 30 Z" fill="#E53935" />
        <circle cx="100" cy="96" r="16" fill="#4FC3F7" stroke="#0288D1" strokeWidth="3" />
        <path d="M82 118 L58 148 L82 142 Z" fill="#E53935" />
        <path d="M118 118 L142 148 L118 142 Z" fill="#E53935" />
      </g>
    </svg>
  );
}

// ─── Единорог ────────────────────────────────────────────────────────────────
export function UnicornScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      <g style={{ transformOrigin: "100px 90px", animation: "gsHead 2.3s ease-in-out infinite" }}>
        {[0, 1, 2].map(i => (
          <path key={i}
            d={`M${70 + i * 4} 60 Q${50 + i * 6} ${80 + i * 14} ${64 + i * 5} ${118 + i * 8}`}
            stroke={RAINBOW[i * 2]} strokeWidth="7" fill="none" strokeLinecap="round"
            style={{ transformOrigin: `${70 + i * 4}px 60px`, animation: `gsPetal ${1.6 + i * 0.3}s ease-in-out infinite` }} />
        ))}
        <g style={{ transformOrigin: "100px 46px", animation: "gsShimmer 1.3s ease-in-out infinite" }}>
          <path d="M100 12 L108 50 L92 50 Z" fill="#FFE082" stroke="#FFC107" strokeWidth="1.5" />
        </g>
        <ellipse cx="100" cy="88" rx="34" ry="32" fill="#FBF7FF" />
        <path d="M92 112 Q86 132 70 130 Q84 122 84 108 Z" fill="#FBF7FF" />
        <g style={{ transformOrigin: "86px 82px", animation: "gsBlink 3s ease-in-out infinite" }}>
          <circle cx="86" cy="82" r="6" fill="#6A4A8A" /><circle cx="88" cy="80" r="2" fill="#fff" />
        </g>
        <g style={{ transformOrigin: "114px 82px", animation: "gsBlink 3s ease-in-out infinite" }}>
          <circle cx="114" cy="82" r="6" fill="#6A4A8A" /><circle cx="116" cy="80" r="2" fill="#fff" />
        </g>
        <ellipse cx="80" cy="102" rx="4" ry="3" fill="#E8899B" />
      </g>
    </svg>
  );
}

// ─── Звезда ──────────────────────────────────────────────────────────────────
export function StarScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 14px rgba(255,193,7,0.4))" }}>
      <HaloRing cx={100} cy={100} r={72} color="#FFD700" />
      <Sparkles cx={100} cy={100} r={64} count={6} />
      <g style={{ transformOrigin: "100px 100px", animation: "gsPulse 1.3s ease-in-out infinite" }}>
        <path d="M100 24 L118 76 L174 76 L128 108 L146 162 L100 128 L54 162 L72 108 L26 76 L82 76 Z"
          fill="#FFD700" stroke="#FFF6C2" strokeWidth="3" />
        <circle cx="100" cy="100" r="14" fill="rgba(255,255,255,0.7)" />
      </g>
    </svg>
  );
}

// ─── Корона ──────────────────────────────────────────────────────────────────
export function CrownScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 8px 16px rgba(255,193,7,0.45))" }}>
      <HaloRing cx={100} cy={110} r={74} color="#FFD700" />
      <Sparkles cx={100} cy={70} r={60} count={6} />
      <g style={{ transformOrigin: "100px 110px", animation: "gsFloat 2.4s ease-in-out infinite" }}>
        <path d="M50 150 L46 90 L76 118 L100 66 L124 118 L154 90 L150 150 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="2.5" />
        <rect x="50" y="150" width="100" height="16" rx="4" fill="#E8B800" />
        <g style={{ transformOrigin: "46px 90px", animation: "gsShimmer 1.4s ease-in-out infinite" }}><circle cx="46" cy="90" r="7" fill="#FF4D6D" /></g>
        <g style={{ transformOrigin: "100px 66px", animation: "gsShimmer 1.4s 0.2s ease-in-out infinite" }}><circle cx="100" cy="66" r="9" fill="#4FC3F7" /></g>
        <g style={{ transformOrigin: "154px 90px", animation: "gsShimmer 1.4s 0.4s ease-in-out infinite" }}><circle cx="154" cy="90" r="7" fill="#7C4DFF" /></g>
      </g>
    </svg>
  );
}

// ─── Дракон ──────────────────────────────────────────────────────────────────
export function DragonScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))" }}>
      <Sparkles cx={100} cy={60} r={72} count={5} />
      <g style={{ transformOrigin: "56px 140px", animation: "gsSwayBig 1.2s ease-in-out infinite" }}>
        <path d="M56 140 Q22 132 18 100 Q34 118 60 126 Z" fill="#2E7D32" />
        <path d="M28 108 L18 96 L30 100 Z" fill="#2E7D32" />
      </g>
      <Wings cx={100} cy={128} />
      <g style={{ transformOrigin: "100px 150px", animation: "gsFloat 2s ease-in-out infinite" }}>
        <ellipse cx="100" cy="142" rx="40" ry="36" fill="#43A047" />
        <ellipse cx="100" cy="150" rx="24" ry="20" fill="#C8E6C9" />
        <path d="M84 108 L92 122 L76 122 Z" fill="#2E7D32" />
        <path d="M116 108 L124 122 L108 122 Z" fill="#2E7D32" />
        <ellipse cx="80" cy="176" rx="12" ry="8" fill="#2E7D32" />
        <ellipse cx="120" cy="176" rx="12" ry="8" fill="#2E7D32" />
      </g>
      <g style={{ transformOrigin: "100px 84px", animation: "gsHead 2.1s ease-in-out infinite" }}>
        <path d="M72 60 L60 40 L80 54 Z" fill="#2E7D32" />
        <path d="M128 60 L140 40 L120 54 Z" fill="#2E7D32" />
        <circle cx="100" cy="82" r="36" fill="#43A047" />
        <ellipse cx="100" cy="96" rx="22" ry="18" fill="#C8E6C9" />
        <g style={{ transformOrigin: "86px 76px", animation: "gsBlink 3s ease-in-out infinite" }}>
          <ellipse cx="86" cy="76" rx="6" ry="7" fill="#FFC107" /><circle cx="86" cy="76" r="2.4" fill="#0f0a06" />
        </g>
        <g style={{ transformOrigin: "114px 76px", animation: "gsBlink 3s ease-in-out infinite" }}>
          <ellipse cx="114" cy="76" rx="6" ry="7" fill="#FFC107" /><circle cx="114" cy="76" r="2.4" fill="#0f0a06" />
        </g>
        <g style={{ transformOrigin: "100px 102px", animation: "gsFlame 0.5s ease-in-out infinite" }}>
          <path d="M92 102 Q100 122 108 102 Q100 110 92 102 Z" fill="#FF6B35" />
        </g>
      </g>
    </svg>
  );
}

export type GiftSceneCategory = "heart" | "rose" | "bear" | "ring" | "special";

const SPECIAL_SCENES = [DogScene, CatScene, RabbitScene, RocketScene, UnicornScene, StarScene, CrownScene, DragonScene];

export function GiftScene({ category, variant = 0 }: { category: GiftSceneCategory; variant?: number }) {
  switch (category) {
    case "heart":   return <HeartScene variant={variant} />;
    case "rose":    return <RoseScene variant={variant} />;
    case "bear":    return <BearScene variant={variant} />;
    case "ring":    return <RingScene variant={variant} />;
    case "special": { const S = SPECIAL_SCENES[variant % SPECIAL_SCENES.length]; return <S />; }
  }
}

export default GiftScene;
