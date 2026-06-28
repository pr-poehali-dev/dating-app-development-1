import { useScreenshotProtection } from "@/hooks/useScreenshotProtection";

const SHIELD_KEYFRAMES = `
@keyframes shield-in {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to   { opacity: 0; transform: translateX(-50%) translateY(-8px); }
}
@keyframes shake-icon {
  0%,100% { transform: rotate(0deg); }
  20%     { transform: rotate(-12deg); }
  40%     { transform: rotate(10deg); }
  60%     { transform: rotate(-8deg); }
  80%     { transform: rotate(6deg); }
}
`;

export function ScreenshotProtection() {
  const { showWarning, isBlurred } = useScreenshotProtection();

  return (
    <>
      <style>{SHIELD_KEYFRAMES}</style>

      {/* ── Блюр-оверлей когда приложение уходит в фон ── */}
      {isBlurred && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
          style={{
            background: "rgba(8,4,18,0.97)",
            backdropFilter: "blur(20px)",
            animation: "shield-in 0.15s ease",
          }}>
          {/* Иконка щита */}
          <div className="relative flex items-center justify-center">
            {/* Кольца */}
            {[1,2].map(i => (
              <div key={i} className="absolute rounded-full"
                style={{
                  width: 80 + i * 36, height: 80 + i * 36,
                  border: "1px solid rgba(255,45,120,0.15)",
                  animation: `ping ${1.2 + i * 0.4}s cubic-bezier(0,0,0.2,1) infinite`,
                }} />
            ))}
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg,rgba(255,45,120,0.2),rgba(155,89,182,0.15))",
                border: "1px solid rgba(255,45,120,0.35)",
                boxShadow: "0 0 40px rgba(255,45,120,0.25)",
              }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="url(#shieldGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: "shake-icon 0.5s ease 0.1s" }}>
                <defs>
                  <linearGradient id="shieldGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF2D78"/>
                    <stop offset="100%" stopColor="#9B59B6"/>
                  </linearGradient>
                </defs>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <circle cx="12" cy="16" r="0.5" fill="#FF2D78" stroke="#FF2D78"/>
              </svg>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 px-10 text-center">
            <p className="text-white font-black text-xl tracking-tight">Защита контента</p>
            <p className="text-white/50 text-sm leading-relaxed">
              Скриншоты и запись экрана запрещены.<br/>
              Переписка и медиа защищены политикой конфиденциальности LoveBloom.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full"
            style={{ background: "rgba(255,45,120,0.12)", border: "1px solid rgba(255,45,120,0.25)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-white/60 text-xs font-semibold">Содержимое скрыто</span>
          </div>
        </div>
      )}

      {/* ── Toast-предупреждение ── */}
      {showWarning && !isBlurred && (
        <div className="fixed bottom-28 left-1/2 z-[9998] pointer-events-none"
          style={{
            transform: "translateX(-50%)",
            animation: "toast-in 0.3s ease",
          }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: "linear-gradient(135deg,rgba(20,10,35,0.97),rgba(30,15,50,0.97))",
              border: "1px solid rgba(255,45,120,0.35)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,45,120,0.1)",
              backdropFilter: "blur(16px)",
              whiteSpace: "nowrap",
            }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#FF2D78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <circle cx="12" cy="16.5" r="0.5" fill="#FF2D78" stroke="#FF2D78"/>
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-xs font-bold">Скриншоты запрещены</span>
              <span className="text-white/45 text-[11px]">Контент защищён политикой LoveBloom</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ScreenshotProtection;
