import { type MyGift } from "@/lib/api";

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

  return (
    <div className="grid grid-cols-3 gap-2">
      {gifts.map((gift) => {
        const rs = RARITY_COLORS[gift.gift_rarity] || RARITY_COLORS.common;
        return (
          <div key={gift.id}
            className="flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-1 rounded-2xl"
            style={{ background: rs.bg, border: `1.5px solid ${rs.border}`, boxShadow: rs.glow }}>
            <span className="text-3xl">{gift.gift_emoji}</span>
            <p className="text-white text-xs font-semibold text-center leading-tight">{gift.gift_name}</p>
            {showSender && gift.sender_name && (
              <p className="text-white/40 text-[10px] text-center">от {gift.sender_name}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default GiftsGrid;
