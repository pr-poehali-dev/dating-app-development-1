import Icon from "@/components/ui/icon";

type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live" | "verify" | "admin_verify";

export function BottomNav({ active, onChange, unreadMessages = 0 }: { active: Screen; onChange: (s: Screen) => void; unreadMessages?: number }) {
  const items: { screen: Screen; icon: string; label: string; badge?: number }[] = [
    { screen: "discover", icon: "Sparkles",      label: "Главная" },
    { screen: "photos",   icon: "Compass",       label: "Поиск" },
    { screen: "live",     icon: "Flame",         label: "Live" },
    { screen: "matches",  icon: "MessageCircle", label: "Чаты", badge: unreadMessages > 0 ? unreadMessages : undefined },
    { screen: "profile",  icon: "CircleUser",    label: "Профиль" },
  ];

  return (
    <div className="relative z-10 px-3 pb-3 pt-2"
      style={{
        background: "rgba(12,7,22,0.96)",
        backdropFilter: "blur(32px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -12px 40px rgba(0,0,0,0.5)",
      }}>
      {/* Плавающая таблетка */}
      <div className="flex items-center justify-around rounded-2xl px-1 py-1"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
        {items.map((item) => {
          const isActive = active === item.screen;
          const isLive = item.screen === "live";
          return (
            <button
              key={item.screen}
              onClick={() => onChange(item.screen)}
              className="relative flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 active:scale-90"
              style={{
                minWidth: 52,
                background: isActive
                  ? "linear-gradient(135deg, rgba(255,45,120,0.25), rgba(155,89,182,0.2))"
                  : "transparent",
              }}>

              {/* Иконка */}
              <div className="relative">
                <Icon
                  name={item.icon as "Sparkles"|"Compass"|"Flame"|"MessageCircle"|"CircleUser"}
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  style={{
                    color: isActive
                      ? "#FF2D78"
                      : isLive
                      ? "rgba(255,120,50,0.55)"
                      : "rgba(255,255,255,0.38)",
                    filter: isActive ? "drop-shadow(0 0 6px rgba(255,45,120,0.6))" : "none",
                  }}
                />
                {item.badge && (
                  <div className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] text-white font-black"
                    style={{
                      background: "linear-gradient(135deg, #FF2D78, #9B59B6)",
                      boxShadow: "0 2px 8px rgba(255,45,120,0.6)",
                    }}>
                    {item.badge > 9 ? "9+" : item.badge}
                  </div>
                )}
                {/* Пульс для Live */}
                {isLive && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                    style={{ background: "#FF6B35", boxShadow: "0 0 0 0 rgba(255,107,53,0.6)", animation: "ping 1.5s infinite" }} />
                )}
              </div>

              {/* Лейбл */}
              <span className="text-[10px] font-semibold leading-none"
                style={{
                  color: isActive
                    ? "#FF2D78"
                    : isLive
                    ? "rgba(255,120,50,0.55)"
                    : "rgba(255,255,255,0.3)",
                }}>
                {item.label}
              </span>

            </button>
          );
        })}
      </div>
    </div>
  );
}
