import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminUser } from "@/lib/api";
import { Spinner } from "./AdminLogin";

type Activity = {
  likes_sent: number; likes_received: number; matches: number; messages: number;
  reports_sent: number; reports_received: number; last_seen: string | null; created_at: string | null;
};

// ─── Диалог редактирования пользователя ───────────────────────────────────────
function EditUserDialog({ user, token, onClose, onSaved }: {
  user: AdminUser; token: string; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: user.name, age: String(user.age ?? ""), city: user.city ?? "",
    premium: user.premium, verified: user.verified,
  });
  const [activity, setActivity] = useState<Activity | null>(null);
  const [actLoading, setActLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.userActivity(token, user.id)
      .then(setActivity).catch(() => {}).finally(() => setActLoading(false));
  }, [token, user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.editUser(token, user.id, {
        name: form.name.trim(),
        age: form.age ? Number(form.age) : null,
        city: form.city.trim() || null,
        premium: form.premium,
        verified: form.verified,
      });
      onSaved();
      onClose();
    } catch { void 0; } finally { setSaving(false); }
  };

  const statItems = activity ? [
    { label: "Лайков отправлено",   value: activity.likes_sent,     icon: "Heart",         color: "#F472B6" },
    { label: "Лайков получено",     value: activity.likes_received, icon: "HeartHandshake", color: "#FF2D78" },
    { label: "Совпадений",          value: activity.matches,        icon: "Zap",           color: "#FB923C" },
    { label: "Сообщений",           value: activity.messages,       icon: "MessageCircle", color: "#34D399" },
    { label: "Жалоб отправлено",    value: activity.reports_sent,   icon: "Flag",          color: "#F59E0B" },
    { label: "Жалоб получено",      value: activity.reports_received, icon: "ShieldAlert", color: "#F87171" },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
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
            <p className="text-white font-bold">{user.name}</p>
            <p className="text-white/35 text-xs">{user.email} · #{user.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* Редактирование */}
          <div className="flex flex-col gap-3">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Редактировать профиль</p>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Имя"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="Возраст" type="number" min={14} max={99}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Город"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div className="flex gap-2">
              {([
                { key: "premium" as const, label: "Premium ✨", color: "#FCD34D" },
                { key: "verified" as const, label: "Верифицирован ✓", color: "#38BDF8" },
              ]).map(({ key, label, color }) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={form[key]
                    ? { background: `${color}22`, color, border: `1px solid ${color}55` }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              {saving ? "Сохраняю..." : "Сохранить изменения"}
            </button>
          </div>

          {/* История активности */}
          <div className="flex flex-col gap-3">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">История активности</p>
            {actLoading ? <Spinner /> : activity ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {statItems.map(s => (
                    <div key={s.label} className="rounded-2xl p-3 text-center"
                      style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                      <p className="font-bold text-lg text-white">{s.value}</p>
                      <p className="text-white/40 text-[9px] mt-0.5 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1 px-1">
                  {activity.created_at && (
                    <p className="text-white/30 text-xs flex items-center gap-1.5">
                      <Icon name="Calendar" size={11} />
                      Зарегистрирован: {new Date(activity.created_at).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                  {activity.last_seen && (
                    <p className="text-white/30 text-xs flex items-center gap-1.5">
                      <Icon name="Clock" size={11} />
                      Последний вход: {new Date(activity.last_seen).toLocaleString("ru")}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-white/25 text-sm">Нет данных</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
export function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
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
    <>
      {editUser && (
        <EditUserDialog
          user={editUser}
          token={token}
          onClose={() => setEditUser(null)}
          onSaved={() => load(page, search)}
        />
      )}

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
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditUser(u)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Icon name="Pencil" size={13} className="text-white/50" />
                  </button>
                  <button onClick={() => handleBan(u)} disabled={actionId === u.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    style={u.banned
                      ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.3)" }
                      : { background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                    {u.banned ? "Разбанить" : "Забанить"}
                  </button>
                </div>
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
    </>
  );
}

export default UsersTab;
