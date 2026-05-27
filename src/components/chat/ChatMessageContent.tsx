import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi } from "@/lib/api";
import VoiceMessage from "@/components/chat/VoiceMessage";
import LocationMessage from "@/components/chat/LocationMessage";
import GiftItem from "@/components/gifts/GiftItem";
import { GIFTS, RARITY_STYLE } from "@/components/screens/ProfileGiftSheet";
import { GiftDetailModal } from "@/components/gifts/GiftDetailModal";

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
              category={giftDef.category as "heart" | "rose" | "bear" | "ring"}
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

// ─── Маппинг города → IANA часовой пояс ───────────────────────────────────────
export const CITY_TIMEZONES: Record<string, string> = {
  "москва": "Europe/Moscow",
  "санкт-петербург": "Europe/Moscow",
  "санкт петербург": "Europe/Moscow",
  "спб": "Europe/Moscow",
  "питер": "Europe/Moscow",
  "сочи": "Europe/Moscow",
  "краснодар": "Europe/Moscow",
  "ростов-на-дону": "Europe/Moscow",
  "нижний новгород": "Europe/Moscow",
  "казань": "Europe/Moscow",
  "воронеж": "Europe/Moscow",
  "волгоград": "Europe/Volgograd",
  "самара": "Europe/Samara",
  "ижевск": "Europe/Samara",
  "саратов": "Europe/Saratov",
  "ульяновск": "Europe/Ulyanovsk",
  "астрахань": "Europe/Astrakhan",
  "калининград": "Europe/Kaliningrad",
  "уфа": "Asia/Yekaterinburg",
  "екатеринбург": "Asia/Yekaterinburg",
  "челябинск": "Asia/Yekaterinburg",
  "пермь": "Asia/Yekaterinburg",
  "тюмень": "Asia/Yekaterinburg",
  "оренбург": "Asia/Yekaterinburg",
  "омск": "Asia/Omsk",
  "новосибирск": "Asia/Novosibirsk",
  "барнаул": "Asia/Barnaul",
  "томск": "Asia/Tomsk",
  "кемерово": "Asia/Novokuznetsk",
  "новокузнецк": "Asia/Novokuznetsk",
  "красноярск": "Asia/Krasnoyarsk",
  "норильск": "Asia/Krasnoyarsk",
  "иркутск": "Asia/Irkutsk",
  "улан-удэ": "Asia/Irkutsk",
  "чита": "Asia/Chita",
  "якутск": "Asia/Yakutsk",
  "благовещенск": "Asia/Yakutsk",
  "хабаровск": "Asia/Vladivostok",
  "владивосток": "Asia/Vladivostok",
  "магадан": "Asia/Magadan",
  "сахалин": "Asia/Sakhalin",
  "южно-сахалинск": "Asia/Sakhalin",
  "петропавловск-камчатский": "Asia/Kamchatka",
  "анадырь": "Asia/Anadyr",
  "минск": "Europe/Minsk",
  "киев": "Europe/Kiev",
  "алматы": "Asia/Almaty",
  "астана": "Asia/Almaty",
  "нур-султан": "Asia/Almaty",
  "ташкент": "Asia/Tashkent",
  "бишкек": "Asia/Bishkek",
  "ереван": "Asia/Yerevan",
  "тбилиси": "Asia/Tbilisi",
  "баку": "Asia/Baku",
};

export function getTimezoneByCity(city?: string | null): string | undefined {
  if (!city) return undefined;
  const key = city.trim().toLowerCase();
  if (CITY_TIMEZONES[key]) return CITY_TIMEZONES[key];
  for (const [k, tz] of Object.entries(CITY_TIMEZONES)) {
    if (key.includes(k)) return tz;
  }
  return undefined;
}

// ─── Исчезающее фото ──────────────────────────────────────────────────────────
function VanishPhoto({ url, out }: { url: string; out: boolean }) {
  const [visible, setVisible] = useState(true);
  const [opened, setOpened] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!opened || out) return;
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timer); setVisible(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [opened, out]);

  if (!visible) {
    return (
      <div className="flex items-center gap-2 px-1 opacity-40">
        <Icon name="Timer" size={14} className="text-white/50" />
        <span className="text-xs text-white/50">Фото исчезло</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {opened || out ? (
          <img src={url} className="rounded-xl object-cover cursor-pointer active:scale-95 transition-transform"
            style={{ maxWidth: 200, maxHeight: 200 }}
            onClick={() => setLightbox(true)} />
        ) : (
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(255,45,120,0.18), rgba(155,89,182,0.15))",
              border: "1.5px solid rgba(255,45,120,0.35)",
              boxShadow: "0 4px 16px rgba(255,45,120,0.12)",
              minWidth: 190,
            }}
            onClick={() => !out && setOpened(true)}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                boxShadow: "0 3px 10px rgba(255,45,120,0.45)",
              }}>
              <Icon name="Lock" size={16} className="text-white" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-[13px] font-semibold leading-tight">
                Приватное фото
              </span>
              <span className="text-[11px]" style={{ color: "rgba(255,45,120,0.9)" }}>
                {out ? "Ожидает просмотра" : "Нажми, чтобы открыть →"}
              </span>
            </div>
          </div>
        )}
        {opened && !out && (
          <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full text-white text-[11px] font-bold"
            style={{ background: "rgba(0,0,0,0.65)" }}>
            🔥 {secondsLeft}с
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(14px)" }}
          onClick={() => setLightbox(false)}>
          <button className="absolute top-5 right-5 glass-card p-2.5"
            onClick={() => setLightbox(false)}>
            <Icon name="X" size={20} className="text-white" />
          </button>
          <img src={url} className="rounded-2xl object-contain"
            style={{ maxWidth: "95vw", maxHeight: "90dvh" }}
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

// ─── VideoCircleMessage ────────────────────────────────────────────────────────
function VideoCircleMessage({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="relative cursor-pointer active:scale-95 transition-transform" style={{ width: 160, height: 160 }}
      onClick={toggle}>
      <video ref={videoRef} src={url} loop playsInline
        className="w-full h-full object-cover rounded-full"
        style={{ border: "2.5px solid rgba(255,45,120,0.6)" }}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{ background: "rgba(0,0,0,0.35)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,45,120,0.85)" }}>
            <Icon name="Play" size={22} className="text-white" style={{ marginLeft: 3 }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PrivateGallery ────────────────────────────────────────────────────────────
function PrivateGallery({ partnerId, onClose }: { partnerId: number; onClose: () => void }) {
  const [photos, setPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    profilesApi.getPartnerPrivatePhotos(partnerId)
      .then(r => { setPhotos(r.photos || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [partnerId]);

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(photos.length - 1, i + 1)), [photos.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col items-center w-full max-w-sm px-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-white/60 text-sm">Приватные фото</span>
          {photos.length > 0 && (
            <span className="text-white/40 text-sm">{idx + 1} / {photos.length}</span>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Icon name="X" size={16} className="text-white" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Icon name="Loader2" size={32} className="text-pink-400 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 h-60 justify-center">
            <Icon name="ImageOff" size={40} className="text-white/30" />
            <span className="text-white/40 text-sm">Фото пока нет</span>
          </div>
        ) : (
          <>
            {/* Фото */}
            <div className="relative w-full" style={{ aspectRatio: "1" }}>
              <img src={photos[idx].photo_url} alt=""
                className="w-full h-full object-cover rounded-2xl"
                style={{ border: "1.5px solid rgba(255,255,255,0.1)" }} />
              {idx > 0 && (
                <button onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <Icon name="ChevronLeft" size={20} className="text-white" />
                </button>
              )}
              {idx < photos.length - 1 && (
                <button onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <Icon name="ChevronRight" size={20} className="text-white" />
                </button>
              )}
            </div>
            {/* Точки */}
            {photos.length > 1 && (
              <div className="flex gap-1.5 mt-3">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className="rounded-full transition-all"
                    style={{ width: i === idx ? 16 : 6, height: 6, background: i === idx ? "#FF2D78" : "rgba(255,255,255,0.3)" }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── GrantPhotoMessage ─────────────────────────────────────────────────────────
function GrantPhotoMessage({ out, partnerId }: { out: boolean; partnerId: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer active:scale-95 transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,197,94,0.08))",
          border: "1.5px solid rgba(74,222,128,0.25)",
          minWidth: 200,
        }}
        onClick={() => !out && setOpen(true)}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 3px 10px rgba(34,197,94,0.4)" }}>
          <Icon name="Images" size={16} className="text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-[13px] font-semibold leading-tight">
            {out ? "Ты открыл фото" : "Открыл тебе фото"}
          </span>
          <span className="text-[11px]" style={{ color: out ? "rgba(74,222,128,0.7)" : "rgba(74,222,128,0.9)" }}>
            {out ? "Приватный альбом доступен" : "Нажми, чтобы посмотреть →"}
          </span>
        </div>
      </div>
      {open && <PrivateGallery partnerId={partnerId} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── RequestPhotoMessage ───────────────────────────────────────────────────────
function RequestPhotoMessage({ out, onGrant, partnerId }: { out: boolean; onGrant?: () => void; partnerId?: number }) {
  const [granted, setGranted] = useState(false);
  const [open, setOpen] = useState(false);

  const handleGrant = () => { setGranted(true); onGrant?.(); };

  // Исходящее: ты запросил
  if (out) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,45,120,0.12), rgba(155,89,182,0.1))",
          border: "1.5px solid rgba(255,45,120,0.22)",
          minWidth: 200,
        }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,45,120,0.2)", border: "1px solid rgba(255,45,120,0.35)" }}>
          <Icon name="Lock" size={16} className="text-pink-400" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-[13px] font-semibold">Запрос фото</span>
          <span className="text-[11px] text-white/45">Ожидаешь ответа...</span>
        </div>
      </div>
    );
  }

  // Входящее: партнёр просит доступ
  return (
    <>
      <div className="flex flex-col gap-2.5 px-3 py-3 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,45,120,0.15), rgba(155,89,182,0.12))",
          border: "1.5px solid rgba(255,45,120,0.3)",
          minWidth: 200,
        }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: granted ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#FF2D78,#9B59B6)",
              boxShadow: granted ? "0 3px 10px rgba(34,197,94,0.4)" : "0 3px 10px rgba(255,45,120,0.4)",
              transition: "all 0.3s",
            }}>
            <Icon name={granted ? "LockOpen" : "Lock"} size={16} className="text-white" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-white text-[13px] font-semibold">Запрос приватных фото</span>
            <span className="text-[11px] text-white/45">{granted ? "Доступ открыт ✓" : "Хочет посмотреть твой альбом"}</span>
          </div>
        </div>
        {!granted ? (
          <button onClick={handleGrant}
            className="btn-grad py-2 px-4 text-xs font-bold rounded-xl w-full active:scale-95 transition-transform">
            Открыть доступ →
          </button>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <Icon name="CheckCircle" size={14} className="text-green-400" />
            <span className="text-xs text-green-400 font-medium">Альбом открыт</span>
          </div>
        )}
      </div>
      {open && partnerId && <PrivateGallery partnerId={partnerId} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── renderMsgContent ──────────────────────────────────────────────────────────
export function renderMsgContent(text: string, out: boolean, partnerId?: number, onGrant?: () => void) {
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
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
        style={{
          background: accepted
            ? "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,197,94,0.08))"
            : "linear-gradient(135deg, rgba(99,179,237,0.12), rgba(79,134,247,0.08))",
          border: `1.5px solid ${accepted ? "rgba(74,222,128,0.25)" : "rgba(99,179,237,0.25)"}`,
          minWidth: 180,
        }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: accepted ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#3b82f6,#6366f1)",
            boxShadow: accepted ? "0 3px 10px rgba(34,197,94,0.4)" : "0 3px 10px rgba(59,130,246,0.4)",
          }}>
          <Icon name="Video" size={16} className="text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-[13px] font-semibold">
            {accepted ? "Видеозвонок" : "Видеозвонок"}
          </span>
          <span className="text-[11px]" style={{ color: accepted ? "rgba(74,222,128,0.8)" : "rgba(99,179,237,0.8)" }}>
            {accepted ? "Звонок принят ✓" : "Входящий запрос 📹"}
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
  if (text === "__GEO_DENIED__") {
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
  if (text === "❤️") {
    return <HeartMessage />;
  }
  return <span>{text}</span>;
}

// ─── HeartMessage ──────────────────────────────────────────────────────────────
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