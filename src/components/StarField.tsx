import { useMemo } from "react";

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  bright: boolean;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const bright = Math.random() < 0.16;
    return {
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: bright ? 2.2 + Math.random() * 1.6 : 1 + Math.random() * 1.3,
      duration: 1.8 + Math.random() * 3.6,
      delay: Math.random() * 5,
      bright,
    };
  });
}

/** Слой живых мерцающих звёзд — каждая звезда светится независимо, как настоящее небо. */
export function StarField({ count = 110 }: { count?: number }) {
  const stars = useMemo(() => generateStars(count), [count]);

  return (
    <div className="star-field-layer" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className={`star-dot${s.bright ? " star-dot-bright" : ""}`}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default StarField;
