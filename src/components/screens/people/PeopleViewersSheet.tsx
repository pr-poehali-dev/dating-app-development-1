import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { notificationsApi, type Notification } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

interface Props {
  isPremium?: boolean;
  onClose: () => void;
  onPremium?: () => void;
  onOpenProfile?: (userId: number) => void;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

export function PeopleViewersSheet({ isPremium, onClose, onPremium, onOpenProfile }: Props) {
  const [viewers, setViewers] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list()
      .then(d => {
        const views = d.notifications.filter(n => n.type === "view");
        setViewers(views);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--spark-dark2,#1a1625)" }}>
      <div className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 12px)", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ArrowLeft" size={20} className="text-white" />
        </button>
        <h3 className="text-white font-bold text-base flex items-center gap-2">
          <Icon name="Eye" size={18} className="text-white/60" />
          Кто смотрел профиль
          {viewers.length > 0 && <span className="text-white/40 text-sm font-normal">· {viewers.length}</span>}
        </h3>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-3 pb-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="Eye" size={28} className="text-pink-400" />
              </div>
              <p className="text-white font-semibold text-center">Просмотров пока нет</p>
              <p className="text-white/40 text-sm text-center leading-relaxed">
                Заполни анкету и добавь фото — это привлечёт больше внимания!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {!isPremium && (
                <button onClick={() => { onClose(); onPremium?.(); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.25)" }}>
                  <Icon name="Crown" size={18} className="text-pink-400 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-pink-400 text-xs font-bold">✨ Premium — узнай кто смотрел</p>
                    <p className="text-white/40 text-xs">С подпиской видно имя и фото каждого</p>
                  </div>
                </button>
              )}
              <div className="grid grid-cols-3 gap-2">
                {viewers.map((v, i) => (
                  <button key={i} type="button"
                    onClick={() => {
                      if (isPremium && v.from_user_id) onOpenProfile?.(v.from_user_id);
                      else if (!isPremium) { onClose(); onPremium?.(); }
                    }}
                    className="flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-1 rounded-2xl transition-all active:scale-95"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={v.photo_url || FALLBACK_PHOTO}
                        className="w-full h-full object-cover"
                        style={!isPremium ? { filter: "blur(10px)", transform: "scale(1.15)" } : {}}
                      />
                      {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon name="Lock" size={16} className="text-white/80" />
                        </div>
                      )}
                    </div>
                    {isPremium ? (
                      <p className="text-white font-semibold text-[11px] text-center truncate w-full px-1">{v.name}</p>
                    ) : (
                      <div className="h-3 w-12 rounded-full mx-auto" style={{ background: "rgba(255,255,255,0.15)" }} />
                    )}
                    <p className="text-white/30 text-[10px] text-center">{timeAgo(v.created_at)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default PeopleViewersSheet;