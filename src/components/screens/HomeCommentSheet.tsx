import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { postsApi, type Post, type PostComment } from "@/lib/api";
import { FALLBACK_PHOTO, timeAgo } from "@/components/screens/HomeFeedWidgets";

// ─── CommentSheet ─────────────────────────────────────────────────────────────
// Полноэкранное окно поста с комментариями и кнопкой "Назад"
export function CommentSheet({ post, onClose }: { post: Post; onClose: () => void }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--spark-dark,#0f0a1a)" }}>
      {/* Шапка с кнопкой назад */}
      <div className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 12px)", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ArrowLeft" size={20} className="text-white" />
        </button>
        <h3 className="text-white font-bold text-base">Пост</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Автор поста */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <img src={post.author_photo || FALLBACK_PHOTO} className="w-10 h-10 rounded-full object-cover"
            style={{ border: "2px solid rgba(255,45,120,0.5)" }} />
          <div>
            <p className="text-white font-semibold text-sm">{post.author_name}</p>
            <p className="text-white/40 text-xs">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        {/* Фото поста */}
        <div className="px-3">
          <img src={post.photo_url} className="w-full rounded-2xl object-cover" style={{ maxHeight: 300 }} />
        </div>

        {/* Лайки/комментарии */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-white/60 text-sm">
            <Icon name="Heart" size={20} style={{ color: post.liked_by_me ? "#FF2D78" : "rgba(255,255,255,0.5)", fill: post.liked_by_me ? "#FF2D78" : "transparent" }} />
            {post.likes_count}
          </span>
          <span className="flex items-center gap-1.5 text-white/40 text-sm">
            <Icon name="MessageCircle" size={19} />{comments.length}
          </span>
        </div>

        {/* Подпись */}
        {post.caption && (
          <div className="px-4 pb-3">
            <span className="text-white font-semibold text-sm">{post.author_name} </span>
            <span className="text-white/70 text-sm">{post.caption}</span>
          </div>
        )}

        <div className="px-4 pt-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wide mt-2 mb-1">Комментарии · {comments.length}</h4>
        </div>

        {/* Список комментариев */}
        <div className="px-4 pb-4 flex flex-col gap-3">
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
      </div>

      {/* Поле ввода комментария */}
      <div className="px-4 py-3 flex gap-2 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 12px)" }}>
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Написать комментарий..."
          className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
        <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
          <Icon name="Send" size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}