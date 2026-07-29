import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Spinner } from "./AdminLogin";
import { adminReq } from "./SecurityShared";

type SecurityEvent = {
  id: number; event_type: string; severity: string; ip: string | null;
  user_id: number | null; email: string | null; details: Record<string, unknown>; created_at: string;
};

const SEV_COLOR: Record<string, string> = {
  info:     "#60A5FA",
  warning:  "#FBBF24",
  critical: "#F87171",
};
const EVENT_LABEL: Record<string, string> = {
  login_success:       "Успешный вход",
  login_failed:        "Неудачный вход",
  login_rate_limit:    "Блок по IP (вход)",
  register:            "Регистрация",
  register_rate_limit: "Блок по IP (регистрация)",
  admin_ban_user:      "Пользователь заблокирован",
  admin_unban_user:    "Пользователь разблокирован",
  admin_auth_failed:   "Взлом админки",
  admin_bruteforce_blocked: "Блок админки (перебор)",
  admin_post_deleted:  "Пост удалён",
  gov_request_created: "Запрос от органов власти",
  gov_data_exported:   "Данные выгружены (гос. запрос)",
};

export function SecurityEventLog({ token }: { token: string }) {
  const [secEvents, setSecEvents] = useState<SecurityEvent[]>([]);
  const [secStats, setSecStats] = useState<{ total_24h: number; alerts_24h: number; suspicious_ips: number } | null>(null);
  const [secLoading, setSecLoading] = useState(false);
  const [secSeverity, setSecSeverity] = useState("");

  const loadSecEvents = (sev = secSeverity) => {
    setSecLoading(true);
    const qs = sev ? `&severity=${sev}` : "";
    adminReq(token, `security_events${qs}`)
      .then(d => { setSecEvents(d.events || []); setSecStats(d.stats || null); })
      .finally(() => setSecLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSecEvents(); }, []);

  return (
    <div className="flex flex-col gap-4">
      {secStats && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Событий за 24ч", value: secStats.total_24h,      icon: "Activity",      color: "#60A5FA" },
            { label: "Тревог за 24ч",  value: secStats.alerts_24h,     icon: "AlertTriangle", color: "#FBBF24" },
            { label: "Подозр. IP",      value: secStats.suspicious_ips, icon: "WifiOff",       color: "#F87171" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 flex flex-col gap-1.5"
              style={{ background: `${s.color}0d`, border: `1px solid ${s.color}26` }}>
              <Icon name={s.icon as "Activity"} size={14} style={{ color: s.color }} />
              <p className="text-white font-bold text-lg leading-none">{s.value}</p>
              <p className="text-white/35 text-[10px] leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: "",         label: "Все",      color: "rgba(255,255,255,0.3)" },
          { id: "info",     label: "Инфо",     color: "#60A5FA" },
          { id: "warning",  label: "Тревога",  color: "#FBBF24" },
          { id: "critical", label: "Критично", color: "#F87171" },
        ].map(f => (
          <button key={f.id}
            onClick={() => { setSecSeverity(f.id); loadSecEvents(f.id); }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={secSeverity === f.id
              ? { background: `${f.color}22`, color: f.color, border: `1px solid ${f.color}55` }
              : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {f.label}
          </button>
        ))}
        <button onClick={() => loadSecEvents(secSeverity)}
          className="ml-auto p-1.5 rounded-xl text-white/30 hover:text-white/60 transition-colors">
          <Icon name="RefreshCw" size={13} />
        </button>
      </div>

      {secLoading ? <Spinner /> : secEvents.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(96,165,250,0.08)" }}>
            <Icon name="ShieldCheck" size={22} style={{ color: "#60A5FA" }} />
          </div>
          <p className="text-white/25 text-sm">Событий нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-white/25 text-[10px] px-1">{secEvents.length} записей</p>
          {secEvents.map(ev => (
            <div key={ev.id} className="flex items-start gap-3 px-3 py-2.5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${SEV_COLOR[ev.severity] || "#ffffff"}18` }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: SEV_COLOR[ev.severity] || "#9CA3AF" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-xs font-semibold">
                    {EVENT_LABEL[ev.event_type] || ev.event_type}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${SEV_COLOR[ev.severity] || "#9CA3AF"}20`, color: SEV_COLOR[ev.severity] || "#9CA3AF" }}>
                    {ev.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {ev.ip && <span className="text-white/30 text-[10px] font-mono">{ev.ip}</span>}
                  {ev.email && <span className="text-white/30 text-[10px]">{ev.email}</span>}
                  {ev.user_id && <span className="text-white/20 text-[10px]">uid:{ev.user_id}</span>}
                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <span className="text-white/20 text-[10px] truncate max-w-[140px]">
                      {Object.entries(ev.details).map(([k, v]) => `${k}:${v}`).join(" · ")}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-white/20 text-[10px] flex-shrink-0 mt-0.5">
                {new Date(ev.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                <br />
                <span className="text-white/15">{new Date(ev.created_at).toLocaleDateString("ru")}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SecurityEventLog;