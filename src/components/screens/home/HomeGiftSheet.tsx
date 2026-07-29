import Icon from "@/components/ui/icon";
import { GIFTS, RARITY_STYLE, giftSection, isCoinGift, giftCoins } from "@/components/screens/ProfileGiftSheet";
import GiftItem from "@/components/gifts/GiftItem";
import { useBackHandler } from "@/hooks/backStack";

interface Props {
  giftCategory: string;
  giftBuying: number | null;
  onCategoryChange: (cat: string) => void;
  onPickGift: (id: number) => void;
  onClose: () => void;
}

export function HomeGiftSheet({ giftCategory, giftBuying, onCategoryChange, onPickGift, onClose }: Props) {
  useBackHandler(true, onClose);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--spark-dark, #0f0a1a)" }}>
      <div className="flex flex-col h-full">

        {/* Заголовок */}
        <div className="flex items-center gap-3 px-5 pb-3 flex-shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="ArrowLeft" size={18} className="text-white/80" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-lg leading-tight">Подарки</p>
            <p className="text-white/40 text-xs mt-0.5">Выбери и подари себе</p>
          </div>
        </div>

        {/* Категории — сегментированный переключатель */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex gap-1 p-1 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {([{ id: "market", label: "Маркет", icon: "Store" }, { id: "special", label: "Особые", icon: "Sparkles" }] as const).map(cat => {
              const active = giftCategory === cat.id;
              return (
                <button key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-[0.98] text-sm font-bold ${active ? "text-white" : "text-white/45"}`}
                  style={active
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 6px 18px rgba(255,45,120,0.35)" }
                    : { background: "transparent" }}>
                  <Icon name={cat.icon} size={16} className={active ? "text-white" : "text-white/45"} />
                  <span className="leading-none">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Сетка подарков */}
        <div className="flex-1 overflow-y-auto px-4 py-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
          <div className="grid grid-cols-3 gap-3">
            {GIFTS.filter(g => giftSection(g.category) === giftCategory).map((gift) => {
              const rs = RARITY_STYLE[gift.rarity];
              const selected = giftBuying === gift.id;
              return (
                <button key={gift.id}
                  onClick={() => onPickGift(gift.id)}
                  className="flex flex-col items-center gap-2 pt-4 pb-3.5 px-1.5 rounded-2xl transition-all active:scale-90 relative overflow-hidden"
                  style={{
                    background: selected ? rs.bg : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${selected ? rs.border : "rgba(255,255,255,0.08)"}`,
                    boxShadow: selected ? rs.glow : "none",
                  }}>
                  {rs.label && (
                    <span className="absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-md leading-none"
                      style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}>
                      {rs.label}
                    </span>
                  )}
                  <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"|"special"|"market"} variant={gift.variant ?? 0} animKey={gift.anim} size={72} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} selected={selected} emoji={gift.emoji} />
                  <p className="text-white/90 text-xs font-semibold leading-tight text-center line-clamp-2 w-full px-0.5">{gift.name}</p>
                  {isCoinGift(gift) ? (
                    <span className="text-xs font-bold px-2 py-1 rounded-full mt-0.5 flex items-center gap-1"
                      style={{ background: "rgba(255,200,0,0.16)", color: "#FFC800", border: "1px solid rgba(255,200,0,0.3)" }}>
                      <Icon name="Coins" size={11} style={{ color: "#FFC800" }} />
                      {giftCoins(gift).toLocaleString("ru")}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-1 rounded-full mt-0.5"
                      style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                      {gift.price.toLocaleString("ru")} ₽
                    </span>
                  )}
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