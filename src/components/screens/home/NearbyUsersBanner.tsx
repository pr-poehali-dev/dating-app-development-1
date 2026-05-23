import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type Profile } from "@/lib/api";

interface Props {
  isPremium: boolean;
  onProfile: (p: Profile) => void;
  onPremium: () => void;
}

const FALLBACK = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";
const FREE_LIMIT = 3;

export function NearbyUsersBanner({ isPremium, onProfile, onPremium }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profilesApi.getDiscover({ online_only: false })
      .then(d => setUsers(d.profiles.slice(0, 9)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="mb-4 rounded-3xl overflow-hidden mx-4"
      style={{ background: "linear-gradient(160deg, rgba(255,45,120,0.07) 0%, rgba(155,89,182,0.07) 100%)", border: "1px solid rgba(255,255,255,0.09)" }}>

      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            <Icon name="MapPin" size={13} className="text-white" />
          </div>
          <p className="text-white font-bold text-sm">Новые пользователи рядом с тобой</p>
        </div>
        <span className="text-white/40 text-xs">{users.length}+</span>
      </div>

      {/* Горизонтальный скролл карточек */}
      <div className="relative pb-4">
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {users.map((user, idx) => {
            const isLocked = !isPremium && idx >= FREE_LIMIT;
            return (
              <button
                key={user.id}
                onClick={() => isLocked ? onPremium() : onProfile(user)}
                className="flex-shrink-0 relative rounded-2xl overflow-hidden active:scale-95 transition-transform"
                style={{ width: 110, height: 145, scrollSnapAlign: "start" }}
              >
                {/* Фото */}
                <img
                  src={user.photo_url || FALLBACK}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Блюр-оверлей для заблокированных */}
                {isLocked && (
                  <div className="absolute inset-0"
                    style={{ backdropFilter: "blur(10px)", background: "rgba(0,0,0,0.35)" }} />
                )}

                {/* Затемнение снизу */}
                {!isLocked && (
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
                )}

                {/* Онлайн-индикатор */}
                {user.online && !isLocked && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-400"
                    style={{ boxShadow: "0 0 0 2px rgba(0,0,0,0.5)" }} />
                )}

                {/* Иконка Premium замка */}
                {isLocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                      <Icon name="Crown" size={16} className="text-white" />
                    </div>
                    <span className="text-white text-[10px] font-bold">Premium</span>
                  </div>
                )}

                {/* Имя + лайки снизу */}
                {!isLocked && (
                  <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                    <p className="text-white font-semibold text-xs leading-tight truncate">
                      {user.name}{user.age ? `, ${user.age}` : ""}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon name="Heart" size={10} className="text-pink-400" />
                      <span className="text-white/70 text-[10px]">{Math.floor(Math.random() * 8) + 2}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* Кнопка "Смотреть всех" для Premium */}
          {!isPremium && (
            <button
              onClick={onPremium}
              className="flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ width: 110, height: 145, scrollSnapAlign: "start", background: "linear-gradient(135deg,rgba(255,45,120,0.15),rgba(155,89,182,0.15))", border: "1px solid rgba(255,45,120,0.3)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                <Icon name="Crown" size={18} className="text-white" />
              </div>
              <p className="text-white font-bold text-xs text-center px-1 leading-tight">Смотреть<br/>всех</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NearbyUsersBanner;
