import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { likesApi, type Profile } from "@/lib/api";
import { ReportModal, ProfileMenuSheet } from "@/components/screens/ReportModal";

export const PROFILES_FALLBACK = [
  {
    id: 1,
    name: "Алина",
    age: 24,
    city: "Москва",
    distance: "3 км",
    bio: "Люблю кофе, рассветы и случайные путешествия. Ищу человека, с которым можно потеряться в незнакомом городе ☕",
    tags: ["Путешествия", "Кофе", "Йога", "Кино"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg",
    verified: true,
    online: true,
  },
];

// ─── DiscoverProfileModal ─────────────────────────────────────────────────────
export function DiscoverProfileModal({ profile, onClose, onLike, onOpenChat, onGoToChats }: {
  profile: Profile; onClose: () => void; onLike: (p: Profile) => void; onOpenChat?: (matchId: number) => void; onGoToChats?: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [matchId, setMatchId] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMsgInput, setShowMsgInput] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoTab, setPhotoTab] = useState<"public" | "private">("public");
  const [privateReqSent, setPrivateReqSent] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [profileData, setProfileData] = useState<{
    bio?: string; tags?: string[]; followers: number; following: number; created_at?: string;
  }>({ followers: 0, following: 0 });

  const mainPhoto = profile.photo_url || PROFILES_FALLBACK[0].photo;

  useEffect(() => {
    import("@/lib/api").then(({ postsApi, profilesApi }) => {
      const profileReq = postsApi.getUserProfile(profile.id)
        .then(d => {
          const p = d.profile as typeof d.profile & { followers?: number; following?: number; created_at?: string };
          setProfileData({
            bio: d.profile.bio,
            tags: d.profile.tags as string[],
            followers: p.followers ?? 0,
            following: p.following ?? 0,
            created_at: p.created_at,
          });
        })
        .catch(() => {});

      const galleryReq = profilesApi.getUserProfilePhotos(profile.id)
        .then(r => {
          setGalleryPhotos(r.photos);
          const urls = r.photos.map(p => p.photo_url);
          setPhotos([mainPhoto, ...urls].slice(0, 9));
        })
        .catch(() => setPhotos([mainPhoto]));

      Promise.all([profileReq, galleryReq]).finally(() => setLoadingPhotos(false));
    });
  }, [profile.id]);

  const currentPhoto = photos.length > 0 ? photos[photoIdx] : mainPhoto;
  const totalPhotos = photos.length || 1;

  const handleLike = async () => {
    if (liked || liking) return;
    setLiking(true);
    try {
      const res = await likesApi.send(profile.id);
      setLiked(true);
      if (res.match && res.match_id) {
        setMatchId(res.match_id);
        const { messagesApi } = await import("@/lib/api");
        await messagesApi.send(res.match_id, `❤️ ${profile.name}, ты мне понравилась!`).catch(() => {});
      }
    } catch (e) { void e; }
    finally { setLiking(false); }
    onLike(profile);
  };

  const handleOpenChat = async () => {
    if (matchId && onOpenChat) { onOpenChat(matchId); return; }
    const { matchesApi } = await import("@/lib/api");
    const data = await matchesApi.getAll().catch(() => ({ matches: [] }));
    const m = data.matches.find(x => x.partner_id === profile.id);
    if (m && onOpenChat) { onOpenChat(m.match_id); return; }
    setShowMsgInput(true);
  };

  const handleSendMsg = async () => {
    if (!msgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const { messagesApi } = await import("@/lib/api");
      const res = await messagesApi.sendDirect(profile.id, msgText.trim());
      setMsgSent(true);
      setMsgText("");
      setMatchId(res.match_id);
      setTimeout(() => {
        setShowMsgInput(false);
        if (onOpenChat) onOpenChat(res.match_id);
      }, 800);
    } catch (e) { void e; }
    finally { setSendingMsg(false); }
  };

  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (dy > 40 && photoIdx < totalPhotos - 1) setPhotoIdx(i => i + 1);
    if (dy < -40 && photoIdx > 0) setPhotoIdx(i => i - 1);
  };

  void onGoToChats;

  return (
    <>
      {showReport && <ReportModal userId={profile.id} userName={profile.name} onClose={() => setShowReport(false)} />}
      {showMenu && (
        <ProfileMenuSheet
          profile={profile}
          onClose={() => setShowMenu(false)}
          onReport={() => setShowReport(true)}
        />
      )}

      {showMsgInput && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowMsgInput(false)}>
          <div className="w-full max-w-sm px-4 pb-8 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="rounded-3xl p-5 flex flex-col gap-4"
              style={{ background: "rgba(22,16,32,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center gap-3">
                <img src={profile.photo_url || ""} className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  style={{ border: "2px solid rgba(255,45,120,0.5)" }} />
                <div>
                  <p className="text-white font-semibold text-sm">{profile.name}</p>
                  <p className="text-white/40 text-xs">Первое сообщение</p>
                </div>
              </div>
              {msgSent ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Icon name="Check" size={18} className="text-green-400" />
                  <span className="text-white text-sm font-semibold">Сообщение отправлено!</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendMsg()}
                    placeholder={`Напиши ${profile.name}...`}
                    className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos"
                  />
                  <button onClick={handleSendMsg} disabled={sendingMsg || !msgText.trim()}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                    {sendingMsg
                      ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : <Icon name="Send" size={18} className="text-white" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-30 flex flex-col" style={{ background: "var(--spark-dark)" }}>
        <div className="relative flex-shrink-0" style={{ height: "58%" }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <img src={currentPhoto} className="w-full h-full object-cover transition-opacity duration-300"
            key={currentPhoto} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 45%, var(--spark-dark) 100%)" }} />

          {totalPhotos > 1 && (
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
              {photos.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all flex-1"
                  style={{ background: i === photoIdx ? "white" : "rgba(255,255,255,0.35)", maxWidth: 60 }} />
              ))}
            </div>
          )}

          {photoIdx > 0 && (
            <button onClick={() => setPhotoIdx(i => i - 1)}
              className="absolute left-0 top-0 bottom-0 w-1/3" />
          )}
          {photoIdx < totalPhotos - 1 && (
            <button onClick={() => setPhotoIdx(i => i + 1)}
              className="absolute right-0 top-0 bottom-0 w-1/3" />
          )}

          <button onClick={onClose} className="absolute top-4 left-4 glass-card p-2.5 z-10">
            <Icon name="ChevronLeft" size={20} className="text-white" />
          </button>
          <button onClick={() => setShowMenu(true)} className="absolute top-4 right-4 glass-card p-2.5 z-10">
            <Icon name="MoreVertical" size={20} className="text-white/80" />
          </button>

          <div className="absolute bottom-5 right-4 flex flex-col gap-2.5 z-10">
            <button onClick={handleLike} disabled={liked}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{ background: liked ? "rgba(255,45,120,0.9)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
              <Icon name="Heart" size={22} style={{ color: liked ? "white" : "#FF2D78", fill: liked ? "white" : "transparent" }} />
            </button>
            <button onClick={handleOpenChat}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
              <Icon name="MessageCircle" size={20} className="text-white" />
            </button>
          </div>

          {!loadingPhotos && totalPhotos > 1 && photoIdx < totalPhotos - 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 opacity-60">
              <Icon name="ChevronUp" size={16} className="text-white animate-bounce" />
              <span className="text-white text-[10px]">ещё фото</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-4 flex flex-col gap-0">

          <div className="flex items-start justify-between px-5 pt-3 pb-3">
            <div>
              <h2 className="text-white font-golos font-bold text-2xl flex items-center gap-2">
                {profile.name}{profile.age ? `, ${profile.age}` : ""}
                {profile.verified && <span className="text-blue-400 text-base">✓</span>}
              </h2>
              {profile.city && (
                <p className="text-white/60 text-sm flex items-center gap-1 mt-0.5">
                  <Icon name="MapPin" size={13} />{profile.city}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {profile.online && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ADE80]" />}
              <span className="text-white/50 text-xs">{profile.online ? "онлайн" : ""}</span>
            </div>
          </div>

          <div className="flex gap-2 px-5 pb-3">
            <button onClick={() => setPhotoTab("public")}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={photoTab === "public"
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
              📷 Фото
            </button>
            <button onClick={() => setPhotoTab("private")}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={photoTab === "private"
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
              🔒 Приватное
            </button>
          </div>

          {photoTab === "public" ? (
            <div className="px-5 pb-3">
              {loadingPhotos ? (
                <div className="flex justify-center py-6">
                  <Icon name="Loader2" size={24} className="text-white/30 animate-spin" />
                </div>
              ) : galleryPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {galleryPhotos.map((ph) => (
                    <div key={ph.id} className="aspect-square rounded-xl overflow-hidden">
                      <img src={ph.photo_url} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-xs text-center py-4">Публичных фото нет</p>
              )}
            </div>
          ) : (
            <div className="px-5 pb-3">
              {!privateReqSent ? (
                <div className="glass-card p-5 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,45,120,0.12)" }}>
                    <Icon name="Lock" size={22} className="text-pink-400" />
                  </div>
                  <p className="text-white font-semibold text-sm">Приватные фото закрыты</p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Отправь запрос — {profile.name} решит, открыть ли тебе доступ
                  </p>
                  <button onClick={() => setPrivateReqSent(true)}
                    className="btn-grad px-6 py-2.5 text-sm font-semibold w-full">
                    Запросить доступ
                  </button>
                </div>
              ) : (
                <div className="glass-card p-5 flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(74,222,128,0.12)" }}>
                    <Icon name="Check" size={20} className="text-green-400" />
                  </div>
                  <p className="text-white font-semibold text-sm">Запрос отправлен</p>
                  <p className="text-white/40 text-xs">Ожидаем ответа от {profile.name}</p>
                </div>
              )}
            </div>
          )}

          <div className="px-5 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-white/40 text-xs uppercase tracking-widest mt-3 mb-2">О себе</p>
            {(profileData.bio || profile.bio) ? (
              <p className="text-white/80 text-sm leading-relaxed">
                {profileData.bio || profile.bio}
              </p>
            ) : (
              <p className="text-white/25 text-sm italic">Нет информации</p>
            )}
            {(profileData.tags || (profile.tags as string[]))?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {((profileData.tags || profile.tags) as string[]).map((tag) => (
                  <span key={tag} className="glass-card px-3 py-1 text-white/60 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex gap-4 mt-3">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-white font-bold text-lg">{profileData.followers}</span>
                <span className="text-white/40 text-xs">Подписчики</span>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-white font-bold text-lg">{profileData.following}</span>
                <span className="text-white/40 text-xs">Подписки</span>
              </div>
            </div>
          </div>

          {profileData.created_at && (
            <div className="px-5 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white/25 text-xs mt-3 flex items-center gap-1.5">
                <Icon name="Calendar" size={12} />
                На LoveBloom с {new Date(profileData.created_at).toLocaleDateString("ru", { month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-2 flex gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 glass-card py-3.5 flex items-center justify-center gap-2 text-white/60 font-semibold text-sm">
            <Icon name="X" size={18} />Пропустить
          </button>
          <button onClick={handleLike} disabled={liked}
            className="flex-1 btn-grad py-3.5 flex items-center justify-center gap-2 font-semibold text-sm transition-all"
            style={{ opacity: liked ? 0.7 : 1 }}>
            <Icon name="Heart" size={18} className="text-white" />
            {liked ? "Лайкнуто!" : "Лайкнуть"}
          </button>
        </div>
      </div>
    </>
  );
}
