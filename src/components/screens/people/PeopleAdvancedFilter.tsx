import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  verifiedOnly: boolean;
  onApply: (verifiedOnly: boolean) => void;
  onClose: () => void;
}

export function PeopleAdvancedFilter({ verifiedOnly: initVerified, onApply, onClose }: Props) {
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
        <button onClick={() => setVerifiedOnly(false)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{ color: "rgba(255,45,120,0.8)", background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.15)" }}>
          Сбросить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

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
        <button onClick={() => onApply(verifiedOnly)}
          className="btn-grad w-full py-4 text-base font-bold rounded-2xl">
          Применить
        </button>
      </div>
    </div>
  );
}

export default PeopleAdvancedFilter;
