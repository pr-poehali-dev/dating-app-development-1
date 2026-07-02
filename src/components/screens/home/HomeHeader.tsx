import Icon from "@/components/ui/icon";

interface Props {
  unreadCount: number;
  onCreateClick: () => void;
  onGiftsClick: () => void;
  onNotifsClick: () => void;
}

export function HomeHeader({ unreadCount, onCreateClick, onGiftsClick, onNotifsClick }: Props) {
  return (
    <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Лого */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <img
            src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/398ecae4-f58c-475c-8ab9-eeab1838b651.jpg"
            className="w-9 h-9 rounded-xl object-cover"
            style={{ boxShadow: "0 2px 12px rgba(255,45,120,0.4)" }}
          />
        </div>
        <div className="flex flex-col leading-none">
          <h1 className="font-unbounded text-white text-lg font-black" style={{
            background: "linear-gradient(90deg, #FF2D78, #C061FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            LoveBloom
          </h1>
          <span className="text-white/35 text-[10px] font-medium tracking-wide mt-0.5">Найди свою половинку</span>
        </div>
      </div>

      {/* Кнопки справа */}
      <div className="flex items-center gap-2">
        {/* Создать */}
        <button
          onClick={onCreateClick}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }}>
          <Icon name="Plus" size={19} className="text-white" />
        </button>

        {/* Подарки */}
        <button
          onClick={onGiftsClick}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Gift" size={18} className="text-pink-300" />
        </button>

        {/* Уведомления */}
        <button
          onClick={onNotifsClick}
          className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Bell" size={18} className="text-white/80" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px] font-black px-1"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 1px 6px rgba(255,45,120,0.6)" }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default HomeHeader;