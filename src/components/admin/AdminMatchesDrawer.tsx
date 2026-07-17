import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminMatch } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { timeAgo } from "./AdminUsersDrawer";

const FALLBACK_AVATAR = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1ce048c9-36f3-4eb8-a0bc-4117b2b48365.jpg";

export function MatchesDrawer({ token, onClose }: { token: string; onClose: () => void }) {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const d = await adminApi.matchesList(token, p);
      setTotal(d.total);
      setMatches(prev => reset ? d.matches : [...prev, ...d.matches]);
      setPage(p);
    } catch { void 0; }
    finally { setLoading(false); setLoadingMore(false); }
  }, [token]);

  useEffect(() => { load(1, true); }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="mt-auto w-full max-h-[92vh] flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: "#110e1f", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <p className="text-white font-bold text-base">⚡ Совпадения</p>
            {!loading && <p className="text-white/40 text-xs mt-0.5">{total} пар</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
          {loading ? <div className="flex justify-center py-10"><Spinner /></div> :
          matches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Icon name="Zap" size={32} className="text-white/15" />
              <p className="text-white/30 text-sm">Нет совпадений</p>
            </div>
          ) : (
            <>
              {matches.map(m => (
                <div key={m.id} className="rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={m.user1_photo || FALLBACK_AVATAR}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        style={{ border: "2px solid rgba(255,45,120,0.3)" }} />
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{m.user1_name}</p>
                        {m.user1_age && <p className="text-white/35 text-xs">{m.user1_age} лет</p>}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                        <Icon name="Heart" size={14} className="text-white" />
                      </div>
                      <p className="text-white/25 text-[9px]">{timeAgo(m.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <div className="min-w-0 text-right">
                        <p className="text-white font-semibold text-sm truncate">{m.user2_name}</p>
                        {m.user2_age && <p className="text-white/35 text-xs">{m.user2_age} лет</p>}
                      </div>
                      <img src={m.user2_photo || FALLBACK_AVATAR}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        style={{ border: "2px solid rgba(155,89,182,0.3)" }} />
                    </div>
                  </div>
                </div>
              ))}
              {matches.length < total && (
                <button onClick={() => load(page + 1, false)} disabled={loadingMore}
                  className="w-full py-3 rounded-2xl text-sm font-semibold mt-1 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                  {loadingMore
                    ? <Icon name="Loader2" size={16} className="animate-spin mx-auto text-white/40" />
                    : `Ещё ${total - matches.length}`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchesDrawer;