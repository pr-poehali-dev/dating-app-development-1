import Icon from "@/components/ui/icon";
import { haptic } from "@/hooks/useNative";

type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live" | "verify" | "admin_verify";

export function BottomNav({ active, onChange, unreadMessages = 0, likesCount = 0, profilePhoto }: { active: Screen; onChange: (s: Screen) => void; unreadMessages?: number; likesCount?: number; profilePhoto?: string }) {
  const items: { screen: Screen; icon: string; label: string; badge?: number }[] = [
    { screen: "discover", icon: "House",              label: "Главная" },
    { screen: "photos",   icon: "Compass",            label: "Поиск" },
    { screen: "live",     icon: "Flame",               label: "Live" },
    { screen: "matches",  icon: "MessageCircleHeart",  label: "Чаты", badge: unreadMessages > 0 ? unreadMessages : undefined },
    { screen: "likes",    icon: "Heart",               label: "Лайки", badge: likesCount > 0 ? likesCount : undefined },
    { screen: "profile",  icon: "CircleUserRound",     label: "Профиль" },
  ];

  const activeIdx = Math.max(0, items.findIndex(i => i.screen === active));
  const activeIsLive = items[activeIdx]?.screen === "live";

  const handleChange = (s: Screen) => {
    if (s !== active) haptic("selection");
    onChange(s);
  };

  return (
    <>
      <style>{`
        @keyframes navPing {
          0%   { transform: scale(1); opacity: 0.9; }
          75%  { transform: scale(2.1); opacity: 0; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes navIconIn {
          0%   { transform: scale(0.6) rotate(-8deg); opacity: 0.4; }
          60%  { transform: scale(1.15) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .nav-icon-active { animation: navIconIn 0.32s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>
      <div className="relative z-10 px-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}>
        <div
          className="relative flex items-center"
          style={{
            background: "rgba(16,10,24,0.94)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22,
            boxShadow: "0 8px 24px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)",
            padding: "5px",
          }}>

          {/* Скользящий индикатор-таблетка */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 5, bottom: 5,
              left: 5,
              width: `calc((100% - 10px) / 6)`,
              transform: `translateX(${activeIdx * 100}%)`,
              transition: "transform 0.38s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div
              className="w-full h-full"
              style={{
                borderRadius: 16,
                background: activeIsLive
                  ? "linear-gradient(135deg,#FF6B35,#FFC24C)"
                  : "linear-gradient(135deg,#FF2D78,#B84FE0)",
                boxShadow: activeIsLive
                  ? "0 4px 14px rgba(255,140,50,0.45)"
                  : "0 4px 14px rgba(255,45,120,0.4)",
              }}
            />
          </div>

          {items.map((item) => {
            const isActive = active === item.screen;
            const isLive = item.screen === "live";

            return (
              <button
                key={item.screen}
                onClick={() => handleChange(item.screen)}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 transition-transform duration-150 active:scale-90"
                style={{ zIndex: 1, minWidth: 0 }}
              >
                <div key={isActive ? "on" : "off"} className={isActive ? "nav-icon-active" : ""}>
                  {item.screen === "profile" && profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Профиль"
                      style={{
                        width: 21,
                        height: 21,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: isActive
                          ? "2px solid #fff"
                          : "2px solid rgba(255,255,255,0.35)",
                        opacity: isActive ? 1 : 0.85,
                        transition: "border-color 0.2s, opacity 0.2s",
                      }}
                    />
                  ) : (
                    <Icon
                      name={item.icon as "House"|"Compass"|"Flame"|"MessageCircleHeart"|"Heart"|"CircleUserRound"}
                      size={19}
                      strokeWidth={isActive ? 2.3 : 1.7}
                      style={{
                        color: isActive
                          ? "#fff"
                          : isLive
                          ? "rgba(255,140,50,0.6)"
                          : "rgba(255,255,255,0.4)",
                        transition: "color 0.2s",
                      }}
                    />
                  )}
                </div>

                {/* Бейдж */}
                {item.badge && (
                  <div
                    className="absolute top-0.5 min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center text-[8px] text-white font-black"
                    style={{
                      left: "calc(50% + 7px)",
                      background: "linear-gradient(135deg, #FF2D78, #9B59B6)",
                      boxShadow: "0 2px 6px rgba(255,45,120,0.7)",
                      border: "1.5px solid rgba(16,10,24,0.94)",
                    }}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </div>
                )}

                {/* Пульс Live */}
                {isLive && !isActive && (
                  <span className="absolute top-1 rounded-full" style={{ left: "calc(50% + 8px)", width: 6, height: 6, background: "#FF8C32" }}>
                    <span className="absolute inset-0 rounded-full" style={{ background: "#FF8C32", animation: "navPing 1.8s ease-out infinite" }} />
                  </span>
                )}

                {/* Лейбл */}
                <span
                  className="text-[8.5px] leading-none tracking-wide"
                  style={{
                    color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.32)",
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