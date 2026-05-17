import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { postsApi, type Post, type PostComment } from "@/lib/api";
import { FALLBACK_PHOTO, timeAgo } from "@/components/screens/HomeFeedWidgets";

// ─── CommentSheet ─────────────────────────────────────────────────────────────
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
    setTimeout(() => inputRef.current?.focus(), 300);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="w-full max-w-sm flex flex-col animate-slide-up"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "75dvh" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-sm">Комментарии · {comments.length}</h3>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
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

        <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Написать комментарий..."
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
          <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
