import { useMemo, useEffect, useRef, useState } from "react";
import GiftHeart from "./GiftHeart";
import GiftRose from "./GiftRose";
import GiftBear from "./GiftBear";
import GiftRing from "./GiftRing";
import GiftParticles from "./GiftParticles";
import AnimatedGift from "./AnimatedGift";

type GiftCategory = "heart" | "rose" | "bear" | "ring" | "special";
type Rarity = "common" | "rare" | "epic" | "legendary";

interface GiftItemProps {
  category: GiftCategory;
  variant: number;
  animKey: string;
  size?: number;
  rarity?: Rarity;
  selected?: boolean;
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

const RARITY_FLASH: Record<Rarity, string> = {
  common:    "rgba(255,255,255,0.7)",
  rare:      "rgba(99,179,237,0.85)",
  epic:      "rgba(159,122,234,0.9)",
  legendary: "rgba(255,200,0,0.95)",
};

export default function GiftItem({ category, variant, animKey, size = 56, rarity = "common", selected = false }: GiftItemProps) {
  const cssClass = ANIM_MAP[animKey] ?? "gift-float";
  const [flashing, setFlashing] = useState(false);
  const [rings, setRings] = useState<number[]>([]);
  const prevSelected = useRef(false);
  const ringCounter = useRef(0);

  useEffect(() => {
    if (selected && !prevSelected.current) {
      setFlashing(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setFlashing(true)));
      const ids = [++ringCounter.current, ++ringCounter.current];
      setRings(r => [...r, ...ids]);
      setTimeout(() => setRings(r => r.filter(x => !ids.includes(x))), 700);
    }
    prevSelected.current = selected;
  }, [selected]);

  const svgNode = useMemo(() => {
    switch (category) {
      case "heart": return <GiftHeart size={size} variant={variant} />;
      case "rose":  return <GiftRose  size={size} variant={variant} />;
      case "bear":  return <GiftBear  size={size} variant={variant} />;
      case "ring":  return <GiftRing  size={size} variant={variant} />;
    }
  }, [category, variant, size]);

  const flashColor = RARITY_FLASH[rarity];
  const hasParticles = rarity !== "common";

  // Особые анимированные подарки (в стиле Telegram) с фоном
  if (category === "special") {
    return <AnimatedGift size={size} withBackground burst={selected} />;
  }

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {hasParticles && <GiftParticles rarity={rarity} size={size} />}

      {/* Expanding rings on select */}
      {rings.map((id, i) => (
        <div key={id} style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `2.5px solid ${flashColor}`,
          animation: `giftSelectRing 0.5s ${i * 0.1}s ease-out forwards`,
          pointerEvents: "none", zIndex: 20,
        }} />
      ))}

      {/* Radial burst overlay */}
      {flashing && (
        <div
          onAnimationEnd={() => setFlashing(false)}
          style={{
            position: "absolute",
            inset: `-${size * 0.18}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${flashColor} 0%, transparent 65%)`,
            animation: "giftSelectBurst 0.38s ease-out forwards",
            pointerEvents: "none", zIndex: 15,
          }}
        />
      )}

      <div
        className={`${cssClass}${flashing ? " gift-flash" : ""}`}
        style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}
      >
        {svgNode}
      </div>
    </div>
  );
}