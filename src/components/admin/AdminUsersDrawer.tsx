/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminUser } from "@/lib/api";
import { Spinner } from "./AdminLogin";

export type UserFilter = "all" | "online" | "verified" | "premium" | "new_today" | "new_week" | "new_month";

export function timeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days < 30) return `${days} дн. назад`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 мес. назад" : `${months} мес. назад`;
}

function PushToggleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
      style={open
        ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
        : { background: "rgba(255,45,120,0.12)", border: "1px solid rgba(255,45,120,0.25)" }}
      title="Отправить push">
      <Icon name={open ? "X" : "Bell"} size={14} style={{ color: open ? "#fff" : "#FF2D78" }} />
    </button>
  );
}

function PushForm({ token, userId, userName, onDone }: { token: string; userId: number; userName: string; onDone: () => void }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const send = async () => {
    if (!text.trim()) return;
    setStatus("sending"); setErrMsg("");
    try {
      await adminApi.oneSignalSendToUser(token, userId, "Полутон 💕", text.trim());
      setStatus("sent");
      setTimeout(onDone, 1500);
    } catch (e) {
      setStatus("error");
      setErrMsg(e instanceof Error ? e.message : "Ошибка");
    }
  };

  return (
    <div className="w-full mt-2.5 flex flex-col gap-2 p-2.5 rounded-xl"
      style={{ background: "rgba(255,45,120,0.06)", border: "1px solid rgba(255,45,120,0.15)" }}>
      <p className="text-white/50 text-[11px] font-semibold">Push для {userName}</p>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={180}
        placeholder="Текст уведомления..."
        className="w-full rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 outline-none resize-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
      {status === "error" && <p className="text-red-400/80 text-[10px] break-all">{errMsg}</p>}
      {status === "sent" && <p className="text-green-400/80 text-[10px]">Отправлено ✓</p>}
      <button onClick={send} disabled={status === "sending" || status === "sent" || !text.trim()}
        className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5"
        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
        {status === "sending"
          ? <Icon name="Loader2" size={13} className="animate-spin" />
          : status === "sent"
            ? <>Отправлено ✓</>
            : <><Icon name="Send" size={12} />Отправить</>}
      </button>
    </div>
  );
}

export function UsersDrawer({ token, filter, title, onClose }: {
  token: string;
  filter: UserFilter;
  title: string;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pushOpenId, setPushOpenId] = useState<number | null>(null);

  const filterUsers = useCallback((list: AdminUser[]) => {
    const now = new Date();
    if (filter === "online") return list.filter(u => u.online);
    if (filter === "verified") return list.filter(u => u.verified);
    if (filter === "premium") return list.filter(u => u.premium);
    if (filter === "new_today") return list.filter(u => {
      const d = new Date(u.created_at);
      return d.toDateString() === now.toDateString();
    });
    if (filter === "new_week") return list.filter(u => {
      const d = new Date(u.created_at);
      return (now.getTime() - d.getTime()) <= 7 * 86400000;
    });
    if (filter === "new_month") return list.filter(u => {
      const d = new Date(u.created_at);
      return (now.getTime() - d.getTime()) <= 30 * 86400000;
    });
    return list;
  }, [filter]);

  const load = useCallback(async (p: number, q: string, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const d = await adminApi.users(token, p, q);
      const filtered = filterUsers(d.users);
      setTotal(filter === "all" ? d.total : filtered.length);
      setUsers(prev => reset ? filtered : [...prev, ...filtered]);
      setPage(p);
    } catch { void 0; }
    finally { setLoading(false); setLoadingMore(false); }
  }, [token, filter, filterUsers]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(1, search, true); }, [token, filter]);

  const handleSearch = (val: string) => {
    setSearch(val);
    load(1, val, true);
  };

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
            <p className="text-white font-bold text-base">{title}</p>
            {!loading && <p className="text-white/40 text-xs mt-0.5">{total} пользователей</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>

        <div className="px-5 py-3 flex-shrink-0">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Поиск по имени, email..."
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Icon name="Users" size={32} className="text-white/15" />
              <p className="text-white/30 text-sm">Нет пользователей</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map(u => (
                <div key={u.id} className="flex flex-col p-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                 <div className="flex items-center gap-3">

                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: u.banned ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
                      {u.name[0]?.toUpperCase()}
                    </div>
                    {u.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400"
                        style={{ border: "2px solid #110e1f" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-white font-semibold text-sm truncate">
                        {u.name}{u.age ? `, ${u.age}` : ""}
                      </p>
                      {u.verified && <Icon name="BadgeCheck" size={13} style={{ color: "#38BDF8" }} className="flex-shrink-0" />}
                      {u.premium && <Icon name="Crown" size={12} style={{ color: "#FCD34D" }} className="flex-shrink-0" />}
                      {u.banned && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}>бан</span>}
                    </div>
                    <p className="text-white/35 text-xs truncate">{u.email}</p>
                    {u.city && <p className="text-white/25 text-[10px] truncate">{u.city}</p>}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-white/25 text-[10px]">{timeAgo(u.created_at)}</p>
                    <p className="text-white/15 text-[9px] mt-0.5">#{u.id}</p>
                  </div>

                  <PushToggleButton open={pushOpenId === u.id}
                    onToggle={() => setPushOpenId(prev => prev === u.id ? null : u.id)} />
                 </div>
                 {pushOpenId === u.id && (
                   <PushForm token={token} userId={u.id} userName={u.name}
                     onDone={() => setPushOpenId(null)} />
                 )}
                </div>
              ))}

              {filter === "all" && users.length < total && (
                <button
                  onClick={() => load(page + 1, search, false)}
                  disabled={loadingMore}
                  className="w-full py-3 rounded-2xl text-sm font-semibold mt-1 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                  {loadingMore
                    ? <Icon name="Loader2" size={16} className="animate-spin mx-auto text-white/40" />
                    : `Загрузить ещё (ещё ${total - users.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UsersDrawer;