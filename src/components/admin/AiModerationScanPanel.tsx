import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminReq } from "./SecurityShared";
import { Spinner } from "./AdminLogin";

type ScanStatus = {
  gallery_left: number; avatars_left: number; covers_left: number;
  gallery_flagged: number; avatars_flagged: number; covers_flagged: number;
};

const SCAN_TYPES: { id: "gallery" | "avatars" | "covers"; label: string; icon: string }[] = [
  { id: "gallery", label: "Галерея профилей", icon: "Images" },
  { id: "avatars", label: "Аватары", icon: "User" },
  { id: "covers", label: "Обложки", icon: "Image" },
];

export function AiModerationScanPanel({ token }: { token: string }) {
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    adminReq(token, "ai_scan_status").then(setStatus).catch(() => {}).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const scanOneBatch = async (type: "gallery" | "avatars" | "covers") => {
    const d = await adminReq(token, "ai_scan_batch", { type });
    if (d.ok) {
      setLog(prev => [`Проверено: ${d.scanned}, найдено нарушений: ${d.flagged}`, ...prev].slice(0, 5));
    }
    return d;
  };

  const runFullScan = async (type: "gallery" | "avatars" | "covers") => {
    setScanning(type);
    try {
      const leftKey: keyof ScanStatus = type === "gallery" ? "gallery_left" : type === "avatars" ? "avatars_left" : "covers_left";
      let hasMore = true;
      while (hasMore) {
        const d = await scanOneBatch(type);
        if (!d.ok || d.scanned === 0) { hasMore = false; break; }
        const fresh = await adminReq(token, "ai_scan_status");
        setStatus(fresh);
        if ((fresh[leftKey] as number) <= 0) hasMore = false;
      }
    } finally {
      setScanning(null);
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,45,120,0.06)", border: "1px solid rgba(255,45,120,0.15)" }}>
        <p className="text-white text-sm font-semibold flex items-center gap-1.5">
          <Icon name="ScanSearch" size={14} /> Ретроактивное сканирование
        </p>
        <p className="text-white/40 text-xs mt-1">
          Проверит ИИ фото, загруженные ДО подключения модерации. Может занять время — идёт пакетами по 5 фото.
        </p>
      </div>

      {SCAN_TYPES.map(t => {
        const leftKey = `${t.id}_left` as keyof ScanStatus;
        const flaggedKey = `${t.id}_flagged` as keyof ScanStatus;
        const left = status?.[leftKey] ?? 0;
        const flagged = status?.[flaggedKey] ?? 0;
        const isScanning = scanning === t.id;
        return (
          <div key={t.id} className="rounded-2xl p-4 flex items-center justify-between gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                <Icon name={t.icon as "Image"} size={14} className="text-white/50" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold">{t.label}</p>
                <p className="text-white/35 text-xs">
                  {left > 0 ? `Осталось проверить: ${left}` : "Всё проверено"}
                  {flagged > 0 && <span style={{ color: "#F87171" }}> · нарушений: {flagged}</span>}
                </p>
              </div>
            </div>
            <button onClick={() => runFullScan(t.id)} disabled={isScanning || left === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              {isScanning ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Play" size={13} />}
              {left === 0 ? "Готово" : "Сканировать"}
            </button>
          </div>
        );
      })}

      {log.length > 0 && (
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {log.map((l, i) => <p key={i} className="text-white/40 text-xs">{l}</p>)}
        </div>
      )}
    </div>
  );
}

export default AiModerationScanPanel;
