import { useState } from "react";
import Icon from "@/components/ui/icon";

function fmtMB(mb: number) {
  if (mb >= 1000) return `${(mb / 1024).toFixed(1)} ГБ`;
  return `${mb.toFixed(1)} МБ`;
}

function getLS() {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "";
      total += (localStorage.getItem(key) ?? "").length * 2;
    }
    return total;
  } catch (e) {
    return 0;
  }
}

function DonutChart({ segments, total }: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const R = 70; const STROKE = 18; const CX = 90; const CY = 90;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
      {segments.map((s, i) => {
        const pct = total > 0 ? s.value / total : 0;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const rot = (offset / total) * 360 - 90;
        offset += s.value;
        return (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={s.color} strokeWidth={STROKE}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="butt"
            transform={`rotate(${rot} ${CX} ${CY})`}
          />
        );
      })}
      {segments.map((s, i) => {
        const pct = total > 0 ? s.value / total : 0;
        if (pct < 0.06) return null;
        const midPct = (segments.slice(0, i).reduce((a, x) => a + x.value, 0) + s.value / 2) / total;
        const angle = midPct * 2 * Math.PI - Math.PI / 2;
        const x = CX + R * Math.cos(angle);
        const y = CY + R * Math.sin(angle);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fontSize="9" fontWeight="700" fill="white" style={{ pointerEvents: "none" }}>
            {Math.round(pct * 100)}%
          </text>
        );
      })}
    </svg>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className="relative flex-shrink-0 transition-all active:scale-95"
      style={{ width: 44, height: 26 }}>
      <div className="absolute inset-0 rounded-full transition-colors"
        style={{ background: value ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }} />
      <div className="absolute top-[3px] rounded-full transition-all"
        style={{ width: 20, height: 20, background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", left: value ? 21 : 3 }} />
    </button>
  );
}

function MemoryScreen({ onBack, cacheMB }: { onBack: () => void; cacheMB: number }) {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const segments = [
    { label: "Фото профилей", value: cacheMB * 0.45, color: "#f97316" },
    { label: "Медиа чатов",   value: cacheMB * 0.20, color: "#22c55e" },
    { label: "Сообщения",     value: cacheMB * 0.18, color: "#ef4444" },
    { label: "Другое",        value: cacheMB * 0.17, color: "#a855f7" },
  ];
  const total = segments.reduce((a, s) => a + s.value, 0);

  const handleClear = () => {
    setClearing(true);
    setTimeout(() => {
      try { localStorage.clear(); } catch (e) { /* ignore */ }
      setClearing(false);
      setCleared(true);
    }, 900);
  };

  return (
    <div className="px-5 flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-2 text-white/50 text-sm -ml-1 mb-1">
        <Icon name="ChevronLeft" size={18} /> Назад
      </button>

      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <DonutChart segments={segments} total={total} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white font-black text-2xl leading-tight">{fmtMB(cleared ? 0 : total)}</span>
            <span className="text-white/40 text-[10px]">МБ</span>
          </div>
        </div>
        <p className="text-white font-bold text-lg">Использование памяти</p>
        <p className="text-white/40 text-xs text-center">LoveBloom занимает &lt;1% места на устройстве</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {segments.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < segments.length - 1 ? "border-b border-white/5" : ""}`}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.color }}>
              <Icon name="Check" size={13} className="text-white" />
            </div>
            <span className="text-white/80 text-sm flex-1">
              {s.label} <span className="text-white/40">{Math.round(s.value / total * 100)}%</span>
            </span>
            <span className="font-semibold text-sm" style={{ color: "#FF2D78" }}>
              {cleared ? "0 МБ" : fmtMB(s.value)}
            </span>
          </div>
        ))}
        <div className="px-4 py-4 border-t border-white/5">
          <button onClick={handleClear} disabled={clearing || cleared}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: cleared ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#ef4444,#dc2626)" }}>
            {clearing
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Очистка...</>
              : cleared
                ? <><Icon name="Check" size={16} className="text-green-400" />Кэш очищен</>
                : <>🗑 Очистить кэш {fmtMB(total)}</>
            }
          </button>
          <p className="text-white/30 text-[11px] text-center mt-2 leading-relaxed">
            Медиа останутся в облаке и будут загружены повторно при необходимости
          </p>
        </div>
      </div>
    </div>
  );
}

export function SettingsDataStoragePanel({ screen }: { screen: string }) {
  const [sub, setSub] = useState<"" | "memory">("");
  const [autoMobile, setAutoMobile] = useState(true);
  const [autoWifi, setAutoWifi] = useState(true);
  const [autoRoaming, setAutoRoaming] = useState(false);

  const lsBytes = getLS();
  const cacheMB = parseFloat(((lsBytes + 1.2 * 1024 * 1024) / (1024 * 1024)).toFixed(1));

  if (screen !== "data_storage") return null;

  if (sub === "memory") return <MemoryScreen onBack={() => setSub("")} cacheMB={cacheMB} />;

  const mainItems: { icon: string; iconBg: string; iconColor: string; label: string; value: string; action: (() => void) | null }[] = [
    {
      icon: "RefreshCw", iconBg: "rgba(59,130,246,0.18)", iconColor: "#60a5fa",
      label: "Использование памяти", value: fmtMB(cacheMB),
      action: () => setSub("memory"),
    },
    {
      icon: "Activity", iconBg: "rgba(34,197,94,0.18)", iconColor: "#4ade80",
      label: "Использование трафика", value: "—",
      action: null,
    },
    {
      icon: "HardDrive", iconBg: "rgba(251,146,60,0.18)", iconColor: "#fb923c",
      label: "Хранилище", value: "Внутреннее",
      action: null,
    },
  ];

  return (
    <div className="px-5 flex flex-col gap-5">

      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-widest px-1 mb-1" style={{ color: "#FF2D78" }}>
          Использование сети и кэша
        </p>
        <div className="glass-card rounded-2xl overflow-hidden">
          {mainItems.map((item, i) => (
            <button key={i}
              onClick={item.action ?? undefined}
              disabled={!item.action}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${item.action ? "active:bg-white/5" : "opacity-60 cursor-default"} ${i < mainItems.length - 1 ? "border-b border-white/5" : ""}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.iconBg }}>
                <Icon name={item.icon} size={18} style={{ color: item.iconColor }} />
              </div>
              <span className="text-white/85 text-sm flex-1">{item.label}</span>
              <span className="text-sm font-semibold" style={{ color: "#FF2D78" }}>{item.value}</span>
              {item.action && <Icon name="ChevronRight" size={15} className="text-white/20 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-widest px-1 mb-1" style={{ color: "#FF2D78" }}>
          Автозагрузка медиа
        </p>
        <div className="glass-card rounded-2xl overflow-hidden">
          {([
            { label: "Через мобильную сеть", sub: "Фото, видео до 10 МБ", value: autoMobile, toggle: () => setAutoMobile(v => !v) },
            { label: "Через сети Wi-Fi",     sub: "Фото, видео до 15 МБ", value: autoWifi,   toggle: () => setAutoWifi(v => !v)   },
            { label: "В роуминге",           sub: "Только фото",          value: autoRoaming, toggle: () => setAutoRoaming(v => !v) },
          ] as const).map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-white/5" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-sm">{item.label}</p>
                <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
              </div>
              <Toggle value={item.value} onChange={item.toggle} />
            </div>
          ))}
          <button
            onClick={() => { setAutoMobile(true); setAutoWifi(true); setAutoRoaming(false); }}
            className="w-full px-4 py-3 text-left border-t border-white/5 active:bg-white/5 transition-colors">
            <span className="text-sm font-semibold" style={{ color: "#FF2D78" }}>Сбросить настройки</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-widest px-1 mb-1" style={{ color: "#FF2D78" }}>
          Автоудаление кэшированных медиа
        </p>
        <div className="glass-card rounded-2xl overflow-hidden">
          {([
            { icon: "User",  iconBg: "rgba(59,130,246,0.15)",  iconColor: "#60a5fa", label: "Личные чаты", value: "Никогда"  },
            { icon: "Users", iconBg: "rgba(34,197,94,0.15)",   iconColor: "#4ade80", label: "Матчи",       value: "1 месяц"  },
            { icon: "Zap",   iconBg: "rgba(251,191,36,0.15)",  iconColor: "#fbbf24", label: "Трансляции",  value: "1 неделя" },
          ] as const).map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-white/5" : ""}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.iconBg }}>
                <Icon name={item.icon} size={17} style={{ color: item.iconColor }} />
              </div>
              <span className="text-white/85 text-sm flex-1">{item.label}</span>
              <span className="text-white/40 text-sm">{item.value}</span>
              <Icon name="ChevronRight" size={15} className="text-white/20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default SettingsDataStoragePanel;
