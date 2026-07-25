import { useState } from "react";
import { type MyGift } from "@/lib/api";
import GiftItem from "@/components/gifts/GiftItem";
import { GIFTS } from "@/components/screens/ProfileGiftSheet";
import { GiftDetailModal } from "@/components/gifts/GiftDetailModal";

interface Props {
  gifts: MyGift[];
  loading: boolean;
  emptyText?: string;
  showSender?: boolean;
}

const RARITY_COLORS: Record<string, { border: string; bg: string; glow: string }> = {
  common:    { border: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.04)", glow: "none" },
  rare:      { border: "rgba(99,179,237,0.4)",   bg: "rgba(99,179,237,0.07)",  glow: "0 0 18px rgba(99,179,237,0.35)" },
  epic:      { border: "rgba(159,122,234,0.5)",  bg: "rgba(159,122,234,0.08)", glow: "0 0 22px rgba(159,122,234,0.45)" },
  legendary: { border: "rgba(237,137,54,0.6)",   bg: "rgba(237,137,54,0.1)",   glow: "0 0 28px rgba(237,137,54,0.55)" },
};

export function GiftsGrid({
  gifts,
  loading,
  emptyText = "Здесь будут отображаться\nподарки, которые тебе подарили",
  showSender = true,
}: Props) {
  const [selected, setSelected] = useState<MyGift | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <div className="glass-card p-8 flex flex-col items-center gap-3">
        <span className="text-5xl">🎁</span>
        <p className="text-white/60 text-sm text-center whitespace-pre-line">{emptyText}</p>
      </div>
    );
  }

  const selectedDef = selected ? GIFTS.find(g => g.id === selected.gift_id) : null;

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {gifts.map((gift) => {
          const rs = RARITY_COLORS[gift.gift_rarity] || RARITY_COLORS.common;
          const giftDef = GIFTS.find(g => g.id === gift.gift_id);
          const category = (gift.gift_category || giftDef?.category || "heart") as "heart" | "rose" | "bear" | "ring" | "special" | "market";
          const variant = gift.gift_variant ?? giftDef?.variant ?? 0;
          const rarity = (gift.gift_rarity || "common") as "common" | "rare" | "epic" | "legendary";
          const animKey = giftDef?.anim ?? "gift-float";
          const emoji = gift.gift_emoji || giftDef?.emoji;

          return (
            <button
              key={gift.id}
              onClick={() => setSelected(gift)}
              className="flex flex-col items-center gap-1 pt-2.5 pb-2 px-1 rounded-2xl active:scale-95 transition-transform"
              style={{ background: rs.bg, border: `1.5px solid ${rs.border}`, boxShadow: rs.glow }}>
              <GiftItem
                category={category}
                variant={variant}
                animKey={animKey}
                size={44}
                rarity={rarity}
                emoji={emoji}
                marketBadge={false}
              />
              <p className="text-white text-xs font-semibold text-center leading-tight">{gift.gift_name}</p>
              {showSender && gift.sender_name && (
                <p className="text-white/40 text-[10px] text-center">от {gift.sender_name}</p>
              )}
            </button>
          );
        })}
      </div>

      {selected && selectedDef && (
        <GiftDetailModal
          gift={{
            id: selected.gift_id,
            name: selected.gift_name,
            price: selectedDef.price,
            rarity: selected.gift_rarity,
            category: selected.gift_category || selectedDef.category,
            variant: selected.gift_variant ?? selectedDef.variant ?? 0,
            anim: selectedDef.anim,
            emoji: selected.gift_emoji || selectedDef.emoji,
            senderName: selected.sender_name,
            sentAt: selected.created_at,
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

export default GiftsGrid;