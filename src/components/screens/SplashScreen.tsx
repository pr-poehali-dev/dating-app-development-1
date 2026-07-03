import { useEffect, useState } from "react";

const LOGO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/38a015fd-cfd8-4bad-9fae-1106d60ea1d2.jpg";
const BG   = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4d4aa1bd-fe2c-46ae-b734-3f14fcfaced6.jpg";

const HEARTS = ["❤️","💕","✨","💖","🌸","💗","⭐","💝"];

interface Props { onDone: () => void }

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "show" | "out">("in");
  const [particles, setParticles] = useState<{ id: number; x: number; emoji: string; delay: number; dur: number }[]>([]);

  useEffect(() => {
    // Генерируем частицы
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        emoji: HEARTS[Math.floor(Math.random() * HEARTS.length)],
        delay: Math.random() * 2.5,
        dur: 2.2 + Math.random() * 1.8,
      }))
    );

    // Фазы: in → show → out → onDone
    const t1 = setTimeout(() => setPhase("show"), 300);
    const t2 = setTimeout(() => setPhase("out"),  3400);
    const t3 = setTimeout(() => onDone(),          4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #1a0e2e 0%, #0f0818 50%, #1a0e2e 100%)",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.55s ease-in" : "none",
      }}
    >
      {/* Фоновое изображение */}
      <img
        src={BG}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: 0.12 }}
      />

      {/* Плавающие частицы */}
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${p.x}%`,
            bottom: "-10%",
            fontSize: 18 + Math.random() * 14,
            animationName: "splashFloat",
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: "ease-out",
            animationIterationCount: "infinite",
            opacity: 0,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Свечение за логотипом */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 220, height: 220,
          background: "radial-gradient(circle, rgba(255,45,120,0.35) 0%, rgba(155,89,182,0.2) 50%, transparent 75%)",
          filter: "blur(28px)",
          transform: `scale(${phase === "show" ? 1 : 0.3})`,
          opacity: phase === "show" ? 1 : 0,
          transition: "transform 0.9s cubic-bezier(0.34,1.56,0.64,1), opacity 0.7s ease",
        }}
      />

      {/* Логотип */}
      <div
        style={{
          transform: `scale(${phase === "show" ? 1 : 0.4}) translateY(${phase === "show" ? 0 : 30}px)`,
          opacity: phase === "show" ? 1 : 0,
          transition: "transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease",
          marginBottom: 32,
          position: "relative",
        }}
      >
        {/* Пульсирующее кольцо */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            boxShadow: "0 0 0 0 rgba(255,45,120,0.6)",
            animation: phase === "show" ? "splashPulse 1.6s ease-out infinite" : "none",
            borderRadius: 26,
          }}
        />
        <img
          src={LOGO}
          alt="Полутон"
          style={{
            width: 100, height: 100,
            borderRadius: 26,
            boxShadow: "0 12px 48px rgba(255,45,120,0.55), 0 4px 16px rgba(0,0,0,0.4)",
            display: "block",
            position: "relative",
            zIndex: 1,
          }}
        />
      </div>

      {/* Название */}
      <div
        style={{
          opacity: phase === "show" ? 1 : 0,
          transform: `translateY(${phase === "show" ? 0 : 16}px)`,
          transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          textAlign: "center",
        }}
      >
        <h1
          className="font-unbounded font-black text-white"
          style={{
            fontSize: 34,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #FF2D78 0%, #C061FF 50%, #FF8FAB 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          Полутон
        </h1>
        <p
          className="text-white/45 font-golos"
          style={{ fontSize: 14, letterSpacing: "0.3px" }}
        >
          Найди свою половинку
        </p>
      </div>

      {/* Точки-индикатор загрузки */}
      <div
        className="absolute flex gap-1.5"
        style={{
          bottom: "calc(48px + env(safe-area-inset-bottom, 0px))",
          opacity: phase === "show" ? 1 : 0,
          transition: "opacity 0.5s ease 0.5s",
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 6, height: 6,
              background: "rgba(255,45,120,0.7)",
              animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splashFloat {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
        }
        @keyframes splashPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,45,120,0.5); }
          70%  { box-shadow: 0 0 0 18px rgba(255,45,120,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,45,120,0); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}