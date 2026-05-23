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
  const [subscribed, setSubscribed] = useState<Record<number, boolean>>({});
  const [subLoading, setSubLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    profilesApi.getDiscover({ online_only: false })
      .then(d => setUsers(d.profiles.slice(0, 9)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSub = async (e: React.MouseEvent, user: Profile) => {
    e.stopPropagation();
    if (subLoading[user.id]) return;
    setSubLoading(s => ({ ...s, [user.id]: true }));
    try {
      const r = await profilesApi.subscribeToggle(user.id);
      setSubscribed(s => ({ ...s, [user.id]: r.subscribed }));
    } catch { void 0; }
    finally { setSubLoading(s => ({ ...s, [user.id]: false })); }
  };

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
          <div className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            <Icon name="MapPin" size={11} className="text-white" />
          </div>
          <p className="text-white font-bold text-sm">Новые пользователи рядом с тобой</p>
        </div>
        <span className="text-white/40 text-xs">{users.length}+</span>
      </div>

      {/* Горизонтальный скролл карточек */}
      <div className="relative pb-4">
        <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {users.map((user, idx) => {
            const isLocked = !isPremium && idx >= FREE_LIMIT;
            const isSub = subscribed[user.id] ?? false;
            const isSubLoading = subLoading[user.id] ?? false;

            return (
              <div
                key={user.id}
                className="flex-shrink-0 flex flex-col gap-1.5"
                style={{ width: 90, scrollSnapAlign: "start" }}
              >
                {/* Фото */}
                <button
                  onClick={() => isLocked ? onPremium() : onProfile(user)}
                  className="relative rounded-2xl overflow-hidden active:scale-95 transition-transform flex-shrink-0"
                  style={{ width: 90, height: 115 }}
                >
                  <img
                    src={user.photo_url || FALLBACK}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Блюр для заблокированных */}
                  {isLocked && (
                    <div className="absolute inset-0"
                      style={{ backdropFilter: "blur(10px)", background: "rgba(0,0,0,0.35)" }} />
                  )}

                  {/* Градиент снизу */}
                  {!isLocked && (
                    <div className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
                  )}

                  {/* Онлайн */}
                  {user.online && !isLocked && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400"
                      style={{ boxShadow: "0 0 0 1.5px rgba(0,0,0,0.6)" }} />
                  )}

                  {/* Замок Premium */}
                  {isLocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                        <Icon name="Crown" size={14} className="text-white" />
                      </div>
                      <span className="text-white text-[9px] font-bold">Premium</span>
                    </div>
                  )}

                  {/* Имя снизу */}
                  {!isLocked && (
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
                      <p className="text-white font-semibold text-[10px] leading-tight truncate drop-shadow">
                        {user.name}{user.age ? `, ${user.age}` : ""}
                      </p>
                    </div>
                  )}
                </button>

                {/* Кнопка подписаться */}
                {!isLocked && (
                  <button
                    onClick={(e) => toggleSub(e, user)}
                    disabled={isSubLoading}
                    className="w-full py-1 rounded-xl text-[10px] font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-0.5"
                    style={isSub
                      ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.12)" }
                      : { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
                    {isSubLoading
                      ? <Icon name="Loader2" size={10} className="animate-spin" />
                      : isSub
                        ? "✓ Подписан"
                        : "+ Подписаться"}
                  </button>
                )}
              </div>
            );
          })}

          {/* Кнопка "Смотреть всех" */}
          {!isPremium && (
            <div className="flex-shrink-0 flex flex-col gap-1.5" style={{ width: 90, scrollSnapAlign: "start" }}>
              <button
                onClick={onPremium}
                className="rounded-2xl flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
                style={{ width: 90, height: 115, background: "linear-gradient(135deg,rgba(255,45,120,0.15),rgba(155,89,182,0.15))", border: "1px solid rgba(255,45,120,0.3)" }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  <Icon name="Crown" size={16} className="text-white" />
                </div>
                <p className="text-white font-bold text-[10px] text-center px-1 leading-tight">Смотреть<br/>всех</p>
              </button>
              <div className="h-[26px]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NearbyUsersBanner;
