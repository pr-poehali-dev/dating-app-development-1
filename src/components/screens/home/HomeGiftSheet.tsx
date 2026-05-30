import Icon from "@/components/ui/icon";
import { GIFTS, RARITY_STYLE } from "@/components/screens/ProfileGiftSheet";
import GiftItem from "@/components/gifts/GiftItem";

interface Props {
  giftCategory: string;
  giftBuying: number | null;
  onCategoryChange: (cat: string) => void;
  onPickGift: (id: number) => void;
  onClose: () => void;
}

export function HomeGiftSheet({ giftCategory, giftBuying, onCategoryChange, onPickGift, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="rounded-t-3xl flex flex-col max-h-[85dvh]"
        style={{ background: "var(--spark-card)", border: "1px solid var(--spark-divider)" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1 flex-shrink-0">
          <div>
            <p className="text-white font-bold text-lg">Подарки</p>
            <p className="text-white/40 text-xs mt-0.5">Выбери и подари себе</p>
          </div>
          <button onClick={onClose} className="text-white/40">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Категории */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar flex-shrink-0">
          {([{ id: "heart", label: "Сердца", emoji: "❤️" }, { id: "rose", label: "Розы", emoji: "🌹" }, { id: "bear", label: "Мишки", emoji: "🧸" }, { id: "ring", label: "Кольца", emoji: "💍" }] as const).map(cat => (
            <button key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl flex-shrink-0 transition-all text-sm font-semibold active:scale-95 ${giftCategory === cat.id ? "text-white" : "text-white/50"}`}
              style={giftCategory === cat.id
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                : { background: "rgba(255,255,255,0.07)" }}>
              <span>{cat.emoji}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Сетка подарков */}
        <div className="overflow-y-auto px-4 pb-8">
          <div className="grid grid-cols-4 gap-2.5">
            {GIFTS.filter(g => g.category === giftCategory).map((gift) => {
              const rs = RARITY_STYLE[gift.rarity];
              const selected = giftBuying === gift.id;
              return (
                <button key={gift.id}
                  onClick={() => onPickGift(gift.id)}
                  className="flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-1 rounded-2xl transition-all active:scale-90 relative overflow-hidden"
                  style={{
                    background: selected ? rs.bg : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${selected ? rs.border : "rgba(255,255,255,0.08)"}`,
                    boxShadow: selected ? rs.glow : "none",
                  }}>
                  {rs.label && (
                    <span className="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded-md leading-none"
                      style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}>
                      {rs.label}
                    </span>
                  )}
                  <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"} variant={gift.variant ?? 0} animKey={gift.anim} size={54} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} selected={selected} />
                  <p className="text-white/90 text-[10px] font-semibold leading-tight text-center line-clamp-2 w-full px-0.5">{gift.name}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                    {gift.price.toLocaleString("ru")} ₽
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeGiftSheet;