/**
 * Живые SVG-персонажи подарков с несколькими вариантами редкости
 * (Сердце, Роза, Мишка, Кольцо). Форма и декор меняются по variant —
 * от простых до легендарных.
 */
import { HEART_COLORS, ROSE_COLORS, BEAR_COLORS, RING_COLORS, RAINBOW, pick, tierOf, Sparkles, Wings, Crown, HaloRing } from "./giftScenesShared";

interface SceneProps {
  variant?: number;
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