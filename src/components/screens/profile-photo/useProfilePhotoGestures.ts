import { useState, useRef, useEffect } from "react";
import { useBackHandler } from "@/hooks/backStack";
import { haptic } from "@/hooks/useNative";

interface UseProfilePhotoGesturesParams {
  photoIdx: number;
  totalPhotos: number;
  liked: boolean;
  onPhotoIdx: (updater: (i: number) => number) => void;
  onLike: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

// ─── useProfilePhotoGestures ──────────────────────────────────────────────────
export function useProfilePhotoGestures({
  photoIdx,
  totalPhotos,
  liked,
  onPhotoIdx,
  onLike,
  onTouchStart,
  onTouchEnd,
}: UseProfilePhotoGesturesParams) {
  const [burst, setBurst] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartY = useRef(0);
  const [animDir, setAnimDir] = useState<"up" | "down" | null>(null);
  const prevIdxRef = useRef(photoIdx);

  // Плавный drag пальцем: сдвигаем фото вслед за жестом, затем доезжаем/возвращаемся
  const [dragY, setDragY] = useState(0);
  const [dragPhase, setDragPhase] = useState<"idle" | "dragging" | "settling">("idle");
  const dragStartY = useRef(0);
  const containerHeightRef = useRef(1);

  const [dragYFs, setDragYFs] = useState(0);
  const [dragPhaseFs, setDragPhaseFs] = useState<"idle" | "dragging" | "settling">("idle");
  const dragStartYFs = useRef(0);
  const containerHeightRefFs = useRef(1);

  useEffect(() => {
    if (photoIdx !== prevIdxRef.current) {
      setAnimDir(photoIdx > prevIdxRef.current ? "up" : "down");
      prevIdxRef.current = photoIdx;
      const t = setTimeout(() => setAnimDir(null), 320);
      return () => clearTimeout(t);
    }
  }, [photoIdx]);

  useBackHandler(fullscreen, () => setFullscreen(false));

  const handleLikeClick = () => {
    if (liked) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    onLike();
  };

  const goNext = () => { if (photoIdx < totalPhotos - 1) onPhotoIdx(i => i + 1); };
  const goPrev = () => { if (photoIdx > 0) onPhotoIdx(i => i - 1); };

  const photoAnimStyle: React.CSSProperties = animDir === "up"
    ? { animation: "ppsSlideUp 0.32s cubic-bezier(0.22,1,0.36,1)" }
    : animDir === "down"
    ? { animation: "ppsSlideDown 0.32s cubic-bezier(0.22,1,0.36,1)" }
    : {};

  const mainOnTouchStart = (e: React.TouchEvent) => {
    if (dragPhase === "settling") return;
    touchStartY.current = e.touches[0].clientY;
    dragStartY.current = e.touches[0].clientY;
    containerHeightRef.current = e.currentTarget.clientHeight || 1;
    setDragPhase("dragging");
    onTouchStart?.(e);
  };

  const mainOnTouchMove = (e: React.TouchEvent) => {
    if (dragPhase !== "dragging") return;
    const rawDy = dragStartY.current - e.touches[0].clientY;
    const atStart = photoIdx === 0 && rawDy < 0;
    const atEnd = photoIdx === totalPhotos - 1 && rawDy > 0;
    const dy = (atStart || atEnd) ? rawDy * 0.35 : rawDy;
    setDragY(dy);
  };

  const mainOnTouchEnd = (e: React.TouchEvent) => {
    if (dragPhase !== "dragging") return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const h = containerHeightRef.current;
    const threshold = h * 0.18;
    const willNext = dy > Math.min(50, threshold) && photoIdx < totalPhotos - 1;
    const willPrev = dy < -Math.min(50, threshold) && photoIdx > 0;
    setDragPhase("settling");
    if (willNext) {
      haptic("selection");
      setDragY(h);
      setTimeout(() => { onPhotoIdx(i => i + 1); setDragY(0); setDragPhase("idle"); }, 300);
    } else if (willPrev) {
      haptic("selection");
      setDragY(-h);
      setTimeout(() => { onPhotoIdx(i => i - 1); setDragY(0); setDragPhase("idle"); }, 300);
    } else {
      setDragY(0);
      setTimeout(() => setDragPhase("idle"), 300);
    }
    onTouchEnd?.(e);
  };

  const fsOnTouchStart = (e: React.TouchEvent) => {
    if (dragPhaseFs === "settling") return;
    touchStartY.current = e.touches[0].clientY;
    dragStartYFs.current = e.touches[0].clientY;
    containerHeightRefFs.current = e.currentTarget.clientHeight || window.innerHeight || 1;
    setDragPhaseFs("dragging");
  };

  const fsOnTouchMove = (e: React.TouchEvent) => {
    if (dragPhaseFs !== "dragging") return;
    const rawDy = dragStartYFs.current - e.touches[0].clientY;
    const atStart = photoIdx === 0 && rawDy < 0;
    const atEnd = photoIdx === totalPhotos - 1 && rawDy > 0;
    setDragYFs((atStart || atEnd) ? rawDy * 0.35 : rawDy);
  };

  const fsOnTouchEnd = (e: React.TouchEvent) => {
    if (dragPhaseFs !== "dragging") return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const h = containerHeightRefFs.current;
    const threshold = h * 0.15;
    const willNext = dy > Math.min(50, threshold) && photoIdx < totalPhotos - 1;
    const willPrev = dy < -Math.min(50, threshold) && photoIdx > 0;
    setDragPhaseFs("settling");
    if (willNext) {
      haptic("selection");
      setDragYFs(h);
      setTimeout(() => { onPhotoIdx(i => i + 1); setDragYFs(0); setDragPhaseFs("idle"); }, 300);
    } else if (willPrev) {
      haptic("selection");
      setDragYFs(-h);
      setTimeout(() => { onPhotoIdx(i => i - 1); setDragYFs(0); setDragPhaseFs("idle"); }, 300);
    } else {
      setDragYFs(0);
      setTimeout(() => setDragPhaseFs("idle"), 300);
    }
  };

  return {
    burst,
    fullscreen, setFullscreen,
    dragY, dragPhase,
    dragYFs, dragPhaseFs,
    containerHeightRef, containerHeightRefFs,
    photoAnimStyle,
    handleLikeClick,
    goNext, goPrev,
    mainOnTouchStart, mainOnTouchMove, mainOnTouchEnd,
    fsOnTouchStart, fsOnTouchMove, fsOnTouchEnd,
  };
}
