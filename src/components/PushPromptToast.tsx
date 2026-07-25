import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { promptOneSignal } from "@/hooks/useOneSignal";

const SEEN_KEY = "push_prompt_seen";

/** Показывает ненавязчивое предложение подписаться на пуши после первого совпадения. */
export function PushPromptToast() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "granted">("idle");

  useEffect(() => {
    const onMatch = () => {
      if (localStorage.getItem(SEEN_KEY)) return;
      if (typeof Notification !== "undefined" && Notification.permission === "granted") return;
      setTimeout(() => setVisible(true), 1400);
    };
    window.addEventListener("app:match", onMatch);
    return () => window.removeEventListener("app:match", onMatch);
  }, []);

  const close = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  };

  const handleEnable = async () => {
    setState("loading");
    const ok = await promptOneSignal();
    setState(ok ? "granted" : "idle");
    localStorage.setItem(SEEN_KEY, "1");
    setTimeout(() => setVisible(false), ok ? 1100 : 0);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 z-[9998] flex justify-center px-4 pointer-events-none"
      style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }}>
      <div className="pointer-events-auto w-full max-w-md rounded-3xl p-4 flex items-center gap-3 shadow-2xl"
        style={{
          background: "linear-gradient(135deg,rgba(38,20,45,0.98),rgba(28,16,37,0.98))",
          border: "1px solid rgba(255,45,120,0.28)",
          backdropFilter: "blur(12px)",
          animation: "pushPromptIn 0.4s cubic-bezier(0.22,1,0.36,1)",
        }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          <Icon name={state === "granted" ? "BellRing" : "Heart"} size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">
            {state === "granted" ? "Готово! 🎉" : "У вас совпадение! 💕"}
          </p>
          <p className="text-white/50 text-xs mt-0.5 leading-snug">
            {state === "granted"
              ? "Будем присылать уведомления о новых событиях"
              : "Включите уведомления, чтобы не пропускать сообщения и совпадения"}
          </p>
        </div>
        {state !== "granted" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handleEnable} disabled={state === "loading"}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              {state === "loading"
                ? <Icon name="Loader2" size={14} className="animate-spin" />
                : "Включить"}
            </button>
            <button onClick={close}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Icon name="X" size={15} className="text-white/40" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PushPromptToast;
