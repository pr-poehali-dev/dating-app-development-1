import Icon from "@/components/ui/icon";

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
        <button onClick={onLike} disabled={liked}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{ background: liked ? "rgba(255,45,120,0.9)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
          <Icon name="Heart" size={22} style={{ color: liked ? "white" : "#FF2D78", fill: liked ? "white" : "transparent" }} />
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
