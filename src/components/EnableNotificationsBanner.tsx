import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { promptOneSignal, getPushStatus } from "@/hooks/useOneSignal";

const DISMISS_KEY = "enable_push_banner_dismissed_at";
// Показываем снова не раньше, чем через 3 дня после закрытия
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Заметный баннер после входа: предлагает включить push-уведомления,
 * чтобы получать лайки, сообщения и совпадения даже при закрытом приложении.
 */
export function EnableNotificationsBanner() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "granted">("idle");

  useEffect(() => {
    const status = getPushStatus();
    // Уже разрешено или невозможно — не показываем
    if (status === "granted" || status === "denied" || status === "unsupported") return;
    // Недавно закрывали — подождём
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || "0");
    if (dismissedAt && Date.now() - dismissedAt < SNOOZE_MS) return;

    const t = setTimeout(() => setVisible(true), 3500);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleEnable = async () => {
    setState("loading");
    const ok = await promptOneSignal();
    if (ok) {
      setState("granted");
      setTimeout(() => setVisible(false), 1400);
    } else {
      setState("idle");
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setTimeout(() => setVisible(false), 300);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 z-[9997] flex justify-center px-4 pointer-events-none"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
      <div className="pointer-events-auto w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(135deg,#FF2D78 0%,#C061FF 55%,#9B59B6 100%)",
          boxShadow: "0 12px 40px rgba(255,45,120,0.4)",
          animation: "pushPromptIn 0.45s cubic-bezier(0.22,1,0.36,1)",
        }}>
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
            style={{ background: "rgba(255,255,255,0.22)" }}>
            <Icon name={state === "granted" ? "BellRing" : "Bell"} size={24} className="text-white" />
            {state !== "granted" && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white"
                style={{ animation: "streak-fire 1.6s ease-in-out infinite" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-[15px] leading-tight">
              {state === "granted" ? "Готово! 🎉" : "Включи уведомления"}
            </p>
            <p className="text-white/85 text-xs mt-0.5 leading-snug">
              {state === "granted"
                ? "Теперь ты не пропустишь ни одного события"
                : "Узнавай сразу: кто лайкнул, посмотрел анкету и написал — даже когда телефон заблокирован"}
            </p>
          </div>
          {state !== "granted" && (
            <button onClick={close}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.18)" }}>
              <Icon name="X" size={16} className="text-white" />
            </button>
          )}
        </div>
        {state !== "granted" && (
          <button onClick={handleEnable} disabled={state === "loading"}
            className="w-full py-3 flex items-center justify-center gap-2 text-white font-bold text-sm active:opacity-80 transition-all"
            style={{ background: "rgba(255,255,255,0.16)", borderTop: "1px solid rgba(255,255,255,0.18)" }}>
            {state === "loading"
              ? <Icon name="Loader2" size={17} className="animate-spin" />
              : <><Icon name="BellRing" size={17} /> Включить уведомления</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default EnableNotificationsBanner;
