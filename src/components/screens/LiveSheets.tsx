import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

// ─── SettingsSheet ─────────────────────────────────────────────────────────────
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [lang, setLang] = useState("ru");
  const [location, setLocation] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const detectGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const d = await r.json();
        setLocation(d.address?.city || d.address?.town || d.address?.country || "");
      } catch { /* ignore */ }
      setGeoLoading(false);
    }, () => setGeoLoading(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-base">Настройки</h3>
          <button onClick={onClose}><Icon name="X" size={20} className="text-white/40" /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-5 pb-10">
          {/* Местоположение */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Местоположение</p>
            <div className="flex gap-2">
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Ваш город..."
                className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
              <button onClick={detectGeo} disabled={geoLoading}
                className="glass-card px-3 py-2.5 text-white/60 text-xs flex items-center gap-1.5 disabled:opacity-50">
                {geoLoading
                  ? <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                  : <Icon name="LocateFixed" size={14} />}
                GPS
              </button>
            </div>
          </div>
          {/* Язык */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Язык</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: "ru", l: "Русский" }, { v: "en", l: "English" }, { v: "tr", l: "Türkçe" }].map((lg) => (
                <button key={lg.v} onClick={() => setLang(lg.v)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${lang === lg.v ? "text-white" : "text-white/60"}`}
                  style={lang === lg.v
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                    : { background: "rgba(255,255,255,0.08)" }}>
                  {lg.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ToolsSheet ────────────────────────────────────────────────────────────────
export function ToolsSheet({ currentUser, onClose }: { currentUser: User; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const liveId = `LB${currentUser.id.toString().padStart(8, "0")}`;

  const copyId = () => {
    navigator.clipboard?.writeText(liveId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toolItems = [
    { icon: "Clock", label: "Недавние трансляции", sub: "История твоих эфиров" },
    { icon: "Share2", label: "Социальные сети", sub: "Поделиться профилем" },
    { icon: "Ban", label: "Чёрный список", sub: "Заблокированные пользователи" },
    { icon: "MessageSquare", label: "Отправить отзыв", sub: "Помоги нам стать лучше" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-base">Инструменты</h3>
          <button onClick={onClose}><Icon name="X" size={20} className="text-white/40" /></button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4 pb-10">
          {/* Статистика */}
          <div className="glass-card p-4 grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-1 py-2">
              <span className="text-white font-bold text-2xl">{currentUser.followers ?? 0}</span>
              <span className="text-white/40 text-xs">Подписчиков</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-2" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-lg">💎</span>
                <span className="text-white font-bold text-2xl">0</span>
              </div>
              <span className="text-white/40 text-xs">Бриллиантов</span>
            </div>
          </div>

          {/* Статус */}
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.15)" }}>
              <Icon name="Award" size={20} className="text-pink-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Статус: Новичок</p>
              <p className="text-white/40 text-xs">Уровень 1 · Проведи первый эфир!</p>
            </div>
          </div>

          {/* Live ID */}
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-xs mb-1">Мой Live ID</p>
              <p className="text-white font-mono font-bold text-base">{liveId}</p>
            </div>
            <button onClick={copyId}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${copied ? "" : "text-white/60"}`}
              style={{ background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)", ...(copied ? { color: "#4ADE80" } : {}) }}>
              <Icon name={copied ? "Check" : "Copy"} size={14} />
              {copied ? "Скопировано!" : "Копировать"}
            </button>
          </div>

          {/* Пункты меню */}
          {toolItems.map((item) => (
            <button key={item.label}
              className="glass-card flex items-center gap-4 px-4 py-3.5 w-full text-left hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,45,120,0.1)" }}>
                <Icon name={item.icon as "Clock"|"Share2"|"Ban"|"MessageSquare"} size={18} className="text-pink-400" />
              </div>
              <div className="flex-1">
                <p className="text-white/85 text-sm">{item.label}</p>
                <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
              </div>
              <Icon name="ChevronRight" size={15} className="text-white/20" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}