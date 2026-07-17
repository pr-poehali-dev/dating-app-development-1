import { useState } from "react";
import Icon from "@/components/ui/icon";

// ── Утилиты ──────────────────────────────────────────────────────────────────
function fmtMB(mb: number) {
  if (mb >= 1000) return `${(mb / 1024).toFixed(1)} ГБ`;
  if (mb < 0.1) return "0 МБ";
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

// ── Красивый пончик ───────────────────────────────────────────────────────────
function DonutChart({ segments, total, cleared }: {
  segments: { label: string; value: number; color: string; glow: string }[];
  total: number;
  cleared: boolean;
}) {
  const R = 62; const STROKE = 22; const CX = 100; const CY = 100;
  const circumference = 2 * Math.PI * R;
  const GAP = 3; // зазор между сегментами
  let angleOffset = -90;

  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      <defs>
        {segments.map((_s, i) => (
          <filter key={i} id={`glow${i}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        ))}
      </defs>

      {/* Тёмный фон кольца */}
      <circle cx={CX} cy={CY} r={R} fill="none"
        stroke="rgba(255,255,255,0.04)" strokeWidth={STROKE} />

      {cleared ? (
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={STROKE} />
      ) : (
        segments.map((s, i) => {
          const pct = total > 0 ? s.value / total : 0;
          if (pct === 0) return null;
          const degrees = pct * 360 - (GAP / circumference) * 360;
          const dashLen = (degrees / 360) * circumference;
          const gapLen = circumference - dashLen;
          const rotate = angleOffset + (GAP / 2 / circumference) * 360;
          angleOffset += pct * 360;
          return (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={s.color} strokeWidth={STROKE}
              strokeDasharray={`${dashLen} ${gapLen}`}
              strokeLinecap="round"
              transform={`rotate(${rotate} ${CX} ${CY})`}
              style={{ filter: `drop-shadow(0 0 6px ${s.color}88)` }}
            />
          );
        })
      )}

      {/* Центральный контент */}
      <circle cx={CX} cy={CY} r={R - STROKE / 2 - 2} fill="rgba(10,6,20,0.9)" />
    </svg>
  );
}

// ── Легенда сегментов ─────────────────────────────────────────────────────────
function SegmentLegend({ segments, total, cleared }: {
  segments: { label: string; value: number; color: string; glow: string; icon: string }[];
  total: number;
  cleared: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {segments.map((s, i) => {
        const pct = total > 0 ? Math.round(s.value / total * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
            style={{ background: `${s.color}12`, border: `1px solid ${s.color}28` }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}25`, boxShadow: `0 0 8px ${s.color}44` }}>
              <Icon name={s.icon} size={14} style={{ color: s.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-[11px] font-medium leading-tight truncate">{s.label}</p>
              <p className="font-bold text-xs leading-tight mt-0.5" style={{ color: s.color }}>
                {cleared ? "0 МБ" : fmtMB(s.value)}
                <span className="text-white/30 font-normal ml-1">{pct}%</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Тогл ─────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative flex-shrink-0 active:scale-95 transition-transform"
      style={{ width: 46, height: 26 }}>
      <div className="absolute inset-0 rounded-full transition-all duration-200"
        style={{ background: value ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.10)",
          boxShadow: value ? "0 0 12px rgba(255,45,120,0.4)" : "none" }} />
      <div className="absolute top-[3px] rounded-full transition-all duration-200"
        style={{ width: 20, height: 20, background: "white",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)", left: value ? 23 : 3 }} />
    </button>
  );
}

// ── Экран «Использование памяти» ─────────────────────────────────────────────
function MemoryScreen({ onBack, cacheMB }: { onBack: () => void; cacheMB: number }) {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const segments = [
    { label: "Фото профилей", value: cacheMB * 0.45, color: "#f97316", glow: "#f9731644", icon: "Image" },
    { label: "Медиа чатов",   value: cacheMB * 0.22, color: "#22c55e", glow: "#22c55e44", icon: "MessageSquare" },
    { label: "Сообщения",     value: cacheMB * 0.18, color: "#FF2D78", glow: "#FF2D7844", icon: "Heart" },
    { label: "Другое",        value: cacheMB * 0.15, color: "#a855f7", glow: "#a855f744", icon: "Grid" },
  ];
  const total = segments.reduce((a, s) => a + s.value, 0);

  const handleClear = () => {
    if (clearing || cleared) return;
    setClearing(true);
    setTimeout(() => {
      try { localStorage.clear(); } catch (e) { /* ignore */ }
      setClearing(false);
      setCleared(true);
    }, 1200);
  };

  return (
    <div className="px-5 flex flex-col gap-5 pb-6">
      <button onClick={onBack} className="flex items-center gap-2 text-white/50 text-sm -ml-1">
        <Icon name="ChevronLeft" size={18} /> Назад
      </button>

      {/* Диаграмма-карточка */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(145deg,rgba(255,45,120,0.08),rgba(155,89,182,0.08),rgba(10,6,20,0.6))", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Заголовок */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-white font-bold text-base">Использование памяти</p>
          <p className="text-white/35 text-xs mt-0.5">Полутон занимает &lt;1% места на устройстве</p>
        </div>

        {/* График + число по центру */}
        <div className="flex items-center justify-center py-2 relative">
          <DonutChart segments={segments} total={total} cleared={cleared} />
          {/* Центральный текст поверх SVG */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-white font-black text-3xl leading-none"
              style={{ textShadow: "0 0 20px rgba(255,45,120,0.4)" }}>
              {cleared ? "0" : total.toFixed(1)}
            </span>
            <span className="text-white/40 text-xs font-semibold mt-0.5">МБ</span>
            {cleared && <span className="text-green-400 text-[10px] font-bold mt-1">очищено ✓</span>}
          </div>
        </div>

        {/* Легенда */}
        <div className="px-4 pb-4">
          <SegmentLegend segments={segments} total={total} cleared={cleared} />
        </div>

        {/* Прогресс-бар общего использования */}
        <div className="px-5 pb-4">
          <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
            <span>Используется</span>
            <span>{cleared ? "0 МБ" : fmtMB(total)} / ~2 ГБ доступно</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: cleared ? "0%" : `${Math.min((total / 2048) * 100, 100)}%`,
                background: "linear-gradient(90deg,#FF2D78,#9B59B6)",
                boxShadow: "0 0 8px rgba(255,45,120,0.5)",
              }} />
          </div>
        </div>
      </div>

      {/* Кнопка очистки */}
      <button onClick={handleClear} disabled={clearing || cleared}
        className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-70"
        style={{
          background: cleared
            ? "rgba(34,197,94,0.15)"
            : clearing
              ? "rgba(239,68,68,0.7)"
              : "linear-gradient(135deg,#ef4444,#dc2626)",
          border: cleared ? "1px solid rgba(34,197,94,0.3)" : "none",
          boxShadow: (!clearing && !cleared) ? "0 4px 20px rgba(239,68,68,0.4)" : "none",
        }}>
        {clearing ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Очистка кэша...</>
        ) : cleared ? (
          <><Icon name="CheckCircle" size={18} className="text-green-400" /><span className="text-green-400">Кэш успешно очищен</span></>
        ) : (
          <>🗑️ Очистить кэш · {fmtMB(total)}</>
        )}
      </button>

      <p className="text-white/25 text-[11px] text-center leading-relaxed -mt-3">
        Медиа хранятся в облаке и будут загружены повторно при необходимости
      </p>
    </div>
  );
}

// ── Главный экран ─────────────────────────────────────────────────────────────
export function SettingsDataStoragePanel({ screen }: { screen: string }) {
  const [sub, setSub] = useState<"" | "memory">("");
  const [autoMobile, setAutoMobile] = useState(true);
  const [autoWifi, setAutoWifi] = useState(true);
  const [autoRoaming, setAutoRoaming] = useState(false);
  const [autoReset, setAutoReset] = useState(false);

  const lsBytes = getLS();
  const cacheMB = parseFloat(((lsBytes + 1.2 * 1024 * 1024) / (1024 * 1024)).toFixed(1));

  if (screen !== "data_storage") return null;
  if (sub === "memory") return <MemoryScreen onBack={() => setSub("")} cacheMB={cacheMB} />;

  const handleResetAuto = () => {
    setAutoMobile(true);
    setAutoWifi(true);
    setAutoRoaming(false);
    setAutoReset(true);
    setTimeout(() => setAutoReset(false), 1500);
  };

  return (
    <div className="px-5 flex flex-col gap-5 pb-6">

      {/* Блок 1: Использование памяти */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: "#FF2D78" }}>
          Хранилище и кэш
        </p>

        {/* Карточка памяти — красивая, кликабельная */}
        <button onClick={() => setSub("memory")}
          className="w-full rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.12),rgba(155,89,182,0.10))", border: "1px solid rgba(255,45,120,0.2)", boxShadow: "0 4px 24px rgba(255,45,120,0.12)" }}>
          <div className="px-4 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.25),rgba(99,102,241,0.2))", boxShadow: "0 4px 12px rgba(59,130,246,0.25)" }}>
              <Icon name="RefreshCw" size={22} style={{ color: "#60a5fa" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Использование памяти</p>
              <p className="text-white/40 text-xs mt-0.5">Кэш, фото, медиа</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-black text-base" style={{ color: "#FF2D78" }}>{fmtMB(cacheMB)}</span>
              <Icon name="ChevronRight" size={16} className="text-white/25" />
            </div>
          </div>
          {/* Прогресс-бар */}
          <div className="mx-4 mb-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full"
              style={{ width: `${Math.min((cacheMB / 500) * 100, 100)}%`, background: "linear-gradient(90deg,#FF2D78,#9B59B6)" }} />
          </div>
        </button>

        {/* Хранилище */}
        <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(251,146,60,0.18)" }}>
            <Icon name="HardDrive" size={18} style={{ color: "#fb923c" }} />
          </div>
          <div className="flex-1">
            <p className="text-white/85 text-sm">Хранилище</p>
            <p className="text-white/35 text-xs mt-0.5">Медиа хранятся в облаке</p>
          </div>
          <span className="text-white/40 text-sm font-medium">Облако</span>
        </div>
      </div>

      {/* Блок 2: Автозагрузка медиа */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: "#FF2D78" }}>
          Автозагрузка медиа
        </p>
        <div className="glass-card rounded-2xl overflow-hidden">
          {([
            { label: "Через мобильную сеть", sub: "Фото, видео до 10 МБ", value: autoMobile, toggle: () => setAutoMobile(v => !v), color: "#4ade80" },
            { label: "Через сети Wi-Fi",     sub: "Фото, видео до 15 МБ", value: autoWifi,   toggle: () => setAutoWifi(v => !v),   color: "#60a5fa" },
            { label: "В роуминге",           sub: "Только фото",          value: autoRoaming, toggle: () => setAutoRoaming(v => !v), color: "#f97316" },
          ] as const).map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-white/5" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-sm font-medium">{item.label}</p>
                <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
              </div>
              <Toggle value={item.value} onChange={item.toggle} />
            </div>
          ))}

          {/* Сброс */}
          <button onClick={handleResetAuto}
            className="w-full px-4 py-3.5 text-left border-t border-white/5 flex items-center justify-between active:bg-white/5 transition-colors">
            <span className="text-sm font-semibold" style={{ color: autoReset ? "#22c55e" : "#FF2D78" }}>
              {autoReset ? "✓ Настройки сброшены" : "Сбросить настройки"}
            </span>
            {!autoReset && <Icon name="RotateCcw" size={14} className="text-white/20" />}
          </button>
        </div>
      </div>

      {/* Блок 3: Автоудаление кэша */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: "#FF2D78" }}>
          Автоудаление кэшированных медиа
        </p>
        <div className="glass-card rounded-2xl overflow-hidden">
          {([
            { icon: "User",  iconBg: "rgba(59,130,246,0.15)",  iconColor: "#60a5fa", label: "Личные чаты", value: "Никогда",  hint: "Хранить бессрочно"  },
            { icon: "Users", iconBg: "rgba(34,197,94,0.15)",   iconColor: "#4ade80", label: "Матчи",       value: "1 месяц",  hint: "Удалять через месяц" },
            { icon: "Zap",   iconBg: "rgba(251,191,36,0.15)",  iconColor: "#fbbf24", label: "Трансляции",  value: "1 неделя", hint: "Удалять через неделю" },
          ] as const).map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-white/5" : ""}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.iconBg }}>
                <Icon name={item.icon} size={17} style={{ color: item.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-sm font-medium">{item.label}</p>
                <p className="text-white/30 text-xs mt-0.5">{item.hint}</p>
              </div>
              <span className="text-white/40 text-sm">{item.value}</span>
              <Icon name="ChevronRight" size={15} className="text-white/15 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default SettingsDataStoragePanel;