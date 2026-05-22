export default function GiftBear({ size = 64, variant = 0 }: { size?: number; variant?: number }) {
  const id = `b${variant}`;
  const palettes = [
    { fur: ["#C8A96E","#A0763A","#7A5230"], nose: "#5D3A2E", eye: "#2C1A0E", blush: "#FF8A80", acc: "#E91E63" },
    { fur: ["#FFFFFF","#E0E0E0","#BDBDBD"], nose: "#FFAB91", eye: "#37474F", blush: "#F48FB1", acc: "#E91E63" },
    { fur: ["#FF8A65","#E64A19","#BF360C"], nose: "#4E342E", eye: "#1A0A00", blush: "#FF80AB", acc: "#FF4081" },
    { fur: ["#90CAF9","#1565C0","#0D47A1"], nose: "#1A237E", eye: "#0D1B4B", blush: "#80D8FF", acc: "#00B0FF" },
    { fur: ["#A5D6A7","#2E7D32","#1B5E20"], nose: "#1B5E20", eye: "#0A2E0A", blush: "#B9F6CA", acc: "#00E676" },
    { fur: ["#CE93D8","#7B1FA2","#4A148C"], nose: "#4A148C", eye: "#1A0030", blush: "#EA80FC", acc: "#AA00FF" },
    { fur: ["#FFD54F","#FF6F00","#E65100"], nose: "#4E342E", eye: "#1A0A00", blush: "#FF80AB", acc: "#FF4081" },
    { fur: ["#B0BEC5","#546E7A","#263238"], nose: "#263238", eye: "#101820", blush: "#CFD8DC", acc: "#B0BEC5" },
  ];
  const pal = palettes[variant % palettes.length];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`bf${id}`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor={pal.fur[0]}/>
          <stop offset="55%" stopColor={pal.fur[1]}/>
          <stop offset="100%" stopColor={pal.fur[2]}/>
        </radialGradient>
        <radialGradient id={`bs${id}`} cx="38%" cy="28%" r="45%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`bd${id}`} cx="68%" cy="72%" r="50%">
          <stop offset="0%" stopColor="black" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="black" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`bm${id}`} cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor={pal.fur[0]} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={pal.fur[1]} stopOpacity="1"/>
        </radialGradient>
        <radialGradient id={`bn${id}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#7B4F3A"/>
          <stop offset="100%" stopColor={pal.nose}/>
        </radialGradient>
        <filter id={`bdf${id}`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={pal.fur[2]} floodOpacity="0.45"/>
        </filter>
      </defs>

      {/* Drop shadow */}
      <ellipse cx="50" cy="93" rx="24" ry="5" fill="black" opacity="0.2"/>

      {/* Ears */}
      <circle cx="28" cy="30" r="12" fill={`url(#bf${id})`} filter={`url(#bdf${id})`}/>
      <circle cx="28" cy="30" r="12" fill={`url(#bd${id})`}/>
      <circle cx="72" cy="30" r="12" fill={`url(#bf${id})`} filter={`url(#bdf${id})`}/>
      <circle cx="72" cy="30" r="12" fill={`url(#bd${id})`}/>
      {/* Inner ears */}
      <circle cx="28" cy="30" r="7" fill={pal.blush} opacity="0.5"/>
      <circle cx="72" cy="30" r="7" fill={pal.blush} opacity="0.5"/>
      <circle cx="28" cy="30" r="7" fill={`url(#bs${id})`}/>
      <circle cx="72" cy="30" r="7" fill={`url(#bs${id})`}/>

      {/* Body */}
      <ellipse cx="50" cy="72" rx="22" ry="20" fill={`url(#bf${id})`} filter={`url(#bdf${id})`}/>
      <ellipse cx="50" cy="72" rx="22" ry="20" fill={`url(#bd${id})`}/>
      <ellipse cx="50" cy="72" rx="22" ry="20" fill={`url(#bs${id})`}/>

      {/* Belly */}
      <ellipse cx="50" cy="75" rx="13" ry="12" fill={pal.fur[0]} opacity="0.4"/>
      <ellipse cx="50" cy="75" rx="13" ry="12" fill={`url(#bs${id})`}/>

      {/* Head */}
      <circle cx="50" cy="48" r="24" fill={`url(#bf${id})`} filter={`url(#bdf${id})`}/>
      <circle cx="50" cy="48" r="24" fill={`url(#bd${id})`}/>
      <circle cx="50" cy="48" r="24" fill={`url(#bs${id})`}/>

      {/* Muzzle */}
      <ellipse cx="50" cy="57" rx="11" ry="8" fill={`url(#bm${id})`}/>
      <ellipse cx="50" cy="57" rx="11" ry="8" fill={`url(#bs${id})`}/>

      {/* Nose */}
      <ellipse cx="50" cy="53" rx="5" ry="3.5" fill={`url(#bn${id})`}/>
      <ellipse cx="48.5" cy="52" rx="1.5" ry="1" fill="white" opacity="0.5"/>

      {/* Mouth */}
      <path d="M46 58 Q50 62 54 58" stroke={pal.nose} strokeWidth="1.5" strokeLinecap="round" fill="none"/>

      {/* Eyes */}
      <circle cx="38" cy="44" r="5" fill={pal.eye}/>
      <circle cx="62" cy="44" r="5" fill={pal.eye}/>
      <circle cx="38" cy="44" r="5" fill={`url(#bs${id})`}/>
      <circle cx="62" cy="44" r="5" fill={`url(#bs${id})`}/>
      <circle cx="36.5" cy="42.5" r="1.8" fill="white" opacity="0.8"/>
      <circle cx="60.5" cy="42.5" r="1.8" fill="white" opacity="0.8"/>

      {/* Blush */}
      <ellipse cx="33" cy="52" rx="5" ry="3" fill={pal.blush} opacity="0.45"/>
      <ellipse cx="67" cy="52" rx="5" ry="3" fill={pal.blush} opacity="0.45"/>

      {/* Bow / accessory */}
      <path d="M44 38 L47 35 L50 38 L47 41Z" fill={pal.acc} opacity="0.9"/>
      <path d="M56 38 L53 35 L50 38 L53 41Z" fill={pal.acc} opacity="0.9"/>
      <circle cx="50" cy="38" r="3" fill={pal.acc}/>
      <circle cx="50" cy="38" r="3" fill={`url(#bs${id})`}/>
    </svg>
  );
}
