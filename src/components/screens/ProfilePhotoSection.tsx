import { getStreakReward } from "@/lib/streakRewards";
import { useProfilePhotoGestures } from "@/components/screens/profile-photo/useProfilePhotoGestures";
import { ProfilePhotoFullscreen } from "@/components/screens/profile-photo/ProfilePhotoFullscreen";
import { ProfilePhotoMain } from "@/components/screens/profile-photo/ProfilePhotoMain";

interface ProfilePhotoSectionProps {
  currentPhoto: string;
  photos: string[];
  photoIdx: number;
  totalPhotos: number;
  loadingPhotos: boolean;
  liked: boolean;
  profileName: string;
  profileAge?: number;
  profileUsername?: string;
  profileVerified?: boolean;
  profilePremium?: boolean;
  profileBoosted?: boolean;
  profileOnline?: boolean;
  coverUrl?: string;
  profileGender?: string;
  onClose: () => void;
  onShowMenu: () => void;
  onPhotoIdx: (updater: (i: number) => number) => void;
  onLike: () => void;
  onOpenChat: () => void;
  onOpenGiftSheet: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  streakDays?: number;
}

export function ProfilePhotoSection({
  currentPhoto,
  photos,
  photoIdx,
  totalPhotos,
  loadingPhotos,
  liked,
  profileName,
  profileAge,
  profileUsername,
  profileVerified,
  profilePremium,
  profileBoosted,
  profileOnline,
  onClose,
  onShowMenu,
  onPhotoIdx,
  onLike,
  onOpenChat,
  onOpenGiftSheet,
  onTouchStart,
  onTouchEnd,
  streakDays = 0,
}: ProfilePhotoSectionProps) {
  const streakReward = getStreakReward(streakDays);

  const {
    burst,
    fullscreen, setFullscreen,
    dragY, dragPhase,
    dragYFs, dragPhaseFs,
    containerHeightRef, containerHeightRefFs,
    photoAnimStyle,
    handleLikeClick,
    goNext, goPrev,
    mainOnTouchStart, mainOnTouchMove, mainOnTouchEnd,
    fsOnTouchStart, fsOnTouchMove, fsOnTouchEnd,
  } = useProfilePhotoGestures({
    photoIdx,
    totalPhotos,
    liked,
    onPhotoIdx,
    onLike,
    onTouchStart,
    onTouchEnd,
  });

  void loadingPhotos;
  void profileOnline;

  return (
    <>
    {/* Полноэкранный просмотр — через портал в body, чтобы перекрыть таб-бар */}
    <ProfilePhotoFullscreen
      fullscreen={fullscreen}
      setFullscreen={setFullscreen}
      currentPhoto={currentPhoto}
      photos={photos}
      photoIdx={photoIdx}
      totalPhotos={totalPhotos}
      photoAnimStyle={photoAnimStyle}
      dragYFs={dragYFs}
      dragPhaseFs={dragPhaseFs}
      containerHeightRefFs={containerHeightRefFs}
      goNext={goNext}
      goPrev={goPrev}
      fsOnTouchStart={fsOnTouchStart}
      fsOnTouchMove={fsOnTouchMove}
      fsOnTouchEnd={fsOnTouchEnd}
    />

    <style>{`
      @keyframes ppsSlideUp {
        from { transform: translateY(28px); opacity: 0.3; }
        to   { transform: translateY(0); opacity: 1; }
      }
      @keyframes ppsSlideDown {
        from { transform: translateY(-28px); opacity: 0.3; }
        to   { transform: translateY(0); opacity: 1; }
      }
    `}</style>

    <ProfilePhotoMain
      currentPhoto={currentPhoto}
      photos={photos}
      photoIdx={photoIdx}
      totalPhotos={totalPhotos}
      liked={liked}
      burst={burst}
      profileName={profileName}
      profileAge={profileAge}
      profileUsername={profileUsername}
      profileVerified={profileVerified}
      profilePremium={profilePremium}
      profileBoosted={profileBoosted}
      streakReward={streakReward}
      photoAnimStyle={photoAnimStyle}
      dragY={dragY}
      dragPhase={dragPhase}
      containerHeightRef={containerHeightRef}
      onClose={onClose}
      onShowMenu={onShowMenu}
      onPhotoIdx={onPhotoIdx}
      onLike={onLike}
      onOpenChat={onOpenChat}
      onOpenGiftSheet={onOpenGiftSheet}
      handleLikeClick={handleLikeClick}
      goNext={goNext}
      goPrev={goPrev}
      setFullscreen={setFullscreen}
      mainOnTouchStart={mainOnTouchStart}
      mainOnTouchMove={mainOnTouchMove}
      mainOnTouchEnd={mainOnTouchEnd}
    />
    </>
  );
}
