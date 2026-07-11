import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type Profile } from "@/lib/api";
import { isUserOnline } from "@/lib/online";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface Props {
  isPremium: boolean;
  onProfile: (p: Profile) => void;
  onPremium: () => void;
  onBack: () => void;
}

const FREE_LIMIT = 3;
const BOT_IDS = new Set([22]);

export function NewUsersGridScreen({ isPremium, onProfile, onPremium, onBack }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profilesApi.getDiscover({ new_only: true })
      .then(d => setUsers(d.profiles.filter(u => !BOT_IDS.has(u.id))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "var(--spark-dark, #0d0d0d)" }}>
      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg leading-tight">Новые пользователи</h1>
          <p className="text-white/40 text-xs">Из разных городов России</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.2))", border: "1px solid rgba(255,45,120,0.3)" }}>
          <Icon name="Sparkles" size={12} className="text-pink-400" />
          <span className="text-pink-400 text-xs font-semibold">Новинки</span>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Icon name="Users" size={40} className="text-white/20" />
            <span className="text-white/40 text-sm">Пока нет новых пользователей</span>
          </div>
        ) : (
          <>
            {/* Плашка с инфо о премиум */}
            {!isPremium && users.length > FREE_LIMIT && (
              <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-2xl"
                style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.1),rgba(155,89,182,0.1))", border: "1px solid rgba(255,45,120,0.2)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  <Icon name="Crown" size={12} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs font-semibold">Доступно 3 из {users.length}</p>
                  <p className="text-white/50 text-[11px]">Premium — смотри всех новых пользователей</p>
                </div>
                <button
                  onClick={onPremium}
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
                  Premium
                </button>
              </div>
            )}

            {/* Сетка */}
            <div className="grid grid-cols-3 gap-2">
              {users.map((user, idx) => {
                const isLocked = !isPremium && idx >= FREE_LIMIT;
                return (
                  <button
                    key={user.id}
                    onClick={() => isLocked ? onPremium() : onProfile(user)}
                    className="relative rounded-2xl overflow-hidden active:scale-95 transition-transform"
                    style={{ aspectRatio: "3/4" }}>
                    <UserAvatar
                      src={user.photo_url}
                      alt=""
                      className="absolute inset-0 w-full h-full"
                    />

                    {/* Блюр для заблокированных */}
                    {isLocked && (
                      <div className="absolute inset-0"
                        style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.4)" }} />
                    )}

                    {/* Градиент снизу */}
                    {!isLocked && (
                      <div className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)" }} />
                    )}

                    {/* Онлайн */}
                    {isUserOnline(user.last_seen, user.online) && !isLocked && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400"
                        style={{ boxShadow: "0 0 0 1.5px rgba(0,0,0,0.6)" }} />
                    )}

                    {/* Метка NEW */}
                    {!isLocked && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                        НОВЫЙ
                      </div>
                    )}

                    {/* Замок Premium */}
                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                          <Icon name="Crown" size={15} className="text-white" />
                        </div>
                        <span className="text-white text-[9px] font-bold">Premium</span>
                      </div>
                    )}

                    {/* Имя и город */}
                    {!isLocked && (
                      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                        <p className="text-white font-semibold text-[11px] leading-tight truncate drop-shadow">
                          {user.name}{user.age ? `, ${user.age}` : ""}
                        </p>
                        {user.city && (
                          <p className="text-white/70 text-[10px] truncate drop-shadow">{user.city}</p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NewUsersGridScreen;