import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { InputRow } from "./SecurityShared";
import { useState, useEffect } from "react";

type BlockedIp = { id: number; ip_address: string; reason: string; created_at: string };

export function SecurityBlockedIps({ token }: { token: string }) {
  const [ips, setIps] = useState<BlockedIp[]>([]);
  const [ipsLoading, setIpsLoading] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newIpReason, setNewIpReason] = useState("");
  const [ipSaving, setIpSaving] = useState(false);

  const loadIps = () => {
    setIpsLoading(true);
    adminApi.blockedIps(token).then(d => setIps(d.ips)).catch(() => {}).finally(() => setIpsLoading(false));
  };

  const handleBlockIp = async () => {
    if (!newIp.trim()) return;
    setIpSaving(true);
    try {
      await adminApi.blockIp(token, newIp.trim(), newIpReason.trim() || "Ручная блокировка");
      setNewIp(""); setNewIpReason(""); loadIps();
    } catch { void 0; } finally { setIpSaving(false); }
  };

  const handleUnblockIp = async (id: number) => {
    await adminApi.unblockIp(token, id).catch(() => {});
    loadIps();
  };

  useEffect(() => { loadIps(); }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.12)" }}>
            <Icon name="Shield" size={13} style={{ color: "#F87171" }} />
          </div>
          <p className="text-white font-semibold text-sm">Заблокировать IP-адрес</p>
        </div>
        <InputRow
          value={newIp} onChange={setNewIp}
          placeholder="192.168.1.1"
          onAction={() => {}} actionLabel="" saving={false}
        />
        <InputRow
          value={newIpReason} onChange={setNewIpReason}
          placeholder="Причина блокировки (необязательно)"
          onAction={handleBlockIp} actionLabel="Заблокировать"
          saving={ipSaving}
        />
      </div>

      {ipsLoading ? <Spinner /> : (
        <>
          {ips.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.08)" }}>
                <Icon name="ShieldCheck" size={22} style={{ color: "#4ADE80" }} />
              </div>
              <p className="text-white/25 text-sm">Заблокированных IP нет</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-white/30 text-xs px-1">{ips.length} заблокировано</p>
              {ips.map(ip => (
                <div key={ip.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Icon name="WifiOff" size={13} style={{ color: "#F87171" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-mono text-sm">{ip.ip_address}</p>
                    <p className="text-white/35 text-xs truncate">{ip.reason}</p>
                  </div>
                  <p className="text-white/20 text-[10px] flex-shrink-0">{new Date(ip.created_at).toLocaleDateString("ru")}</p>
                  <button onClick={() => handleUnblockIp(ip.id)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95"
                    style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)" }}>
                    Снять
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SecurityBlockedIps;
