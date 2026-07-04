import { useEffect, useRef, useState } from "react";

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
 * Анимированный подарок «в стиле Telegram»: живой SVG-персонаж (собачка),
 * у которого независимо двигаются части тела — виляет хвост, шевелятся уши,
 * моргают глаза, дышит корпус, подпрыгивают лапки. Работает офлайн, без CDN.
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
        @keyframes agSpinGlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes agBurst { 0% { transform: scale(0.3); opacity: 0.9; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes agPopIn {
          0%   { transform: scale(0.2) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        /* Виляние хвостом */
        @keyframes dogTail {
          0%,100% { transform: rotate(-18deg); }
          50%     { transform: rotate(22deg); }
        }
        /* Дыхание / подпрыгивание корпуса */
        @keyframes dogBody {
          0%,100% { transform: translateY(0) scaleY(1); }
          40%     { transform: translateY(-3px) scaleY(1.03); }
          70%     { transform: translateY(1px) scaleY(0.98); }
        }
        /* Моргание */
        @keyframes dogBlink {
          0%,92%,100% { transform: scaleY(1); }
          96%         { transform: scaleY(0.1); }
        }
        /* Покачивание головы */
        @keyframes dogHead {
          0%,100% { transform: rotate(-3deg); }
          50%     { transform: rotate(3deg); }
        }
        /* Уши */
        @keyframes dogEarL { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-8deg); } }
        @keyframes dogEarR { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        /* Передние лапки */
        @keyframes dogPaw { 0%,100% { transform: translateY(0); } 45% { transform: translateY(-2px); } }
        /* Язычок */
        @keyframes dogTongue { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.25); } }
      `}</style>

      {withBackground && (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 45%, ${bgFrom} 0%, ${bgTo} 100%)` }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,${pattern}")`, backgroundSize: `${size * 0.3}px ${size * 0.3}px`, opacity: 0.5 }} />
          <div style={{ position: "absolute", width: size * 1.4, height: size * 1.4, left: "50%", top: "50%", marginLeft: -(size * 1.4) / 2, marginTop: -(size * 1.4) / 2, background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.16) 20%, transparent 40%)", animation: "agSpinGlow 8s linear infinite", pointerEvents: "none" }} />
        </>
      )}

      {playBurst && (
        <div style={{ position: "absolute", width: size * 0.7, height: size * 0.7, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,220,120,0.95) 0%, transparent 65%)", animation: "agBurst 0.85s ease-out forwards", pointerEvents: "none", zIndex: 4 }} />
      )}

      {/* Живой SVG-пёс */}
      <div style={{ position: "relative", width: size * 0.82, height: size * 0.82, zIndex: 2, animation: playBurst ? "agPopIn 0.7s cubic-bezier(0.22,1,0.36,1)" : undefined }}>
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}>
          {/* Хвост (виляет) */}
          <g style={{ transformOrigin: "56px 128px", animation: "dogTail 0.6s ease-in-out infinite" }}>
            <path d="M56 128 Q30 120 26 96 Q40 108 58 118 Z" fill="#7A5230" />
          </g>

          {/* Задние лапки */}
          <ellipse cx="72" cy="168" rx="14" ry="9" fill="#6B4423" />
          <ellipse cx="128" cy="168" rx="14" ry="9" fill="#6B4423" />

          {/* Корпус (дышит/подпрыгивает) */}
          <g style={{ transformOrigin: "100px 150px", animation: "dogBody 0.7s ease-in-out infinite" }}>
            <ellipse cx="100" cy="140" rx="46" ry="40" fill="#A9713E" />
            <ellipse cx="100" cy="150" rx="30" ry="26" fill="#E8C39E" />

            {/* Передние лапки */}
            <g style={{ transformOrigin: "82px 170px", animation: "dogPaw 0.7s ease-in-out infinite" }}>
              <ellipse cx="84" cy="176" rx="12" ry="8" fill="#8A5A2B" />
            </g>
            <g style={{ transformOrigin: "118px 170px", animation: "dogPaw 0.7s ease-in-out infinite 0.35s" }}>
              <ellipse cx="116" cy="176" rx="12" ry="8" fill="#8A5A2B" />
            </g>
          </g>

          {/* Голова (покачивается) */}
          <g style={{ transformOrigin: "100px 90px", animation: "dogHead 2s ease-in-out infinite" }}>
            {/* Уши */}
            <g style={{ transformOrigin: "66px 62px", animation: "dogEarL 1.2s ease-in-out infinite" }}>
              <path d="M66 62 Q46 66 50 100 Q64 92 74 78 Z" fill="#7A5230" />
            </g>
            <g style={{ transformOrigin: "134px 62px", animation: "dogEarR 1.2s ease-in-out infinite" }}>
              <path d="M134 62 Q154 66 150 100 Q136 92 126 78 Z" fill="#7A5230" />
            </g>

            {/* Голова */}
            <circle cx="100" cy="86" r="42" fill="#A9713E" />
            <ellipse cx="100" cy="104" rx="30" ry="26" fill="#E8C39E" />

            {/* Глаза (моргают) */}
            <g style={{ transformOrigin: "86px 82px", animation: "dogBlink 3.4s ease-in-out infinite" }}>
              <circle cx="86" cy="82" r="7" fill="#2A1A0E" />
              <circle cx="88" cy="79" r="2.4" fill="#fff" />
            </g>
            <g style={{ transformOrigin: "114px 82px", animation: "dogBlink 3.4s ease-in-out infinite" }}>
              <circle cx="114" cy="82" r="7" fill="#2A1A0E" />
              <circle cx="116" cy="79" r="2.4" fill="#fff" />
            </g>

            {/* Носик */}
            <ellipse cx="100" cy="100" rx="7" ry="5" fill="#2A1A0E" />

            {/* Язычок (высунут, пульсирует) */}
            <g style={{ transformOrigin: "100px 108px", animation: "dogTongue 0.7s ease-in-out infinite" }}>
              <path d="M94 108 Q100 124 106 108 Z" fill="#FF7A8A" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
