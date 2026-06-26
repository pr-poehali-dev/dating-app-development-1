import { useEffect, useRef } from "react";

const COLORS = [
  "#FF2D78", "#FF6B35", "#FCD34D", "#34D399",
  "#60A5FA", "#A78BFA", "#F472B6", "#FBBF24",
  "#4ADE80", "#818CF8", "#FB923C", "#38BDF8",
];

const SHAPES = ["rect", "circle", "ribbon", "star"] as const;

interface Particle {
  id: number;
  x: number;       // % от ширины
  y: number;       // % от высоты (100 = низ)
  vx: number;      // px/frame горизонталь
  vy: number;      // px/frame вертикаль (отрицательная = вверх)
  rotation: number;
  rotationSpeed: number;
  color: string;
  shape: typeof SHAPES[number];
  w: number;
  h: number;
  opacity: number;
  born: number;    // timestamp рождения
}

// originX — % от ширины откуда стреляем, spread — угловой разброс в градусах
function makeParticles(count: number, originX: number, spread: number, born: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    // Угол: от 60° до 120° (вверх), плюс разброс
    const baseAngle = 90; // прямо вверх
    const halfSpread = spread / 2;
    const angleDeg = baseAngle - halfSpread + Math.random() * spread;
    const angleRad = (angleDeg * Math.PI) / 180;
    const speed = 28 + Math.random() * 32;

    return {
      id: born * 1000 + i,
      x: originX + (Math.random() - 0.5) * 4,
      y: 102,                               // стартуют чуть ниже экрана
      vx: Math.cos(angleRad) * speed,
      vy: -Math.sin(angleRad) * speed,      // отрицательная = вверх
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 14,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      w: 7 + Math.random() * 9,
      h: 4 + Math.random() * 6,
      opacity: 1,
      born,
    };
  });
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  const spikes = 5;
  const outerR = r;
  const innerR = r * 0.45;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(0, -outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(Math.cos(rot) * outerR, Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(Math.cos(rot) * innerR, Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(0, -outerR);
  ctx.closePath();
  ctx.fill();
}

export function PremiumConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const GRAVITY = 0.55;     // ускорение вниз px/frame²
    const AIR = 0.988;        // сопротивление воздуха
    const FADE_START = 3200;  // ms до начала угасания
    const FADE_DURATION = 1800;

    // Залп 1: два «выстрела» снизу слева и справа
    const t0 = Date.now();
    particlesRef.current = [
      ...makeParticles(55, 28, 70, t0),
      ...makeParticles(55, 72, 70, t0),
    ];

    // Залп 2 через 400ms — центр
    setTimeout(() => {
      const t1 = Date.now();
      particlesRef.current = [
        ...particlesRef.current,
        ...makeParticles(50, 50, 90, t1),
      ];
    }, 400);

    // Залп 3 через 900ms — края снова
    setTimeout(() => {
      const t2 = Date.now();
      particlesRef.current = [
        ...particlesRef.current,
        ...makeParticles(40, 15, 60, t2),
        ...makeParticles(40, 85, 60, t2),
      ];
    }, 900);

    const draw = () => {
      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current
        .map(p => {
          const age = now - p.born;
          const fade = age > FADE_START
            ? Math.max(0, 1 - (age - FADE_START) / FADE_DURATION)
            : 1;

          const newVx = p.vx * AIR;
          const newVy = p.vy * AIR + GRAVITY;
          const newX = p.x + (newVx / canvas.width) * 100;
          const newY = p.y + (newVy / canvas.height) * 100;

          return {
            ...p,
            vx: newVx,
            vy: newVy,
            x: newX,
            y: newY,
            rotation: p.rotation + p.rotationSpeed,
            opacity: fade,
          };
        })
        .filter(p => p.opacity > 0 && p.y < 115);

      for (const p of particlesRef.current) {
        const px = (p.x / 100) * canvas.width;
        const py = (p.y / 100) * canvas.height;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(px, py);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape === "ribbon") {
          ctx.fillRect(-p.w, -p.h / 4, p.w * 2, p.h / 2);
        } else {
          drawStar(ctx, p.w / 2);
        }

        ctx.restore();
      }

      const elapsed = now - t0;
      if (elapsed < 6000 || particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}

export default PremiumConfetti;
