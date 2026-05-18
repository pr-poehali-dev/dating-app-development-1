import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type Profile, type DiscoverParams } from "@/lib/api";

// Re-exports
export { ReportModal } from "@/components/screens/ReportModal";
export { FilterScreen } from "@/components/screens/FilterScreen";
export { DiscoverProfileModal } from "@/components/screens/DiscoverProfileModal";

import { PROFILES_FALLBACK, DiscoverProfileModal } from "@/components/screens/DiscoverProfileModal";

type LocalProfile = (typeof PROFILES_FALLBACK)[0];

const PROFILES_DEMO = [
  {
    id: 1,
    name: "Алина",
    age: 24,
    city: "Москва",
    distance: "3 км",
    bio: "Люблю кофе, рассветы и случайные путешествия. Ищу человека, с которым можно потеряться в незнакомом городе ☕",
    tags: ["Путешествия", "Кофе", "Йога", "Кино"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg",
    verified: true,
    online: true,
  },
  {
    id: 2,
    name: "Максим",
    age: 28,
    city: "Москва",
    distance: "7 км",
    bio: "Архитектор по призванию. Строю города и разрушаю стереотипы. Обожаю джаз и спонтанные вечера 🎷",
    tags: ["Архитектура", "Джаз", "Спорт", "Готовка"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/f6e87c7a-8c99-4c42-a478-32f63cadb0d8.jpg",
    verified: false,
    online: false,
  },
  {
    id: 3,
    name: "Соня",
    age: 26,
    city: "Санкт-Петербург",
    distance: "15 км",
    bio: "Фотограф, влюблённая в детали. Ловлю красоту в обычном. Ищу того, кто умеет удивлять 📸",
    tags: ["Фотография", "Искусство", "Книги", "Танцы"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/9e6ff21a-1da2-432f-882a-f0ee84125e09.jpg",
    verified: true,
    online: true,
  },
  {
    id: 4,
    name: "Дима",
    age: 27,
    city: "Москва",
    distance: "2 км",
    bio: "IT-разработчик, который умеет отдыхать. Велопрогулки, барбекю и хорошие компании — вот моя жизнь 🚲",
    tags: ["IT", "Велоспорт", "Природа", "Музыка"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/93213dcb-e051-4766-9eb3-527ebd0b3c85.jpg",
    verified: false,
    online: true,
  },
];

// ─── SwipeCard ────────────────────────────────────────────────────────────────
function SwipeCard({
  profile,
  onLike,
  onDislike,
  isTop,
  offset = 0,
}: {
  profile: LocalProfile;
  onLike: () => void;
  onDislike: () => void;
  isTop: boolean;
  offset?: number;
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const startRef = useRef({ x: 0, y: 0 });

  const likeOpacity = Math.min(Math.max(drag.x / 80, 0), 1);
  const nopeOpacity = Math.min(Math.max(-drag.x / 80, 0), 1);
  const rotation = (drag.x / 15) * (drag.y > 0 ? 1 : -1);

  const handleStart = (clientX: number, clientY: number) => {
    if (!isTop) return;
    startRef.current = { x: clientX, y: clientY };
    setDrag((d) => ({ ...d, dragging: true }));
  };
  const handleMove = (clientX: number, clientY: number) => {
    if (!drag.dragging) return;
    setDrag({ x: clientX - startRef.current.x, y: clientY - startRef.current.y, dragging: true });
  };
  const handleEnd = () => {
    if (!drag.dragging) return;
    if (drag.x > 90) { setExiting("right"); setTimeout(onLike, 350); }
    else if (drag.x < -90) { setExiting("left"); setTimeout(onDislike, 350); }
    else setDrag({ x: 0, y: 0, dragging: false });
  };

  const handleLikeBtn = () => { setExiting("right"); setTimeout(onLike, 350); };
  const handleDislikeBtn = () => { setExiting("left"); setTimeout(onDislike, 350); };

  const scale = isTop ? 1 : 1 - offset * 0.04;
  const translateY = isTop ? drag.y : offset * 12;

  return (
    <div
      className="swipe-card absolute inset-0"
      style={{
        transform: exiting === "left"
          ? "translateX(-150%) rotate(-30deg)"
          : exiting === "right"
          ? "translateX(150%) rotate(30deg)"
          : `translateX(${drag.x}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
        transition: drag.dragging ? "none" : exiting ? "transform 0.35s ease" : "transform 0.25s ease",
        zIndex: 10 - offset,
        opacity: exiting ? 0 : 1,
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
      <div className="stamp-like" style={{ opacity: likeOpacity }}>НРАВ.</div>
      <div className="stamp-nope" style={{ opacity: nopeOpacity }}>НЕЕТ</div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-white font-golos font-bold text-3xl">{profile.name}, {profile.age}</h2>
          {profile.verified && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
              <Icon name="Check" size={12} className="text-white" />
            </div>
          )}
          {profile.premium && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
              ✨ GOLD
            </span>
          )}
          {profile.online && <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_#00E676]" />}
        </div>
        <div className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <Icon name="MapPin" size={13} />
          <span>{profile.city} · {profile.distance}</span>
        </div>
        <p className="text-white/80 text-sm leading-relaxed mb-3 line-clamp-2">{profile.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.tags.map((tag) => <span key={tag} className="tag-pill">{tag}</span>)}
        </div>
      </div>

      {isTop && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 pb-6 pt-16">
          <button onClick={handleDislikeBtn}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <Icon name="X" size={22} className="text-white" />
          </button>
          <button onClick={handleLikeBtn} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 btn-grad">
            <Icon name="Heart" size={26} className="text-white" />
          </button>
          <button className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <Icon name="Star" size={20} className="text-yellow-400" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── DiscoverScreen (static demo) ────────────────────────────────────────────
export function DiscoverScreen({ onFilter }: { onFilter: () => void }) {
  const [cards, setCards] = useState(PROFILES_DEMO);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = () => {
    setLikeAnim(true);
    setTimeout(() => { setLikeAnim(false); setCards((c) => c.slice(1)); }, 400);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 relative z-10">
        <div>
          <h1 className="font-unbounded text-white text-xl font-black grad-text">LoveBloom</h1>
          <p className="text-white/40 text-xs">Москва · Найдено 284</p>
        </div>
        <button onClick={onFilter} className="glass-card px-4 py-2 flex items-center gap-2 text-white/80 text-sm">
          <Icon name="SlidersHorizontal" size={15} />Фильтры
        </button>
      </div>

      <div className="flex-1 relative mx-4" style={{ maxHeight: "calc(100% - 80px)" }}>
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-up">
            <div className="text-6xl">🌟</div>
            <p className="text-white/60 text-center text-sm">Анкеты закончились.<br />Расширь критерии поиска!</p>
            <button className="btn-grad px-6 py-3 text-sm" onClick={() => setCards(PROFILES_DEMO)}>Обновить</button>
          </div>
        ) : (
          cards.slice(0, 3).reverse().map((p, i) => (
            <SwipeCard
              key={p.id}
              profile={p}
              isTop={i === cards.slice(0, 3).length - 1}
              offset={cards.slice(0, 3).length - 1 - i}
              onLike={handleLike}
              onDislike={() => setCards((c) => c.slice(1))}
            />
          ))
        )}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="w-24 h-24 rounded-full flex items-center justify-center animate-heart"
              style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
              <Icon name="Heart" size={44} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RealDiscoverScreen ───────────────────────────────────────────────────────
export function RealDiscoverScreen({ currentUser, onOpenFilter }: {
  currentUser: { id: number };
  onOpenFilter: (filters: DiscoverParams, onApply: (p: DiscoverParams) => void) => void;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DiscoverParams>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((params: DiscoverParams, q?: string) => {
    setLoading(true);
    profilesApi.getDiscover({ ...params, ...(q !== undefined ? { search: q } : {}) })
      .then((d) => setProfiles(d.profiles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load({}); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(filters, val), 400);
  };

  const handleApplyFilters = (p: DiscoverParams) => {
    setFilters(p);
    const cnt = [p.looking_for && p.looking_for !== "all", p.age_min && p.age_min > 18,
      p.age_max && p.age_max < 80, p.country, p.city, p.online_only, p.radius_km].filter(Boolean).length;
    setActiveFiltersCount(cnt);
    load(p, search);
  };

  const handleLike = useCallback((p: Profile) => {
    setLikedIds((prev) => new Set([...prev, p.id]));
  }, []);

  void currentUser;

  return (
    <>
      {selected && (
        <DiscoverProfileModal profile={selected} onClose={() => setSelected(null)} onLike={handleLike} />
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <img src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/51fe4ec6-6465-42e1-b1ed-df2cd706037f.jpg" className="w-8 h-8 rounded-xl object-cover" />
            <h1 className="font-unbounded text-white text-xl font-black grad-text">LoveBloom</h1>
          </div>

          <button
            onClick={() => onOpenFilter(filters, handleApplyFilters)}
            className="relative glass-card px-3 py-2 flex items-center gap-2 text-white/80 text-sm">
            <Icon name="SlidersHorizontal" size={15} />Фильтры
            {activeFiltersCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                {activeFiltersCount}
              </div>
            )}
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Поиск по имени или @username..."
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
        </div>

        {(filters.city || filters.country || filters.online_only || filters.radius_km) && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {filters.city && (
              <span className="glass-card px-2.5 py-1 text-white/60 text-xs flex items-center gap-1">
                <Icon name="MapPin" size={10} />{filters.city}
              </span>
            )}
            {filters.country && !filters.city && (
              <span className="glass-card px-2.5 py-1 text-white/60 text-xs flex items-center gap-1">
                <Icon name="Globe" size={10} />{filters.country}
              </span>
            )}
            {filters.online_only && (
              <span className="glass-card px-2.5 py-1 text-white/60 text-xs flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />онлайн
              </span>
            )}
            {filters.radius_km && (
              <span className="glass-card px-2.5 py-1 text-white/60 text-xs flex items-center gap-1">
                <Icon name="LocateFixed" size={10} />{filters.radius_km} км
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && profiles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
              <div className="text-6xl">🔍</div>
              <p className="text-white/60 text-center text-sm">
                {search ? `Никого не найдено по запросу «${search}»` : "Никого не найдено.\nПопробуй изменить фильтры."}
              </p>
              <button className="btn-grad px-6 py-3 text-sm" onClick={() => { setSearch(""); setFilters({}); setActiveFiltersCount(0); load({}); }}>
                Сбросить фильтры
              </button>
            </div>
          )}
          {!loading && profiles.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5">
              {profiles.map((p) => {
                const photo = p.photo_url || PROFILES_FALLBACK[0].photo;
                const isLiked = likedIds.has(p.id);
                return (
                  <button key={p.id} onClick={() => setSelected(p)}
                    className="relative aspect-square overflow-hidden group">
                    <img src={photo} className="w-full h-full object-cover transition-transform group-active:scale-95" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.75) 100%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
                      <p className="text-white text-[10px] font-semibold truncate leading-tight">
                        {p.name}{p.age ? `, ${p.age}` : ""}
                        {p.verified && <span className="ml-0.5 text-blue-300">✓</span>}
                      </p>
                      {(p as Profile & { username?: string }).username && (
                        <p className="text-white/50 text-[9px] font-mono truncate">@{(p as Profile & { username?: string }).username}</p>
                      )}
                      {(p as Profile & { distance_km?: number }).distance_km !== undefined && (
                        <p className="text-white/50 text-[9px]">{(p as Profile & { distance_km?: number }).distance_km} км</p>
                      )}
                    </div>
                    {p.online && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400"
                        style={{ border: "1.5px solid rgba(0,0,0,0.5)" }} />
                    )}
                    {isLiked && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,45,120,0.9)" }}>
                        <Icon name="Heart" size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}