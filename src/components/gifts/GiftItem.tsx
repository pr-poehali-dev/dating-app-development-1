import AnimatedGift from "./AnimatedGift";
import type { GiftSceneCategory } from "./GiftScenes";

type GiftCategory = GiftSceneCategory;
type Rarity = "common" | "rare" | "epic" | "legendary";

interface GiftItemProps {
  category: GiftCategory;
  variant: number;
  animKey: string;
  size?: number;
  rarity?: Rarity;
  selected?: boolean;
}

/**
 * Универсальный подарок — живой анимированный SVG-персонаж с фоном
 * (в стиле Telegram). Все категории теперь оживлены по частям.
 */
export default function GiftItem({ category, variant, animKey, size = 56, rarity = "common", selected = false }: GiftItemProps) {
  void animKey; void rarity;
  return <AnimatedGift size={size} category={category} variant={variant} withBackground burst={selected} />;
}
