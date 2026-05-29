import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminGift } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { timeAgo } from "./AdminUsersDrawer";

const FALLBACK_AVATAR = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

export function GiftsDrawer({ token, onClose }: { token: string; onClose: () => void }) {
  const [gifts, setGifts] = useState<AdminGift[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const d = await adminApi.giftsList(token, p);
      setTotal(d.total);
      setGifts(prev => reset ? d.gifts : [...prev, ...d.gifts]);
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
            <p className="text-white font-bold text-base">🎁 Подарки</p>
            {!loading && <p className="text-white/40 text-xs mt-0.5">{total} подарков</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
          {loading ? <div className="flex justify-center py-10"><Spinner /></div> :
          gifts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Icon name="Gift" size={32} className="text-white/15" />
              <p className="text-white/30 text-sm">Нет подарков</p>
            </div>
          ) : (
            <>
              {gifts.map(g => (
                <div key={g.id} className="rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {g.sender_photo
                        ? <img src={g.sender_photo} className="w-9 h-9 rounded-full object-cover flex-shrink-0" style={{ border: "2px solid rgba(251,191,36,0.3)" }} />
                        : <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                            style={{ background: "rgba(251,191,36,0.15)", color: "#FCD34D" }}>
                            {g.sender_name?.[0]?.toUpperCase() || "?"}
                          </div>}
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-xs truncate">{g.sender_name || "Аноним"}</p>
                        <p className="text-white/30 text-[10px]">отправил</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                      <span className="text-2xl">{g.gift_emoji}</span>
                      <p className="text-white/50 text-[9px] max-w-[60px] text-center truncate">{g.gift_name}</p>
                      {g.amount > 0 && <p className="text-yellow-400/70 text-[9px] font-bold">{Math.round(g.amount)} ₽</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <div className="min-w-0 text-right">
                        <p className="text-white font-semibold text-xs truncate">{g.receiver_name}</p>
                        <p className="text-white/30 text-[10px]">{timeAgo(g.created_at)}</p>
                      </div>
                      <img src={g.receiver_photo || FALLBACK_AVATAR}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        style={{ border: "2px solid rgba(255,45,120,0.3)" }} />
                    </div>
                  </div>
                </div>
              ))}
              {gifts.length < total && (
                <button onClick={() => load(page + 1, false)} disabled={loadingMore}
                  className="w-full py-3 rounded-2xl text-sm font-semibold mt-1 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                  {loadingMore
                    ? <Icon name="Loader2" size={16} className="animate-spin mx-auto text-white/40" />
                    : `Ещё ${total - gifts.length}`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GiftsDrawer;
