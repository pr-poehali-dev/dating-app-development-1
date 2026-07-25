import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { notificationsApi, likesApi, type Notification } from "@/lib/api";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface Props {
  isPremium?: boolean;
  onClose: () => void;
  onPremium?: () => void;
  onOpenProfile?: (userId: number) => void;
}

function timeAgo(iso: string) {
  // Бэкенд отдаёт время в UTC без суффикса зоны — без явного 'Z' браузер
  // трактует строку как локальное время, и расчёт сдвигается на разницу с UTC.
  const utcIso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const diff = (Date.now() - new Date(utcIso).getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

export function PeopleViewersSheet({ isPremium, onClose, onPremium, onOpenProfile }: Props) {
  const [viewers, setViewers] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());

  const handleLikeBack = async (userId: number) => {
    if (likedIds.has(userId)) return;
    setLikedIds(prev => new Set([...prev, userId]));
    try {
      const res = await likesApi.send(userId);
      if (res.match) {
        setMatchedIds(prev => new Set([...prev, userId]));
        window.dispatchEvent(new CustomEvent("app:match"));
      }
    } catch {
      setLikedIds(prev => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  useEffect(() => {
    notificationsApi.list()
      .then(d => {
        const views = d.notifications.filter(n => n.type === "view");
        setViewers(views);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--spark-dark2,#1a1625)" }}>
      <div className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 12px)", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ArrowLeft" size={20} className="text-white" />
        </button>
        <h3 className="text-white font-bold text-base flex items-center gap-2">
          <Icon name="Eye" size={18} className="text-white/60" />
          Кто смотрел профиль
          {viewers.length > 0 && <span className="text-white/40 text-sm font-normal">· {viewers.length}</span>}
        </h3>
      </div>

      <div className="overflow-y-auto flex-1 px-3 py-3 pb-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="Eye" size={28} className="text-pink-400" />
              </div>
              <p className="text-white font-semibold text-center">Просмотров пока нет</p>
              <p className="text-white/40 text-sm text-center leading-relaxed">
                Заполни анкету и добавь фото — это привлечёт больше внимания!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {!isPremium && (
                <button onClick={() => { onClose(); onPremium?.(); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.25)" }}>
                  <Icon name="Crown" size={18} className="text-pink-400 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-pink-400 text-xs font-bold">✨ Premium — узнай кто смотрел</p>
                    <p className="text-white/40 text-xs">С подпиской видно имя и фото каждого</p>
                  </div>
                </button>
              )}
              <div className="grid grid-cols-3 gap-1.5">
                {viewers.map((v, i) => {
                  const liked = likedIds.has(v.from_user_id);
                  const matched = matchedIds.has(v.from_user_id);
                  return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <button type="button"
                      onClick={() => {
                        if (isPremium && v.from_user_id) onOpenProfile?.(v.from_user_id);
                        else if (!isPremium) { onClose(); onPremium?.(); }
                      }}
                      className="relative overflow-hidden transition-all active:scale-[0.97]"
                      style={{ aspectRatio: "2/3", borderRadius: 16 }}>
                      <UserAvatar
                        src={v.photo_url}
                        className="absolute inset-0 w-full h-full"
                        style={!isPremium ? { filter: "blur(14px)", transform: "scale(1.12)" } : {}}
                      />

                      {/* Градиент снизу */}
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />

                      {!isPremium && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                          style={{ background: "rgba(10,5,20,0.55)", backdropFilter: "blur(2px)" }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 12px rgba(255,45,120,0.5)" }}>
                            <Icon name="Lock" size={14} className="text-white" />
                          </div>
                        </div>
                      )}

                      {/* Имя и время снизу */}
                      {isPremium ? (
                        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                          <p className="text-white text-[12px] font-extrabold leading-tight truncate tracking-tight"
                            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
                            {v.name}
                          </p>
                          <p className="text-white/60 text-[9px] font-medium truncate leading-tight mt-0.5"
                            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{timeAgo(v.created_at)}</p>
                        </div>
                      ) : (
                        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 flex flex-col items-center gap-1">
                          <div className="h-3 w-14 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                          <p className="text-white/50 text-[9px]">{timeAgo(v.created_at)}</p>
                        </div>
                      )}
                    </button>

                    {isPremium ? (
                      <button type="button"
                        onClick={() => handleLikeBack(v.from_user_id)}
                        disabled={liked}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
                        style={{
                          background: matched ? "rgba(34,197,94,0.18)" : liked ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#FF2D78,#9B59B6)",
                          color: matched ? "#22c55e" : "white",
                        }}>
                        <Icon name={matched ? "Check" : "Heart"} size={12} className={!liked && !matched ? "text-white" : ""} />
                        {matched ? "Матч!" : liked ? "Лайк" : "В ответ"}
                      </button>
                    ) : (
                      <button type="button"
                        onClick={() => { onClose(); onPremium?.(); }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
                        style={{ background: "rgba(255,45,120,0.12)", color: "#FF2D78" }}>
                        <Icon name="Heart" size={12} className="text-pink-400" />
                        В ответ
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default PeopleViewersSheet;