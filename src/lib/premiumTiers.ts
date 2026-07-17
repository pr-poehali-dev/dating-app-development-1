// ─── Тарифы подписки Полутон ────────────────────────────────────────────────
export type PremiumTier = "start" | "plus" | "gold";

interface TierStyle {
  label: string;
  icon: string;
  gradient: string;
  textColor: string;
  border: string;
  shadow: string;
}

export const TIER_STYLES: Record<PremiumTier, TierStyle> = {
  start: {
    label: "СТАРТ",
    icon: "Sparkles",
    gradient: "linear-gradient(120deg,#1d4ed8,#3B82F6,#93c5fd,#3B82F6,#1d4ed8)",
    textColor: "#ffffff",
    border: "rgba(147,197,253,0.6)",
    shadow: "0 2px 10px rgba(59,130,246,0.5)",
  },
  plus: {
    label: "ПЛЮС",
    icon: "Zap",
    gradient: "linear-gradient(120deg,#C2185B,#FF2D78,#FF6B35,#FF2D78,#C2185B)",
    textColor: "#ffffff",
    border: "rgba(255,150,190,0.6)",
    shadow: "0 2px 10px rgba(255,45,120,0.5)",
  },
  gold: {
    label: "ЗОЛОТО",
    icon: "Crown",
    gradient: "linear-gradient(120deg,#9A6A06,#FFD700,#FFF6C2,#FFD700,#9A6A06)",
    textColor: "#3a2700",
    border: "rgba(255,236,150,0.85)",
    shadow: "0 2px 10px rgba(255,200,40,0.55)",
  },
};

/** Определяет тариф пользователя: явный tier, либо gold по умолчанию для старых premium-аккаунтов */
export function resolveTier(premium?: boolean, tier?: string | null): PremiumTier | null {
  if (!premium) return null;
  if (tier === "start" || tier === "plus" || tier === "gold") return tier;
  return "gold";
}
