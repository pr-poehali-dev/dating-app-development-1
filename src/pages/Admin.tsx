import { useState } from "react";
import Icon from "@/components/ui/icon";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { StatsTab } from "@/components/admin/AdminStats";
import { UsersTab } from "@/components/admin/AdminUsers";
import { VerifTab, ReportsTab, SupportTab } from "@/components/admin/AdminModeration";
import { AnalyticsTab } from "@/components/admin/AdminAnalytics";
import { SecurityTab } from "@/components/admin/AdminSecurity";
import { MarketingTab } from "@/components/admin/AdminMarketing";
import { SubscriptionsTab } from "@/components/admin/AdminSubscriptions";

type Tab = "stats" | "users" | "verif" | "reports" | "support" | "analytics" | "security" | "marketing" | "subscriptions";

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

  const tabs: { id: Tab; label: string; icon: string; group?: string }[] = [
    { id: "stats",     label: "Дашборд",      icon: "BarChart2",     group: "Обзор" },
    { id: "analytics", label: "Аналитика",    icon: "TrendingUp",    group: "Обзор" },
    { id: "users",     label: "Пользователи", icon: "Users",         group: "Управление" },
    { id: "verif",     label: "Верификация",  icon: "BadgeCheck",    group: "Управление" },
    { id: "reports",   label: "Жалобы",       icon: "Flag",          group: "Управление" },
    { id: "support",   label: "Поддержка",    icon: "MessageCircle", group: "Управление" },
    { id: "security",      label: "Безопасность", icon: "Shield",        group: "Настройки" },
    { id: "marketing",     label: "Маркетинг",    icon: "Megaphone",     group: "Настройки" },
    { id: "subscriptions", label: "Подписки",     icon: "Crown",         group: "Настройки" },
  ];

  const groups = ["Обзор", "Управление", "Настройки"];

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
        <button onClick={handleLogout}
          className="text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5 text-sm">
          <Icon name="LogOut" size={16} />Выйти
        </button>
      </div>

      {/* Tabs — сгруппированные */}
      <div className="px-6 pt-4 pb-2 flex flex-col gap-2">
        {groups.map(group => {
          const groupTabs = tabs.filter(t => t.group === group);
          return (
            <div key={group} className="flex items-center gap-2">
              <span className="text-white/20 text-[10px] font-semibold uppercase tracking-widest w-16 flex-shrink-0">
                {group}
              </span>
              <div className="flex gap-1.5 overflow-x-auto">
                {groupTabs.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0"
                    style={tab === t.id
                      ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                    <Icon name={t.icon as "BarChart2"} size={13} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {tab === "stats"     && <StatsTab     token={token} />}
        {tab === "analytics" && <AnalyticsTab token={token} />}
        {tab === "users"     && <UsersTab     token={token} />}
        {tab === "verif"     && <VerifTab     token={token} />}
        {tab === "reports"   && <ReportsTab   token={token} />}
        {tab === "support"   && <SupportTab   token={token} />}
        {tab === "security"      && <SecurityTab      token={token} />}
        {tab === "marketing"     && <MarketingTab     token={token} />}
        {tab === "subscriptions" && <SubscriptionsTab token={token} />}
      </div>
    </div>
  );
}