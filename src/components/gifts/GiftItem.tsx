import AnimatedGift from "./AnimatedGift";
import MarketGiftIcon from "./MarketGiftIcon";
import type { GiftSceneCategory } from "./GiftScenes";

type GiftCategory = GiftSceneCategory | "market";
type Rarity = "common" | "rare" | "epic" | "legendary";

/** Эмодзи фирменных подарков → живая сцена (показывается в любом разделе) */
const BRANDED_SCENE: Record<string, { category: GiftSceneCategory; variant: number }> = {
  "🌗": { category: "special", variant: 8 },
};

interface GiftItemProps {
  category: GiftCategory;
  variant: number;
  animKey: string;
  size?: number;
  rarity?: Rarity;
  selected?: boolean;
  /** Эмодзи — для подарков категории "market" (как в Telegram) */
  emoji?: string;
  /** Показывать зелёную плашку «Маркет» */
  marketBadge?: boolean;
}

/**
 * Универсальный подарок. Для обычных категорий — живой анимированный SVG-персонаж
 * (в стиле Telegram). Для категории "market" — крупное эмодзи на градиентном фоне.
 */
export default function GiftItem({ category, variant, animKey, size = 56, rarity = "common", selected = false, emoji, marketBadge = false }: GiftItemProps) {
  void animKey; void rarity;
  // Фирменные подарки показываем живой сценой даже в разделе «Маркет»
  const branded = emoji ? BRANDED_SCENE[emoji] : undefined;
  if (branded) {
    return <AnimatedGift size={size} category={branded.category} variant={branded.variant} withBackground burst={selected} />;
  }
  if (category === "market" && emoji) {
    return <MarketGiftIcon emoji={emoji} size={size} badge={marketBadge} />;
  }
  return <AnimatedGift size={size} category={category as GiftSceneCategory} variant={variant} withBackground burst={selected} />;
}