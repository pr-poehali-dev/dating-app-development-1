interface Props {
  emoji: string;
  size?: number;
  /** Показать зелёный уголок «Маркет» */
  badge?: boolean;
}

// Стабильно подбираем градиент фона по эмодзи — чтобы у каждого подарка был
// свой приятный цвет, но одинаковый при каждом рендере.
const BG: [string, string][] = [
  ["#3a2a5c", "#1c1430"],
  ["#5c2a44", "#301422"],
  ["#2a4a5c", "#142630"],
  ["#4a5c2a", "#263014"],
  ["#5c4a2a", "#302414"],
  ["#2a5c3a", "#14301e"],
  ["#5c2a2a", "#301414"],
  ["#442a5c", "#221430"],
];

// Набор анимаций — у каждого подарка своя (стабильно по эмодзи).
const ANIMS = [
  "gift-float",
  "gift-pulse",
  "gift-shake",
  "gift-spin",
  "gift-sparkle",
  "gift-glow",
  "gift-orbit",
  "gift-rainbow",
];

function hash(emoji: string): number {
  let h = 0;
  for (let i = 0; i < emoji.length; i++) h = (h * 31 + emoji.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Иконка маркет-подарка: крупное анимированное эмодзи на мягком градиентном фоне —
 * визуально как эмодзи-подарки в Telegram. Анимация у каждого подарка своя.
 */
export default function MarketGiftIcon({ emoji, size = 56, badge = false }: Props) {
  const h = hash(emoji);
  const [from, to] = BG[h % BG.length];
  const anim = ANIMS[h % ANIMS.length];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="rounded-2xl flex items-center justify-center overflow-hidden w-full h-full"
        style={{
          background: `linear-gradient(145deg, ${from}, ${to})`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <span className={anim} style={{ fontSize: size * 0.52, lineHeight: 1, display: "inline-block" }}>{emoji}</span>
      </div>
      {badge && (
        <div
          className="absolute rounded-tr-2xl overflow-hidden pointer-events-none"
          style={{ top: 0, right: 0, width: size * 0.62, height: size * 0.62 }}
        >
          <span
            className="absolute text-white font-bold flex items-center justify-center whitespace-nowrap"
            style={{
              fontSize: Math.max(5, size * 0.125),
              top: size * 0.13,
              right: -size * 0.14,
              width: size * 0.72,
              height: size * 0.2,
              background: "#3BB54A",
              transform: "rotate(45deg)",
              letterSpacing: 0.2,
            }}
          >
            Маркет
          </span>
        </div>
      )}
    </div>
  );
}
