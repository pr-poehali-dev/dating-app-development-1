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
    } catch (e) { void e; }
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

  const visible = isPremium ? users : users.slice(0, FREE_LIMIT);
  const locked = !isPremium && users.length > FREE_LIMIT;

  return (
    <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
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

      {/* Сетка пользователей */}
      <div className="px-4 pb-4 flex flex-col gap-2.5">
        {visible.map((user) => {
          const isSub = subscribed[user.id] ?? false;
          const isSubLoading = subLoading[user.id] ?? false;
          return (
            <button
              key={user.id}
              onClick={() => onProfile(user)}
              className="flex items-center gap-3 w-full text-left active:scale-[0.98] transition-transform"
            >
              {/* Аватар */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.photo_url || FALLBACK}
                  className="w-11 h-11 rounded-full object-cover"
                  style={{ border: "2px solid rgba(255,45,120,0.35)" }}
                />
                {user.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2"
                    style={{ borderColor: "#0f0a1a" }} />
                )}
              </div>

              {/* Имя + город */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-semibold text-sm truncate">
                    {user.name}{user.age ? `, ${user.age}` : ""}
                  </p>
                  {user.verified && <Icon name="BadgeCheck" size={13} className="text-blue-400 flex-shrink-0" />}
                </div>
                {user.city && (
                  <p className="text-white/40 text-xs truncate">{user.city}</p>
                )}
              </div>

              {/* Кнопка подписки */}
              <button
                onClick={(e) => toggleSub(e, user)}
                disabled={isSubLoading}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-90 disabled:opacity-50"
                style={isSub
                  ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.15)" }
                  : { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
                {isSubLoading
                  ? <Icon name="Loader2" size={11} className="animate-spin" />
                  : isSub
                    ? <><Icon name="Check" size={11} />Вы подписаны</>
                    : <><Icon name="UserPlus" size={11} />Подписаться</>}
              </button>
            </button>
          );
        })}

        {/* Локер — подписка */}
        {locked && (
          <button
            onClick={onPremium}
            className="mt-1 w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.15), rgba(155,89,182,0.15))", border: "1px solid rgba(255,45,120,0.3)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              <Icon name="Crown" size={16} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-sm">Смотреть больше</p>
              <p className="text-white/50 text-xs">Оформи подписку, чтобы увидеть всех</p>
            </div>
            <Icon name="ChevronRight" size={16} className="text-pink-400" />
          </button>
        )}
      </div>
    </div>
  );
}

export default NearbyUsersBanner;