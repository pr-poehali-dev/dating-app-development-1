import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live" | "verify" | "admin_verify";

export function DesktopSidebar({ active, onChange, unreadMessages = 0, currentUser, onLogout }: {
  active: Screen;
  onChange: (s: Screen) => void;
  unreadMessages?: number;
  currentUser: User;
  onLogout?: () => void;
}) {
  const items: { screen: Screen; icon: string; label: string; badge?: number }[] = [
    { screen: "discover", icon: "House",              label: "Главная" },
    { screen: "photos",   icon: "Compass",            label: "Поиск" },
    { screen: "live",     icon: "Flame",               label: "Live" },
    { screen: "matches",  icon: "MessageCircleHeart",  label: "Чаты", badge: unreadMessages > 0 ? unreadMessages : undefined },
    { screen: "likes",    icon: "Heart",               label: "Лайки" },
    { screen: "profile",  icon: "CircleUserRound",     label: "Профиль" },
  ];

  return (
    <div className="flex flex-col h-full flex-shrink-0"
      style={{
        width: 260,
        background: "rgba(16,10,24,0.7)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}>

      {/* Лого */}
      <div className="flex items-center gap-3 px-6 py-6">
        <img
          src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png"
          className="w-10 h-10 rounded-xl object-cover"
          style={{ boxShadow: "0 2px 12px rgba(255,45,120,0.4)" }}
        />
        <h1 className="font-unbounded text-xl font-black grad-text">Полутон</h1>
      </div>

      {/* Пункты меню */}
      <div className="flex flex-col gap-1 px-3 flex-1">
        {items.map((item) => {
          const isActive = active === item.screen;
          const isLive = item.screen === "live";
          return (
            <button
              key={item.screen}
              onClick={() => onChange(item.screen)}
              className="relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all"
              style={{
                background: isActive
                  ? (isLive ? "linear-gradient(135deg,#FF6B35,#FFC24C)" : "linear-gradient(135deg,#FF2D78,#B84FE0)")
                  : "transparent",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon
                name={item.icon as "House" | "Compass" | "Flame" | "MessageCircleHeart" | "Heart" | "CircleUserRound"}
                size={21}
                strokeWidth={isActive ? 2.3 : 1.8}
                style={{ color: isActive ? "#fff" : isLive ? "rgba(255,140,50,0.7)" : "rgba(255,255,255,0.5)" }}
              />
              <span className="text-sm font-semibold" style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}>
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] text-white font-black"
                  style={{ background: isActive ? "rgba(255,255,255,0.25)" : "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Профиль внизу */}
      <div className="px-3 pb-4">
        <button
          onClick={() => onChange("profile")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
        >
          {currentUser.photo_url ? (
            <img src={currentUser.photo_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid rgba(255,45,120,0.4)" }} />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.4), rgba(155,89,182,0.4))" }}>
              <Icon name="User" size={16} className="text-white/70" />
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white text-sm font-bold truncate">{currentUser.name || "Профиль"}</p>
            <p className="text-white/35 text-[11px] truncate">Открыть профиль</p>
          </div>
          {onLogout && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onLogout(); }}
              className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 p-1"
            >
              <Icon name="LogOut" size={16} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
