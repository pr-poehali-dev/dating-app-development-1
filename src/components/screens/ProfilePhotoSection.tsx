import Icon from "@/components/ui/icon";
import { useState } from "react";

interface ProfilePhotoSectionProps {
  currentPhoto: string;
  photos: string[];
  photoIdx: number;
  totalPhotos: number;
  loadingPhotos: boolean;
  liked: boolean;
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
    <div className="relative flex-shrink-0" style={{ height: "58%" }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
        <button onClick={() => onPhotoIdx(i => i - 1)}
          className="absolute left-0 top-0 bottom-0 w-1/3" />
      )}
      {photoIdx < totalPhotos - 1 && (
        <button onClick={() => onPhotoIdx(i => i + 1)}
          className="absolute right-0 top-0 bottom-0 w-1/3" />
      )}

      <button onClick={onClose} className="absolute top-4 left-4 glass-card p-2.5 z-10">
        <Icon name="ChevronLeft" size={20} className="text-white" />
      </button>
      <button onClick={onShowMenu} className="absolute top-4 right-4 glass-card p-2.5 z-10">
        <Icon name="MoreVertical" size={20} className="text-white/80" />
      </button>

      <div className="absolute bottom-5 right-4 flex flex-col gap-2.5 z-10">
        {/* Кнопка лайка с анимацией */}
        <button onClick={handleLikeClick} disabled={liked}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-visible"
          style={{
            background: liked ? "linear-gradient(135deg,#FF2D78,#FF6B6B)" : "rgba(255,255,255,0.13)",
            backdropFilter: "blur(14px)",
            border: liked ? "none" : "1.5px solid rgba(255,45,120,0.45)",
            boxShadow: liked
              ? "0 6px 24px rgba(255,45,120,0.55), inset 0 1px 0 rgba(255,255,255,0.25)"
              : "0 4px 16px rgba(255,45,120,0.2)",
            transition: "all 0.25s ease",
            transform: burst ? "scale(1.22)" : "scale(1)",
          }}>
          <Icon name="Heart" size={24}
            style={{
              color: liked ? "white" : "#FF2D78",
              fill: liked ? "white" : "transparent",
              transition: "transform 0.25s cubic-bezier(.36,.07,.19,.97), fill 0.2s",
              transform: burst ? "scale(1.35)" : "scale(1)",
              filter: burst ? "drop-shadow(0 0 8px rgba(255,45,120,0.9))" : "none",
            }} />
          {/* Частицы при нажатии */}
          {burst && [0,60,120,180,240,300].map((deg) => (
            <span key={deg} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
              style={{
                background: deg % 120 === 0 ? "#FF2D78" : deg % 60 === 0 ? "#FF6B6B" : "#FFB3CC",
                top: "50%", left: "50%",
                transform: `rotate(${deg}deg) translateY(-22px) translate(-50%,-50%)`,
                animation: "heartParticle 0.6s ease-out forwards",
              }} />
          ))}
        </button>
        <button onClick={onOpenChat}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
          <Icon name="MessageCircle" size={20} className="text-white" />
        </button>
        <button onClick={onOpenGiftSheet}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{ background: "rgba(255,200,0,0.2)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,200,0,0.4)" }}>
          <Icon name="Gift" size={20} style={{ color: "#FFD700" }} />
        </button>
      </div>

      {!loadingPhotos && totalPhotos > 1 && photoIdx < totalPhotos - 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 opacity-60">
          <Icon name="ChevronUp" size={16} className="text-white animate-bounce" />
          <span className="text-white text-[10px]">ещё фото</span>
        </div>
      )}
    </div>
  );
}