import { useState, useRef, useEffect, useCallback } from "react";
import { likesApi, profilesApi, notificationsApi, type Profile, type MyGift } from "@/lib/api";
import { ReportModal, ProfileMenuSheet } from "@/components/screens/ReportModal";
import { ProfileGiftSheet, GIFTS, PAY_CREATE_URL } from "@/components/screens/ProfileGiftSheet";
import { ProfileSendMessageSheet } from "@/components/screens/ProfileSendMessageSheet";
import { ProfilePhotoSection } from "@/components/screens/ProfilePhotoSection";
import { ProfileInfoSection } from "@/components/screens/ProfileInfoSection";
import { PublicStreakBadge } from "@/components/screens/profile/PublicStreakBadge";
import { DiscoverHeartAnim } from "@/components/screens/profile/DiscoverHeartAnim";
import { DiscoverFollowersSheet } from "@/components/screens/profile/DiscoverFollowersSheet";
import { DiscoverUserGiftsSheet } from "@/components/screens/profile/DiscoverUserGiftsSheet";
import { isUserOnline } from "@/lib/online";
import { useBackHandler } from "@/hooks/backStack";

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
  const [heartAnim, setHeartAnim] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followersList, setFollowersList] = useState<{ id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean }[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [viewFollowerProfile, setViewFollowerProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoTab, setPhotoTab] = useState<"public" | "private" | "gifts" | null>(null);
  const [privateReqSent, setPrivateReqSent] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [profileData, setProfileData] = useState<{
    bio?: string; tags?: string[]; followers: number; following: number; created_at?: string;
  }>({ followers: 0, following: 0 });
  const [profileStreakDays, setProfileStreakDays] = useState(0);

  const mainPhoto = currentProfile.photo_url || "";

  // Кнопка "Назад": закрываем вложенные слои по одному, потом — сам профиль
  useBackHandler(true, () => {
    if (viewFollowerProfile) { setViewFollowerProfile(null); return; }
    if (showReport) { setShowReport(false); return; }
    if (showGiftSheet) { setShowGiftSheet(false); return; }
    if (showUserGifts) { setShowUserGifts(false); return; }
    if (showFollowers) { setShowFollowers(false); return; }
    if (showMsgInput) { setShowMsgInput(false); return; }
    if (showMenu) { setShowMenu(false); return; }
    if (photoTab) { setPhotoTab(null); return; }
    onClose();
  });

  useEffect(() => {
    setPhotos([]);
    setGalleryPhotos([]);
    setPhotoIdx(0);
    setLoadingPhotos(true);
    setProfileData({ followers: 0, following: 0 });
    setProfileStreakDays(0);
    setPrivateReqSent(false);
    setPhotoTab(null);
    setMatchId(null);
    import("@/lib/api").then(({ postsApi, profilesApi, streaksApi }) => {
      streaksApi.getUser(currentProfile.id)
        .then(d => { if (d?.current_streak) setProfileStreakDays(d.current_streak); })
        .catch(() => {});
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

      const cPhoto = currentProfile.photo_url || "";
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
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 1000);
    try {
      const res = await likesApi.send(currentProfile.id);
      setLikedSet(prev => new Set([...prev, currentProfile.id]));
      let mid = matchId;
      if (res.match && res.match_id) {
        mid = res.match_id;
        setMatchId(res.match_id);
      }
      onLike(currentProfile);
      try {
        const { messagesApi, matchesApi } = await import("@/lib/api");
        let resolvedMatchId = mid;
        if (!resolvedMatchId) {
          const data = await matchesApi.getAll().catch(() => ({ matches: [] }));
          const m = data.matches.find((x: { partner_id: number; match_id: number }) => x.partner_id === currentProfile.id);
          if (m) resolvedMatchId = m.match_id;
        }
        if (!resolvedMatchId) {
          const direct = await messagesApi.sendDirect(currentProfile.id, "❤️");
          resolvedMatchId = direct.match_id;
          if (resolvedMatchId) setMatchId(resolvedMatchId);
        } else {
          await messagesApi.send(resolvedMatchId, "❤️");
        }
      } catch (e) { void e; }
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
        className="absolute inset-0 z-30 overflow-y-auto"
        style={{
          background: "var(--spark-dark)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease",
          transform: swipeAnim === "left" ? "translateX(-110%)" : swipeAnim === "right" ? "translateX(110%)" : "translateX(0)",
          opacity: swipeAnim === "idle" ? 1 : 0,
          scrollSnapType: "none",
        }}
      >
        <DiscoverHeartAnim visible={heartAnim} />

        <ProfilePhotoSection
          currentPhoto={currentPhoto}
          photos={photos}
          photoIdx={photoIdx}
          totalPhotos={totalPhotos}
          loadingPhotos={loadingPhotos}
          liked={liked}
          profileName={currentProfile.name}
          profileAge={currentProfile.age}
          profileUsername={currentProfile.username}
          profileVerified={currentProfile.verified}
          profilePremium={currentProfile.premium}
          profileBoosted={currentProfile.boosted}
          profileOnline={isUserOnline(currentProfile.last_seen, currentProfile.online)}
          coverUrl={currentProfile.cover_url}
          profileGender={currentProfile.gender}
          onClose={onClose}
          onShowMenu={() => setShowMenu(true)}
          onPhotoIdx={setPhotoIdx}
          onLike={handleLike}
          onOpenChat={handleOpenChat}
          onOpenGiftSheet={() => { setShowGiftSheet(true); setGiftSelected(null); setGiftDone(null); }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          streakDays={profileStreakDays}
        />

        <ProfileInfoSection
          currentProfile={currentProfile}
          profileData={profileData}
          userId={currentProfile.id}
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

      <DiscoverFollowersSheet
        visible={showFollowers}
        profileName={currentProfile.name}
        loading={followersLoading}
        followers={followersList}
        onClose={() => setShowFollowers(false)}
        onSelectUser={user => setViewFollowerProfile(user)}
      />

      {viewFollowerProfile && (
        <div className="fixed inset-0 z-[70]">
          <DiscoverProfileModal
            profile={viewFollowerProfile}
            onClose={() => setViewFollowerProfile(null)}
            onLike={() => {}}
          />
        </div>
      )}

      {showMsgInput && (
        <ProfileSendMessageSheet
          profileName={currentProfile.name}
          profilePhoto={currentProfile.photo_url || mainPhoto}
          msgText={msgText}
          sendingMsg={sendingMsg}
          msgSent={msgSent}
          onClose={() => { setShowMsgInput(false); setMsgSent(false); setMsgText(""); }}
          onMsgChange={setMsgText}
          onSend={handleSendMsg}
        />
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

      <DiscoverUserGiftsSheet
        visible={showUserGifts}
        profileName={currentProfile.name}
        gifts={userGifts}
        loading={userGiftsLoading}
        onClose={() => setShowUserGifts(false)}
      />
    </>
  );
}