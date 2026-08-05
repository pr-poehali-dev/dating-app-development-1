/**
 * Фирменный подарок «Полутон» — луна из двух половин: света и тени.
 * На границе полутонов бьётся сердце, вокруг вращается орбитальное кольцо.
 */
import { Sparkles } from "./giftScenesShared";

export function PolutonScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%"
      style={{ filter: "drop-shadow(0 8px 18px rgba(255,45,120,0.35))" }}>
      <defs>
        <linearGradient id="plLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE3EF" />
          <stop offset="55%" stopColor="#FF7AB0" />
          <stop offset="100%" stopColor="#FF2D78" />
        </linearGradient>
        <linearGradient id="plDark" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6B3FA0" />
          <stop offset="60%" stopColor="#3B2258" />
          <stop offset="100%" stopColor="#1B1030" />
        </linearGradient>
        <linearGradient id="plSeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id="plGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,45,120,0.55)" />
          <stop offset="100%" stopColor="rgba(255,45,120,0)" />
        </radialGradient>
        <clipPath id="plClip">
          <circle cx="100" cy="100" r="58" />
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="76" fill="url(#plGlow)"
        style={{ transformOrigin: "100px 100px", animation: "gsPulse 2.6s ease-in-out infinite" }} />

      <g style={{ transformOrigin: "100px 100px", animation: "gsSpin 14s linear infinite" }}>
        <ellipse cx="100" cy="100" rx="82" ry="30" fill="none"
          stroke="rgba(255,122,176,0.5)" strokeWidth="2" strokeDasharray="5 10"
          transform="rotate(-22 100 100)" />
      </g>

      <g style={{ transformOrigin: "100px 100px", animation: "gsFloat 3.4s ease-in-out infinite" }}>
        <g clipPath="url(#plClip)">
          <rect x="42" y="42" width="58" height="116" fill="url(#plLight)" />
          <rect x="100" y="42" width="58" height="116" fill="url(#plDark)" />

          <circle cx="68" cy="74" r="9" fill="rgba(255,255,255,0.35)" />
          <circle cx="62" cy="118" r="6" fill="rgba(255,255,255,0.25)" />
          <circle cx="82" cy="136" r="4" fill="rgba(255,255,255,0.2)" />

          <circle cx="128" cy="72" r="1.8" fill="#fff"
            style={{ animation: "gsShimmer 2.2s ease-in-out infinite" }} />
          <circle cx="142" cy="104" r="1.4" fill="#fff"
            style={{ animation: "gsShimmer 2.8s 0.4s ease-in-out infinite" }} />
          <circle cx="124" cy="132" r="1.6" fill="#fff"
            style={{ animation: "gsShimmer 3.2s 0.8s ease-in-out infinite" }} />
          <circle cx="136" cy="60" r="1.2" fill="#fff"
            style={{ animation: "gsShimmer 2.5s 1.1s ease-in-out infinite" }} />

          <rect x="96" y="42" width="8" height="116" fill="url(#plSeam)"
            style={{ animation: "gsShimmer 2.4s ease-in-out infinite" }} />
        </g>

        <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

        <g style={{ transformOrigin: "100px 100px", animation: "gsPulse 1.1s ease-in-out infinite" }}>
          <path d="M100 118 C82 104 74 96 74 87 C74 79 80 74 87 74 C92 74 96 76 100 81 C104 76 108 74 113 74 C120 74 126 79 126 87 C126 96 118 104 100 118 Z"
            fill="#fff" opacity="0.96" />
          <path d="M100 118 C82 104 74 96 74 87 C74 79 80 74 87 74 C92 74 96 76 100 81 L100 118 Z"
            fill="#FF2D78" opacity="0.9" />
        </g>
      </g>

      <Sparkles cx={100} cy={100} r={72} count={5} />
    </svg>
  );
}

export default PolutonScene;
