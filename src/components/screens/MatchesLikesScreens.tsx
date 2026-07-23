import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { matchesApi, likesApi, postsApi, type Match, type LikedBy, type Profile } from "@/lib/api";
import { isUserOnline } from "@/lib/online";
import { useAppRefresh } from "@/hooks/useAppRefresh";
import { DiscoverProfileModal } from "@/components/screens/DiscoverProfileModal";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1ce048c9-36f3-4eb8-a0bc-4117b2b48365.jpg";

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

  const loadMatches = useCallback((silent?: boolean) => {
    if (!silent) setLoading(true);
    matchesApi.getAll()
      .then((d) => setMatches(d.matches))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  useAppRefresh(() => loadMatches(true));

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
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
        <div className="flex flex-col flex-1">
          {matches.map((m, idx) => {
            const lastMsgText = !m.last_msg
              ? "Совпадение! Напиши первым 👋"
              : m.last_msg.startsWith("__AUDIO__") ? "🎤 Голосовое"
              : m.last_msg.startsWith("__STICKER__") ? "🎨 Стикер"
              : m.last_msg.startsWith("__VANISH__") || m.last_msg.match(/\.(jpg|jpeg|png|gif|webp)/i) ? "📷 Фото"
              : m.last_msg === "__REQUEST_PHOTO__" ? "🔐 Запрос фото"
              : m.last_msg === "__GRANT_PHOTO__" ? "🖼️ Доступ к фото"
              : m.last_msg.startsWith("__LOC__") ? "📍 Геолокация"
              : m.last_msg.startsWith("__GIFT__") ? "🎁 Подарок"
              : m.last_msg.startsWith("__VIDEOCIRCLE__") ? "⭕ Видео-кружок"
              : m.last_msg.includes("GEO_DENIED") ? "📍 Геолокация недоступна"
              : m.last_msg.startsWith("__VCALL__missed") ? "📵 Пропущенный звонок"
              : m.last_msg.startsWith("__VCALL__") ? "📹 Видеозвонок"
              : m.last_msg.startsWith("__AWARD__") ? "🏆 Награда"
              : m.last_msg.startsWith("__") ? ""
              : m.last_msg;

            const timeStr = m.last_msg_time
              ? new Date(m.last_msg_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
              : "";

            return (
              <div key={m.match_id}>
                <LongPressToDelete onDelete={() => setConfirmDelete(m)}>
                  <button onClick={() => onChat(m.match_id)}
                    className="w-full flex items-center gap-3.5 px-4 py-3 text-left active:opacity-70 transition-opacity">

                    {/* Аватар */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden">
                        <img src={m.photo_url || FALLBACK_PHOTO} className="w-full h-full object-cover" />
                      </div>
                      {isUserOnline(m.last_seen, m.online) && (
                        <div className="absolute top-0 left-0 w-3.5 h-3.5 rounded-full bg-green-500"
                          style={{ border: "2px solid #000", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
                      )}
                    </div>

                    {/* Текст */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-white truncate ${m.unread_count > 0 ? "font-bold" : "font-semibold"}`} style={{ fontSize: 16 }}>
                          {m.name}{m.age ? `, ${m.age}` : ""}
                        </p>
                        <p className={`truncate mt-0.5 ${m.unread_count > 0 ? "text-white/90" : "text-white/45"}`} style={{ fontSize: 14.5 }}>
                          {lastMsgText}
                        </p>
                      </div>
                      <span className="text-white/35 flex-shrink-0 whitespace-nowrap" style={{ fontSize: 12.5 }}>
                        {timeStr}
                      </span>
                    </div>
                  </button>
                </LongPressToDelete>
                {idx < matches.length - 1 && (
                  <div style={{ marginLeft: "88px", borderBottom: "1px solid rgba(255,255,255,0.08)" }} />
                )}
              </div>
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
export function RealLikesScreen({ onPremium, onOpenChat, onGoToChats }: { onPremium: () => void; onOpenChat?: (matchId: number) => void; onGoToChats?: () => void }) {
  const [likedMe, setLikedMe] = useState<LikedBy[]>([]);
  const [loading, setLoading] = useState(true);
  const [openProfile, setOpenProfile] = useState<Profile | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const loadLikedMe = useCallback((silent?: boolean) => {
    if (!silent) setLoading(true);
    likesApi.getLikedMe()
      .then((d) => setLikedMe(d.liked_me))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadLikedMe(); }, [loadLikedMe]);

  useAppRefresh(() => loadLikedMe(true));

  const handleOpen = useCallback((p: LikedBy) => {
    if (p.blurred) { onPremium(); return; }
    if (openingId) return;
    setOpeningId(p.id);
    postsApi.getUserProfile(p.id)
      .then((d) => setOpenProfile(d.profile))
      .catch(() => {})
      .finally(() => setOpeningId(null));
  }, [onPremium, openingId]);

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Шапка */}
      <div className="px-5 pb-3 flex items-center gap-2.5"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(155,89,182,0.15))", border: "1px solid rgba(255,45,120,0.25)" }}>
          <Icon name="Heart" size={17} className="text-pink-400" />
        </div>
        <div>
          <h2 className="text-white font-golos font-bold text-2xl leading-tight">Ты им понравился</h2>
          <p className="text-white/40 text-sm mt-0.5">{likedMe.length} человек лайкнули тебя</p>
        </div>
      </div>

      {/* Premium-баннер */}
      <div className="mx-5 mb-5 p-5 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.25), rgba(155,89,182,0.25))", border: "1px solid rgba(255,45,120,0.3)" }}>
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,215,0,0.18), transparent 70%)" }} />
        <div className="flex items-start justify-between mb-3 relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-base">Полутон Premium</span>
              <span className="premium-badge">GOLD</span>
            </div>
            <p className="text-white/60 text-sm">Смотри, кто тебя лайкнул — без ограничений</p>
          </div>
          <div className="text-3xl">✨</div>
        </div>
        <button onClick={onPremium} className="btn-grad px-5 py-2.5 text-sm w-full relative">Открыть все лайки</button>
      </div>

      {likedMe.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 px-8 text-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Glow rings */}
            <div className="absolute inset-0 rounded-[28px]"
              style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.16))", border: "1px solid rgba(255,45,120,0.28)", boxShadow: "0 0 36px rgba(255,45,120,0.22)" }} />
            <div className="absolute inset-[-7px] rounded-[32px]" style={{ border: "1px solid rgba(255,45,120,0.1)" }} />
            {/* Pulsing heart glow */}
            <div className="absolute inset-0 rounded-[28px] animate-pulse" style={{ background: "radial-gradient(circle, rgba(255,45,120,0.15), transparent 70%)" }} />
            {/* Icon */}
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
              <defs>
                <linearGradient id="likesGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF2D78"/>
                  <stop offset="100%" stopColor="#9B59B6"/>
                </linearGradient>
              </defs>
              <path d="M12 21s-7.5-4.6-10.2-9.2C.3 8.9 1.4 5.3 4.6 4.1c2-.8 4.2-.2 5.6 1.4l1.8 2 1.8-2c1.4-1.6 3.6-2.2 5.6-1.4 3.2 1.2 4.3 4.8 2.8 7.7C19.5 16.4 12 21 12 21z"
                fill="url(#likesGrad)" opacity="0.18" stroke="url(#likesGrad)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            {/* Sparkle dot */}
            <div className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-pink-500 border-2 border-[#0d0518]" style={{ boxShadow: "0 0 8px #FF2D78" }} />
          </div>
          <div>
            <p className="text-white/70 font-semibold text-base mb-1">Пока никто не лайкнул</p>
            <p className="text-white/35 text-sm leading-relaxed">Заполни профиль и лайкай сам —<br />совпадения не заставят себя ждать!</p>
          </div>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-3 gap-2.5 pb-4">
          {likedMe.map((p) => (
            <button key={p.id} onClick={() => handleOpen(p)}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] transition-all duration-200 active:scale-[0.96] text-left"
              style={{ border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}>
              <img src={p.photo_url || FALLBACK_PHOTO} className="w-full h-full object-cover transition-transform duration-300 group-active:scale-105"
                style={{ filter: p.blurred ? "blur(16px) brightness(0.65)" : "none" }} />

              {/* Затемнение снизу */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)" }} />

              {/* Бейдж лайка */}
              <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: p.is_super ? "rgba(59,130,246,0.95)" : "rgba(255,45,120,0.95)", boxShadow: `0 0 10px ${p.is_super ? "rgba(59,130,246,0.7)" : "rgba(255,45,120,0.7)"}` }}>
                <Icon name={p.is_super ? "Star" : "Heart"} size={11} className="text-white" style={{ fill: "white" }} />
              </div>

              {/* Онлайн-загрузка при клике */}
              {openingId === p.id && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
                  <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}

              {/* Premium-замок для размытых */}
              {p.blurred && openingId !== p.id && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    <Icon name="Lock" size={15} className="text-white" />
                  </div>
                  <span className="text-white/90 text-[10px] font-semibold">Premium</span>
                </div>
              )}

              {/* Имя, возраст, верификация */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="text-white font-semibold text-[13px] leading-tight truncate drop-shadow">{p.name}{p.age ? `, ${p.age}` : ""}</p>
                  {p.verified && <Icon name="BadgeCheck" size={12} className="text-sky-400 flex-shrink-0" style={{ fill: "rgba(56,189,248,0.2)" }} />}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {openProfile && (
        <DiscoverProfileModal
          profile={openProfile}
          onClose={() => setOpenProfile(null)}
          onLike={() => {}}
          onOpenChat={onOpenChat}
          onGoToChats={onGoToChats}
        />
      )}
    </div>
  );
}