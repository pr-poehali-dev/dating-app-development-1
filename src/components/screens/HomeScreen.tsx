import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { postsApi, liveApi, notificationsApi, matchesApi, profilesApi, messagesApi, type Post, type LiveStream, type User, type Profile, type Match } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { LiveBadge, TrendingBadge, CreateMenu } from "@/components/screens/HomeFeedWidgets";
import { CommentSheet } from "@/components/screens/HomeCommentSheet";
import { PostCard } from "@/components/screens/HomePostCard";
import { NotificationsSheet } from "@/components/screens/NotificationsSheet";
import { useYookassa } from "@/components/extensions/yookassa/useYookassa";
import { GIFTS, RARITY_STYLE, PAY_CREATE_URL } from "@/components/screens/ProfileGiftSheet";
import GiftItem from "@/components/gifts/GiftItem";

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
  const [giftCategory, setGiftCategory] = useState("heart");
  const { pay: payGift, loading: giftPaying } = useYookassa(PAY_CREATE_URL);

  // Выбор пользователя-получателя подарка
  const [chatMatches, setChatMatches] = useState<Match[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: number; name: string; photo_url?: string; match_id?: number } | null>(null);

  // Загружаем чаты при открытии превью с режимом "user"
  useEffect(() => {
    if (giftPreview !== null && giftRecipient === "user" && chatMatches.length === 0) {
      matchesApi.getAll().then(d => setChatMatches(d.matches)).catch(() => {});
    }
  }, [giftPreview, giftRecipient, chatMatches.length]);

  // Поиск пользователей по нику
  useEffect(() => {
    if (giftRecipient !== "user" || !userSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const q = userSearch.trim();
    if (q.length < 2) return;
    setSearching(true);
    const t = setTimeout(() => {
      profilesApi.getDiscover({ search: q })
        .then(d => setSearchResults(d.profiles.slice(0, 8)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [userSearch, giftRecipient]);

  // Сбрасываем выбранного при переключении на "себе" или закрытии
  useEffect(() => {
    if (giftRecipient === "self" || giftPreview === null) {
      setSelectedRecipient(null);
      setUserSearch("");
      setSearchResults([]);
    }
  }, [giftRecipient, giftPreview]);

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
              <div className="w-36 h-36 flex items-center justify-center">
                <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"} variant={gift.variant ?? 0} animKey={gift.anim} size={144} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">{gift.name}</p>
                {rs.label && <p className="text-sm font-bold mt-1" style={{ color: rs.text }}>{rs.label}</p>}
                <p className="text-white/40 text-sm mt-1">{gift.price.toLocaleString("ru")} ₽</p>
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
                <div className="w-full flex flex-col gap-2">
                  {selectedRecipient ? (
                    <div className="w-full rounded-2xl px-3 py-2.5 flex items-center gap-3"
                      style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.35)" }}>
                      {selectedRecipient.photo_url ? (
                        <img src={selectedRecipient.photo_url} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                          <Icon name="User" size={18} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{selectedRecipient.name}</p>
                        <p className="text-white/40 text-xs">Получатель подарка</p>
                      </div>
                      <button onClick={() => setSelectedRecipient(null)}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.1)" }}>
                        <Icon name="X" size={14} className="text-white/70" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Поиск по нику */}
                      <div className="w-full relative">
                        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Поиск по нику..."
                          className="w-full rounded-2xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                      </div>

                      {/* Результаты поиска */}
                      {userSearch.trim().length >= 2 && (
                        <div className="w-full max-h-40 overflow-y-auto rounded-2xl"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {searching ? (
                            <div className="flex items-center justify-center py-3 text-white/40 text-xs gap-2">
                              <Icon name="Loader2" size={12} className="animate-spin" />Поиск...
                            </div>
                          ) : searchResults.length === 0 ? (
                            <div className="text-center py-3 text-white/40 text-xs">Никого не найдено</div>
                          ) : (
                            searchResults.map(p => (
                              <button key={p.id}
                                onClick={() => setSelectedRecipient({ id: p.id, name: p.name, photo_url: p.photo_url })}
                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors">
                                {p.photo_url ? (
                                  <img src={p.photo_url} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <Icon name="User" size={14} className="text-white/50" />
                                  </div>
                                )}
                                <span className="text-white text-sm truncate flex-1 text-left">{p.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      {/* Список из чатов */}
                      {userSearch.trim().length < 2 && (
                        <div className="w-full">
                          <p className="text-white/40 text-xs px-1 pb-1.5 font-semibold">ИЗ ЧАТОВ</p>
                          {chatMatches.length === 0 ? (
                            <div className="text-center py-3 text-white/30 text-xs rounded-2xl"
                              style={{ background: "rgba(255,255,255,0.04)" }}>
                              Нет активных чатов
                            </div>
                          ) : (
                            <div className="max-h-40 overflow-y-auto rounded-2xl"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              {chatMatches.map(m => (
                                <button key={m.match_id}
                                  onClick={() => setSelectedRecipient({ id: m.partner_id, name: m.name, photo_url: m.photo_url, match_id: m.match_id })}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors">
                                  {m.photo_url ? (
                                    <img src={m.photo_url} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                      <Icon name="User" size={14} className="text-white/50" />
                                    </div>
                                  )}
                                  <span className="text-white text-sm truncate flex-1 text-left">{m.name}</span>
                                  {m.online && <span className="w-2 h-2 rounded-full bg-green-400" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
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
                  disabled={giftPaying || (giftRecipient === "user" && !selectedRecipient)}
                  onClick={async () => {
                    const isUser = giftRecipient === "user" && selectedRecipient;
                    const senderToken = localStorage.getItem("spark_token") || "";
                    const r = await payGift({
                      amount: gift.price,
                      description: isUser
                        ? `Подарок «${gift.name}» для ${selectedRecipient!.name}`
                        : `Подарок себе «${gift.name}»`,
                      returnUrl: window.location.origin + "/?payment=success",
                      metadata: isUser
                        ? {
                            kind: "gift",
                            gift_id: String(gift.id),
                            gift_name: gift.name,
                            gift_emoji: gift.emoji,
                            gift_category: gift.category,
                            gift_variant: String(gift.variant),
                            gift_rarity: gift.rarity,
                            recipient_id: String(selectedRecipient!.id),
                            sender_token: senderToken,
                          }
                        : { gift_id: String(gift.id), gift_name: gift.name, recipient: "self" },
                    });
                    if (r?.paymentUrl) {
                      setGiftDone(giftPreview);
                      // Отправляем подарок в чат
                      if (isUser) {
                        const giftMsg = `__GIFT__${gift.id}|${gift.name}|${gift.emoji}`;
                        try {
                          if (selectedRecipient!.match_id) {
                            await messagesApi.send(selectedRecipient!.match_id, giftMsg);
                          } else {
                            await messagesApi.sendDirect(selectedRecipient!.id, giftMsg);
                          }
                        } catch (e) { void e; }
                      }
                    }
                  }}
                  className="w-full btn-grad py-3.5 font-bold text-white rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {giftPaying
                    ? <><Icon name="Loader2" size={16} className="animate-spin" />Обработка...</>
                    : giftRecipient === "user" && !selectedRecipient
                      ? <><Icon name="UserPlus" size={16} />Выберите получателя</>
                      : giftRecipient === "user"
                        ? <><Icon name="Gift" size={16} />Подарить за {gift.price.toLocaleString("ru")} ₽</>
                        : <><Icon name="ShoppingBag" size={16} />Купить за {gift.price.toLocaleString("ru")} ₽</>}
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
            <div className="flex items-center justify-between px-5 pb-2 pt-1 flex-shrink-0">
              <div>
                <p className="text-white font-bold text-lg">Подарки</p>
                <p className="text-white/40 text-xs mt-0.5">Выбери и подари себе</p>
              </div>
              <button onClick={() => { setShowGifts(false); setGiftBuying(null); }} className="text-white/40">
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Категории */}
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar flex-shrink-0">
              {([{ id: "heart", label: "Сердца", emoji: "❤️" }, { id: "rose", label: "Розы", emoji: "🌹" }, { id: "bear", label: "Мишки", emoji: "🧸" }, { id: "ring", label: "Кольца", emoji: "💍" }] as const).map(cat => (
                <button key={cat.id}
                  onClick={() => setGiftCategory(cat.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl flex-shrink-0 transition-all text-sm font-semibold active:scale-95"
                  style={giftCategory === cat.id
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                  <span>{cat.emoji}</span><span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Сетка подарков */}
            <div className="overflow-y-auto px-4 pb-8">
              <div className="grid grid-cols-4 gap-2.5">
                {GIFTS.filter(g => g.category === giftCategory).map((gift) => {
                  const rs = RARITY_STYLE[gift.rarity];
                  const selected = giftBuying === gift.id;
                  return (
                    <button key={gift.id}
                      onClick={() => { setGiftBuying(gift.id); setGiftDone(null); setGiftPreview(gift.id); setGiftRecipient("self"); }}
                      className="flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-1 rounded-2xl transition-all active:scale-90 relative overflow-hidden"
                      style={{
                        background: selected ? rs.bg : "rgba(255,255,255,0.05)",
                        border: `1.5px solid ${selected ? rs.border : "rgba(255,255,255,0.08)"}`,
                        boxShadow: selected ? rs.glow : "none",
                      }}>
                      {rs.label && (
                        <span className="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded-md leading-none"
                          style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}>
                          {rs.label}
                        </span>
                      )}
                      <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"} variant={gift.variant ?? 0} animKey={gift.anim} size={54} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} selected={selected} />
                      <p className="text-white/90 text-[10px] font-semibold leading-tight text-center line-clamp-2 w-full px-0.5">{gift.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                        style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                        {gift.price.toLocaleString("ru")} ₽
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