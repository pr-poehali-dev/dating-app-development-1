/** Встроенные SVG-флаги — рендерятся всегда, без обращения к внешним CDN. */

function RussiaFlag() {
  return (
    <svg viewBox="0 0 3 2" className="w-full h-full">
      <rect width="3" height="2" fill="#fff" />
      <rect width="3" height="1.333" y="0.667" fill="#0039A6" />
      <rect width="3" height="0.667" y="1.333" fill="#D52B1E" />
    </svg>
  );
}

function BelarusFlag() {
  return (
    <svg viewBox="0 0 3 2" className="w-full h-full">
      <rect width="3" height="2" fill="#D22730" />
      <rect width="3" height="0.5" y="1.5" fill="#00AF66" />
      <rect width="0.3" height="2" fill="#fff" />
      <rect width="0.06" height="2" x="0.06" fill="#D22730" opacity="0.4" />
    </svg>
  );
}

function NorthKoreaFlag() {
  return (
    <svg viewBox="0 0 3 2" className="w-full h-full">
      <rect width="3" height="2" fill="#fff" />
      <rect width="3" height="0.4" fill="#024FA2" />
      <rect width="3" height="0.4" y="1.6" fill="#024FA2" />
      <rect width="3" height="0.933" y="0.533" fill="#ED1C27" />
      <rect width="3" height="0.08" y="0.453" fill="#fff" />
      <rect width="3" height="0.08" y="1.467" fill="#fff" />
      <circle cx="0.9" cy="1" r="0.35" fill="#ED1C27" stroke="#fff" strokeWidth="0.04" />
      <path d="M0.9,0.78 L0.96,0.95 L1.14,0.95 L0.99,1.06 L1.05,1.24 L0.9,1.13 L0.75,1.24 L0.81,1.06 L0.66,0.95 L0.84,0.95 Z" fill="#fff" />
    </svg>
  );
}

function IranFlag() {
  return (
    <svg viewBox="0 0 3 2" className="w-full h-full">
      <rect width="3" height="2" fill="#fff" />
      <rect width="3" height="0.667" fill="#239F40" />
      <rect width="3" height="0.667" y="1.333" fill="#DA0000" />
      <circle cx="1.5" cy="1" r="0.26" fill="#DA0000" />
    </svg>
  );
}

function ChinaFlag() {
  return (
    <svg viewBox="0 0 3 2" className="w-full h-full">
      <rect width="3" height="2" fill="#DE2910" />
      <g fill="#FFDE00">
        <path d="M0.5,0.2 L0.6,0.5 L0.9,0.5 L0.65,0.68 L0.75,0.98 L0.5,0.8 L0.25,0.98 L0.35,0.68 L0.1,0.5 L0.4,0.5 Z" />
        <path d="M1.05,0.15 l0.06,0.1 l0.11,-0.03 l-0.07,0.09 l0.07,0.09 l-0.11,-0.03 l-0.06,0.1 l-0.01,-0.11 l-0.11,-0.03 l0.11,-0.03 Z" />
        <path d="M1.25,0.4 l0.06,0.1 l0.11,-0.03 l-0.07,0.09 l0.07,0.09 l-0.11,-0.03 l-0.06,0.1 l-0.01,-0.11 l-0.11,-0.03 l0.11,-0.03 Z" />
        <path d="M1.25,0.75 l0.06,0.1 l0.11,-0.03 l-0.07,0.09 l0.07,0.09 l-0.11,-0.03 l-0.06,0.1 l-0.01,-0.11 l-0.11,-0.03 l0.11,-0.03 Z" />
        <path d="M1.05,0.98 l0.06,0.1 l0.11,-0.03 l-0.07,0.09 l0.07,0.09 l-0.11,-0.03 l-0.06,0.1 l-0.01,-0.11 l-0.11,-0.03 l0.11,-0.03 Z" />
      </g>
    </svg>
  );
}

const FLAGS: Record<string, () => JSX.Element> = {
  ru: RussiaFlag,
  by: BelarusFlag,
  kp: NorthKoreaFlag,
  ir: IranFlag,
  cn: ChinaFlag,
};

export function FlagIcon({ code, className, style }: { code: string; className?: string; style?: React.CSSProperties }) {
  const Flag = FLAGS[code];
  return (
    <span className={`inline-block overflow-hidden flex-shrink-0 ${className || ""}`} style={style}>
      {Flag ? <Flag /> : <span className="w-full h-full bg-white/10 block" />}
    </span>
  );
}

export default FlagIcon;