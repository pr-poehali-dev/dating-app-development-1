import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { postsApi, liveApi, notificationsApi, type Post, type LiveStream, type User, type Profile } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { LiveBadge, TrendingBadge, CreateMenu } from "@/components/screens/HomeFeedWidgets";
import { CommentSheet } from "@/components/screens/HomeCommentSheet";
import { PostCard } from "@/components/screens/HomePostCard";
import { NotificationsSheet } from "@/components/screens/NotificationsSheet";
import { useYookassa } from "@/components/extensions/yookassa/useYookassa";

const PAY_CREATE_URL = "https://functions.poehali.dev/d866e377-6dac-43c2-a709-799c346ac3ef";

const GIFTS = [
  { id: 1, name: "Сердце",          image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/780e6930-f6c2-484f-8716-da3b5ca80beb.jpg", price: 15,   anim: "gift-float",   rarity: "common"    },
  { id: 2, name: "Большое сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/e62bd618-810d-4ffa-b5e1-ea527a2f7789.jpg", price: 50,   anim: "gift-pulse",   rarity: "common"    },
  { id: 3, name: "Горящее сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/b8900760-8ca5-478d-82f9-327e733021fd.jpg", price: 99,   anim: "gift-shake",   rarity: "rare"      },
  { id: 4, name: "Золотое сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/75602fbe-4c21-48fa-afbb-923e6c13d49b.jpg", price: 199,  anim: "gift-spin",    rarity: "rare"      },
  { id: 5, name: "Алмазное сердце", image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/b68af420-0d63-4408-9a54-ffd67695f558.jpg", price: 499,  anim: "gift-sparkle", rarity: "epic"      },
  { id: 6, name: "Вечное сердце",   image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/35a1f4c7-e749-461d-92b8-8577c293b692.jpg", price: 999,  anim: "gift-glow",    rarity: "epic"      },
  { id: 7, name: "Редкое сердце",   image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/20fb165f-5299-495f-b4d3-c8d5d8bcbbd5.jpg", price: 2499, anim: "gift-orbit",   rarity: "legendary" },
  { id: 8, name: "Легендарное",     image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/0a1a97c7-4ae8-4de5-8b84-9d9020be8067.jpg", price: 4999, anim: "gift-rainbow",  rarity: "legendary" },
];

const RARITY_STYLE: Record<string, { label: string; border: string; bg: string; text: string }> = {
  common:    { label: "",           border: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.04)", text: "" },
  rare:      { label: "Редкий",     border: "rgba(99,179,237,0.4)",   bg: "rgba(99,179,237,0.07)",  text: "#63B3ED" },
  epic:      { label: "Эпический",  border: "rgba(159,122,234,0.5)",  bg: "rgba(159,122,234,0.08)", text: "#9F7AEA" },
  legendary: { label: "Легендарный",border: "rgba(237,137,54,0.6)",   bg: "rgba(237,137,54,0.1)",   text: "#ED8936" },
};

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
  const [showGifts, setShowGifts] = useState(false);
  const [giftBuying, setGiftBuying] = useState<number | null>(null);
  const [giftDone, setGiftDone] = useState<number | null>(null);
  const { pay: payGift, loading: giftPaying } = useYookassa(PAY_CREATE_URL);

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
            <button onClick={() => setShowGifts(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Icon name="Gift" size={18} className="text-white/80" />
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

      {/* Модал подарков */}
      {showGifts && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowGifts(false)}>
          <div className="rounded-t-3xl flex flex-col max-h-[85dvh]"
            style={{ background: "var(--spark-card)", border: "1px solid var(--spark-divider)" }}
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            </div>

            {/* Заголовок */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1 flex-shrink-0">
              <div>
                <p className="text-white font-bold text-lg">Подарки</p>
                <p className="text-white/40 text-xs mt-0.5">Все подарки — платные</p>
              </div>
              <button onClick={() => setShowGifts(false)} className="text-white/40">
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Сетка подарков */}
            <div className="overflow-y-auto px-4 pb-8">
              <div className="grid grid-cols-4 gap-2.5">
                {GIFTS.map((gift) => {
                  const rs = RARITY_STYLE[gift.rarity];
                  const selected = giftBuying === gift.id;
                  return (
                    <button key={gift.id} onClick={() => { setGiftBuying(gift.id); setGiftDone(null); }}
                      className="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-90 relative overflow-hidden"
                      style={{
                        background: selected ? rs.bg : "rgba(255,255,255,0.04)",
                        border: `1px solid ${selected ? rs.border : "rgba(255,255,255,0.08)"}`,
                        boxShadow: selected && gift.rarity !== "common" ? `0 0 12px ${rs.border}` : "none",
                      }}>
                      {rs.label && (
                        <span className="absolute top-1 left-1 text-[8px] font-bold px-1 py-0.5 rounded-md leading-none"
                          style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}>
                          {rs.label}
                        </span>
                      )}
                      <div className={`w-14 h-14 flex items-center justify-center ${gift.anim}`}>
                        <img src={gift.image} alt={gift.name} className="w-full h-full object-contain drop-shadow-lg" />
                      </div>
                      <p className="text-white/80 text-[10px] font-semibold leading-tight text-center line-clamp-2">{gift.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                        {gift.price} ⭐
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Панель покупки */}
              {giftBuying !== null && (() => {
                const gift = GIFTS.find(g => g.id === giftBuying)!;
                const rs = RARITY_STYLE[gift.rarity];
                return (
                  <div className="mt-3 rounded-2xl p-4 flex items-center gap-4"
                    style={{ background: rs.bg || "rgba(255,45,120,0.08)", border: `1px solid ${rs.border || "rgba(255,45,120,0.2)"}` }}>
                    <div className={`w-14 h-14 flex-shrink-0 ${gift.anim}`}>
                      <img src={gift.image} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{gift.name}</p>
                      {rs.label && <p className="text-xs font-bold mt-0.5" style={{ color: rs.text }}>{rs.label}</p>}
                      <p className="text-white/40 text-xs">{gift.price} звёзд</p>
                    </div>
                    {giftDone === giftBuying ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "rgba(74,222,128,0.15)" }}>
                        <Icon name="Check" size={14} className="text-green-400" />
                        <span className="text-green-400 text-xs font-semibold">Оплачено!</span>
                      </div>
                    ) : (
                      <button
                        disabled={giftPaying}
                        onClick={() => payGift({
                          amount: gift.price,
                          description: `Подарок «${gift.name}»`,
                          returnUrl: window.location.origin + "/?payment=success",
                          metadata: { gift_id: String(gift.id), gift_name: gift.name },
                        }).then(r => { if (r?.paymentUrl) setGiftDone(giftBuying); })}
                        className="btn-grad px-4 py-2.5 text-xs font-bold text-white rounded-xl flex-shrink-0 disabled:opacity-60 flex items-center gap-1.5">
                        {giftPaying
                          ? <><Icon name="Loader2" size={13} className="animate-spin" />Ждите...</>
                          : "Купить"}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}