import Icon from "@/components/ui/icon";

export const GIFTS = [
  { id: 1, name: "Сердце",          image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/ef6746fe-a013-4a1f-b13c-ee4ba77cbdde.jpg", price: 15,   anim: "gift-float",   rarity: "common"    },
  { id: 2, name: "Большое сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/d5101150-851d-4fac-a845-1e0a6b6e8760.jpg", price: 50,   anim: "gift-pulse",   rarity: "common"    },
  { id: 3, name: "Горящее сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c0e7fc43-5495-4222-a90e-684e88902504.jpg", price: 99,   anim: "gift-shake",   rarity: "rare"      },
  { id: 4, name: "Золотое сердце",  image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c4594718-6b05-4ca3-903f-ab3346f3b42f.jpg", price: 199,  anim: "gift-spin",    rarity: "rare"      },
  { id: 5, name: "Алмазное сердце", image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1291e5c7-6a4e-45a1-b12a-06e5e6e36f83.jpg", price: 499,  anim: "gift-sparkle", rarity: "epic"      },
  { id: 6, name: "Вечное сердце",   image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/52df7ba0-ca4a-49b1-a508-dd3763897e6b.jpg", price: 999,  anim: "gift-glow",    rarity: "epic"      },
  { id: 7, name: "Редкое сердце",   image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/80e59208-77ae-4950-86cf-1bd322436e12.jpg", price: 2499, anim: "gift-orbit",   rarity: "legendary" },
  { id: 8, name: "Легендарное",     image: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/fb7a829f-4921-426d-83cf-c0b2729d4cf7.jpg", price: 4999, anim: "gift-rainbow", rarity: "legendary" },
];

export const RARITY_STYLE: Record<string, { label: string; border: string; bg: string; text: string }> = {
  common:    { label: "",            border: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.04)", text: "" },
  rare:      { label: "Редкий",      border: "rgba(99,179,237,0.4)",   bg: "rgba(99,179,237,0.07)",  text: "#63B3ED" },
  epic:      { label: "Эпический",   border: "rgba(159,122,234,0.5)",  bg: "rgba(159,122,234,0.08)", text: "#9F7AEA" },
  legendary: { label: "Легендарный", border: "rgba(237,137,54,0.6)",   bg: "rgba(237,137,54,0.1)",   text: "#ED8936" },
};

export const PAY_CREATE_URL = "https://functions.poehali.dev/d866e377-6dac-43c2-a709-799c346ac3ef";

interface ProfileGiftSheetProps {
  recipientName: string;
  recipientId: number;
  giftSelected: number | null;
  giftDone: number | null;
  giftPaying: boolean;
  onClose: () => void;
  onSelectGift: (id: number) => void;
  onPayGift: (id: number) => void;
}

export function ProfileGiftSheet({
  recipientName,
  recipientId: _recipientId,
  giftSelected,
  giftDone,
  giftPaying,
  onClose,
  onSelectGift,
  onPayGift,
}: ProfileGiftSheetProps) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <div className="rounded-t-3xl flex flex-col max-h-[80dvh]"
        style={{ background: "var(--spark-card)", border: "1px solid var(--spark-divider)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div>
            <p className="text-white font-bold text-lg">Подарить {recipientName}</p>
            <p className="text-white/40 text-xs mt-0.5">Выберите подарок</p>
          </div>
          <button onClick={onClose} className="text-white/40">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6">
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            {GIFTS.map((gift) => {
              const rs = RARITY_STYLE[gift.rarity];
              const sel = giftSelected === gift.id;
              return (
                <button key={gift.id} onClick={() => onSelectGift(gift.id)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all active:scale-90 relative overflow-hidden"
                  style={{
                    background: sel ? rs.bg : "rgba(255,255,255,0.05)",
                    border: `1px solid ${sel ? rs.border : "rgba(255,255,255,0.1)"}`,
                    boxShadow: sel ? `0 0 16px ${rs.border}` : "none",
                  }}>
                  {rs.label && (
                    <span className="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded-md leading-none"
                      style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}>
                      {rs.label}
                    </span>
                  )}
                  <div className={`w-14 h-14 ${gift.anim}`}>
                    <img src={gift.image} alt={gift.name} className="w-full h-full object-contain" style={{ borderRadius: 8 }} />
                  </div>
                  <p className="text-white/90 text-[10px] font-semibold leading-tight text-center line-clamp-2">{gift.name}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                    {gift.price} ⭐
                  </span>
                </button>
              );
            })}
          </div>

          {giftSelected !== null && (() => {
            const gift = GIFTS.find(g => g.id === giftSelected)!;
            const rs = RARITY_STYLE[gift.rarity];
            return (
              <div className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: rs.bg || "rgba(255,200,0,0.06)", border: `1px solid ${rs.border || "rgba(255,200,0,0.2)"}` }}>
                <div className={`w-14 h-14 flex-shrink-0 ${gift.anim}`}>
                  <img src={gift.image} className="w-full h-full object-contain" style={{ borderRadius: 8 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{gift.name}</p>
                  {rs.label && <p className="text-xs font-bold" style={{ color: rs.text }}>{rs.label}</p>}
                  <p className="text-white/40 text-xs">{gift.price} звёзд для {recipientName}</p>
                </div>
                {giftDone === giftSelected ? (
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl" style={{ background: "rgba(74,222,128,0.15)" }}>
                    <Icon name="Check" size={14} className="text-green-400" />
                    <span className="text-green-400 text-xs font-semibold">Отправлен!</span>
                  </div>
                ) : (
                  <button disabled={giftPaying}
                    onClick={() => onPayGift(giftSelected)}
                    className="btn-grad px-4 py-2.5 text-xs font-bold text-white rounded-xl flex-shrink-0 disabled:opacity-60 flex items-center gap-1.5">
                    {giftPaying
                      ? <><Icon name="Loader2" size={13} className="animate-spin" />...</>
                      : <><Icon name="Gift" size={13} />Купить</>}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
