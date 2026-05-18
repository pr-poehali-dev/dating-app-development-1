import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { postsApi, liveApi, notificationsApi, type Post, type LiveStream, type User, type Profile } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { LiveBadge, TrendingBadge, CreateMenu } from "@/components/screens/HomeFeedWidgets";
import { CommentSheet } from "@/components/screens/HomeCommentSheet";
import { PostCard } from "@/components/screens/HomePostCard";
import { NotificationsSheet } from "@/components/screens/NotificationsSheet";

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export function HomeScreen({ currentUser, onGoLive, onOpenChat, onGoToChats }: {
  currentUser: User;
  onGoLive: () => void;
  onGoPhotos?: () => void;
  onOpenChat?: (matchId: number) => void;
  onGoToChats?: () => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showStoryMsg, setShowStoryMsg] = useState(false);
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [captionFor, setCaptionFor] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      postsApi.getFeed().then((d) => setPosts(d.posts)).catch(() => {}),
      liveApi.list().then((d) => setStreams(d.streams)).catch(() => {}),
    ]).finally(() => setLoading(false));
    notificationsApi.unreadCount().then(d => setUnreadCount(d.unread_count)).catch(() => {});
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
      {viewProfile && (
        <DiscoverProfileModal
          profile={viewProfile}
          onClose={() => setViewProfile(null)}
          onLike={() => {}}
          onOpenChat={onOpenChat ? (id) => { setViewProfile(null); onOpenChat(id); } : undefined}
          onGoToChats={onGoToChats ? () => { setViewProfile(null); onGoToChats(); } : undefined}
        />
      )}

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
      {showNotifs && (
        <NotificationsSheet
          onClose={() => setShowNotifs(false)}
          onOpenChat={onOpenChat}
        />
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/51fe4ec6-6465-42e1-b1ed-df2cd706037f.jpg"
              className="w-8 h-8 rounded-xl object-cover" />
            <h1 className="font-unbounded text-white text-xl font-black grad-text">LoveBloom</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreate(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
              <Icon name="Plus" size={20} className="text-white" />
            </button>
            <button onClick={() => { setShowNotifs(true); setUnreadCount(0); }}
              className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Icon name="Bell" size={18} className="text-white/80" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
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
                    onProfileClick={setViewProfile}
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