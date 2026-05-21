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
  { id: 1, name: "Сердце",          image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ef6746fe-a013-4a1f-b13c-ee4ba77cbdde.jpg", price: 15,   anim: "gift-float",   rarity: "common"    },
  { id: 2, name: "Большое сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d5101150-851d-4fac-a845-1e0a6b6e8760.jpg", price: 50,   anim: "gift-pulse",   rarity: "common"    },
  { id: 3, name: "Горящее сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c0e7fc43-5495-4222-a90e-684e88902504.jpg", price: 99,   anim: "gift-shake",   rarity: "rare"      },
  { id: 4, name: "Золотое сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c4594718-6b05-4ca3-903f-ab3346f3b42f.jpg", price: 199,  anim: "gift-spin",    rarity: "rare"      },
  { id: 5, name: "Алмазное сердце", image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1291e5c7-6a4e-45a1-b12a-06e5e6e36f83.jpg", price: 499,  anim: "gift-sparkle", rarity: "epic"      },
  { id: 6, name: "Вечное сердце",   image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/52df7ba0-ca4a-49b1-a508-dd3763897e6b.jpg", price: 999,  anim: "gift-glow",    rarity: "epic"      },
  { id: 7, name: "Редкое сердце",   image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/80e59208-77ae-4950-86cf-1bd322436e12.jpg", price: 2499, anim: "gift-orbit",   rarity: "legendary" },
  { id: 8, name: "Легендарное",     image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/fb7a829f-4921-426d-83cf-c0b2729d4cf7.jpg", price: 4999, anim: "gift-rainbow", rarity: "legendary" },
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
  const [giftPreview, setGiftPreview] = useState<number | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<"self" | "user">("self");
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

      {/* Превью подарка */}
      {giftPreview !== null && (() => {
        const gift = GIFTS.find(g => g.id === giftPreview)!;
        const rs = RARITY_STYLE[gift.rarity];
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
            onClick={() => setGiftPreview(null)}>
            <div className="w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-4 animate-scale-in"
              style={{ background: "var(--spark-card)", border: `1px solid ${rs.border}`, boxShadow: `0 0 40px ${rs.border}` }}
              onClick={e => e.stopPropagation()}>
              <div className={`w-36 h-36 ${gift.anim}`}>
                <img src={gift.image} alt={gift.name} className="w-full h-full object-contain" style={{ borderRadius: 12 }} />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">{gift.name}</p>
                {rs.label && <p className="text-sm font-bold mt-1" style={{ color: rs.text }}>{rs.label}</p>}
                <p className="text-white/40 text-sm mt-1">{gift.price} звёзд</p>
              </div>

              {/* Выбор получателя */}
              <div className="w-full rounded-2xl overflow-hidden flex"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                <button onClick={() => setGiftRecipient("self")}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                  style={{ background: giftRecipient === "self" ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "transparent", color: giftRecipient === "self" ? "white" : "rgba(255,255,255,0.45)" }}>
                  <Icon name="User" size={14} />Себе
                </button>
                <button onClick={() => setGiftRecipient("user")}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                  style={{ background: giftRecipient === "user" ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "transparent", color: giftRecipient === "user" ? "white" : "rgba(255,255,255,0.45)", borderLeft: "1px solid rgba(255,255,255,0.12)" }}>
                  <Icon name="Heart" size={14} />Пользователю
                </button>
              </div>

              {giftRecipient === "user" && (
                <div className="w-full rounded-2xl px-4 py-3 text-sm text-white/50 flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon name="Info" size={14} className="flex-shrink-0" />
                  Откройте профиль пользователя и нажмите «Подарить» там
                </div>
              )}

              {giftDone === giftPreview ? (
                <div className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
                  style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}>
                  <Icon name="Check" size={16} className="text-green-400" />
                  <span className="text-green-400 font-semibold">Подарок куплен!</span>
                </div>
              ) : (
                <button
                  disabled={giftPaying || giftRecipient === "user"}
                  onClick={() => payGift({
                    amount: gift.price,
                    description: `Подарок себе «${gift.name}»`,
                    returnUrl: window.location.origin + "/?payment=success",
                    metadata: { gift_id: String(gift.id), gift_name: gift.name, recipient: "self" },
                  }).then(r => { if (r?.paymentUrl) setGiftDone(giftPreview); })}
                  className="w-full btn-grad py-3.5 font-bold text-white rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {giftPaying
                    ? <><Icon name="Loader2" size={16} className="animate-spin" />Обработка...</>
                    : giftRecipient === "user"
                      ? <><Icon name="Heart" size={16} />Откройте профиль пользователя</>
                      : <><Icon name="ShoppingBag" size={16} />Купить за {gift.price} ⭐</>}
                </button>
              )}
              <button onClick={() => setGiftPreview(null)} className="text-white/30 text-sm">Закрыть</button>
            </div>
          </div>
        );
      })()}

      {/* Модал подарков */}
      {showGifts && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          onClick={() => { setShowGifts(false); setGiftBuying(null); }}>
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
                <p className="text-white/40 text-xs mt-0.5">Нажми для просмотра • держи для выбора</p>
              </div>
              <button onClick={() => { setShowGifts(false); setGiftBuying(null); }} className="text-white/40">
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
                    <button key={gift.id}
                      onClick={() => { setGiftBuying(gift.id); setGiftDone(null); setGiftPreview(gift.id); setGiftRecipient("self"); }}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all active:scale-90 relative overflow-hidden"
                      style={{
                        background: selected ? rs.bg : "rgba(255,255,255,0.05)",
                        border: `1px solid ${selected ? rs.border : "rgba(255,255,255,0.1)"}`,
                        boxShadow: selected ? `0 0 18px ${rs.border}, inset 0 0 12px ${rs.bg}` : "none",
                      }}>
                      {rs.label && (
                        <span className="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded-md leading-none"
                          style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}>
                          {rs.label}
                        </span>
                      )}
                      <div className={`w-16 h-16 flex items-center justify-center ${gift.anim}`}>
                        <img src={gift.image} alt={gift.name} className="w-full h-full object-contain" style={{ borderRadius: 8 }} />
                      </div>
                      <p className="text-white/90 text-[10px] font-semibold leading-tight text-center line-clamp-2">{gift.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                        {gift.price} ⭐
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}