import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminUser } from "@/lib/api";
import { Spinner } from "./AdminLogin";

// ─── Users Tab ────────────────────────────────────────────────────────────────
export function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const searchTimer = { current: null as ReturnType<typeof setTimeout> | null };

  const load = useCallback((p: number, q: string) => {
    setLoading(true);
    adminApi.users(token, p, q)
      .then((d) => { setUsers(d.users); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(1, ""); }, [load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1, val); }, 400);
  };

  const handleBan = async (u: AdminUser) => {
    setActionId(u.id);
    try {
      if (u.banned) await adminApi.unbanUser(token, u.id);
      else await adminApi.banUser(token, u.id, "Нарушение правил");
      load(page, search);
    } catch (e) { void e; }
    finally { setActionId(null); }
  };

  const perPage = 20;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Поиск по имени, email, @username..."
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50" />
        </div>
        <span className="text-white/40 text-sm whitespace-nowrap">{total} польз.</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: u.banned ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${u.banned ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}` }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">{u.name}</span>
                  {u.age && <span className="text-white/40 text-xs">{u.age}</span>}
                  {u.verified && <span className="text-blue-400 text-xs">✓ верифицирован</span>}
                  {u.premium && <span className="text-yellow-400 text-xs">✨ premium</span>}
                  {u.banned && <span className="text-red-400 text-xs">🚫 забанен</span>}
                  {u.online && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
                </div>
                <p className="text-white/40 text-xs truncate mt-0.5">{u.email}{u.username ? ` · @${u.username}` : ""}</p>
                {u.city && <p className="text-white/30 text-xs">{u.city}</p>}
                <p className="text-white/20 text-xs mt-0.5">{new Date(u.created_at).toLocaleDateString("ru")}</p>
              </div>
              <button onClick={() => handleBan(u)} disabled={actionId === u.id}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                style={u.banned
                  ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.3)" }
                  : { background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                {u.banned ? "Разбанить" : "Забанить"}
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => { setPage(p => p - 1); load(page - 1, search); }} disabled={page === 1}
            className="text-white/40 disabled:opacity-20"><Icon name="ChevronLeft" size={20} /></button>
          <span className="text-white/60 text-sm">{page} / {totalPages}</span>
          <button onClick={() => { setPage(p => p + 1); load(page + 1, search); }} disabled={page === totalPages}
            className="text-white/40 disabled:opacity-20"><Icon name="ChevronRight" size={20} /></button>
        </div>
      )}
    </div>
  );
}

export default UsersTab;
