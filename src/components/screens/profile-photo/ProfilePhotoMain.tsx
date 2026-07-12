import Icon from "@/components/ui/icon";
import { ProtectedImage } from "@/components/ui/ProtectedImage";
import type { StreakReward } from "@/lib/streakRewards";
import { ProfilePhotoBadges } from "@/components/screens/profile-photo/ProfilePhotoBadges";

interface ProfilePhotoMainProps {
  currentPhoto: string;
  photos: string[];
  photoIdx: number;
  totalPhotos: number;
  liked: boolean;
  burst: boolean;
  profileName: string;
  profileAge?: number;
  profileUsername?: string;
  profileVerified?: boolean;
  profilePremium?: boolean;
  profileBoosted?: boolean;
  streakReward: StreakReward | null;
  photoAnimStyle: React.CSSProperties;
  dragY: number;
  dragPhase: "idle" | "dragging" | "settling";
  containerHeightRef: { current: number };
  onClose: () => void;
  onShowMenu: () => void;
  onPhotoIdx: (updater: (i: number) => number) => void;
  onLike: () => void;
  onOpenChat: () => void;
  onOpenGiftSheet: () => void;
  handleLikeClick: () => void;
  goNext: () => void;
  goPrev: () => void;
  setFullscreen: (v: boolean) => void;
  mainOnTouchStart: (e: React.TouchEvent) => void;
  mainOnTouchMove: (e: React.TouchEvent) => void;
  mainOnTouchEnd: (e: React.TouchEvent) => void;
}

// ─── ProfilePhotoMain ────────────────────────────────────────────────────────
export function ProfilePhotoMain({
  currentPhoto,
  photos,
  photoIdx,
  totalPhotos,
  liked,
  burst,
  profileName,
  profileAge,
  profileUsername,
  profileVerified,
  profilePremium,
  profileBoosted,
  streakReward,
  photoAnimStyle,
  dragY,
  dragPhase,
  containerHeightRef,
  onClose,
  onShowMenu,
  onPhotoIdx,
  onOpenChat,
  onOpenGiftSheet,
  handleLikeClick,
  goNext,
  goPrev,
  setFullscreen,
  mainOnTouchStart,
  mainOnTouchMove,
  mainOnTouchEnd,
}: ProfilePhotoMainProps) {
  return (
    <div className="flex-shrink-0">

      {/* ── Фото (половина экрана) ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "50dvh" }}
        onTouchStart={mainOnTouchStart}
        onTouchMove={mainOnTouchMove}
        onTouchEnd={mainOnTouchEnd}>
        <div key={photoIdx} style={{
          ...photoAnimStyle,
          position: "absolute", inset: 0,
          transform: `translateY(${-dragY}px)`,
          transition: dragPhase === "dragging" ? "none" : "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
        }}>
          {currentPhoto ? (
            <ProtectedImage
              src={currentPhoto}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "cover" }}
              protect
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.35), rgba(155,89,182,0.35))" }}>
              <Icon name="User" size={64} className="text-white/70" />
            </div>
          )}
        </div>
        {/* Соседнее фото — плавно подтягивается снизу/сверху во время свайпа */}
        {dragY !== 0 && (
          (() => {
            const nextIdx = dragY > 0 ? photoIdx + 1 : photoIdx - 1;
            if (nextIdx < 0 || nextIdx >= totalPhotos) return null;
            const offset = dragY > 0 ? containerHeightRef.current - dragY : -containerHeightRef.current - dragY;
            const neighbor = photos[nextIdx] || currentPhoto;
            return (
              <div style={{
                position: "absolute", inset: 0,
                transform: `translateY(${offset}px)`,
                transition: dragPhase === "dragging" ? "none" : "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
              }}>
                {neighbor ? (
                  <ProtectedImage
                    src={neighbor}
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: "cover" }}
                    protect
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.35), rgba(155,89,182,0.35))" }}>
                    <Icon name="User" size={64} className="text-white/70" />
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* Градиент снизу */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(5,0,15,0.7) 0%, transparent 50%)" }} />

        {/* Градиент сверху */}
        <div className="absolute inset-x-0 top-0 h-20 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />

        {/* Полоски-индикаторы */}
        {totalPhotos > 1 && (
          <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3 z-10">
            {Array.from({ length: totalPhotos }).map((_, i) => (
              <button key={i} onClick={() => onPhotoIdx(() => i)}
                className="flex-1 rounded-full transition-all"
                style={{
                  height: 3,
                  background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.35)",
                  transform: i === photoIdx ? "scaleY(1.4)" : "scaleY(1)",
                }} />
            ))}
          </div>
        )}

        {/* Центральная зона: открыть фото на весь экран */}
        <button
          className="absolute left-0 right-0 z-[5] bg-transparent"
          style={{ top: 64, bottom: 130, WebkitTapHighlightColor: "transparent" }}
          onClick={() => setFullscreen(true)}
          aria-label="Открыть фото"
        />

        {/* Узкие зоны листания сверху/снизу */}
        {totalPhotos > 1 && (
          <>
            <button className="absolute left-0 right-0 z-[6] bg-transparent"
              style={{ top: 64, height: "18%", WebkitTapHighlightColor: "transparent" }}
              onClick={goPrev} aria-label="Предыдущее фото" />
            <button className="absolute left-0 right-0 z-[6] bg-transparent"
              style={{ bottom: 130, height: "18%", WebkitTapHighlightColor: "transparent" }}
              onClick={goNext} aria-label="Следующее фото" />
          </>
        )}

        {/* Кнопки шапки */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 z-30"
          style={{ paddingTop: "calc(max(env(safe-area-inset-top, 0px), 28px) + 16px)" }}>
          <button onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <Icon name="ChevronLeft" size={20} className="text-white" />
          </button>
          {profileUsername && (
            <span className="text-white/90 text-sm font-semibold tracking-wide px-2 truncate"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}>
              @{profileUsername}
            </span>
          )}
          <button onClick={onShowMenu}
            className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <Icon name="MoreVertical" size={17} className="text-white/80" />
          </button>
        </div>

        {/* Нижний блок внутри фото: имя + онлайн + кнопки */}
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4">

          {/* Имя и бейджи */}
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-white font-bold leading-tight drop-shadow" style={{ fontSize: 22 }}>
              {profileName}{profileAge ? `, ${profileAge}` : ""}
            </h2>
            <ProfilePhotoBadges
              profileVerified={profileVerified}
              profilePremium={profilePremium}
              profileBoosted={profileBoosted}
              streakReward={streakReward}
            />
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center gap-2.5">

            {/* Лайк */}
            <button onClick={handleLikeClick} disabled={liked}
              className="relative rounded-full flex items-center justify-center overflow-visible transition-all active:scale-90 flex-shrink-0"
              style={{
                width: 50, height: 50,
                background: liked ? "linear-gradient(135deg,#FF2D78,#FF6B6B)" : "rgba(0,0,0,0.4)",
                border: liked ? "none" : "1.5px solid rgba(255,45,120,0.5)",
                boxShadow: liked ? "0 6px 20px rgba(255,45,120,0.5)" : "none",
                backdropFilter: "blur(10px)",
                transform: burst ? "scale(1.22)" : "scale(1)",
              }}>
              <Icon name="Heart" size={20}
                style={{
                  color: liked ? "white" : "#FF2D78",
                  fill: liked ? "white" : "transparent",
                  transform: burst ? "scale(1.35)" : "scale(1)",
                  transition: "transform 0.25s cubic-bezier(.36,.07,.19,.97)",
                }} />
              {burst && [0, 60, 120, 180, 240, 300].map((deg) => (
                <span key={deg} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                  style={{
                    background: deg % 120 === 0 ? "#FF2D78" : "#FFB3CC",
                    top: "50%", left: "50%",
                    transform: `rotate(${deg}deg) translateY(-20px) translate(-50%,-50%)`,
                    animation: "heartParticle 0.6s ease-out forwards",
                  }} />
              ))}
            </button>

            {/* Написать */}
            <button onClick={onOpenChat}
              className="flex-1 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{
                height: 50,
                background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                boxShadow: "0 4px 16px rgba(255,45,120,0.4)",
              }}>
              <Icon name="MessageCircle" size={17} className="text-white" />
              <span className="text-white font-semibold text-sm">Написать</span>
            </button>

            {/* Подарок */}
            <button onClick={onOpenGiftSheet}
              className="rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
              style={{
                width: 50, height: 50,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
                border: "1.5px solid rgba(255,255,255,0.15)",
              }}>
              <span style={{ fontSize: 20 }}>🎁</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}