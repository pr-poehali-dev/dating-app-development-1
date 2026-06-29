import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const ZODIACS = [
  { id: "aries",       label: "Овен",      emoji: "♈", grad: "linear-gradient(135deg,#FF6B6B,#FF2D55)" },
  { id: "taurus",      label: "Телец",     emoji: "♉", grad: "linear-gradient(135deg,#56C271,#2E9E5B)" },
  { id: "gemini",      label: "Близнецы",  emoji: "♊", grad: "linear-gradient(135deg,#FFD66B,#F5A623)" },
  { id: "cancer",      label: "Рак",       emoji: "♋", grad: "linear-gradient(135deg,#7FB3FF,#4F8EF7)" },
  { id: "leo",         label: "Лев",       emoji: "♌", grad: "linear-gradient(135deg,#FFA94D,#FF6B2D)" },
  { id: "virgo",       label: "Дева",      emoji: "♍", grad: "linear-gradient(135deg,#A0D468,#7CB342)" },
  { id: "libra",       label: "Весы",      emoji: "♎", grad: "linear-gradient(135deg,#FF9FC7,#FF5C9D)" },
  { id: "scorpio",     label: "Скорпион",  emoji: "♏", grad: "linear-gradient(135deg,#C56BFF,#8E2DE2)" },
  { id: "sagittarius", label: "Стрелец",   emoji: "♐", grad: "linear-gradient(135deg,#FF8A8A,#E0245E)" },
  { id: "capricorn",   label: "Козерог",   emoji: "♑", grad: "linear-gradient(135deg,#8D99AE,#5C677D)" },
  { id: "aquarius",    label: "Водолей",   emoji: "♒", grad: "linear-gradient(135deg,#6BE5FF,#2D9CDB)" },
  { id: "pisces",      label: "Рыбы",      emoji: "♓", grad: "linear-gradient(135deg,#9B8CFF,#6C5CE7)" },
];

interface Props {
  verifiedOnly: boolean;
  onlineOnly: boolean;
  zodiac: string;
  isPremium?: boolean;
  onPremium?: () => void;
  onApply: (verifiedOnly: boolean, onlineOnly: boolean, zodiac: string) => void;
  onClose: () => void;
}

export function PeopleAdvancedFilter({
  verifiedOnly: initVerified, onlineOnly: initOnline, zodiac: initZodiac,
  isPremium, onPremium, onApply, onClose,
}: Props) {
  const [verifiedOnly, setVerifiedOnly] = useState(initVerified);
  const [onlineOnly, setOnlineOnly] = useState(initOnline);
  const [zodiac, setZodiac] = useState(initZodiac);
  const [zodiacOpen, setZodiacOpen] = useState(false);
  const zodiacRef = useRef<HTMLDivElement>(null);

  const toggleZodiac = () => {
    if (!isPremium) { onClose(); setTimeout(() => onPremium?.(), 50); return; }
    setZodiacOpen(v => {
      const next = !v;
      if (next) setTimeout(() => zodiacRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 60);
      return next;
    });
  };

  const selectZodiac = (id: string) => {
    setZodiac(zodiac === id ? "" : id);
    setZodiacOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col"
      style={{ background: "var(--spark-dark,#0f0a1a)" }}>

      {/* Шапка */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-2xl transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon name="ChevronLeft" size={18} className="text-white/70" />
        </button>
        <h2 className="text-white font-bold text-lg flex-1">Расширенные фильтры</h2>
        <button onClick={() => { setVerifiedOnly(false); setOnlineOnly(false); setZodiac(""); setZodiacOpen(false); }}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{ color: "rgba(255,45,120,0.8)", background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.15)" }}>
          Сбросить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* Только онлайн */}
        <div className="flex flex-col gap-1.5">
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold px-1 flex items-center gap-1.5">
            <Icon name="Wifi" size={11} className="text-green-400" />
            Активность
          </p>
          <button onClick={() => setOnlineOnly(v => !v)}
            className="flex items-center justify-between w-full rounded-2xl p-4 transition-all active:scale-[0.98]"
            style={{
              background: onlineOnly ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
              border: onlineOnly ? "1.5px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,255,255,0.07)",
            }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: onlineOnly ? "linear-gradient(135deg,#4ADE80,#22c55e)" : "rgba(255,255,255,0.07)",
                  boxShadow: onlineOnly ? "0 4px 14px rgba(74,222,128,0.45)" : "none",
                }}>
                <Icon name="Wifi" size={18} className={onlineOnly ? "text-white" : "text-white/35"} />
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-white font-bold text-sm">Только онлайн</span>
                <span className="text-white/35 text-[11px]">Сейчас в сети</span>
              </div>
            </div>
            <div className="w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-3"
              style={{ background: onlineOnly ? "linear-gradient(135deg,#4ADE80,#22c55e)" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
                style={{ left: onlineOnly ? "calc(100% - 22px)" : "2px" }} />
            </div>
          </button>
        </div>

        {/* Знак зодиака */}
        <div className="flex flex-col gap-1.5">
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold px-1 flex items-center gap-1.5">
            <Icon name="Sparkles" size={11} className="text-pink-500" />
            Совместимость
          </p>
          <div ref={zodiacRef} className="rounded-2xl overflow-hidden"
            style={{ border: zodiacOpen ? "1px solid rgba(255,45,120,0.3)" : "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)" }}>
            <button onClick={toggleZodiac}
              className="w-full flex items-center justify-between px-4 py-3.5 transition-all active:scale-[0.99]"
              style={{ background: zodiacOpen ? "rgba(255,45,120,0.06)" : "transparent" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: zodiac ? ZODIACS.find(z => z.id === zodiac)?.grad : "rgba(255,255,255,0.07)" }}>
                  {zodiac
                    ? <span className="text-lg leading-none">{ZODIACS.find(z => z.id === zodiac)?.emoji}</span>
                    : <Icon name="Sparkles" size={18} className="text-white/35" />}
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-white font-bold text-sm flex items-center gap-1.5">
                    Знак зодиака
                    {!isPremium && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold leading-none"
                        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
                        PREMIUM
                      </span>
                    )}
                  </span>
                  <span className="text-white/35 text-[11px]">
                    {zodiac ? ZODIACS.find(z => z.id === zodiac)?.label : "Любой знак"}
                  </span>
                </div>
              </div>
              {!isPremium
                ? <Icon name="Lock" size={15} className="text-pink-400" />
                : <Icon name={zodiacOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/40" />}
            </button>
            {zodiacOpen && isPremium && (
              <div className="px-3 pb-3 pt-2 flex flex-col gap-2"
                style={{ background: "rgba(0,0,0,0.15)" }}>
                <div className="grid grid-cols-4 gap-1.5">
                  {ZODIACS.map(z => {
                    const active = zodiac === z.id;
                    return (
                      <button key={z.id} onClick={() => selectZodiac(z.id)}
                        className="relative flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-semibold transition-all active:scale-95 overflow-hidden"
                        style={active
                          ? { background: z.grad, color: "white", boxShadow: "0 4px 14px rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.25)" }
                          : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-base leading-none transition-all"
                          style={active
                            ? { background: "rgba(255,255,255,0.22)" }
                            : { background: z.grad, opacity: 0.85 }}>
                          {z.emoji}
                        </span>
                        {z.label}
                        {active && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.95)" }}>
                            <Icon name="Check" size={9} style={{ color: "#1a0d2e" }} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {zodiac && (
                  <button onClick={() => { setZodiac(""); setZodiacOpen(false); }}
                    className="self-center text-pink-400 text-[11px] font-semibold active:scale-95">Сбросить выбор</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Только верифицированные */}
        <div className="flex flex-col gap-1.5">
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold px-1 flex items-center gap-1.5">
            <Icon name="BadgeCheck" size={11} className="text-blue-400" />
            Безопасность
          </p>

          <button onClick={() => setVerifiedOnly(v => !v)}
            className="flex items-center justify-between w-full rounded-2xl p-4 transition-all active:scale-[0.98] overflow-hidden relative"
            style={{
              background: verifiedOnly
                ? "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(99,102,241,0.1))"
                : "rgba(255,255,255,0.04)",
              border: verifiedOnly ? "1.5px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.07)",
              boxShadow: verifiedOnly ? "0 4px 20px rgba(59,130,246,0.12)" : "none",
            }}>
            {verifiedOnly && (
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)" }} />
            )}
            <div className="flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: verifiedOnly ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "rgba(255,255,255,0.07)",
                  boxShadow: verifiedOnly ? "0 4px 14px rgba(59,130,246,0.45)" : "none",
                }}>
                <Icon name="BadgeCheck" size={19} className={verifiedOnly ? "text-white" : "text-white/35"} />
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-white font-bold text-sm">Только с верификацией</span>
                <span className="text-white/35 text-[11px]">Только подтверждённые аккаунты</span>
              </div>
            </div>
            <div className="w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-3"
              style={{ background: verifiedOnly ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
                style={{ left: verifiedOnly ? "calc(100% - 22px)" : "2px" }} />
            </div>
          </button>
        </div>

      </div>

      {/* Кнопка применить */}
      <div className="px-5 pb-10 pt-3">
        <button onClick={() => onApply(verifiedOnly, onlineOnly, zodiac)}
          className="btn-grad w-full py-4 text-base font-bold rounded-2xl">
          Применить
        </button>
      </div>
    </div>
  );
}

export default PeopleAdvancedFilter;
