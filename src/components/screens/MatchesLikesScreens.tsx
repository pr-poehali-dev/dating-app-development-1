import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { matchesApi, likesApi, type Match, type LikedBy } from "@/lib/api";
import { isUserOnline } from "@/lib/online";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ─── LongPressToDelete — удаление по долгому нажатию ─────────────────────────
function LongPressToDelete({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const fired = useRef(false);
  const [pressing, setPressing] = useState(false);
  const delay = 550;

  const clear = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setPressing(false);
    startX.current = null;
    startY.current = null;
  };

  const start = (x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    fired.current = false;
    setPressing(true);
    timer.current = setTimeout(() => {
      fired.current = true;
      setPressing(false);
      if (navigator.vibrate) navigator.vibrate(30);
      onDelete();
    }, delay);
  };

  const move = (x: number, y: number) => {
    if (startX.current === null || startY.current === null) return;
    if (Math.abs(x - startX.current) > 10 || Math.abs(y - startY.current) > 10) clear();
  };

  return (
    <div
      className="rounded-3xl"
      style={{ transform: pressing ? "scale(0.97)" : "scale(1)", transition: "transform 0.15s ease" }}
      onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => move(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={clear}
      onTouchCancel={clear}
      onContextMenu={(e) => e.preventDefault()}
      onClickCapture={(e) => { if (fired.current) { e.preventDefault(); e.stopPropagation(); fired.current = false; } }}
    >
      {children}
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
    <div className="flex flex-col h-full items-center justify-center gap-5 px-8 text-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.14))", border: "1px solid rgba(255,45,120,0.25)", boxShadow: "0 0 32px rgba(255,45,120,0.2)" }} />
        <div className="absolute inset-[-6px] rounded-[28px]" style={{ border: "1px solid rgba(255,45,120,0.08)" }} />
        {/* Icon */}
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="msgGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF2D78"/>
              <stop offset="100%" stopColor="#9B59B6"/>
            </linearGradient>
          </defs>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            fill="url(#msgGrad)" opacity="0.15" stroke="url(#msgGrad)" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="8.5" cy="11" r="1" fill="url(#msgGrad)"/>
          <circle cx="12" cy="11" r="1" fill="url(#msgGrad)"/>
          <circle cx="15.5" cy="11" r="1" fill="url(#msgGrad)"/>
        </svg>
        {/* Pulse dot */}
        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-pink-500 border-2 border-[#0d0518]" style={{ boxShadow: "0 0 8px #FF2D78" }} />
      </div>
      <div>
        <p className="text-white/70 font-semibold text-base mb-1">Нет сообщений</p>
        <p className="text-white/35 text-sm leading-relaxed">Лайкай анкеты — и скоро появятся совпадения!</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Шапка */}
        <div className="px-4 pb-3 flex items-center justify-between flex-shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-white font-bold text-2xl leading-tight">Сообщения</h2>
            <p className="text-white/35 text-xs mt-0.5">{matches.length} {matches.length === 1 ? "диалог" : matches.length < 5 ? "диалога" : "диалогов"}</p>
          </div>
          <div className="w-8 h-8 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="MessageCircle" size={16} className="text-white/50" />
          </div>
        </div>

        {/* Список чатов */}
        <div className="px-3 pt-3 flex flex-col gap-0.5 flex-1">
          {matches.map((m) => {
            const lastMsgText = !m.last_msg
              ? "Совпадение! Напиши первым 👋"
              : m.last_msg.startsWith("__AUDIO__") ? "🎤 Голосовое"
              : m.last_msg.startsWith("__VANISH__") || m.last_msg.match(/\.(jpg|jpeg|png|gif|webp)/i) ? "📷 Фото"
              : m.last_msg === "__REQUEST_PHOTO__" ? "🔐 Запрос фото"
              : m.last_msg === "__GRANT_PHOTO__" ? "🖼️ Доступ к фото"
              : m.last_msg.startsWith("__LOC__") ? "📍 Геолокация"
              : m.last_msg.startsWith("__GIFT__") ? "🎁 Подарок"
              : m.last_msg.startsWith("__VIDEOCIRCLE__") ? "⭕ Видео-кружок"
              : m.last_msg.includes("GEO_DENIED") ? "📍 Геолокация недоступна"
              : m.last_msg.startsWith("__VCALL__") ? "📹 Видеозвонок"
              : m.last_msg.startsWith("__AWARD__") ? "🏆 Награда"
              : m.last_msg.startsWith("__") ? ""
              : m.last_msg;

            const timeStr = m.last_msg_time
              ? new Date(m.last_msg_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
              : "";

            return (
              <LongPressToDelete key={m.match_id} onDelete={() => setConfirmDelete(m)}>
                <button onClick={() => onChat(m.match_id)}
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={m.unread_count > 0 ? { background: "rgba(255,45,120,0.07)" } : {}}>

                  {/* Аватар */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden"
                      style={m.unread_count > 0 ? { boxShadow: "0 0 0 2px rgba(255,45,120,0.5)" } : { boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}>
                      <img src={m.photo_url || FALLBACK_PHOTO} className="w-full h-full object-cover" />
                    </div>
                    {isUserOnline(m.last_seen, m.online) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400"
                        style={{ border: "2px solid #0f0a1a", boxShadow: "0 0 6px rgba(74,222,128,0.6)" }} />
                    )}
                  </div>

                  {/* Текст */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-white font-bold text-sm truncate">
                        {m.name}{m.age ? `, ${m.age}` : ""}
                      </span>
                      <span className={`text-xs flex-shrink-0 ml-2 ${m.unread_count > 0 ? "text-pink-400" : "text-white/30"}`}>
                        {timeStr}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${m.unread_count > 0 ? "text-white/75 font-medium" : "text-white/35"}`}>
                      {lastMsgText}
                    </p>
                  </div>

                  {/* Бейдж непрочитанных */}
                  {m.unread_count > 0 && (
                    <div className="min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] text-white font-black flex-shrink-0 px-1.5"
                      style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 8px rgba(255,45,120,0.5)" }}>
                      {m.unread_count > 99 ? "99+" : m.unread_count}
                    </div>
                  )}
                </button>
              </LongPressToDelete>
            );
          })}
        </div>
      </div>

      {/* Диалог подтверждения удаления */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm flex flex-col"
            style={{
              background: "linear-gradient(180deg,#1e1830 0%,#17112a 100%)",
              borderRadius: "32px 32px 0 0",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
              padding: "12px 20px 36px",
            }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <img src={confirmDelete.photo_url || FALLBACK_PHOTO}
                className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-base">{confirmDelete.name}</p>
                <p className="text-white/40 text-xs">Удалить переписку?</p>
              </div>
            </div>
            <p className="text-white/45 text-sm mb-5 leading-relaxed">
              Чат и все сообщения будут удалены у обоих участников. Это нельзя отменить.
            </p>
            <button onClick={handleDelete} disabled={deleting}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 mb-2 disabled:opacity-50 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", boxShadow: "0 4px 16px rgba(220,38,38,0.35)" }}>
              {deleting
                ? <><Icon name="Loader2" size={16} className="animate-spin" />Удаление...</>
                : <><Icon name="Trash2" size={16} />Удалить чат</>}
            </button>
            <button onClick={() => setConfirmDelete(null)}
              className="w-full py-3 rounded-2xl text-white/50 text-sm font-medium active:scale-[0.98] transition-all"
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