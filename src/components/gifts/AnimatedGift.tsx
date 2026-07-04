import { useEffect, useRef, useState } from "react";

const DOG_URL = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/9de59b18-ff69-4639-b8a1-575561455187.jpg";

interface AnimatedGiftProps {
  size?: number;
  /** Показывать анимированный фон-подложку (как в Telegram) */
  withBackground?: boolean;
  /** Запустить приветственную анимацию появления (при отправке/открытии) */
  burst?: boolean;
  /** Цветовая тема фона */
  bgFrom?: string;
  bgTo?: string;
}

/**
 * Демо анимированного подарка «в стиле Telegram»: персонаж парит,
 * покачивается, поблёскивает, на фоне — радиальный градиент с
 * повторяющимся паттерном и медленно вращающимся свечением.
 */
export default function AnimatedGift({
  size = 200,
  withBackground = true,
  burst = false,
  bgFrom = "#8B4A52",
  bgTo = "#5A2A33",
}: AnimatedGiftProps) {
  const [playBurst, setPlayBurst] = useState(false);
  const prevBurst = useRef(false);

  useEffect(() => {
    if (burst && !prevBurst.current) {
      setPlayBurst(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setPlayBurst(true)));
      const t = setTimeout(() => setPlayBurst(false), 900);
      return () => clearTimeout(t);
    }
    prevBurst.current = burst;
  }, [burst]);

  const pattern = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><g fill="rgba(255,255,255,0.10)"><path d="M30 22c-6 0-10 4-10 9 0 4 3 7 7 8l-1 4h8l-1-4c4-1 7-4 7-8 0-5-4-9-10-9zm-13 6c-3 0-5 2-5 4s2 3 4 3l1-7zm26 0l1 7c2 0 4-1 4-3s-2-4-5-4z"/></g></svg>`
  );

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes agFloat {
          0%,100% { transform: translateY(0) rotate(-1.5deg); }
          50%     { transform: translateY(-7%) rotate(1.5deg); }
        }
        @keyframes agSpinGlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes agShine {
          0%   { transform: translateX(-120%) rotate(20deg); opacity: 0; }
          40%  { opacity: 0.9; }
          100% { transform: translateX(220%) rotate(20deg); opacity: 0; }
        }
        @keyframes agBurst {
          0%   { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes agPopIn {
          0%   { transform: scale(0.2) rotate(-25deg); opacity: 0; }
          60%  { transform: scale(1.12) rotate(6deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>

      {withBackground && (
        <>
          {/* Радиальный градиент-фон */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 50% 45%, ${bgFrom} 0%, ${bgTo} 100%)`,
            }}
          />
          {/* Повторяющийся паттерн */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,${pattern}")`,
              backgroundSize: `${size * 0.3}px ${size * 0.3}px`,
              opacity: 0.55,
            }}
          />
          {/* Медленно вращающееся свечение */}
          <div
            style={{
              position: "absolute",
              width: size * 1.4,
              height: size * 1.4,
              left: "50%",
              top: "50%",
              marginLeft: -(size * 1.4) / 2,
              marginTop: -(size * 1.4) / 2,
              background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.18) 20%, transparent 40%)",
              animation: "agSpinGlow 8s linear infinite",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Вспышка при отправке */}
      {playBurst && (
        <div
          style={{
            position: "absolute",
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,220,120,0.95) 0%, transparent 65%)",
            animation: "agBurst 0.85s ease-out forwards",
            pointerEvents: "none",
            zIndex: 4,
          }}
        />
      )}

      {/* Персонаж */}
      <div
        style={{
          position: "relative",
          width: size * 0.78,
          height: size * 0.78,
          zIndex: 2,
          animation: playBurst
            ? "agPopIn 0.7s cubic-bezier(0.22,1,0.36,1)"
            : "agFloat 3.2s ease-in-out infinite",
        }}
      >
        <img
          src={DOG_URL}
          alt="Подарок"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))",
          }}
        />
        {/* Блик-shine */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "40%",
            height: "100%",
            background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
            animation: "agShine 3.2s ease-in-out infinite",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
