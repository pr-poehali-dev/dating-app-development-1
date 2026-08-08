import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { videoBlocksApi, type VideoBlockedUser } from "@/lib/api";
import { syncVideoBlocks, unblockVideo } from "@/lib/videoBlocks";
import { DEFAULT_AVATAR } from "@/components/ui/UserAvatar";
import { useBackHandler } from "@/hooks/backStack";

/**
 * Полноэкранный список людей, которым запрещены видеозвонки.
 * Показывает аватар и имя, позволяет разблокировать по одному или всех сразу.
 */
export function BlockedCallsScreen({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<VideoBlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useBackHandler(true, () => {
    if (confirmAll) { setConfirmAll(false); return; }
    onClose();
  });

  useEffect(() => {
    videoBlocksApi.list()
      .then(d => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnblockOne = async (id: number) => {
    setBusy(id);
    unblockVideo(id);
    setTimeout(() => {
      setUsers(prev => prev.filter(u => u.id !== id));
      setBusy(null);
    }, 250);
  };

  const handleUnblockAll = async () => {
    setConfirmAll(false);
    const ids = users.map(u => u.id);
    setUsers([]);
    await Promise.all(ids.map(id => videoBlocksApi.unblock(id).catch(() => {})));
    syncVideoBlocks();
  };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col page-push-in"
      style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)" }}>

      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
        }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white/80" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base leading-tight">Заблокированные звонки</p>
          <p className="text-white/35 text-xs mt-0.5">
            {loading ? "Загружаем..." : users.length === 0 ? "Список пуст" : `${users.length} ${users.length === 1 ? "человек" : "человек"}`}
          </p>
        </div>
        {users.length > 0 && (
          <button onClick={() => setConfirmAll(true)}
            className="text-[11px] font-bold uppercase tracking-wide px-3 py-2 rounded-xl active:scale-95 transition-transform flex-shrink-0"
            style={{ background: "rgba(255,106,61,0.14)", color: "#FF6A3D" }}>
            Разблокировать всех
          </button>
        )}
      </div>

      {/* Содержимое */}
      <div className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>

        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 gap-5 text-center px-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[26px]"
                style={{
                  background: "linear-gradient(135deg,rgba(255,45,120,0.16),rgba(155,89,182,0.12))",
                  border: "1px solid rgba(255,45,120,0.22)",
                  boxShadow: "0 0 30px rgba(255,45,120,0.16)",
                }} />
              <Icon name="VideoOff" size={34} className="text-pink-400/80 relative" />
            </div>
            <div>
              <p className="text-white/70 font-semibold text-base mb-1">Никто не заблокирован</p>
              <p className="text-white/35 text-sm leading-relaxed">
                Здесь появятся люди, которым<br />ты запретил видеозвонки
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id}
                className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  opacity: busy === u.id ? 0.4 : 1,
                }}>
                {/* Аватар */}
                <div className="relative flex-shrink-0">
                  <img src={u.photo_url || DEFAULT_AVATAR}
                    className="w-12 h-12 rounded-2xl object-cover"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#FF6A3D", border: "2px solid #150a24" }}>
                    <Icon name="VideoOff" size={9} className="text-white" />
                  </div>
                </div>

                {/* Имя */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {u.name}{u.age ? `, ${u.age}` : ""}
                    </p>
                    {u.verified && (
                      <Icon name="BadgeCheck" size={13} className="text-sky-400 flex-shrink-0"
                        style={{ fill: "rgba(56,189,248,0.2)" }} />
                    )}
                  </div>
                  <p className="text-white/30 text-[11px] mt-0.5">Видеозвонки запрещены</p>
                </div>

                {/* Кнопка */}
                <button onClick={() => handleUnblockOne(u.id)} disabled={busy === u.id}
                  className="flex-shrink-0 text-[11px] font-semibold px-3 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                  style={{ background: "rgba(74,222,128,0.13)", color: "#4ADE80" }}>
                  Разблокировать
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Подтверждение разблокировки всех */}
      {confirmAll && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center px-8"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
          onClick={() => setConfirmAll(false)}>
          <div className="w-full max-w-xs rounded-3xl p-5 animate-scale-in"
            style={{ background: "rgba(28,18,48,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(255,106,61,0.15)" }}>
              <Icon name="Video" size={22} style={{ color: "#FF6A3D" }} />
            </div>
            <p className="text-white font-bold text-base text-center mb-1">Разблокировать всех?</p>
            <p className="text-white/45 text-xs text-center leading-relaxed mb-5">
              {users.length} {users.length === 1 ? "человек снова сможет" : "человек снова смогут"} тебе звонить
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAll(false)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white/70 active:scale-95 transition-transform"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                Отмена
              </button>
              <button onClick={handleUnblockAll}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white active:scale-95 transition-transform"
                style={{ background: "linear-gradient(90deg,#FF6A3D,#FF2D78)" }}>
                Разблокировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlockedCallsScreen;
