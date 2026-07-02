import Icon from "@/components/ui/icon";

interface Props {
  search: string;
  activeTab: "all" | "online" | "new";
  filterCount: number;
  viewersCount: number;
  onSearchChange: (val: string) => void;
  onTabChange: (tab: "all" | "online" | "new") => void;
  onOpenFilters: () => void;
  onOpenViewers: () => void;
  onOpenBoosts: () => void;
}

const TABS = [
  { id: "all"    as const, label: "Все" },
  { id: "online" as const, label: "Онлайн" },
  { id: "new"    as const, label: "Новые" },
];

export function PeopleHeader({
  search, activeTab, filterCount, viewersCount,
  onSearchChange, onTabChange, onOpenFilters, onOpenViewers, onOpenBoosts,
}: Props) {
  return (
    <div className="px-4 pb-3 flex-shrink-0 screen-header"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Заголовок + кнопки */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white font-bold text-2xl leading-tight">Поиск</h2>
          <p className="text-white/35 text-xs mt-0.5">Найди своего человека</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Просмотры */}
          <button onClick={onOpenViewers}
            className="relative w-9 h-9 flex items-center justify-center rounded-2xl transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="Eye" size={18} className="text-white/70" />
            {viewersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] text-white font-black px-1"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 1px 6px rgba(255,45,120,0.6)" }}>
                {viewersCount > 9 ? "9+" : viewersCount}
              </span>
            )}
          </button>
          {/* Буст */}
          <button onClick={onOpenBoosts}
            className="relative w-9 h-9 flex items-center justify-center rounded-2xl transition-all active:scale-90"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }}>
            <Icon name="Zap" size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Строка поиска + фильтры */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="@username или #хэштег..."
            className="w-full text-white placeholder-white/30 rounded-2xl pl-9 pr-9 py-3 text-sm outline-none border transition-colors font-golos"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", lineHeight: 1.2 }}
          />
          {search && (
            <button onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <Icon name="X" size={11} className="text-white/70" />
            </button>
          )}
        </div>
        <button onClick={onOpenFilters}
          className="relative w-11 h-11 flex items-center justify-center rounded-2xl flex-shrink-0 transition-all active:scale-90"
          style={filterCount > 0
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }
            : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="SlidersHorizontal" size={17} className={filterCount > 0 ? "text-white" : "text-white/70"} />
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-black"
              style={{ background: "#FF2D78", border: "1.5px solid #0f0a1a" }}>
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Табы */}
      <div className="flex gap-2 mt-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all active:scale-95 ${activeTab === t.id ? "text-white" : "text-white/45"}`}
            style={activeTab === t.id
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.3)" }
              : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {t.id === "online" && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block flex-shrink-0"
                style={activeTab === t.id ? {} : { boxShadow: "0 0 4px #4ADE80" }} />
            )}
            {t.id === "new" && (
              <span className="text-[10px] leading-none">✨</span>
            )}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PeopleHeader;