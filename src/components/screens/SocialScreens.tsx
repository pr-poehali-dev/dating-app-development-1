import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { matchesApi, likesApi, messagesApi, postsApi, liveApi, type User, type Match, type Message, type LikedBy, type Post, type PostComment, type LiveStream, type LiveMessage } from "@/lib/api";
import { ReportModal } from "@/components/screens/SwipeScreens";
import VideoCall from "@/components/VideoCall";

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
              {data.posts.map((post) => (
                <div key={post.id} className="relative aspect-square overflow-hidden">
                  <img src={post.photo_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-end p-1.5 opacity-0 hover:opacity-100">
                    <span className="text-white text-xs flex items-center gap-1">❤️ {post.likes_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.posts.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="text-4xl">📷</div>
              <p className="text-white/30 text-sm">Нет публикаций</p>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}

// ─── PhotosScreen ─────────────────────────────────────────────────────────────
export function PhotosScreen({ currentUser }: { currentUser: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [showCaptionFor, setShowCaptionFor] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPosts((prev) => [{ ...res.post, author_name: currentUser.name, author_photo: currentUser.photo_url, likes_count: 0, liked_by_me: false, comments_count: 0 }, ...prev]);
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
          currentUserId={currentUser.id}
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

// ─── LiveScreen ───────────────────────────────────────────────────────────────
export function LiveScreen({ currentUser }: { currentUser: User }) {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<LiveMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [heartsAnim, setHeartsAnim] = useState<number[]>([]);
  const [showStart, setShowStart] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [lastMsgId, setLastMsgId] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStreams = () => {
    liveApi.list()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStreams(); }, []);

  useEffect(() => {
    if (!activeStream) { if (pollRef.current) clearInterval(pollRef.current); return; }
    const poll = async () => {
      try {
        const res = await liveApi.poll(activeStream.id, lastMsgId);
        if (res.stream.status === 'ended' && !isStreaming) {
          setActiveStream(null); setChatMsgs([]); setLastMsgId(0);
          loadStreams(); return;
        }
        setActiveStream((prev) => prev ? { ...prev, viewers_count: res.stream.viewers_count, hearts_count: res.stream.hearts_count } : prev);
        if (res.messages.length > 0) {
          setChatMsgs((prev) => [...prev, ...res.messages]);
          setLastMsgId(res.messages[res.messages.length - 1].id);
        }
      } catch (e: unknown) { void e; }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeStream?.id, isStreaming]);

  const handleJoin = async (stream: LiveStream) => {
    setActiveStream(stream); setChatMsgs([]); setLastMsgId(0);
    try { await liveApi.join(stream.id); } catch (e: unknown) { void e; }
  };

  const handleLeave = async () => {
    if (!activeStream) return;
    if (isStreaming) {
      await liveApi.end();
      setIsStreaming(false);
    } else {
      try { await liveApi.leave(activeStream.id); } catch (e: unknown) { void e; }
    }
    setActiveStream(null); setChatMsgs([]); setLastMsgId(0);
    loadStreams();
  };

  const handleStartStream = async () => {
    if (!streamTitle.trim()) return;
    const res = await liveApi.start(streamTitle.trim());
    setIsStreaming(true);
    setActiveStream({ ...res.stream, author_name: currentUser.name, author_photo: currentUser.photo_url });
    setChatMsgs([]); setLastMsgId(0); setShowStart(false); setStreamTitle("");
  };

  const handleHeart = async () => {
    if (!activeStream) return;
    const id = Date.now();
    setHeartsAnim((prev) => [...prev, id]);
    setTimeout(() => setHeartsAnim((prev) => prev.filter((x) => x !== id)), 1500);
    try { const res = await liveApi.heart(activeStream.id); setActiveStream((prev) => prev ? { ...prev, hearts_count: res.hearts_count } : prev); }
    catch (e: unknown) { void e; }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeStream) return;
    const text = chatInput.trim(); setChatInput("");
    try {
      const res = await liveApi.chat(activeStream.id, text);
      setChatMsgs((prev) => [...prev, res.message]);
      setLastMsgId(res.message.id);
    } catch (e: unknown) { void e; }
  };

  if (activeStream) {
    return (
      <div className="flex flex-col h-full relative" style={{ background: "#0a0014" }}>
        <div className="relative flex-shrink-0" style={{ height: "45%" }}>
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#1a0030,#2d0050)" }}>
            {isStreaming
              ? <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full btn-grad flex items-center justify-center">
                    <Icon name="Video" size={28} className="text-white" />
                  </div>
                  <p className="text-white/60 text-sm">Вы ведёте трансляцию</p>
                </div>
              : <div className="flex flex-col items-center gap-2">
                  <img src={activeStream.author_photo || FALLBACK_PHOTO} className="w-20 h-20 rounded-full object-cover border-4 border-pink-500" />
                  <p className="text-white font-semibold">{activeStream.author_name}</p>
                </div>
            }
          </div>
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">LIVE</span>
              <span className="glass-card px-2 py-0.5 text-white/80 text-xs flex items-center gap-1">
                <Icon name="Eye" size={11} />{activeStream.viewers_count}
              </span>
            </div>
            <button onClick={handleLeave}
              className="glass-card px-3 py-1.5 text-white/70 text-xs flex items-center gap-1.5">
              <Icon name="X" size={13} />{isStreaming ? "Завершить" : "Выйти"}
            </button>
          </div>
          <div className="absolute bottom-3 left-4">
            <p className="text-white font-semibold text-sm">{activeStream.title}</p>
          </div>
          {heartsAnim.map((id) => (
            <div key={id} className="absolute bottom-16 right-6 pointer-events-none animate-bounce text-2xl">❤️</div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-0">
          {chatMsgs.map((m) => (
            <div key={m.id} className="flex items-start gap-2">
              <img src={m.author_photo || FALLBACK_PHOTO} className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5" />
              <div className="glass-card px-2.5 py-1.5 max-w-[85%]">
                <span className="text-pink-400 text-xs font-semibold">{m.author_name} </span>
                <span className="text-white/80 text-xs">{m.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 pb-4 pt-2 flex gap-2 items-center flex-shrink-0">
          <button onClick={handleHeart}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,45,120,0.2)", border: "1px solid rgba(255,45,120,0.4)" }}>
            <span className="text-lg">❤️</span>
          </button>
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            placeholder="Написать в чат..."
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
          <button onClick={handleSendChat}
            className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={15} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showStart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm animate-slide-up p-6 flex flex-col gap-4"
            style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}>
            <h3 className="text-white font-bold text-lg">Начать трансляцию</h3>
            <input value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)}
              placeholder="Название трансляции"
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
            <div className="flex gap-3">
              <button onClick={() => setShowStart(false)}
                className="flex-1 glass-card py-3 text-white/60 text-sm font-semibold">Отмена</button>
              <button onClick={handleStartStream}
                className="flex-1 btn-grad py-3 text-sm font-semibold">Начать</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-white font-golos font-bold text-2xl">Live</h2>
            <p className="text-white/40 text-xs mt-0.5">{streams.length > 0 ? `${streams.length} трансляций` : "Прямые эфиры"}</p>
          </div>
          <button onClick={() => setShowStart(true)} className="btn-grad px-4 py-2 text-sm flex items-center gap-2">
            <Icon name="Video" size={15} className="text-white" />Начать
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && streams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-5xl">📡</div>
              <p className="text-white/50 text-sm text-center">Нет активных трансляций.<br />Начни первым!</p>
            </div>
          )}
          {streams.map((s) => (
            <button key={s.id} onClick={() => handleJoin(s)}
              className="glass-card p-4 flex items-center gap-3 w-full text-left">
              <div className="relative flex-shrink-0">
                <img src={s.author_photo || FALLBACK_PHOTO} className="w-14 h-14 rounded-full object-cover" />
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">LIVE</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{s.title}</p>
                <p className="text-white/50 text-xs">{s.author_name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/40 text-xs flex items-center gap-1"><Icon name="Eye" size={11} />{s.viewers_count}</span>
                  <span className="text-white/40 text-xs flex items-center gap-1">❤️ {s.hearts_count}</span>
                </div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-white/30 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── RealMatchesScreen ────────────────────────────────────────────────────────
export function RealMatchesScreen({ onChat }: { onChat: (matchId: number) => void }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchesApi.getAll()
      .then((d) => setMatches(d.matches))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );

  if (matches.length === 0) return (
    <div className="flex flex-col h-full items-center justify-center gap-4 px-8">
      <div className="text-5xl">💬</div>
      <p className="text-white/60 text-center text-sm">Пока нет совпадений.<br />Лайкай анкеты — они лайкнут в ответ!</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-golos font-bold text-2xl">Совпадения</h2>
        <p className="text-white/40 text-sm mt-0.5">У тебя {matches.length} совпадений</p>
      </div>
      <div className="px-5 mb-4">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Новые</p>
        <div className="flex gap-3">
          {matches.map((m) => (
            <button key={m.match_id} onClick={() => onChat(m.match_id)} className="flex flex-col items-center gap-2">
              <div className="relative">
                <img src={m.photo_url || FALLBACK_PHOTO} className="w-16 h-16 rounded-full object-cover" style={{ boxShadow: "0 0 0 2px #FF2D78" }} />
                {m.online && <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--spark-dark)" }} />}
                {m.unread_count > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>{m.unread_count}</div>
                )}
              </div>
              <span className="text-white/80 text-xs">{m.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 flex-1">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Сообщения</p>
        <div className="flex flex-col gap-1">
          {matches.map((m) => (
            <button key={m.match_id} onClick={() => onChat(m.match_id)}
              className="glass-card p-4 flex items-center gap-3 w-full text-left hover:bg-white/10 transition-all">
              <div className="relative flex-shrink-0">
                <img src={m.photo_url || FALLBACK_PHOTO} className="w-12 h-12 rounded-full object-cover" />
                {m.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--spark-dark)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">{m.name}{m.age ? `, ${m.age}` : ""}</span>
                  <span className="text-white/40 text-xs">{m.last_msg_time ? new Date(m.last_msg_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                </div>
                <p className="text-white/50 text-sm truncate mt-0.5">{m.last_msg || "Совпадение! Напиши первым 👋"}</p>
              </div>
              {m.unread_count > 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>{m.unread_count}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RealLikesScreen ──────────────────────────────────────────────────────────
export function RealLikesScreen({ onPremium }: { onPremium: () => void }) {
  const [likedMe, setLikedMe] = useState<LikedBy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    likesApi.getLikedMe()
      .then((d) => setLikedMe(d.liked_me))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-golos font-bold text-2xl">Ты им понравился</h2>
        <p className="text-white/40 text-sm mt-0.5">{likedMe.length} человек лайкнули тебя</p>
      </div>
      <div className="mx-5 mb-5 p-5 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.25), rgba(155,89,182,0.25))", border: "1px solid rgba(255,45,120,0.3)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-base">LoveBloom Premium</span>
              <span className="premium-badge">GOLD</span>
            </div>
            <p className="text-white/60 text-sm">Смотри, кто тебя лайкнул — без ограничений</p>
          </div>
          <div className="text-3xl">✨</div>
        </div>
        <button onClick={onPremium} className="btn-grad px-5 py-2.5 text-sm w-full">Открыть все лайки</button>
      </div>
      {likedMe.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="text-5xl">❤️</div>
          <p className="text-white/50 text-sm text-center">Пока никто не лайкнул.<br />Заполни профиль и лайкай сам!</p>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3">
          {likedMe.map((p, i) => (
            <div key={p.id} className="relative rounded-2xl overflow-hidden aspect-[3/4]">
              <img src={p.photo_url || FALLBACK_PHOTO} className="w-full h-full object-cover"
                style={{ filter: p.blurred ? "blur(20px) brightness(0.7)" : "none" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
              {p.blurred && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={onPremium} className="glass-card p-3 flex flex-col items-center gap-1">
                    <Icon name="Lock" size={18} className="text-white" />
                    <span className="text-white text-xs">Premium</span>
                  </button>
                </div>
              )}
              <div className="absolute bottom-3 left-3">
                <p className="text-white font-semibold text-sm">{p.name}{p.age ? `, ${p.age}` : ""}</p>
              </div>
              <div style={{ display: "none" }}>{i}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RealChatScreen ───────────────────────────────────────────────────────────
// ─── Утилита: рендер специального сообщения ───────────────────────────────────
function renderMsgContent(text: string, out: boolean) {
  // Исчезающее фото: __VANISH__<url>
  if (text.startsWith("__VANISH__")) {
    const url = text.slice(10);
    return (
      <VanishPhoto url={url} out={out} />
    );
  }
  // Локация: __LOC__<lat>,<lon>
  if (text.startsWith("__LOC__")) {
    const coords = text.slice(7);
    const [lat, lon] = coords.split(",");
    const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;
    return (
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1">
        <div className="w-48 h-28 rounded-xl overflow-hidden relative"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <img
            src={`https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=14&size=300,180&l=map&pt=${lon},${lat},pm2rdl`}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 flex items-end p-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.5)" }}>
              <Icon name="MapPin" size={12} className="text-pink-400" />
              <span className="text-white text-[11px] font-medium">Открыть карту</span>
            </div>
          </div>
        </div>
      </a>
    );
  }
  // Видеочат: __VCALL__<accepted|pending>
  if (text.startsWith("__VCALL__")) {
    const status = text.slice(9);
    return (
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: status === "accepted" ? "rgba(74,222,128,0.2)" : "rgba(255,45,120,0.2)" }}>
          <Icon name="Video" size={16} className={status === "accepted" ? "text-green-400" : "text-pink-400"} />
        </div>
        <span className="text-sm">{status === "accepted" ? "Видеозвонок принят ✓" : "Запрос видеозвонка 📹"}</span>
      </div>
    );
  }
  // Награда: __AWARD__<emoji>
  if (text.startsWith("__AWARD__")) {
    const emoji = text.slice(9);
    return (
      <div className="flex flex-col items-center gap-1 py-1 px-3">
        <span className="text-4xl">{emoji}</span>
        <span className="text-xs text-white/60">{out ? "Ты отправил награду" : "Тебе вручена награда!"}</span>
      </div>
    );
  }
  return <span>{text}</span>;
}

// ─── Исчезающее фото ──────────────────────────────────────────────────────────
function VanishPhoto({ url, out }: { url: string; out: boolean }) {
  const [visible, setVisible] = useState(true);
  const [opened, setOpened] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (!opened) return;
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timer); setVisible(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [opened]);

  if (!visible) {
    return <span className="text-white/40 text-sm italic">🔥 Фото исчезло</span>;
  }
  if (!opened && !out) {
    return (
      <button onClick={() => setOpened(true)}
        className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,45,120,0.2)" }}>
          <Icon name="Timer" size={16} className="text-pink-400" />
        </div>
        <span className="text-sm">Исчезающее фото — нажми чтобы открыть</span>
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="w-48 h-48 rounded-xl overflow-hidden relative">
        <img src={url} className="w-full h-full object-cover" />
        {opened && (
          <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full text-white text-[11px] font-bold"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            🔥 {secondsLeft}с
          </div>
        )}
      </div>
    </div>
  );
}

export function RealChatScreen({ matchId, currentUserId, onBack }: { matchId: number; currentUserId: number; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [partnerName, setPartnerName] = useState("...");
  const [partnerPhoto, setPartnerPhoto] = useState(FALLBACK_PHOTO);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showPlus, setShowPlus] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVanishPicker, setShowVanishPicker] = useState(false);
  const [vanishPhotos, setVanishPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [showAwardPicker, setShowAwardPicker] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [videoCall, setVideoCall] = useState<{ isInitiator: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  void currentUserId;

  useEffect(() => {
    messagesApi.getByMatch(matchId)
      .then((d) => { setMsgs(d.messages); setTimeout(() => bottomRef.current?.scrollIntoView(), 50); })
      .catch(() => {});
    matchesApi.getAll().then((d) => {
      const m = d.matches.find((x) => x.match_id === matchId);
      if (m) { setPartnerName(m.name); setPartnerPhoto(m.photo_url || FALLBACK_PHOTO); }
    }).catch(() => {});
  }, [matchId]);

  // Polling входящих видеозвонков
  useEffect(() => {
    if (videoCall) return;
    const interval = setInterval(async () => {
      try {
        const { signals } = await messagesApi.signalPoll(matchId);
        if (signals.some(s => s.signal_type === "offer")) {
          setVideoCall({ isInitiator: false });
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [matchId, videoCall]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    try {
      const msg = await messagesApi.send(matchId, text);
      setMsgs((m) => [...m, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) { void e; }
  };

  const sendSystem = async (text: string) => {
    setShowPlus(false);
    try {
      const msg = await messagesApi.send(matchId, text);
      setMsgs((m) => [...m, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) { void e; }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowPlus(false);
    sendSystem(`📷 [Фото]`);
    e.target.value = "";
  };

  // Исчезающее фото — загружаем галерею профиля
  const openVanishPicker = () => {
    import("@/lib/api").then(({ profilesApi }) => {
      profilesApi.listProfilePhotos().then(r => setVanishPhotos(r.photos));
    });
    setShowVanishPicker(true);
    setShowPlus(false);
  };

  const sendVanishPhoto = async (photoUrl: string) => {
    setShowVanishPicker(false);
    await sendSystem(`__VANISH__${photoUrl}`);
  };

  // Локация
  const sendLocation = () => {
    setShowPlus(false);
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await sendSystem(`__LOC__${pos.coords.latitude},${pos.coords.longitude}`);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  };

  const handleDelete = async (msg: Message) => {
    setContextMsg(null);
    setDeleting(msg.id);
    try {
      await messagesApi.delete(msg.id);
      setMsgs((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (e) { void e; }
    finally { setDeleting(null); }
  };

  const startHold = (msg: Message) => {
    holdTimer.current = setTimeout(() => {
      setContextMsg(msg);
      navigator.vibrate?.(30);
    }, 450);
  };
  const cancelHold = () => { if (holdTimer.current) clearTimeout(holdTimer.current); };

  return (
    <>
      {contextMsg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setContextMsg(null)}>
          <div className="w-full max-w-sm animate-slide-up"
            style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/40 text-xs mb-1.5">Сообщение</p>
              <p className="text-white/80 text-sm line-clamp-3">{contextMsg.text}</p>
            </div>
            <button
              onClick={() => handleDelete(contextMsg)}
              className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,45,78,0.15)" }}>
                <Icon name="Trash2" size={18} style={{ color: "#FF2D4E" }} />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-sm">Удалить сообщение</p>
                <p className="text-white/30 text-xs">Удалится у обоих участников</p>
              </div>
            </button>
            <button
              onClick={() => { navigator.clipboard?.writeText(contextMsg.text); setContextMsg(null); }}
              className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <Icon name="Copy" size={18} className="text-white/60" />
              </div>
              <p className="text-white/80 font-semibold text-sm">Скопировать текст</p>
            </button>
            <div className="px-5 pb-6 pt-1">
              <button onClick={() => setContextMsg(null)}
                className="w-full glass-card py-3 text-white/50 text-sm font-medium">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 relative z-10"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
            <Icon name="ChevronLeft" size={24} />
          </button>
          <img src={partnerPhoto} className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{partnerName}</p>
            <p className="text-white/40 text-xs">Удержи сообщение для удаления</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-white/40 text-sm">Начни общение первым! 👋</p>
            </div>
          )}
          {msgs.map((msg) => (
            <div key={msg.id}
              className={`flex flex-col ${msg.out ? "items-end" : "items-start"} ${deleting === msg.id ? "opacity-30" : ""} transition-opacity`}
              onMouseDown={() => startHold(msg)}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={() => startHold(msg)}
              onTouchEnd={cancelHold}
              onTouchMove={cancelHold}>
              <div className={`${msg.out ? "msg-bubble-out" : "msg-bubble-in"} select-none`}
                style={{ cursor: "pointer" }}>
                {renderMsgContent(msg.text, msg.out)}
              </div>
              <span className="text-white/30 text-[11px] mt-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Меню + */}
        {showPlus && (
          <div className="px-4 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="grid grid-cols-3 gap-2 pt-3 pb-1">
              {[
                { icon: "Camera", label: "Камера", action: () => { cameraRef.current?.click(); setShowPlus(false); } },
                { icon: "Image", label: "Галерея", action: () => { fileRef.current?.click(); setShowPlus(false); } },
                { icon: "Timer", label: "Исчезающее", action: openVanishPicker },
                { icon: "MapPin", label: "Локация", action: sendLocation, loading: geoLoading },
                { icon: "Video", label: "Видеочат", action: () => { setShowPlus(false); setVideoCall({ isInitiator: true }); } },
                { icon: "Trophy", label: "Награда", action: () => { setShowAwardPicker(true); setShowPlus(false); } },
              ].map(({ icon, label, action, loading }) => (
                <button key={label} onClick={action} disabled={loading}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.2))" }}>
                    {loading
                      ? <Icon name="Loader2" size={20} className="animate-spin" style={{ color: "#FF2D78" }} />
                      : <Icon name={icon} size={20} style={{ color: "#FF2D78" }} />}
                  </div>
                  <span className="text-white/60 text-[11px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Скрытые input'ы для файлов */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

        {/* Панель смайликов */}
        {showEmoji && (
          <div className="px-3 pb-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              ["😍","🥰","❤️","🔥","😘","💋","🫦","💕"],
              ["😂","🤣","😭","🥺","😅","🙈","😏","🤤"],
              ["👋","🤙","💪","🙏","👅","💦","🥵","🫠"],
              ["🎉","🏆","💎","🌹","🍓","🦋","✨","💯"],
            ].map((row, i) => (
              <div key={i} className="flex justify-between mb-1">
                {row.map(em => (
                  <button key={em} onClick={() => {
                    setInput(v => v + em);
                    inputRef.current?.focus();
                  }}
                    className="text-2xl w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-75 hover:bg-white/10">
                    {em}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: (showPlus || showEmoji) ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => { setShowPlus(v => !v); setShowEmoji(false); }}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{
              background: showPlus ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.15)"
            }}>
            <Icon name={showPlus ? "X" : "Plus"} size={18} className="text-white" />
          </button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            onFocus={() => { setShowPlus(false); setShowEmoji(false); }}
            placeholder="Написать..."
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
          <button onClick={() => { setShowEmoji(v => !v); setShowPlus(false); }}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 text-xl"
            style={{ background: showEmoji ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
            {showEmoji ? <Icon name="X" size={16} className="text-white" /> : "😊"}
          </button>
          <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Видеозвонок */}
      {videoCall && (
        <VideoCall
          matchId={matchId}
          partnerName={partnerName}
          partnerPhoto={partnerPhoto}
          isInitiator={videoCall.isInitiator}
          onClose={() => setVideoCall(null)}
        />
      )}

      {/* Пикер исчезающего фото */}
      {showVanishPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
          onClick={() => setShowVanishPicker(false)}>
          <div className="w-full max-w-sm animate-slide-up pb-6 px-4"
            style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between py-4">
              <p className="text-white font-semibold">Выбери исчезающее фото</p>
              <button onClick={() => setShowVanishPicker(false)}>
                <Icon name="X" size={20} className="text-white/50" />
              </button>
            </div>
            {vanishPhotos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Icon name="Image" size={32} className="text-white/20" />
                <p className="text-white/40 text-sm text-center">В галерее нет фото. Добавь фото в профиле.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 pb-2">
                {vanishPhotos.map(p => (
                  <button key={p.id} onClick={() => sendVanishPhoto(p.photo_url)}
                    className="aspect-square rounded-xl overflow-hidden active:scale-95 transition-all relative">
                    <img src={p.photo_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.3)" }}>
                      <Icon name="Timer" size={20} className="text-pink-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Пикер наград */}
      {showAwardPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
          onClick={() => setShowAwardPicker(false)}>
          <div className="w-full max-w-sm animate-slide-up pb-6 px-4"
            style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between py-4">
              <p className="text-white font-semibold">Выбери награду</p>
              <button onClick={() => setShowAwardPicker(false)}>
                <Icon name="X" size={20} className="text-white/50" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 pb-2">
              {["🏆","💎","👑","🌹","⭐","🎯","🔥","💋","🦋","✨","🎁","🥇"].map(emoji => (
                <button key={emoji} onClick={() => { sendSystem(`__AWARD__${emoji}`); setShowAwardPicker(false); }}
                  className="aspect-square rounded-2xl flex items-center justify-center text-3xl active:scale-90 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}