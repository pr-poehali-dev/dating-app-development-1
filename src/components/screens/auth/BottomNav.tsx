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

  const activeIdx = Math.max(0, items.findIndex(i => i.screen === active));
  const activeIsLive = items[activeIdx]?.screen === "live";

  return (
    <>
      <style>{`
        @keyframes navPing {
          0%   { transform: scale(1); opacity: 1; }
          75%  { transform: scale(2); opacity: 0; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div className="relative z-10 px-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 10px)" }}>
        <div
          className="relative flex items-center"
          style={{
            background: "rgba(20,13,30,0.92)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 26,
            boxShadow: "0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
            padding: "6px 6px",
          }}>

          {/* Скользящая таблетка-индикатор под активным пунктом */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-2xl pointer-events-none"
            style={{
              left: `calc(${activeIdx} * (100% / 5) + 4px)`,
              width: `calc(100% / 5 - 8px)`,
              background: activeIsLive
                ? "linear-gradient(135deg, rgba(255,107,53,0.22), rgba(255,180,60,0.10))"
                : "linear-gradient(135deg, rgba(255,45,120,0.22), rgba(155,89,182,0.14))",
              border: activeIsLive
                ? "1px solid rgba(255,107,53,0.35)"
                : "1px solid rgba(255,45,120,0.32)",
              transition: "left 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />

          {items.map((item) => {
            const isActive = active === item.screen;
            const isLive = item.screen === "live";

            return (
              <button
                key={item.screen}
                onClick={() => onChange(item.screen)}
                className="relative flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-transform duration-200 active:scale-90"
              >
                {/* Иконка */}
                <div className="relative flex items-center justify-center"
                  style={{
                    width: 30, height: 30, borderRadius: 12,
                    background: isActive
                      ? isLive
                        ? "linear-gradient(135deg,#FF6B35,#FFB43C)"
                        : "linear-gradient(135deg,#FF2D78,#9B59B6)"
                      : "transparent",
                    boxShadow: isActive
                      ? isLive
                        ? "0 4px 14px rgba(255,107,53,0.45)"
                        : "0 4px 14px rgba(255,45,120,0.45)"
                      : "none",
                    transition: "background 0.25s ease, box-shadow 0.25s ease",
                  }}
                >
                  <Icon
                    name={item.icon as "Sparkles"|"Compass"|"Flame"|"MessageCircle"|"CircleUser"}
                    size={18}
                    strokeWidth={isActive ? 2.4 : 1.6}
                    style={{
                      color: isActive
                        ? "#fff"
                        : isLive
                        ? "rgba(255,107,53,0.65)"
                        : "rgba(255,255,255,0.4)",
                      transition: "color 0.2s",
                    }}
                  />

                  {/* Бейдж */}
                  {item.badge && (
                    <div
                      className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] text-white font-black"
                      style={{
                        background: "linear-gradient(135deg, #FF2D78, #9B59B6)",
                        boxShadow: "0 2px 8px rgba(255,45,120,0.7)",
                        border: "1.5px solid rgba(20,13,30,0.92)",
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
                  className="text-[10px] leading-none tracking-wide"
                  style={{
                    color: isActive
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.32)",
                    fontWeight: isActive ? 700 : 500,
                    transition: "color 0.2s",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}