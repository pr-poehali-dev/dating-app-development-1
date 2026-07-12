import Icon from "@/components/ui/icon";
import type { StreakReward } from "@/lib/streakRewards";

interface ProfilePhotoBadgesProps {
  profileVerified?: boolean;
  profilePremium?: boolean;
  profileBoosted?: boolean;
  streakReward: StreakReward | null;
}

// ─── ProfilePhotoBadges ────────────────────────────────────────────────────────
export function ProfilePhotoBadges({
  profileVerified,
  profilePremium,
  profileBoosted,
  streakReward,
}: ProfilePhotoBadgesProps) {
  return (
    <>
      {profileVerified && (
        <div className="flex-shrink-0 flex items-center justify-center"
          style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#FF2D78,#C061FF)", boxShadow: "0 0 0 2px rgba(255,45,120,0.3), 0 2px 8px rgba(255,45,120,0.45)" }}>
          <Icon name="BadgeCheck" size={14} className="text-white" />
        </div>
      )}
      {profilePremium && (
        <span className="relative inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black leading-none tracking-wider select-none flex-shrink-0 overflow-hidden"
          style={{
            background: "linear-gradient(120deg,#9A6A06,#FFD700,#FFF6C2,#FFD700,#9A6A06)",
            backgroundSize: "200% 100%",
            color: "#3a2700",
            border: "1px solid rgba(255,236,150,0.85)",
            boxShadow: "0 2px 10px rgba(255,200,40,0.55), inset 0 1px 1px rgba(255,255,255,0.6)",
            textShadow: "0 1px 0 rgba(255,255,255,0.35)",
            animation: "goldShimmer 2.5s linear infinite",
          }}>
          <Icon name="Crown" size={11} style={{ color: "#3a2700" }} />
          PREMIUM
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
