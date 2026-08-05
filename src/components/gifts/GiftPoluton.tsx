/**
 * Фирменный подарок «Полутон» — гранёный кристалл-камень.
 * Левая половина огранки — светлая (розовое золото), правая — тёмная
 * (фиолетовый аметист). Внутри камня светится сердце, по граням
 * пробегает блик, вокруг вращается орбита и вспыхивают искры.
 */

const T = [
  [100, 46], [126, 54], [137, 71], [126, 88],
  [100, 96], [74, 88], [63, 71], [74, 54],
];
const G = [
  [100, 34], [140, 47], [157, 72], [140, 97],
  [100, 110], [60, 97], [43, 72], [60, 47],
];
const APEX: [number, number] = [100, 178];

const CROWN = ["#6B3E96", "#542D7B", "#3F2060", "#341A52", "#FF5C9A", "#FF80B4", "#FFA6CB", "#FFD2E4"];
const PAVILION = ["#5B3480", "#452663", "#331A4D", "#2A1440", "#E04A85", "#F06A9E", "#F58FB8", "#FFB8D6"];

const pt = (p: number[]) => `${p[0]} ${p[1]}`;

export function PolutonScene() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%"
      style={{ filter: "drop-shadow(0 10px 20px rgba(255,45,120,0.4))" }}>
      <defs>
        <linearGradient id="plTable" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFE6F1" />
          <stop offset="46%" stopColor="#FF8FBB" />
          <stop offset="54%" stopColor="#7B4BA8" />
          <stop offset="100%" stopColor="#2E1A4A" />
        </linearGradient>
        <linearGradient id="plShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id="plAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,45,120,0.5)" />
          <stop offset="60%" stopColor="rgba(155,89,182,0.22)" />
          <stop offset="100%" stopColor="rgba(155,89,182,0)" />
        </radialGradient>
        <radialGradient id="plHeart" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,120,180,0.35)" />
        </radialGradient>
        <clipPath id="plStone">
          <polygon points={`${G.map(pt).join(" ")}`} />
        </clipPath>
      </defs>

      <ellipse cx="100" cy="104" rx="86" ry="82" fill="url(#plAura)"
        style={{ transformOrigin: "100px 104px", animation: "gsPulse 3s ease-in-out infinite" }} />

      <g style={{ transformOrigin: "100px 100px", animation: "gsSpin 16s linear infinite" }}>
        <ellipse cx="100" cy="104" rx="88" ry="26" fill="none"
          stroke="rgba(255,150,200,0.45)" strokeWidth="2" strokeDasharray="4 12"
          transform="rotate(-18 100 104)" />
      </g>

      <g style={{ transformOrigin: "100px 100px", animation: "gsFloat 3.6s ease-in-out infinite" }}>
        {/* Павильон — нижние грани, сходящиеся в точку */}
        {G.map((g, i) => {
          const n = G[(i + 1) % 8];
          return (
            <polygon key={`p${i}`}
              points={`${pt(g)} ${pt(n)} ${pt(APEX)}`}
              fill={PAVILION[i]} stroke="rgba(255,255,255,0.14)" strokeWidth="0.7" />
          );
        })}

        {/* Корона — верхний пояс граней */}
        {T.map((t, i) => {
          const tn = T[(i + 1) % 8];
          const g = G[i];
          const gn = G[(i + 1) % 8];
          return (
            <polygon key={`c${i}`}
              points={`${pt(t)} ${pt(tn)} ${pt(gn)} ${pt(g)}`}
              fill={CROWN[i]} stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
          );
        })}

        {/* Площадка камня */}
        <polygon points={T.map(pt).join(" ")} fill="url(#plTable)"
          stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

        {/* Сердце внутри камня */}
        <g style={{ transformOrigin: "100px 72px", animation: "gsPulse 1.3s ease-in-out infinite" }}>
          <path d="M100 86 C88 77 82 72 82 65.5 C82 60.5 86 57 90.6 57 C94 57 97 58.6 100 62 C103 58.6 106 57 109.4 57 C114 57 118 60.5 118 65.5 C118 72 112 77 100 86 Z"
            fill="url(#plHeart)" opacity="0.95" />
        </g>

        {/* Бегущий блик по граням */}
        <g clipPath="url(#plStone)">
          <rect x="-70" y="20" width="46" height="170" fill="url(#plShine)"
            transform="rotate(18 100 100)"
            style={{ animation: "plSweep 3.6s ease-in-out infinite" }} />
        </g>

        {/* Верхняя вспышка-звезда */}
        <g style={{ transformOrigin: "136px 50px", animation: "gsTwinkle 2.4s ease-in-out infinite" }}>
          <path d="M136 38 l3.4 8.6 8.6 3.4 -8.6 3.4 -3.4 8.6 -3.4 -8.6 -8.6 -3.4 8.6 -3.4 z" fill="#fff" />
        </g>
        <g style={{ transformOrigin: "62px 116px", animation: "gsTwinkle 2.9s 0.7s ease-in-out infinite" }}>
          <path d="M62 108 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4 z" fill="#fff" />
        </g>
      </g>

      <style>{`@keyframes plSweep { 0% { transform: translateX(0) rotate(18deg); } 55%,100% { transform: translateX(260px) rotate(18deg); } }`}</style>
    </svg>
  );
}

export default PolutonScene;
