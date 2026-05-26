import Icon from "@/components/ui/icon";

type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live" | "verify" | "admin_verify";

export function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const items: { screen: Screen; icon: string; label: string; badge?: number }[] = [
    { screen: "discover",  icon: "Home",          label: "Главная" },
    { screen: "photos",    icon: "Search",         label: "Поиск" },
    { screen: "live",      icon: "Radio",          label: "Live" },
    { screen: "matches",   icon: "MessageCircle",  label: "Чаты" },
    { screen: "profile",   icon: "User",           label: "Профиль" },
  ];

  return (
    <div className="flex items-center justify-around px-2 pt-2 pb-3 relative z-10"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(18,12,28,0.97)",
        backdropFilter: "blur(24px)",
      }}>
      {items.map((item) => {
        const isActive = active === item.screen;
        return (
          <button
            key={item.screen}
            onClick={() => onChange(item.screen)}
            className="nav-item relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 active:scale-90"
            style={{
              color: isActive ? "#FF2D78" : "rgba(255,255,255,0.38)",
              background: isActive ? "rgba(255,45,120,0.12)" : "transparent",
              minWidth: 56,
            }}>

            {/* Иконка */}
            <div className="relative">
              <Icon
                name={item.icon as "Home"|"Search"|"Radio"|"MessageCircle"|"User"}
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {item.badge && (
                <div className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                  {item.badge}
                </div>
              )}
            </div>

            {/* Лейбл */}
            <span className="text-[10px] font-semibold leading-none"
              style={{ color: isActive ? "#FF2D78" : "rgba(255,255,255,0.38)" }}>
              {item.label}
            </span>

            {/* Точка-индикатор активного таба */}
            {isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: "#FF2D78" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
