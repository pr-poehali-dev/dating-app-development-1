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
}: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 relative z-10"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
        <Icon name="ChevronLeft" size={24} />
      </button>
      <button onClick={onProfileClick} className="flex items-center gap-3 flex-1 text-left">
        <img src={partnerPhoto} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="text-white font-semibold text-sm">{partnerName}</p>
          <p className="text-white/40 text-xs">Нажми для просмотра профиля</p>
        </div>
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={onSubscribeToggle}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: subscribed ? "rgba(255,200,0,0.15)" : "rgba(255,255,255,0.06)" }}
          title="Подписаться на обновления">
          <Icon name="Star" size={18} className={subscribed ? "text-yellow-400" : "text-white/50"} />
        </button>
        <button
          onClick={onVideoCall}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.06)" }}
          title="Видеозвонок">
          <Icon name="Video" size={18} className="text-white/50" />
        </button>
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.06)" }}
          title="Ещё">
          <Icon name="MoreVertical" size={18} className="text-white/50" />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
