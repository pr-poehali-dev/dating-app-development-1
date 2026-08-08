import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Toggle } from "@/components/screens/SettingsUIKit";
import { getCallSettings, saveCallSettings, type CallSettings } from "@/lib/callSettings";
import { videoBlocksApi } from "@/lib/api";
import { BlockedCallsScreen } from "./BlockedCallsScreen";

/**
 * Блок «Видеочат» внутри раздела Уведомления:
 * блокировка всех входящих, оповещения, приоритет и переход
 * на полноэкранный список заблокированных звонков.
 */
export function CallNotificationsBlock() {
  const [settings, setSettings] = useState<CallSettings>(() => getCallSettings());
  const [showList, setShowList] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);

  const loadCount = () => {
    videoBlocksApi.list()
      .then(d => setBlockedCount((d.blocked_ids || []).length))
      .catch(() => {});
  };

  useEffect(loadCount, []);

  const toggle = (key: keyof CallSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveCallSettings(next);
  };

  return (
    <>
      <div className="mt-3">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wide px-1 mb-2">Видеочат</p>

        <div className="glass-card overflow-hidden">
          {/* Блокировать все входящие видеочаты */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon name="Video" size={19} className="text-white/45 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm leading-snug">Блокировать все входящие видеочаты</p>
            </div>
            <Toggle value={settings.blockAll} onChange={() => toggle("blockAll")} />
          </div>

          {/* Оповещения о звонках */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon name="Vibrate" size={19} className="text-white/45 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm leading-snug">Оповещения о звонках</p>
            </div>
            <Toggle value={settings.alerts} onChange={() => toggle("alerts")} />
          </div>

          {/* Высокий приоритет */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon name="Bell" size={19} className="text-white/45 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm leading-snug">Использовать уведомления с высоким приоритетом</p>
            </div>
            <Toggle value={settings.highPriority} onChange={() => toggle("highPriority")} />
          </div>

          {/* Список заблокированных звонков — открывает отдельную страницу */}
          <button onClick={() => setShowList(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70 transition-opacity">
            <Icon name="VideoOff" size={19} className="text-white/45 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm leading-snug">Список заблокированных звонков</p>
              <p className="text-white/30 text-[11px] mt-0.5">
                {blockedCount > 0 ? `${blockedCount} в списке` : "Никто не заблокирован"}
              </p>
            </div>
            {blockedCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: "rgba(255,106,61,0.15)", color: "#FF6A3D" }}>
                {blockedCount}
              </span>
            )}
            <Icon name="ChevronRight" size={16} className="text-white/25 flex-shrink-0" />
          </button>
        </div>
      </div>

      {showList && (
        <BlockedCallsScreen onClose={() => { setShowList(false); loadCount(); }} />
      )}
    </>
  );
}

export default CallNotificationsBlock;
