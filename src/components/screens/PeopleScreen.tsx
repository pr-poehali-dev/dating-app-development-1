import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, notificationsApi, type Profile, type DiscoverParams } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { PeopleFilterSheet } from "@/components/screens/people/PeopleFilterSheet";
import { PeopleAdvancedFilter } from "@/components/screens/people/PeopleAdvancedFilter";
import { PeopleExploreWorld } from "@/components/screens/people/PeopleExploreWorld";
import { PeopleTravelMode } from "@/components/screens/people/PeopleTravelMode";
import { PeopleViewersSheet } from "@/components/screens/people/PeopleViewersSheet";
import { PeopleGrid } from "@/components/screens/people/PeopleGrid";
import { useYookassa } from "@/components/extensions/yookassa/useYookassa";
import { PAY_CREATE_URL } from "@/components/screens/ProfileGiftSheet";


export function PeopleScreen({ onOpenChat, onGoToChats, onPremium, isPremium }: {
  onOpenChat?: (matchId: number) => void;
  onGoToChats?: () => void;
  onPremium?: () => void;
  isPremium?: boolean;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DiscoverParams>({});
  const [activeTab, setActiveTab] = useState<"all" | "online" | "new">("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewersCount, setViewersCount] = useState(0);
  const [showBoosts, setShowBoosts] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showTravel, setShowTravel] = useState(false);
  const [advancedAgeMin, setAdvancedAgeMin] = useState(18);
  const [advancedAgeMax, setAdvancedAgeMax] = useState(60);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const { pay: payBoost, loading: boostPaying } = useYookassa(PAY_CREATE_URL);

  const handleBuyBoost = async (boostType: "promote" | "super", amount: number, description: string) => {
    const token = localStorage.getItem("spark_token") || "";
    await payBoost({
      amount,
      description,
      returnUrl: window.location.origin + "/?payment=success",
      metadata: { kind: "boost", boost_type: boostType, sender_token: token },
    });
  };
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((params: DiscoverParams, q?: string) => {
    setLoading(true);
    profilesApi.getDiscover({ ...params, ...(q !== undefined ? { search: q } : {}) })
      .then((d) => setProfiles(d.profiles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load({}); }, [load]);

  useEffect(() => {
    notificationsApi.list()
      .then(d => setViewersCount(d.notifications.filter(n => n.type === "view").length))
      .catch(() => {});
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(filters, val), 400);
  };

  const handleApplyFilters = (p: DiscoverParams) => {
    setFilters(p);
    setShowFilters(false);
    load(p, search);
  };

  const handleTabChange = (tab: "all" | "online" | "new") => {
    setActiveTab(tab);
    const p: DiscoverParams = { ...filters };
    if (tab === "online") p.online_only = true;
    else delete p.online_only;
    load(p, search);
  };

  const filterCount = [
    filters.looking_for && filters.looking_for !== "all",
    filters.age_min && filters.age_min > 18,
    filters.age_max && filters.age_max < 80,
    filters.city,
    filters.online_only,
  ].filter(Boolean).length;

  const tabs = [
    { id: "all" as const, label: "Все" },
    { id: "online" as const, label: "Онлайн" },
    { id: "new" as const, label: "Новые" },
  ];

  return (
    <>
      {selected && (
        <DiscoverProfileModal
          profile={selected}
          profiles={profiles}
          profileIndex={selectedIdx}
          onClose={() => setSelected(null)}
          onLike={(p) => setLikedIds((prev) => new Set([...prev, p.id]))}
          onOpenChat={(matchId) => { setSelected(null); onOpenChat?.(matchId); }}
          onGoToChats={() => { setSelected(null); onGoToChats?.(); }}
        />
      )}
      {showFilters && (
        <PeopleFilterSheet
          filters={filters}
          onApply={handleApplyFilters}
          onClose={() => setShowFilters(false)}
          onAdvancedFilter={() => setShowAdvancedFilter(true)}
          onExploreWorld={() => setShowExplore(true)}
          onTravelMode={() => setShowTravel(true)}
          isPremium={isPremium}
          onPremium={onPremium}
        />
      )}
      {showAdvancedFilter && (
        <PeopleAdvancedFilter
          ageMin={advancedAgeMin}
          ageMax={advancedAgeMax}
          verifiedOnly={verifiedOnly}
          onClose={() => setShowAdvancedFilter(false)}
          onApply={(mn, mx, v) => {
            setAdvancedAgeMin(mn); setAdvancedAgeMax(mx); setVerifiedOnly(v);
            setShowAdvancedFilter(false);
            const p: DiscoverParams = { ...filters, age_min: mn, age_max: mx };
            if (v) p.verified_only = true as never;
            setFilters(p); load(p, search);
          }}
        />
      )}
      {showExplore && (
        <PeopleExploreWorld
          onClose={() => setShowExplore(false)}
          onSelectCity={(city) => {
            setShowExplore(false);
            if (city === "__nearby__" || city === "__random__") return;
            const p: DiscoverParams = { ...filters, city };
            setFilters(p); load(p, search);
          }}
        />
      )}
      {showTravel && (
        <PeopleTravelMode
          onClose={() => setShowTravel(false)}
          onApply={(city) => {
            setShowTravel(false);
            const p: DiscoverParams = { ...filters, city };
            setFilters(p); load(p, search);
          }}
        />
      )}
      {showViewers && (
        <PeopleViewersSheet
          isPremium={isPremium}
          onClose={() => setShowViewers(false)}
          onPremium={onPremium}
        />
      )}

      {showBoosts && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowBoosts(false)}>
          <div className="w-full max-w-sm rounded-t-3xl flex flex-col pb-8"
            style={{ background: "var(--spark-dark2,#1a1030)" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  <Icon name="Zap" size={16} className="text-white" />
                </div>
                <p className="text-white font-bold text-base">Купить бусты профиля</p>
              </div>
              <button onClick={() => setShowBoosts(false)} className="text-white/40 hover:text-white/70">
                <Icon name="X" size={20} />
              </button>
            </div>

            <style>{`
              @keyframes gradientSpin {
                0%   { background-position: 0% 50%; }
                25%  { background-position: 100% 0%; }
                50%  { background-position: 100% 100%; }
                75%  { background-position: 0% 100%; }
                100% { background-position: 0% 50%; }
              }
              .boost-card-1 {
                background: linear-gradient(135deg, #FF2D78, #FF6B35, #9B59B6, #3B82F6, #FF2D78);
                background-size: 300% 300%;
                animation: gradientSpin 4s ease infinite;
                border: none !important;
              }
              .boost-card-2 {
                background: linear-gradient(135deg, #9B59B6, #FF2D78, #FFD700, #FF6B35, #9B59B6);
                background-size: 300% 300%;
                animation: gradientSpin 4s ease infinite reverse;
                border: none !important;
              }
              .boost-inner {
                background: rgba(10,5,20,0.72);
                backdrop-filter: blur(12px);
                border-radius: 14px;
              }
              .boost-icon-1 {
                background: linear-gradient(135deg, #FF2D78, #FF6B35, #9B59B6);
                background-size: 200% 200%;
                animation: gradientSpin 3s ease infinite;
              }
              .boost-icon-2 {
                background: linear-gradient(135deg, #9B59B6, #FFD700, #FF2D78);
                background-size: 200% 200%;
                animation: gradientSpin 3s ease infinite reverse;
              }
            `}</style>
            <div className="px-4 pt-4 flex flex-col gap-3">
              {/* Boost 1 */}
              <button
                disabled={boostPaying}
                onClick={() => handleBuyBoost("promote", 350, "Продвижение профиля в сетку")}
                className="w-full rounded-2xl p-[2px] text-left transition-all active:scale-[0.98] disabled:opacity-60 boost-card-1">
                <div className="boost-inner w-full p-4 flex items-center gap-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 boost-icon-1">
                    {boostPaying ? <Icon name="Loader2" size={22} className="text-white animate-spin" /> : <Icon name="Rocket" size={22} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">Продвинуть профиль</p>
                    <p className="text-white/45 text-xs mt-0.5">Продвинуть в ближайшую сетку</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-base" style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>350 ₽</p>
                  </div>
                </div>
              </button>

              {/* Boost 2 */}
              <button
                disabled={boostPaying}
                onClick={() => handleBuyBoost("super", 550, "Супер подъём профиля")}
                className="w-full rounded-2xl p-[2px] text-left transition-all active:scale-[0.98] disabled:opacity-60 boost-card-2">
                <div className="boost-inner w-full p-4 flex items-center gap-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 boost-icon-2">
                    {boostPaying ? <Icon name="Loader2" size={22} className="text-white animate-spin" /> : <Icon name="Star" size={22} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">Супер подъём</p>
                    <p className="text-white/45 text-xs mt-0.5">Выбери людей, которые тебе нравятся</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-base" style={{ background: "linear-gradient(90deg,#9B59B6,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>550 ₽</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0 screen-header"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Заголовок + кнопки */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-2xl leading-tight">Поиск</h2>
              <p className="text-white/35 text-xs mt-0.5">Найди своего человека</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Просмотры */}
              <button onClick={() => setShowViewers(true)}
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
              <button onClick={() => setShowBoosts(true)}
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
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="@username или #хэштег..."
                className="w-full text-white placeholder-white/30 rounded-2xl pl-9 pr-9 py-3 text-sm outline-none border transition-colors font-golos"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", lineHeight: 1.2 }}
              />
              {search && (
                <button onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <Icon name="X" size={11} className="text-white/70" />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(true)}
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
            {tabs.map((t) => (
              <button key={t.id} onClick={() => handleTabChange(t.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all active:scale-95"
                style={activeTab === t.id
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white", boxShadow: "0 2px 10px rgba(255,45,120,0.3)" }
                  : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {t.id === "online" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block flex-shrink-0"
                    style={activeTab === t.id ? {} : { boxShadow: "0 0 4px #4ADE80" }} />
                )}
                {t.label}
              </button>
            ))}
          </div>


        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          <PeopleGrid
            profiles={profiles}
            loading={loading}
            search={search}
            filterCount={filterCount}
            isPremium={isPremium}
            likedIds={likedIds}
            onSelect={(p, idx) => { setSelected(p); setSelectedIdx(idx); }}
            onPremium={onPremium}
            onReset={() => { setSearch(""); setFilters({}); load({}); }}
          />
        </div>
      </div>
    </>
  );
}