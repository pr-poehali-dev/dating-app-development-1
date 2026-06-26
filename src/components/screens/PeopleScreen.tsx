import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, notificationsApi, postsApi, type Profile, type DiscoverParams } from "@/lib/api";
import { isUserOnline } from "@/lib/online";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { PeopleFilterSheet } from "@/components/screens/people/PeopleFilterSheet";
import { PeopleAdvancedFilter } from "@/components/screens/people/PeopleAdvancedFilter";
import { PeopleExploreWorld } from "@/components/screens/people/PeopleExploreWorld";
import { PeopleTravelMode } from "@/components/screens/people/PeopleTravelMode";
import { PeopleViewersSheet } from "@/components/screens/people/PeopleViewersSheet";
import { PeopleGrid } from "@/components/screens/people/PeopleGrid";
import { useYookassa } from "@/components/extensions/yookassa/useYookassa";
import { PAY_CREATE_URL } from "@/components/screens/ProfileGiftSheet";


export function PeopleScreen({ onOpenChat, onGoToChats, onPremium, onOpenSelf, isPremium, currentUserId }: {
  onOpenChat?: (matchId: number) => void;
  onGoToChats?: () => void;
  onPremium?: () => void;
  onOpenSelf?: () => void;
  isPremium?: boolean;
  currentUserId?: number;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DiscoverParams>({});
  const [activeTab, setActiveTab] = useState<"all" | "online" | "new">("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [viewerProfile, setViewerProfile] = useState<Profile | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewersCount, setViewersCount] = useState(0);
  const [showBoosts, setShowBoosts] = useState(false);
  const [boostSelected, setBoostSelected] = useState<"promote"|"super">("promote");
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showTravel, setShowTravel] = useState(false);
  const [advancedAgeMin, setAdvancedAgeMin] = useState(18);
  const [advancedAgeMax, setAdvancedAgeMax] = useState(60);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const { pay: payBoost, loading: boostPaying } = useYookassa(PAY_CREATE_URL);

  const discountedPrice = (amount: number) =>
    promoDiscount > 0 ? Math.round(amount * (1 - promoDiscount / 100) * 100) / 100 : amount;

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code || promoChecking) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const res = await profilesApi.activatePromo(code);
      setPromoCode(res.code);
      setPromoDiscount(res.discount_percent);
    } catch (e) {
      setPromoCode(null);
      setPromoDiscount(0);
      setPromoError(e instanceof Error ? e.message : "Промокод недействителен");
    } finally {
      setPromoChecking(false);
    }
  };

  const resetPromo = () => {
    setPromoInput(""); setPromoCode(null); setPromoDiscount(0); setPromoError(null);
  };

  const handleBuyBoost = async (boostType: "promote" | "super", amount: number, description: string) => {
    const token = localStorage.getItem("spark_token") || "";
    const metadata: Record<string, string> = { kind: "boost", boost_type: boostType, sender_token: token };
    if (currentUserId) metadata.user_id = String(currentUserId);
    if (promoCode) metadata.promo_code = promoCode;
    await payBoost({
      amount,
      description,
      returnUrl: window.location.origin + "/?payment=success",
      metadata,
    });
  };
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Запоминаем текущие параметры запроса для автообновления
  const lastQuery = useRef<{ params: DiscoverParams; q?: string }>({ params: {} });

  const load = useCallback((params: DiscoverParams, q?: string, silent?: boolean) => {
    lastQuery.current = { params, q };
    if (!silent) setLoading(true);
    profilesApi.getDiscover({ ...params, ...(q !== undefined ? { search: q } : {}) })
      .then((d) => setProfiles(d.profiles))
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false); });
  }, []);

  useEffect(() => { load({}); }, [load]);

  // Автообновление списка каждые 30 секунд (реальное время: онлайн/новые)
  useEffect(() => {
    const interval = setInterval(() => {
      load(lastQuery.current.params, lastQuery.current.q, true);
    }, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    notificationsApi.list()
      .then(d => setViewersCount(d.notifications.filter(n => n.type === "view").length))
      .catch(() => {});
  }, []);

  const handleOpenViewerProfile = (userId: number) => {
    postsApi.getUserProfile(userId)
      .then((d) => {
        setShowViewers(false);
        setViewerProfile(d.profile);
      })
      .catch(() => {});
  };

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
    delete p.online_only;
    delete p.new_only;
    if (tab === "online") p.online_only = true;
    if (tab === "new") p.new_only = true as never;
    load(p, search);
  };

  const filterCount = [
    filters.looking_for && filters.looking_for !== "all",
    filters.age_min && filters.age_min > 18,
    filters.age_max && filters.age_max < 80,
    filters.city,
    filters.online_only,
  ].filter(Boolean).length;

  const BOT_IDS = new Set([22]);

  const tabs = [
    { id: "all" as const, label: "Все" },
    { id: "online" as const, label: "Онлайн" },
    { id: "new" as const, label: "Новые" },
  ];

  // На вкладке «Онлайн» дополнительно фильтруем по реальному статусу (last_seen < 5 мин)
  const displayProfiles = (activeTab === "online"
    ? profiles.filter((p) => isUserOnline(p.last_seen, p.online))
    : profiles
  ).filter(p => !BOT_IDS.has(p.id));

  return (
    <>
      {selected && (
        <DiscoverProfileModal
          profile={selected}
          profiles={displayProfiles}
          profileIndex={selectedIdx}
          onClose={() => setSelected(null)}
          onLike={(p) => setLikedIds((prev) => new Set([...prev, p.id]))}
          onOpenChat={(matchId) => { setSelected(null); onOpenChat?.(matchId); }}
          onGoToChats={() => { setSelected(null); onGoToChats?.(); }}
        />
      )}
      {viewerProfile && (
        <DiscoverProfileModal
          profile={viewerProfile}
          profiles={[viewerProfile]}
          profileIndex={0}
          onClose={() => setViewerProfile(null)}
          onLike={(p) => setLikedIds((prev) => new Set([...prev, p.id]))}
          onOpenChat={(matchId) => { setViewerProfile(null); onOpenChat?.(matchId); }}
          onGoToChats={() => { setViewerProfile(null); onGoToChats?.(); }}
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

            if (city === "__nearby__") {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const p: DiscoverParams = {
                    ...filters,
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    radius_km: 50,
                    city: undefined,
                  };
                  setFilters(p); load(p, search);
                },
                () => {
                  // Геолокация отклонена — просто ищем без фильтра
                  const p: DiscoverParams = { ...filters };
                  delete p.city; delete p.lat; delete p.lon;
                  setFilters(p); load(p, search);
                },
                { timeout: 8000 }
              );
              return;
            }

            if (city === "__random__") {
              const cities = [
                "Москва","Санкт-Петербург","Новосибирск","Екатеринбург","Казань",
                "Минск","Алматы","Ташкент","Тбилиси","Баку","Ереван","Берлин",
                "Нижний Новгород","Самара","Уфа","Красноярск","Пермь","Воронеж",
              ];
              const random = cities[Math.floor(Math.random() * cities.length)];
              const p: DiscoverParams = { ...filters, city: random, lat: undefined, lon: undefined };
              setFilters(p); load(p, search);
              return;
            }

            const p: DiscoverParams = { ...filters, city, lat: undefined, lon: undefined };
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
          onOpenProfile={handleOpenViewerProfile}
        />
      )}

      {showBoosts && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => { setShowBoosts(false); resetPromo(); }}>
          <div className="w-full max-w-sm rounded-t-3xl flex flex-col pb-8"
            style={{ background: "#111111" }}
            onClick={e => e.stopPropagation()}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
            </div>

            {/* Закрыть */}
            <div className="flex justify-end px-4 pt-1 pb-0">
              <button onClick={() => { setShowBoosts(false); resetPromo(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <Icon name="X" size={16} className="text-white/70" />
              </button>
            </div>

            {/* Заголовок */}
            <div className="px-6 pt-2 pb-5 text-center">
              <h2 className="text-white font-bold text-2xl leading-tight mb-2">Купить бусты профиля</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Получай больше просмотров и чатов, подняв свой профиль наверх списка для всех людей рядом
              </p>
            </div>

            {/* Тарифы */}
            <div className="px-4 flex flex-col gap-3">
              {([
                { type: "promote" as const, label: "Boost 1 Hour", amount: 350 },
                { type: "super"   as const, label: "5 Boosts 1 Hour", amount: 550 },
              ] as const).map(({ type, label, amount }) => {
                const selected = boostSelected === type;
                return (
                  <button key={type} onClick={() => setBoostSelected(type)}
                    className="w-full flex items-center justify-between px-4 py-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                    style={{
                      background: selected ? "rgba(255,255,255,0.08)" : "transparent",
                      border: selected ? "1.5px solid rgba(255,255,255,0.55)" : "1.5px solid rgba(255,255,255,0.15)",
                    }}>
                    <div className="flex items-center gap-3">
                      {/* Радио */}
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ border: selected ? "none" : "1.5px solid rgba(255,255,255,0.4)", background: selected ? "white" : "transparent" }}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#111111" }} />}
                      </div>
                      <span className="text-white font-medium text-base">{label}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {promoDiscount > 0 && <p className="text-white/35 text-xs line-through">{amount.toLocaleString("ru")} ₽</p>}
                      <span className="text-white font-semibold text-base">{discountedPrice(amount).toLocaleString("ru")} ₽</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Промокод */}
            <div className="px-4 pt-3">
              {promoCode ? (
                <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name="BadgeCheck" size={18} className="text-green-400 flex-shrink-0" />
                    <p className="text-green-400 text-sm font-semibold truncate">
                      Промокод {promoCode} · −{promoDiscount}%
                    </p>
                  </div>
                  <button onClick={resetPromo} className="text-white/40 hover:text-white/70 flex-shrink-0">
                    <Icon name="X" size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                      placeholder="Промокод"
                      className="flex-1 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none uppercase tracking-wide"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoChecking || !promoInput.trim()}
                      className="px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                      {promoChecking ? <Icon name="Loader2" size={16} className="animate-spin text-white" /> : "Применить"}
                    </button>
                  </div>
                  {promoError && <p className="text-red-400 text-xs mt-2 px-1">{promoError}</p>}
                </>
              )}
            </div>

            {/* Кнопка купить */}
            <div className="px-4 pt-4">
              <button
                disabled={boostPaying}
                onClick={() => {
                  if (boostSelected === "promote") handleBuyBoost("promote", 350, "Boost 1 Hour");
                  else handleBuyBoost("super", 550, "5 Boosts 1 Hour");
                }}
                className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "white", color: "#111111" }}>
                {boostPaying
                  ? <Icon name="Loader2" size={20} className="animate-spin text-black" />
                  : <>
                      <Icon name="Zap" size={18} style={{ color: "#111111" }} />
                      <span style={{ color: "#111111" }}>
                        Продолжить · {discountedPrice(boostSelected === "promote" ? 350 : 550).toLocaleString("ru")} ₽
                      </span>
                    </>
                }
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

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          <PeopleGrid
            profiles={displayProfiles}
            loading={loading}
            search={search}
            filterCount={filterCount}
            isPremium={isPremium}
            likedIds={likedIds}
            currentUserId={currentUserId}
            onSelect={(p, idx) => {
              if (p.id === currentUserId && onOpenSelf) { onOpenSelf(); return; }
              setSelected(p); setSelectedIdx(idx);
            }}
            onPremium={onPremium}
            onReset={() => { setSearch(""); setFilters({}); setActiveTab("all"); load({}); }}
          />
        </div>
      </div>
    </>
  );
}