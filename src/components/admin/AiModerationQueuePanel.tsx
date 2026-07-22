import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminReq } from "./SecurityShared";
import { Spinner } from "./AdminLogin";

type QueueItem = {
  id: number;
  content_type: string;
  content_id: number | null;
  user_id: number;
  text_snippet: string | null;
  photo_url: string | null;
  ai_verdict: string;
  ai_score: number | null;
  ai_categories: string[];
  ai_reason: string | null;
  priority: "high" | "medium" | "low";
  status: string;
  created_at: string;
  user_name: string;
  username: string;
  user_photo: string | null;
  ai_violation_count: number;
};

type Stats = {
  pending_review: number;
  auto_blocked_24h: number;
  checked_24h: number;
  high_priority: number;
  by_type: Record<string, number>;
};

const CONTENT_LABEL: Record<string, { label: string; icon: string }> = {
  message: { label: "Сообщение", icon: "MessageCircle" },
  post: { label: "Пост", icon: "Image" },
  comment: { label: "Комментарий", icon: "MessageSquare" },
  profile_photo: { label: "Фото профиля", icon: "User" },
  selfie: { label: "Селфи (верификация)", icon: "ScanFace" },
  bio: { label: "Описание", icon: "FileText" },
  stream: { label: "Кадр эфира", icon: "Radio" },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: "rgba(239,68,68,0.15)", color: "#F87171", label: "Высокий" },
  medium: { bg: "rgba(245,158,11,0.15)", color: "#FBBF24", label: "Средний" },
  low: { bg: "rgba(148,163,184,0.15)", color: "#94A3B8", label: "Низкий" },
};

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl p-3 flex flex-col gap-1.5 flex-1 min-w-[110px]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
        <Icon name={icon as "Shield"} size={13} style={{ color }} />
      </div>
      <p className="text-white text-lg font-black leading-none">{value}</p>
      <p className="text-white/35 text-[10px]">{label}</p>
    </div>
  );
}

function QueueCard({ item, onResolve }: { item: QueueItem; onResolve: (id: number, decision: "approve" | "remove" | "ban") => void }) {
  const [busy, setBusy] = useState(false);
  const pStyle = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.low;
  const cInfo = CONTENT_LABEL[item.content_type] || { label: item.content_type, icon: "AlertCircle" };

  const handle = async (decision: "approve" | "remove" | "ban") => {
    setBusy(true);
    try { await onResolve(item.id, decision); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.user_photo
            ? <img src={item.user_photo} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
            : <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}><Icon name="User" size={14} className="text-white/40" /></div>}
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{item.user_name}</p>
            <p className="text-white/30 text-xs truncate">@{item.username} · нарушений: {item.ai_violation_count}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: pStyle.bg, color: pStyle.color }}>
            {pStyle.label}
          </span>
          {item.ai_score != null && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(255,45,120,0.12)", color: "#FF2D78" }}>
              {Math.round(item.ai_score)}%
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-white/40 text-[11px]">
        <Icon name={cInfo.icon as "AlertCircle"} size={12} />
        {cInfo.label}
        {item.ai_categories?.length > 0 && (
          <span className="text-white/25">· {item.ai_categories.join(", ")}</span>
        )}
      </div>

      {item.photo_url && (
        <img src={item.photo_url} className="w-full max-h-56 object-cover rounded-xl" alt="контент" />
      )}
      {item.text_snippet && (
        <p className="text-white/70 text-sm rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
          «{item.text_snippet}»
        </p>
      )}
      {item.ai_reason && (
        <p className="text-white/40 text-xs flex items-start gap-1.5">
          <Icon name="Sparkles" size={12} className="flex-shrink-0 mt-0.5" />
          {item.ai_reason}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => handle("approve")} disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.25)" }}>
          <Icon name="Check" size={13} /> Одобрить
        </button>
        <button onClick={() => handle("remove")} disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "rgba(245,158,11,0.12)", color: "#FBBF24", border: "1px solid rgba(245,158,11,0.25)" }}>
          <Icon name="Trash2" size={13} /> Удалить
        </button>
        <button onClick={() => handle("ban")} disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)" }}>
          <Icon name="Ban" size={13} /> Забанить
        </button>
      </div>
    </div>
  );
}

function RecheckPostPanel({ token, onDone }: { token: string; onDone: () => void }) {
  const [postId, setPostId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ verdict: string; score: number; reason: string; categories: string[]; flagged: boolean; deleted?: boolean } | null>(null);
  const [error, setError] = useState("");

  const run = async () => {
    const id = parseInt(postId, 10);
    if (!id) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const d = await adminReq(token, "ai_recheck_post", { post_id: id });
      if (d.ok) {
        setResult(d);
        onDone();
      } else {
        setError(d.error || "Ошибка проверки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setBusy(false);
    }
  };

  const verdictStyle: Record<string, { color: string; label: string }> = {
    safe: { color: "#4ADE80", label: "Всё чисто" },
    suspicious: { color: "#FBBF24", label: "Подозрительно — в очереди" },
    violation: { color: "#F87171", label: "Нарушение — удалено" },
  };

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div>
        <p className="text-white text-sm font-semibold">Перепроверить пост по ID</p>
        <p className="text-white/35 text-xs mt-0.5">Для постов, опубликованных до подключения ИИ</p>
      </div>
      <div className="flex gap-2">
        <input value={postId} onChange={e => setPostId(e.target.value.replace(/\D/g, ""))}
          placeholder="Например, 70" inputMode="numeric"
          onKeyDown={e => e.key === "Enter" && run()}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
        <button onClick={run} disabled={busy || !postId.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          {busy ? <Icon name="Loader2" size={13} className="animate-spin" /> : "Проверить"}
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
      {result && (
        <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "rgba(255,255,255,0.04)" }}>
          <p className="text-sm font-bold" style={{ color: (verdictStyle[result.verdict] || verdictStyle.safe).color }}>
            {(verdictStyle[result.verdict] || verdictStyle.safe).label} · {Math.round(result.score)}%
          </p>
          {result.reason && <p className="text-white/50 text-xs">{result.reason}</p>}
          {result.categories?.length > 0 && <p className="text-white/35 text-xs">Категории: {result.categories.join(", ")}</p>}
        </div>
      )}
    </div>
  );
}

function RecheckCommentPanel({ token, onDone }: { token: string; onDone: () => void }) {
  const [commentId, setCommentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ verdict: string; score: number; reason: string; categories: string[]; flagged: boolean; deleted?: boolean } | null>(null);
  const [error, setError] = useState("");

  const run = async () => {
    const id = parseInt(commentId, 10);
    if (!id) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const d = await adminReq(token, "ai_recheck_comment", { comment_id: id });
      if (d.ok) {
        setResult(d);
        onDone();
      } else {
        setError(d.error || "Ошибка проверки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setBusy(false);
    }
  };

  const verdictStyle: Record<string, { color: string; label: string }> = {
    safe: { color: "#4ADE80", label: "Всё чисто" },
    suspicious: { color: "#FBBF24", label: "Подозрительно — в очереди" },
    violation: { color: "#F87171", label: "Нарушение — удалено" },
  };

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div>
        <p className="text-white text-sm font-semibold">Перепроверить комментарий по ID</p>
        <p className="text-white/35 text-xs mt-0.5">Для комментариев, оставленных до подключения ИИ</p>
      </div>
      <div className="flex gap-2">
        <input value={commentId} onChange={e => setCommentId(e.target.value.replace(/\D/g, ""))}
          placeholder="Например, 13" inputMode="numeric"
          onKeyDown={e => e.key === "Enter" && run()}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
        <button onClick={run} disabled={busy || !commentId.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          {busy ? <Icon name="Loader2" size={13} className="animate-spin" /> : "Проверить"}
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
      {result && (
        <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "rgba(255,255,255,0.04)" }}>
          <p className="text-sm font-bold" style={{ color: (verdictStyle[result.verdict] || verdictStyle.safe).color }}>
            {(verdictStyle[result.verdict] || verdictStyle.safe).label} · {Math.round(result.score)}%
          </p>
          {result.reason && <p className="text-white/50 text-xs">{result.reason}</p>}
          {result.categories?.length > 0 && <p className="text-white/35 text-xs">Категории: {result.categories.join(", ")}</p>}
        </div>
      )}
    </div>
  );
}

export function AiModerationQueuePanel({
  token,
  contentType,
  status = "needs_review",
  hideRecheck = false,
  hideStats = false,
  emptyText = "Очередь пуста — всё чисто",
}: {
  token: string;
  contentType?: string;
  status?: string;
  hideRecheck?: boolean;
  hideStats?: boolean;
  emptyText?: string;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("");

  const load = () => {
    setLoading(true);
    const queueParams: Record<string, string> = { status };
    if (priorityFilter) queueParams.priority = priorityFilter;
    if (contentType) queueParams.content_type = contentType;
    Promise.all([
      adminReq(token, "ai_queue", undefined, queueParams),
      hideStats ? Promise.resolve(null) : adminReq(token, "ai_stats"),
    ]).then(([q, s]) => { setItems(q.items || []); if (s) setStats(s); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [priorityFilter]);

  const handleResolve = async (id: number, decision: "approve" | "remove" | "ban") => {
    await adminReq(token, "ai_queue_resolve", { id, decision }).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
    load();
  };

  return (
    <>
      {!hideRecheck && <RecheckPostPanel token={token} onDone={load} />}
      {!hideRecheck && <RecheckCommentPanel token={token} onDone={load} />}
      {!hideStats && stats && (
        <div className="flex gap-2 flex-wrap">
          <StatCard icon="Clock" label="На проверке" value={stats.pending_review} color="#FBBF24" />
          <StatCard icon="ShieldOff" label="Заблокировано ИИ (24ч)" value={stats.auto_blocked_24h} color="#F87171" />
          <StatCard icon="ScanEye" label="Проверено (24ч)" value={stats.checked_24h} color="#60A5FA" />
          <StatCard icon="Flame" label="Высокий приоритет" value={stats.high_priority} color="#FF2D78" />
        </div>
      )}

      <div className="flex gap-1.5">
        {[{ id: "", label: "Все" }, { id: "high", label: "Высокий" }, { id: "medium", label: "Средний" }, { id: "low", label: "Низкий" }].map(f => (
          <button key={f.id} onClick={() => setPriorityFilter(f.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={priorityFilter === f.id
              ? { background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.2))", color: "white", boxShadow: "inset 0 0 0 1px rgba(255,45,120,0.3)" }
              : { color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.03)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Icon name="ShieldCheck" size={32} className="text-white/15" />
          <p className="text-white/25 text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => (
            <QueueCard key={item.id} item={item} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </>
  );
}

export default AiModerationQueuePanel;