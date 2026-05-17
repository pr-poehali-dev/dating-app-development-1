import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { postsApi, type User, type Post, type PostComment } from "@/lib/api";
import { ReportModal } from "@/components/screens/SwipeScreens";

// Re-exports
export { LiveScreen } from "@/components/screens/LiveScreen";
export { RealMatchesScreen, RealLikesScreen } from "@/components/screens/MatchesLikesScreens";
export { RealChatScreen } from "@/components/screens/ChatScreen";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ─── PostDetailModal ──────────────────────────────────────────────────────────
function PostDetailModal({ post, currentUserId, onClose, onLike, onAuthorClick }: {
  post: Post; currentUserId: number; onClose: () => void;
  onLike: (post: Post) => void; onAuthorClick: () => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");

  void currentUserId;

  useEffect(() => {
    postsApi.getComments(post.id)
      .then((r) => setComments(r.comments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [post.id]);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim(); setText("");
    try {
      const r = await postsApi.addComment(post.id, t);
      setComments((c) => [...c, r.comment]);
    } catch (e: unknown) { void e; }
  };

  const timeAgo = (dt: string) => {
    const d = (Date.now() - new Date(dt).getTime()) / 1000;
    if (d < 60) return "только что";
    if (d < 3600) return `${Math.floor(d / 60)} мин`;
    if (d < 86400) return `${Math.floor(d / 3600)} ч`;
    return `${Math.floor(d / 86400)} дн`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col" style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0", maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onAuthorClick} className="flex items-center gap-3 flex-1">
            <img src={post.author_photo || FALLBACK_PHOTO} className="w-9 h-9 rounded-full object-cover" style={{ border: "2px solid rgba(255,45,120,0.5)" }} />
            <div className="text-left">
              <p className="text-white font-semibold text-sm">{post.author_name}</p>
              <p className="text-white/40 text-xs">{timeAgo(post.created_at)}</p>
            </div>
          </button>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><Icon name="X" size={20} /></button>
        </div>
        <img src={post.photo_url} className="w-full object-cover" style={{ maxHeight: 320 }} />
        <div className="px-4 pt-3 pb-1 flex items-center gap-4">
          <button onClick={() => onLike(post)} className="flex items-center gap-1.5 transition-all active:scale-90">
            <Icon name="Heart" size={22}
              style={{ color: post.liked_by_me ? "#FF2D78" : "rgba(255,255,255,0.5)", fill: post.liked_by_me ? "#FF2D78" : "transparent" }} />
            <span className="text-white/60 text-sm">{post.likes_count}</span>
          </button>
          <span className="flex items-center gap-1.5 text-white/40 text-sm">
            <Icon name="MessageCircle" size={20} />{comments.length}
          </span>
        </div>
        {post.caption && (
          <div className="px-4 pb-2">
            <span className="text-white font-semibold text-sm">{post.author_name} </span>
            <span className="text-white/70 text-sm">{post.caption}</span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2 min-h-0">
          {loading && <p className="text-white/30 text-xs text-center py-3">Загружаем...</p>}
          {!loading && comments.length === 0 && <p className="text-white/30 text-xs text-center py-3">Пока нет комментариев</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <img src={c.author_photo || FALLBACK_PHOTO} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              <div className="glass-card px-3 py-1.5 flex-1">
                <span className="text-pink-400 text-xs font-semibold">{c.author_name} </span>
                <span className="text-white/80 text-xs">{c.text}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-5 pt-2 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Комментарий..." className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
          <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UserProfileModal ─────────────────────────────────────────────────────────
function UserProfileModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [data, setData] = useState<{ profile: { name: string; age?: number; city?: string; bio?: string; tags?: string[]; photo_url?: string; online?: boolean }; posts: Post[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    postsApi.getUserProfile(userId)
      .then((r) => setData(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <>
      {showReport && data && (
        <ReportModal userId={userId} userName={data.profile.name} onClose={() => setShowReport(false)} />
      )}
      <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--spark-dark)" }}>
        <div className="flex items-center px-4 pt-5 pb-3">
          <button onClick={onClose} className="glass-card p-2 mr-3">
            <Icon name="ChevronLeft" size={20} className="text-white" />
          </button>
          <h2 className="text-white font-golos font-bold text-lg flex-1">Профиль</h2>
          {data && (
            <button onClick={() => setShowReport(true)} className="glass-card p-2">
              <Icon name="Flag" size={17} className="text-white/50" />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        )}

        {data && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center px-5 pb-5">
              <div className="relative mb-3">
                <img src={data.profile.photo_url || FALLBACK_PHOTO}
                  className="w-24 h-24 rounded-full object-cover"
                  style={{ border: "3px solid rgba(255,45,120,0.6)", boxShadow: "0 0 24px rgba(255,45,120,0.25)" }} />
                {data.profile.online && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400"
                    style={{ border: "2px solid var(--spark-dark)" }} />
                )}
              </div>
              <h3 className="text-white font-golos font-bold text-xl">
                {data.profile.name}{data.profile.age ? `, ${data.profile.age}` : ""}
              </h3>
              {data.profile.city && <p className="text-white/50 text-sm mt-0.5 flex items-center gap-1"><Icon name="MapPin" size={13} />{data.profile.city}</p>}
              {data.profile.bio && <p className="text-white/70 text-sm mt-3 text-center px-4 leading-relaxed">{data.profile.bio}</p>}
              {data.profile.tags && data.profile.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {(data.profile.tags as string[]).map((tag) => (
                    <span key={tag} className="glass-card px-3 py-1 text-white/70 text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{data.posts.length}</p>
                  <p className="text-white/40 text-xs">публикаций</p>
                </div>
              </div>
            </div>

            {data.posts.length > 0 && (
              <div className="grid grid-cols-3 gap-0.5">
                {data.posts.map((p) => (
                  <div key={p.id} className="aspect-square overflow-hidden">
                    <img src={p.photo_url} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── PeopleScreen ─────────────────────────────────────────────────────────────
export function PeopleScreen({ currentUser, onOpenChat, onGoToChats, onPremium, isPremium }: {
  currentUser?: User;
  onOpenChat?: (matchId: number) => void;
  onGoToChats?: () => void;
  onPremium?: () => void;
  isPremium?: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [showCaptionFor, setShowCaptionFor] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  void onOpenChat; void onGoToChats; void onPremium; void isPremium;

  useEffect(() => {
    postsApi.getFeed()
      .then((d) => setPosts(d.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setShowCaptionFor(ev.target?.result as string); setCaption(""); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePublish = async () => {
    if (!showCaptionFor) return;
    setUploading(true);
    try {
      const mimeMatch = showCaptionFor.match(/data:(image\/\w+);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const res = await postsApi.create(showCaptionFor, mime, caption);
      setPosts((prev) => [{ ...res.post, author_name: currentUser?.name ?? "", author_photo: currentUser?.photo_url, likes_count: 0, liked_by_me: false, comments_count: 0 }, ...prev]);
      setShowCaptionFor(null); setCaption("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally { setUploading(false); }
  };

  const handleLike = async (post: Post) => {
    const res = await postsApi.like(post.id);
    const upd = (p: Post) => p.id === post.id ? { ...p, liked_by_me: res.liked, likes_count: res.likes_count } : p;
    setPosts((prev) => prev.map(upd));
    if (selectedPost?.id === post.id) setSelectedPost((p) => p ? upd(p) : p);
  };

  return (
    <>
      {showCaptionFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm animate-slide-up flex flex-col" style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0", maxHeight: "90dvh" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setShowCaptionFor(null)} className="text-white/50 text-sm">Отмена</button>
              <h3 className="text-white font-bold text-sm">Новое фото</h3>
              <button onClick={handlePublish} disabled={uploading} className="btn-grad px-4 py-1.5 text-sm">
                {uploading ? "..." : "Опубликовать"}
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <img src={showCaptionFor} className="w-full rounded-2xl object-cover max-h-64" />
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
                placeholder="Добавь подпись..." rows={3} maxLength={200}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos resize-none" />
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          currentUserId={currentUser?.id ?? 0}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          onAuthorClick={() => { setViewingUserId(selectedPost.user_id); }}
        />
      )}

      {viewingUserId && (
        <UserProfileModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-white font-golos font-bold text-2xl">Фото</h2>
            <p className="text-white/40 text-xs mt-0.5">{posts.length > 0 ? `${posts.length} публикаций` : "Лента"}</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="btn-grad w-10 h-10 rounded-full flex items-center justify-center">
            <Icon name="Plus" size={20} className="text-white" />
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-5xl">📸</div>
              <p className="text-white/50 text-sm text-center">Пока нет публикаций.<br />Нажми «+» и добавь первое фото!</p>
            </div>
          )}
          {posts.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => (
                <button key={post.id} onClick={() => setSelectedPost(post)}
                  className="relative aspect-square overflow-hidden group">
                  <img src={post.photo_url} className="w-full h-full object-cover transition-transform group-active:scale-95" />
                  <div className="absolute inset-0 bg-black/0 group-active:bg-black/30 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-active:opacity-100">
                    <span className="text-white text-xs font-semibold">❤️ {post.likes_count}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-4"
                    style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.55))" }}>
                    <img src={post.author_photo || FALLBACK_PHOTO} className="w-5 h-5 rounded-full object-cover" style={{ border: "1px solid rgba(255,255,255,0.4)" }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
