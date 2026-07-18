import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminContentPost, type AdminContentPhoto } from "@/lib/api";

const WARNING_TEXT = "⚠️ Ваш контент нарушает правила приложения — публикация материалов 18+ запрещена. Пожалуйста, соблюдайте правила сообщества.";

const WARNING_PRESETS = [
  WARNING_TEXT,
  "⚠️ Фото профиля удалено модератором. Контент 18+ недопустим на платформе Полутон. Повторное нарушение приведёт к блокировке.",
  "⚠️ Ваш пост был удалён за нарушение правил. Публикация откровенных материалов запрещена условиями использования сервиса.",
];

function WarningDialog({ userName, onConfirm, onCancel }: {
  userName: string;
  onConfirm: (text: string) => void; onCancel: () => void;
}) {
  const [text, setText] = useState(WARNING_PRESETS[0]);
  const [sel, setSel] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-4 sm:pb-0"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}>
      <div className="w-full max-w-md rounded-3xl p-4 flex flex-col gap-3"
        style={{ background: "#1a1030", border: "1px solid rgba(249,115,22,0.3)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="MessageSquareWarning" size={18} className="text-orange-400" />
            <p className="text-white font-bold text-sm">Предупреждение → {userName}</p>
          </div>
          <button onClick={onCancel} className="text-white/30 hover:text-white/60"><Icon name="X" size={16} /></button>
        </div>

        <div className="flex flex-col gap-1.5">
          {WARNING_PRESETS.map((p, i) => (
            <button key={i} onClick={() => { setSel(i); setText(p); }}
              className="text-left text-xs px-3 py-2 rounded-xl leading-relaxed transition-all"
              style={{
                background: sel === i ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${sel === i ? "rgba(249,115,22,0.35)" : "rgba(255,255,255,0.07)"}`,
                color: sel === i ? "#fb923c" : "rgba(255,255,255,0.45)",
              }}>
              {p.slice(0, 90)}…
            </button>
          ))}
        </div>

        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          className="w-full rounded-xl px-3 py-2 text-xs text-white resize-none outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/40 transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.05)" }}>Отмена</button>
          <button onClick={() => onConfirm(text)} disabled={!text.trim()}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
            Отправить в чат
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionBar({ onDelete, onWarn, deleting }: {
  onDelete: () => void; onWarn: () => void; deleting: boolean;
}) {
  return (
    <div className="flex gap-1.5 p-2 pt-0">
      <button onClick={onDelete} disabled={deleting}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50"
        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
        <Icon name={deleting ? "Loader2" : "Trash2"} size={11} className={deleting ? "animate-spin" : ""} />
        Удалить
      </button>
      <button onClick={onWarn}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
        style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c" }}>
        <Icon name="MessageSquareWarning" size={11} />
        Предупредить
      </button>
    </div>
  );
}

function PostCard({ post, token, onDeleted, onWarn }: {
  post: AdminContentPost; token: string;
  onDeleted: (id: number) => void; onWarn: (userId: number, name: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить пост от ${post.user_name}?`)) return;
    setDeleting(true);
    try { await adminApi.deletePost(token, post.id); onDeleted(post.id); }
    catch (e) { alert((e as Error).message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="relative">
        <img src={post.photo_url} alt="" className="w-full object-cover" style={{ height: 160 }} />
        <div className="absolute bottom-0 inset-x-0 px-2 pb-1.5 pt-4"
          style={{ background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)" }}>
          <div className="flex items-center gap-1.5">
            {post.user_photo
              ? <img src={post.user_photo} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              : <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0"><Icon name="User" size={10} className="text-pink-400" /></div>}
            <p className="text-white text-xs font-semibold truncate">{post.user_name}</p>
            <p className="text-white/35 text-[10px] ml-auto flex-shrink-0">{new Date(post.created_at).toLocaleDateString("ru")}</p>
          </div>
        </div>
      </div>
      {post.caption && <p className="text-white/50 text-[11px] px-2 py-1.5 leading-relaxed line-clamp-2">{post.caption}</p>}
      <div className="mt-auto">
        <ActionBar onDelete={handleDelete} onWarn={() => onWarn(post.user_id, post.user_name)} deleting={deleting} />
      </div>
    </div>
  );
}

function PhotoCard({ photo, token, onDeleted, onWarn }: {
  photo: AdminContentPhoto; token: string;
  onDeleted: (url: string) => void; onWarn: (userId: number, name: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить фото ${photo.user_name}?`)) return;
    setDeleting(true);
    try { await adminApi.deleteProfilePhoto(token, photo.user_id, photo.photo_url, photo.type); onDeleted(photo.photo_url); }
    catch (e) { alert((e as Error).message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="relative">
        <img src={photo.photo_url} alt="" className="w-full object-cover" style={{ height: 160 }} />
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: photo.type === "cover" ? "rgba(155,89,182,0.85)" : "rgba(59,130,246,0.85)", color: "white" }}>
          {photo.type === "cover" ? "Обложка" : "Галерея"}
        </span>
        <div className="absolute bottom-0 inset-x-0 px-2 pb-1.5 pt-4"
          style={{ background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)" }}>
          <div className="flex items-center gap-1.5">
            {photo.user_photo
              ? <img src={photo.user_photo} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              : <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0"><Icon name="User" size={10} className="text-pink-400" /></div>}
            <p className="text-white text-xs font-semibold truncate">{photo.user_name}</p>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <ActionBar onDelete={handleDelete} onWarn={() => onWarn(photo.user_id, photo.user_name)} deleting={deleting} />
      </div>
    </div>
  );
}

export function AdminContentTab({ token }: { token: string }) {
  const [tab, setTab] = useState<"posts" | "photos">("posts");
  const [posts, setPosts] = useState<AdminContentPost[]>([]);
  const [photos, setPhotos] = useState<AdminContentPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [warnTarget, setWarnTarget] = useState<{ userId: number; name: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = async (reset = false) => {
    setLoading(true);
    const p = reset ? 1 : page;
    try {
      if (tab === "posts") {
        const data = await adminApi.contentPosts(token, p);
        setPosts(prev => reset ? data.posts : [...prev, ...data.posts]);
        setHasMore(data.posts.length === 20);
      } else {
        const data = await adminApi.contentPhotos(token, p);
        setPhotos(prev => reset ? data.photos : [...prev, ...data.photos]);
        setHasMore(data.photos.length === 20);
      }
      if (!reset) setPage(p + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); setHasMore(true); setPosts([]); setPhotos([]);
    load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleWarnConfirm = async (text: string) => {
    if (!warnTarget) return;
    try {
      await adminApi.sendWarning(token, warnTarget.userId, text);
      showToast(`✓ Предупреждение отправлено ${warnTarget.name}`);
      setWarnTarget(null);
    } catch (e) { alert((e as Error).message); }
  };

  const items = tab === "posts" ? posts : photos;

  return (
    <div className="flex flex-col gap-3">
      {warnTarget && (
        <WarningDialog userName={warnTarget.name}
          onConfirm={handleWarnConfirm} onCancel={() => setWarnTarget(null)} />
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-xl"
          style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-0.5 rounded-xl flex-1" style={{ background: "rgba(255,255,255,0.05)" }}>
          {([
            { id: "posts", label: "Посты", icon: "Image" },
            { id: "photos", label: "Фото", icon: "UserSquare" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all"
              style={tab === t.id
                ? { background: "linear-gradient(135deg,#ef4444,#f97316)", color: "white" }
                : { color: "rgba(255,255,255,0.35)" }}>
              <Icon name={t.icon} size={12} />{t.label}
            </button>
          ))}
        </div>
        <div className="text-white/25 text-xs px-2">{items.length} шт</div>
      </div>

      {/* Grid */}
      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Icon name="Loader2" size={28} className="text-white/20 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-white/25 text-sm text-center py-12">Нет контента</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {tab === "posts"
            ? (posts as AdminContentPost[]).map(post => (
                <PostCard key={post.id} post={post} token={token}
                  onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
                  onWarn={(uid, name) => setWarnTarget({ userId: uid, name })} />
              ))
            : (photos as AdminContentPhoto[]).map((photo, i) => (
                <PhotoCard key={`${photo.user_id}-${i}`} photo={photo} token={token}
                  onDeleted={url => setPhotos(prev => prev.filter(p => p.photo_url !== url))}
                  onWarn={(uid, name) => setWarnTarget({ userId: uid, name })} />
              ))}
        </div>
      )}

      {hasMore && items.length > 0 && (
        <button onClick={() => load()} disabled={loading}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/40 transition-all active:scale-95 disabled:opacity-40 mt-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {loading ? <Icon name="Loader2" size={14} className="animate-spin mx-auto" /> : "Загрузить ещё"}
        </button>
      )}
    </div>
  );
}