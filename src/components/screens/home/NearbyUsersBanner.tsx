import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type Profile } from "@/lib/api";

interface Props {
  isPremium: boolean;
  onProfile: (p: Profile) => void;
  onPremium: () => void;
  onOpenGrid: () => void;
}

const FALLBACK = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";
const FREE_LIMIT = 3;

export function NearbyUsersBanner({ isPremium, onProfile, onPremium, onOpenGrid }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState<Record<number, boolean>>({});
  const [subLoading, setSubLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    profilesApi.getDiscover({ online_only: false })
      .then(async d => {
        const list = d.profiles.slice(0, 9);
        setUsers(list);
        const statuses = await Promise.allSettled(
          list.map(u => profilesApi.subscriptionStatus(u.id))
        );
        const initial: Record<number, boolean> = {};
        statuses.forEach((res, i) => {
          if (res.status === "fulfilled") initial[list[i].id] = res.value.subscribed;
        });
        setSubscribed(initial);
      })
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
      <div className="mx-4 mb-5 rounded-3xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="mb-5 mx-4 rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(255,45,120,0.06) 0%, rgba(155,89,182,0.06) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>

      {/* Заголовок */}
      <button
        onClick={onOpenGrid}
        className="flex items-center justify-between px-4 pt-4 pb-3 w-full active:opacity-70 transition-opacity">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            <Icon name="Sparkles" size={13} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Новые рядом</p>
            <p className="text-white/35 text-[10px]">Познакомься первым</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.25)" }}>
          <span className="text-pink-400 text-xs font-semibold">Все</span>
          <Icon name="ChevronRight" size={13} className="text-pink-400" />
        </div>
      </button>

      {/* Горизонтальный скролл карточек */}
      <div className="pb-4">
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {users.map((user, idx) => {
            const isLocked = !isPremium && idx >= FREE_LIMIT;
            const isSub = subscribed[user.id] ?? false;
            const isSubLoading = subLoading[user.id] ?? false;

            return (
              <div
                key={user.id}
                className="flex-shrink-0 flex flex-col gap-2"
                style={{ width: 88, scrollSnapAlign: "start" }}>

                {/* Карточка-фото */}
                <button
                  onClick={() => isLocked ? onPremium() : onProfile(user)}
                  className="relative rounded-2xl overflow-hidden active:scale-95 transition-transform"
                  style={{ width: 88, height: 116 }}>
                  <img
                    src={user.photo_url || FALLBACK}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Блюр для заблокированных */}
                  {isLocked && (
                    <div className="absolute inset-0"
                      style={{ backdropFilter: "blur(12px)", background: "rgba(10,5,20,0.4)" }} />
                  )}

                  {/* Градиент снизу */}
                  {!isLocked && (
                    <div className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)" }} />
                  )}

                  {/* Онлайн-точка */}
                  {user.online && !isLocked && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-400"
                      style={{ boxShadow: "0 0 0 2px rgba(0,0,0,0.5), 0 0 6px rgba(74,222,128,0.6)" }} />
                  )}

                  {/* Замок Premium */}
                  {isLocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 12px rgba(255,45,120,0.5)" }}>
                        <Icon name="Crown" size={16} className="text-white" />
                      </div>
                      <span className="text-white text-[9px] font-bold tracking-wide">PREMIUM</span>
                    </div>
                  )}

                  {/* Имя снизу */}
                  {!isLocked && (
                    <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                      <p className="text-white font-bold text-[11px] leading-tight truncate drop-shadow-sm">
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
                    className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 ${isSub ? "text-white/40" : "text-white"}`}
                    style={isSub
                      ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }
                      : { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                    {isSubLoading
                      ? <Icon name="Loader2" size={11} className="animate-spin" />
                      : isSub
                        ? "✓ Подписан"
                        : "+ Подписаться"}
                  </button>
                )}
              </div>
            );
          })}

          {/* Кнопка "Смотреть всех" — только без премиума */}
          {!isPremium && (
            <div className="flex-shrink-0 flex flex-col gap-2" style={{ width: 88, scrollSnapAlign: "start" }}>
              <button
                onClick={onPremium}
                className="rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{
                  width: 88, height: 116,
                  background: "linear-gradient(160deg, rgba(255,45,120,0.12), rgba(155,89,182,0.12))",
                  border: "1px solid rgba(255,45,120,0.25)",
                }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 12px rgba(255,45,120,0.4)" }}>
                  <Icon name="Crown" size={17} className="text-white" />
                </div>
                <p className="text-white font-bold text-[10px] text-center px-2 leading-snug">Смотреть<br/>всех</p>
              </button>
              <div className="h-[30px]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NearbyUsersBanner;