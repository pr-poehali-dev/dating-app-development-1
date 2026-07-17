import Icon from "@/components/ui/icon";
import type { StreakReward } from "@/lib/streakRewards";
import { TIER_STYLES, resolveTier, type PremiumTier } from "@/lib/premiumTiers";

interface ProfilePhotoBadgesProps {
  profileVerified?: boolean;
  profilePremium?: boolean;
  profilePremiumTier?: PremiumTier | null;
  profileBoosted?: boolean;
  streakReward: StreakReward | null;
}

// ─── ProfilePhotoBadges ────────────────────────────────────────────────────────
export function ProfilePhotoBadges({
  profileVerified,
  profilePremium,
  profilePremiumTier,
  profileBoosted,
  streakReward,
}: ProfilePhotoBadgesProps) {
  const tier = resolveTier(profilePremium, profilePremiumTier);
  const tierStyle = tier ? TIER_STYLES[tier] : null;

  return (
    <>
      {profileVerified && (
        <div className="flex-shrink-0 flex items-center justify-center"
          style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#FF2D78,#C061FF)", boxShadow: "0 0 0 2px rgba(255,45,120,0.3), 0 2px 8px rgba(255,45,120,0.45)" }}>
          <Icon name="BadgeCheck" size={14} className="text-white" />
        </div>
      )}
      {tierStyle && (
        <span className="relative inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black leading-none tracking-wider select-none flex-shrink-0 overflow-hidden"
          style={{
            background: tierStyle.gradient,
            backgroundSize: "200% 100%",
            color: tierStyle.textColor,
            border: `1px solid ${tierStyle.border}`,
            boxShadow: `${tierStyle.shadow}, inset 0 1px 1px rgba(255,255,255,0.4)`,
            textShadow: "0 1px 0 rgba(255,255,255,0.25)",
            animation: "goldShimmer 2.5s linear infinite",
          }}>
          <Icon name={tierStyle.icon as "Crown"} size={11} style={{ color: tierStyle.textColor }} />
          {tierStyle.label}
          <span className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(75deg, transparent 35%, rgba(255,255,255,0.85) 50%, transparent 65%)",
              backgroundSize: "250% 100%",
              animation: "goldShine 3.2s ease-in-out infinite",
            }} />
        </span>
      )}
      {profileBoosted && (
        <span className="relative inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black leading-none tracking-wider select-none flex-shrink-0 overflow-hidden text-white"
          style={{
            background: "linear-gradient(120deg,#FF2D78,#FF6B35,#9B59B6,#FF2D78)",
            backgroundSize: "200% 100%",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: "0 2px 12px rgba(255,45,120,0.65), inset 0 1px 1px rgba(255,255,255,0.45)",
            animation: "goldShimmer 2.2s linear infinite",
          }}>
          <Icon name="Zap" size={11} className="text-white" />
          BOOST
          <span className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(75deg, transparent 35%, rgba(255,255,255,0.9) 50%, transparent 65%)",
              backgroundSize: "250% 100%",
              animation: "goldShine 3s ease-in-out infinite",
            }} />
        </span>
      )}
      {streakReward && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold leading-none flex-shrink-0"
          style={{
            background: streakReward.ringColor,
            boxShadow: streakReward.glow,
            color: "#fff",
          }}>
          {streakReward.badge} {streakReward.label}
        </span>
      )}
    </>
  );
}