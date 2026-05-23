import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { matchesApi, likesApi, type Match, type LikedBy } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ─── SwipeToDelete — обёртка для свайпа влево ────────────────────────────────
function SwipeToDelete({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const threshold = 100;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = Math.abs(e.touches[0].clientY - startY.current);
    if (dy > 12) { startX.current = null; return; }
    if (dx < 0) setOffset(Math.max(dx, -180));
  };

  const onTouchEnd = () => {
    if (offset < -threshold) {
      setDeleting(true);
      onDelete();
    } else {
      setOffset(0);
    }
    startX.current = null;
  };

  if (deleting) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Красный фон справа */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-5 rounded-3xl"
        style={{ background: "rgba(220,38,38,0.9)", width: Math.abs(offset) || 0, transition: offset === 0 ? "width 0.2s" : "none" }}>
        <Icon name="Trash2" size={22} className="text-white" />
      </div>
      {/* Карточка */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? "transform 0.2s ease" : "none" }}>
        {children}
      </div>
    </div>
  );
}

// ─── RealMatchesScreen ────────────────────────────────────────────────────────
export function RealMatchesScreen({ onChat }: { onChat: (matchId: number) => void }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Match | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    matchesApi.getAll()
      .then((d) => setMatches(d.matches))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await matchesApi.delete(confirmDelete.match_id);
      setMatches(prev => prev.filter(m => m.match_id !== confirmDelete.match_id));
    } catch { void 0; }
    finally { setDeleting(false); setConfirmDelete(null); }
  };

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );

  if (matches.length === 0) return (
    <div className="flex flex-col h-full items-center justify-center gap-4 px-8 text-center">
      <div className="text-6xl">💬</div>
      <p className="text-white/50 text-sm">Пока нет совпадений.<br />Лайкай анкеты — и скоро появятся!</p>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-white font-golos font-bold text-2xl">Сообщения</h2>
        </div>
        <div className="px-5 flex-1">
          <div className="flex flex-col gap-1">
            {matches.map((m) => (
              <SwipeToDelete key={m.match_id} onDelete={() => setConfirmDelete(m)}>
                <button onClick={() => onChat(m.match_id)}
                  className="glass-card p-4 flex items-center gap-3 w-full text-left hover:bg-white/10 transition-all">
                  <div className="relative flex-shrink-0">
                    <img src={m.photo_url || FALLBACK_PHOTO} className="w-12 h-12 rounded-full object-cover" />
                    {m.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--spark-dark)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">{m.name}{m.age ? `, ${m.age}` : ""}</span>
                      <span className="text-white/40 text-xs">{m.last_msg_time ? new Date(m.last_msg_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                    </div>
                    <p className="text-white/50 text-sm truncate mt-0.5">
                      {!m.last_msg
                        ? "Совпадение! Напиши первым 👋"
                        : m.last_msg.startsWith("__AUDIO__")
                          ? "🎤 Голосовое сообщение"
                          : m.last_msg.startsWith("__VANISH__") || m.last_msg.match(/\.(jpg|jpeg|png|gif|webp)/i)
                            ? "📷 Фото"
                            : m.last_msg === "__REQUEST_PHOTO__"
                              ? "🔐 Запрос доступа к фото"
                              : m.last_msg === "__GRANT_PHOTO__"
                                ? "🖼️ Открыт доступ к фото"
                                : m.last_msg.startsWith("__LOC__")
                                  ? "📍 Геолокация"
                                  : m.last_msg.startsWith("__GIFT__")
                                    ? "🎁 Подарок"
                                    : m.last_msg}
                    </p>
                  </div>
                  {m.unread_count > 0 && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>{m.unread_count}</div>
                  )}
                </button>
              </SwipeToDelete>
            ))}
          </div>
        </div>
      </div>

      {/* Диалог подтверждения удаления */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-t-3xl pb-8 px-5 pt-5"
            style={{ background: "var(--spark-dark2,#1a1625)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <img src={confirmDelete.photo_url || FALLBACK_PHOTO} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-base">{confirmDelete.name}</p>
                <p className="text-white/40 text-xs">Удалить переписку и совпадение?</p>
              </div>
            </div>
            <p className="text-white/50 text-sm mb-5 leading-relaxed">
              Чат и все сообщения будут удалены у обоих участников. Это действие нельзя отменить.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 mb-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
              {deleting
                ? <><Icon name="Loader2" size={16} className="animate-spin" />Удаление...</>
                : <><Icon name="Trash2" size={16} />Удалить чат</>}
            </button>
            <button onClick={() => setConfirmDelete(null)}
              className="w-full py-3 rounded-2xl text-white/50 text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── RealLikesScreen ──────────────────────────────────────────────────────────
export function RealLikesScreen({ onPremium }: { onPremium: () => void }) {
  const [likedMe, setLikedMe] = useState<LikedBy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    likesApi.getLikedMe()
      .then((d) => setLikedMe(d.liked_me))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-golos font-bold text-2xl">Ты им понравился</h2>
        <p className="text-white/40 text-sm mt-0.5">{likedMe.length} человек лайкнули тебя</p>
      </div>
      <div className="mx-5 mb-5 p-5 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.25), rgba(155,89,182,0.25))", border: "1px solid rgba(255,45,120,0.3)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-base">LoveBloom Premium</span>
              <span className="premium-badge">GOLD</span>
            </div>
            <p className="text-white/60 text-sm">Смотри, кто тебя лайкнул — без ограничений</p>
          </div>
          <div className="text-3xl">✨</div>
        </div>
        <button onClick={onPremium} className="btn-grad px-5 py-2.5 text-sm w-full">Открыть все лайки</button>
      </div>
      {likedMe.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="text-5xl">❤️</div>
          <p className="text-white/50 text-sm text-center">Пока никто не лайкнул.<br />Заполни профиль и лайкай сам!</p>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3">
          {likedMe.map((p, i) => (
            <div key={p.id} className="relative rounded-2xl overflow-hidden aspect-[3/4]">
              <img src={p.photo_url || FALLBACK_PHOTO} className="w-full h-full object-cover"
                style={{ filter: p.blurred ? "blur(20px) brightness(0.7)" : "none" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
              {p.blurred && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={onPremium} className="glass-card p-3 flex flex-col items-center gap-1">
                    <Icon name="Lock" size={18} className="text-white" />
                    <span className="text-white text-xs">Premium</span>
                  </button>
                </div>
              )}
              <div className="absolute bottom-3 left-3">
                <p className="text-white font-semibold text-sm">{p.name}{p.age ? `, ${p.age}` : ""}</p>
              </div>
              <div style={{ display: "none" }}>{i}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}