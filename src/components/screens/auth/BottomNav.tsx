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
    <>
      <style>{`
        @keyframes navPing {
          0%   { transform: scale(1); opacity: 1; }
          75%  { transform: scale(2); opacity: 0; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes navGlow {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
      `}</style>
      <div
        className="relative z-10 px-4 pt-1.5"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)",
          background: "rgba(18,12,28,0.97)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}>
        <div className="flex items-center justify-around -mt-1">
          {items.map((item) => {
            const isActive = active === item.screen;
            const isLive = item.screen === "live";

            return (
              <button
                key={item.screen}
                onClick={() => onChange(item.screen)}
                className="relative flex flex-col items-center gap-2 py-1.5 px-4 rounded-2xl transition-all duration-200 active:scale-90"
              >
                {/* Активный фон-пятно */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: isLive
                        ? "radial-gradient(ellipse at center, rgba(255,107,53,0.18) 0%, transparent 70%)"
                        : "radial-gradient(ellipse at center, rgba(255,45,120,0.2) 0%, transparent 70%)",
                    }}
                  />
                )}

                {/* Иконка */}
                <div className="relative">
                  <div
                    style={{
                      filter: isActive
                        ? isLive
                          ? "drop-shadow(0 0 8px rgba(255,107,53,0.8))"
                          : "drop-shadow(0 0 8px rgba(255,45,120,0.8))"
                        : "none",
                      transition: "filter 0.2s",
                    }}
                  >
                    <Icon
                      name={item.icon as "Sparkles"|"Compass"|"Flame"|"MessageCircle"|"CircleUser"}
                      size={21}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      style={{
                        color: isActive
                          ? isLive ? "#FF6B35" : "#FF2D78"
                          : isLive
                          ? "rgba(255,107,53,0.7)"
                          : "rgba(255,255,255,0.35)",
                        transition: "color 0.2s",
                      }}
                    />
                  </div>

                  {/* Бейдж */}
                  {item.badge && (
                    <div
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] text-white font-black"
                      style={{
                        background: "linear-gradient(135deg, #FF2D78, #9B59B6)",
                        boxShadow: "0 2px 8px rgba(255,45,120,0.7)",
                      }}
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </div>
                  )}

                  {/* Пульс Live */}
                  {isLive && !isActive && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                      style={{ background: "#FF6B35" }}
                    >
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "#FF6B35",
                          animation: "navPing 1.8s ease-out infinite",
                        }}
                      />
                    </span>
                  )}
                </div>

                {/* Лейбл */}
                <span
                  className="text-[10px] leading-none font-medium tracking-wide"
                  style={{
                    color: isActive
                      ? isLive ? "#FF6B35" : "#FF2D78"
                      : "rgba(255,255,255,0.3)",
                    fontWeight: isActive ? 700 : 500,
                    transition: "color 0.2s",
                  }}
                >
                  {item.label}
                </span>

                {/* Точка-индикатор под активным */}
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: isLive
                      ? "linear-gradient(135deg,#FF6B35,#FFD700)"
                      : "linear-gradient(135deg,#FF2D78,#9B59B6)",
                    boxShadow: isActive
                      ? isLive
                        ? "0 0 8px rgba(255,107,53,0.9)"
                        : "0 0 8px rgba(255,45,120,0.9)"
                      : "none",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "scale(1)" : "scale(0)",
                    transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                    marginTop: -2,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}