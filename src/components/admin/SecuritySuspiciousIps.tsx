import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { useState, useEffect } from "react";

type SuspIp = {
  ip: string; failed: number; total: number;
  last_seen: string; actions: string[]; blocked: boolean;
};

const ACTION_LABEL: Record<string, string> = {
  login: "вход",
  register: "регистрация",
  admin_login: "админка",
  pay_create: "оплата",
};

export function SecuritySuspiciousIps({ token }: { token: string }) {
  const [ips, setIps] = useState<SuspIp[]>([]);
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.suspiciousIps(token)
      .then(d => setIps(d.ips || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleBlock = async (ip: string) => {
    setBlocking(ip);
    try {
      await adminApi.blockIp(token, ip, "Подозрительная активность (перебор)");
      load();
    } catch { void 0; } finally { setBlocking(null); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-white/40 text-xs">Активность за последние 24 часа</p>
        <button onClick={load} className="p-1.5 rounded-xl text-white/30 hover:text-white/60 transition-colors">
          <Icon name="RefreshCw" size={13} />
        </button>
      </div>

      {loading ? <Spinner /> : ips.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(74,222,128,0.08)" }}>
            <Icon name="ShieldCheck" size={22} style={{ color: "#4ADE80" }} />
          </div>
          <p className="text-white/25 text-sm">Подозрительной активности нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-white/30 text-xs px-1">{ips.length} адресов с неудачными попытками</p>
          {ips.map(row => {
            const danger = row.failed >= 10;
            const color = danger ? "#F87171" : "#FBBF24";
            return (
              <div key={row.ip} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: `${color}0d`, border: `1px solid ${color}22` }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}1a` }}>
                  <Icon name="WifiOff" size={13} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-mono text-sm truncate">{row.ip}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-bold" style={{ color }}>
                      {row.failed} неудачных
                    </span>
                    <span className="text-white/25 text-[10px]">из {row.total} попыток</span>
                    {row.actions?.length > 0 && (
                      <span className="text-white/20 text-[10px]">
                        {row.actions.map(a => ACTION_LABEL[a] || a).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                {row.blocked ? (
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#F87171" }}>
                    Заблокирован
                  </span>
                ) : (
                  <button onClick={() => handleBlock(row.ip)} disabled={blocking === row.ip}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {blocking === row.ip ? "…" : "Заблокировать"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SecuritySuspiciousIps;
