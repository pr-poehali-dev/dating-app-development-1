import Icon from "@/components/ui/icon";
import { ProtectedImage } from "@/components/ui/ProtectedImage";

interface ProfileLightboxProps {
  photos: string[];
  idx: number;
  onClose: () => void;
  onSetIdx: (updater: (i: number | null) => number | null) => void;
}

export function ProfileLightbox({ photos, idx, onClose, onSetIdx }: ProfileLightboxProps) {
  if (photos.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.96)", backdropFilter: "blur(20px)" }}
      onClick={onClose}>

      {/* Фото */}
      <ProtectedImage
        src={photos[idx]}
        className="rounded-xl"
        hideOnBlur={false}
        style={{ maxHeight: "90dvh", maxWidth: "95vw", objectFit: "contain" }}
        onClick={e => e.stopPropagation()}
      />

      {/* Закрыть */}
      <button
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
        onClick={onClose}>
        <Icon name="X" size={20} className="text-white" />
      </button>

      {/* Стрелка влево */}
      {idx > 0 && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
          onClick={e => { e.stopPropagation(); onSetIdx(i => Math.max(0, (i ?? 1) - 1)); }}>
          <Icon name="ChevronLeft" size={22} className="text-white" />
        </button>
      )}

      {/* Стрелка вправо */}
      {idx < photos.length - 1 && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
          onClick={e => { e.stopPropagation(); onSetIdx(i => Math.min(photos.length - 1, (i ?? 0) + 1)); }}>
          <Icon name="ChevronRight" size={22} className="text-white" />
        </button>
      )}

      {/* Точки */}
      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); onSetIdx(() => i); }}
              className="rounded-full transition-all"
              style={{
                width: i === idx ? 20 : 7,
                height: 7,
                background: i === idx ? "#FF2D78" : "rgba(255,255,255,0.35)",
              }} />
          ))}
        </div>
      )}

      {/* Счётчик */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white/60 text-xs"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        {idx + 1} / {photos.length}
      </div>
    </div>
  );
}