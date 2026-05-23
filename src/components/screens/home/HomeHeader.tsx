import Icon from "@/components/ui/icon";

interface Props {
  unreadCount: number;
  onCreateClick: () => void;
  onGiftsClick: () => void;
  onNotifsClick: () => void;
}

export function HomeHeader({ unreadCount, onCreateClick, onGiftsClick, onNotifsClick }: Props) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
      <div className="flex items-center gap-2">
        <img src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/51fe4ec6-6465-42e1-b1ed-df2cd706037f.jpg"
          className="w-8 h-8 rounded-xl object-cover" />
        <h1 className="font-unbounded text-white text-xl font-black grad-text">LoveBloom</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onCreateClick}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
          <Icon name="Plus" size={20} className="text-white" />
        </button>
        <button onClick={onGiftsClick}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Gift" size={18} className="text-white/80" />
        </button>
        <button onClick={onNotifsClick}
          className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Bell" size={18} className="text-white/80" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default HomeHeader;
