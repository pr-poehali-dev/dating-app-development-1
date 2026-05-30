import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// Дефолтный гендерный фон обложки: парни — синий, девушки — розовый, остальные — фиолетовый
function genderCover(gender?: string): { gradient: string; heart: string; glow: string } {
  if (gender === "male") {
    return {
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #3b82f6 100%)",
      heart: "rgba(255,255,255,0.16)",
      glow: "rgba(96,165,250,0.55)",
    };
  }
  if (gender === "female") {
    return {
      gradient: "linear-gradient(135deg, #be185d 0%, #ec4899 45%, #f472b6 100%)",
      heart: "rgba(255,255,255,0.18)",
      glow: "rgba(244,114,182,0.55)",
    };
  }
  return {
    gradient: "linear-gradient(135deg, #6d28d9 0%, #9333ea 45%, #a855f7 100%)",
    heart: "rgba(255,255,255,0.16)",
    glow: "rgba(168,85,247,0.5)",
  };
}

function DefaultCover({ gender }: { gender?: string }) {
  const c = genderCover(gender);
  const heartSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='${c.heart}'><path d='M12 21s-6.7-4.35-9.33-8.07C.9 10.3 1.4 7 4.1 5.6c1.9-.98 4.1-.4 5.4 1.1L12 9.2l2.5-2.5c1.3-1.5 3.5-2.08 5.4-1.1 2.7 1.4 3.2 4.7 1.43 7.33C18.7 16.65 12 21 12 21z'/></svg>`
  );
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: c.gradient }}>
      {/* Светящиеся пятна */}
      <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full blur-2xl opacity-60"
        style={{ background: `radial-gradient(circle, ${c.glow}, transparent 70%)` }} />
      <div className="absolute -bottom-12 -left-10 w-44 h-44 rounded-full blur-2xl opacity-45"
        style={{ background: `radial-gradient(circle, ${c.glow}, transparent 70%)` }} />
      {/* Паттерн сердечек */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,${heartSvg}")`,
          backgroundSize: "54px 54px",
          opacity: 0.9,
        }} />
      {/* Крупное декоративное сердце */}
      <Icon name="Heart" size={64} className="absolute right-5 top-3 text-white/15"
        fallback="Heart" />
    </div>
  );
}

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
    { key: "photos", icon: "Image", label: "Фото" },
    { key: "gifts",  icon: "Gift",  label: "Подарки" },
  ] as const;

  return (
    <div className="flex flex-col items-center mb-0">

      {/* ── Обложка ── */}
      <div className="relative w-full" style={{ marginBottom: 52 }}>
        <div className="w-full overflow-hidden relative"
          style={{ height: 150 }}>
          {localCover
            ? <img src={localCover} className="w-full h-full object-cover"
                style={{ opacity: coverUploading ? 0.5 : 1 }} />
            : <DefaultCover gender={currentUser.gender} />}
          {localCover && (
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(10,6,20,0.55) 100%)" }} />
          )}
          {coverUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
          {!coverUploading && (
            <button onClick={onCoverClick}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white/85 text-xs font-semibold transition-all active:scale-95"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <Icon name="ImagePlus" size={12} />Фон
            </button>
          )}
        </div>

        {/* ── Аватар ── */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -48 }}>
          <div className="relative" onClick={onAvatarClick} style={{ cursor: "pointer" }}>
            <div className="w-24 h-24 rounded-full"
              style={{
                padding: 3,
                background: currentUser.premium
                  ? "linear-gradient(135deg,#FF2D78,#FFD700,#9B59B6)"
                  : "linear-gradient(135deg,#FF2D78,#9B59B6)",
                boxShadow: "0 4px 20px rgba(255,45,120,0.45)",
              }}>
              <div className="w-full h-full rounded-full overflow-hidden bg-[var(--spark-dark)]">
                <img src={displayPhoto} className="w-full h-full object-cover"
                  style={{ opacity: photoUploading ? 0.5 : 1 }} />
              </div>
            </div>
            {photoUploading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                  boxShadow: "0 2px 8px rgba(255,45,120,0.5)",
                  outline: "2px solid var(--spark-dark)",
                }}>
                <Icon name="Camera" size={11} className="text-white" />
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

      {/* ── Табы: Фото / Приватное / Подарки ── */}
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

          {menuOpen && (
            <div className="absolute right-0 top-12 z-50 min-w-[260px] flex flex-col overflow-y-auto"
              style={{
                background: "linear-gradient(160deg, rgba(28,18,45,0.99) 0%, rgba(18,10,30,0.99) 100%)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 20,
                boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
                backdropFilter: "blur(32px)",
                maxHeight: "calc(100dvh - 220px)",
              }}>

              {/* Шапка меню — аватар + имя */}
              <div className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <img
                  src={currentUser.photo_url || "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg"}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  style={{ border: "2px solid rgba(255,45,120,0.4)" }}
                />
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm leading-tight truncate">{currentUser.name || "Профиль"}</p>
                  <p className="text-white/35 text-xs truncate">@{currentUser.username || currentUser.email?.split("@")[0] || "user"}</p>
                </div>
              </div>

              {/* Группа 1: Верификация + Настройки */}
              <div className="px-2 py-2 flex flex-col gap-0.5">
                {[
                  {
                    icon: "BadgeCheck" as const,
                    label: currentUser.verified ? "Верифицирован" : "Верификация",
                    sub: currentUser.verified ? "Профиль подтверждён" : "Подтверди личность",
                    action: () => { onVerify(); onMenuToggle(false); },
                    iconBg: currentUser.verified ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.07)",
                    iconColor: currentUser.verified ? "text-blue-400" : "text-white/50",
                    badge: currentUser.verified ? "✓" : undefined,
                  },
                  {
                    icon: "Settings" as const,
                    label: "Настройки аккаунта",
                    sub: "Имя, почта, юзернейм",
                    action: () => { onSettingsScreen("account"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "Shield" as const,
                    label: "Конфиденциальность",
                    sub: "Онлайн, видимость",
                    action: () => { onSettingsScreen("privacy"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "Bell" as const,
                    label: "Уведомления",
                    sub: "Матчи, сообщения",
                    action: () => { onSettingsScreen("notifications"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "Ban" as const,
                    label: "Заблокированные",
                    sub: "Управление блокировками",
                    action: () => { onSettingsScreen("blocked"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "HelpCircle" as const,
                    label: "Помощь",
                    sub: "Поддержка и FAQ",
                    action: () => { onSettingsScreen("help"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                ].map((item) => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all active:scale-[0.98]"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.iconBg }}>
                      <Icon name={item.icon} size={15} className={item.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-semibold leading-tight">{item.label}</p>
                      <p className="text-white/30 text-[11px] leading-tight mt-0.5">{item.sub}</p>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{item.badge}</span>
                    )}
                    <Icon name="ChevronRight" size={13} className="text-white/20 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Тема */}
              {onToggleTheme && (
                <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button onClick={onToggleTheme}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] mt-2"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isDark ? "rgba(251,191,36,0.12)" : "rgba(99,102,241,0.12)" }}>
                        <Icon name={isDark ? "Sun" : "Moon"} size={15} className={isDark ? "text-amber-400" : "text-indigo-400"} />
                      </div>
                      <div>
                        <p className="text-white/90 text-sm font-semibold leading-tight">{isDark ? "Светлая тема" : "Тёмная тема"}</p>
                        <p className="text-white/30 text-[11px] leading-tight mt-0.5">{isDark ? "Переключить на светлую" : "Переключить на тёмную"}</p>
                      </div>
                    </div>
                    <div className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all"
                      style={{ background: isDark ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: isDark ? "none" : "0 2px 8px rgba(255,45,120,0.4)" }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all"
                        style={{ left: isDark ? "3px" : "calc(100% - 19px)" }} />
                    </div>
                  </button>
                </div>
              )}

              {/* Выйти */}
              <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => { onLogout(); onMenuToggle(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] mt-2"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Icon name="LogOut" size={15} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-400 text-sm font-semibold leading-tight">Выйти из аккаунта</p>
                    <p className="text-red-400/40 text-[11px] leading-tight mt-0.5">Завершить сессию</p>
                  </div>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}