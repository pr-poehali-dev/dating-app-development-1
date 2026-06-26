import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { ProfileLegalSheet } from "@/components/screens/profile/ProfileLegalSheet";

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help" | "security";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

export function ProfileTopBarMenu({
  menuOpen,
  onMenuToggle,
  onSettingsScreen,
  onLogout,
  onVerify,
  currentUser,
  isDark,
  onToggleTheme,
}: {
  menuOpen: boolean;
  onMenuToggle: (open: boolean) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  currentUser: User;
  isDark?: boolean;
  onToggleTheme?: () => void;
}) {
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy">("terms");

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
      icon: "HelpCircle" as const,
      label: "Помощь",
      sub: "Поддержка и FAQ",
      action: () => { onSettingsScreen("help"); onMenuToggle(false); },
      iconBg: "rgba(255,255,255,0.07)",
      iconColor: "text-white/50",
      badge: undefined,
    },
    {
      icon: "Scale" as const,
      label: "Правовые документы",
      sub: "Условия и конфиденциальность",
      action: () => { setShowLegal(true); onMenuToggle(false); },
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

      {menuOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => onMenuToggle(false)}>
        <div className="w-full flex flex-col overflow-y-auto"
          style={{
            background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
            maxHeight: "90dvh",
          }}
          onClick={e => e.stopPropagation()}>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Шапка — аватар + имя */}
          <div className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <img
              src={currentUser.photo_url || FALLBACK_PHOTO}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid rgba(255,45,120,0.4)" }}
            />
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{currentUser.name || "Профиль"}</p>
              <p className="text-white/35 text-xs truncate">@{currentUser.username || currentUser.email?.split("@")[0] || "user"}</p>
            </div>
          </div>

          {/* Пункты меню */}
          <div className="px-2 py-2 flex flex-col gap-0.5">
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
          </div>

          {/* Тема */}
          {onToggleTheme && (
            <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button disabled
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl mt-2 cursor-not-allowed opacity-50"
                style={{ background: "transparent" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isDark ? "rgba(251,191,36,0.12)" : "rgba(99,102,241,0.12)" }}>
                    <Icon name={isDark ? "Sun" : "Moon"} size={15} className={isDark ? "text-amber-400" : "text-indigo-400"} />
                  </div>
                  <div>
                    <p className="text-white/90 text-sm font-semibold leading-tight">{isDark ? "Светлая тема" : "Тёмная тема"}</p>
                    <p className="text-white/30 text-[11px] leading-tight mt-0.5">Заработает в следующем обновлении</p>
                  </div>
                </div>
                <div className="w-11 h-6 rounded-full relative flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                    style={{ left: "3px" }} />
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
        </div>
      )}
    </>
  );
}