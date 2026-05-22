export default function GiftRose({ size = 64, variant = 0 }: { size?: number; variant?: number }) {
  const id = `r${variant}`;
  const palettes = [
    { petal: ["#FF2D78","#C4003F","#8B0030"], center: "#FFD700", stem: "#2E7D32", leaf: "#388E3C" },
    { petal: ["#FF6B6B","#E53935","#B71C1C"], center: "#FFF176", stem: "#1B5E20", leaf: "#2E7D32" },
    { petal: ["#FF9800","#E65100","#BF360C"], center: "#FFEB3B", stem: "#33691E", leaf: "#558B2F" },
    { petal: ["#E91E63","#880E4F","#560027"], center: "#FFC107", stem: "#1B5E20", leaf: "#2E7D32" },
    { petal: ["#9C27B0","#6A1B9A","#4A148C"], center: "#FFD54F", stem: "#1B5E20", leaf: "#388E3C" },
    { petal: ["#FFFFFF","#F0F0F0","#CCCCCC"], center: "#FFE082", stem: "#2E7D32", leaf: "#388E3C" },
    { petal: ["#FF2D78","#9B59B6","#C4003F"], center: "#FFF9C4", stem: "#1B5E20", leaf: "#2E7D32" },
    { petal: ["#FFD700","#FF8C00","#FF4500"], center: "#FFF176", stem: "#33691E", leaf: "#558B2F" },
  ];
  const p = palettes[variant % palettes.length];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`rp${id}`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor={p.petal[0]}/>
          <stop offset="55%" stopColor={p.petal[1]}/>
          <stop offset="100%" stopColor={p.petal[2]}/>
        </radialGradient>
        <radialGradient id={`rps${id}`} cx="35%" cy="25%" r="40%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`rpd${id}`} cx="65%" cy="70%" r="50%">
          <stop offset="0%" stopColor="black" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="black" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`rc${id}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={p.center} stopOpacity="1"/>
          <stop offset="100%" stopColor="#B8860B" stopOpacity="1"/>
        </radialGradient>
        <filter id={`rf${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={p.petal[1]} floodOpacity="0.5"/>
        </filter>
        <linearGradient id={`rsg${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={p.stem}/>
          <stop offset="100%" stopColor="#1B5E20"/>
        </linearGradient>
        <radialGradient id={`rlg${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.leaf}/>
          <stop offset="100%" stopColor="#1B5E20"/>
        </radialGradient>
      </defs>

      {/* Stem */}
      <path d="M50 75 Q46 85 44 93" stroke={`url(#rsg${id})`} strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* Leaf */}
      <path d="M47 82 Q38 76 36 68 Q44 70 47 82Z" fill={`url(#rlg${id})`} opacity="0.9"/>
      <path d="M47 82 Q38 76 36 68" stroke="#1B5E20" strokeWidth="0.8" fill="none" opacity="0.6"/>

      {/* Back petals (darker) */}
      <g filter={`url(#rf${id})`} opacity="0.85">
        <ellipse cx="50" cy="52" rx="14" ry="20" fill={p.petal[2]} transform="rotate(-25 50 52)"/>
        <ellipse cx="50" cy="52" rx="14" ry="20" fill={p.petal[2]} transform="rotate(25 50 52)"/>
        <ellipse cx="50" cy="52" rx="14" ry="20" fill={p.petal[1]} transform="rotate(0 50 52)"/>
      </g>

      {/* Mid petals */}
      <ellipse cx="34" cy="46" rx="13" ry="18" fill={`url(#rp${id})`} transform="rotate(-40 34 46)"/>
      <ellipse cx="66" cy="46" rx="13" ry="18" fill={`url(#rp${id})`} transform="rotate(40 66 46)"/>
      <ellipse cx="50" cy="35" rx="11" ry="16" fill={`url(#rp${id})`}/>
      <ellipse cx="50" cy="62" rx="11" ry="16" fill={`url(#rp${id})`}/>

      {/* Petal specular */}
      <ellipse cx="34" cy="46" rx="13" ry="18" fill={`url(#rps${id})`} transform="rotate(-40 34 46)"/>
      <ellipse cx="66" cy="46" rx="13" ry="18" fill={`url(#rps${id})`} transform="rotate(40 66 46)"/>
      <ellipse cx="50" cy="35" rx="11" ry="16" fill={`url(#rps${id})`}/>

      {/* Center rose bud — layered */}
      <circle cx="50" cy="47" r="14" fill={`url(#rp${id})`}/>
      <circle cx="50" cy="47" r="14" fill={`url(#rpd${id})`}/>
      <circle cx="50" cy="47" r="14" fill={`url(#rps${id})`}/>

      {/* Inner spiral petals */}
      <path d="M50 40 Q56 43 55 50 Q50 55 44 51 Q43 44 50 40Z" fill={p.petal[0]} opacity="0.9"/>
      <path d="M50 40 Q56 43 55 50 Q50 55 44 51 Q43 44 50 40Z" fill={`url(#rps${id})`}/>
      <path d="M50 41 Q54 45 52 50 Q48 52 46 48 Q47 43 50 41Z" fill={p.petal[0]}/>
      <ellipse cx="49" cy="44" rx="2.5" ry="1.5" fill="white" opacity="0.5" transform="rotate(-20 49 44)"/>

      {/* Sepal */}
      <path d="M42 62 Q45 68 50 70 Q55 68 58 62 Q54 65 50 65 Q46 65 42 62Z" fill={p.leaf} opacity="0.8"/>

      {/* Drop shadow */}
      <ellipse cx="50" cy="95" rx="18" ry="4" fill="black" opacity="0.2"/>
    </svg>
  );
}
