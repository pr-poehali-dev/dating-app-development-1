import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Toggle } from "@/components/screens/SettingsUIKit";
import { getCallSettings, saveCallSettings, type CallSettings } from "@/lib/callSettings";
import { blocksApi, videoBlocksApi, type BlockedUser } from "@/lib/api";
import { syncVideoBlocks, unblockVideo } from "@/lib/videoBlocks";

/**
 * Блок «Видеозвонки» внутри раздела Уведомления:
 * блокировка всех входящих, оповещения, приоритет и список заблокированных.
 */
export function CallNotificationsBlock() {
  const [settings, setSettings] = useState<CallSettings>(() => getCallSettings());
  const [listOpen, setListOpen] = useState(false);
  const [blockedIds, setBlockedIds] = useState<number[]>([]);
  const [people, setPeople] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBlocked = () => {
    setLoading(true);
    Promise.all([videoBlocksApi.list(), blocksApi.list().catch(() => ({ blocks: [] as BlockedUser[] }))])
      .then(([v, b]) => {
        setBlockedIds(v.blocked_ids || []);
        setPeople(b.blocks || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { videoBlocksApi.list().then(d => setBlockedIds(d.blocked_ids || [])).catch(() => {}); }, []);

  const toggle = (key: keyof CallSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveCallSettings(next);
  };

  const handleUnblockAll = async () => {
    await Promise.all(blockedIds.map(id => videoBlocksApi.unblock(id).catch(() => {})));
    setBlockedIds([]);
    syncVideoBlocks();
  };

  const handleUnblockOne = (id: number) => {
    unblockVideo(id);
    setBlockedIds(prev => prev.filter(x => x !== id));
  };

  const nameOf = (id: number) => people.find(p => p.id === id)?.name || `Пользователь #${id}`;
  const photoOf = (id: number) => people.find(p => p.id === id)?.photo_url;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Видеочат</p>
        {blockedIds.length > 0 && (
          <button onClick={handleUnblockAll}
            className="text-[11px] font-bold uppercase tracking-wide active:opacity-60"
            style={{ color: "#FF6A3D" }}>
            Разблокировать всех
          </button>
        )}
      </div>

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

        {/* Список заблокированных звонков */}
        <button onClick={() => { setListOpen(v => !v); if (!listOpen) loadBlocked(); }}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70 transition-opacity">
          <Icon name="VideoOff" size={19} className="text-white/45 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm leading-snug">Список заблокированных звонков</p>
            {blockedIds.length > 0 && (
              <p className="text-white/35 text-[11px] mt-0.5">{blockedIds.length} в списке</p>
            )}
          </div>
          <Icon name={listOpen ? "ChevronDown" : "ChevronRight"} size={16} className="text-white/25 flex-shrink-0" />
        </button>

        {listOpen && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {loading ? (
              <div className="py-6 flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              </div>
            ) : blockedIds.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-6 px-4">Пока никто не заблокирован</p>
            ) : (
              blockedIds.map(id => (
                <div key={id} className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.07)" }}>
                    {photoOf(id) && <img src={photoOf(id)} className="w-full h-full object-cover" />}
                  </div>
                  <p className="flex-1 min-w-0 text-white/80 text-sm truncate">{nameOf(id)}</p>
                  <button onClick={() => handleUnblockOne(id)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                    style={{ background: "rgba(255,106,61,0.14)", color: "#FF6A3D" }}>
                    Разблокировать
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CallNotificationsBlock;
