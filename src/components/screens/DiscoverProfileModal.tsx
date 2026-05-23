import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { likesApi, profilesApi, notificationsApi, type Profile, type MyGift } from "@/lib/api";
import { ReportModal, ProfileMenuSheet } from "@/components/screens/ReportModal";
import { ProfileGiftSheet, GIFTS, PAY_CREATE_URL } from "@/components/screens/ProfileGiftSheet";
import { ProfileSendMessageSheet } from "@/components/screens/ProfileSendMessageSheet";
import { ProfilePhotoSection } from "@/components/screens/ProfilePhotoSection";
import { ProfileInfoSection } from "@/components/screens/ProfileInfoSection";
import { GiftsGrid } from "@/components/gifts/GiftsGrid";

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
export function DiscoverProfileModal({ profile, profiles, profileIndex, onClose, onLike, onOpenChat, onGoToChats }: {
  profile: Profile; profiles?: Profile[]; profileIndex?: number; onClose: () => void; onLike: (p: Profile) => void; onOpenChat?: (matchId: number) => void; onGoToChats?: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(profileIndex ?? 0);
  const currentProfile = (profiles && profiles[currentIdx]) || profile;
  const [likedSet, setLikedSet] = useState<Set<number>>(new Set());
  const liked = likedSet.has(currentProfile.id);
  const [liking, setLiking] = useState(false);
  const [matchId, setMatchId] = useState<number | null>(null);
  const [swipeAnim, setSwipeAnim] = useState<"idle" | "left" | "right">("idle");
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMsgInput, setShowMsgInput] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [giftSelected, setGiftSelected] = useState<number | null>(null);
  const [giftDone, setGiftDone] = useState<number | null>(null);
  const [giftPaying, setGiftPaying] = useState(false);
  const [showUserGifts, setShowUserGifts] = useState(false);
  const [userGifts, setUserGifts] = useState<MyGift[]>([]);
  const [userGiftsLoading, setUserGiftsLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followersList, setFollowersList] = useState<{ id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean }[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [viewFollowerProfile, setViewFollowerProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoTab, setPhotoTab] = useState<"public" | "private" | "gifts">("public");
  const [privateReqSent, setPrivateReqSent] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [profileData, setProfileData] = useState<{
    bio?: string; tags?: string[]; followers: number; following: number; created_at?: string;
  }>({ followers: 0, following: 0 });

  const mainPhoto = currentProfile.photo_url || PROFILES_FALLBACK[0].photo;

  useEffect(() => {
    setPhotos([]);
    setGalleryPhotos([]);
    setPhotoIdx(0);
    setLoadingPhotos(true);
    setProfileData({ followers: 0, following: 0 });
    setPrivateReqSent(false);
    setPhotoTab("public");
    setMatchId(null);
    import("@/lib/api").then(({ postsApi, profilesApi }) => {
      notificationsApi.trackView(currentProfile.id).catch(() => {});
      const profileReq = postsApi.getUserProfile(currentProfile.id)
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

      const cPhoto = currentProfile.photo_url || PROFILES_FALLBACK[0].photo;
      const galleryReq = profilesApi.getUserProfilePhotos(currentProfile.id)
        .then(r => {
          setGalleryPhotos(r.photos);
          const urls = r.photos.map(p => p.photo_url);
          setPhotos([cPhoto, ...urls].slice(0, 9));
        })
        .catch(() => setPhotos([cPhoto]));

      Promise.all([profileReq, galleryReq]).finally(() => setLoadingPhotos(false));
    });
  }, [currentProfile.id]);

  const currentPhoto = photos.length > 0 ? photos[photoIdx] : mainPhoto;
  const totalPhotos = photos.length || 1;

  const handleLike = async () => {
    if (liked || liking) return;
    setLiking(true);
    try {
      const res = await likesApi.send(currentProfile.id);
      setLikedSet(prev => new Set([...prev, currentProfile.id]));
      if (res.match && res.match_id) {
        setMatchId(res.match_id);
      }
      onLike(currentProfile);
      animateThen("right", () => {
        if (profiles && currentIdx < profiles.length - 1) {
          setCurrentIdx(i => i + 1);
          setMatchId(null);
        }
      });
    } catch (e) { void e; }
    finally { setLiking(false); }
  };

  const animateThen = useCallback((dir: "left" | "right", cb: () => void) => {
    setSwipeAnim(dir);
    setTimeout(() => {
      cb();
      setSwipeAnim("idle");
    }, 280);
  }, []);

  const handleSkip = () => {
    animateThen("left", () => {
      if (profiles && currentIdx < profiles.length - 1) {
        setCurrentIdx(i => i + 1);
        setMatchId(null);
      } else {
        onClose();
      }
    });
  };

  const handleOpenChat = async () => {
    if (matchId && onOpenChat) { onOpenChat(matchId); return; }
    const { matchesApi } = await import("@/lib/api");
    const data = await matchesApi.getAll().catch(() => ({ matches: [] }));
    const m = data.matches.find(x => x.partner_id === currentProfile.id);
    if (m && onOpenChat) { onOpenChat(m.match_id); return; }
    setShowMsgInput(true);
  };

  const handleSendMsg = async () => {
    if (!msgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const { messagesApi } = await import("@/lib/api");
      const res = await messagesApi.sendDirect(currentProfile.id, msgText.trim());
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

  const handlePayGift = async (giftId: number) => {
    const gift = GIFTS.find(g => g.id === giftId);
    if (!gift || giftPaying) return;
    setGiftPaying(true);
    try {
      const senderToken = localStorage.getItem("spark_token") || "";
      const res = await fetch(PAY_CREATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: gift.price,
          description: `Подарок «${gift.name}» для ${currentProfile.name}`,
          return_url: window.location.origin + "/?payment=success",
          metadata: {
            kind: "gift",
            gift_id: String(gift.id),
            gift_name: gift.name,
            gift_emoji: gift.emoji,
            gift_category: gift.category,
            gift_variant: String(gift.variant),
            gift_rarity: gift.rarity,
            recipient_id: String(currentProfile.id),
            sender_token: senderToken,
          },
        }),
      });
      const data = await res.json();
      if (data?.payment_url) {
        setGiftDone(giftId);
        window.open(data.payment_url, "_blank");
      }
    } catch (e) { void e; }
    finally { setGiftPaying(false); }
  };

  const handleOpenFollowers = () => {
    setShowFollowers(true);
    setFollowersLoading(true);
    profilesApi.getUserFollowers(currentProfile.id)
      .then(r => setFollowersList(r.users))
      .catch(() => {})
      .finally(() => setFollowersLoading(false));
  };

  const handleOpenUserGifts = () => {
    setShowUserGifts(true);
    setUserGiftsLoading(true);
    profilesApi.userGifts(currentProfile.id)
      .then(r => setUserGifts(r.gifts))
      .catch(() => setUserGifts([]))
      .finally(() => setUserGiftsLoading(false));
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
      {showReport && <ReportModal userId={currentProfile.id} userName={currentProfile.name} onClose={() => setShowReport(false)} />}
      {showMenu && (
        <ProfileMenuSheet
          profile={currentProfile}
          onClose={() => setShowMenu(false)}
          onReport={() => setShowReport(true)}
        />
      )}

      {showMsgInput && (
        <ProfileSendMessageSheet
          profileName={currentProfile.name}
          profilePhoto={currentProfile.photo_url || ""}
          msgText={msgText}
          sendingMsg={sendingMsg}
          msgSent={msgSent}
          onClose={() => setShowMsgInput(false)}
          onMsgChange={setMsgText}
          onSend={handleSendMsg}
        />
      )}

      <div
        className="absolute inset-0 z-30 flex flex-col"
        style={{
          background: "var(--spark-dark)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease",
          transform: swipeAnim === "left" ? "translateX(-110%)" : swipeAnim === "right" ? "translateX(110%)" : "translateX(0)",
          opacity: swipeAnim === "idle" ? 1 : 0,
        }}
      >
        <ProfilePhotoSection
          currentPhoto={currentPhoto}
          photos={photos}
          photoIdx={photoIdx}
          totalPhotos={totalPhotos}
          loadingPhotos={loadingPhotos}
          liked={liked}
          onClose={onClose}
          onShowMenu={() => setShowMenu(true)}
          onPhotoIdx={setPhotoIdx}
          onLike={handleLike}
          onOpenChat={handleOpenChat}
          onOpenGiftSheet={() => { setShowGiftSheet(true); setGiftSelected(null); setGiftDone(null); }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        <ProfileInfoSection
          currentProfile={currentProfile}
          profileData={profileData}
          photoTab={photoTab}
          loadingPhotos={loadingPhotos}
          galleryPhotos={galleryPhotos}
          privateReqSent={privateReqSent}
          liked={liked}
          liking={liking}
          onPhotoTabChange={setPhotoTab}
          onPrivateReqSent={() => setPrivateReqSent(true)}
          onSkip={handleSkip}
          onLike={handleLike}
          onViewFollowers={handleOpenFollowers}
          onViewGifts={handleOpenUserGifts}
          onOpenGiftSheet={() => { setShowGiftSheet(true); setGiftSelected(null); setGiftDone(null); }}
          userGifts={userGifts}
          userGiftsLoading={userGiftsLoading}
        />
      </div>

      {showFollowers && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowFollowers(false)}>
          <div className="w-full max-w-sm rounded-t-3xl flex flex-col"
            style={{ background: "var(--spark-dark2,#1a1030)", maxHeight: "75dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white font-bold text-base">Подписчики {currentProfile.name}</p>
              <button onClick={() => setShowFollowers(false)} className="text-white/40">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2 pb-8">
              {followersLoading ? (
                <div className="flex justify-center py-10">
                  <Icon name="Loader2" size={28} className="text-white/30 animate-spin" />
                </div>
              ) : followersList.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <Icon name="Users" size={36} className="text-white/15" />
                  <p className="text-white/30 text-sm">Пока нет подписчиков</p>
                </div>
              ) : (
                followersList.map(user => (
                  <button key={user.id}
                    onClick={() => { setViewFollowerProfile(user as Profile); setShowFollowers(false); }}
                    className="flex items-center gap-3 p-2 rounded-2xl w-full text-left transition-all active:scale-95"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="relative flex-shrink-0">
                      <img src={user.photo_url || PROFILES_FALLBACK[0].photo}
                        className="w-12 h-12 rounded-full object-cover"
                        style={{ border: "2px solid rgba(255,45,120,0.3)" }} />
                      {user.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2"
                          style={{ borderColor: "var(--spark-dark2,#1a1030)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-semibold text-sm truncate">
                          {user.name}{user.age ? `, ${user.age}` : ""}
                        </p>
                        {user.verified && <Icon name="BadgeCheck" size={14} className="text-blue-400 flex-shrink-0" />}
                      </div>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-white/25 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewFollowerProfile && (
        <div className="fixed inset-0 z-[70]">
          <DiscoverProfileModal
            profile={viewFollowerProfile}
            onClose={() => setViewFollowerProfile(null)}
            onLike={() => {}}
          />
        </div>
      )}

      {showGiftSheet && (
        <ProfileGiftSheet
          recipientName={currentProfile.name}
          recipientId={currentProfile.id}
          giftSelected={giftSelected}
          giftDone={giftDone}
          giftPaying={giftPaying}
          onClose={() => setShowGiftSheet(false)}
          onSelectGift={setGiftSelected}
          onPayGift={handlePayGift}
        />
      )}

      {showUserGifts && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowUserGifts(false)}>
          <div className="w-full max-w-sm rounded-t-3xl flex flex-col"
            style={{ background: "var(--spark-dark2,#1a1030)", maxHeight: "75dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Gift" size={18} style={{ color: "#FFD700" }} />
                <p className="text-white font-bold text-base">Подарки {currentProfile.name}</p>
              </div>
              <button onClick={() => setShowUserGifts(false)} className="text-white/40">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-4 pb-8">
              <GiftsGrid
                gifts={userGifts}
                loading={userGiftsLoading}
                emptyText={`У ${currentProfile.name} пока нет подарков.\nБудь первым — подари что-нибудь!`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}