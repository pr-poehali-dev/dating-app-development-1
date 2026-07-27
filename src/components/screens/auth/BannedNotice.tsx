import Icon from "@/components/ui/icon";

export function BannedNotice({ reason, onContactSupport, onDismiss }: { reason: string; onContactSupport: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)" }}>

      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <Icon name="ShieldAlert" size={38} className="text-red-400" />
      </div>

      <h1 className="text-white font-bold text-2xl leading-tight mb-3">
        Аккаунт заблокирован
      </h1>

      <p className="text-white/55 text-sm leading-relaxed max-w-sm mb-4">
        Ваш аккаунт заблокирован администрацией.
      </p>

      <div className="w-full max-w-sm px-4 py-3 rounded-2xl mb-6"
        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}>
        <p className="text-white/40 text-[11px] uppercase tracking-wide mb-1">Причина</p>
        <p className="text-white text-sm font-semibold leading-snug">{reason}</p>
      </div>

      <p className="text-white/35 text-xs leading-relaxed max-w-sm mb-8">
        Если вы считаете, что это ошибка, обратитесь в поддержку — мы разберёмся.
      </p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <button onClick={onContactSupport}
          className="w-full py-3.5 rounded-2xl text-white text-sm font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 20px rgba(255,45,120,0.35)" }}>
          <Icon name="LifeBuoy" size={17} />
          Написать в поддержку
        </button>
        <button onClick={onDismiss}
          className="w-full py-3.5 rounded-2xl text-white/70 text-sm font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <Icon name="ChevronLeft" size={17} />
          Назад ко входу
        </button>
      </div>
    </div>
  );
}

export default BannedNotice;
