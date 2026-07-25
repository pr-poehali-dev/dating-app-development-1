import AnimatedGift from "./AnimatedGift";
import MarketGiftIcon from "./MarketGiftIcon";
import type { GiftSceneCategory } from "./GiftScenes";

type GiftCategory = GiftSceneCategory | "market";
type Rarity = "common" | "rare" | "epic" | "legendary";

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
  if (category === "market" && emoji) {
    return <MarketGiftIcon emoji={emoji} size={size} badge={marketBadge} />;
  }
  return <AnimatedGift size={size} category={category as GiftSceneCategory} variant={variant} withBackground burst={selected} />;
}