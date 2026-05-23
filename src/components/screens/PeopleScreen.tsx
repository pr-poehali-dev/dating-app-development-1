import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, notificationsApi, type Profile, type DiscoverParams } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { PeopleFilterSheet } from "@/components/screens/people/PeopleFilterSheet";
import { PeopleViewersSheet } from "@/components/screens/people/PeopleViewersSheet";
import { PeopleGrid } from "@/components/screens/people/PeopleGrid";

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
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
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
        />
      )}
      {showViewers && (
        <PeopleViewersSheet
          isPremium={isPremium}
          onClose={() => setShowViewers(false)}
          onPremium={onPremium}
        />
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={(e) => handleSearch(e.target.value)}
                placeholder="Имя, @username или город..."
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
              {search && (
                <button onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(true)}
              className="relative glass-card px-3 py-2 flex items-center gap-1.5 text-white/70 text-sm flex-shrink-0">
              <Icon name="SlidersHorizontal" size={15} />
              {filterCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  {filterCount}
                </div>
              )}
            </button>
            <button onClick={() => setShowViewers(true)}
              className="relative glass-card p-2.5 flex items-center justify-center flex-shrink-0">
              <Icon name="Eye" size={20} className="text-white/60" />
              {viewersCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  {viewersCount > 9 ? "9+" : viewersCount}
                </div>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => handleTabChange(t.id)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={activeTab === t.id
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                  : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                {t.label}
                {t.id === "online" && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-400 inline-block align-middle" />
                )}
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
