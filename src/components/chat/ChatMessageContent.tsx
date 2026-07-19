/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import VoiceMessage from "@/components/chat/VoiceMessage";
import LocationMessage from "@/components/chat/LocationMessage";
import GiftItem from "@/components/gifts/GiftItem";
import { GIFTS, RARITY_STYLE } from "@/components/screens/ProfileGiftSheet";
import { GiftDetailModal } from "@/components/gifts/GiftDetailModal";
import { VanishPhoto, VideoCircleMessage } from "@/components/chat/ChatMediaMessages";
import { GrantPhotoMessage, RequestPhotoMessage } from "@/components/chat/ChatPhotoMessages";

export { CITY_TIMEZONES, getTimezoneByCity } from "@/components/chat/ChatCityTimezones";

// ─── ChatGiftMessage ──────────────────────────────────────────────────────────
function ChatGiftMessage({ text, out }: { text: string; out: boolean }) {
  const [showDetail, setShowDetail] = useState(false);
  const payload = text.slice(8);
  const [giftIdStr, giftName] = payload.split("|");
  const giftId = parseInt(giftIdStr, 10);
  const giftDef = GIFTS.find(g => g.id === giftId);
  const rarity = (giftDef?.rarity ?? "common") as "common" | "rare" | "epic" | "legendary";
  const rs = RARITY_STYLE[rarity];

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className="flex flex-col items-center gap-2 py-3 px-5 min-w-[160px] active:scale-95 transition-transform"
        style={{ background: rs.bg, border: `1.5px solid ${rs.border}`, borderRadius: 20, boxShadow: rs.glow !== "none" ? rs.glow : undefined }}>
        <div className="flex items-center justify-center" style={{ width: 80, height: 80 }}>
          {giftDef ? (
            <GiftItem
              category={giftDef.category as "heart" | "rose" | "bear" | "ring" | "special"}
              variant={giftDef.variant ?? 0}
              animKey={giftDef.anim}
              size={80}
              rarity={rarity}
            />
          ) : (
            <span className="text-5xl">🎁</span>
          )}
        </div>
        {rs.label && <span className="text-[10px] font-bold" style={{ color: rs.text }}>{rs.label}</span>}
        <span className="text-sm font-bold text-white text-center leading-tight">{giftName || "Подарок"}</span>
        <span className="text-[11px] text-white/50">{out ? "Ты отправил подарок" : "Тебе подарили"}</span>
        <span className="text-[10px] text-white/30 mt-0.5">Нажми для подробностей</span>
      </button>

      {showDetail && giftDef && (
        <GiftDetailModal
          gift={{
            id: giftDef.id,
            name: giftDef.name,
            price: giftDef.price,
            rarity: giftDef.rarity,
            category: giftDef.category,
            variant: giftDef.variant ?? 0,
            anim: giftDef.anim,
          }}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

// ─── HeartMessage ─────────────────────────────────────────────────────────────
function HeartMessage() {
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPopped(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-center justify-center py-1 px-2 select-none"
      style={{ minWidth: 72 }}>
      <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
        {/* Пульсирующее свечение */}
        <div className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,45,120,0.35) 0%, transparent 70%)",
            animation: "heartGlow 1.8s ease-in-out infinite",
          }} />
        {/* Частицы */}
        {popped && [0, 51, 103, 154, 205, 257, 308].map((deg, i) => (
          <span key={i} className="absolute rounded-full pointer-events-none"
            style={{
              width: i % 2 === 0 ? 6 : 4,
              height: i % 2 === 0 ? 6 : 4,
              background: i % 3 === 0 ? "#FF2D78" : i % 3 === 1 ? "#FF8FAB" : "#FFB3CC",
              top: "50%", left: "50%",
              transform: `rotate(${deg}deg) translateY(-${28 + (i % 3) * 6}px) translate(-50%, -50%)`,
              animation: "heartParticlePop 0.7s cubic-bezier(0.22,1,0.36,1) forwards",
              animationDelay: `${i * 30}ms`,
            }} />
        ))}
        {/* Само сердце */}
        <span style={{
          fontSize: 48,
          lineHeight: 1,
          display: "block",
          animation: popped
            ? "heartPop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards, heartBeat 1.4s ease-in-out 0.6s infinite"
            : "none",
          filter: "drop-shadow(0 0 12px rgba(255,45,120,0.8)) drop-shadow(0 2px 8px rgba(255,45,120,0.5))",
          transform: popped ? undefined : "scale(0)",
        }}>❤️</span>
      </div>
    </div>
  );
}

// ─── StickerMessage ───────────────────────────────────────────────────────────
function StickerMessage({ url }: { url: string }) {
  const [popped, setPopped] = useState(false);
  useEffect(() => { const t = setTimeout(() => setPopped(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div className="p-1 select-none">
      <img
        src={url}
        alt="sticker"
        className="rounded-2xl transition-all duration-300"
        style={{
          width: 120, height: 120, objectFit: "contain",
          transform: popped ? "scale(1)" : "scale(0.5)",
          opacity: popped ? 1 : 0,
          filter: "drop-shadow(0 4px 16px rgba(255,45,120,0.35))",
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",
        }}
      />
    </div>
  );
}

// ─── renderMsgContent ─────────────────────────────────────────────────────────
export function renderMsgContent(text: string, out: boolean, partnerId?: number, onGrant?: () => void) {
  if (text.startsWith("__STICKER__")) {
    const url = text.slice(11);
    return <StickerMessage url={url} />;
  }
  if (text.startsWith("__VIDEOCIRCLE__")) {
    const url = text.slice(15);
    return <VideoCircleMessage url={url} />;
  }
  if (text.startsWith("__VANISH__")) {
    const url = text.slice(10);
    return <VanishPhoto url={url} out={out} />;
  }
  if (text.startsWith("__LOC__")) {
    const coords = text.slice(7);
    const [lat, lon] = coords.split(",");
    return <LocationMessage lat={lat} lon={lon} />;
  }
  if (text.startsWith("__VCALL__")) {
    const status = text.slice(9);
    const accepted = status === "accepted";
    const missed = status === "missed";
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
        style={{
          background: accepted
            ? "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,197,94,0.08))"
            : missed
              ? "linear-gradient(135deg, rgba(248,113,113,0.12), rgba(239,68,68,0.08))"
              : "linear-gradient(135deg, rgba(99,179,237,0.12), rgba(79,134,247,0.08))",
          border: `1.5px solid ${accepted ? "rgba(74,222,128,0.25)" : missed ? "rgba(248,113,113,0.25)" : "rgba(99,179,237,0.25)"}`,
          minWidth: 180,
        }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: accepted ? "linear-gradient(135deg,#22c55e,#16a34a)" : missed ? "linear-gradient(135deg,#f87171,#ef4444)" : "linear-gradient(135deg,#3b82f6,#6366f1)",
            boxShadow: accepted ? "0 3px 10px rgba(34,197,94,0.4)" : missed ? "0 3px 10px rgba(239,68,68,0.4)" : "0 3px 10px rgba(59,130,246,0.4)",
          }}>
          <Icon name={missed ? "PhoneMissed" : "Video"} size={16} className="text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-[13px] font-semibold">
            {missed ? (out ? "Пропущенный звонок" : "Пропущенный видеозвонок") : "Видеозвонок"}
          </span>
          <span className="text-[11px]" style={{ color: accepted ? "rgba(74,222,128,0.8)" : missed ? "rgba(248,113,113,0.8)" : "rgba(99,179,237,0.8)" }}>
            {accepted ? "Звонок принят ✓" : missed ? (out ? "Собеседник не ответил" : "Вы пропустили звонок") : "Входящий запрос 📹"}
          </span>
        </div>
      </div>
    );
  }
  if (text.startsWith("__AWARD__")) {
    const emoji = text.slice(9);
    return (
      <div className="flex flex-col items-center gap-1 py-1 px-3">
        <span className="text-4xl">{emoji}</span>
        <span className="text-xs text-white/60">{out ? "Ты отправил награду" : "Тебе вручена награда!"}</span>
      </div>
    );
  }
  if (text === "__GRANT_PHOTO__") {
    return <GrantPhotoMessage out={out} partnerId={partnerId ?? 0} />;
  }
  if (text === "__GEO_DENIED__" || text === "_GEO_DENIED_" || text.toUpperCase().includes("GEO_DENIED")) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(234,179,8,0.12), rgba(202,138,4,0.08))",
          border: "1.5px solid rgba(234,179,8,0.25)",
          minWidth: 200,
        }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.35)" }}>
          <Icon name="MapPinOff" size={16} className="text-yellow-400" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-[13px] font-semibold">Геолокация недоступна</span>
          <span className="text-[11px] text-yellow-400/70">Разреши доступ в настройках</span>
        </div>
      </div>
    );
  }
  if (text.startsWith("__AUDIO__")) {
    const url = text.slice(9);
    return <VoiceMessage url={url} out={out} />;
  }
  if (text === "__REQUEST_PHOTO__") {
    return <RequestPhotoMessage out={out} onGrant={onGrant} partnerId={partnerId} />;
  }
  if (text.startsWith("__GIFT__")) {
    return <ChatGiftMessage text={text} out={out} />;
  }
  if (text.startsWith("__PREMIUM__")) {
    const payload = text.slice(11); // "1 месяц|31.12.2026"
    const [planLabel, until] = payload.split("|");
    return (
      <div className="flex flex-col items-center gap-3 py-4 px-5 select-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,45,120,0.12) 0%, rgba(155,89,182,0.15) 50%, rgba(252,211,77,0.08) 100%)",
          border: "1.5px solid rgba(255,45,120,0.3)",
          borderRadius: 20,
          minWidth: 220,
          maxWidth: 280,
          boxShadow: "0 4px 24px rgba(255,45,120,0.2)",
        }}>
        {/* Иконка */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 16px rgba(255,45,120,0.5)" }}>
          <span style={{ fontSize: 28 }}>✨</span>
        </div>
        {/* Текст */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-white font-black text-base tracking-wide">Полутон Premium</span>
          <span className="text-white/60 text-xs font-semibold">активирован на {planLabel}</span>
          {until && (
            <span className="text-white/35 text-[11px]">активен до {until}</span>
          )}
        </div>
        {/* Фичи */}
        <div className="flex flex-col gap-1 w-full">
          {["Безлимитные лайки", "Приоритет в поиске", "Инкогнито-режим"].map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#FF2D78,#FCD34D)" }}>
                <Icon name="Check" size={9} className="text-white" />
              </div>
              <span className="text-white/55 text-[11px]">{f}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (text.startsWith("__BOOST__")) {
    const payload = text.slice(9); // "promote|31.12.2026 15:30" или "super|..."
    const [boostType, until] = payload.split("|");
    const isSuper = boostType === "super";
    return (
      <div className="flex flex-col items-center gap-3 py-4 px-5 select-none"
        style={{
          background: isSuper
            ? "linear-gradient(135deg, rgba(155,89,182,0.15) 0%, rgba(255,45,120,0.12) 100%)"
            : "linear-gradient(135deg, rgba(255,45,120,0.12) 0%, rgba(255,107,53,0.1) 100%)",
          border: `1.5px solid ${isSuper ? "rgba(155,89,182,0.35)" : "rgba(255,45,120,0.3)"}`,
          borderRadius: 20,
          minWidth: 220,
          maxWidth: 280,
          boxShadow: isSuper ? "0 4px 24px rgba(155,89,182,0.2)" : "0 4px 24px rgba(255,45,120,0.2)",
        }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isSuper ? "linear-gradient(135deg,#9B59B6,#FF2D78)" : "linear-gradient(135deg,#FF2D78,#FF6B35)",
            boxShadow: isSuper ? "0 4px 16px rgba(155,89,182,0.5)" : "0 4px 16px rgba(255,45,120,0.5)",
          }}>
          <span style={{ fontSize: 28 }}>{isSuper ? "⭐" : "🚀"}</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-white font-black text-base tracking-wide">
            {isSuper ? "Супер подъём" : "Продвижение профиля"}
          </span>
          <span className="text-white/60 text-xs font-semibold">
            {isSuper ? "Максимальная видимость активирована" : "Профиль поднят в поиске"}
          </span>
          {until && (
            <span className="text-white/35 text-[11px]">активен до {until}</span>
          )}
        </div>
        <div className="flex flex-col gap-1 w-full">
          {(isSuper
            ? ["Приоритет в поиске", "Фильтры по аудитории", "Максимум показов"]
            : ["Подъём в ближайшей сетке", "Больше просмотров профиля", "Новые знакомства"]
          ).map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: isSuper ? "linear-gradient(135deg,#9B59B6,#FF2D78)" : "linear-gradient(135deg,#FF2D78,#FF6B35)" }}>
                <Icon name="Check" size={9} className="text-white" />
              </div>
              <span className="text-white/55 text-[11px]">{f}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (text.startsWith("__GIFT_BOT__")) {
    const payload = text.slice(12); // "emoji|name"
    const [emoji, name] = payload.split("|");
    return (
      <div className="flex flex-col items-center gap-3 py-4 px-5 select-none"
        style={{
          background: "linear-gradient(135deg, rgba(252,211,77,0.12) 0%, rgba(255,45,120,0.1) 100%)",
          border: "1.5px solid rgba(252,211,77,0.3)",
          borderRadius: 20,
          minWidth: 220,
          maxWidth: 280,
          boxShadow: "0 4px 24px rgba(252,211,77,0.15)",
        }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#FCD34D,#F59E0B)", boxShadow: "0 4px 16px rgba(252,211,77,0.5)" }}>
          <span style={{ fontSize: 32 }}>{emoji || "🎁"}</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-white font-black text-base tracking-wide">Подарок отправлен!</span>
          <span className="text-white/60 text-xs font-semibold">{name || "Подарок"}</span>
          <span className="text-white/35 text-[11px]">появится в профиле получателя</span>
        </div>
      </div>
    );
  }
  if (text === "❤️") {
    return <HeartMessage />;
  }
  return <span>{text}</span>;
}