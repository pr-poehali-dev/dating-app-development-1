import { useState, useEffect, useRef } from "react";
import { postsApi, liveApi, notificationsApi, type Post, type LiveStream, type User, type Profile } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { CreateMenu } from "@/components/screens/HomeFeedWidgets";
import { CommentSheet } from "@/components/screens/HomeCommentSheet";
import { NotificationsSheet } from "@/components/screens/NotificationsSheet";
import { HomeHeader } from "@/components/screens/home/HomeHeader";
import { HomeFeedContent } from "@/components/screens/home/HomeFeedContent";
import { HomeGiftSheet } from "@/components/screens/home/HomeGiftSheet";
import { HomeGiftPreview } from "@/components/screens/home/HomeGiftPreview";
import { NewUsersGridScreen } from "@/components/screens/home/NewUsersGridScreen";
import { StoryUploadSheet } from "@/components/screens/StoryUploadSheet";

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export function HomeScreen({ currentUser, onGoLive, onJoinLive, onOpenChat, onGoToChats, onPremium }: {
  currentUser: User;
  onGoLive: () => void;
  onJoinLive?: (s: LiveStream) => void;
  onGoPhotos?: () => void;
  onOpenChat?: (matchId: number) => void;
  onGoToChats?: () => void;
  onPremium?: () => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGifts, setShowGifts] = useState(false);
  const [giftBuying, setGiftBuying] = useState<number | null>(null);
  const [giftPreview, setGiftPreview] = useState<number | null>(null);
  const [giftDone, setGiftDone] = useState<number | null>(null);
  const [giftCategory, setGiftCategory] = useState("heart");
  const [showNewUsers, setShowNewUsers] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);

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
          onStory={() => { setShowCreate(false); setShowStoryUpload(true); }}
          onLive={onGoLive}
          onClose={() => setShowCreate(false)}
        />
      )}
      {showStoryUpload && (
        <StoryUploadSheet
          onClose={() => setShowStoryUpload(false)}
          onUploaded={() => { setShowStoryUpload(false); setStoriesRefreshKey(k => k + 1); }}
        />
      )}
      {showNotifs && (
        <NotificationsSheet
          onClose={() => setShowNotifs(false)}
          onOpenChat={onOpenChat}
        />
      )}

      <div className="flex flex-col h-full">
        <HomeHeader
          unreadCount={unreadCount}
          onCreateClick={() => setShowCreate(true)}
          onGiftsClick={() => setShowGifts(true)}
          onNotifsClick={() => { setShowNotifs(true); setUnreadCount(0); }}
        />

        <HomeFeedContent
          loading={loading}
          posts={posts}
          streams={streams}
          currentUserId={currentUser.id}
          currentUserPhoto={currentUser.photo_url}
          isPremium={!!currentUser.premium}
          onJoinLive={onJoinLive ?? (() => {})}
          onLike={handleLike}
          onComment={(p) => setCommentPost(p)}
          onDelete={(p) => setPosts((prev) => prev.filter((x) => x.id !== p.id))}
          onProfileClick={setViewProfile}
          onPremium={() => onPremium?.()}
          onOpenNewUsers={() => setShowNewUsers(true)}
          onAddStory={() => setShowStoryUpload(true)}
          storiesRefreshKey={storiesRefreshKey}
        />
      </div>

      {/* Сетка новых пользователей */}
      {showNewUsers && (
        <NewUsersGridScreen
          isPremium={!!currentUser.premium}
          onProfile={setViewProfile}
          onPremium={() => { setShowNewUsers(false); onPremium?.(); }}
          onBack={() => setShowNewUsers(false)}
        />
      )}

      {/* Превью подарка */}
      {giftPreview !== null && (
        <HomeGiftPreview
          giftPreview={giftPreview}
          giftDone={giftDone}
          setGiftDone={setGiftDone}
          onClose={() => setGiftPreview(null)}
        />
      )}

      {/* Модал подарков */}
      {showGifts && (
        <HomeGiftSheet
          giftCategory={giftCategory}
          giftBuying={giftBuying}
          onCategoryChange={setGiftCategory}
          onPickGift={(id) => { setGiftBuying(id); setGiftDone(null); setGiftPreview(id); }}
          onClose={() => { setShowGifts(false); setGiftBuying(null); }}
        />
      )}
    </>
  );
}