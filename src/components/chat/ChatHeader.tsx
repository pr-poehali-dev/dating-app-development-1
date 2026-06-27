import Icon from "@/components/ui/icon";

interface Props {
  partnerName: string;
  partnerPhoto: string;
  subscribed: boolean;
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
  subscribed,
  onBack,
  onProfileClick,
  onSubscribeToggle,
  onVideoCall,
  onMenuOpen,
  onCompatibility,
}: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-3 relative z-10 flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Назад */}
      <button onClick={onBack}
        className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90"
        style={{ background: "rgba(255,255,255,0.07)" }}>
        <Icon name="ChevronLeft" size={22} className="text-white/80" />
      </button>

      {/* Аватар + имя */}
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

      {/* Кнопки действий */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={onSubscribeToggle}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: subscribed ? "rgba(255,200,0,0.15)" : "rgba(255,255,255,0.07)", border: subscribed ? "1px solid rgba(255,200,0,0.3)" : "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Star" size={17} className={subscribed ? "text-yellow-400" : "text-white/50"} />
        </button>
        {onCompatibility && (
          <button onClick={onCompatibility}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 text-base"
            style={{ background: "rgba(255,45,120,0.12)", border: "1px solid rgba(255,45,120,0.25)" }}
            title="Испытание совместимости">
            💘
          </button>
        )}
        <button onClick={onVideoCall}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Video" size={17} className="text-white/60" />
        </button>
        <button onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="MoreVertical" size={17} className="text-white/60" />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;