import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminUser } from "@/lib/api";
import { Spinner } from "./AdminLogin";

type Activity = {
  likes_sent: number; likes_received: number; matches: number; messages: number;
  reports_sent: number; reports_received: number; last_seen: string | null; created_at: string | null;
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
      style={{ background: `${color}20`, color }}>
      {label}
    </span>
  );
}

// ─── Диалог редактирования ────────────────────────────────────────────────────
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
      onSaved(); onClose();
    } catch { void 0; } finally { setSaving(false); }
  };

  const statItems = activity ? [
    { label: "Лайков →",    value: activity.likes_sent,      color: "#F472B6" },
    { label: "Лайков ←",    value: activity.likes_received,  color: "#FF2D78" },
    { label: "Совпадений",  value: activity.matches,         color: "#FB923C" },
    { label: "Сообщений",   value: activity.messages,        color: "#34D399" },
    { label: "Жалоб →",     value: activity.reports_sent,    color: "#F59E0B" },
    { label: "Жалоб ←",     value: activity.reports_received, color: "#F87171" },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
      onClick={onClose}>
      <div className="mt-auto w-full max-h-[92vh] flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(180deg,#161028 0%,#110d1e 100%)", borderTop: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0" }}
        onClick={e => e.stopPropagation()}>

        {/* Хэндл */}
        <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Шапка */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            <span className="text-white font-bold text-base">{user.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold">{user.name}</p>
            <p className="text-white/35 text-xs truncate">{user.email} · ID #{user.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="X" size={16} className="text-white/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* Форма */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Редактировать профиль</p>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Имя"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="Возраст" type="number" min={14} max={99}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Город"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
            </div>
            <div className="flex gap-2">
              {([
                { key: "premium" as const, label: "✨ Premium", color: "#FCD34D" },
                { key: "verified" as const, label: "✓ Верифицирован", color: "#38BDF8" },
              ]).map(({ key, label, color }) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={form[key]
                    ? { background: `${color}18`, color, border: `1px solid ${color}45` }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              {saving ? <><Icon name="Loader2" size={15} className="animate-spin" />Сохраняю...</> : "Сохранить изменения"}
            </button>
          </div>

          {/* Статистика */}
          <div className="flex flex-col gap-3">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Активность</p>
            {actLoading ? <Spinner /> : activity ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {statItems.map(s => (
                    <div key={s.label} className="rounded-2xl p-3 text-center"
                      style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
                      <p className="font-bold text-xl text-white">{s.value.toLocaleString("ru")}</p>
                      <p className="text-white/35 text-[10px] mt-0.5 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 px-1">
                  {activity.created_at && (
                    <p className="text-white/30 text-xs flex items-center gap-2">
                      <Icon name="Calendar" size={11} className="text-white/20" />
                      Зарегистрирован: {new Date(activity.created_at).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                  {activity.last_seen && (
                    <p className="text-white/30 text-xs flex items-center gap-2">
                      <Icon name="Clock" size={11} className="text-white/20" />
                      Последний вход: {new Date(activity.last_seen).toLocaleString("ru")}
                    </p>
                  )}
                </div>
              </>
            ) : <p className="text-white/20 text-sm">Нет данных</p>}
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
      .catch(() => {}).finally(() => setLoading(false));
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
    } catch (e) { void e; } finally { setActionId(null); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      {editUser && (
        <EditUserDialog user={editUser} token={token}
          onClose={() => setEditUser(null)}
          onSaved={() => load(page, search)} />
      )}

      <div className="flex flex-col gap-4">
        {/* Поиск */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Поиск по имени, email, @username..."
              className="w-full text-white placeholder-white/25 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }} />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0"
            style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.2)" }}>
            <Icon name="Users" size={13} className="text-pink-400" />
            <span className="text-pink-300 text-sm font-bold">{total}</span>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id}
                className="rounded-2xl p-3.5 flex items-center gap-3 transition-all"
                style={{
                  background: u.banned ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${u.banned ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.07)"}`,
                }}>
                {/* Аватар */}
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: u.banned ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg,rgba(255,45,120,0.3),rgba(155,89,182,0.3))", color: "white" }}>
                  {u.name[0]}
                </div>

                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-white font-semibold text-sm">{u.name}</span>
                    {u.age && <span className="text-white/35 text-xs">{u.age}</span>}
                    {u.online && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
                    {u.verified && <Badge label="верифицирован" color="#38BDF8" />}
                    {u.premium  && <Badge label="premium" color="#FCD34D" />}
                    {u.banned   && <Badge label="забанен" color="#F87171" />}
                  </div>
                  <p className="text-white/30 text-xs truncate">{u.email}{u.username ? ` · @${u.username}` : ""}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {u.city && <span className="text-white/20 text-[10px] flex items-center gap-0.5"><Icon name="MapPin" size={9} />{u.city}</span>}
                    <span className="text-white/15 text-[10px]">{new Date(u.created_at).toLocaleDateString("ru")}</span>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditUser(u)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Icon name="Pencil" size={13} className="text-white/40" />
                  </button>
                  <button onClick={() => handleBan(u)} disabled={actionId === u.id}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 active:scale-95"
                    style={u.banned
                      ? { background: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.25)" }
                      : { background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {actionId === u.id
                      ? <Icon name="Loader2" size={11} className="animate-spin" />
                      : u.banned ? "Снять" : "Бан"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => { setPage(p => p - 1); load(page - 1, search); }} disabled={page === 1}
              className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-20 transition-all"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <Icon name="ChevronLeft" size={16} className="text-white/60" />
            </button>
            <span className="text-white/40 text-sm px-2">{page} / {totalPages}</span>
            <button onClick={() => { setPage(p => p + 1); load(page + 1, search); }} disabled={page === totalPages}
              className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-20 transition-all"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <Icon name="ChevronRight" size={16} className="text-white/60" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default UsersTab;
