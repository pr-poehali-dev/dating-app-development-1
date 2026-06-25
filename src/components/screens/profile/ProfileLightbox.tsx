import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ProtectedImage } from "@/components/ui/ProtectedImage";

interface ProfileLightboxProps {
  photos: string[];
  idx: number;
  onClose: () => void;
  onSetIdx: (updater: (i: number | null) => number | null) => void;
}

export function ProfileLightbox({ photos, idx, onClose, onSetIdx }: ProfileLightboxProps) {
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const [sliding, setSliding] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  if (photos.length === 0) return null;

  const goTo = (next: number, dir: "left" | "right") => {
    if (sliding || next < 0 || next >= photos.length) return;
    setAnimDir(dir);
    setSliding(true);
    setTimeout(() => {
      onSetIdx(() => next);
      setAnimDir(null);
      setSliding(false);
    }, 260);
  };

  const prev = () => goTo(idx - 1, "right");
  const next = () => goTo(idx + 1, "left");

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < Math.abs(dy) * 1.2 || Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  };

  const slideStyle: React.CSSProperties = animDir === "left"
    ? { animation: "lbSlideLeft 0.26s ease forwards" }
    : animDir === "right"
    ? { animation: "lbSlideRight 0.26s ease forwards" }
    : { animation: "lbFadeIn 0.22s ease" };

  return (
    <>
      <style>{`
        @keyframes lbSlideLeft {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(-60px); opacity: 0; }
        }
        @keyframes lbSlideRight {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(60px); opacity: 0; }
        }
        @keyframes lbFadeIn {
          from { transform: translateX(0); opacity: 0.4; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(24px)" }}
        onClick={onClose}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Фото */}
        <div style={slideStyle} onClick={e => e.stopPropagation()}>
          <ProtectedImage
            src={photos[idx]}
            className="rounded-2xl"
            hideOnBlur={false}
            style={{
              maxHeight: "82dvh",
              maxWidth: "96vw",
              objectFit: "contain",
              boxShadow: "0 16px 60px rgba(0,0,0,0.7)",
            }}
          />
        </div>

        {/* Закрыть */}
        <button
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
          onClick={onClose}>
          <Icon name="X" size={20} className="text-white" />
        </button>

        {/* Стрелка влево */}
        {idx > 0 && (
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            onClick={e => { e.stopPropagation(); prev(); }}>
            <Icon name="ChevronLeft" size={22} className="text-white" />
          </button>
        )}

        {/* Стрелка вправо */}
        {idx < photos.length - 1 && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            onClick={e => { e.stopPropagation(); next(); }}>
            <Icon name="ChevronRight" size={22} className="text-white" />
          </button>
        )}

        {/* Точки-индикаторы */}
        {photos.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); goTo(i, i > idx ? "left" : "right"); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 22 : 7,
                  height: 7,
                  background: i === idx
                    ? "linear-gradient(135deg,#FF2D78,#9B59B6)"
                    : "rgba(255,255,255,0.3)",
                  boxShadow: i === idx ? "0 0 8px rgba(255,45,120,0.6)" : "none",
                }}
              />
            ))}
          </div>
        )}

        {/* Счётчик */}
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white/60 text-xs font-semibold"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          {idx + 1} / {photos.length}
        </div>
      </div>
    </>
  );
}
