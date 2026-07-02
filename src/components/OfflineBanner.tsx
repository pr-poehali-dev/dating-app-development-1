import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import type { OfflineState } from "@/hooks/useOffline";

interface Props {
  offlineState: OfflineState;
}

export default function OfflineBanner({ offlineState }: Props) {
  const { isOnline, wasOffline, pendingCount } = offlineState;
  const [visible, setVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      setSyncing(false);
    } else if (wasOffline) {
      // Показываем "Соединение восстановлено" на 3 сек
      setSyncing(true);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOnline, wasOffline]);

  if (!visible) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[9998] flex justify-center"
      style={{
        top: "env(safe-area-inset-top, 0px)",
        pointerEvents: "none",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-b-2xl shadow-lg"
        style={{
          background: syncing
            ? "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))"
            : "linear-gradient(135deg, rgba(30,20,45,0.97), rgba(50,30,70,0.97))",
          border: syncing
            ? "1px solid rgba(16,185,129,0.4)"
            : "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(16px)",
          boxShadow: syncing
            ? "0 4px 20px rgba(16,185,129,0.3)"
            : "0 4px 20px rgba(0,0,0,0.4)",
          transition: "all 0.4s ease",
          maxWidth: 320,
          pointerEvents: "auto",
          animation: "slideDownBanner 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {syncing ? (
          <>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <Icon name="Wifi" size={16} className="text-emerald-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xs font-bold leading-tight">Соединение восстановлено</span>
              {pendingCount > 0 && (
                <span className="text-emerald-200 text-[10px] leading-tight">
                  Синхронизируем {pendingCount} {pendingCount === 1 ? "действие" : "действия"}...
                </span>
              )}
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-300 flex-shrink-0 animate-pulse" />
          </>
        ) : (
          <>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <Icon name="WifiOff" size={16} className="text-white/60" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xs font-bold leading-tight">Нет интернета</span>
              <span className="text-white/50 text-[10px] leading-tight">
                Доступны чаты и профили из кэша
              </span>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideDownBanner {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
