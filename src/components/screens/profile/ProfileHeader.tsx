import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { ProfileCoverAvatar } from "@/components/screens/profile/ProfileCoverAvatar";
import { ProfileTopBarMenu } from "@/components/screens/profile/ProfileTopBarMenu";
import { getStreakReward } from "@/lib/streakRewards";
import { TIER_STYLES, resolveTier } from "@/lib/premiumTiers";
import { type AppTheme } from "@/hooks/useAppTheme";

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help" | "security" | "data_storage" | "stickers";

export function ProfileHeader({
  currentUser,
  localPhoto,
  localCover,
  photoUploading,
  coverUploading,
  photoError,
  streakDays = 0,
  onAvatarClick,
  onCoverClick,
  onCoverOpen,
}: {
  currentUser: User;
  localPhoto: string;
  localCover: string;
  photoUploading: boolean;
  coverUploading: boolean;
  photoError: string;
  streakDays?: number;
  onAvatarClick: () => void;
  onCoverClick: () => void;
  onCoverOpen?: () => void;
}) {
  const streakReward = getStreakReward(streakDays);
  const tier = resolveTier(currentUser.premium, currentUser.premium_tier);
  const tierStyle = tier ? TIER_STYLES[tier] : null;

  return (
    <div className="flex flex-col items-center mb-0" style={{ position: "relative", zIndex: 1 }}>

      <ProfileCoverAvatar
        currentUser={currentUser}
        localPhoto={localPhoto}
        localCover={localCover}
        photoUploading={photoUploading}
        coverUploading={coverUploading}
        onAvatarClick={onAvatarClick}
        onCoverClick={onCoverClick}
        onCoverOpen={onCoverOpen}
        streakDays={streakDays}
      />

      {photoError && <p className="text-red-400 text-xs mb-1 text-center px-4">{photoError}</p>}

      {/* Имя и бейджи */}
      <div className="flex flex-col items-center gap-1 px-5" style={{ position: "relative", zIndex: 2 }}>
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-xl leading-tight">
            {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ""}
          </h3>
          {currentUser.verified && (
            <div className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 22, height: 22,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#FF2D78,#C061FF)",
                boxShadow: "0 0 0 2px rgba(255,45,120,0.3), 0 2px 10px rgba(255,45,120,0.5)",
              }}>
              <Icon name="BadgeCheck" size={15} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentUser.username && (
            <span className="text-white/35 text-xs font-mono">@{currentUser.username}</span>
          )}
          {tierStyle && (
            <span className="relative overflow-hidden text-[10px] px-2.5 py-0.5 rounded-full font-black leading-none tracking-wide select-none flex items-center gap-1"
              style={{
                background: tierStyle.gradient,
                backgroundSize: "200% 100%",
                color: tierStyle.textColor,
                boxShadow: `${tierStyle.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                animation: "goldShimmer 2.5s linear infinite",
                border: `1px solid ${tierStyle.border}`,
                textShadow: "0 1px 0 rgba(255,255,255,0.25)",
              }}>
              <Icon name={tierStyle.icon as "Crown"} size={10} style={{ color: tierStyle.textColor }} />
              {tierStyle.label}
            </span>
          )}
          {streakReward && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold leading-none"
              style={{
                background: `${streakReward.ringColor}`,
                color: "#fff",
                boxShadow: streakReward.glow,
              }}>
              {streakReward.badge} {streakReward.label}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}

export function ProfileTopBar({
  menuOpen,
  onEditOpen,
  onMenuToggle,
  onSettingsScreen,
  onLogout,
  onVerify,
  currentUser,
  appTheme,
  onAppThemeChange,
}: {
  menuOpen: boolean;
  onEditOpen: () => void;
  onMenuToggle: (open: boolean) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  currentUser: User;
  appTheme?: AppTheme;
  onAppThemeChange?: (t: AppTheme) => void;
}) {
  return (
    <div className="px-4 pb-2 flex items-center justify-between flex-shrink-0"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
      <h2 className="text-white font-bold text-2xl">Профиль</h2>
      <div className="flex items-center gap-2">
        {/* Изменить */}
        <button onClick={onEditOpen}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white/75 text-sm font-medium transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Pencil" size={14} />
          <span>Изменить</span>
        </button>

        {/* Меню */}
        <div className="relative">
          <button onClick={() => onMenuToggle(!menuOpen)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={menuOpen
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
              : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="MoreVertical" size={18} className="text-white/80" />
          </button>

          <ProfileTopBarMenu
            menuOpen={menuOpen}
            onMenuToggle={onMenuToggle}
            onSettingsScreen={onSettingsScreen}
            onLogout={onLogout}
            onVerify={onVerify}
            currentUser={currentUser}
            appTheme={appTheme}
            onAppThemeChange={onAppThemeChange}
          />
        </div>
      </div>
    </div>
  );
}