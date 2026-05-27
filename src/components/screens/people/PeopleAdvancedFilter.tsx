import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  ageMin: number;
  ageMax: number;
  verifiedOnly: boolean;
  onApply: (ageMin: number, ageMax: number, verifiedOnly: boolean) => void;
  onClose: () => void;
}

export function PeopleAdvancedFilter({ ageMin: initMin, ageMax: initMax, verifiedOnly: initVerified, onApply, onClose }: Props) {
  const [ageMin, setAgeMin] = useState(initMin);
  const [ageMax, setAgeMax] = useState(initMax);
  const [verifiedOnly, setVerifiedOnly] = useState(initVerified);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col"
      style={{ background: "var(--spark-dark,#0f0a1a)" }}>

      {/* Шапка */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
        <h2 className="text-white font-bold text-lg flex-1">Фильтры включены</h2>
        <button onClick={() => { setAgeMin(18); setAgeMax(60); setVerifiedOnly(false); }}
          className="text-white/40 text-sm">
          Сбросить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">

        {/* Возраст */}
        <div className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-base">Возраст</span>
            <span className="text-pink-400 font-bold text-base">{ageMin} – {ageMax} лет</span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-white/40 text-xs">от {ageMin}</span>
                <span className="text-white/20 text-xs">18 – 80</span>
              </div>
              <input type="range" min={18} max={80} value={ageMin}
                onChange={e => setAgeMin(Math.min(+e.target.value, ageMax - 1))}
                className="w-full accent-pink-500 h-1.5 rounded-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-white/40 text-xs">до {ageMax}</span>
              </div>
              <input type="range" min={18} max={80} value={ageMax}
                onChange={e => setAgeMax(Math.max(+e.target.value, ageMin + 1))}
                className="w-full accent-pink-500 h-1.5 rounded-full" />
            </div>
          </div>

          {/* Быстрые диапазоны */}
          <div className="flex gap-2 flex-wrap">
            {[[18,25],[25,35],[35,45],[45,60]].map(([a,b]) => (
              <button key={`${a}-${b}`}
                onClick={() => { setAgeMin(a); setAgeMax(b); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                style={ageMin === a && ageMax === b
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                  : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {a}–{b}
              </button>
            ))}
          </div>
        </div>

        {/* Только верифицированные */}
        <button
          onClick={() => setVerifiedOnly(v => !v)}
          className="flex items-center justify-between w-full rounded-2xl p-5 transition-all active:scale-[0.98]"
          style={{
            background: verifiedOnly
              ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.12))"
              : "rgba(255,255,255,0.05)",
            border: verifiedOnly ? "1.5px solid rgba(59,130,246,0.35)" : "1px solid rgba(255,255,255,0.08)",
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: verifiedOnly ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "rgba(255,255,255,0.08)",
                boxShadow: verifiedOnly ? "0 4px 12px rgba(59,130,246,0.4)" : "none",
              }}>
              <Icon name="BadgeCheck" size={20} className={verifiedOnly ? "text-white" : "text-white/40"} />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-white font-semibold text-sm">Только с верификацией</span>
              <span className="text-white/40 text-xs">Показывать только подтверждённые аккаунты</span>
            </div>
          </div>
          <div className="w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-3"
            style={{ background: verifiedOnly ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "rgba(255,255,255,0.12)" }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
              style={{ left: verifiedOnly ? "calc(100% - 22px)" : "2px" }} />
          </div>
        </button>

      </div>

      {/* Кнопка применить */}
      <div className="px-5 pb-10 pt-3">
        <button
          onClick={() => onApply(ageMin, ageMax, verifiedOnly)}
          className="btn-grad w-full py-4 text-base font-bold rounded-2xl">
          Применить
        </button>
      </div>
    </div>
  );
}
