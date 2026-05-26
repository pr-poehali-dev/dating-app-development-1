import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { notificationsApi, type Notification } from "@/lib/api";

const FALLBACK = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "like") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,45,120,0.15)" }}><Icon name="Heart" size={13} style={{ color: "#FF2D78" }} /></div>;
  if (type === "super_like") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(155,89,182,0.15)" }}><Icon name="Star" size={13} style={{ color: "#9B59B6" }} /></div>;
  if (type === "message") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}><Icon name="MessageCircle" size={13} style={{ color: "#3B82F6" }} /></div>;
  if (type === "new_photo") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,200,0,0.15)" }}><Icon name="ImagePlus" size={13} style={{ color: "#FFCA28" }} /></div>;
  if (type === "subscription") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,200,0,0.15)" }}><Icon name="Star" size={13} style={{ color: "#FBBF24" }} /></div>;
  if (type === "match") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,45,120,0.15)" }}><Icon name="Zap" size={13} style={{ color: "#FF2D78" }} /></div>;
  if (type === "verif_approved") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.2)" }}><Icon name="BadgeCheck" size={13} style={{ color: "#38BDF8" }} /></div>;
  if (type === "verif_rejected") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}><Icon name="XCircle" size={13} style={{ color: "#F87171" }} /></div>;
  if (type === "story_view") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(155,89,182,0.2)" }}><Icon name="Play" size={13} style={{ color: "#C084FC" }} /></div>;
  return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}><Icon name="Eye" size={13} className="text-white/50" /></div>;
}

function notifText(n: Notification) {
  if (n.type === "like") return "лайкнул(а) тебя";
  if (n.type === "super_like") return "поставил(а) суперлайк ⭐";
  if (n.type === "message") {
    if (!n.text) return "написал(а) тебе";
    if (n.text.startsWith("__AUDIO__")) return "🎤 Голосовое сообщение";
    if (n.text.startsWith("__VANISH__") || n.text.match(/\.(jpg|jpeg|png|gif|webp)/i)) return "📷 Фото";
    if (n.text === "__REQUEST_PHOTO__") return "🔐 Запрашивает доступ к фото";
    if (n.text === "__GRANT_PHOTO__") return "🖼️ Открыл(а) доступ к фото";
    if (n.text.startsWith("__LOC__")) return "📍 Геолокация";
    return `написал(а): ${n.text.slice(0, 40)}${n.text.length > 40 ? "…" : ""}`;
  }
  if (n.type === "new_photo") return "добавил(а) новое фото 📷";
  if (n.type === "subscription") return "подписался(ась) на тебя ⭐";
  if (n.type === "match") return "новое совпадение! 🎉";
  if (n.type === "verif_approved") return "✅ Верификация одобрена! Значок ✓ теперь на твоём профиле";
  if (n.type === "verif_rejected") return "❌ Верификация отклонена. Попробуй ещё раз";
  if (n.type === "story_view") return "посмотрел(а) твою видеоисторию 🎬";
  return "просматривал(а) твой профиль";
}

export function NotificationsSheet({ onClose, onOpenChat }: {
  onClose: () => void;
  onOpenChat?: (matchId: number) => void;
}) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    notificationsApi.list()
      .then(d => setItems(d.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
    notificationsApi.markRead().catch(() => {});
  }, []);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await notificationsApi.clearAll();
      setItems([]);
    } catch { void 0; }
    finally { setClearing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="mt-auto w-full max-h-[85vh] flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: "var(--spark-card)", border: "1px solid var(--spark-divider)" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <h2 className="text-white font-bold text-lg">Уведомления</h2>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="flex items-center gap-1.5 text-white/40 hover:text-red-400 transition-colors text-xs disabled:opacity-50">
                {clearing
                  ? <Icon name="Loader2" size={14} className="animate-spin" />
                  : <Icon name="Trash2" size={14} />}
                Очистить
              </button>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,45,120,0.1)" }}>
                <Icon name="Bell" size={28} className="text-pink-400" />
              </div>
              <p className="text-white font-semibold">Пока тихо</p>
              <p className="text-white/40 text-sm leading-relaxed">Здесь появятся лайки, просмотры профиля и новые сообщения</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="flex flex-col">
              {items.map((n, i) => (
                <button
                  key={i}
                  onClick={() => { if (n.type === "message" && n.match_id && onOpenChat) { onClose(); onOpenChat(n.match_id); } }}
                  className="flex items-center gap-3 px-5 py-3.5 active:bg-white/5 transition-colors text-left"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="relative flex-shrink-0">
                    <img src={n.photo_url || FALLBACK} className="w-11 h-11 rounded-full object-cover" style={{ border: "2px solid rgba(255,255,255,0.1)" }} />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <NotifIcon type={n.type} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{n.name}</p>
                    <p className="text-white/50 text-xs mt-0.5 truncate">{notifText(n)}</p>
                  </div>
                  <span className="text-white/25 text-xs flex-shrink-0">{timeAgo(n.created_at)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsSheet;