export default function GiftRing({ size = 64, variant = 0 }: { size?: number; variant?: number }) {
  const id = `rg${variant}`;
  const palettes = [
    { band: ["#F5F5F5","#C0C0C0","#808080"], gem: ["#B9F2FF","#00B0FF","#0056A3"], gemShine: "#FFFFFF", gemGlow: "#00B8FF" },
    { band: ["#FFE57A","#FFD700","#B8860B"], gem: ["#FF8A80","#F44336","#B71C1C"], gemShine: "#FFF9C4", gemGlow: "#FF1744" },
    { band: ["#FFE57A","#FFD700","#B8860B"], gem: ["#B9F2FF","#00B0FF","#0056A3"], gemShine: "#FFFFFF", gemGlow: "#00B8FF" },
    { band: ["#FFE57A","#FFD700","#B8860B"], gem: ["#E8F5E9","#4CAF50","#1B5E20"], gemShine: "#F1F8E9", gemGlow: "#00E676" },
    { band: ["#E8EAF6","#9FA8DA","#3949AB"], gem: ["#FCE4EC","#F48FB1","#C2185B"], gemShine: "#FFF", gemGlow: "#FF80AB" },
    { band: ["#FFE57A","#FFD700","#B8860B"], gem: ["#F3E5F5","#CE93D8","#7B1FA2"], gemShine: "#F8BBD9", gemGlow: "#E040FB" },
    { band: ["#B0BEC5","#78909C","#37474F"], gem: ["#FFF9C4","#FFD600","#F57F17"], gemShine: "#FFFFFF", gemGlow: "#FFD600" },
    { band: ["#FFE57A","#FF9800","#E65100"], gem: ["#FCE4EC","#FF4081","#C51162"], gemShine: "#FFFFFF", gemGlow: "#FF4081" },
  ];
  const pal = palettes[variant % palettes.length];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Band gradient — metallic */}
        <linearGradient id={`rbl${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.band[0]}/>
          <stop offset="30%" stopColor={pal.band[1]}/>
          <stop offset="60%" stopColor={pal.band[0]}/>
          <stop offset="100%" stopColor={pal.band[2]}/>
        </linearGradient>
        {/* Band side sheen */}
        <linearGradient id={`rbs${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={pal.band[2]}/>
          <stop offset="35%" stopColor={pal.band[0]}/>
          <stop offset="65%" stopColor={pal.band[0]}/>
          <stop offset="100%" stopColor={pal.band[2]}/>
        </linearGradient>
        {/* Gem main */}
        <radialGradient id={`rgm${id}`} cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor={pal.gem[0]}/>
          <stop offset="50%" stopColor={pal.gem[1]}/>
          <stop offset="100%" stopColor={pal.gem[2]}/>
        </radialGradient>
        {/* Gem specular */}
        <radialGradient id={`rgs${id}`} cx="35%" cy="25%" r="40%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        {/* Gem glow filter */}
        <filter id={`rgf${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feFlood floodColor={pal.gemGlow} floodOpacity="0.8" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Drop shadow */}
        <filter id={`rsf${id}`} x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor={pal.band[2]} floodOpacity="0.4"/>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="50" cy="91" rx="26" ry="5" fill="black" opacity="0.18"/>

      {/* Ring band — back arch (top) */}
      <path
        d="M22 50 Q22 18 50 18 Q78 18 78 50"
        stroke={`url(#rbs${id})`} strokeWidth="12" fill="none" strokeLinecap="round"
        filter={`url(#rsf${id})`}
      />
      {/* Band highlight stripe */}
      <path
        d="M25 50 Q25 22 50 22 Q75 22 75 50"
        stroke="white" strokeWidth="2" strokeOpacity="0.4" fill="none" strokeLinecap="round"
      />

      {/* Ring band — front arch (bottom) */}
      <path
        d="M22 50 Q22 82 50 82 Q78 82 78 50"
        stroke={`url(#rbl${id})`} strokeWidth="12" fill="none" strokeLinecap="round"
      />
      {/* Front band inner shadow */}
      <path
        d="M26 50 Q26 78 50 78 Q74 78 74 50"
        stroke={pal.band[2]} strokeWidth="2" strokeOpacity="0.3" fill="none" strokeLinecap="round"
      />

      {/* Gem setting / bezel */}
      <ellipse cx="50" cy="22" rx="16" ry="13" fill={pal.band[1]}/>
      <ellipse cx="50" cy="22" rx="16" ry="13" fill={`url(#rbs${id})`}/>
      <ellipse cx="50" cy="22" rx="13" ry="10" fill={pal.band[2]}/>

      {/* Gem stone (diamond/oval cut) */}
      <g filter={`url(#rgf${id})`}>
        {/* Girdle */}
        <ellipse cx="50" cy="21" rx="11" ry="9" fill={pal.gem[2]}/>
        {/* Table */}
        <ellipse cx="50" cy="20" rx="11" ry="9" fill={`url(#rgm${id})`}/>
        {/* Facets */}
        <path d="M39 21 L50 14 L61 21 L50 28Z" fill={pal.gem[1]} opacity="0.6"/>
        <path d="M39 21 L50 14 L44 21Z" fill="white" opacity="0.25"/>
        <path d="M56 21 L61 21 L50 14Z" fill="white" opacity="0.15"/>
        <path d="M50 28 L39 21 L45 25Z" fill={pal.gem[2]} opacity="0.4"/>
        <path d="M50 28 L61 21 L55 25Z" fill={pal.gem[2]} opacity="0.4"/>
        {/* Specular flash */}
        <ellipse cx="50" cy="20" rx="11" ry="9" fill={`url(#rgs${id})`}/>
        {/* Bright spot */}
        <ellipse cx="45" cy="16" rx="3" ry="2" fill="white" opacity="0.7" transform="rotate(-15 45 16)"/>
      </g>
    </svg>
  );
}
