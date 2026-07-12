import Icon from "@/components/ui/icon";
import { createPortal } from "react-dom";
import { ProtectedImage } from "@/components/ui/ProtectedImage";

interface ProfilePhotoFullscreenProps {
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  currentPhoto: string;
  photos: string[];
  photoIdx: number;
  totalPhotos: number;
  photoAnimStyle: React.CSSProperties;
  dragYFs: number;
  dragPhaseFs: "idle" | "dragging" | "settling";
  containerHeightRefFs: { current: number };
  goNext: () => void;
  goPrev: () => void;
  fsOnTouchStart: (e: React.TouchEvent) => void;
  fsOnTouchMove: (e: React.TouchEvent) => void;
  fsOnTouchEnd: (e: React.TouchEvent) => void;
}

// ─── ProfilePhotoFullscreen ────────────────────────────────────────────────────
export function ProfilePhotoFullscreen({
  fullscreen,
  setFullscreen,
  currentPhoto,
  photos,
  photoIdx,
  totalPhotos,
  photoAnimStyle,
  dragYFs,
  dragPhaseFs,
  containerHeightRefFs,
  goNext,
  goPrev,
  fsOnTouchStart,
  fsOnTouchMove,
  fsOnTouchEnd,
}: ProfilePhotoFullscreenProps) {
  if (!fullscreen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: "rgba(0,0,0,0.96)", zIndex: 2147483000 }}
      onClick={() => { if (dragPhaseFs === "idle") setFullscreen(false); }}
      onTouchStart={fsOnTouchStart}
      onTouchMove={fsOnTouchMove}
      onTouchEnd={fsOnTouchEnd}>
      <button onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}
        className="absolute right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full"
        style={{ top: "calc(max(env(safe-area-inset-top, 0px), 28px) + 16px)", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
        <Icon name="X" size={20} className="text-white" />
      </button>
      <div key={photoIdx} style={{
        ...photoAnimStyle,
        transform: `translateY(${-dragYFs}px)`,
        transition: dragPhaseFs === "dragging" ? "none" : "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
      }} className="w-full max-h-full flex items-center justify-center">
        {currentPhoto ? (
          <ProtectedImage src={currentPhoto} className="w-full max-h-full"
            style={{ objectFit: "contain" }} protect />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.35), rgba(155,89,182,0.35))" }}>
            <Icon name="User" size={64} className="text-white/70" />
          </div>
        )}
      </div>
      {/* Соседнее фото — плавно подтягивается во время свайпа */}
      {dragYFs !== 0 && (() => {
        const nextIdx = dragYFs > 0 ? photoIdx + 1 : photoIdx - 1;
        if (nextIdx < 0 || nextIdx >= totalPhotos) return null;
        const h = containerHeightRefFs.current;
        const offset = dragYFs > 0 ? h - dragYFs : -h - dragYFs;
        const neighborFs = photos[nextIdx] || currentPhoto;
        return (
          <div className="absolute inset-0 flex items-center justify-center" style={{
            transform: `translateY(${offset}px)`,
            transition: dragPhaseFs === "dragging" ? "none" : "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
          }}>
            {neighborFs ? (
              <ProtectedImage src={neighborFs} className="w-full max-h-full"
                style={{ objectFit: "contain" }} protect />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.35), rgba(155,89,182,0.35))" }}>
                <Icon name="User" size={64} className="text-white/70" />
              </div>
            )}
          </div>
        );
      })()}

      {/* Стрелка вверх */}
      {totalPhotos > 1 && photoIdx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ top: "calc(max(env(safe-area-inset-top, 0px), 28px) + 16px)", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
          <Icon name="ChevronUp" size={22} className="text-white" />
        </button>
      )}
      {/* Стрелка вниз */}
      {totalPhotos > 1 && photoIdx < totalPhotos - 1 && (
        <button onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 56px)", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
          <Icon name="ChevronDown" size={22} className="text-white" />
        </button>
      )}

      {/* Полоски-индикаторы */}
      {totalPhotos > 1 && (
        <div className="absolute left-0 right-0 flex gap-1.5 justify-center px-8"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
          {Array.from({ length: totalPhotos }).map((_, i) => (
            <div key={i} className="rounded-full transition-all"
              style={{ height: 3, width: i === photoIdx ? 22 : 7, background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.4)" }} />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}