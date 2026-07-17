/**
 * Живые SVG-персонажи специальных подарков без вариантов редкости
 * (Пёс, Кот, Кролик, Ракета, Единорог, Звезда, Корона, Дракон).
 */
import { RAINBOW, Sparkles, Wings, HaloRing } from "./giftScenesShared";

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
