import { useMemo } from "react";

type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY_COLORS: Record<Rarity, string[]> = {
  common:    [],
  rare:      ["#63B3ED", "#90CDF4", "#BEE3F8", "#FFFFFF", "#4299E1"],
  epic:      ["#B794F4", "#D6BCFA", "#E9D8FD", "#FFFFFF", "#9F7AEA", "#ED64A6"],
  legendary: ["#FFD700", "#FFA500", "#FF6B35", "#FFFFFF", "#F6E05E", "#FC8181", "#FF2D78"],
};

const PARTICLE_COUNTS: Record<Rarity, number> = {
  common: 0, rare: 6, epic: 10, legendary: 16,
};

interface Particle {
  id: number;
  x: number;       // % from center
  y: number;
  size: number;
  color: string;
  delay: number;   // s
  duration: number;
  shape: "star" | "dot" | "diamond" | "sparkle";
  orbit: number;   // orbit radius %
  angle: number;   // initial angle deg
}

function StarPath({ size }: { size: number }) {
  const r = size / 2;
  const ir = r * 0.4;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180);
    const ia = ((i * 72 + 36) - 90) * (Math.PI / 180);
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)} ${r + ir * Math.cos(ia)},${r + ir * Math.sin(ia)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <polygon points={pts} fill="currentColor" />
    </svg>
  );
}

function SparkleShape({ size }: { size: number }) {
  const h = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <path
        d={`M${h},0 L${h * 1.15},${h * 0.85} L${size},${h} L${h * 1.15},${h * 1.15} L${h},${size} L${h * 0.85},${h * 1.15} L0,${h} L${h * 0.85},${h * 0.85} Z`}
        fill="currentColor"
      />
    </svg>
  );
}

export default function GiftParticles({ rarity, size = 56 }: { rarity: Rarity; size?: number }) {
  const count = PARTICLE_COUNTS[rarity];
  const colors = RARITY_COLORS[rarity];

  const particles = useMemo<Particle[]>(() => {
    if (count === 0) return [];
    return Array.from({ length: count }, (_, i) => {
      const angle = (360 / count) * i + Math.random() * 30 - 15;
      const orbit = 52 + Math.random() * 22; // % of container
      const shapes: Particle["shape"][] = ["star", "dot", "diamond", "sparkle"];
      return {
        id: i,
        x: 0,
        y: 0,
        size: rarity === "legendary" ? 3 + Math.random() * 5 : 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: (i / count) * 2.4,
        duration: 2.0 + Math.random() * 1.4,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        orbit,
        angle,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rarity, count]);

  if (count === 0) return null;

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: `-${size * 0.35}px`,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {particles.map((p) => {
        const containerSize = size + size * 0.7; // inset * 2 = size * 0.7
        const halfC = containerSize / 2;
        const orbitR = (p.orbit / 100) * (size / 2 + size * 0.3);
        const rad = p.angle * (Math.PI / 180);
        const px = halfC + orbitR * Math.cos(rad) - p.size / 2;
        const py = halfC + orbitR * Math.sin(rad) - p.size / 2;
        void cx; void cy;

        const keyframeName = `gp_orbit_${rarity}_${p.id}`;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: p.size,
              height: p.size,
              color: p.color,
              opacity: 0,
              animation: `${keyframeName} ${p.duration}s ${p.delay}s ease-in-out infinite`,
              transformOrigin: `${halfC - px + p.size / 2}px ${halfC - py + p.size / 2}px`,
              willChange: "transform, opacity",
            }}
          >
            <style>{`
              @keyframes ${keyframeName} {
                0%   { opacity: 0;   transform: scale(0.3) rotate(0deg); }
                15%  { opacity: 1;   transform: scale(1) rotate(${p.angle * 0.2}deg); }
                50%  { opacity: 0.9; transform: scale(${rarity === "legendary" ? 1.3 : 1.1}) rotate(${p.angle * 0.5}deg); }
                80%  { opacity: 0.6; transform: scale(0.8) rotate(${p.angle * 0.8}deg); }
                100% { opacity: 0;   transform: scale(0.2) rotate(${p.angle}deg); }
              }
            `}</style>
            {p.shape === "star"    && <StarPath size={p.size} />}
            {p.shape === "sparkle" && <SparkleShape size={p.size} />}
            {p.shape === "diamond" && (
              <svg width={p.size} height={p.size} viewBox={`0 0 ${p.size} ${p.size}`} style={{ display: "block" }}>
                <rect x={p.size * 0.15} y={p.size * 0.15} width={p.size * 0.7} height={p.size * 0.7}
                  fill="currentColor" transform={`rotate(45 ${p.size / 2} ${p.size / 2})`} />
              </svg>
            )}
            {p.shape === "dot" && (
              <svg width={p.size} height={p.size} viewBox={`0 0 ${p.size} ${p.size}`} style={{ display: "block" }}>
                <circle cx={p.size / 2} cy={p.size / 2} r={p.size / 2} fill="currentColor" />
              </svg>
            )}
          </div>
        );
      })}

      {/* Extra shimmer ring for legendary/epic */}
      {(rarity === "legendary" || rarity === "epic") && (
        <div style={{
          position: "absolute",
          inset: `${size * 0.15}px`,
          borderRadius: "50%",
          border: `1.5px solid ${rarity === "legendary" ? "rgba(255,215,0,0.35)" : "rgba(159,122,234,0.3)"}`,
          animation: `gp_ring_${rarity} 3s linear infinite`,
        }}>
          <style>{`
            @keyframes gp_ring_${rarity} {
              0%   { transform: scale(0.9);  opacity: 0.6; }
              50%  { transform: scale(1.08); opacity: 0.2; }
              100% { transform: scale(0.9);  opacity: 0.6; }
            }
          `}</style>
        </div>
      )}

      {/* Legendary: extra golden glow burst */}
      {rarity === "legendary" && (
        <div style={{
          position: "absolute",
          inset: `${size * 0.2}px`,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,200,0,0.18) 0%, transparent 70%)",
          animation: "gp_burst 2s ease-in-out infinite",
        }}>
          <style>{`
            @keyframes gp_burst {
              0%, 100% { transform: scale(1);   opacity: 0.7; }
              50%       { transform: scale(1.25); opacity: 0.3; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
