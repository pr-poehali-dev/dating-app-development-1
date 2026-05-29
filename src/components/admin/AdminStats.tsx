import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminStats } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { UsersDrawer, type UserFilter } from "./AdminUsersDrawer";
import { MatchesDrawer } from "./AdminMatchesDrawer";
import { GiftsDrawer } from "./AdminGiftsDrawer";

export function StatsTab({ token }: { token: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<{ filter: UserFilter; title: string } | null>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [showGifts, setShowGifts] = useState(false);

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
        { label: "Лайков",           value: stats.total_likes,    icon: "Heart",         color: "#F472B6", filter: null,      onClick: null },
        { label: "Совпадений",       value: stats.total_matches,  icon: "Zap",           color: "#FB923C", filter: null,      onClick: () => setShowMatches(true) },
        { label: "Сообщений",        value: stats.total_messages, icon: "MessageCircle", color: "#34D399", filter: null,      onClick: null },
        { label: "Сообщений сегодня",value: stats.messages_today, icon: "MessageSquare", color: "#6EE7B7", filter: null,      onClick: null },
        { label: "Подарков",         value: stats.total_gifts,    icon: "Gift",          color: "#F59E0B", filter: null,      onClick: () => setShowGifts(true) },
        { label: "Активных сессий",  value: stats.active_sessions,icon: "Activity",      color: "#C084FC", filter: null,      onClick: null },
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
        <UsersDrawer token={token} filter={drawer.filter} title={drawer.title} onClose={() => setDrawer(null)} />
      )}
      {showMatches && <MatchesDrawer token={token} onClose={() => setShowMatches(false)} />}
      {showGifts   && <GiftsDrawer  token={token} onClose={() => setShowGifts(false)} />}

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
                const hasFilter = !!c.filter;
                const hasOnClick = !!(c as { onClick?: (() => void) | null }).onClick;
                const clickable = hasFilter || hasOnClick;
                const handleClick = hasFilter
                  ? () => setDrawer({ filter: c.filter as UserFilter, title: c.label })
                  : (c as { onClick?: (() => void) | null }).onClick ?? undefined;
                return (
                  <div
                    key={c.label}
                    onClick={handleClick}
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
