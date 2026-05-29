import { useEffect, useRef } from "react";

// Генерируем частицы конфетти как в Telegram
const COLORS = [
  "#FF2D78", "#FF6B35", "#FCD34D", "#34D399",
  "#60A5FA", "#A78BFA", "#F472B6", "#FBBF24",
  "#4ADE80", "#818CF8", "#FB923C", "#38BDF8",
];

const SHAPES = ["rect", "circle", "ribbon"] as const;

interface Particle {
  id: number;
  x: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  shape: typeof SHAPES[number];
  size: number;
  opacity: number;
  y: number;
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,        // % от ширины экрана
    y: -10 - Math.random() * 20,        // стартуют чуть выше экрана
    vx: (Math.random() - 0.5) * 4,     // горизонтальная скорость
    vy: 2 + Math.random() * 5,          // вертикальная скорость (вниз)
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 6 + Math.random() * 10,
    opacity: 1,
  }));
}

export function PremiumConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

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

    // Два залпа: сразу и через 600ms
    particlesRef.current = makeParticles(80);
    setTimeout(() => {
      particlesRef.current = [...particlesRef.current, ...makeParticles(60)];
    }, 600);

    const draw = () => {
      const elapsed = Date.now() - startTimeRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current
        .map(p => {
          const newVy = p.vy + 0.12;          // гравитация
          const newVx = p.vx * 0.995;         // затухание по X
          const newY  = p.y + newVy;
          const newX  = p.x + newVx / canvas.width * 100;
          const newRot = p.rotation + p.rotationSpeed;
          // fade out после 3 сек
          const fade = elapsed > 3000 ? Math.max(0, 1 - (elapsed - 3000) / 1500) : 1;
          return { ...p, y: newY, x: newX, vy: newVy, vx: newVx, rotation: newRot, opacity: fade };
        })
        .filter(p => p.y < 110 && p.opacity > 0);  // убираем за экраном

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
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          // ribbon — длинная полоска
          ctx.fillRect(-p.size, -p.size / 6, p.size * 2, p.size / 3);
        }

        ctx.restore();
      }

      if (elapsed < 5000 || particlesRef.current.length > 0) {
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
