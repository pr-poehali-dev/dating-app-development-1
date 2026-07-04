import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";

// Живая векторная анимация собачки (Lottie JSON). Реально двигаются части тела.
const DOG_LOTTIE_URL = "https://assets2.lottiefiles.com/packages/lf20_syqnfe7c.json";

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
 * Анимированный подарок «в стиле Telegram»: живой Lottie-персонаж (собачка),
 * на фоне — радиальный градиент с паттерном и медленно вращающимся свечением.
 */
export default function AnimatedGift({
  size = 200,
  withBackground = true,
  burst = false,
  bgFrom = "#8B4A52",
  bgTo = "#5A2A33",
}: AnimatedGiftProps) {
  const [playBurst, setPlayBurst] = useState(false);
  const [animData, setAnimData] = useState<object | null>(null);
  const prevBurst = useRef(false);

  // Загружаем Lottie-анимацию один раз
  useEffect(() => {
    let alive = true;
    fetch(DOG_LOTTIE_URL)
      .then((r) => r.json())
      .then((d) => { if (alive) setAnimData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

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
        @keyframes agSpinGlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes agBurst {
          0%   { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes agPopIn {
          0%   { transform: scale(0.2) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.1) rotate(5deg); opacity: 1; }
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
              opacity: 0.5,
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
              background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.16) 20%, transparent 40%)",
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

      {/* Живой Lottie-персонаж */}
      <div
        style={{
          position: "relative",
          width: size * 0.82,
          height: size * 0.82,
          zIndex: 2,
          animation: playBurst ? "agPopIn 0.7s cubic-bezier(0.22,1,0.36,1)" : undefined,
        }}
      >
        {animData ? (
          <Lottie animationData={animData} loop autoplay style={{ width: "100%", height: "100%" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: size * 0.4,
            }}
          >
            🐶
          </div>
        )}
      </div>
    </div>
  );
}
