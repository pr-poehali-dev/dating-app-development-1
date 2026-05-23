import Icon from "@/components/ui/icon";
import { type Profile } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";
const FREE_LIMIT = 9;

interface Props {
  profiles: Profile[];
  loading: boolean;
  search: string;
  filterCount: number;
  isPremium?: boolean;
  likedIds: Set<number>;
  onSelect: (p: Profile, idx: number) => void;
  onPremium?: () => void;
  onReset: () => void;
}

export function PeopleGrid({
  profiles,
  loading,
  search,
  filterCount,
  isPremium,
  likedIds,
  onSelect,
  onPremium,
  onReset,
}: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        <p className="text-white/30 text-sm">Ищем людей...</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
        <div className="text-6xl">🔍</div>
        <p className="text-white/50 text-sm text-center">
          {search ? `Никого не найдено по «${search}»` : "Никого не найдено. Попробуй изменить фильтры."}
        </p>
        {(search || filterCount > 0) && (
          <button onClick={onReset} className="btn-grad px-5 py-2.5 text-sm">Сбросить</button>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="px-4 pt-3 pb-1 text-white/30 text-xs">{profiles.length} человек</p>
      <div className="grid grid-cols-3 gap-0.5 px-0.5 pb-4">
        {profiles.map((p, idx) => {
          const photo = p.photo_url || FALLBACK_PHOTO;
          const isLiked = likedIds.has(p.id);
          const isLocked = !isPremium && idx >= FREE_LIMIT;

          return (
            <button key={p.id}
              onClick={() => isLocked ? onPremium?.() : onSelect(p, idx)}
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
                  <div className="flex items-center gap-1 flex-wrap">
                    <p className="text-white text-[11px] font-semibold leading-tight truncate">
                      {p.name}{p.age ? `, ${p.age}` : ""}
                    </p>
                    {p.premium && (
                      <span className="text-[8px] px-1 py-0.5 rounded-full font-bold leading-none flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
                        ✨
                      </span>
                    )}
                  </div>
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
  );
}

export default PeopleGrid;
