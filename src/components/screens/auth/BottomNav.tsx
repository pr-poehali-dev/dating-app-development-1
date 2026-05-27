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
    <div className="relative z-10"
      style={{
        background: "rgba(14,9,24,0.98)",
        backdropFilter: "blur(28px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
      }}>
      <div className="flex items-center justify-around px-3 pt-2 pb-safe pb-3">
        {items.map((item) => {
          const isActive = active === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => onChange(item.screen)}
              className="relative flex flex-col items-center gap-1 transition-all duration-200 active:scale-90"
              style={{ minWidth: 52, paddingBottom: 2 }}>

              {/* Иконка с подсветкой */}
              <div className="relative flex items-center justify-center w-11 h-9 rounded-2xl transition-all duration-200"
                style={isActive
                  ? { background: "linear-gradient(135deg, rgba(255,45,120,0.22), rgba(155,89,182,0.18))" }
                  : {}}>
                <Icon
                  name={item.icon as "Home"|"Search"|"Radio"|"MessageCircle"|"User"}
                  size={21}
                  strokeWidth={isActive ? 2.4 : 1.7}
                  style={{ color: isActive ? "#FF2D78" : "rgba(255,255,255,0.4)" }}
                />
                {item.badge && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                    style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                    {item.badge}
                  </div>
                )}
              </div>

              {/* Лейбл */}
              <span className="text-[10px] font-semibold leading-none transition-all duration-200"
                style={{ color: isActive ? "#FF2D78" : "rgba(255,255,255,0.32)" }}>
                {item.label}
              </span>

            </button>
          );
        })}
      </div>
    </div>
  );
}