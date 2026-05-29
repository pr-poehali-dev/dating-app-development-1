import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminStats, type AdminUser } from "@/lib/api";
import { Spinner } from "./AdminLogin";

// ─── Список пользователей (дровер) ────────────────────────────────────────────
type UserFilter = "all" | "online" | "verified" | "premium" | "new_today" | "new_week" | "new_month";

function timeAgo(iso: string) {
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

function UsersDrawer({ token, filter, title, onClose }: {
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

  const PER_PAGE = 20;

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

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
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

        {/* Поиск */}
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

        {/* Список */}
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
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>

                  {/* Аватар + онлайн */}
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

                  {/* Инфо */}
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

                  {/* Дата */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-white/25 text-[10px]">{timeAgo(u.created_at)}</p>
                    <p className="text-white/15 text-[9px] mt-0.5">#{u.id}</p>
                  </div>
                </div>
              ))}

              {/* Загрузить ещё */}
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

// ─── Stats Tab ────────────────────────────────────────────────────────────────
export function StatsTab({ token }: { token: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<{ filter: UserFilter; title: string } | null>(null);

  useEffect(() => {
    adminApi.stats(token).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;
  if (!stats) return <p className="text-white/40 text-center py-10">Ошибка загрузки</p>;

  const groups = [
    {
      title: "👥 Пользователи",
      color: "#FF2D78",
      cards: [
        { label: "Всего",          value: stats.total_users,    icon: "Users",        color: "#FF2D78", filter: "all" as UserFilter },
        { label: "Онлайн",         value: stats.online_users,   icon: "Wifi",         color: "#4ADE80", filter: "online" as UserFilter },
        { label: "Сегодня +",      value: stats.new_today,      icon: "UserPlus",     color: "#60A5FA", filter: "new_today" as UserFilter },
        { label: "За неделю +",    value: stats.new_week,       icon: "TrendingUp",   color: "#A78BFA", filter: "new_week" as UserFilter },
        { label: "За месяц +",     value: stats.new_month,      icon: "CalendarPlus", color: "#C084FC", filter: "new_month" as UserFilter },
        { label: "Верифицировано", value: stats.verified_users, icon: "BadgeCheck",   color: "#38BDF8", filter: "verified" as UserFilter },
        { label: "Premium",        value: stats.premium_users,  icon: "Crown",        color: "#FCD34D", filter: "premium" as UserFilter },
      ],
    },
    {
      title: "💬 Активность",
      color: "#34D399",
      cards: [
        { label: "Лайков",           value: stats.total_likes,    icon: "Heart",         color: "#F472B6", filter: null },
        { label: "Совпадений",       value: stats.total_matches,  icon: "Zap",           color: "#FB923C", filter: null },
        { label: "Сообщений",        value: stats.total_messages, icon: "MessageCircle", color: "#34D399", filter: null },
        { label: "Сообщений сегодня",value: stats.messages_today, icon: "MessageSquare", color: "#6EE7B7", filter: null },
        { label: "Подарков",         value: stats.total_gifts,    icon: "Gift",          color: "#F59E0B", filter: null },
        { label: "Активных сессий",  value: stats.active_sessions,icon: "Activity",      color: "#C084FC", filter: null },
      ],
    },
    {
      title: "⚠️ Модерация",
      color: "#F87171",
      cards: [
        { label: "Жалоб (новых)",     value: stats.pending_reports, icon: "Flag",          color: "#F87171", alert: stats.pending_reports > 0, filter: null },
        { label: "Верификаций",       value: stats.pending_verif,   icon: "Clock",         color: "#FCD34D", alert: stats.pending_verif > 0,   filter: null },
        { label: "Тикетов поддержки", value: stats.open_tickets,    icon: "MessageCircle", color: "#60A5FA", alert: stats.open_tickets > 0,    filter: null },
      ],
    },
  ];

  const conversionRate = stats.total_users > 0 ? ((stats.total_matches / stats.total_users) * 100).toFixed(1) : "0";
  const onlineRate    = stats.total_users > 0 ? ((stats.online_users  / stats.total_users) * 100).toFixed(1) : "0";
  const premiumRate   = stats.total_users > 0 ? ((stats.premium_users / stats.total_users) * 100).toFixed(1) : "0";

  return (
    <>
      {drawer && (
        <UsersDrawer
          token={token}
          filter={drawer.filter}
          title={drawer.title}
          onClose={() => setDrawer(null)}
        />
      )}

      <div className="flex flex-col gap-6">
        {/* Ключевые метрики */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Конверсия", value: `${conversionRate}%`, sub: "пользователи → совпадения", color: "#A78BFA" },
            { label: "Онлайн",   value: `${onlineRate}%`,     sub: "от всех пользователей",    color: "#4ADE80" },
            { label: "Premium",  value: `${premiumRate}%`,    sub: "от всех пользователей",    color: "#FCD34D" },
          ].map(m => (
            <div key={m.label} className="rounded-2xl p-3 flex flex-col gap-1 text-center"
              style={{ background: `${m.color}12`, border: `1px solid ${m.color}30` }}>
              <p className="font-bold text-2xl" style={{ color: m.color }}>{m.value}</p>
              <p className="text-white/70 text-xs font-semibold">{m.label}</p>
              <p className="text-white/30 text-[10px]">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Группы карточек */}
        {groups.map(g => (
          <div key={g.title}>
            <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="flex-1 h-px" style={{ background: `${g.color}30` }} />
              {g.title}
              <span className="flex-1 h-px" style={{ background: `${g.color}30` }} />
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {g.cards.map((c) => {
                const clickable = !!c.filter;
                return (
                  <div
                    key={c.label}
                    onClick={clickable ? () => setDrawer({ filter: c.filter as UserFilter, title: c.label }) : undefined}
                    className={`rounded-2xl p-4 flex flex-col gap-2 transition-all ${clickable ? "cursor-pointer active:scale-[0.97] hover:scale-[1.02]" : "cursor-default hover:scale-[1.02]"}`}
                    style={{
                      background: (c as { alert?: boolean }).alert ? `${c.color}15` : clickable ? `${c.color}08` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${(c as { alert?: boolean }).alert ? `${c.color}40` : clickable ? `${c.color}25` : "rgba(255,255,255,0.08)"}`,
                    }}>
                    <div className="flex items-center justify-between">
                      <Icon name={c.icon as "Users"} size={18} style={{ color: c.color }} />
                      <div className="flex items-center gap-1.5">
                        {(c as { alert?: boolean }).alert && (
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.color }} />
                        )}
                        {clickable && (
                          <Icon name="ChevronRight" size={13} className="text-white/25" />
                        )}
                      </div>
                    </div>
                    <p className="text-white font-bold text-2xl">{c.value.toLocaleString()}</p>
                    <p className="text-white/45 text-xs leading-tight">{c.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default StatsTab;
