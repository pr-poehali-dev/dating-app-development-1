import Icon from "@/components/ui/icon";

export type PayProvider = "yookassa" | "robokassa";

const METHODS: { id: PayProvider; title: string; hint: string; icon: string; color: string }[] = [
  { id: "yookassa", title: "ЮKassa", hint: "Карты, SBP, кошельки", icon: "CreditCard", color: "#7B61FF" },
  { id: "robokassa", title: "Robokassa", hint: "Карты, SBP, рассрочка", icon: "Wallet", color: "#00A0E3" },
];

interface Props {
  value: PayProvider;
  onChange: (p: PayProvider) => void;
  className?: string;
}

export function PayMethodPicker({ value, onChange, className = "" }: Props) {
  return (
    <div className={className}>
      <p className="text-white/50 text-xs font-semibold mb-2 px-1">СПОСОБ ОПЛАТЫ</p>
      <div className="grid grid-cols-2 gap-2.5">
        {METHODS.map(m => {
          const active = value === m.id;
          return (
            <button key={m.id} type="button" onClick={() => onChange(m.id)}
              className="flex items-center gap-2.5 px-3 py-3 rounded-2xl transition-all active:scale-[0.97] text-left"
              style={{
                background: active ? `${m.color}22` : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${active ? m.color : "rgba(255,255,255,0.08)"}`,
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: active ? m.color : "rgba(255,255,255,0.08)" }}>
                <Icon name={m.icon} size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold leading-tight">{m.title}</p>
                <p className="text-white/40 text-[10px] leading-tight mt-0.5 truncate">{m.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PayMethodPicker;
