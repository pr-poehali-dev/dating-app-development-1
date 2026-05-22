import Icon from "@/components/ui/icon";

export const GIFTS = [
  /* ─── Сердца ─── */
  { id: 1,  name: "Сердечко",        emoji: "🩷", price: 49,    anim: "gift-float",      rarity: "common",    category: "heart", variant: 0 },
  { id: 2,  name: "Большое сердце",  emoji: "❤️", price: 149,   anim: "gift-pulse",      rarity: "common",    category: "heart", variant: 1 },
  { id: 3,  name: "Горящее сердце",  emoji: "❤️‍🔥", price: 299,   anim: "gift-shake",      rarity: "rare",      category: "heart", variant: 2 },
  { id: 4,  name: "Золотое сердце",  emoji: "🧡", price: 599,   anim: "gift-spin",       rarity: "rare",      category: "heart", variant: 3 },
  { id: 5,  name: "Алмазное сердце", emoji: "💙", price: 999,   anim: "gift-sparkle",    rarity: "epic",      category: "heart", variant: 4 },
  { id: 6,  name: "Вечное сердце",   emoji: "💜", price: 1990,  anim: "gift-glow",       rarity: "epic",      category: "heart", variant: 5 },
  { id: 7,  name: "Редкое сердце",   emoji: "🖤", price: 4990,  anim: "gift-orbit",      rarity: "legendary", category: "heart", variant: 6 },
  { id: 8,  name: "Легендарное",     emoji: "💖", price: 9990,  anim: "gift-rainbow",    rarity: "legendary", category: "heart", variant: 7 },
  /* ─── Розы ─── */
  { id: 9,  name: "Роза",            emoji: "🌹", price: 99,    anim: "gift-3d-rose",      rarity: "common",    category: "rose", variant: 0 },
  { id: 10, name: "Две розы",        emoji: "🌷", price: 199,   anim: "gift-float",        rarity: "common",    category: "rose", variant: 1 },
  { id: 11, name: "Букет роз",       emoji: "💐", price: 399,   anim: "gift-3d-rose",      rarity: "rare",      category: "rose", variant: 2 },
  { id: 12, name: "Алая роза",       emoji: "🌺", price: 699,   anim: "gift-pulse",        rarity: "rare",      category: "rose", variant: 3 },
  { id: 13, name: "Золотая роза",    emoji: "🌸", price: 1290,  anim: "gift-3d-rose-epic", rarity: "epic",      category: "rose", variant: 4 },
  { id: 14, name: "Вечная роза",     emoji: "🪷", price: 2490,  anim: "gift-sparkle",      rarity: "epic",      category: "rose", variant: 5 },
  { id: 15, name: "Роза в хрустале", emoji: "🌹", price: 5990,  anim: "gift-rainbow",      rarity: "legendary", category: "rose", variant: 6 },
  { id: 16, name: "Роза легенды",    emoji: "💮", price: 11990, anim: "gift-3d-rose-epic", rarity: "legendary", category: "rose", variant: 7 },
  /* ─── Медвежонки ─── */
  { id: 17, name: "Мишка",           emoji: "🐻", price: 149,   anim: "gift-3d-bear",      rarity: "common",    category: "bear", variant: 0 },
  { id: 18, name: "Мишка Тедди",     emoji: "🧸", price: 290,   anim: "gift-float",        rarity: "common",    category: "bear", variant: 1 },
  { id: 19, name: "Мишка с сердцем", emoji: "🐻‍❄️", price: 490,   anim: "gift-3d-bear",      rarity: "rare",      category: "bear", variant: 2 },
  { id: 20, name: "Панда",           emoji: "🐼", price: 890,   anim: "gift-pulse",        rarity: "rare",      category: "bear", variant: 3 },
  { id: 21, name: "Мишка Эпик",      emoji: "🧸", price: 1690,  anim: "gift-3d-bear-glow", rarity: "epic",      category: "bear", variant: 4 },
  { id: 22, name: "Золотой мишка",   emoji: "🐻", price: 3490,  anim: "gift-glow",         rarity: "epic",      category: "bear", variant: 5 },
  { id: 23, name: "Мишка легенды",   emoji: "🐼", price: 6990,  anim: "gift-3d-bear-glow", rarity: "legendary", category: "bear", variant: 6 },
  { id: 24, name: "Мишка навсегда",  emoji: "🧸", price: 12990, anim: "gift-rainbow",      rarity: "legendary", category: "bear", variant: 7 },
  /* ─── Кольца ─── */
  { id: 25, name: "Кольцо",          emoji: "💍", price: 199,   anim: "gift-3d-ring",        rarity: "common",    category: "ring", variant: 0 },
  { id: 26, name: "Серебряное",      emoji: "🪬", price: 490,   anim: "gift-spin",           rarity: "common",    category: "ring", variant: 1 },
  { id: 27, name: "Золотое кольцо",  emoji: "💛", price: 990,   anim: "gift-3d-ring",        rarity: "rare",      category: "ring", variant: 2 },
  { id: 28, name: "С рубином",       emoji: "♦️", price: 1990,  anim: "gift-sparkle",        rarity: "rare",      category: "ring", variant: 3 },
  { id: 29, name: "Бриллиант",       emoji: "💎", price: 3990,  anim: "gift-3d-ring-legend", rarity: "epic",      category: "ring", variant: 4 },
  { id: 30, name: "Кольцо Эпик",     emoji: "💍", price: 7490,  anim: "gift-3d-ring",        rarity: "epic",      category: "ring", variant: 5 },
  { id: 31, name: "Кольцо Вечности", emoji: "💎", price: 14990, anim: "gift-3d-ring-legend", rarity: "legendary", category: "ring", variant: 6 },
  { id: 32, name: "Кольцо богов",    emoji: "✨", price: 24990, anim: "gift-rainbow",        rarity: "legendary", category: "ring", variant: 7 },
];

const CATEGORIES = [
  { id: "heart", label: "Сердца",     emoji: "❤️" },
  { id: "rose",  label: "Розы",       emoji: "🌹" },
  { id: "bear",  label: "Мишки",      emoji: "🧸" },
  { id: "ring",  label: "Кольца",     emoji: "💍" },
];

export const RARITY_STYLE: Record<string, { label: string; border: string; bg: string; text: string; glow: string }> = {
  common:    { label: "",            border: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.04)", text: "",         glow: "none" },
  rare:      { label: "Редкий",      border: "rgba(99,179,237,0.4)",   bg: "rgba(99,179,237,0.07)",  text: "#63B3ED",  glow: "0 0 18px rgba(99,179,237,0.35)" },
  epic:      { label: "Эпический",   border: "rgba(159,122,234,0.5)",  bg: "rgba(159,122,234,0.08)", text: "#9F7AEA",  glow: "0 0 22px rgba(159,122,234,0.45)" },
  legendary: { label: "Легенда",     border: "rgba(237,137,54,0.6)",   bg: "rgba(237,137,54,0.1)",   text: "#ED8936",  glow: "0 0 28px rgba(237,137,54,0.55)" },
};

export const PAY_CREATE_URL = "https://functions.poehali.dev/d866e377-6dac-43c2-a709-799c346ac3ef";

import { useState } from "react";
import GiftItem from "@/components/gifts/GiftItem";

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
  const [activeCategory, setActiveCategory] = useState("heart");
  const filtered = GIFTS.filter(g => g.category === activeCategory);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}>
      <div className="rounded-t-3xl flex flex-col max-h-[86dvh]"
        style={{ background: "var(--spark-card)", border: "1px solid var(--spark-divider)" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <div>
            <p className="text-white font-bold text-lg">Подарить {recipientName}</p>
            <p className="text-white/40 text-xs mt-0.5">Выберите подарок</p>
          </div>
          <button onClick={onClose} className="text-white/40">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl flex-shrink-0 transition-all text-sm font-semibold active:scale-95"
              style={activeCategory === cat.id
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-4 pb-6">
          {/* Gift grid */}
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            {filtered.map((gift) => {
              const rs = RARITY_STYLE[gift.rarity];
              const sel = giftSelected === gift.id;
              return (
                <button key={gift.id} onClick={() => onSelectGift(gift.id)}
                  className="flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-1 rounded-2xl transition-all active:scale-90 relative overflow-hidden"
                  style={{
                    background: sel ? rs.bg : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${sel ? rs.border : "rgba(255,255,255,0.08)"}`,
                    boxShadow: sel ? rs.glow : "none",
                  }}>
                  {rs.label && (
                    <span className="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded-md leading-none"
                      style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}>
                      {rs.label}
                    </span>
                  )}
                  <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"} variant={gift.variant ?? 0} animKey={gift.anim} size={52} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} selected={sel} />
                  <p className="text-white/90 text-[10px] font-semibold leading-tight text-center line-clamp-2 w-full px-0.5">
                    {gift.name}
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                    {gift.price.toLocaleString("ru")} ₽
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected gift detail */}
          {giftSelected !== null && (() => {
            const gift = GIFTS.find(g => g.id === giftSelected)!;
            const rs = RARITY_STYLE[gift.rarity];
            return (
              <div className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: rs.bg || "rgba(255,200,0,0.06)", border: `1.5px solid ${rs.border || "rgba(255,200,0,0.2)"}`, boxShadow: rs.glow }}>
                <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"} variant={gift.variant ?? 0} animKey={gift.anim} size={56} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{gift.name}</p>
                  {rs.label && <p className="text-xs font-bold" style={{ color: rs.text }}>{rs.label}</p>}
                  <p className="text-white/40 text-xs">{gift.price.toLocaleString("ru")} ₽ для {recipientName}</p>
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