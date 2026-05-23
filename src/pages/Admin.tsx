import { useState } from "react";
import Icon from "@/components/ui/icon";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { StatsTab } from "@/components/admin/AdminStats";
import { UsersTab } from "@/components/admin/AdminUsers";
import { VerifTab, ReportsTab, SupportTab } from "@/components/admin/AdminModeration";

type Tab = "stats" | "users" | "verif" | "reports" | "support";

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
