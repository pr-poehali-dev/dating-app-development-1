import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
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
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all"
            style={{ background: "rgba(255,45,120,0.15)", border: "1.5px solid rgba(255,45,120,0.4)" }}
            onClick={() => !out && setOpened(true)}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,45,120,0.3)", border: "1.5px solid rgba(255,45,120,0.5)" }}>
              <Icon name="Timer" size={20} className="text-pink-400" />
            </div>
            <span className="text-white text-xs font-medium">
              {out ? "Нажми чтобы посмотреть" : "Нажми чтобы открыть"}
            </span>
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

// ─── renderMsgContent ──────────────────────────────────────────────────────────
export function renderMsgContent(text: string, out: boolean) {
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
    return (
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: status === "accepted" ? "rgba(74,222,128,0.2)" : "rgba(255,45,120,0.2)" }}>
          <Icon name="Video" size={16} className={status === "accepted" ? "text-green-400" : "text-pink-400"} />
        </div>
        <span className="text-sm">{status === "accepted" ? "Видеозвонок принят ✓" : "Запрос видеозвонка 📹"}</span>
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
    return (
      <div className="flex items-center gap-2 px-1 py-0.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(100,200,100,0.2)" }}>
          <Icon name="ImagePlus" size={16} className="text-green-400" />
        </div>
        <span className="text-sm">{out ? "Ты открыл доступ к своим фото 🖼️" : "Открыл тебе доступ к своим фото 🖼️"}</span>
      </div>
    );
  }
  if (text.startsWith("__AUDIO__")) {
    const url = text.slice(9);
    return <VoiceMessage url={url} out={out} />;
  }
  if (text === "__REQUEST_PHOTO__") {
    return (
      <div className="flex items-center gap-2 px-1 py-0.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,45,120,0.2)" }}>
          <Icon name="Lock" size={16} className="text-pink-400" />
        </div>
        <span className="text-sm">{out ? "Ты запросил доступ к приватным фото 🔐" : "Запрашивает доступ к твоим приватным фото 🔐"}</span>
      </div>
    );
  }
  if (text.startsWith("__GIFT__")) {
    return <ChatGiftMessage text={text} out={out} />;
  }
  return <span>{text}</span>;
}