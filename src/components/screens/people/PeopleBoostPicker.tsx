import Icon from "@/components/ui/icon";

interface Props {
  boostSelected: "promote" | "super";
  boostPaying: boolean;
  promoCode: string | null;
  promoDiscount: number;
  promoInput: string;
  promoChecking: boolean;
  promoError: string | null;
  onClose: () => void;
  onSelectBoost: (type: "promote" | "super") => void;
  onBuy: () => void;
  onPromoInputChange: (val: string) => void;
  onApplyPromo: () => void;
  onResetPromo: () => void;
}

const BOOST_TIERS = [
  { type: "promote" as const, label: "Подъём на 1 час",      sub: "Поднять профиль в сетке на 1 час",  amount: 350 },
  { type: "super"   as const, label: "5 подъёмов на 1 час",  sub: "Пакет из 5 бустов по 1 часу",       amount: 550 },
] as const;

export function PeopleBoostPicker({
  boostSelected, boostPaying,
  promoCode, promoDiscount, promoInput, promoChecking, promoError,
  onClose, onSelectBoost, onBuy,
  onPromoInputChange, onApplyPromo, onResetPromo,
}: Props) {
  const discountedPrice = (amount: number) =>
    promoDiscount > 0 ? Math.round(amount * (1 - promoDiscount / 100) * 100) / 100 : amount;

  const selectedAmount = boostSelected === "promote" ? 350 : 550;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl flex flex-col pb-8 overflow-hidden"
        style={{ background: "linear-gradient(180deg,#1a0a1e 0%,#120818 100%)", boxShadow: "0 -4px 40px rgba(255,45,120,0.15)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF2D78,#FF6B35)", boxShadow: "0 4px 14px rgba(255,45,120,0.4)" }}>
              <Icon name="Rocket" size={17} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Продвинуть профиль</p>
              <p className="text-white/35 text-xs">Выбери длительность буста</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="X" size={15} className="text-white/60" />
          </button>
        </div>

        <div className="mx-5 mb-4" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,45,120,0.3),transparent)" }} />

        <div className="px-4 flex flex-col gap-3">
          {BOOST_TIERS.map(({ type, label, sub, amount }) => {
            const selected = boostSelected === type;
            return (
              <button key={type} onClick={() => onSelectBoost(type)}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all active:scale-[0.97] relative overflow-hidden"
                style={{
                  background: selected ? "rgba(255,45,120,0.1)" : "rgba(255,255,255,0.04)",
                  border: selected ? "1.5px solid rgba(255,45,120,0.45)" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: selected ? "0 0 20px rgba(255,45,120,0.1)" : "none",
                }}>
                {selected && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 0% 50%,rgba(255,45,120,0.1),transparent 60%)" }} />}
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 relative"
                  style={{ border: selected ? "none" : "1.5px solid rgba(255,255,255,0.25)", background: selected ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "transparent" }}>
                  {selected && <Icon name="Check" size={11} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{sub}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {promoDiscount > 0 && <p className="text-white/30 text-xs line-through">{amount.toLocaleString("ru")} ₽</p>}
                  <span className="text-white font-bold text-base">{discountedPrice(amount).toLocaleString("ru")} ₽</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 pt-3">
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
                <input value={promoInput}
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
          <button disabled={boostPaying} onClick={onBuy}
            className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)" }}>
            {boostPaying
              ? <Icon name="Loader2" size={20} className="animate-spin text-white" />
              : <><Icon name="Zap" size={18} className="text-white" /><span>Продолжить · {discountedPrice(selectedAmount).toLocaleString("ru")} ₽</span></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default PeopleBoostPicker;
