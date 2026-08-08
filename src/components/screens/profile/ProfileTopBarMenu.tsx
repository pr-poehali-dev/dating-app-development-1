import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { ProfileLegalSheet } from "@/components/screens/profile/ProfileLegalSheet";
import { ProfileThemeSheet } from "@/components/screens/profile/ProfileThemeSheet";
import { ProfileLanguageSheet } from "@/components/screens/profile/ProfileLanguageSheet";
import { ProfileSubscriptionSheet } from "@/components/screens/profile/ProfileSubscriptionSheet";
import { useBackHandler } from "@/hooks/backStack";
import { DEFAULT_AVATAR } from "@/components/ui/UserAvatar";
import { THEME_META, type AppTheme } from "@/hooks/useAppTheme";
import { useAppIcon } from "@/hooks/useAppIcon";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help" | "security" | "data_storage" | "stickers";

export function ProfileTopBarMenu({
  menuOpen,
  onMenuToggle,
  onSettingsScreen,
  onLogout,
  onVerify,
  onPremium,
  currentUser,
  appTheme,
  onAppThemeChange,
}: {
  menuOpen: boolean;
  onMenuToggle: (open: boolean) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  onPremium?: () => void;
  currentUser: User;
  appTheme?: AppTheme;
  onAppThemeChange?: (t: AppTheme) => void;
}) {
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy">("terms");
  const [showTheme, setShowTheme] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const { icon: appIcon, setIcon: setAppIcon, native: iconNative } = useAppIcon();
  const { i18n } = useTranslation();
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  // Кнопка "Назад" закрывает меню настроек, а не выбрасывает из профиля
  useBackHandler(menuOpen || showLegal || showTheme || showLanguage || showSubscription, () => {
    if (showSubscription) { setShowSubscription(false); return; }
    if (showLanguage) { setShowLanguage(false); return; }
    if (showTheme) { setShowTheme(false); return; }
    if (showLegal) { setShowLegal(false); return; }
    onMenuToggle(false);
  });

  const menuItems = [
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
      icon: "Sparkles" as const,
      label: "Мои подписки",
      sub: currentUser.premium ? "Premium активен" : "Оформи Premium",
      action: () => { setShowSubscription(true); },
      iconBg: currentUser.premium ? "rgba(255,45,120,0.14)" : "rgba(255,255,255,0.07)",
      iconColor: currentUser.premium ? "text-pink-400" : "text-white/50",
      badge: currentUser.premium ? "✓" : undefined,
    },
    {
      icon: "Settings" as const,
      label: "Настройки аккаунта",
      sub: "Имя, почта, юзернейм",
      action: () => { onSettingsScreen("account"); onMenuToggle(false); },
      iconBg: "rgba(255,255,255,0.07)",
      iconColor: "text-white/50",
      badge: undefined,
    },
    {
      icon: "Shield" as const,
      label: "Конфиденциальность",
      sub: "Онлайн, видимость",
      action: () => { onSettingsScreen("privacy"); onMenuToggle(false); },
      iconBg: "rgba(255,255,255,0.07)",
      iconColor: "text-white/50",
      badge: undefined,
    },
    {
      icon: "Bell" as const,
      label: "Уведомления",
      sub: "Матчи, сообщения",
      action: () => { onSettingsScreen("notifications"); onMenuToggle(false); },
      iconBg: "rgba(255,255,255,0.07)",
      iconColor: "text-white/50",
      badge: undefined,
    },
    {
      icon: "Sticker" as const,
      label: "Стикеры и эмодзи",
      sub: "Наборы стикеров, эмодзи",
      action: () => { onSettingsScreen("stickers"); onMenuToggle(false); },
      iconBg: "rgba(255,106,61,0.14)",
      iconColor: "text-orange-400",
      badge: undefined,
    },
    {
      icon: "Ban" as const,
      label: "Заблокированные",
      sub: "Управление блокировками",
      action: () => { onSettingsScreen("blocked"); onMenuToggle(false); },
      iconBg: "rgba(255,255,255,0.07)",
      iconColor: "text-white/50",
      badge: undefined,
    },
    {
      icon: "ShieldCheck" as const,
      label: "Безопасность",
      sub: "Пароль, устройства, сессии",
      action: () => { onSettingsScreen("security"); onMenuToggle(false); },
      iconBg: "rgba(255,45,120,0.12)",
      iconColor: "text-pink-400",
      badge: undefined,
    },
    {
      icon: "HardDrive" as const,
      label: "Данные и память",
      sub: "Кэш, трафик, автозагрузка",
      action: () => { onSettingsScreen("data_storage"); onMenuToggle(false); },
      iconBg: "rgba(251,146,60,0.12)",
      iconColor: "text-orange-400",
      badge: undefined,
    },
    ...(onAppThemeChange ? [{
      icon: "Palette" as const,
      label: "Тема оформления",
      sub: appTheme ? THEME_META[appTheme].sub : "Тема и иконка приложения",
      action: () => { setShowTheme(true); },
      iconBg: "rgba(255,45,120,0.12)",
      iconColor: "text-pink-400",
      badge: appTheme ? THEME_META[appTheme].label : undefined,
    }] : []),
    {
      icon: "Languages" as const,
      label: "Выбор языка",
      sub: "Язык интерфейса приложения",
      action: () => { setShowLanguage(true); },
      iconBg: "rgba(59,130,246,0.14)",
      iconColor: "text-blue-400",
      badge: currentLang.label,
    },
    {
      icon: "HelpCircle" as const,
      label: "Помощь",
      sub: "Поддержка и FAQ",
      action: () => { onSettingsScreen("help"); onMenuToggle(false); },
      iconBg: "rgba(255,255,255,0.07)",
      iconColor: "text-white/50",
      badge: undefined,
    },
  ];

  return (
    <>
      {showLegal && (
        <ProfileLegalSheet
          legalTab={legalTab}
          onTabChange={setLegalTab}
          onClose={() => setShowLegal(false)}
        />
      )}

      {showTheme && appTheme && onAppThemeChange && (
        <ProfileThemeSheet
          appTheme={appTheme}
          onSelect={onAppThemeChange}
          appIcon={appIcon}
          iconNative={iconNative}
          onSelectIcon={setAppIcon}
          onClose={() => setShowTheme(false)}
        />
      )}

      {showLanguage && (
        <ProfileLanguageSheet onClose={() => setShowLanguage(false)} />
      )}

      {showSubscription && (
        <ProfileSubscriptionSheet
          currentUser={currentUser}
          onClose={() => setShowSubscription(false)}
          onUpgrade={() => { setShowSubscription(false); onMenuToggle(false); onPremium?.(); }}
        />
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col page-push-in"
          style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)" }}>

          {/* Шапка — назад + аватар + имя */}
          <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}>
            <button onClick={() => onMenuToggle(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Icon name="ChevronLeft" size={20} className="text-white/80" />
            </button>
            <img
              src={currentUser.photo_url || DEFAULT_AVATAR}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid rgba(255,45,120,0.4)" }}
            />
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{currentUser.name || "Профиль"}</p>
              <p className="text-white/35 text-xs truncate">@{currentUser.username || currentUser.email?.split("@")[0] || "user"}</p>
            </div>
          </div>

          {/* Пункты меню — равномерно на всю высоту */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 flex flex-col justify-evenly gap-0.5"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}>
            {menuItems.map((item) => (
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

            {/* Выйти */}
            <button onClick={() => { onLogout(); onMenuToggle(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] mt-1"
              style={{ background: "transparent", borderTop: "1px solid rgba(255,255,255,0.06)", borderRadius: 0, paddingTop: "14px" }}
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
    </>
  );
}