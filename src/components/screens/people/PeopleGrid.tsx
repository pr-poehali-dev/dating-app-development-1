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
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: "#FF2D78", borderRightColor: "rgba(255,45,120,0.3)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="Search" size={16} className="text-pink-500/60" />
          </div>
        </div>
        <p className="text-white/30 text-sm">Ищем людей...</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-8">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon name="SearchX" size={36} className="text-white/25" />
        </div>
        <div className="text-center">
          <p className="text-white/60 font-semibold text-base mb-1">
            {search ? `Никого по «${search}»` : "Никого не найдено"}
          </p>
          <p className="text-white/30 text-sm leading-relaxed">
            {search ? "Попробуй другое имя или город" : "Попробуй изменить фильтры"}
          </p>
        </div>
        {(search || filterCount > 0) && (
          <button onClick={onReset}
            className="px-6 py-2.5 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 16px rgba(255,45,120,0.35)" }}>
            Сбросить фильтры
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Счётчик */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <p className="text-white/40 text-xs font-medium">{profiles.length} {profiles.length === 1 ? "человек" : "человек"}</p>
        {!isPremium && profiles.length > FREE_LIMIT && (
          <span className="text-pink-400/70 text-xs">+{profiles.length - FREE_LIMIT} скрыто</span>
        )}
      </div>

      {/* Сетка */}
      <div className="grid grid-cols-3 gap-1 px-1 pb-4">
        {profiles.map((p, idx) => {
          const photo = p.photo_url || FALLBACK_PHOTO;
          const isLiked = likedIds.has(p.id);
          const isLocked = !isPremium && idx >= FREE_LIMIT;

          return (
            <button key={p.id}
              onClick={() => isLocked ? onPremium?.() : onSelect(p, idx)}
              className="relative overflow-hidden group transition-all active:scale-[0.97]"
              style={{ aspectRatio: "2/3", borderRadius: 16 }}>

              <img
                src={photo}
                className="w-full h-full object-cover"
                style={isLocked ? { filter: "blur(14px)", transform: "scale(1.12)" } : undefined}
              />

              {/* Градиент снизу */}
              {!isLocked && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
              )}

              {/* Блокировка Premium */}
              {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  style={{ background: "rgba(10,5,20,0.55)", backdropFilter: "blur(2px)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 12px rgba(255,45,120,0.5)" }}>
                    <Icon name="Lock" size={15} className="text-white" />
                  </div>
                  <span className="text-white text-[9px] font-bold tracking-wide">PREMIUM</span>
                </div>
              )}

              {/* Буст */}
              {p.boosted && !isLocked && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 0 8px rgba(255,45,120,0.7)" }}>
                  <Icon name="Zap" size={10} className="text-white" />
                </div>
              )}

              {/* Онлайн */}
              {p.online && !isLocked && (
                <div className={`absolute w-2.5 h-2.5 rounded-full bg-green-400 ${p.boosted ? "top-2 right-8" : "top-2 right-2"}`}
                  style={{ border: "1.5px solid rgba(0,0,0,0.5)", boxShadow: "0 0 6px rgba(74,222,128,0.8)" }} />
              )}

              {/* Верификация */}
              {p.verified && !isLocked && (
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(59,130,246,0.9)", boxShadow: "0 0 6px rgba(59,130,246,0.5)" }}>
                  <Icon name="Check" size={10} className="text-white" />
                </div>
              )}

              {/* Лайкнут */}
              {isLiked && !isLocked && !p.verified && (
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,45,120,0.9)", boxShadow: "0 0 6px rgba(255,45,120,0.5)" }}>
                  <Icon name="Heart" size={10} className="text-white" />
                </div>
              )}

              {/* Имя и город */}
              {!isLocked && (
                <div className="absolute bottom-0 left-0 right-0 px-2 pb-2.5">
                  <div className="flex items-center gap-1">
                    <p className="text-white text-[11px] font-bold leading-tight truncate drop-shadow">
                      {p.name}{p.age ? `, ${p.age}` : ""}
                    </p>
                    {p.premium && (
                      <span className="text-[8px] flex-shrink-0">✨</span>
                    )}
                  </div>
                  {p.city && (
                    <p className="text-white/55 text-[9px] truncate mt-0.5 leading-tight">{p.city}</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Premium-баннер снизу */}
      {!isPremium && profiles.length > FREE_LIMIT && (
        <div className="mx-3 mb-6 rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.12) 0%, rgba(155,89,182,0.12) 100%)", border: "1px solid rgba(255,45,120,0.25)" }}>
          <div className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 12px rgba(255,45,120,0.4)" }}>
              <Icon name="Crown" size={19} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-tight">Открой всех людей</p>
              <p className="text-white/45 text-xs mt-0.5">Ещё {profiles.length - FREE_LIMIT} {profiles.length - FREE_LIMIT === 1 ? "профиль скрыт" : "профилей скрыто"}</p>
            </div>
            <button onClick={onPremium}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs flex-shrink-0 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }}>
              Premium
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default PeopleGrid;
