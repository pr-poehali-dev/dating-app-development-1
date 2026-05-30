import Icon from "@/components/ui/icon";
import { useState } from "react";

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
  onClose: () => void;
  onShowMenu: () => void;
  onPhotoIdx: (updater: (i: number) => number) => void;
  onLike: () => void;
  onOpenChat: () => void;
  onOpenGiftSheet: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
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
  coverUrl,
  onClose,
  onShowMenu,
  onPhotoIdx,
  onLike,
  onOpenChat,
  onOpenGiftSheet,
  onTouchStart,
  onTouchEnd,
}: ProfilePhotoSectionProps) {
  const [burst, setBurst] = useState(false);

  const handleLikeClick = () => {
    if (liked) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    onLike();
  };

  return (
    <div className="flex-shrink-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── Обложка ── */}
      <div className="relative w-full" style={{ marginBottom: 52 }}>
        <div className="w-full overflow-hidden relative" style={{ height: 150 }}>
          {coverUrl ? (
            <img src={coverUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full"
              style={{ background: "linear-gradient(135deg, #2d0050 0%, #1a0030 50%, #3d0060 100%)" }} />
          )}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(10,6,20,0.55) 100%)" }} />

          {/* Кнопки навигации */}
          <button onClick={onClose}
            className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-full z-10"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <Icon name="ChevronLeft" size={20} className="text-white" />
          </button>
          <button onClick={onShowMenu}
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full z-10"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <Icon name="MoreVertical" size={18} className="text-white/80" />
          </button>
        </div>

        {/* ── Аватар ── */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -48 }}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full"
              style={{
                padding: 3,
                background: profilePremium
                  ? "linear-gradient(135deg,#FF2D78,#FFD700,#9B59B6)"
                  : "linear-gradient(135deg,#FF2D78,#9B59B6)",
                boxShadow: "0 4px 20px rgba(255,45,120,0.45)",
              }}>
              <div className="w-full h-full rounded-full overflow-hidden bg-[var(--spark-dark)]">
                <img src={currentPhoto} className="w-full h-full object-cover" />
              </div>
            </div>
            {profileOnline && (
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center"
                style={{ border: "2px solid var(--spark-dark)", boxShadow: "0 0 8px #4ADE80" }}>
                <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Имя и бейджи ── */}
      <div className="flex flex-col items-center gap-1 px-5 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-xl leading-tight">
            {profileName}{profileAge ? `, ${profileAge}` : ""}
          </h3>
          {profileVerified && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.2)" }}>
              <Icon name="BadgeCheck" size={14} className="text-blue-400" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profileUsername && (
            <span className="text-white/35 text-xs font-mono">@{profileUsername}</span>
          )}
          {profilePremium && (
            <span className="relative overflow-hidden text-[10px] px-2.5 py-0.5 rounded-full font-black leading-none tracking-wide select-none"
              style={{
                background: "linear-gradient(120deg,#B8860B,#FFD700,#FFF0A0,#FFD700,#B8860B)",
                backgroundSize: "200% 100%",
                color: "#1a1000",
                boxShadow: "0 0 8px rgba(255,215,0,0.6), 0 0 2px rgba(255,215,0,0.9)",
                animation: "goldShimmer 2.5s linear infinite",
                border: "1px solid rgba(255,215,0,0.5)",
              }}>
              ✦ PREMIUM
            </span>
          )}
        </div>

        {/* Фото-индикаторы */}
        {totalPhotos > 1 && (
          <div className="flex gap-1.5 mt-1">
            {photos.map((_, i) => (
              <button key={i} onClick={() => onPhotoIdx(() => i)}
                className="h-1 rounded-full transition-all"
                style={{
                  background: i === photoIdx ? "#FF2D78" : "rgba(255,255,255,0.25)",
                  width: i === photoIdx ? 20 : 6,
                }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Кнопки действий ── */}
      <div className="flex items-center justify-center gap-4 px-5 pb-4">
        {/* Лайк */}
        <button onClick={handleLikeClick} disabled={liked}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-visible transition-all active:scale-90"
          style={{
            background: liked ? "linear-gradient(135deg,#FF2D78,#FF6B6B)" : "rgba(255,255,255,0.08)",
            border: liked ? "none" : "1.5px solid rgba(255,45,120,0.45)",
            boxShadow: liked ? "0 6px 24px rgba(255,45,120,0.55)" : "0 4px 16px rgba(255,45,120,0.2)",
            transform: burst ? "scale(1.22)" : "scale(1)",
          }}>
          <Icon name="Heart" size={22}
            style={{
              color: liked ? "white" : "#FF2D78",
              fill: liked ? "white" : "transparent",
              transition: "transform 0.25s cubic-bezier(.36,.07,.19,.97)",
              transform: burst ? "scale(1.35)" : "scale(1)",
            }} />
          {burst && [0,60,120,180,240,300].map((deg) => (
            <span key={deg} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
              style={{
                background: deg % 120 === 0 ? "#FF2D78" : "#FFB3CC",
                top: "50%", left: "50%",
                transform: `rotate(${deg}deg) translateY(-22px) translate(-50%,-50%)`,
                animation: "heartParticle 0.6s ease-out forwards",
              }} />
          ))}
        </button>

        {/* Сообщение */}
        <button onClick={onOpenChat}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "linear-gradient(135deg, rgba(99,179,237,0.2), rgba(79,134,247,0.15))",
            border: "1.5px solid rgba(99,179,237,0.4)",
            boxShadow: "0 4px 18px rgba(79,134,247,0.2)",
          }}>
          <Icon name="MessageCircle" size={20} style={{ color: "#93C5FD" }} />
        </button>

        {/* Подарок */}
        <button onClick={onOpenGiftSheet}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "linear-gradient(135deg, rgba(255,215,0,0.18), rgba(255,160,0,0.14))",
            border: "1.5px solid rgba(255,200,0,0.45)",
            boxShadow: "0 4px 18px rgba(255,180,0,0.22)",
          }}>
          <Icon name="Gift" size={20} style={{ color: "#FCD34D" }} />
        </button>
      </div>

    </div>
  );
}
