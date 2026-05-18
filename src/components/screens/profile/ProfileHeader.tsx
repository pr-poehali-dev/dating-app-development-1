import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help";
type ActiveTab = null | "settings" | "stats" | "shop" | "photos" | "private";

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
  onTabChange: (tab: ActiveTab) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  onPremium: () => void;
}) {
  const displayPhoto = localPhoto || FALLBACK_PHOTO;

  return (
    <div className="flex flex-col items-center px-5 mb-0">
      {/* Обложка + аватар */}
      <div className="relative mb-3 w-full">
        <div className="w-full h-32 rounded-2xl overflow-hidden relative"
          style={{ background: localCover ? undefined : "linear-gradient(135deg,#1a0030,#3d0060)" }}>
          {localCover && (
            <img src={localCover} className="w-full h-full object-cover"
              style={{ opacity: coverUploading ? 0.5 : 1 }} />
          )}
          {coverUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
          {!coverUploading && (
            <button onClick={onCoverClick}
              className="absolute top-2 right-2 glass-card px-2 py-1.5 flex items-center gap-1.5 text-white/70 text-xs"
              style={{ backdropFilter: "blur(8px)" }}>
              <Icon name="ImagePlus" size={13} />Фон
            </button>
          )}
        </div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="relative" onClick={onAvatarClick} style={{ cursor: "pointer" }}>
            <img src={displayPhoto} className="w-24 h-24 rounded-full object-cover transition-opacity"
              style={{ boxShadow: "0 0 0 3px #FF2D78", border: "3px solid var(--spark-dark,#0f0a1a)", opacity: photoUploading ? 0.5 : 1 }} />
            {photoUploading ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center btn-grad shadow-lg">
                <Icon name="Camera" size={12} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-12" />
      {photoError && <p className="text-red-400 text-xs mb-1 text-center">{photoError}</p>}

      <div className="flex items-center gap-1.5 mt-1">
        {currentUser.username && (
          <p className="text-white/40 text-xs font-mono">@{currentUser.username}</p>
        )}
        {currentUser.premium && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
            ✨ GOLD
          </span>
        )}
      </div>
      <h3 className="text-white font-bold text-xl mt-0.5">
        {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ""}
        {currentUser.verified && <span className="ml-1.5 text-blue-400 text-base">✓</span>}
      </h3>

      {/* Кнопки Фото / Приватное фото */}
      <div className="grid grid-cols-2 gap-2 w-full mt-4">
        <button onClick={() => onTabChange((activeTab as string) === "photos" ? null : "photos" as ActiveTab)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-95"
          style={(activeTab as string) === "photos"
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
            : { background: "rgba(255,255,255,0.08)" }}>
          <Icon name="Image" size={18} className={(activeTab as string) === "photos" ? "text-white" : "text-white/60"} />
          <span className={`text-sm font-semibold ${(activeTab as string) === "photos" ? "text-white" : "text-white/60"}`}>Фото</span>
        </button>
        <button onClick={() => onTabChange((activeTab as string) === "private" ? null : "private" as ActiveTab)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-95"
          style={(activeTab as string) === "private"
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
            : { background: "rgba(255,255,255,0.08)" }}>
          <Icon name="Lock" size={18} className={(activeTab as string) === "private" ? "text-white" : "text-white/60"} />
          <span className={`text-sm font-semibold ${(activeTab as string) === "private" ? "text-white" : "text-white/60"}`}>Приватное фото</span>
        </button>
      </div>

    </div>
  );
}

export function ProfileTopBar({
  activeTab,
  onEditOpen,
  onTabChange,
  onSettingsScreen,
  onLogout,
  onVerify,
  currentUser,
}: {
  activeTab: ActiveTab;
  onEditOpen: () => void;
  onTabChange: (tab: ActiveTab) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  currentUser: User;
}) {
  return (
    <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
      <h2 className="text-white font-golos font-bold text-2xl">Профиль</h2>
      <div className="flex items-center gap-2">
        <button onClick={onEditOpen}
          className="glass-card px-3 py-1.5 flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors">
          <Icon name="Pencil" size={14} />Изменить
        </button>
        <div className="relative">
          <button onClick={() => onTabChange(activeTab === "settings" ? null : "settings")}
            className="glass-card p-2 flex items-center justify-center transition-colors"
            style={activeTab === "settings" ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : {}}>
            <Icon name="MoreVertical" size={18} className="text-white/70" />
          </button>
          {activeTab === "settings" && (
            <div className="absolute right-0 top-10 z-50 rounded-2xl overflow-hidden shadow-2xl min-w-[220px]"
              style={{ background: "rgba(22,16,36,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {[
                { icon: "BadgeCheck", label: currentUser.verified ? "✓ Верифицирован" : "Верификация", action: () => { onVerify(); onTabChange(null); }, accent: currentUser.verified ? "blue" : "" },
                { icon: "User",       label: "Настройки аккаунта",   action: () => { onSettingsScreen("account"); onTabChange(null); } },
                { icon: "Shield",     label: "Конфиденциальность",   action: () => { onSettingsScreen("privacy"); onTabChange(null); } },
                { icon: "Lock",       label: "Приватные фото",       action: () => { onSettingsScreen("private_photos"); onTabChange(null); } },
                { icon: "Ban",        label: "Заблокированные",      action: () => { onSettingsScreen("blocked"); onTabChange(null); } },
                { icon: "Bell",       label: "Уведомления",          action: () => { onSettingsScreen("notifications"); onTabChange(null); } },
                { icon: "Palette",    label: "Внешний вид",          action: () => { onSettingsScreen("appearance"); onTabChange(null); } },
                { icon: "Volume2",    label: "Звуки",                action: () => { onSettingsScreen("sounds"); onTabChange(null); } },
                { icon: "Video",      label: "Видеочат",             action: () => { onSettingsScreen("videochat"); onTabChange(null); } },
                { icon: "HelpCircle", label: "Помощь и поддержка",  action: () => { onSettingsScreen("help"); onTabChange(null); } },
                { icon: "LogOut",     label: "Выйти",                action: () => { onLogout(); onTabChange(null); }, danger: true },
              ].map(({ icon, label, action, danger, accent }, i, arr) => (
                <button key={label} onClick={action}
                  className="flex items-center gap-3 px-4 py-3 w-full hover:bg-white/5 transition-colors text-left"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <Icon name={icon as "BadgeCheck"|"User"|"Shield"|"Lock"|"Ban"|"Bell"|"Palette"|"Volume2"|"Video"|"HelpCircle"|"LogOut"} size={16}
                    className={danger ? "text-red-400" : accent === "blue" ? "text-blue-400" : "text-white/50"} />
                  <span className={`${danger ? "text-red-400" : accent === "blue" ? "text-blue-400" : "text-white/80"} text-sm flex-1`}>{label}</span>
                  {!danger && <Icon name="ChevronRight" size={13} className="text-white/20" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}