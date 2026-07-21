/* eslint-disable react-refresh/only-export-components */
import Icon from "@/components/ui/icon";
import { useBackHandler } from "@/hooks/backStack";

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
  /* ─── Особые (анимированные, в стиле Telegram) ─── */
  { id: 33, name: "Крутой Пёс",      emoji: "🐶", price: 990,   anim: "gift-animated",       rarity: "common",    category: "special", variant: 0 },
  { id: 34, name: "Милый Кот",       emoji: "🐱", price: 990,   anim: "gift-animated",       rarity: "common",    category: "special", variant: 1 },
  { id: 35, name: "Кролик",          emoji: "🐰", price: 1490,  anim: "gift-animated",       rarity: "rare",      category: "special", variant: 2 },
  { id: 36, name: "Ракета",         emoji: "🚀", price: 2990,  anim: "gift-animated",       rarity: "rare",      category: "special", variant: 3 },
  { id: 37, name: "Единорог",       emoji: "🦄", price: 4990,  anim: "gift-animated",       rarity: "epic",      category: "special", variant: 4 },
  { id: 38, name: "Звезда удачи",   emoji: "⭐", price: 6990,  anim: "gift-animated",       rarity: "epic",      category: "special", variant: 5 },
  { id: 39, name: "Королевская корона", emoji: "👑", price: 14990, anim: "gift-animated",   rarity: "legendary", category: "special", variant: 6 },
  { id: 40, name: "Дракон",         emoji: "🐉", price: 29990, anim: "gift-animated",       rarity: "legendary", category: "special", variant: 7 },
  /* ─── Маркет (эмодзи-подарки, как в Telegram) ─── */
  { id: 101, name: "Мишка",          emoji: "🧸", price: 50,   anim: "gift-float",   rarity: "common", category: "market", variant: 0, market: true },
  { id: 102, name: "Сердце с бантом", emoji: "💝", price: 15,   anim: "gift-pulse",   rarity: "common", category: "market", variant: 0, market: true },
  { id: 103, name: "Подарок",        emoji: "🎁", price: 25,   anim: "gift-float",   rarity: "common", category: "market", variant: 0, market: true },
  { id: 104, name: "Роза",           emoji: "🌹", price: 25,   anim: "gift-float",   rarity: "common", category: "market", variant: 0, market: true },
  { id: 105, name: "Торт",           emoji: "🎂", price: 50,   anim: "gift-float",   rarity: "common", category: "market", variant: 0, market: true },
  { id: 106, name: "Букет",          emoji: "💐", price: 50,   anim: "gift-float",   rarity: "common", category: "market", variant: 0, market: true },
  { id: 107, name: "Ракета",         emoji: "🚀", price: 50,   anim: "gift-float",   rarity: "common", category: "market", variant: 0, market: true },
  { id: 108, name: "Кубок",          emoji: "🏆", price: 100,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 109, name: "Кольцо",         emoji: "💍", price: 100,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 110, name: "Алмаз",          emoji: "💎", price: 100,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 111, name: "Шампанское",     emoji: "🍾", price: 50,   anim: "gift-float",   rarity: "common", category: "market", variant: 0, market: true },
  { id: 112, name: "Факел",          emoji: "🔥", price: 385,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 113, name: "Мороженое",      emoji: "🍦", price: 399,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 114, name: "Статуя Свободы", emoji: "🗽", price: 525,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 115, name: "Пёсик",          emoji: "🐕", price: 650,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 116, name: "Лапша",          emoji: "🍜", price: 379,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 117, name: "Фламинго",       emoji: "🦩", price: 370,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 118, name: "Эскимо",         emoji: "🍫", price: 375,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 119, name: "Леденец",        emoji: "🍭", price: 409,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 120, name: "Рюкзак",         emoji: "🎒", price: 495,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 121, name: "Какашка",        emoji: "💩", price: 500,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 122, name: "Клевер",         emoji: "🍀", price: 555,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 123, name: "8 Марта",        emoji: "🌷", price: 408,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 124, name: "Носок",          emoji: "🧦", price: 369,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 125, name: "Снеговик",       emoji: "⛄", price: 355,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 126, name: "Леденец-трость", emoji: "🍬", price: 375,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 127, name: "Полумесяц",      emoji: "🕌", price: 600,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 128, name: "Торт с вишней",  emoji: "🍰", price: 550,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 129, name: "Пряник-сердце",  emoji: "🫀", price: 500,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 130, name: "С Днём Рождения", emoji: "🎉", price: 600,  anim: "gift-float",  rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 131, name: "Бенгальский огонь", emoji: "🎇", price: 489, anim: "gift-float", rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 132, name: "Змейка",         emoji: "🐍", price: 390,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 133, name: "Колпак шута",    emoji: "🎭", price: 484,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 134, name: "Книга магии",    emoji: "📕", price: 540,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 135, name: "Пасхальная корзина", emoji: "🧺", price: 600, anim: "gift-float", rarity: "epic",  category: "market", variant: 0, market: true },
  { id: 136, name: "Букет денег",    emoji: "💰", price: 522,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 137, name: "Медаль",         emoji: "🥇", price: 500,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 138, name: "Лайк",           emoji: "❤️", price: 625,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 139, name: "Тортик",         emoji: "🍰", price: 626,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 140, name: "Меч джедая",     emoji: "⚔️", price: 650,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 141, name: "Пряничный человечек", emoji: "🍪", price: 484, anim: "gift-float", rarity: "epic", category: "market", variant: 0, market: true },
  { id: 142, name: "Ожерелье",       emoji: "📿", price: 666,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 143, name: "Календарь",      emoji: "📅", price: 615,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 144, name: "Банка сердец",   emoji: "🫙", price: 575,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 145, name: "Пионы",          emoji: "🌸", price: 674,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 146, name: "Обезьянка",      emoji: "🐵", price: 674,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 147, name: "Тамагочи",       emoji: "🎮", price: 390,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 148, name: "Какао",          emoji: "☕", price: 399,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 149, name: "Мухомор",        emoji: "🍄", price: 625,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 150, name: "Глинтвейн",      emoji: "🍷", price: 460,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 151, name: "Горшок с золотом", emoji: "🪙", price: 485, anim: "gift-float",  rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 152, name: "Глаз",           emoji: "👁️", price: 674,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 153, name: "Сакура",         emoji: "🌸", price: 817,  anim: "gift-float",   rarity: "legendary", category: "market", variant: 0, market: true },
  { id: 154, name: "Пасхальное яйцо", emoji: "🥚", price: 427, anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 155, name: "Дневник",        emoji: "📔", price: 487,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 156, name: "Венок",          emoji: "🎄", price: 376,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
  { id: 157, name: "Шкатулка",       emoji: "🎁", price: 438,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 158, name: "Бабочка",        emoji: "🎀", price: 560,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 159, name: "Шляпа мага",     emoji: "🎩", price: 600,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 160, name: "Клубника в шоколаде", emoji: "🍓", price: 769, anim: "gift-float", rarity: "legendary", category: "market", variant: 0, market: true },
  { id: 161, name: "Капкейк",        emoji: "🧁", price: 674,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 162, name: "Конфеты",        emoji: "🍫", price: 956,  anim: "gift-float",   rarity: "legendary", category: "market", variant: 0, market: true },
  { id: 163, name: "Зелье",          emoji: "🧪", price: 490,  anim: "gift-float",   rarity: "epic",   category: "market", variant: 0, market: true },
  { id: 164, name: "Колпак Санты",   emoji: "🎅", price: 400,  anim: "gift-float",   rarity: "rare",   category: "market", variant: 0, market: true },
];

const CATEGORIES = [
  { id: "market",  label: "Маркет",     emoji: "🛍️" },
  { id: "special", label: "Особые",     emoji: "✨" },
  { id: "heart",   label: "Сердца",     emoji: "❤️" },
  { id: "rose",    label: "Розы",       emoji: "🌹" },
  { id: "bear",    label: "Мишки",      emoji: "🧸" },
  { id: "ring",    label: "Кольца",     emoji: "💍" },
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
  const [activeCategory, setActiveCategory] = useState("special");
  const filtered = GIFTS.filter(g => g.category === activeCategory);

  useBackHandler(true, onClose);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--spark-dark, #0f0a1a)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pb-3 flex-shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Icon name="ArrowLeft" size={18} className="text-white/80" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-lg leading-tight">Подарить {recipientName}</p>
            <p className="text-white/40 text-xs mt-0.5">Выберите подарок</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar flex-shrink-0">
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl flex-shrink-0 transition-all text-sm font-semibold active:scale-95 ${activeCategory === cat.id ? "text-white" : "text-white/50"}`}
              style={activeCategory === cat.id
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                : { background: "rgba(255,255,255,0.07)" }}>
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
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
                  <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"|"special"|"market"} variant={gift.variant ?? 0} animKey={gift.anim} size={52} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} selected={sel} emoji={gift.emoji} />
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
                <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"|"special"|"market"} variant={gift.variant ?? 0} animKey={gift.anim} size={56} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} emoji={gift.emoji} marketBadge={false} />
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
  );
}