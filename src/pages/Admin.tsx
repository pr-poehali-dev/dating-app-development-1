import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminUser, type AdminReport, type AdminVerifRequest, type AdminStats } from "@/lib/api";

type Tab = "stats" | "users" | "verif" | "reports" | "support";

// ─── Login ────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!token.trim()) return;
    setLoading(true); setError("");
    try {
      await adminApi.stats(token.trim());
      onLogin(token.trim());
    } catch {
      setError("Неверный токен");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0a1a" }}>
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
            <Icon name="ShieldCheck" size={32} className="text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl">Админ-панель</h1>
          <p className="text-white/40 text-sm mt-1">LoveBloom</p>
        </div>
        <div className="flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 24 }}>
          <input value={token} onChange={(e) => setToken(e.target.value)} type="password"
            placeholder="Секретный токен" onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-mono" />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
            {loading ? "Проверяем..." : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab({ token }: { token: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats(token).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;

  const cards = stats ? [
    { label: "Пользователей", value: stats.total_users, icon: "Users", color: "#FF2D78" },
    { label: "Онлайн", value: stats.online_users, icon: "Wifi", color: "#4ADE80" },
    { label: "За сегодня", value: stats.new_today, icon: "UserPlus", color: "#60A5FA" },
    { label: "За неделю", value: stats.new_week, icon: "TrendingUp", color: "#A78BFA" },
    { label: "Лайков", value: stats.total_likes, icon: "Heart", color: "#F472B6" },
    { label: "Совпадений", value: stats.total_matches, icon: "Zap", color: "#FB923C" },
    { label: "Сообщений", value: stats.total_messages, icon: "MessageCircle", color: "#34D399" },
    { label: "Верифицировано", value: stats.verified_users, icon: "BadgeCheck", color: "#38BDF8" },
    { label: "Активных сессий", value: stats.active_sessions, icon: "Activity", color: "#C084FC" },
    { label: "Жалоб (новых)", value: stats.pending_reports, icon: "Flag", color: "#F87171" },
    { label: "Верификаций (новых)", value: stats.pending_verif, icon: "Clock", color: "#FCD34D" },
  ] : [];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl p-4 flex flex-col gap-2"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon name={c.icon as "Users"} size={20} style={{ color: c.color }} />
          <p className="text-white font-bold text-2xl">{c.value}</p>
          <p className="text-white/50 text-xs">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ token }: { token: string }) {
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

// ─── Verif Tab ────────────────────────────────────────────────────────────────
function VerifTab({ token }: { token: string }) {
  const [requests, setRequests] = useState<AdminVerifRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.verifRequests(token).then((d) => setRequests(d.requests)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const approve = async (req: AdminVerifRequest) => {
    setActionId(req.id);
    try { await adminApi.verifApprove(token, req.id); load(); } catch (e) { void e; }
    finally { setActionId(null); }
  };

  const reject = async (req: AdminVerifRequest) => {
    const reason = prompt("Причина отклонения (необязательно):") || "";
    setActionId(req.id);
    try { await adminApi.verifReject(token, req.id, reason); load(); } catch (e) { void e; }
    finally { setActionId(null); }
  };

  if (loading) return <Spinner />;

  if (requests.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="text-5xl">✅</div>
      <p className="text-white/40 text-sm">Нет заявок на верификацию</p>
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {requests.map((r) => (
        <div key={r.id} className="rounded-2xl overflow-hidden flex flex-col"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <img src={r.selfie_url} className="w-full object-cover" style={{ maxHeight: 260 }} />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {r.photo_url && <img src={r.photo_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />}
              <div>
                <p className="text-white font-semibold text-sm">{r.name}{r.age ? `, ${r.age}` : ""}</p>
                <p className="text-white/40 text-xs">{r.email}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {r.email_verified ? <span className="text-green-400">✓ email подтверждён</span> : "email не подтверждён"}
                </p>
              </div>
            </div>
            <p className="text-white/30 text-xs">{new Date(r.created_at).toLocaleString("ru")}</p>
            <div className="flex gap-2">
              <button onClick={() => approve(r)} disabled={actionId === r.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
                <Icon name="Check" size={15} className="text-white" />Одобрить
              </button>
              <button onClick={() => reject(r)} disabled={actionId === r.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-400 flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <Icon name="X" size={15} />Отклонить
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ token }: { token: string }) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionId, setActionId] = useState<number | null>(null);

  const load = (s: string) => {
    setLoading(true);
    adminApi.reports(token, s).then((d) => setReports(d.reports)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter); }, [token, statusFilter]);

  const resolve = async (r: AdminReport, status: string) => {
    setActionId(r.id);
    try { await adminApi.resolveReport(token, r.id, status); load(statusFilter); } catch (e) { void e; }
    finally { setActionId(null); }
  };

  const REASONS: Record<string, string> = {
    spam: "Спам", fake: "Фейк", abuse: "Оскорбления", photo: "Неприемлемое фото", other: "Другое"
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {["pending", "resolved", "dismissed"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={statusFilter === s
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
              : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            {s === "pending" ? "Новые" : s === "resolved" ? "Решённые" : "Отклонённые"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-5xl">🏳️</div>
          <p className="text-white/40 text-sm">Жалоб нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white font-semibold text-sm">
                    На: <span className="text-pink-400">{r.reported_name}</span>
                    <span className="text-white/30 text-xs ml-2">{r.reported_email}</span>
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">
                    От: {r.reporter_name} · {new Date(r.created_at).toLocaleString("ru")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: "rgba(255,45,120,0.15)", color: "#FF2D78" }}>
                  {REASONS[r.reason] || r.reason}
                </span>
              </div>
              {r.comment && <p className="text-white/60 text-sm bg-white/5 rounded-xl px-3 py-2">«{r.comment}»</p>}
              {statusFilter === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => resolve(r, "resolved")} disabled={actionId === r.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
                    Принять меры
                  </button>
                  <button onClick={() => resolve(r, "dismissed")} disabled={actionId === r.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SupportTab ───────────────────────────────────────────────────────────────
function SupportTab({ token }: { token: string }) {
  type Ticket = { id: number; user_id: number; message: string; reply: string | null; status: string; created_at: string; replied_at: string | null; user_name: string; user_photo: string | null };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"open"|"closed">("open");
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replying, setReplying] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.supportTickets(token, statusFilter).then(r => setTickets(r.tickets)).catch(() => {}).finally(() => setLoading(false));
  }, [token, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const sendReply = async (id: number) => {
    const text = (replyText[id] || "").trim();
    if (!text) return;
    setReplying(id);
    try {
      await adminApi.supportReply(token, id, text);
      setDone(d => [...d, id]);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, reply: text, status: "closed" } : t));
    } catch { void 0; } finally { setReplying(null); }
  };

  const FALLBACK = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">Обращения в поддержку</h3>
        <div className="flex gap-2">
          {(["open","closed"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={statusFilter === s
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              {s === "open" ? "Открытые" : "Закрытые"}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin"/></div>}
      {!loading && tickets.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12">
          <Icon name="MessageCircle" size={36} className="text-white/15" />
          <p className="text-white/30 text-sm">{statusFilter === "open" ? "Открытых обращений нет" : "Закрытых обращений нет"}</p>
        </div>
      )}
      {!loading && tickets.map(t => (
        <div key={t.id} className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${t.status === "closed" ? "rgba(74,222,128,0.2)" : "rgba(255,45,120,0.2)"}` }}>
          <div className="flex items-start gap-3">
            <img src={t.user_photo || FALLBACK} className="w-9 h-9 rounded-full object-cover flex-shrink-0"/>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-semibold text-sm">{t.user_name}</p>
                <span className="text-white/30 text-xs">#{t.id}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={t.status === "closed"
                    ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80" }
                    : { background: "rgba(255,45,120,0.15)", color: "#FF2D78" }}>
                  {t.status === "closed" ? "Закрыт" : "Открыт"}
                </span>
              </div>
              <p className="text-white/30 text-xs">{new Date(t.created_at).toLocaleString("ru")}</p>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-white/80 text-sm leading-relaxed">{t.message}</p>
          </div>

          {t.reply && (
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <p className="text-green-400 text-xs font-semibold mb-1">Ответ поддержки</p>
              <p className="text-white/70 text-sm leading-relaxed">{t.reply}</p>
            </div>
          )}

          {t.status === "open" && !done.includes(t.id) && (
            <div className="flex gap-2">
              <textarea
                value={replyText[t.id] || ""}
                onChange={e => setReplyText(r => ({ ...r, [t.id]: e.target.value }))}
                placeholder="Написать ответ..."
                rows={2}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                disabled={!(replyText[t.id] || "").trim() || replying === t.id}
                onClick={() => sendReply(t.id)}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold flex-shrink-0 disabled:opacity-40 flex items-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                {replying === t.id
                  ? <Icon name="Loader2" size={15} className="animate-spin"/>
                  : <><Icon name="Send" size={15}/>Ответить</>}
              </button>
            </div>
          )}
          {done.includes(t.id) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(74,222,128,0.12)" }}>
              <Icon name="Check" size={14} className="text-green-400"/>
              <p className="text-green-400 text-xs font-semibold">Ответ отправлен</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") || "");
  const [tab, setTab] = useState<Tab>("stats");

  const handleLogin = (t: string) => {
    sessionStorage.setItem("admin_token", t);
    setToken(t);
  };
  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    setToken("");
  };

  if (!token) return <AdminLogin onLogin={handleLogin} />;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "stats",   label: "Статистика",    icon: "BarChart2" },
    { id: "users",   label: "Пользователи",  icon: "Users" },
    { id: "verif",   label: "Верификация",   icon: "BadgeCheck" },
    { id: "reports", label: "Жалобы",        icon: "Flag" },
    { id: "support", label: "Поддержка",     icon: "MessageCircle" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0f0a1a" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(15,10,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
            <Icon name="ShieldCheck" size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">Админ-панель</span>
        </div>
        <button onClick={handleLogout} className="text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5 text-sm">
          <Icon name="LogOut" size={16} />Выйти
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 pb-2 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
            style={tab === t.id
              ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
            <Icon name={t.icon as "BarChart2"} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {tab === "stats"   && <StatsTab token={token} />}
        {tab === "users"   && <UsersTab token={token} />}
        {tab === "verif"   && <VerifTab token={token} />}
        {tab === "reports" && <ReportsTab token={token} />}
        {tab === "support" && <SupportTab token={token} />}
      </div>
    </div>
  );
}