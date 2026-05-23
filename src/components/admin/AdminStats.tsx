import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminStats } from "@/lib/api";
import { Spinner } from "./AdminLogin";

// ─── Stats Tab ────────────────────────────────────────────────────────────────
export function StatsTab({ token }: { token: string }) {
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

export default StatsTab;
