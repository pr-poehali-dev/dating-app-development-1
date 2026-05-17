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
  const [hidden, setHidden] = useState(false);
  const [reported, setReported] = useState(false);

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
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowMenu(false)}>
          <div className="w-full max-w-sm pb-6 px-4" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(30,24,40,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <button onClick={async () => {
                  if (!reported) {
                    setReported(true);
                    await postsApi.reportPost(post.id).catch(() => {});
                  }
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Icon name="Flag" size={18} className="text-red-400" />
                <div>
                  <p className="text-white text-sm font-semibold">{reported ? "Жалоба отправлена ✓" : "Пожаловаться"}</p>
                  {!reported && <p className="text-white/40 text-xs mt-0.5">Нарушение правил сообщества</p>}
                </div>
              </button>
              <button onClick={() => { setHidden(true); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/5">
                <Icon name="EyeOff" size={18} className="text-white/50" />
                <div>
                  <p className="text-white text-sm font-semibold">Скрыть пост</p>
                  <p className="text-white/40 text-xs mt-0.5">Этот пост больше не будет показываться</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowMenu(false)}
              className="w-full mt-2 py-4 rounded-2xl text-white/60 font-semibold text-sm"
              style={{ background: "rgba(30,24,40,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Отмена
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Author row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            className="relative"
            onClick={() => onProfileClick({ id: post.user_id, name: post.author_name, photo_url: post.author_photo } as Profile)}>
            <img src={post.author_photo || FALLBACK_PHOTO}
              className="w-9 h-9 rounded-full object-cover"
              style={{ border: "2px solid rgba(255,45,120,0.5)" }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{post.author_name}</p>
            <p className="text-white/40 text-[10px]">{timeAgo(post.created_at)}</p>
          </div>
          {isOwn ? (
            <button onClick={() => setShowConfirm(true)}
              className="p-1.5 text-white/30 hover:text-white/70 transition-colors">
              <Icon name="Trash2" size={16} />
            </button>
          ) : (
            <button onClick={() => setShowMenu(true)}
              className="p-1.5 text-white/30 hover:text-white/70 transition-colors">
              <Icon name="MoreVertical" size={18} />
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
