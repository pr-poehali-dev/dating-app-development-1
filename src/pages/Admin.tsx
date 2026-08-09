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
import { AdminPromos } from "@/components/admin/AdminPromos";
import { AdminContentTab } from "@/components/admin/AdminContentTab";
import { AdminAiModeration } from "@/components/admin/AdminAiModeration";
import { AdminBackup } from "@/components/admin/AdminBackup";

type Tab = "stats" | "users" | "verif" | "reports" | "support" | "analytics" | "security" | "marketing" | "subscriptions" | "promos" | "content" | "ai_moderation" | "backup";

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") || "");
  const [tab, setTab] = useState<Tab>("stats");
  const [menuOpen, setMenuOpen] = useState(false);

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
    { id: "content",   label: "18+ Контент",  icon: "ShieldAlert",   group: "Управление" },
    { id: "ai_moderation", label: "ИИ-модерация", icon: "Sparkles",  group: "Управление" },
    { id: "support",   label: "Поддержка",    icon: "MessageCircle", group: "Управление" },
    { id: "security",      label: "Безопасность", icon: "Shield",        group: "Настройки" },
    { id: "marketing",     label: "Маркетинг",    icon: "Megaphone",     group: "Настройки" },
    { id: "subscriptions", label: "Подписки",     icon: "Crown",         group: "Настройки" },
    { id: "promos",        label: "Промокоды",    icon: "Tag",           group: "Настройки" },
    { id: "backup",        label: "Копия базы",   icon: "DatabaseBackup", group: "Настройки" },
  ];

  const groups = ["Обзор", "Управление", "Настройки"];

  const navContent = (
    <>
      {groups.map((group, gi) => {
        const groupTabs = tabs.filter(t => t.group === group);
        return (
          <div key={group}>
            {gi > 0 && <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />}
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.12em] px-2 mb-1">
              {group}
            </p>
            {groupTabs.map((t) => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left"
                  style={active
                    ? { background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.18))", color: "white", boxShadow: "inset 0 0 0 1px rgba(255,45,120,0.3)" }
                    : { color: "rgba(255,255,255,0.4)" }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={active
                      ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                      : { background: "rgba(255,255,255,0.07)" }}>
                    <Icon name={t.icon as "BarChart2"} size={12} className={active ? "text-white" : "text-white/40"} />
                  </div>
                  <span className={active ? "text-white font-semibold" : ""}>{t.label}</span>
                  {active && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-pink-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );

  const activeLabel = tabs.find(t => t.id === tab)?.label || "";

  return (
    <div className="min-h-screen" style={{ background: "#0f0a1a" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 md:px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(15,10,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button onClick={() => setMenuOpen(true)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="Menu" size={18} className="text-white/70" />
          </button>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
            <Icon name="ShieldCheck" size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-base md:text-lg truncate">
            <span className="hidden md:inline">Админ-панель</span>
            <span className="md:hidden">{activeLabel}</span>
          </span>
        </div>
        <button onClick={handleLogout}
          className="text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5 text-sm flex-shrink-0">
          <Icon name="LogOut" size={16} /><span className="hidden sm:inline">Выйти</span>
        </button>
      </div>

      {/* Nav + Content */}
      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex w-48 flex-shrink-0 sticky top-[65px] self-start h-[calc(100vh-65px)] overflow-y-auto py-4 px-3 flex-col gap-1"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {navContent}
        </aside>

        {/* Sidebar — mobile drawer */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 max-w-[80vw] overflow-y-auto py-4 px-3 flex flex-col gap-1 animate-in slide-in-from-left duration-200"
              style={{ background: "#130f22", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-white font-bold">Меню</span>
                <button onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  <Icon name="X" size={16} className="text-white/60" />
                </button>
              </div>
              {navContent}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 px-3 md:px-5 py-4 md:py-5">
          {tab === "stats"         && <StatsTab         token={token} />}
          {tab === "analytics"     && <AnalyticsTab     token={token} />}
          {tab === "users"         && <UsersTab         token={token} />}
          {tab === "verif"         && <VerifTab         token={token} />}
          {tab === "reports"       && <ReportsTab       token={token} />}
          {tab === "support"       && <SupportTab       token={token} />}
          {tab === "security"      && <SecurityTab      token={token} />}
          {tab === "marketing"     && <MarketingTab     token={token} />}
          {tab === "subscriptions" && <SubscriptionsTab token={token} />}
          {tab === "promos"        && <AdminPromos      token={token} />}
          {tab === "content"       && <AdminContentTab  token={token} />}
          {tab === "ai_moderation" && <AdminAiModeration token={token} />}
          {tab === "backup"        && <AdminBackup       token={token} />}
        </main>
      </div>
    </div>
  );
}