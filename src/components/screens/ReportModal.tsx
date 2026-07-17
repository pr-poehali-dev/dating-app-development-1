import { useState } from "react";
import Icon from "@/components/ui/icon";
import { authApi, blocksApi, type Profile } from "@/lib/api";

const PROFILES_FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1ce048c9-36f3-4eb8-a0bc-4117b2b48365.jpg";

// ─── ReportModal ──────────────────────────────────────────────────────────────
export function ReportModal({ userId, userName, onClose }: { userId: number; userName: string; onClose: () => void }) {
  const REASONS = [
    { value: "fake", label: "Фейковый аккаунт" },
    { value: "spam", label: "Спам" },
    { value: "abuse", label: "Оскорбления" },
    { value: "photo", label: "Неприемлемые фото" },
    { value: "other", label: "Другое" },
  ];
  const [reason, setReason] = useState("fake");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      await authApi.sendReport(userId, reason, comment);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2, #1a1625)", borderRadius: "28px 28px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-golos font-bold text-base">Пожаловаться на {userName}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-5 py-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(74,222,128,0.15)" }}>
              <Icon name="Check" size={26} className="text-green-400" />
            </div>
            <p className="text-white font-semibold">Жалоба отправлена</p>
            <p className="text-white/40 text-sm text-center">Мы рассмотрим её в ближайшее время</p>
            <button onClick={onClose} className="btn-grad px-8 py-2.5 text-sm font-semibold mt-2">Закрыть</button>
          </div>
        ) : (
          <div className="px-5 py-4 flex flex-col gap-4 pb-8">
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <button key={r.value} onClick={() => setReason(r.value)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                  style={reason === r.value
                    ? { background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.4)" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: reason === r.value ? "#FF2D78" : "rgba(255,255,255,0.3)" }}>
                    {reason === r.value && <div className="w-2 h-2 rounded-full" style={{ background: "#FF2D78" }} />}
                  </div>
                  <span className="text-white/80 text-sm">{r.label}</span>
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительный комментарий (необязательно)" rows={3} maxLength={500}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos resize-none" />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={submit} disabled={loading} className="btn-grad py-3.5 text-sm font-semibold disabled:opacity-50">
              {loading ? "Отправляем..." : "Отправить жалобу"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProfileMenuSheet ─────────────────────────────────────────────────────────
export function ProfileMenuSheet({ profile, onClose, onReport }: {
  profile: Profile; onClose: () => void; onReport: () => void;
}) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [videoBlocked, setVideoBlocked] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const shareProfile = () => {
    const url = `${window.location.origin}/?user=${profile.id}`;
    if (navigator.share) navigator.share({ title: profile.name, url });
    else { navigator.clipboard?.writeText(url); showToast("Ссылка скопирована!"); }
    onClose();
  };

  const items = [
    {
      icon: "Ban", label: blocked ? "Разблокировать" : "Заблокировать профиль",
      sub: blocked ? "Снять блокировку" : "Пользователь не увидит тебя",
      danger: !blocked,
      action: () => {
        const wasBlocked = blocked;
        setBlocked(v => !v);
        if (wasBlocked) {
          blocksApi.unblock(profile.id).catch(() => setBlocked(true));
          showToast("Разблокировано");
        } else {
          blocksApi.block(profile.id).catch(() => setBlocked(false));
          showToast("Профиль заблокирован");
        }
      }
    },
    {
      icon: "VideoOff", label: videoBlocked ? "Разрешить видеочаты" : "Блокировать видеочаты",
      sub: videoBlocked ? "Видеозвонки снова доступны" : "Запретить входящие видеозвонки",
      danger: false,
      action: () => { setVideoBlocked(v => !v); showToast(videoBlocked ? "Видеочаты разрешены" : "Видеочаты заблокированы"); }
    },
    {
      icon: "Flag", label: "Пожаловаться",
      sub: "Сообщить о нарушении правил",
      danger: true,
      action: () => { onClose(); setTimeout(onReport, 100); }
    },
    {
      icon: "StickyNote", label: "Добавить заметку",
      sub: "Личная заметка — видна только тебе",
      danger: false,
      action: () => setShowNote(true)
    },
    {
      icon: "Share2", label: "Поделиться профилем",
      sub: "Отправить ссылку на анкету",
      danger: false,
      action: shareProfile
    },
  ];

  if (showNote) return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={() => setShowNote(false)}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-sm">Заметка о {profile.name}</h3>
          <button onClick={() => setShowNote(false)}><Icon name="X" size={18} className="text-white/40" /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3 pb-8">
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Личная заметка — видна только тебе..." rows={4} maxLength={300}
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos resize-none" />
          <button onClick={() => { showToast("Заметка сохранена!"); setShowNote(false); onClose(); }}
            className="btn-grad py-3 text-sm font-semibold">Сохранить</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <img src={profile.photo_url || PROFILES_FALLBACK_PHOTO} className="w-9 h-9 rounded-full object-cover" />
          <div>
            <p className="text-white font-semibold text-sm">{profile.name}{profile.age ? `, ${profile.age}` : ""}</p>
            <p className="text-white/40 text-xs">{profile.city || ""}</p>
          </div>
        </div>
        <div className="flex flex-col pb-8">
          {items.map((item) => (
            <button key={item.label} onClick={item.action}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.danger ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.07)" }}>
                <Icon name={item.icon as "Ban"|"VideoOff"|"Flag"|"StickyNote"|"Share2"} size={18}
                  style={{ color: item.danger ? "#F87171" : "rgba(255,255,255,0.6)" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: item.danger ? "#F87171" : "white" }}>{item.label}</p>
                <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-white text-sm font-medium z-[80]"
            style={{ background: "rgba(30,20,50,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}