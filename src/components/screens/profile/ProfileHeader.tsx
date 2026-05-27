import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help";
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

  const tabs = [
    { key: "photos",  icon: "Image",  label: "Фото" },
    { key: "private", icon: "Lock",   label: "Приватное" },
    { key: "gifts",   icon: "Gift",   label: "Подарки" },
  ] as const;

  return (
    <div className="flex flex-col items-center mb-0">

      {/* ── Обложка ── */}
      <div className="relative w-full mb-14">
        <div className="w-full overflow-hidden relative"
          style={{
            height: 160,
            background: localCover ? undefined : "linear-gradient(135deg, #2d0050 0%, #1a0030 50%, #3d0060 100%)",
          }}>
          {localCover && (
            <img src={localCover} className="w-full h-full object-cover"
              style={{ opacity: coverUploading ? 0.5 : 1 }} />
          )}
          {/* Градиент снизу для плавного перехода */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to bottom, transparent 40%, rgba(15,10,26,0.6) 100%)",
          }} />
          {coverUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
          {!coverUploading && (
            <button onClick={onCoverClick}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/80 text-xs font-medium transition-all active:scale-95"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <Icon name="ImagePlus" size={13} />Фон
            </button>
          )}
        </div>

        {/* ── Аватар поверх обложки ── */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="relative" onClick={onAvatarClick} style={{ cursor: "pointer" }}>
            {/* Кольцо-градиент */}
            <div className="w-24 h-24 rounded-full p-[3px]"
              style={{ background: currentUser.premium
                ? "linear-gradient(135deg, #FF2D78, #FFD700, #9B59B6)"
                : "linear-gradient(135deg, #FF2D78, #9B59B6)",
                boxShadow: "0 4px 20px rgba(255,45,120,0.5)",
              }}>
              <div className="w-full h-full rounded-full overflow-hidden"
                style={{ border: "3px solid #0f0a1a" }}>
                <img src={displayPhoto} className="w-full h-full object-cover"
                  style={{ opacity: photoUploading ? 0.5 : 1 }} />
              </div>
            </div>
            {photoUploading ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", border: "2px solid #0f0a1a" }}>
                <Icon name="Camera" size={12} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {photoError && <p className="text-red-400 text-xs mb-1 text-center px-4">{photoError}</p>}

      {/* ── Имя и бейджи ── */}
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
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold leading-none"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
              ✨ GOLD
            </span>
          )}
        </div>
      </div>

      {/* ── Табы: Фото / Приватное / Подарки ── */}
      <div className="w-full mt-4 px-4">
        <div className="flex rounded-2xl p-1 gap-1"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {tabs.map(({ key, icon, label }) => {
            const isActive = (activeTab as string) === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange((isActive ? null : key) as ActiveTab)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all active:scale-95"
                style={isActive
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 3px 12px rgba(255,45,120,0.4)" }
                  : {}}>
                <Icon name={icon} size={15} className={isActive ? "text-white" : "text-white/40"} />
                <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-white/40"}`}>{label}</span>
              </button>
            );
          })}
        </div>
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
          <button onClick={() => onTabChange(activeTab === "settings" ? null : "settings")}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={activeTab === "settings"
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
              : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="MoreVertical" size={18} className="text-white/80" />
          </button>

          {activeTab === "settings" && (
            <div className="absolute right-0 top-11 z-50 rounded-2xl overflow-hidden shadow-2xl min-w-[230px]"
              style={{ background: "rgba(20,14,32,0.98)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
              {[
                { icon: "BadgeCheck", label: currentUser.verified ? "✓ Верифицирован" : "Верификация", action: () => { onVerify(); onTabChange(null); }, blue: currentUser.verified },
                { icon: "User",       label: "Настройки аккаунта",   action: () => { onSettingsScreen("account"); onTabChange(null); } },
                { icon: "Shield",     label: "Конфиденциальность",   action: () => { onSettingsScreen("privacy"); onTabChange(null); } },
                { icon: "Lock",       label: "Приватные фото",       action: () => { onSettingsScreen("private_photos"); onTabChange(null); } },
                { icon: "Ban",        label: "Заблокированные",      action: () => { onSettingsScreen("blocked"); onTabChange(null); } },
                { icon: "Bell",       label: "Уведомления",          action: () => { onSettingsScreen("notifications"); onTabChange(null); } },
                { icon: "HelpCircle", label: "Помощь",               action: () => { onSettingsScreen("help"); onTabChange(null); } },
              ].map((item, i, arr) => (
                <button key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors"
                  style={i < arr.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.06)" } : {}}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: (item as {blue?: boolean}).blue ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.07)" }}>
                    <Icon name={item.icon as "BadgeCheck"|"User"|"Shield"|"Lock"|"Ban"|"Bell"|"HelpCircle"} size={14}
                      className={(item as {blue?: boolean}).blue ? "text-blue-400" : "text-white/60"} />
                  </div>
                  <span className={`text-sm font-medium ${(item as {blue?: boolean}).blue ? "text-blue-400" : "text-white/80"}`}>{item.label}</span>
                </button>
              ))}
              <button onClick={() => { onLogout(); onTabChange(null); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.1)" }}>
                  <Icon name="LogOut" size={14} className="text-red-400" />
                </div>
                <span className="text-red-400 text-sm font-medium">Выйти из аккаунта</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}