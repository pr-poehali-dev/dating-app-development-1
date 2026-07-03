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
  const [animDir, setAnimDir] = useState<"up" | "down" | null>(null);
  const [sliding, setSliding] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  if (photos.length === 0) return null;

  const goTo = (next: number, dir: "up" | "down") => {
    if (sliding || next < 0 || next >= photos.length) return;
    setAnimDir(dir);
    setSliding(true);
    setTimeout(() => {
      onSetIdx(() => next);
      setAnimDir(null);
      setSliding(false);
    }, 280);
  };

  const prev = () => goTo(idx - 1, "down");
  const next = () => goTo(idx + 1, "up");

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
    if (Math.abs(dy) < Math.abs(dx) * 1.2 || Math.abs(dy) < 40) return;
    if (dy < 0) next();
    else prev();
  };

  const slideStyle: React.CSSProperties = animDir === "up"
    ? { animation: "lbSlideUp 0.28s cubic-bezier(0.22,1,0.36,1) forwards" }
    : animDir === "down"
    ? { animation: "lbSlideDown 0.28s cubic-bezier(0.22,1,0.36,1) forwards" }
    : { animation: "lbFadeIn 0.24s cubic-bezier(0.22,1,0.36,1)" };

  return (
    <>
      <style>{`
        @keyframes lbSlideUp {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(-70px); opacity: 0; }
        }
        @keyframes lbSlideDown {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(70px); opacity: 0; }
        }
        @keyframes lbFadeIn {
          from { transform: translateY(0); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
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

        {/* Стрелка вверх */}
        {idx > 0 && (
          <button
            className="absolute top-5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            onClick={e => { e.stopPropagation(); prev(); }}>
            <Icon name="ChevronUp" size={22} className="text-white" />
          </button>
        )}

        {/* Стрелка вниз */}
        {idx < photos.length - 1 && (
          <button
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            onClick={e => { e.stopPropagation(); next(); }}>
            <Icon name="ChevronDown" size={22} className="text-white" />
          </button>
        )}

        {/* Точки-индикаторы */}
        {photos.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); goTo(i, i > idx ? "up" : "down"); }}
                className="rounded-full transition-all duration-300"
                style={{
                  height: i === idx ? 22 : 7,
                  width: 7,
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
          className="absolute top-5 left-5 px-3 py-1 rounded-full text-white/60 text-xs font-semibold"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          {idx + 1} / {photos.length}
        </div>
      </div>
    </>
  );
}