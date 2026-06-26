import Icon from "@/components/ui/icon";

interface Props {
  boostPaying: boolean;
  promoCode: string | null;
  promoDiscount: number;
  promoInput: string;
  promoChecking: boolean;
  promoError: string | null;
  onClose: () => void;
  onOpenBoostPicker: () => void;
  onOpenSuperPicker: () => void;
  onPromoInputChange: (val: string) => void;
  onApplyPromo: () => void;
  onResetPromo: () => void;
}

export function PeopleBoostsSheet({
  boostPaying, promoCode, promoDiscount, promoInput,
  promoChecking, promoError,
  onClose, onOpenBoostPicker, onOpenSuperPicker,
  onPromoInputChange, onApplyPromo, onResetPromo,
}: Props) {
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

        <div className="flex items-center justify-between px-5 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 14px rgba(255,45,120,0.45)" }}>
              <Icon name="Zap" size={17} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Купить бусты профиля</p>
              <p className="text-white/35 text-xs">Поднимись выше в поиске</p>
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
          <button
            disabled={boostPaying}
            onClick={onOpenBoostPicker}
            className="w-full text-left transition-all active:scale-[0.97] disabled:opacity-60 rounded-2xl overflow-hidden relative"
            style={{ background: "rgba(255,45,120,0.08)", border: "1px solid rgba(255,45,120,0.25)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 10% 50%,rgba(255,45,120,0.12),transparent 70%)" }} />
            <div className="relative p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#FF2D78,#FF6B35)", boxShadow: "0 4px 14px rgba(255,45,120,0.45)" }}>
                <Icon name="Rocket" size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Продвинуть профиль</p>
                <p className="text-white/40 text-xs mt-0.5">Поднять в ближайшую сетку</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-base text-white">350 ₽</p>
                <p className="text-white/30 text-[10px]">за 1 час</p>
              </div>
            </div>
          </button>

          <button
            disabled={boostPaying}
            onClick={onOpenSuperPicker}
            className="w-full text-left transition-all active:scale-[0.97] disabled:opacity-60 rounded-2xl overflow-hidden relative"
            style={{ background: "rgba(155,89,182,0.1)", border: "1px solid rgba(155,89,182,0.3)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 10% 50%,rgba(155,89,182,0.15),transparent 70%)" }} />
            <div className="relative p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#9B59B6,#FF2D78)", boxShadow: "0 4px 14px rgba(155,89,182,0.5)" }}>
                <Icon name="Star" size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Супер подъём</p>
                <p className="text-white/40 text-xs mt-0.5">С фильтрами по аудитории</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-base text-white">550 ₽</p>
                <p className="text-white/30 text-[10px]">за 1 час</p>
              </div>
            </div>
          </button>
        </div>

        <div className="px-4 pt-4">
          {promoCode ? (
            <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="BadgeCheck" size={18} className="text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm font-semibold truncate">Промокод {promoCode} · −{promoDiscount}%</p>
              </div>
              <button onClick={onResetPromo} className="text-white/30 hover:text-white/60 flex-shrink-0">
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
      </div>
    </div>
  );
}

export default PeopleBoostsSheet;
