import { useState } from "react";
import Icon from "@/components/ui/icon";
import { postsApi, type Post, type Profile } from "@/lib/api";
import { FALLBACK_PHOTO, DeleteConfirm, timeAgo } from "@/components/screens/HomeFeedWidgets";

// ─── PostCard ─────────────────────────────────────────────────────────────────
export function PostCard({ post, currentUserId, onLike, onComment, onDelete, onProfileClick }: {
  post: Post;
  currentUserId: number;
  onLike: (p: Post) => void;
  onComment: (p: Post) => void;
  onDelete: (p: Post) => void;
  onProfileClick: (profile: Profile) => void;
}) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [count, setCount] = useState(post.likes_count);
  const [bouncing, setBouncing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reported, setReported] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);

  const isOwn = post.user_id === currentUserId;

  const handleLike = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);
    const next = !liked;
    setLiked(next);
    setCount((c) => next ? c + 1 : c - 1);
    onLike(post);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      handleLike();
      setDoubleTapHeart(true);
      setTimeout(() => setDoubleTapHeart(false), 900);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postsApi.deletePost(post.id);
      onDelete(post);
    } catch (e: unknown) { void e; }
    finally { setDeleting(false); setShowConfirm(false); }
  };

  if (hidden) return null;

  return (
    <>
      {showConfirm && (
        <DeleteConfirm
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}

      {/* Меню 3 точки для чужих постов */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowMenu(false)}>
          <div className="w-full max-w-sm pb-8 px-4" onClick={(e) => e.stopPropagation()}>
            {/* Хэндл */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            </div>
            <div className="rounded-2xl overflow-hidden mb-2"
              style={{ background: "rgba(28,22,40,0.98)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <button onClick={() => { setShowMenu(false); if (!reported) setShowReport(true); }}
                className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-white/5 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.12)" }}>
                  <Icon name="Flag" size={17} className="text-red-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{reported ? "Жалоба отправлена ✓" : "Пожаловаться"}</p>
                  {!reported && <p className="text-white/40 text-xs mt-0.5">Нарушение правил сообщества</p>}
                </div>
              </button>
              <button onClick={() => { setHidden(true); setShowMenu(false); }}
                className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  <Icon name="EyeOff" size={17} className="text-white/50" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Скрыть пост</p>
                  <p className="text-white/40 text-xs mt-0.5">Этот пост больше не будет показываться</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowMenu(false)}
              className="w-full py-4 rounded-2xl text-white/60 font-semibold text-sm active:opacity-70 transition-opacity"
              style={{ background: "rgba(28,22,40,0.98)", border: "1px solid rgba(255,255,255,0.09)" }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Шторка: выбор причины жалобы */}
      {showReport && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowReport(false)}>
          <div className="w-full max-w-sm flex flex-col"
            style={{ background: "#0f0a1a", borderRadius: "24px 24px 0 0", maxHeight: "92dvh" }}
            onClick={e => e.stopPropagation()}>

            {/* Хэндл + заголовок */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-6" />
              <h3 className="text-white font-bold text-sm">Пожаловаться</h3>
              <button onClick={() => setShowReport(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <Icon name="X" size={16} className="text-white/70" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 flex flex-col gap-4">
              {/* Заголовок */}
              <div className="flex flex-col gap-2 mb-1">
                <h2 className="text-white font-bold text-xl leading-tight">
                  Почему вы хотите пожаловаться на эту публикацию?
                </h2>
                <p className="text-white/40 text-sm leading-relaxed">
                  Ваша жалоба является анонимной. Если кому-то угрожает опасность, не ждите — позвоните в местную службу спасения.
                </p>
              </div>

              {/* Причины */}
              {[
                { label: "Мне это не нравится",                                              code: "other" },
                { label: "Травля или нежелательный контакт",                                code: "abuse" },
                { label: "Самоубийство, нанесение себе увечий или расстройства пищевого поведения", code: "abuse" },
                { label: "Насилие, ненависть или эксплуатация",                             code: "abuse" },
                { label: "Продажа или реклама товаров с ограничениями",                     code: "spam" },
                { label: "Изображение обнажённого тела или действий сексуального характера", code: "photo" },
                { label: "Мошенничество, обман или спам",                                   code: "spam" },
                { label: "Ложная информация",                                               code: "fake" },
                { label: "Интеллектуальная собственность",                                  code: "other" },
              ].map(({ label, code }) => (
                <button
                  key={label}
                  onClick={async () => {
                    setReported(true);
                    setShowReport(false);
                    await postsApi.reportPost(post.id, code).catch(() => {});
                  }}
                  className="w-full flex items-center justify-between py-4 text-left active:opacity-60 transition-opacity"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-white text-[15px] leading-snug pr-4">{label}</span>
                  <Icon name="ChevronRight" size={18} className="text-white/30 flex-shrink-0" />
                </button>
              ))}

              <div className="h-2" />
            </div>
          </div>
        </div>
      )}

      {/* Карточка */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Шапка автора */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            className="relative flex-shrink-0"
            onClick={() => onProfileClick({ id: post.user_id, name: post.author_name, photo_url: post.author_photo } as Profile)}>
            <img
              src={post.author_photo || FALLBACK_PHOTO}
              className="w-10 h-10 rounded-full object-cover"
              style={{ border: "2px solid rgba(255,45,120,0.6)", boxShadow: "0 0 0 1px rgba(255,45,120,0.2)" }}
            />
            {/* Онлайн-точка (условно) */}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">{post.author_name}</p>
            <p className="text-white/35 text-[11px] mt-0.5">{timeAgo(post.created_at)}</p>
          </div>
          {isOwn ? (
            <button onClick={() => setShowConfirm(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{ background: "rgba(239,68,68,0.1)" }}>
              <Icon name="Trash2" size={15} className="text-red-400" />
            </button>
          ) : (
            <button onClick={() => setShowMenu(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <Icon name="MoreHorizontal" size={17} className="text-white/50" />
            </button>
          )}
        </div>

        {/* Фото */}
        <div className="relative mx-3 rounded-2xl overflow-hidden" onDoubleClick={handleDoubleTap}>
          <img
            src={post.photo_url}
            className="w-full object-cover cursor-pointer"
            style={{ maxHeight: 420 }}
            onClick={() => setLightbox(true)}
          />
          {/* Анимация сердца при двойном тапе */}
          {doubleTapHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ animation: "heartPop 0.9s ease forwards" }}>
                <Icon name="Heart" size={72} style={{ color: "#FF2D78", fill: "#FF2D78", filter: "drop-shadow(0 0 20px rgba(255,45,120,0.8))" }} />
              </div>
            </div>
          )}
        </div>

        {/* Действия */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-1">
          {/* Лайк */}
          <button onClick={handleLike}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-90"
            style={{
              background: liked ? "rgba(255,45,120,0.12)" : "rgba(255,255,255,0.05)",
              border: liked ? "1px solid rgba(255,45,120,0.25)" : "1px solid rgba(255,255,255,0.08)",
              transform: bouncing ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s, background 0.2s",
            }}>
            <Icon name="Heart" size={18}
              style={{ color: liked ? "#FF2D78" : "rgba(255,255,255,0.55)", fill: liked ? "#FF2D78" : "transparent", transition: "all 0.2s" }} />
            <span className="text-sm font-semibold"
              style={{ color: liked ? "#FF2D78" : "rgba(255,255,255,0.55)" }}>{count}</span>
          </button>

          {/* Комментарий */}
          <button onClick={() => onComment(post)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon name="MessageCircle" size={18} className="text-white/55" />
            <span className="text-white/55 text-sm font-semibold">{post.comments_count}</span>
          </button>
        </div>

        {/* Подпись */}
        {post.caption && (
          <div className="px-4 pb-4">
            <span className="text-white font-bold text-sm">{post.author_name} </span>
            <span className="text-white/65 text-sm leading-relaxed">{post.caption}</span>
          </div>
        )}

        {!post.caption && <div className="pb-3" />}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(false)}>
          <img src={post.photo_url} className="max-w-full max-h-full object-contain px-4" />
          <button className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}
            onClick={() => setLightbox(false)}>
            <Icon name="X" size={20} className="text-white" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes heartPop {
          0%   { opacity: 0; transform: scale(0.3); }
          30%  { opacity: 1; transform: scale(1.2); }
          60%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}