export default function GiftHeart({ size = 64, variant = 0 }: { size?: number; variant?: number }) {
  const id = `h${variant}`;
  const colors = [
    { main: ["#FF2D78", "#FF0055", "#C4003F"], shine: "#FF8BB0", glow: "#FF2D78" },
    { main: ["#FF6B35", "#FF4500", "#CC2200"], shine: "#FFAA80", glow: "#FF4500" },
    { main: ["#9B59B6", "#7D3C98", "#5B2D7A"], shine: "#CC88FF", glow: "#9B59B6" },
    { main: ["#1ABC9C", "#16A085", "#0E6655"], shine: "#7FFFDF", glow: "#1ABC9C" },
    { main: ["#3498DB", "#1F78C1", "#155A8A"], shine: "#80CFFF", glow: "#3498DB" },
    { main: ["#F1C40F", "#D4AC0D", "#A0820A"], shine: "#FFF176", glow: "#F1C40F" },
    { main: ["#E74C3C", "#C0392B", "#922B21"], shine: "#FF8080", glow: "#E74C3C" },
    { main: ["#FF2D78", "#9B59B6", "#3498DB"], shine: "#FFB0FF", glow: "#CC44CC" },
  ];
  const c = colors[variant % colors.length];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Main gradient — top-left bright, bottom-right dark */}
        <radialGradient id={`mg${id}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={c.main[0]} stopOpacity="1"/>
          <stop offset="50%" stopColor={c.main[1]} stopOpacity="1"/>
          <stop offset="100%" stopColor={c.main[2]} stopOpacity="1"/>
        </radialGradient>
        {/* Specular highlight */}
        <radialGradient id={`sg${id}`} cx="38%" cy="28%" r="35%">
          <stop offset="0%" stopColor="white" stopOpacity="0.75"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        {/* Inner shadow (bottom-right) */}
        <radialGradient id={`dg${id}`} cx="70%" cy="75%" r="50%">
          <stop offset="0%" stopColor="black" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="black" stopOpacity="0"/>
        </radialGradient>
        {/* Glow drop shadow */}
        <filter id={`gf${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feFlood floodColor={c.glow} floodOpacity="0.7" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Bottom shadow */}
        <radialGradient id={`bsh${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0"/>
        </radialGradient>
        <clipPath id={`hc${id}`}>
          <path d="M50 82 C50 82 14 58 14 36 C14 24 23 16 33 16 C40 16 46 20 50 26 C54 20 60 16 67 16 C77 16 86 24 86 36 C86 58 50 82 50 82Z"/>
        </clipPath>
      </defs>

      {/* Drop shadow under heart */}
      <ellipse cx="50" cy="90" rx="22" ry="6" fill={`url(#bsh${id})`} opacity="0.6"/>

      {/* Heart shape — main fill */}
      <path
        d="M50 82 C50 82 14 58 14 36 C14 24 23 16 33 16 C40 16 46 20 50 26 C54 20 60 16 67 16 C77 16 86 24 86 36 C86 58 50 82 50 82Z"
        fill={`url(#mg${id})`}
        filter={`url(#gf${id})`}
      />
      {/* Specular */}
      <path
        d="M50 82 C50 82 14 58 14 36 C14 24 23 16 33 16 C40 16 46 20 50 26 C54 20 60 16 67 16 C77 16 86 24 86 36 C86 58 50 82 50 82Z"
        fill={`url(#sg${id})`}
        clipPath={`url(#hc${id})`}
      />
      {/* Inner shadow */}
      <path
        d="M50 82 C50 82 14 58 14 36 C14 24 23 16 33 16 C40 16 46 20 50 26 C54 20 60 16 67 16 C77 16 86 24 86 36 C86 58 50 82 50 82Z"
        fill={`url(#dg${id})`}
      />
      {/* Small secondary shine dot */}
      <ellipse cx="37" cy="29" rx="5" ry="3.5" fill="white" opacity="0.55" transform="rotate(-20 37 29)"/>
    </svg>
  );
}
