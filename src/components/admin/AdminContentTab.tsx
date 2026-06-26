import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminContentPost, type AdminContentPhoto } from "@/lib/api";

const WARNING_PRESETS = [
  "⚠️ Ваш контент нарушает правила приложения — публикация материалов 18+ запрещена. Пожалуйста, соблюдайте правила сообщества.",
  "⚠️ Фото профиля удалено модератором. Контент 18+ недопустим на платформе LoveBloom. Повторное нарушение может привести к блокировке.",
  "⚠️ Ваш пост был удалён за нарушение правил. Публикация откровенных материалов запрещена условиями использования сервиса.",
];

function WarningDialog({
  userId, userName, onConfirm, onCancel,
}: { userId: number; userName: string; onConfirm: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(WARNING_PRESETS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-5 flex flex-col gap-4"
        style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,165,0,0.25)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,165,0,0.12)" }}>
            <Icon name="MessageSquareWarning" size={20} className="text-orange-400" />
          </div>
          <div>
            <p className="text-white font-bold">Написать предупреждение</p>
            <p className="text-white/40 text-xs">Пользователю: {userName}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Быстрые шаблоны</p>
          {WARNING_PRESETS.map((p, i) => (
            <button key={i} onClick={() => setText(p)}
              className="text-left text-xs px-3 py-2 rounded-xl transition-all"
              style={{
                background: text === p ? "rgba(255,165,0,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${text === p ? "rgba(255,165,0,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: text === p ? "#FFA500" : "rgba(255,255,255,0.5)",
              }}>
              {p.slice(0, 80)}…
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Текст сообщения</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/50 transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            Отмена
          </button>
          <button onClick={() => onConfirm(text)}
            disabled={!text.trim()}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post, token, onDeleted, onWarn,
}: { post: AdminContentPost; token: string; onDeleted: (id: number) => void; onWarn: (userId: number, name: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить пост от ${post.user_name}?`)) return;
    setDeleting(true);
    try {
      await adminApi.deletePost(token, post.id);
      onDeleted(post.id);
    } catch (e) {
      alert("Ошибка: " + (e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <img src={post.photo_url} alt="" className="w-full object-cover" style={{ maxHeight: 280 }} />
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {post.user_photo
            ? <img src={post.user_photo} className="w-7 h-7 rounded-full object-cover" />
            : <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,45,120,0.2)" }}><Icon name="User" size={14} className="text-pink-400" /></div>}
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{post.user_name}</p>
            {post.username && <p className="text-white/35 text-xs">@{post.username}</p>}
          </div>
          <p className="text-white/25 text-xs flex-shrink-0">{new Date(post.created_at).toLocaleDateString("ru")}</p>
        </div>
        {post.caption && <p className="text-white/60 text-xs leading-relaxed">{post.caption}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
            <Icon name={deleting ? "Loader2" : "Trash2"} size={13} className={deleting ? "animate-spin" : ""} />
            Удалить пост
          </button>
          <button onClick={() => onWarn(post.user_id, post.user_name)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
            <Icon name="MessageSquareWarning" size={13} />
            Предупреждение
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoCard({
  photo, token, onDeleted, onWarn,
}: { photo: AdminContentPhoto; token: string; onDeleted: (url: string) => void; onWarn: (userId: number, name: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить фото профиля ${photo.user_name}?`)) return;
    setDeleting(true);
    try {
      await adminApi.deleteProfilePhoto(token, photo.user_id, photo.photo_url, photo.type);
      onDeleted(photo.photo_url);
    } catch (e) {
      alert("Ошибка: " + (e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="relative">
        <img src={photo.photo_url} alt="" className="w-full object-cover" style={{ maxHeight: 280 }} />
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: photo.type === "cover" ? "rgba(155,89,182,0.85)" : "rgba(59,130,246,0.85)", color: "white" }}>
          {photo.type === "cover" ? "Обложка" : "Галерея"}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {photo.user_photo
            ? <img src={photo.user_photo} className="w-7 h-7 rounded-full object-cover" />
            : <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,45,120,0.2)" }}><Icon name="User" size={14} className="text-pink-400" /></div>}
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{photo.user_name}</p>
            {photo.username && <p className="text-white/35 text-xs">@{photo.username}</p>}
          </div>
          <p className="text-white/25 text-xs flex-shrink-0">{new Date(photo.created_at).toLocaleDateString("ru")}</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
            <Icon name={deleting ? "Loader2" : "Trash2"} size={13} className={deleting ? "animate-spin" : ""} />
            Удалить фото
          </button>
          <button onClick={() => onWarn(photo.user_id, photo.user_name)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
            <Icon name="MessageSquareWarning" size={13} />
            Предупреждение
          </button>
        </div>
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
  const [warnSending, setWarnSending] = useState(false);
  const [warnSuccess, setWarnSuccess] = useState<string | null>(null);

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
    setPage(1);
    setHasMore(true);
    setPosts([]);
    setPhotos([]);
    load(true);
  }, [tab]);

  const handleWarnConfirm = async (text: string) => {
    if (!warnTarget) return;
    setWarnSending(true);
    try {
      await adminApi.sendWarning(token, warnTarget.userId, text);
      setWarnSuccess(`Предупреждение отправлено пользователю ${warnTarget.name}`);
      setWarnTarget(null);
      setTimeout(() => setWarnSuccess(null), 3000);
    } catch (e) {
      alert("Ошибка: " + (e as Error).message);
    } finally {
      setWarnSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {warnTarget && (
        <WarningDialog
          userId={warnTarget.userId}
          userName={warnTarget.name}
          onConfirm={handleWarnConfirm}
          onCancel={() => setWarnTarget(null)}
        />
      )}

      {warnSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg"
          style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", whiteSpace: "nowrap" }}>
          ✓ {warnSuccess}
        </div>
      )}

      {/* Заголовок */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.2),rgba(249,115,22,0.2))" }}>
          <Icon name="ShieldAlert" size={20} className="text-orange-400" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">Модерация контента</p>
          <p className="text-white/40 text-xs">Посты и фото профилей • удаление и предупреждения</p>
        </div>
      </div>

      {/* Переключатель */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
        {([
          { id: "posts", label: "Посты", icon: "Image" },
          { id: "photos", label: "Фото профилей", icon: "UserSquare" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === t.id
              ? { background: "linear-gradient(135deg,#ef4444,#f97316)", color: "white" }
              : { color: "rgba(255,255,255,0.4)" }}>
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      {loading && (posts.length === 0 && photos.length === 0) ? (
        <div className="flex justify-center py-12">
          <Icon name="Loader2" size={32} className="text-white/20 animate-spin" />
        </div>
      ) : tab === "posts" ? (
        <>
          {posts.length === 0
            ? <p className="text-white/30 text-sm text-center py-8">Постов нет</p>
            : <div className="grid grid-cols-1 gap-3">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} token={token}
                    onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
                    onWarn={(userId, name) => setWarnTarget({ userId, name })} />
                ))}
              </div>}
          {hasMore && (
            <button onClick={() => load()} disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white/50 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {loading ? <Icon name="Loader2" size={16} className="animate-spin mx-auto" /> : "Загрузить ещё"}
            </button>
          )}
        </>
      ) : (
        <>
          {photos.length === 0
            ? <p className="text-white/30 text-sm text-center py-8">Фото нет</p>
            : <div className="grid grid-cols-1 gap-3">
                {photos.map((photo, i) => (
                  <PhotoCard key={`${photo.user_id}-${i}`} photo={photo} token={token}
                    onDeleted={url => setPhotos(prev => prev.filter(p => p.photo_url !== url))}
                    onWarn={(userId, name) => setWarnTarget({ userId, name })} />
                ))}
              </div>}
          {hasMore && (
            <button onClick={() => load()} disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white/50 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {loading ? <Icon name="Loader2" size={16} className="animate-spin mx-auto" /> : "Загрузить ещё"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
