import { useEffect, useRef } from "react";

interface Tile {
  sx: number;
  sy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  delay: number;
  rot: number;
  vr: number;
  alpha: number;
}

export function BurnAway({
  src,
  size,
  onDone,
  cols = 18,
  duration = 1400,
}: {
  src: string;
  size: number;
  onDone?: () => void;
  cols?: number;
  duration?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = "anonymous";
    let raf = 0;
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      const step = size / cols;
      const sStep = Math.min(img.width, img.height) / cols;
      const offX = (img.width - sStep * cols) / 2;
      const offY = (img.height - sStep * cols) / 2;

      const tiles: Tile[] = [];
      for (let r = 0; r < cols; r++) {
        for (let c = 0; c < cols; c++) {
          const d = (r / cols) * 0.45 + Math.random() * 0.4;
          tiles.push({
            sx: offX + c * sStep,
            sy: offY + r * sStep,
            x: c * step,
            y: r * step,
            vx: (Math.random() - 0.3) * 26,
            vy: -18 - Math.random() * 42,
            delay: d,
            rot: 0,
            vr: (Math.random() - 0.5) * 2.4,
            alpha: 1,
          });
        }
      }

      const start = performance.now();
      const draw = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        ctx.clearRect(0, 0, size, size);

        for (const tl of tiles) {
          const lt = (t - tl.delay) / (1 - tl.delay);
          if (lt <= 0) {
            ctx.globalAlpha = 1;
            ctx.drawImage(img, tl.sx, tl.sy, sStep, sStep, tl.x, tl.y, step + 0.6, step + 0.6);
            continue;
          }
          if (lt >= 1) continue;

          const a = 1 - lt;
          const dx = tl.vx * lt;
          const dy = tl.vy * lt + 40 * lt * lt;
          ctx.globalAlpha = a;
          ctx.save();
          ctx.translate(tl.x + dx + step / 2, tl.y + dy + step / 2);
          ctx.rotate(tl.vr * lt);
          const sc = 1 - lt * 0.55;
          ctx.drawImage(img, tl.sx, tl.sy, sStep, sStep,
            (-step / 2) * sc, (-step / 2) * sc, (step + 0.6) * sc, (step + 0.6) * sc);
          ctx.restore();
        }
        ctx.globalAlpha = 1;

        if (t < 1) raf = requestAnimationFrame(draw);
        else doneRef.current?.();
      };
      raf = requestAnimationFrame(draw);
    };

    img.onerror = () => doneRef.current?.();
    img.src = src;

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [src, size, cols, duration]);

  return <canvas ref={canvasRef} style={{ width: size, height: size, display: "block" }} />;
}

export default BurnAway;
