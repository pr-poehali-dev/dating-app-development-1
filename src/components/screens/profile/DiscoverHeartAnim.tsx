export function DiscoverHeartAnim({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div style={{ animation: "heartPop 0.9s ease forwards" }}>
        <span style={{ fontSize: 96, filter: "drop-shadow(0 0 24px rgba(255,45,120,0.8))" }}>❤️</span>
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute w-3 h-3 rounded-full"
          style={{
            background: i % 2 === 0 ? "#FF2D78" : "#FF6B9D",
            animation: `heartSpark${i} 0.8s ease forwards`,
            top: "50%", left: "50%",
            transform: `rotate(${i * 45}deg) translateY(-60px)`,
            opacity: 0,
            animationDelay: "0.1s",
          }} />
      ))}
      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          40%  { transform: scale(1.3) rotate(8deg);  opacity: 1; }
          65%  { transform: scale(1.0) rotate(-4deg); opacity: 1; }
          85%  { transform: scale(1.1) rotate(2deg);  opacity: 1; }
          100% { transform: scale(0.8) rotate(0deg);  opacity: 0; }
        }
        @keyframes heartSpark0 { to { transform: rotate(0deg)   translateY(-80px) scale(0); opacity: 1; } }
        @keyframes heartSpark1 { to { transform: rotate(45deg)  translateY(-80px) scale(0); opacity: 1; } }
        @keyframes heartSpark2 { to { transform: rotate(90deg)  translateY(-80px) scale(0); opacity: 1; } }
        @keyframes heartSpark3 { to { transform: rotate(135deg) translateY(-80px) scale(0); opacity: 1; } }
        @keyframes heartSpark4 { to { transform: rotate(180deg) translateY(-80px) scale(0); opacity: 1; } }
        @keyframes heartSpark5 { to { transform: rotate(225deg) translateY(-80px) scale(0); opacity: 1; } }
        @keyframes heartSpark6 { to { transform: rotate(270deg) translateY(-80px) scale(0); opacity: 1; } }
        @keyframes heartSpark7 { to { transform: rotate(315deg) translateY(-80px) scale(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
