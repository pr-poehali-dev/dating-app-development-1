import { useMemo } from "react";
import GiftHeart from "./GiftHeart";
import GiftRose from "./GiftRose";
import GiftBear from "./GiftBear";
import GiftRing from "./GiftRing";

type GiftCategory = "heart" | "rose" | "bear" | "ring";
type AnimStyle = "float" | "pulse" | "shake" | "spin" | "sparkle" | "glow" | "orbit" | "rainbow" | "3d-rose" | "3d-bear" | "3d-ring" | "3d-rose-epic" | "3d-bear-glow" | "3d-ring-legend";

interface GiftItemProps {
  category: GiftCategory;
  variant: number;
  animKey: string;
  size?: number;
}

const ANIM_MAP: Record<string, string> = {
  "gift-float":        "gift-float",
  "gift-pulse":        "gift-pulse",
  "gift-shake":        "gift-shake",
  "gift-spin":         "gift-spin",
  "gift-sparkle":      "gift-sparkle",
  "gift-glow":         "gift-glow",
  "gift-orbit":        "gift-orbit",
  "gift-rainbow":      "gift-rainbow",
  "gift-3d-rose":      "gift-3d-rose",
  "gift-3d-bear":      "gift-3d-bear",
  "gift-3d-ring":      "gift-3d-ring",
  "gift-3d-rose-epic": "gift-3d-rose-epic",
  "gift-3d-bear-glow": "gift-3d-bear-glow",
  "gift-3d-ring-legend":"gift-3d-ring-legend",
};

export default function GiftItem({ category, variant, animKey, size = 56 }: GiftItemProps) {
  const cssClass = ANIM_MAP[animKey] ?? "gift-float";

  const svgNode = useMemo(() => {
    switch (category) {
      case "heart": return <GiftHeart size={size} variant={variant} />;
      case "rose":  return <GiftRose  size={size} variant={variant} />;
      case "bear":  return <GiftBear  size={size} variant={variant} />;
      case "ring":  return <GiftRing  size={size} variant={variant} />;
    }
  }, [category, variant, size]);

  return (
    <div className={cssClass} style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {svgNode}
    </div>
  );
}
