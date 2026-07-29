import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { matchesApi, profilesApi, messagesApi, gamificationApi, type Match, type Profile } from "@/lib/api";
import { GIFTS, RARITY_STYLE, PAY_CREATE_URL, isCoinGift, giftCoins } from "@/components/screens/ProfileGiftSheet";
import GiftItem from "@/components/gifts/GiftItem";
import { useYookassa } from "@/components/extensions/yookassa/useYookassa";
import { DEFAULT_AVATAR } from "@/components/ui/UserAvatar";

interface Props {
  giftPreview: number;
  giftDone: number | null;
  setGiftDone: (id: number | null) => void;
  onClose: () => void;
  currentUserId: number;
}

export function HomeGiftPreview({ giftPreview, giftDone, setGiftDone, onClose, currentUserId }: Props) {
  const { pay: payGift, loading: giftPaying } = useYookassa(PAY_CREATE_URL);
  const [giftRecipient, setGiftRecipient] = useState<"self" | "user">("self");
  const [chatMatches, setChatMatches] = useState<Match[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: number; name: string; photo_url?: string; match_id?: number } | null>(null);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const [coinBuying, setCoinBuying] = useState(false);
  const [coinError, setCoinError] = useState("");

  useEffect(() => {
    gamificationApi.state().then(s => setCoinBalance(s?.coins ?? 0)).catch(() => setCoinBalance(0));
  }, []);

  // Загружаем чаты при открытии превью с режимом "user"
  useEffect(() => {
    if (giftRecipient === "user" && chatMatches.length === 0) {
      matchesApi.getAll().then(d => setChatMatches(d.matches)).catch(() => {});
    }
  }, [giftRecipient, chatMatches.length]);

  // Поиск пользователей по нику
  useEffect(() => {
    if (giftRecipient !== "user" || !userSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const q = userSearch.trim();
    if (q.length < 2) return;
    setSearching(true);
    const t = setTimeout(() => {
      profilesApi.getDiscover({ search: q })
        .then(d => setSearchResults(d.profiles.slice(0, 8)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [userSearch, giftRecipient]);

  // Сбрасываем выбранного при переключении на "себе"
  useEffect(() => {
    if (giftRecipient === "self") {
      setSelectedRecipient(null);
      setUserSearch("");
      setSearchResults([]);
    }
  }, [giftRecipient]);

  const gift = GIFTS.find(g => g.id === giftPreview)!;
  const rs = RARITY_STYLE[gift.rarity];
  const coinGift = isCoinGift(gift);
  const coinCost = giftCoins(gift);
  const notEnough = coinGift && (coinBalance ?? 0) < coinCost;

  const handleCoinBuy = async () => {
    const isUser = giftRecipient === "user" && selectedRecipient;
    const recipientId = isUser ? selectedRecipient!.id : currentUserId;
    if (coinBuying) return;
    if (notEnough) {
      setCoinError(`Не хватает монет: нужно ${coinCost}, у тебя ${coinBalance ?? 0}. Выполняй задания!`);
      return;
    }
    setCoinBuying(true); setCoinError("");
    try {
      const r = await gamificationApi.buyGift({
        recipient_id: recipientId,
        gift_id: gift.id,
        ruble_price: gift.price,
        gift_name: gift.name,
        gift_emoji: gift.emoji,
        gift_category: gift.category,
        gift_variant: gift.variant ?? 0,
        gift_rarity: gift.rarity,
      });
      if (r.ok) {
        setCoinBalance(r.coins ?? null);
        setGiftDone(giftPreview);
        if (isUser) {
          const giftMsg = `__GIFT__${gift.id}|${gift.name}|${gift.emoji}`;
          try {
            if (selectedRecipient!.match_id) await messagesApi.send(selectedRecipient!.match_id, giftMsg);
            else await messagesApi.sendDirect(selectedRecipient!.id, giftMsg);
          } catch (e) { void e; }
        }
      } else {
        setCoinError(r.error || "Не удалось отправить подарок");
      }
    } catch {
      setCoinError("Ошибка сети. Попробуй ещё раз.");
    } finally { setCoinBuying(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={onClose}>
      <div className="w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-4 animate-scale-in"
        style={{ background: "var(--spark-card)", border: `1px solid ${rs.border}`, boxShadow: `0 0 40px ${rs.border}` }}
        onClick={e => e.stopPropagation()}>
        <div className="w-36 h-36 flex items-center justify-center">
          <GiftItem category={gift.category as "heart"|"rose"|"bear"|"ring"|"special"|"market"} variant={gift.variant ?? 0} animKey={gift.anim} size={144} rarity={gift.rarity as "common"|"rare"|"epic"|"legendary"} emoji={gift.emoji} marketBadge={false} />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-xl">{gift.name}</p>
          {rs.label && <p className="text-sm font-bold mt-1" style={{ color: rs.text }}>{rs.label}</p>}
          {coinGift ? (
            <p className="text-sm mt-1 flex items-center justify-center gap-1 font-bold" style={{ color: "#FFC800" }}>
              <Icon name="Coins" size={13} style={{ color: "#FFC800" }} />
              {coinCost.toLocaleString("ru")} монет
            </p>
          ) : (
            <p className="text-white/40 text-sm mt-1">{gift.price.toLocaleString("ru")} ₽</p>
          )}
          {coinGift && coinBalance !== null && (
            <button
              onClick={() => { onClose(); window.dispatchEvent(new Event("app:navigate-tasks")); }}
              className="text-white/30 text-xs mt-0.5 inline-flex items-center gap-1 active:scale-95 transition-transform">
              У тебя {coinBalance.toLocaleString("ru")} монет
              <span className="font-semibold" style={{ color: "#FFC800" }}>· заработать</span>
            </button>
          )}
        </div>

        {/* Выбор получателя */}
        <div className="w-full rounded-2xl overflow-hidden flex"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <button onClick={() => setGiftRecipient("self")}
            className="flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{ background: giftRecipient === "self" ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "transparent", color: giftRecipient === "self" ? "white" : "rgba(255,255,255,0.45)" }}>
            <Icon name="User" size={14} />Себе
          </button>
          <button onClick={() => setGiftRecipient("user")}
            className="flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{ background: giftRecipient === "user" ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "transparent", color: giftRecipient === "user" ? "white" : "rgba(255,255,255,0.45)", borderLeft: "1px solid rgba(255,255,255,0.12)" }}>
            <Icon name="Heart" size={14} />Пользователю
          </button>
        </div>

        {giftRecipient === "user" && (
          <div className="w-full flex flex-col gap-2">
            {selectedRecipient ? (
              <div className="w-full rounded-2xl px-3 py-2.5 flex items-center gap-3"
                style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.35)" }}>
                <img src={selectedRecipient.photo_url || DEFAULT_AVATAR} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{selectedRecipient.name}</p>
                  <p className="text-white/40 text-xs">Получатель подарка</p>
                </div>
                <button onClick={() => setSelectedRecipient(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon name="X" size={14} className="text-white/70" />
                </button>
              </div>
            ) : (
              <>
                {/* Поиск по нику */}
                <div className="w-full relative">
                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Поиск по нику..."
                    className="w-full rounded-2xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>

                {/* Результаты поиска */}
                {userSearch.trim().length >= 2 && (
                  <div className="w-full max-h-40 overflow-y-auto rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {searching ? (
                      <div className="flex items-center justify-center py-3 text-white/40 text-xs gap-2">
                        <Icon name="Loader2" size={12} className="animate-spin" />Поиск...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center py-3 text-white/40 text-xs">Никого не найдено</div>
                    ) : (
                      searchResults.map(p => (
                        <button key={p.id}
                          onClick={() => setSelectedRecipient({ id: p.id, name: p.name, photo_url: p.photo_url })}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors">
                          <img src={p.photo_url || DEFAULT_AVATAR} className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-white text-sm truncate flex-1 text-left">{p.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Список из чатов */}
                {userSearch.trim().length < 2 && (
                  <div className="w-full">
                    <p className="text-white/40 text-xs px-1 pb-1.5 font-semibold">ИЗ ЧАТОВ</p>
                    {chatMatches.length === 0 ? (
                      <div className="text-center py-3 text-white/30 text-xs rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        Нет активных чатов
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {chatMatches.map(m => (
                          <button key={m.match_id}
                            onClick={() => setSelectedRecipient({ id: m.partner_id, name: m.name, photo_url: m.photo_url, match_id: m.match_id })}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors">
                            <img src={m.photo_url || DEFAULT_AVATAR} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-white text-sm truncate flex-1 text-left">{m.name}</span>
                            {m.online && <span className="w-2 h-2 rounded-full bg-green-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {coinError && <p className="text-red-400 text-xs font-medium w-full text-center">{coinError}</p>}

        {giftDone === giftPreview ? (
          <div className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}>
            <Icon name="Check" size={16} className="text-green-400" />
            <span className="text-green-400 font-semibold">Подарок отправлен!</span>
          </div>
        ) : coinGift && notEnough ? (
          <button
            onClick={() => { onClose(); window.dispatchEvent(new Event("app:navigate-tasks")); }}
            className="w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: "rgba(255,200,0,0.16)", color: "#FFC800", border: "1px solid rgba(255,200,0,0.4)" }}>
            <Icon name="Sparkles" size={16} style={{ color: "#FFC800" }} />Как заработать монеты
          </button>
        ) : coinGift ? (
          <button
            disabled={coinBuying || (giftRecipient === "user" && !selectedRecipient)}
            onClick={handleCoinBuy}
            className="w-full btn-grad py-3.5 font-bold text-white rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
            {coinBuying
              ? <><Icon name="Loader2" size={16} className="animate-spin" />Отправляю...</>
              : giftRecipient === "user" && !selectedRecipient
                ? <><Icon name="UserPlus" size={16} />Выберите получателя</>
                : <><Icon name="Coins" size={16} />Подарить за {coinCost.toLocaleString("ru")}</>}
          </button>
        ) : (
          <button
            disabled={giftPaying || (giftRecipient === "user" && !selectedRecipient)}
            onClick={async () => {
              const isUser = giftRecipient === "user" && selectedRecipient;
              const senderToken = localStorage.getItem("spark_token") || "";
              const r = await payGift({
                amount: gift.price,
                description: isUser
                  ? `Подарок «${gift.name}» для ${selectedRecipient!.name}`
                  : `Подарок себе «${gift.name}»`,
                returnUrl: window.location.origin + "/?payment=success",
                metadata: {
                  kind: "gift",
                  gift_id: String(gift.id),
                  gift_name: gift.name,
                  gift_emoji: gift.emoji,
                  gift_category: gift.category,
                  gift_variant: String(gift.variant),
                  gift_rarity: gift.rarity,
                  recipient_id: String(isUser ? selectedRecipient!.id : currentUserId),
                  sender_token: senderToken,
                },
              });
              if (r?.paymentUrl) {
                setGiftDone(giftPreview);
                // Отправляем подарок в чат
                if (isUser) {
                  const giftMsg = `__GIFT__${gift.id}|${gift.name}|${gift.emoji}`;
                  try {
                    if (selectedRecipient!.match_id) {
                      await messagesApi.send(selectedRecipient!.match_id, giftMsg);
                    } else {
                      await messagesApi.sendDirect(selectedRecipient!.id, giftMsg);
                    }
                  } catch (e) { void e; }
                }
              }
            }}
            className="w-full btn-grad py-3.5 font-bold text-white rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
            {giftPaying
              ? <><Icon name="Loader2" size={16} className="animate-spin" />Обработка...</>
              : giftRecipient === "user" && !selectedRecipient
                ? <><Icon name="UserPlus" size={16} />Выберите получателя</>
                : giftRecipient === "user"
                  ? <><Icon name="Gift" size={16} />Подарить за {gift.price.toLocaleString("ru")} ₽</>
                  : <><Icon name="ShoppingBag" size={16} />Купить за {gift.price.toLocaleString("ru")} ₽</>}
          </button>
        )}
        <button onClick={onClose} className="text-white/30 text-sm">Закрыть</button>
      </div>
    </div>
  );
}

export default HomeGiftPreview;