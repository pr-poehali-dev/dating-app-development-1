import Icon from "@/components/ui/icon";

export function BannedNotice({ reason, onContactSupport, onDismiss }: { reason: string; onContactSupport: () => void; onDismiss: () => void }) {
  return (
    <div
      className="flex flex-col gap-3 px-4 py-4 rounded-2xl"
      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)" }}
    >
      <div className="flex items-center gap-2">
        <Icon name="ShieldAlert" size={18} className="text-red-400 flex-shrink-0" />
        <p className="text-red-300 text-sm font-bold">Аккаунт заблокирован</p>
      </div>
      <p className="text-white/70 text-xs leading-relaxed">
        Ваш аккаунт заблокирован администрацией. Причина:
      </p>
      <p className="text-white text-sm font-semibold px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.25)" }}>
        {reason}
      </p>
      <p className="text-white/55 text-xs leading-relaxed">
        Если вы считаете, что это ошибка, обратитесь в поддержку — мы разберёмся.
      </p>
      <div className="flex gap-2 mt-1">
        <button
          onClick={onContactSupport}
          className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}
        >
          Написать в поддержку
        </button>
        <button
          onClick={onDismiss}
          className="py-2.5 px-4 rounded-xl text-white/70 text-xs font-semibold active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Скрыть
        </button>
      </div>
    </div>
  );
}

export default BannedNotice;