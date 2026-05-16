import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type Profile, type DiscoverParams } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ─── FilterSheet ──────────────────────────────────────────────────────────────
function FilterSheet({ filters, onApply, onClose }: {
  filters: DiscoverParams;
  onApply: (p: DiscoverParams) => void;
  onClose: () => void;
}) {
  const [ageMin, setAgeMin] = useState(filters.age_min ?? 18);
  const [ageMax, setAgeMax] = useState(filters.age_max ?? 60);
  const [lookingFor, setLookingFor] = useState(filters.looking_for ?? "all");
  const [onlineOnly, setOnlineOnly] = useState(filters.online_only ?? false);
  const [city, setCity] = useState(filters.city ?? "");

  const apply = () => {
    const p: DiscoverParams = { age_min: ageMin, age_max: ageMax, looking_for: lookingFor };
    if (onlineOnly) p.online_only = true;
    if (city.trim()) p.city = city.trim();
    onApply(p);
  };

  const reset = () => {
    setAgeMin(18); setAgeMax(60); setLookingFor("all");
    setOnlineOnly(false); setCity("");
  };

  const genders = [
    { val: "female", label: "Девушки" },
    { val: "male", label: "Парни" },
    { val: "all", label: "Все" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />

        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-white font-bold text-base">Фильтры</h3>
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-white/40 text-xs hover:text-white/70 transition-colors">Сбросить</button>
            <button onClick={onClose}><Icon name="X" size={20} className="text-white/50" /></button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5 pb-4">
          {/* Возраст */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Возраст</span>
              <span className="text-white/50 text-sm">{ageMin} – {ageMax} лет</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs w-6">от</span>
                <input type="range" min={18} max={ageMax} value={ageMin}
                  onChange={(e) => setAgeMin(+e.target.value)} className="flex-1 accent-pink-500" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs w-6">до</span>
                <input type="range" min={ageMin} max={80} value={ageMax}
                  onChange={(e) => setAgeMax(+e.target.value)} className="flex-1 accent-pink-500" />
              </div>
            </div>
          </div>

          {/* Кого ищешь */}
          <div>
            <span className="text-white font-semibold text-sm block mb-3">Кого ищешь</span>
            <div className="grid grid-cols-3 gap-2">
              {genders.map((g) => (
                <button key={g.val} onClick={() => setLookingFor(g.val)}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={lookingFor === g.val
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Только онлайн */}
          <button onClick={() => setOnlineOnly((v) => !v)}
            className="flex items-center justify-between w-full glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-white font-semibold text-sm">Только онлайн</span>
            </div>
            <div className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: onlineOnly ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
                style={{ left: onlineOnly ? "calc(100% - 22px)" : "2px" }} />
            </div>
          </button>

          {/* Город */}
          <div>
            <span className="text-white font-semibold text-sm block mb-2">Город</span>
            <div className="flex gap-2">
              <input value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Например: Москва"
                className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
              <button
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    try {
                      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=ru`);
                      const d = await r.json();
                      const detected = d.address?.city || d.address?.town || d.address?.village || d.address?.county || "";
                      if (detected) setCity(detected);
                    } catch { /* ignore */ }
                  });
                }}
                title="Определить город автоматически"
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                style={{ background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.3)" }}>
                <Icon name="Navigation" size={18} className="text-pink-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 pt-2">
          <button onClick={apply} className="btn-grad w-full py-3.5 text-sm font-semibold">
            Применить фильтры
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ProfileViewersSheet ──────────────────────────────────────────────────────
function ProfileViewersSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <Icon name="Eye" size={18} className="text-white/60" />Кто смотрел профиль
          </h3>
          <button onClick={onClose}><Icon name="X" size={20} className="text-white/50" /></button>
        </div>
        <div className="flex flex-col items-center justify-center py-14 gap-3 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,45,120,0.12)" }}>
            <Icon name="Eye" size={28} className="text-pink-400" />
          </div>
          <p className="text-white font-semibold text-center">Просмотры профиля</p>
          <p className="text-white/40 text-sm text-center leading-relaxed">
            Пока никто не смотрел твой профиль. Заполни анкету и добавь фото — это привлечёт больше внимания!
          </p>
          <div className="mt-2 p-3 rounded-2xl w-full text-center"
            style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.2)" }}>
            <p className="text-pink-400 text-xs font-semibold">✨ Premium</p>
            <p className="text-white/50 text-xs mt-0.5">С Premium видно, кто именно смотрел</p>
          </div>
        </div>
        <div className="px-5 pb-8">
          <button onClick={onClose} className="glass-card w-full py-3 text-white/60 text-sm font-semibold">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PeopleScreen ─────────────────────────────────────────────────────────────
const FREE_LIMIT = 9;

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
  const [showFilters, setShowFilters] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
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

  // Подсчёт активных фильтров
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
          onClose={() => setSelected(null)}
          onLike={(p) => setLikedIds((prev) => new Set([...prev, p.id]))}
          onOpenChat={(matchId) => { setSelected(null); onOpenChat?.(matchId); }}
          onGoToChats={() => { setSelected(null); onGoToChats?.(); }}
        />
      )}
      {showFilters && (
        <FilterSheet
          filters={filters}
          onApply={handleApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
      {showViewers && <ProfileViewersSheet onClose={() => setShowViewers(false)} />}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="mb-3">
            <h2 className="text-white font-golos font-bold text-2xl">Люди</h2>
          </div>

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
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                0
              </div>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              <p className="text-white/30 text-sm">Ищем людей...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
              <div className="text-6xl">🔍</div>
              <p className="text-white/50 text-sm text-center">
                {search ? `Никого не найдено по «${search}»` : "Никого не найдено. Попробуй изменить фильтры."}
              </p>
              {(search || filterCount > 0) && (
                <button onClick={() => { setSearch(""); setFilters({}); load({}); }}
                  className="btn-grad px-5 py-2.5 text-sm">Сбросить</button>
              )}
            </div>
          ) : (
            <>
              <p className="px-4 pt-3 pb-1 text-white/30 text-xs">{profiles.length} человек</p>
              <div className="grid grid-cols-3 gap-0.5 px-0.5 pb-4">
                {profiles.map((p, idx) => {
                  const photo = p.photo_url || FALLBACK_PHOTO;
                  const isLiked = likedIds.has(p.id);
                  const isLocked = !isPremium && idx >= FREE_LIMIT;

                  return (
                    <button key={p.id}
                      onClick={() => isLocked ? onPremium?.() : setSelected(p)}
                      className="relative aspect-square overflow-hidden group">
                      <img src={photo}
                        className="w-full h-full object-cover transition-transform duration-200 group-active:scale-95"
                        style={isLocked ? { filter: "blur(12px)", transform: "scale(1.1)" } : undefined} />

                      {/* Gradient */}
                      {!isLocked && (
                        <div className="absolute inset-0 pointer-events-none"
                          style={{ background: "linear-gradient(transparent 45%, rgba(0,0,0,0.8) 100%)" }} />
                      )}

                      {/* Locked overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                          style={{ background: "rgba(0,0,0,0.45)" }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                            <Icon name="Lock" size={14} className="text-white" />
                          </div>
                          <span className="text-white text-[9px] font-semibold text-center leading-tight px-1">Premium</span>
                        </div>
                      )}

                      {/* Online dot */}
                      {p.online && !isLocked && (
                        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-400"
                          style={{ border: "1.5px solid rgba(0,0,0,0.5)", boxShadow: "0 0 4px #4ADE80" }} />
                      )}

                      {/* Verified */}
                      {p.verified && !isLocked && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)" }}>
                          <Icon name="Check" size={10} className="text-white" />
                        </div>
                      )}

                      {/* Liked */}
                      {isLiked && !isLocked && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(255,45,120,0.9)" }}>
                          <Icon name="Heart" size={10} className="text-white" />
                        </div>
                      )}

                      {/* Name + age */}
                      {!isLocked && (
                        <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
                          <p className="text-white text-[11px] font-semibold leading-tight truncate">
                            {p.name}{p.age ? `, ${p.age}` : ""}
                          </p>
                          {p.city && (
                            <p className="text-white/50 text-[9px] truncate">{p.city}</p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Баннер про Premium если есть заблокированные */}
              {!isPremium && profiles.length > FREE_LIMIT && (
                <div className="mx-4 mb-6 rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.15),rgba(155,89,182,0.15))", border: "1px solid rgba(255,45,120,0.3)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                    <Icon name="Crown" size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold">Открой всех людей</p>
                    <p className="text-white/50 text-xs mt-0.5">Ещё {profiles.length - FREE_LIMIT} человек скрыты</p>
                  </div>
                  <button onClick={onPremium}
                    className="btn-grad px-3 py-2 text-xs font-bold text-white rounded-xl flex-shrink-0">
                    Premium
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}