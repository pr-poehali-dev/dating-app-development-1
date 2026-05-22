import { useMemo } from "react";
import GiftHeart from "./GiftHeart";
import GiftRose from "./GiftRose";
import GiftBear from "./GiftBear";
import GiftRing from "./GiftRing";
import GiftParticles from "./GiftParticles";

type GiftCategory = "heart" | "rose" | "bear" | "ring";
type Rarity = "common" | "rare" | "epic" | "legendary";

interface GiftItemProps {
  category: GiftCategory;
  variant: number;
  animKey: string;
  size?: number;
  rarity?: Rarity;
}

const ANIM_MAP: Record<string, string> = {
  "gift-float":         "gift-float",
  "gift-pulse":         "gift-pulse",
  "gift-shake":         "gift-shake",
  "gift-spin":          "gift-spin",
  "gift-sparkle":       "gift-sparkle",
  "gift-glow":          "gift-glow",
  "gift-orbit":         "gift-orbit",
  "gift-rainbow":       "gift-rainbow",
  "gift-3d-rose":       "gift-3d-rose",
  "gift-3d-bear":       "gift-3d-bear",
  "gift-3d-ring":       "gift-3d-ring",
  "gift-3d-rose-epic":  "gift-3d-rose-epic",
  "gift-3d-bear-glow":  "gift-3d-bear-glow",
  "gift-3d-ring-legend":"gift-3d-ring-legend",
};

export default function GiftItem({ category, variant, animKey, size = 56, rarity = "common" }: GiftItemProps) {
  const cssClass = ANIM_MAP[animKey] ?? "gift-float";

  const svgNode = useMemo(() => {
    switch (category) {
      case "heart": return <GiftHeart size={size} variant={variant} />;
      case "rose":  return <GiftRose  size={size} variant={variant} />;
      case "bear":  return <GiftBear  size={size} variant={variant} />;
      case "ring":  return <GiftRing  size={size} variant={variant} />;
    }
  }, [category, variant, size]);

  const hasParticles = rarity !== "common";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {hasParticles && <GiftParticles rarity={rarity} size={size} />}
      <div
        className={cssClass}
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {svgNode}
      </div>
    </div>
  );
}
