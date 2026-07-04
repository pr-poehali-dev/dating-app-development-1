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
        /* Живой персонаж: подпрыг + покачивание + приземление */
        @keyframes agHop {
          0%    { transform: translateY(0)     rotate(-2deg)  scaleX(1)    scaleY(1); }
          8%    { transform: translateY(2%)    rotate(0deg)   scaleX(1.06) scaleY(0.94); }
          26%   { transform: translateY(-16%)  rotate(3deg)   scaleX(0.95) scaleY(1.06); }
          42%   { transform: translateY(-9%)   rotate(-2deg)  scaleX(1)    scaleY(1); }
          58%   { transform: translateY(-15%)  rotate(2deg)   scaleX(0.97) scaleY(1.04); }
          74%   { transform: translateY(1%)    rotate(0deg)   scaleX(1.05) scaleY(0.95); }
          82%   { transform: translateY(-3%)   rotate(-1deg)  scaleX(0.99) scaleY(1.02); }
          100%  { transform: translateY(0)     rotate(-2deg)  scaleX(1)    scaleY(1); }
        }
        /* Дыхание — лёгкое сжатие корпуса */
        @keyframes agBreathe {
          0%,100% { transform: scaleY(1)    scaleX(1); }
          50%     { transform: scaleY(1.03) scaleX(0.985); }
        }
        /* Тень под персонажем сжимается в прыжке */
        @keyframes agShadow {
          0%    { transform: scaleX(1)    scaleY(1);   opacity: 0.45; }
          26%   { transform: scaleX(0.6)  scaleY(0.6); opacity: 0.2; }
          58%   { transform: scaleX(0.65) scaleY(0.65);opacity: 0.22; }
          82%   { transform: scaleX(1.05) scaleY(1);   opacity: 0.5; }
          100%  { transform: scaleX(1)    scaleY(1);   opacity: 0.45; }
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
        /* Подмигивающая звёздочка-блик у очков */
        @keyframes agTwinkle {
          0%,55%,100% { transform: scale(0) rotate(0deg);   opacity: 0; }
          65%         { transform: scale(1.2) rotate(25deg); opacity: 1; }
          80%         { transform: scale(0.9) rotate(45deg); opacity: 0.9; }
          90%         { transform: scale(0) rotate(60deg);   opacity: 0; }
        }
        /* Летающие искры вокруг */
        @keyframes agSpark {
          0%   { transform: translate(0,0) scale(0);   opacity: 0; }
          30%  { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 1; }
          100% { transform: translate(calc(var(--dx)*1.8), calc(var(--dy)*1.8)) scale(0); opacity: 0; }
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

      {/* Тень под персонажем */}
      <div
        style={{
          position: "absolute",
          bottom: size * 0.1,
          left: "50%",
          width: size * 0.42,
          height: size * 0.09,
          marginLeft: -(size * 0.42) / 2,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
          animation: playBurst ? undefined : "agShadow 1.6s ease-in-out infinite",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Летающие искры вокруг */}
      {!playBurst && [
        { dx: "-70%", dy: "-40%", d: "0s",   c: "#FFD54A" },
        { dx: "75%",  dy: "-30%", d: "0.5s", c: "#FFFFFF" },
        { dx: "60%",  dy: "45%",  d: "1s",   c: "#FFB347" },
        { dx: "-65%", dy: "40%",  d: "1.4s", c: "#FFF3B0" },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: size * 0.05,
            height: size * 0.05,
            borderRadius: "50%",
            background: s.c,
            boxShadow: `0 0 ${size * 0.04}px ${s.c}`,
            // @ts-expect-error CSS custom props
            "--dx": s.dx,
            "--dy": s.dy,
            animation: `agSpark 1.6s ${s.d} ease-out infinite`,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Персонаж — внешний слой: прыжок */}
      <div
        style={{
          position: "relative",
          width: size * 0.78,
          height: size * 0.78,
          zIndex: 2,
          transformOrigin: "50% 90%",
          animation: playBurst
            ? "agPopIn 0.7s cubic-bezier(0.22,1,0.36,1)"
            : "agHop 1.6s cubic-bezier(0.3,0,0.4,1) infinite",
        }}
      >
        {/* Внутренний слой: дыхание */}
        <div
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "50% 100%",
            animation: playBurst ? undefined : "agBreathe 2.2s ease-in-out infinite",
            position: "relative",
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
          {/* Подмигивающая звёздочка у очков */}
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "34%",
              color: "#FFFFFF",
              fontSize: size * 0.14,
              lineHeight: 1,
              textShadow: "0 0 8px rgba(255,255,255,0.9)",
              animation: "agTwinkle 2.4s ease-in-out infinite",
              pointerEvents: "none",
            }}
          >
            ✦
          </div>
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
    </div>
  );
}