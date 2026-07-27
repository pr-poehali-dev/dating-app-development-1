import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxScale?: number;
}

interface Point { x: number; y: number; }
interface Pt { clientX: number; clientY: number; }

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
function mid(a: Pt, b: Pt): Point {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

/**
 * Универсальная обёртка для pinch-to-zoom и панорамирования фото.
 * Двумя пальцами — масштаб, одним (в зуме) — двигаем. Двойной тап — вкл/выкл зум.
 * Работает на чистых touch-событиях, без внешних библиотек.
 */
export function PinchZoom({ children, className, style, maxScale = 4 }: Props) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [animating, setAnimating] = useState(false);

  const stateRef = useRef({ scale: 1, tx: 0, ty: 0 });
  stateRef.current = { scale, tx, ty };

  const gesture = useRef({
    mode: "none" as "none" | "pan" | "pinch",
    startDist: 0,
    startScale: 1,
    startTx: 0,
    startTy: 0,
    startX: 0,
    startY: 0,
    lastTap: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Базовые (немасштабированные) размеры фото — rect уже включает текущий scale
  const baseSize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return { w: 0, h: 0, rect: null as DOMRect | null };
    const rect = el.getBoundingClientRect();
    const cur = stateRef.current.scale || 1;
    return { w: rect.width / cur, h: rect.height / cur, rect };
  }, []);

  const clamp = useCallback((s: number, x: number, y: number) => {
    const { w, h } = baseSize();
    if (!w) return { x, y };
    const maxX = (w * (s - 1)) / 2;
    const maxY = (h * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, [baseSize]);

  const reset = useCallback(() => {
    setAnimating(true);
    setScale(1); setTx(0); setTy(0);
    setTimeout(() => setAnimating(false), 220);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (e.touches.length === 2) {
      g.mode = "pinch";
      g.startDist = dist(e.touches[0], e.touches[1]);
      g.startScale = stateRef.current.scale;
      g.startTx = stateRef.current.tx;
      g.startTy = stateRef.current.ty;
    } else if (e.touches.length === 1) {
      // Двойной тап
      const now = Date.now();
      if (now - g.lastTap < 280) {
        g.lastTap = 0;
        if (stateRef.current.scale > 1) reset();
        else { setAnimating(true); setScale(2.5); setTimeout(() => setAnimating(false), 220); }
        g.mode = "none";
        return;
      }
      g.lastTap = now;
      // Пан работает только когда фото увеличено
      if (stateRef.current.scale > 1) {
        g.mode = "pan";
        g.startX = e.touches[0].clientX - stateRef.current.tx;
        g.startY = e.touches[0].clientY - stateRef.current.ty;
      } else {
        g.mode = "none";
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (g.mode === "pinch" && e.touches.length === 2) {
      e.stopPropagation();
      const d = dist(e.touches[0], e.touches[1]);
      const ratio = d / (g.startDist || d);
      const next = Math.max(1, Math.min(maxScale, g.startScale * ratio));
      const el = containerRef.current;
      let nx = g.startTx, ny = g.startTy;
      if (el) {
        const rect = el.getBoundingClientRect();
        const m = mid(e.touches[0], e.touches[1]);
        // Экранное смещение точки между пальцами от центра фото, приведённое
        // к базовым координатам (rect уже учитывает текущий масштаб startScale)
        const cx = (m.x - rect.left - rect.width / 2) / g.startScale;
        const cy = (m.y - rect.top - rect.height / 2) / g.startScale;
        nx = g.startTx - cx * (next / g.startScale - 1);
        ny = g.startTy - cy * (next / g.startScale - 1);
      }
      const c = clamp(next, nx, ny);
      setScale(next); setTx(c.x); setTy(c.y);
    } else if (g.mode === "pan" && e.touches.length === 1) {
      e.stopPropagation();
      const nx = e.touches[0].clientX - g.startX;
      const ny = e.touches[0].clientY - g.startY;
      const c = clamp(stateRef.current.scale, nx, ny);
      setTx(c.x); setTy(c.y);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (e.touches.length === 0) {
      if (stateRef.current.scale <= 1.02) {
        if (stateRef.current.scale !== 1 || stateRef.current.tx !== 0 || stateRef.current.ty !== 0) reset();
      }
      g.mode = "none";
    } else if (e.touches.length === 1 && g.mode === "pinch") {
      // остался один палец после пинча — переходим в пан
      g.mode = "pan";
      g.startX = e.touches[0].clientX - stateRef.current.tx;
      g.startY = e.touches[0].clientY - stateRef.current.ty;
    }
  };

  const zoomed = scale > 1.02;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        touchAction: zoomed ? "none" : "pan-y",
        display: "inline-flex",
        transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
        transition: animating ? "transform 0.22s cubic-bezier(0.22,1,0.36,1)" : "none",
        transformOrigin: "center center",
        ...style,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}

export default PinchZoom;