import Icon from "@/components/ui/icon";

export function DailyMatchBanner({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="mx-3 mt-2 mb-1 rounded-2xl overflow-hidden flex items-center gap-3 px-3.5 py-2.5 active:scale-[0.98] transition-all flex-shrink-0"
      style={{
        background: "linear-gradient(135deg,#FF2D78 0%,#C061FF 55%,#9B59B6 100%)",
        boxShadow: "0 4px 20px rgba(255,45,120,0.35)",
      }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.2)" }}>
        <Icon name="Sparkles" size={18} className="text-white" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-white font-black text-sm leading-tight">Знакомство дня</p>
        <p className="text-white/80 text-[11px] leading-tight">ИИ подобрал того, кто тебе подходит</p>
      </div>
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.22)" }}>
        <span className="text-white text-xs font-bold">Смотреть</span>
        <Icon name="ChevronRight" size={14} className="text-white" />
      </div>
    </button>
  );
}

export default DailyMatchBanner;
