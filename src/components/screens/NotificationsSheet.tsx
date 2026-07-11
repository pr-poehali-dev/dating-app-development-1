import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { notificationsApi, type Notification } from "@/lib/api";
import { UserAvatar } from "@/components/ui/UserAvatar";

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
  if (type === "admin_report_resolved") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.2)" }}><Icon name="ShieldCheck" size={13} style={{ color: "#4ADE80" }} /></div>;
  if (type === "admin_report_dismissed") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(107,114,128,0.2)" }}><Icon name="ShieldOff" size={13} style={{ color: "#9CA3AF" }} /></div>;
  if (type === "admin_post_removed") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.2)" }}><Icon name="Trash2" size={13} style={{ color: "#F87171" }} /></div>;
  if (type === "admin_post_kept") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}><Icon name="CheckCircle" size={13} style={{ color: "#4ADE80" }} /></div>;
  if (type === "premium_activated") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF2D78,#FCD34D)" }}><span style={{ fontSize: 12 }}>✨</span></div>;
  if (type === "admin_broadcast") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(155,89,182,0.2)" }}><Icon name="Megaphone" size={13} style={{ color: "#C084FC" }} /></div>;
  if (type === "admin_warning") return <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.2)" }}><Icon name="AlertTriangle" size={13} style={{ color: "#F87171" }} /></div>;
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
  if (n.type === "admin_report_resolved") return "✅ Твоя жалоба рассмотрена — меры приняты";
  if (n.type === "admin_report_dismissed") return "⚪ Твоя жалоба рассмотрена — нарушений не выявлено";
  if (n.type === "admin_post_removed") return "🚫 Администрация удалила твой пост из ленты за нарушение правил";
  if (n.type === "admin_post_kept") return "ℹ️ Жалоба на твой пост рассмотрена — пост оставлен в ленте";
  if (n.type === "admin_warning") return n.text || "⚠️ Предупреждение от Полутон";
  if (n.type === "admin_broadcast") return n.text || "Сообщение от администрации";
  if (n.type === "premium_activated") {
    if (n.text) {
      const [planLabel, until] = n.text.split("|");
      return `Premium активирован на ${planLabel}${until ? ` · до ${until}` : ""}`;
    }
    return "✨ Premium подписка активирована!";
  }
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
              {items.map((n, i) => {
                // Специальная карточка Premium
                if (n.type === "premium_activated") {
                  const [planLabel, until] = (n.text || "").split("|");
                  return (
                    <div key={i} className="mx-4 my-2 rounded-2xl overflow-hidden"
                      style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.15),rgba(155,89,182,0.18),rgba(252,211,77,0.08))", border: "1px solid rgba(255,45,120,0.3)" }}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <img
                          src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/587a9205-cc85-4487-9fa6-283c2ecfcba0.jpg"
                          className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
                          style={{ boxShadow: "0 4px 16px rgba(255,45,120,0.4)" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">LoveBloom Premium активирован</p>
                          <p className="text-white/60 text-xs mt-0.5">
                            {planLabel ? `Подписка на ${planLabel}` : "Подписка активна"}
                            {until ? ` · до ${until}` : ""}
                          </p>
                        </div>
                        <span className="text-white/25 text-xs flex-shrink-0">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  );
                }

                const isSystem = ["admin_report_resolved","admin_report_dismissed","admin_post_removed","admin_post_kept","admin_broadcast","verif_approved","verif_rejected"].includes(n.type);
                return (
                  <button
                    key={i}
                    onClick={() => { if (n.type === "message" && n.match_id && onOpenChat) { onClose(); onOpenChat(n.match_id); } }}
                    className="flex items-center gap-3 px-5 py-3.5 active:bg-white/5 transition-colors text-left"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="relative flex-shrink-0">
                      {isSystem ? (
                        <img
                          src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/587a9205-cc85-4487-9fa6-283c2ecfcba0.jpg"
                          className="w-11 h-11 rounded-full object-cover"
                          style={{ border: "2px solid rgba(255,45,120,0.3)" }}
                        />
                      ) : (
                        <UserAvatar src={n.photo_url} className="w-11 h-11 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.1)" }} />
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <NotifIcon type={n.type} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {isSystem ? "Администрация" : n.name}
                      </p>
                      <p className="text-white/50 text-xs mt-0.5 truncate">{notifText(n)}</p>
                    </div>
                    <span className="text-white/25 text-xs flex-shrink-0">{timeAgo(n.created_at)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsSheet;