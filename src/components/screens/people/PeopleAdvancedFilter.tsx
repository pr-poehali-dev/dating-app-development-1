import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  ageMin: number;
  ageMax: number;
  verifiedOnly: boolean;
  onApply: (ageMin: number, ageMax: number, verifiedOnly: boolean) => void;
  onClose: () => void;
}

const AGE_PRESETS = [[18,25],[25,35],[35,45],[45,60]] as const;

const ITEM_H = 44;
const VISIBLE = 5;
const AGES = Array.from({ length: 63 }, (_, i) => i + 18); // 18..80

function DrumPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollToIdx = useCallback((idx: number, smooth = true) => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: idx * ITEM_H, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const onScroll = () => {
    if (!listRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(AGES.length - 1, idx));
    if (AGES[clamped] !== value) onChange(AGES[clamped]);
  };

  const onScrollEnd = () => {
    if (!listRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    scrollToIdx(Math.max(0, Math.min(AGES.length - 1, idx)));
  };

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <span className="text-white/40 text-sm font-medium">{label}</span>
      <div className="relative overflow-hidden" style={{ height: ITEM_H * VISIBLE }}>
        {/* Маска сверху и снизу */}
        <div className="absolute inset-x-0 top-0 z-10 pointer-events-none"
          style={{ height: ITEM_H * 2, background: "linear-gradient(to bottom, rgba(10,6,18,0.95) 0%, transparent 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{ height: ITEM_H * 2, background: "linear-gradient(to top, rgba(10,6,18,0.95) 0%, transparent 100%)" }} />
        {/* Выделение активного элемента */}
        <div className="absolute inset-x-3 z-0 rounded-xl pointer-events-none"
          style={{ top: ITEM_H * 2, height: ITEM_H, background: "rgba(255,255,255,0.06)" }} />
        <div
          ref={(el) => {
            (listRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            if (el) {
              const idx = AGES.indexOf(value);
              el.scrollTop = (idx >= 0 ? idx : 0) * ITEM_H;
            }
          }}
          onScroll={onScroll}
          onScrollCapture={onScrollEnd}
          className="h-full overflow-y-scroll"
          style={{
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingTop: ITEM_H * 2,
            paddingBottom: ITEM_H * 2,
          }}
        >
          {AGES.map((age) => (
            <div
              key={age}
              onClick={() => { onChange(age); scrollToIdx(AGES.indexOf(age)); }}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
              className="flex items-center justify-center cursor-pointer select-none"
            >
              <span className={`font-semibold transition-all duration-150 ${age === value ? "text-white text-2xl" : "text-white/25 text-lg"}`}>
                {age}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PeopleAdvancedFilter({ ageMin: initMin, ageMax: initMax, verifiedOnly: initVerified, onApply, onClose }: Props) {
  const [ageMin, setAgeMin] = useState(initMin);
  const [ageMax, setAgeMax] = useState(initMax);
  const [verifiedOnly, setVerifiedOnly] = useState(initVerified);

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
        <button onClick={() => { setAgeMin(18); setAgeMax(60); setVerifiedOnly(false); }}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{ color: "rgba(255,45,120,0.8)", background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.15)" }}>
          Сбросить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* Возраст */}
        <div className="flex flex-col gap-1.5">
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold px-1 flex items-center gap-1.5">
            <Icon name="Cake" size={11} className="text-pink-500" />
            Возраст
          </p>

          <div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>

            {/* Drum picker */}
            <div className="px-4 py-3 flex flex-col gap-0">
              <div className="flex items-stretch gap-4">
                <DrumPicker value={ageMin} onChange={v => setAgeMin(Math.min(v, ageMax - 1))} label="От" />
                <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.07)" }} />
                <DrumPicker value={ageMax} onChange={v => setAgeMax(Math.max(v, ageMin + 1))} label="Кому" />
              </div>

              {/* Пресеты */}
              <div className="flex gap-1.5 flex-wrap pt-4 pb-1">
                {AGE_PRESETS.map(([a, b]) => {
                  const active = ageMin === a && ageMax === b;
                  return (
                    <button key={`${a}-${b}`}
                      onClick={() => { setAgeMin(a); setAgeMax(b); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${active ? "text-white" : "text-white/45"}`}
                      style={active
                        ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }
                        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {a}–{b}
                    </button>
                  );
                })}
              </div>
            </div>
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
        <button onClick={() => onApply(ageMin, ageMax, verifiedOnly)}
          className="btn-grad w-full py-4 text-base font-bold rounded-2xl">
          Применить
        </button>
      </div>
    </div>
  );
}