import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { ProfileCoverAvatar } from "@/components/screens/profile/ProfileCoverAvatar";
import { ProfileTopBarMenu } from "@/components/screens/profile/ProfileTopBarMenu";

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help" | "security";
type ActiveTab = null | "settings" | "stats" | "shop" | "photos" | "private" | "gifts";

export function ProfileHeader({
  currentUser,
  localPhoto,
  localCover,
  photoUploading,
  coverUploading,
  photoError,
  activeTab,
  onEditOpen,
  onAvatarClick,
  onCoverClick,
  onCoverOpen,
  onTabChange,
  onSettingsScreen,
  onLogout,
  onVerify,
  onPremium,
}: {
  currentUser: User;
  localPhoto: string;
  localCover: string;
  photoUploading: boolean;
  coverUploading: boolean;
  photoError: string;
  activeTab: ActiveTab;
  onEditOpen: () => void;
  onAvatarClick: () => void;
  onCoverClick: () => void;
  onCoverOpen?: () => void;
  onTabChange: (tab: ActiveTab) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  onPremium: () => void;
}) {
  const tabs = [
    { key: "photos", icon: "Image", label: "Фото" },
    { key: "gifts",  icon: "Gift",  label: "Подарки" },
  ] as const;

  return (
    <div className="flex flex-col items-center mb-0">

      <ProfileCoverAvatar
        currentUser={currentUser}
        localPhoto={localPhoto}
        localCover={localCover}
        photoUploading={photoUploading}
        coverUploading={coverUploading}
        onAvatarClick={onAvatarClick}
        onCoverClick={onCoverClick}
        onCoverOpen={onCoverOpen}
      />

      {photoError && <p className="text-red-400 text-xs mb-1 text-center px-4">{photoError}</p>}

      {/* Имя и бейджи */}
      <div className="flex flex-col items-center gap-1 px-5">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-xl leading-tight">
            {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ""}
          </h3>
          {currentUser.verified && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.2)" }}>
              <Icon name="BadgeCheck" size={14} className="text-blue-400" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentUser.username && (
            <span className="text-white/35 text-xs font-mono">@{currentUser.username}</span>
          )}
          {currentUser.premium && (
            <span className="relative overflow-hidden text-[10px] px-2.5 py-0.5 rounded-full font-black leading-none tracking-wide select-none"
              style={{
                background: "linear-gradient(120deg,#B8860B,#FFD700,#FFF0A0,#FFD700,#B8860B)",
                backgroundSize: "200% 100%",
                color: "#1a1000",
                boxShadow: "0 0 8px rgba(255,215,0,0.6), 0 0 2px rgba(255,215,0,0.9), inset 0 1px 0 rgba(255,255,255,0.4)",
                animation: "goldShimmer 2.5s linear infinite",
                border: "1px solid rgba(255,215,0,0.5)",
                textShadow: "0 1px 0 rgba(255,255,255,0.4)",
              }}>
              ✦ PREMIUM
            </span>
          )}
        </div>
      </div>

      {/* Табы: Фото / Подарки */}
      <div className="w-full mt-6 px-4">
        <div className="flex rounded-2xl gap-1 p-1"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(({ key, icon, label }) => {
            const isActive = (activeTab as string) === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange((isActive ? null : key) as ActiveTab)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-[0.97]"
                style={isActive
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.35)" }
                  : { background: "transparent" }}>
                <Icon name={icon} size={14} className={isActive ? "text-white" : "text-white/35"} />
                <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-white/35"}`}>{label}</span>
              </button>
            );
          })}
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
  isDark,
  onToggleTheme,
}: {
  menuOpen: boolean;
  onEditOpen: () => void;
  onMenuToggle: (open: boolean) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  currentUser: User;
  isDark?: boolean;
  onToggleTheme?: () => void;
}) {
  return (
    <div className="px-4 pt-5 pb-2 flex items-center justify-between flex-shrink-0">
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
            isDark={isDark}
            onToggleTheme={onToggleTheme}
          />
        </div>
      </div>
    </div>
  );
}