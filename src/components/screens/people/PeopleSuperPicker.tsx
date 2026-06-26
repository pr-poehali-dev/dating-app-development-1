import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  boostPaying: boolean;
  promoCode: string | null;
  promoDiscount: number;
  promoInput: string;
  promoChecking: boolean;
  promoError: string | null;
  onClose: () => void;
  onBuy: (ageMin: number, ageMax: number, radius: number, photoOnly: boolean) => void;
  onPromoInputChange: (val: string) => void;
  onApplyPromo: () => void;
  onResetPromo: () => void;
}

export function PeopleSuperPicker({
  boostPaying,
  promoCode, promoDiscount, promoInput, promoChecking, promoError,
  onClose, onBuy,
  onPromoInputChange, onApplyPromo, onResetPromo,
}: Props) {
  const [superAgeMin, setSuperAgeMin] = useState(18);
  const [superAgeMax, setSuperAgeMax] = useState(60);
  const [superRadius, setSuperRadius] = useState(50);
  const [superPhotoOnly, setSuperPhotoOnly] = useState(false);
  const [superAgeOpen, setSuperAgeOpen] = useState(false);
  const [superRadiusOpen, setSuperRadiusOpen] = useState(false);

  const discountedPrice = (amount: number) =>
    promoDiscount > 0 ? Math.round(amount * (1 - promoDiscount / 100) * 100) / 100 : amount;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl flex flex-col pb-8 overflow-hidden"
        style={{ background: "linear-gradient(180deg,#1a0a1e 0%,#120818 100%)", boxShadow: "0 -4px 40px rgba(155,89,182,0.2)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#9B59B6,#FF2D78)", boxShadow: "0 4px 14px rgba(155,89,182,0.5)" }}>
              <Icon name="Star" size={17} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Супер подъём</p>
              <p className="text-white/35 text-xs">Настрой под свою аудиторию</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="X" size={15} className="text-white/60" />
          </button>
        </div>

        <div className="mx-5 mb-4" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(155,89,182,0.4),transparent)" }} />

        <div className="px-4 pb-1">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3 px-1">Выбери фильтры</p>
          <div className="flex flex-col gap-3">

            {/* Возраст */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: superAgeOpen ? "1px solid rgba(255,45,120,0.35)" : "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
              <button
                onClick={() => { setSuperAgeOpen(v => !v); setSuperRadiusOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-4 transition-all active:scale-[0.98]"
                style={{ background: superAgeOpen ? "rgba(255,45,120,0.06)" : "transparent" }}>
                <span className="text-white font-medium text-base">Возраст</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm">{superAgeMin}–{superAgeMax} лет</span>
                  <Icon name={superAgeOpen ? "ChevronUp" : "ChevronRight"} size={18} className="text-white/60" />
                </div>
              </button>
              {superAgeOpen && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-4"
                  style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-white/40 text-xs">от</span>
                      <span className="text-white font-semibold text-sm">{superAgeMin}</span>
                    </div>
                    <input type="range" min={18} max={80} value={superAgeMin}
                      onChange={e => setSuperAgeMin(Math.min(+e.target.value, superAgeMax - 1))}
                      className="w-full accent-pink-500" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-white/40 text-xs">до</span>
                      <span className="text-white font-semibold text-sm">{superAgeMax}</span>
                    </div>
                    <input type="range" min={18} max={80} value={superAgeMax}
                      onChange={e => setSuperAgeMax(Math.max(+e.target.value, superAgeMin + 1))}
                      className="w-full accent-pink-500" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {([[18,25],[25,35],[35,45],[45,60]] as const).map(([a,b]) => {
                      const active = superAgeMin === a && superAgeMax === b;
                      return (
                        <button key={`${a}-${b}`} onClick={() => { setSuperAgeMin(a); setSuperAgeMax(b); }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                          style={active
                            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                            : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          {a}–{b}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Радиус */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: superRadiusOpen ? "1px solid rgba(255,45,120,0.35)" : "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
              <button
                onClick={() => { setSuperRadiusOpen(v => !v); setSuperAgeOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-4 transition-all active:scale-[0.98]"
                style={{ background: superRadiusOpen ? "rgba(255,45,120,0.06)" : "transparent" }}>
                <span className="text-white font-medium text-base">Радиус</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm">{superRadius} км</span>
                  <Icon name={superRadiusOpen ? "ChevronUp" : "ChevronRight"} size={18} className="text-white/60" />
                </div>
              </button>
              {superRadiusOpen && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3"
                  style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-white/40 text-xs">расстояние</span>
                      <span className="text-white font-semibold text-sm">{superRadius} км</span>
                    </div>
                    <input type="range" min={1} max={300} value={superRadius}
                      onChange={e => setSuperRadius(+e.target.value)}
                      className="w-full accent-pink-500" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 10, 25, 50, 100].map(r => (
                      <button key={r} onClick={() => setSuperRadius(r)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={superRadius === r
                          ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                          : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {r} км
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Только фото */}
            <button
              onClick={() => setSuperPhotoOnly(v => !v)}
              className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-[0.98]"
              style={{ border: `1.5px solid ${superPhotoOnly ? "rgba(255,45,120,0.5)" : "rgba(255,255,255,0.18)"}`, background: superPhotoOnly ? "rgba(255,45,120,0.08)" : "transparent" }}>
              <span className="text-white font-medium text-base">Только фото</span>
              <div className="relative w-12 h-7 rounded-full transition-all flex-shrink-0"
                style={{ background: superPhotoOnly ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.2)" }}>
                <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: superPhotoOnly ? "calc(100% - 26px)" : "2px" }} />
              </div>
            </button>
          </div>
        </div>

        <div className="px-4 pt-4">
          {promoCode ? (
            <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="BadgeCheck" size={18} className="text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm font-semibold truncate">Промокод {promoCode} · −{promoDiscount}%</p>
              </div>
              <button onClick={onResetPromo} className="text-white/30 flex-shrink-0">
                <Icon name="X" size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => onPromoInputChange(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && onApplyPromo()}
                  placeholder="Промокод"
                  className="flex-1 text-white placeholder-white/25 rounded-2xl px-4 py-3 text-sm outline-none uppercase tracking-wide"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button onClick={onApplyPromo} disabled={promoChecking || !promoInput.trim()}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 12px rgba(255,45,120,0.35)" }}>
                  {promoChecking ? <Icon name="Loader2" size={16} className="animate-spin" /> : "Применить"}
                </button>
              </div>
              {promoError && <p className="text-red-400 text-xs mt-2 px-1">{promoError}</p>}
            </>
          )}
        </div>

        <div className="px-4 pt-4">
          <button
            disabled={boostPaying}
            onClick={() => onBuy(superAgeMin, superAgeMax, superRadius, superPhotoOnly)}
            className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#9B59B6,#FF2D78)", boxShadow: "0 4px 20px rgba(155,89,182,0.4)" }}>
            {boostPaying
              ? <Icon name="Loader2" size={20} className="animate-spin text-white" />
              : <>
                  <Icon name="Star" size={18} className="text-white" />
                  <span>Продолжить · {discountedPrice(550).toLocaleString("ru")} ₽</span>
                </>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default PeopleSuperPicker;
