import Icon from "@/components/ui/icon";
import { haptic } from "@/hooks/useNative";

interface Props {
  partnerName: string;
  partnerPhoto: string;
  subscribed: boolean;
  isBot?: boolean;
  onBack: () => void;
  onProfileClick: () => void;
  onSubscribeToggle: () => void;
  onVideoCall: () => void;
  onMenuOpen: () => void;
  onCompatibility?: () => void;
}

export function ChatHeader({
  partnerName,
  partnerPhoto,
  isBot = false,
  onBack,
  onProfileClick,
  onVideoCall,
  onMenuOpen,
  onCompatibility,
}: Props) {
  return (
    <div className="flex items-center gap-2 px-3 pb-3 relative z-10 flex-shrink-0"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Назад */}
      <button onClick={onBack}
        className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90"
        style={{ background: "rgba(255,255,255,0.07)" }}>
        <Icon name="ChevronLeft" size={22} className="text-white/80" />
      </button>

      {/* Аватар + имя */}
      {isBot ? (
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden"
              style={{ boxShadow: "0 0 0 2px rgba(255,45,120,0.4)" }}>
              <img src={partnerPhoto} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate flex items-center gap-1">
              {partnerName}
              <Icon name="BadgeCheck" size={15} style={{ color: "#38BDF8", flexShrink: 0 }} />
            </p>
            <p className="text-white/35 text-[11px] mt-0.5">Официальный бот</p>
          </div>
        </div>
      ) : (
        <button onClick={onProfileClick} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden"
              style={{ boxShadow: "0 0 0 2px rgba(255,45,120,0.4)" }}>
              <img src={partnerPhoto} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{partnerName}</p>
            <p className="text-white/35 text-[11px] mt-0.5">Нажми для профиля</p>
          </div>
        </button>
      )}

      {/* Кнопки действий */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isBot && onCompatibility && (
          <button onClick={onCompatibility}
            className="relative w-9 h-9 flex items-center justify-center rounded-full active:scale-90 text-base"
            style={{ background: "rgba(255,45,120,0.18)", border: "1px solid rgba(255,45,120,0.4)" }}
            title="Испытание совместимости">
            {/* Пульсирующее кольцо */}
            <span className="absolute inset-0 rounded-full"
              style={{ animation: "compat-ping 2s ease-in-out infinite", background: "rgba(255,45,120,0.3)" }} />
            <span className="absolute inset-0 rounded-full"
              style={{ animation: "compat-ping 2s ease-in-out 0.6s infinite", background: "rgba(255,45,120,0.2)" }} />
            {/* Иконка с покачиванием */}
            <span style={{ display: "inline-block", animation: "compat-wiggle 2.5s ease-in-out infinite" }}>
              💘
            </span>
            <style>{`
              @keyframes compat-ping {
                0% { transform: scale(1); opacity: 0.6; }
                70% { transform: scale(1.7); opacity: 0; }
                100% { transform: scale(1.7); opacity: 0; }
              }
              @keyframes compat-wiggle {
                0%,100% { transform: rotate(0deg) scale(1); }
                15% { transform: rotate(-15deg) scale(1.15); }
                30% { transform: rotate(12deg) scale(1.1); }
                45% { transform: rotate(-8deg) scale(1.05); }
                60% { transform: rotate(5deg) scale(1); }
              }
            `}</style>
          </button>
        )}
        {!isBot && <button onClick={() => { haptic("medium"); onVideoCall(); }}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Video" size={17} className="text-white/60" />
        </button>}
        {!isBot && <button onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="MoreVertical" size={17} className="text-white/60" />
        </button>}
      </div>
    </div>
  );
}

export default ChatHeader;