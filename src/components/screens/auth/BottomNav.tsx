import Icon from "@/components/ui/icon";
import { haptic } from "@/hooks/useNative";

type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live" | "verify" | "admin_verify";

export function BottomNav({ active, onChange, unreadMessages = 0 }: { active: Screen; onChange: (s: Screen) => void; unreadMessages?: number }) {
  const items: { screen: Screen; icon: string; label: string; badge?: number }[] = [
    { screen: "discover", icon: "House",          label: "Главная" },
    { screen: "photos",   icon: "SearchCheck",    label: "Поиск" },
    { screen: "live",     icon: "Radio",          label: "Live" },
    { screen: "matches",  icon: "MessagesSquare",  label: "Чаты", badge: unreadMessages > 0 ? unreadMessages : undefined },
    { screen: "profile",  icon: "UserRound",       label: "Профиль" },
  ];

  const handleChange = (s: Screen) => {
    if (s !== active) haptic("selection");
    onChange(s);
  };

  return (
    <>
      <style>{`
        @keyframes navPing {
          0%   { transform: scale(1); opacity: 0.9; }
          75%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes navPop {
          0%   { transform: translateY(0) scale(1); }
          45%  { transform: translateY(-15px) scale(1.12); }
          70%  { transform: translateY(-11px) scale(0.97); }
          100% { transform: translateY(-13px) scale(1); }
        }
        .nav-btn-active .nav-bubble { animation: navPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>
      <div className="relative z-10 px-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 10px)" }}>
        <div
          className="relative flex items-end justify-around"
          style={{
            background: "rgba(16,10,24,0.94)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 28,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
            padding: "8px 4px 8px",
          }}>

          {items.map((item) => {
            const isActive = active === item.screen;
            const isLive = item.screen === "live";
            const grad = isLive ? "linear-gradient(135deg,#FF6B35,#FFC24C)" : "linear-gradient(135deg,#FF2D78,#B84FE0)";
            const glow = isLive ? "rgba(255,140,50,0.55)" : "rgba(255,45,120,0.5)";

            return (
              <button
                key={item.screen}
                onClick={() => handleChange(item.screen)}
                className={`relative flex flex-col items-center justify-end flex-1 transition-transform duration-150 active:scale-90 ${isActive ? "nav-btn-active" : ""}`}
                style={{ height: 52 }}
              >
                {/* Пузырь-иконка */}
                <div
                  className="nav-bubble relative flex items-center justify-center flex-shrink-0"
                  style={{
                    width: isActive ? 44 : 26,
                    height: isActive ? 44 : 26,
                    borderRadius: isActive ? 16 : 10,
                    background: isActive ? grad : "transparent",
                    boxShadow: isActive ? `0 6px 18px ${glow}` : "none",
                    transition: "width 0.28s cubic-bezier(0.34,1.56,0.64,1), height 0.28s cubic-bezier(0.34,1.56,0.64,1), border-radius 0.28s ease, background 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  <Icon
                    name={item.icon as "House"|"SearchCheck"|"Radio"|"MessagesSquare"|"UserRound"}
                    size={isActive ? 21 : 19}
                    strokeWidth={isActive ? 2.3 : 1.8}
                    style={{
                      color: isActive
                        ? "#fff"
                        : isLive
                        ? "rgba(255,140,50,0.6)"
                        : "rgba(255,255,255,0.38)",
                      transition: "color 0.2s",
                    }}
                  />

                  {/* Бейдж */}
                  {item.badge && (
                    <div
                      className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] text-white font-black"
                      style={{
                        background: "linear-gradient(135deg, #FF2D78, #9B59B6)",
                        boxShadow: "0 2px 8px rgba(255,45,120,0.7)",
                        border: "1.5px solid rgba(16,10,24,0.94)",
                      }}
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </div>
                  )}

                  {/* Пульс Live */}
                  {isLive && !isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "#FF8C32" }}>
                      <span className="absolute inset-0 rounded-full" style={{ background: "#FF8C32", animation: "navPing 1.8s ease-out infinite" }} />
                    </span>
                  )}
                </div>

                {/* Лейбл */}
                <span
                  className="text-[9.5px] leading-none tracking-wide mt-1.5"
                  style={{
                    color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)",
                    fontWeight: isActive ? 700 : 500,
                    transform: isActive ? "translateY(-13px)" : "none",
                    transition: "color 0.2s, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
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