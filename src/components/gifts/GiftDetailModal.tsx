import Icon from "@/components/ui/icon";
import GiftItem from "@/components/gifts/GiftItem";
import { RARITY_STYLE, isCoinGift, giftCoins } from "@/components/screens/ProfileGiftSheet";

interface GiftDetail {
  id: number;
  name: string;
  price: number;
  rarity: string;
  category: string;
  variant: number;
  anim: string;
  emoji?: string;
  senderName?: string;
  sentAt?: string;
}

interface Props {
  gift: GiftDetail;
  onClose: () => void;
}

export function GiftDetailModal({ gift, onClose }: Props) {
  const rarity = gift.rarity as "common" | "rare" | "epic" | "legendary";
  const rs = RARITY_STYLE[rarity] ?? RARITY_STYLE.common;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-4 animate-scale-in"
        style={{ background: "var(--spark-card,#1a1030)", border: `1.5px solid ${rs.border}`, boxShadow: `0 0 40px ${rs.border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Анимированный подарок */}
        <div className="w-36 h-36 flex items-center justify-center">
          <GiftItem
            category={gift.category as "heart" | "rose" | "bear" | "ring" | "special" | "market"}
            variant={gift.variant}
            animKey={gift.anim}
            size={144}
            rarity={rarity}
            emoji={gift.emoji}
            marketBadge={false}
          />
        </div>

        {/* Название + метка редкости */}
        <div className="text-center">
          <p className="text-white font-bold text-xl">{gift.name}</p>
          {rs.label && (
            <p className="text-sm font-bold mt-1" style={{ color: rs.text }}>{rs.label}</p>
          )}
        </div>

        {/* Цена */}
        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl"
          style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
          <span className="text-white/60 text-sm">Стоимость:</span>
          {isCoinGift({ category: gift.category, price: gift.price } as Parameters<typeof isCoinGift>[0]) ? (
            <span className="font-bold text-base flex items-center gap-1" style={{ color: "#FFC800" }}>
              <Icon name="Coins" size={15} style={{ color: "#FFC800" }} />
              {giftCoins({ price: gift.price } as Parameters<typeof giftCoins>[0]).toLocaleString("ru")} монет
            </span>
          ) : (
            <span className="text-white font-bold text-base">{gift.price.toLocaleString("ru")} ₽</span>
          )}
        </div>

        {/* Отправитель */}
        {gift.senderName && (
          <p className="text-white/40 text-sm text-center">
            Подарил(а): <span className="text-white/70 font-semibold">{gift.senderName}</span>
          </p>
        )}

        {/* Дата */}
        {gift.sentAt && (
          <p className="text-white/25 text-xs">
            {new Date(gift.sentAt).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-white/50 text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

export default GiftDetailModal;