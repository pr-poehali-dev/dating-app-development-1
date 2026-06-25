import Icon from "@/components/ui/icon";
import { useState, useRef } from "react";
import { ProtectedImage } from "@/components/ui/ProtectedImage";

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
  profileOnline,
  onClose,
  onShowMenu,
  onPhotoIdx,
  onLike,
  onOpenChat,
  onOpenGiftSheet,
}: ProfilePhotoSectionProps) {
  const [burst, setBurst] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartY = useRef(0);

  const handleLikeClick = () => {
    if (liked) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    onLike();
  };

  const goNext = () => { if (photoIdx < totalPhotos - 1) onPhotoIdx(i => i + 1); };
  const goPrev = () => { if (photoIdx > 0) onPhotoIdx(i => i - 1); };

  void loadingPhotos;

  return (
    <>
    {/* Полноэкранный просмотр */}
    {fullscreen && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.96)" }}
        onClick={() => setFullscreen(false)}
        onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => {
          const dy = touchStartY.current - e.changedTouches[0].clientY;
          if (dy > 50 && photoIdx < totalPhotos - 1) onPhotoIdx(i => i + 1);
          else if (dy < -50 && photoIdx > 0) onPhotoIdx(i => i - 1);
        }}>
        <button onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
          <Icon name="X" size={20} className="text-white" />
        </button>
        <ProtectedImage src={currentPhoto} className="w-full max-h-full"
          style={{ objectFit: "contain" }} protect />

        {/* Стрелки листания */}
        {totalPhotos > 1 && photoIdx > 0 && (
          <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
            <Icon name="ChevronLeft" size={22} className="text-white" />
          </button>
        )}
        {totalPhotos > 1 && photoIdx < totalPhotos - 1 && (
          <button onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
            <Icon name="ChevronRight" size={22} className="text-white" />
          </button>
        )}

        {/* Полоски-индикаторы */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex gap-1.5 justify-center px-8">
            {Array.from({ length: totalPhotos }).map((_, i) => (
              <div key={i} className="rounded-full transition-all"
                style={{ height: 3, width: i === photoIdx ? 22 : 7, background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.4)" }} />
            ))}
          </div>
        )}
      </div>
    )}

    <div className="flex-shrink-0">

      {/* ── Фото (половина экрана) ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "50dvh" }}>
        <ProtectedImage
          src={currentPhoto}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover" }}
          protect
        />

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

        {/* Узкие зоны листания по краям */}
        {totalPhotos > 1 && (
          <>
            <button className="absolute left-0 z-[6] bg-transparent"
              style={{ top: 64, bottom: 130, width: "22%", WebkitTapHighlightColor: "transparent" }}
              onClick={goPrev} aria-label="Предыдущее фото" />
            <button className="absolute right-0 z-[6] bg-transparent"
              style={{ top: 64, bottom: 130, width: "22%", WebkitTapHighlightColor: "transparent" }}
              onClick={goNext} aria-label="Следующее фото" />
          </>
        )}

        {/* Кнопки шапки */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-30">
          <button onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <Icon name="ChevronLeft" size={20} className="text-white" />
          </button>
          <button onClick={onShowMenu}
            className="flex items-center justify-center w-9 h-9 rounded-full"
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
            {profileVerified && (
              <div className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#1a78f2,#0ea5e9)", boxShadow: "0 0 0 2px rgba(14,165,233,0.35), 0 2px 6px rgba(14,165,233,0.45)" }}>
                <Icon name="Check" size={11} className="text-white" />
              </div>
            )}
            {profilePremium && (
              <span className="relative inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black leading-none tracking-wider select-none flex-shrink-0 overflow-hidden"
                style={{
                  background: "linear-gradient(120deg,#9A6A06,#FFD700,#FFF6C2,#FFD700,#9A6A06)",
                  backgroundSize: "200% 100%",
                  color: "#3a2700",
                  border: "1px solid rgba(255,236,150,0.85)",
                  boxShadow: "0 2px 10px rgba(255,200,40,0.55), inset 0 1px 1px rgba(255,255,255,0.6)",
                  textShadow: "0 1px 0 rgba(255,255,255,0.35)",
                  animation: "goldShimmer 2.5s linear infinite",
                }}>
                <Icon name="Crown" size={11} style={{ color: "#3a2700" }} />
                PREMIUM
                <span className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(75deg, transparent 35%, rgba(255,255,255,0.85) 50%, transparent 65%)",
                    backgroundSize: "250% 100%",
                    animation: "goldShine 3.2s ease-in-out infinite",
                  }} />
              </span>
            )}

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
    </>
  );
}