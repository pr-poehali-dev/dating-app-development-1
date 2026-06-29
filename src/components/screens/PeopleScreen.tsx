import { useState, useEffect, useRef, useCallback } from "react";
import { profilesApi, notificationsApi, postsApi, type Profile, type DiscoverParams } from "@/lib/api";
import { isUserOnline } from "@/lib/online";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { PeopleFilterSheet } from "@/components/screens/people/PeopleFilterSheet";
import { PeopleAdvancedFilter } from "@/components/screens/people/PeopleAdvancedFilter";
import { PeopleExploreWorld } from "@/components/screens/people/PeopleExploreWorld";
import { PeopleTravelMode } from "@/components/screens/people/PeopleTravelMode";
import { PeopleViewersSheet } from "@/components/screens/people/PeopleViewersSheet";
import { PeopleGrid } from "@/components/screens/people/PeopleGrid";
import { PeopleHeader } from "@/components/screens/people/PeopleHeader";
import { PeopleBoostsSheet } from "@/components/screens/people/PeopleBoostsSheet";
import { PeopleBoostPicker } from "@/components/screens/people/PeopleBoostPicker";
import { PeopleSuperPicker } from "@/components/screens/people/PeopleSuperPicker";
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
  const [showBoostPicker, setShowBoostPicker] = useState(false);
  const [showSuperPicker, setShowSuperPicker] = useState(false);
  const [boostSelected, setBoostSelected] = useState<"promote" | "super">("promote");
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

  const handleBuyBoost = async (boostType: "promote" | "super", amount: number, description: string, extraMeta?: Record<string, string>) => {
    const token = localStorage.getItem("spark_token") || "";
    const metadata: Record<string, string> = { kind: "boost", boost_type: boostType, sender_token: token, ...extraMeta };
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

  const displayProfiles = (activeTab === "online"
    ? profiles.filter((p) => isUserOnline(p.last_seen, p.online))
    : profiles
  ).filter(p => !BOT_IDS.has(p.id));

  const promoProps = {
    promoCode,
    promoDiscount,
    promoInput,
    promoChecking,
    promoError,
    onPromoInputChange: (val: string) => { setPromoInput(val); setPromoError(null); },
    onApplyPromo: handleApplyPromo,
    onResetPromo: resetPromo,
  };

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
        <PeopleBoostsSheet
          boostPaying={boostPaying}
          {...promoProps}
          onClose={() => { setShowBoosts(false); resetPromo(); }}
          onOpenBoostPicker={() => { setShowBoosts(false); setBoostSelected("promote"); setShowBoostPicker(true); }}
          onOpenSuperPicker={() => { setShowBoosts(false); setShowSuperPicker(true); }}
        />
      )}

      {showBoostPicker && (
        <PeopleBoostPicker
          boostSelected={boostSelected}
          boostPaying={boostPaying}
          {...promoProps}
          onClose={() => { setShowBoostPicker(false); resetPromo(); }}
          onSelectBoost={setBoostSelected}
          onBuy={() => handleBuyBoost(
            boostSelected,
            boostSelected === "promote" ? 350 : 550,
            boostSelected === "promote" ? "Boost 1 Hour" : "5 Boosts 1 Hour"
          )}
        />
      )}

      {showSuperPicker && (
        <PeopleSuperPicker
          boostPaying={boostPaying}
          {...promoProps}
          onClose={() => { setShowSuperPicker(false); resetPromo(); }}
          onBuy={(ageMin, ageMax, radius, photoOnly, zodiac) => handleBuyBoost("super", 550, "Супер подъём профиля", {
            age_min: String(ageMin), age_max: String(ageMax),
            radius_km: String(radius), photo_only: String(photoOnly),
            zodiac: zodiac || "",
          })}
        />
      )}

      <div className="flex flex-col h-full">
        <PeopleHeader
          search={search}
          activeTab={activeTab}
          filterCount={filterCount}
          viewersCount={viewersCount}
          onSearchChange={handleSearch}
          onTabChange={handleTabChange}
          onOpenFilters={() => setShowFilters(true)}
          onOpenViewers={() => setShowViewers(true)}
          onOpenBoosts={() => setShowBoosts(true)}
        />

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