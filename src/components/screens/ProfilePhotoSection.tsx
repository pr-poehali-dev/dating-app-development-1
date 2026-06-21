import Icon from "@/components/ui/icon";
import { useState } from "react";
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

  const handleLikeClick = () => {
    if (liked) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    onLike();
  };

  const goNext = () => {
    if (photoIdx < totalPhotos - 1) onPhotoIdx(i => i + 1);
  };
  const goPrev = () => {
    if (photoIdx > 0) onPhotoIdx(i => i - 1);
  };

  return (
    <div className="relative w-full flex-shrink-0" style={{ height: "100dvh" }}>

      {/* Фото на весь экран */}
      <ProtectedImage
        src={currentPhoto}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover" }}
        protect
      />

      {/* Градиент снизу — для читаемости текста */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(5,0,15,0.92) 0%, rgba(5,0,15,0.4) 38%, transparent 62%)" }} />

      {/* Градиент сверху — для кнопок навигации */}
      <div className="absolute inset-x-0 top-0 h-28 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)" }} />

      {/* Индикаторы фото (вертикальные черточки) */}
      {totalPhotos > 1 && (
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3 z-10">
          {Array.from({ length: totalPhotos }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPhotoIdx(() => i)}
              className="flex-1 rounded-full transition-all"
              style={{
                height: 3,
                background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.35)",
                transform: i === photoIdx ? "scaleY(1.4)" : "scaleY(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* Кнопки шапки */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 z-10"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 48px)" }}>
        <button onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <Icon name="ChevronLeft" size={22} className="text-white" />
        </button>
        <button onClick={onShowMenu}
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <Icon name="MoreVertical" size={18} className="text-white/80" />
        </button>
      </div>

      {/* Зоны тапа: левая половина → пред. фото, правая → след. фото */}
      {totalPhotos > 1 && (
        <>
          <button className="absolute left-0 top-0 w-1/2 h-full z-10 bg-transparent" onClick={goPrev} style={{ WebkitTapHighlightColor: "transparent" }} />
          <button className="absolute right-0 top-0 w-1/2 h-full z-10 bg-transparent" onClick={goNext} style={{ WebkitTapHighlightColor: "transparent" }} />
        </>
      )}

      {/* Онлайн-индикатор */}
      {profileOnline && (
        <div className="absolute z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            top: "calc(env(safe-area-inset-top) + 48px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(74,222,128,0.4)",
          }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-[11px] font-semibold">онлайн</span>
        </div>
      )}

      {/* Нижний блок: имя + кнопки */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-6 px-5"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>

        {/* Имя и бейджи */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-white font-bold leading-tight"
              style={{ fontSize: 28, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              {profileName}{profileAge ? `, ${profileAge}` : ""}
            </h2>
            {profileVerified && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(59,130,246,0.25)", border: "1px solid rgba(59,130,246,0.4)" }}>
                <Icon name="BadgeCheck" size={15} className="text-blue-400" />
              </div>
            )}
            {profilePremium && (
              <span className="relative overflow-hidden text-[10px] px-2.5 py-0.5 rounded-full font-black leading-none tracking-wide select-none"
                style={{
                  background: "linear-gradient(120deg,#B8860B,#FFD700,#FFF0A0,#FFD700,#B8860B)",
                  backgroundSize: "200% 100%",
                  color: "#1a1000",
                  boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                  animation: "goldShimmer 2.5s linear infinite",
                }}>
                ✦ PREMIUM
              </span>
            )}
          </div>
          {profileUsername && (
            <p className="text-white/45 text-xs font-mono">@{profileUsername}</p>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-3">

          {/* Лайк */}
          <button onClick={handleLikeClick} disabled={liked}
            className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-visible transition-all active:scale-90 flex-shrink-0"
            style={{
              background: liked ? "linear-gradient(135deg,#FF2D78,#FF6B6B)" : "rgba(255,255,255,0.12)",
              border: liked ? "none" : "1.5px solid rgba(255,45,120,0.5)",
              boxShadow: liked ? "0 6px 24px rgba(255,45,120,0.55)" : "0 4px 16px rgba(255,45,120,0.2)",
              backdropFilter: "blur(10px)",
              transform: burst ? "scale(1.22)" : "scale(1)",
            }}>
            <Icon name="Heart" size={22}
              style={{
                color: liked ? "white" : "#FF2D78",
                fill: liked ? "white" : "transparent",
                transition: "transform 0.25s cubic-bezier(.36,.07,.19,.97)",
                transform: burst ? "scale(1.35)" : "scale(1)",
              }} />
            {burst && [0, 60, 120, 180, 240, 300].map((deg) => (
              <span key={deg} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                style={{
                  background: deg % 120 === 0 ? "#FF2D78" : "#FFB3CC",
                  top: "50%", left: "50%",
                  transform: `rotate(${deg}deg) translateY(-22px) translate(-50%,-50%)`,
                  animation: "heartParticle 0.6s ease-out forwards",
                }} />
            ))}
          </button>

          {/* Сообщение — растянутая кнопка */}
          <button onClick={onOpenChat}
            className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(12px)",
            }}>
            <Icon name="MessageCircle" size={20} className="text-white" />
            <span className="text-white font-semibold text-sm">Написать</span>
          </button>

          {/* Подарок */}
          <button onClick={onOpenGiftSheet}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(12px)",
            }}>
            <span style={{ fontSize: 22 }}>🎁</span>
          </button>
        </div>

        {/* Свайп вниз — подсказка, если есть фото выше/ниже */}
        {totalPhotos > 1 && !loadingPhotos && (
          <div className="flex justify-center mt-3 gap-2">
            {photoIdx > 0 && (
              <button onClick={goPrev} className="flex items-center gap-1 text-white/40 text-xs active:text-white/70">
                <Icon name="ChevronUp" size={13} />
                <span>пред. фото</span>
              </button>
            )}
            {photoIdx < totalPhotos - 1 && (
              <button onClick={goNext} className="flex items-center gap-1 text-white/40 text-xs active:text-white/70">
                <span>след. фото</span>
                <Icon name="ChevronDown" size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}