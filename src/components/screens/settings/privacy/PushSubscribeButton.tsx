import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  promptOneSignal,
  disableOneSignal,
  getPushStatus,
  openNativeAppSettings,
  setNativePushState,
} from "@/hooks/useOneSignal";

function isNativeApp() {
  const w = window as unknown as { median?: unknown; gonative?: unknown };
  if (w.median || w.gonative) return true;
  return /median|gonative/i.test(navigator.userAgent || "");
}

export function PushSubscribeButton() {
  // on — уведомления включены, off — выключены, denied — заблокированы в настройках телефона
  const [state, setState] = useState<"off" | "on" | "denied" | "asked">(() =>
    getPushStatus() === "granted" ? "on" : getPushStatus() === "denied" ? "denied" : "off",
  );
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [settingsFailed, setSettingsFailed] = useState(false);

  // При возврате на экран (свернул/развернул приложение) пересчитываем реальный статус
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState !== "visible") return;
      const s = getPushStatus();
      if (s === "granted") { setState("on"); setShowHint(false); }
      else if (s === "denied") setState((prev) => (prev === "asked" ? prev : "denied"));
    };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const enabled = state === "on";

  const handleToggle = async () => {
    if (loading) return;
    const native = isNativeApp();

    // Выключаем
    if (enabled) {
      setLoading(true);
      await disableOneSignal();
      setLoading(false);
      if (native) {
        // В приложении отписка идёт через настройки телефона
        setNativePushState("denied");
        openNativeAppSettings();
        setState("denied");
      } else {
        setState("off");
      }
      return;
    }

    // Уже заблокировано в системе — открываем настройки приложения и показываем инструкцию
    if (state === "denied") {
      setShowHint(true);
      if (!openNativeAppSettings()) setSettingsFailed(true);
      return;
    }

    // Включаем — запрашиваем системное разрешение
    setLoading(true);
    const ok = await promptOneSignal();
    setLoading(false);

    if (native) {
      // В APK факт разрешения из JS не виден — запоминаем выбор пользователя
      if (ok) { setNativePushState("granted"); setState("on"); }
      else setState("denied");
    } else {
      const s = getPushStatus();
      setState(s === "granted" ? "on" : "denied");
    }
  };

  const title = enabled
    ? "Push-уведомления включены"
    : state === "asked"
    ? "Подтвердите в окне телефона"
    : state === "denied"
    ? "Уведомления заблокированы"
    : "Push-уведомления выключены";

  const sub = loading
    ? "Секундочку..."
    : state === "asked"
    ? "Разрешите уведомления в системном окне"
    : state === "denied"
    ? "Открой настройки и включи «Уведомления»"
    : enabled
    ? "Вы получаете важные уведомления"
    : "Не пропускай новые совпадения и сообщения";

  return (
    <>
    <div
      className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all"
      style={{
        background: enabled
          ? "rgba(74,222,128,0.1)"
          : state === "denied"
          ? "rgba(248,113,113,0.1)"
          : "linear-gradient(135deg,rgba(255,45,120,0.16),rgba(155,89,182,0.16))",
        border: `1px solid ${enabled ? "rgba(74,222,128,0.3)" : state === "denied" ? "rgba(248,113,113,0.3)" : "rgba(255,45,120,0.3)"}`,
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: enabled ? "rgba(74,222,128,0.18)" : state === "denied" ? "rgba(248,113,113,0.18)" : "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
        <Icon name={enabled ? "BellRing" : state === "denied" ? "BellOff" : "Bell"} size={17}
          style={{ color: enabled ? "#4ADE80" : state === "denied" ? "#F87171" : "#fff" }} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-white/45 text-xs mt-0.5">{sub}</p>
      </div>

      {state === "denied" ? (
        <button onClick={handleToggle}
          className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
          style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}>
          Настройки
        </button>
      ) : loading ? (
        <Icon name="Loader2" size={18} className="animate-spin text-white/50 flex-shrink-0" />
      ) : (
        <button onClick={handleToggle}
          className="flex-shrink-0 w-12 h-6 rounded-full relative transition-all duration-300"
          style={{ background: enabled ? "linear-gradient(90deg,#4ADE80,#22C55E)" : "rgba(255,255,255,0.12)" }}
          aria-label="Переключить push-уведомления">
          <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
            style={{ left: enabled ? "26px" : "2px" }} />
        </button>
      )}
    </div>

    {/* Пошаговая инструкция, когда уведомления заблокированы */}
    {state === "denied" && showHint && (
      <div className="mt-2 rounded-2xl px-4 py-3.5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-1.5">
          <Icon name="Info" size={14} className="text-pink-400" />
          Как включить уведомления вручную
        </p>
        <ol className="text-white/55 text-xs leading-relaxed space-y-1 list-none">
          <li>1. Открой Настройки телефона</li>
          <li>2. Приложения → Полутон</li>
          <li>3. Пункт «Уведомления» → включи «Разрешить уведомления»</li>
          <li>4. Вернись сюда — статус обновится сам</li>
        </ol>
        <button onClick={() => { if (!openNativeAppSettings()) setSettingsFailed(true); }}
          className="mt-3 w-full text-xs font-semibold py-2 rounded-xl active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "#fff" }}>
          Открыть настройки телефона
        </button>
        {settingsFailed && (
          <p className="text-white/40 text-[11px] mt-2 text-center">
            Не удалось открыть автоматически — открой настройки телефона вручную по шагам выше
          </p>
        )}
      </div>
    )}
    <div className="mb-3" />
    </>
  );
}

export default PushSubscribeButton;
