import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { postsApi, liveApi, type Post, type PostComment, type LiveStream, type User } from "@/lib/api";

// ─── DeleteConfirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel, loading }: {
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="px-5 pb-2 flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
            style={{ background: "rgba(239,68,68,0.12)" }}>
            <Icon name="Trash2" size={24} style={{ color: "#F87171" }} />
          </div>
          <p className="text-white font-bold text-base">Удалить публикацию?</p>
          <p className="text-white/40 text-sm">Это действие нельзя отменить. Фото и комментарии будут удалены.</p>
        </div>
        <div className="px-5 pb-8 pt-5 flex flex-col gap-2.5">
          <button onClick={onConfirm} disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#EF4444,#B91C1C)" }}>
            {loading ? "Удаляем..." : "Удалить"}
          </button>
          <button onClick={onCancel}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white/60 glass-card">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

function timeAgo(dt: string) {
  const d = (Date.now() - new Date(dt).getTime()) / 1000;
  if (d < 60) return "только что";
  if (d < 3600) return `${Math.floor(d / 60)} мин назад`;
  if (d < 86400) return `${Math.floor(d / 3600)} ч назад`;
  return `${Math.floor(d / 86400)} дн назад`;
}

// ─── LiveBadge ────────────────────────────────────────────────────────────────
function LiveBadge({ streams, onJoin }: { streams: LiveStream[]; onJoin: (s: LiveStream) => void }) {
  if (streams.length === 0) return null;
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
        <span className="text-white/60 text-xs font-medium">В эфире сейчас</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {streams.map((s) => (
          <button key={s.id} onClick={() => onJoin(s)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden"
                style={{ border: "2px solid #EF4444", boxShadow: "0 0 0 2px rgba(239,68,68,0.3)" }}>
                <img src={s.author_photo || FALLBACK_PHOTO} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                LIVE
              </div>
            </div>
            <span className="text-white/70 text-[10px] max-w-[60px] truncate">{s.author_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── TrendingBadge ────────────────────────────────────────────────────────────
function TrendingBadge({ posts }: { posts: Post[] }) {
  const top = posts.slice().sort((a, b) => b.likes_count - a.likes_count).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="TrendingUp" size={13} className="text-orange-400" />
        <span className="text-white/60 text-xs font-medium">В тренде</span>
      </div>
      <div className="flex gap-2">
        {top.map((p) => (
          <div key={p.id} className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ width: 80, height: 80 }}>
            <img src={p.photo_url} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-1"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
              <Icon name="Heart" size={10} style={{ color: "#FF2D78" }} />
              <span className="text-white text-[9px] font-bold">{p.likes_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CommentSheet ─────────────────────────────────────────────────────────────
function CommentSheet({ post, onClose }: { post: Post; onClose: () => void }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    postsApi.getComments(post.id)
      .then((r) => setComments(r.comments))
      .catch(() => {})
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [post.id]);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim(); setText("");
    try {
      const r = await postsApi.addComment(post.id, t);
      setComments((c) => [...c, r.comment]);
    } catch (e: unknown) { void e; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="w-full max-w-sm flex flex-col animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "75dvh" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-sm">Комментарии · {comments.length}</h3>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
          {loading && <p className="text-white/30 text-xs text-center py-4">Загружаем...</p>}
          {!loading && comments.length === 0 && (
            <p className="text-white/30 text-xs text-center py-4">Пока нет комментариев. Напиши первым!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <img src={c.author_photo || FALLBACK_PHOTO} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
              <div>
                <div className="glass-card px-3 py-2">
                  <span className="text-pink-400 text-xs font-semibold">{c.author_name} </span>
                  <span className="text-white/80 text-sm">{c.text}</span>
                </div>
                <p className="text-white/30 text-[10px] mt-1 px-1">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Написать комментарий..."
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
          <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onComment, onDelete }: {
  post: Post;
  currentUserId: number;
  onLike: (p: Post) => void;
  onComment: (p: Post) => void;
  onDelete: (p: Post) => void;
}) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [count, setCount] = useState(post.likes_count);
  const [bouncing, setBouncing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwn = post.user_id === currentUserId;

  const handleLike = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);
    const next = !liked;
    setLiked(next);
    setCount((c) => next ? c + 1 : c - 1);
    onLike(post);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postsApi.deletePost(post.id);
      onDelete(post);
    } catch (e: unknown) { void e; }
    finally { setDeleting(false); setShowConfirm(false); }
  };

  return (
    <>
      {showConfirm && (
        <DeleteConfirm
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}
      <div className="flex flex-col" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Author row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative">
            <img src={post.author_photo || FALLBACK_PHOTO}
              className="w-9 h-9 rounded-full object-cover"
              style={{ border: "2px solid rgba(255,45,120,0.5)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{post.author_name}</p>
            <p className="text-white/40 text-[10px]">{timeAgo(post.created_at)}</p>
          </div>
          {isOwn && (
            <button onClick={() => setShowConfirm(true)}
              className="p-1.5 text-white/30 hover:text-white/70 transition-colors">
              <Icon name="Trash2" size={16} />
            </button>
          )}
        </div>

        {/* Photo */}
        <div className="relative" onDoubleClick={handleLike}>
          <img src={post.photo_url} className="w-full object-cover" style={{ maxHeight: 400 }} />
        </div>

        {/* Actions */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-5">
          <button onClick={handleLike}
            className="flex items-center gap-1.5 transition-all"
            style={{ transform: bouncing ? "scale(1.25)" : "scale(1)", transition: "transform 0.2s" }}>
            <Icon name="Heart" size={24}
              style={{ color: liked ? "#FF2D78" : "rgba(255,255,255,0.6)", fill: liked ? "#FF2D78" : "transparent", transition: "color 0.2s, fill 0.2s" }} />
            <span className="text-white/60 text-sm font-medium">{count}</span>
          </button>
          <button onClick={() => onComment(post)} className="flex items-center gap-1.5">
            <Icon name="MessageCircle" size={22} className="text-white/60" />
            <span className="text-white/60 text-sm font-medium">{post.comments_count}</span>
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 pb-3">
            <span className="text-white font-semibold text-sm">{post.author_name} </span>
            <span className="text-white/70 text-sm">{post.caption}</span>
          </div>
        )}

        {!post.caption && <div className="pb-2" />}
      </div>
    </>
  );
}

// ─── CreateMenu ───────────────────────────────────────────────────────────────
function CreateMenu({ onPhoto, onStory, onLive, onClose }: {
  onPhoto: () => void;
  onStory: () => void;
  onLive: () => void;
  onClose: () => void;
}) {
  const items = [
    { icon: "Image", label: "Опубликовать фото", sub: "Поделись моментом", action: onPhoto, color: "#FF2D78" },
    { icon: "Film", label: "Видеоистория", sub: "Короткое видео на 24 часа", action: onStory, color: "#9B59B6" },
    { icon: "Radio", label: "Начать Live", sub: "Прямой эфир для всех", action: onLive, color: "#EF4444" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />
        <p className="text-white/40 text-xs uppercase tracking-widest px-5 mb-3">Создать</p>
        <div className="flex flex-col pb-8">
          {items.map((item) => (
            <button key={item.label}
              onClick={() => { item.action(); onClose(); }}
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}22` }}>
                <Icon name={item.icon as "Image" | "Film" | "Radio"} size={20} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export function HomeScreen({ currentUser, onGoLive }: {
  currentUser: User;
  onGoLive: () => void;
  onGoPhotos?: () => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showStoryMsg, setShowStoryMsg] = useState(false);

  // Публикация фото прямо с главного экрана
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [captionFor, setCaptionFor] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      postsApi.getFeed().then((d) => setPosts(d.posts)).catch(() => {}),
      liveApi.list().then((d) => setStreams(d.streams)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleLike = async (post: Post) => {
    try {
      const res = await postsApi.like(post.id);
      setPosts((prev) => prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: res.liked, likes_count: res.likes_count } : p
      ));
    } catch (e: unknown) { void e; }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCaptionFor(ev.target?.result as string); setCaption(""); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePublish = async () => {
    if (!captionFor) return;
    setUploading(true);
    try {
      const mimeMatch = captionFor.match(/data:(image\/\w+);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const res = await postsApi.create(captionFor, mime, caption);
      setPosts((prev) => [{
        ...res.post,
        author_name: currentUser.name,
        author_photo: currentUser.photo_url,
        likes_count: 0,
        liked_by_me: false,
        comments_count: 0,
      }, ...prev]);
      setCaptionFor(null); setCaption("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally { setUploading(false); }
  };

  return (
    <>
      {/* Скрытый input для выбора файла */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

      {/* Модалка публикации */}
      {captionFor && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm animate-slide-up flex flex-col"
            style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "90dvh" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setCaptionFor(null)} className="text-white/50 text-sm">Отмена</button>
              <h3 className="text-white font-bold text-sm">Новое фото</h3>
              <button onClick={handlePublish} disabled={uploading} className="btn-grad px-4 py-1.5 text-sm">
                {uploading ? "..." : "Опубликовать"}
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
              <img src={captionFor} className="w-full rounded-2xl object-cover max-h-72" />
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
                placeholder="Добавь подпись..." rows={3} maxLength={200}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos resize-none" />
            </div>
          </div>
        </div>
      )}

      {commentPost && (
        <CommentSheet post={commentPost} onClose={() => setCommentPost(null)} />
      )}
      {showCreate && (
        <CreateMenu
          onPhoto={() => fileInputRef.current?.click()}
          onStory={() => setShowStoryMsg(true)}
          onLive={onGoLive}
          onClose={() => setShowCreate(false)}
        />
      )}
      {showStoryMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8"
          style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShowStoryMsg(false)}>
          <div className="glass-card p-6 flex flex-col items-center gap-3 text-center"
            onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl">🎬</div>
            <p className="text-white font-bold">Видеоистории скоро!</p>
            <p className="text-white/50 text-sm">Функция находится в разработке и появится в следующем обновлении.</p>
            <button onClick={() => setShowStoryMsg(false)} className="btn-grad px-6 py-2 text-sm font-semibold">Понятно</button>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/51fe4ec6-6465-42e1-b1ed-df2cd706037f.jpg"
              className="w-8 h-8 rounded-xl object-cover" />
            <h1 className="font-unbounded text-white text-xl font-black grad-text">LoveBloom</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
            <Icon name="Plus" size={20} className="text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && (
            <>
              {/* Live streams */}
              <LiveBadge streams={streams} onJoin={() => onGoLive()} />

              {/* Trending */}
              {posts.length > 0 && <TrendingBadge posts={posts} />}

              {/* Divider */}
              {(streams.length > 0 || posts.length > 0) && (
                <div className="mx-4 mb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
              )}

              {/* Feed */}
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-8">
                  <div className="text-6xl">📸</div>
                  <p className="text-white/50 text-sm text-center">
                    Лента пока пуста.<br />Публикуй фото во вкладке «Фото» — они появятся здесь!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser.id}
                    onLike={handleLike}
                    onComment={(p) => setCommentPost(p)}
                    onDelete={(p) => setPosts((prev) => prev.filter((x) => x.id !== p.id))}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}