import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { authApi, profilesApi, likesApi, matchesApi, messagesApi, type User, type Profile, type Match, type Message, type LikedBy } from "@/lib/api";

// ─── Data ────────────────────────────────────────────────────────────────────

const PROFILES = [
  {
    id: 1,
    name: "Алина",
    age: 24,
    city: "Москва",
    distance: "3 км",
    bio: "Люблю кофе, рассветы и случайные путешествия. Ищу человека, с которым можно потеряться в незнакомом городе ☕",
    tags: ["Путешествия", "Кофе", "Йога", "Кино"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg",
    verified: true,
    online: true,
  },
  {
    id: 2,
    name: "Максим",
    age: 28,
    city: "Москва",
    distance: "7 км",
    bio: "Архитектор по призванию. Строю города и разрушаю стереотипы. Обожаю джаз и спонтанные вечера 🎷",
    tags: ["Архитектура", "Джаз", "Спорт", "Готовка"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/f6e87c7a-8c99-4c42-a478-32f63cadb0d8.jpg",
    verified: false,
    online: false,
  },
  {
    id: 3,
    name: "Соня",
    age: 26,
    city: "Санкт-Петербург",
    distance: "15 км",
    bio: "Фотограф, влюблённая в детали. Ловлю красоту в обычном. Ищу того, кто умеет удивлять 📸",
    tags: ["Фотография", "Искусство", "Книги", "Танцы"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/9e6ff21a-1da2-432f-882a-f0ee84125e09.jpg",
    verified: true,
    online: true,
  },
  {
    id: 4,
    name: "Дима",
    age: 27,
    city: "Москва",
    distance: "2 км",
    bio: "IT-разработчик, который умеет отдыхать. Велопрогулки, барбекю и хорошие компании — вот моя жизнь 🚲",
    tags: ["IT", "Велоспорт", "Природа", "Музыка"],
    photo: "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/93213dcb-e051-4766-9eb3-527ebd0b3c85.jpg",
    verified: false,
    online: true,
  },
];

const MATCHES = [
  { id: 1, name: "Алина", age: 24, photo: PROFILES[0].photo, lastMsg: "Привет! Как дела? 😊", time: "сейчас", unread: 2, online: true },
  { id: 3, name: "Соня", age: 26, photo: PROFILES[2].photo, lastMsg: "Здорово, что совпали!", time: "5 мин", unread: 0, online: true },
];

const LIKED_ME = [
  { id: 2, name: "Максим", age: 28, photo: PROFILES[1].photo },
  { id: 4, name: "Дима", age: 27, photo: PROFILES[3].photo },
];

const MESSAGES: Record<number, { id: number; text: string; out: boolean; time: string }[]> = {
  1: [
    { id: 1, text: "Привет! Заметил ты тоже любишь кофе ☕", out: true, time: "14:20" },
    { id: 2, text: "Привет! Да, без него никуда 😄 Какой твой любимый?", out: false, time: "14:22" },
    { id: 3, text: "Флэт уайт. Ты сама где обычно пьёшь?", out: true, time: "14:23" },
    { id: 4, text: "В Surf Coffee на Никольской. Там потрясающий вид!", out: false, time: "14:25" },
    { id: 5, text: "Привет! Как дела? 😊", out: false, time: "только что" },
  ],
  3: [
    { id: 1, text: "Здорово, что совпали!", out: false, time: "20:10" },
    { id: 2, text: "Согласен! Твои фото просто космос", out: true, time: "20:11" },
    { id: 3, text: "Спасибо 🙈 Долго снимала этот закат", out: false, time: "20:12" },
  ],
};

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium";
type Profile = (typeof PROFILES)[0];

// ─── SwipeCard ────────────────────────────────────────────────────────────────
function SwipeCard({
  profile,
  onLike,
  onDislike,
  isTop,
  offset = 0,
}: {
  profile: Profile;
  onLike: () => void;
  onDislike: () => void;
  isTop: boolean;
  offset?: number;
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const startRef = useRef({ x: 0, y: 0 });

  const likeOpacity = Math.min(Math.max(drag.x / 80, 0), 1);
  const nopeOpacity = Math.min(Math.max(-drag.x / 80, 0), 1);
  const rotation = (drag.x / 15) * (drag.y > 0 ? 1 : -1);

  const handleStart = (clientX: number, clientY: number) => {
    if (!isTop) return;
    startRef.current = { x: clientX, y: clientY };
    setDrag((d) => ({ ...d, dragging: true }));
  };
  const handleMove = (clientX: number, clientY: number) => {
    if (!drag.dragging) return;
    setDrag({ x: clientX - startRef.current.x, y: clientY - startRef.current.y, dragging: true });
  };
  const handleEnd = () => {
    if (!drag.dragging) return;
    if (drag.x > 90) { setExiting("right"); setTimeout(onLike, 350); }
    else if (drag.x < -90) { setExiting("left"); setTimeout(onDislike, 350); }
    else setDrag({ x: 0, y: 0, dragging: false });
  };

  const handleLikeBtn = () => { setExiting("right"); setTimeout(onLike, 350); };
  const handleDislikeBtn = () => { setExiting("left"); setTimeout(onDislike, 350); };

  const scale = isTop ? 1 : 1 - offset * 0.04;
  const translateY = isTop ? drag.y : offset * 12;

  return (
    <div
      className="swipe-card absolute inset-0"
      style={{
        transform: exiting === "left"
          ? "translateX(-150%) rotate(-30deg)"
          : exiting === "right"
          ? "translateX(150%) rotate(30deg)"
          : `translateX(${drag.x}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
        transition: drag.dragging ? "none" : exiting ? "transform 0.35s ease" : "transform 0.25s ease",
        zIndex: 10 - offset,
        opacity: exiting ? 0 : 1,
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
      <div className="stamp-like" style={{ opacity: likeOpacity }}>НРАВ.</div>
      <div className="stamp-nope" style={{ opacity: nopeOpacity }}>НЕЕТ</div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-white font-golos font-bold text-3xl">{profile.name}, {profile.age}</h2>
          {profile.verified && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
              <Icon name="Check" size={12} className="text-white" />
            </div>
          )}
          {profile.online && <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_#00E676]" />}
        </div>
        <div className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <Icon name="MapPin" size={13} />
          <span>{profile.city} · {profile.distance}</span>
        </div>
        <p className="text-white/80 text-sm leading-relaxed mb-3 line-clamp-2">{profile.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.tags.map((tag) => <span key={tag} className="tag-pill">{tag}</span>)}
        </div>
      </div>

      {isTop && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 pb-6 pt-16">
          <button onClick={handleDislikeBtn}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <Icon name="X" size={22} className="text-white" />
          </button>
          <button onClick={handleLikeBtn} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 btn-grad">
            <Icon name="Heart" size={26} className="text-white" />
          </button>
          <button className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <Icon name="Star" size={20} className="text-yellow-400" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Discover ─────────────────────────────────────────────────────────────────
function DiscoverScreen({ onFilter }: { onFilter: () => void }) {
  const [cards, setCards] = useState(PROFILES);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = () => {
    setLikeAnim(true);
    setTimeout(() => { setLikeAnim(false); setCards((c) => c.slice(1)); }, 400);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 relative z-10">
        <div>
          <h1 className="font-unbounded text-white text-xl font-black grad-text">SPARK</h1>
          <p className="text-white/40 text-xs">Москва · Найдено 284</p>
        </div>
        <button onClick={onFilter} className="glass-card px-4 py-2 flex items-center gap-2 text-white/80 text-sm">
          <Icon name="SlidersHorizontal" size={15} />Фильтры
        </button>
      </div>

      <div className="flex-1 relative mx-4" style={{ maxHeight: "calc(100% - 80px)" }}>
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-up">
            <div className="text-6xl">🌟</div>
            <p className="text-white/60 text-center text-sm">Анкеты закончились.<br />Расширь критерии поиска!</p>
            <button className="btn-grad px-6 py-3 text-sm" onClick={() => setCards(PROFILES)}>Обновить</button>
          </div>
        ) : (
          cards.slice(0, 3).reverse().map((p, i) => (
            <SwipeCard
              key={p.id}
              profile={p}
              isTop={i === cards.slice(0, 3).length - 1}
              offset={cards.slice(0, 3).length - 1 - i}
              onLike={handleLike}
              onDislike={() => setCards((c) => c.slice(1))}
            />
          ))
        )}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="w-24 h-24 rounded-full flex items-center justify-center animate-heart"
              style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
              <Icon name="Heart" size={44} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Matches ──────────────────────────────────────────────────────────────────
function MatchesScreen({ onChat }: { onChat: (id: number) => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-golos font-bold text-2xl">Совпадения</h2>
        <p className="text-white/40 text-sm mt-0.5">У тебя {MATCHES.length} взаимных симпатии</p>
      </div>
      <div className="px-5 mb-4">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Новые</p>
        <div className="flex gap-3">
          {MATCHES.map((m) => (
            <button key={m.id} onClick={() => onChat(m.id)} className="flex flex-col items-center gap-2">
              <div className="relative">
                <img src={m.photo} className="w-16 h-16 rounded-full object-cover" style={{ boxShadow: "0 0 0 2px #FF2D78" }} />
                {m.online && <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--spark-dark)" }} />}
                {m.unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                    {m.unread}
                  </div>
                )}
              </div>
              <span className="text-white/80 text-xs">{m.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 flex-1">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Сообщения</p>
        <div className="flex flex-col gap-1">
          {MATCHES.map((m) => (
            <button key={m.id} onClick={() => onChat(m.id)}
              className="glass-card p-4 flex items-center gap-3 w-full text-left hover:bg-white/10 transition-all">
              <div className="relative flex-shrink-0">
                <img src={m.photo} className="w-12 h-12 rounded-full object-cover" />
                {m.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--spark-dark)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">{m.name}, {m.age}</span>
                  <span className="text-white/40 text-xs">{m.time}</span>
                </div>
                <p className="text-white/50 text-sm truncate mt-0.5">{m.lastMsg}</p>
              </div>
              {m.unread > 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                  {m.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Likes ────────────────────────────────────────────────────────────────────
function LikesScreen({ onPremium }: { onPremium: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-golos font-bold text-2xl">Ты им понравился</h2>
        <p className="text-white/40 text-sm mt-0.5">{LIKED_ME.length} человека лайкнули тебя</p>
      </div>
      <div className="mx-5 mb-5 p-5 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.25), rgba(155,89,182,0.25))", border: "1px solid rgba(255,45,120,0.3)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-base">Spark Premium</span>
              <span className="premium-badge">GOLD</span>
            </div>
            <p className="text-white/60 text-sm">Смотри, кто тебя лайкнул — без ограничений</p>
          </div>
          <div className="text-3xl">✨</div>
        </div>
        <button onClick={onPremium} className="btn-grad px-5 py-2.5 text-sm w-full">Открыть все лайки</button>
      </div>
      <div className="px-5 grid grid-cols-2 gap-3">
        {LIKED_ME.map((p, i) => (
          <div key={p.id} className="relative rounded-2xl overflow-hidden aspect-[3/4]">
            <img src={p.photo} className="w-full h-full object-cover"
              style={{ filter: i === 0 ? "none" : "blur(20px) brightness(0.7)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
            {i !== 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={onPremium} className="glass-card p-3 flex flex-col items-center gap-1">
                  <Icon name="Lock" size={18} className="text-white" />
                  <span className="text-white text-xs">Premium</span>
                </button>
              </div>
            )}
            <div className="absolute bottom-3 left-3">
              <p className="text-white font-semibold text-sm">{p.name}, {p.age}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
function ChatScreen({ matchId, onBack }: { matchId: number; onBack: () => void }) {
  const match = MATCHES.find((m) => m.id === matchId)!;
  const [msgs, setMsgs] = useState(MESSAGES[matchId] || []);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMsgs((m) => [...m, { id: Date.now(), text: input.trim(), out: true, time: "сейчас" }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 relative z-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={24} />
        </button>
        <img src={match.photo} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{match.name}</p>
          <div className="flex items-center gap-1">
            {match.online && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
            <span className="text-white/50 text-xs">{match.online ? "онлайн" : "был(а) недавно"}</span>
          </div>
        </div>
        <button className="text-white/50 hover:text-white transition-colors">
          <Icon name="MoreVertical" size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {msgs.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.out ? "items-end" : "items-start"}`}>
            <div className={msg.out ? "msg-bubble-out" : "msg-bubble-in"}>{msg.text}</div>
            <span className="text-white/30 text-[11px] mt-1 px-1">{msg.time}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Написать..."
          className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos"
        />
        <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
          <Icon name="Send" size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileScreen({ onPremium }: { onPremium: () => void }) {
  const me = {
    name: "Ты", age: 25, city: "Москва",
    bio: "Здесь будет твоё описание. Расскажи о себе — это привлечёт больше симпатий!",
    tags: ["Музыка", "Путешествия", "Кулинария"],
    photo: PROFILES[0].photo,
    likes: 12, views: 84, matches: 3,
  };

  const settings = [
    { icon: "Bell", label: "Уведомления", value: "Включены", danger: false },
    { icon: "Shield", label: "Приватность", value: "Стандартная", danger: false },
    { icon: "Globe", label: "Язык", value: "Русский", danger: false },
    { icon: "HelpCircle", label: "Поддержка", value: "", danger: false },
    { icon: "LogOut", label: "Выйти", value: "", danger: true },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-white font-golos font-bold text-2xl">Профиль</h2>
        <button className="text-white/60 hover:text-white transition-colors"><Icon name="Settings" size={22} /></button>
      </div>
      <div className="flex flex-col items-center px-5 mb-5">
        <div className="relative mb-4">
          <img src={me.photo} className="w-24 h-24 rounded-full object-cover" style={{ boxShadow: "0 0 0 3px #FF2D78" }} />
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center btn-grad">
            <Icon name="Camera" size={13} className="text-white" />
          </button>
        </div>
        <h3 className="text-white font-bold text-xl">{me.name}, {me.age}</h3>
        <p className="text-white/50 text-sm flex items-center gap-1"><Icon name="MapPin" size={13} />{me.city}</p>
        <div className="grid grid-cols-3 gap-3 w-full mt-4">
          {[
            { label: "Лайки", value: me.likes, icon: "Heart", color: "#FF2D78" },
            { label: "Просмотры", value: me.views, icon: "Eye", color: "#9B59B6" },
            { label: "Совпадения", value: me.matches, icon: "Zap", color: "#FF8C42" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 flex flex-col items-center gap-1">
              <Icon name={s.icon as "Heart" | "Eye" | "Zap"} size={18} style={{ color: s.color }} />
              <span className="text-white font-bold text-lg">{s.value}</span>
              <span className="text-white/50 text-xs">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-5 glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs uppercase tracking-widest">О себе</span>
          <button className="text-white/50 hover:text-white transition-colors"><Icon name="Pencil" size={14} /></button>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{me.bio}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {me.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
          <button className="tag-pill border-dashed opacity-50">+ Добавить</button>
        </div>
      </div>
      <div className="mx-5 p-4 rounded-2xl mb-4 cursor-pointer"
        style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }} onClick={onPremium}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold">Spark Premium</span>
              <span className="premium-badge">✨ GOLD</span>
            </div>
            <p className="text-white/80 text-xs">Безлимитные лайки · Приоритет в поиске</p>
          </div>
          <Icon name="ChevronRight" size={20} className="text-white" />
        </div>
      </div>
      <div className="mx-5 glass-card overflow-hidden mb-6">
        {settings.map((s, i) => (
          <button key={s.label}
            className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-white/5 transition-colors"
            style={{ borderBottom: i < settings.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <Icon name={s.icon as "Bell" | "Shield" | "Globe" | "HelpCircle" | "LogOut"} size={17} className={s.danger ? "text-red-400" : "text-white/50"} />
            <span className={`${s.danger ? "text-red-400" : "text-white/80"} text-sm flex-1 text-left`}>{s.label}</span>
            {s.value && <span className="text-white/40 text-xs">{s.value}</span>}
            {!s.value && !s.danger && <Icon name="ChevronRight" size={15} className="text-white/30" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Filter ───────────────────────────────────────────────────────────────────
function FilterScreen({ onClose }: { onClose: () => void }) {
  const [ageMax, setAgeMax] = useState(35);
  const [distance, setDistance] = useState(20);
  const [gender, setGender] = useState("Девушек");
  const interests = ["Путешествия", "Спорт", "Кино", "Музыка", "Кулинария", "Фотография", "Йога", "Искусство", "Книги", "Танцы", "Природа", "IT"];
  const [selected, setSelected] = useState(["Путешествия", "Музыка"]);
  const toggle = (t: string) => setSelected((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-white font-golos font-bold text-xl">Фильтры</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><Icon name="X" size={22} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-5">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">Возраст</span>
            <span className="text-white/60 text-sm">20 – {ageMax} лет</span>
          </div>
          <input type="range" min={18} max={60} value={ageMax} onChange={(e) => setAgeMax(+e.target.value)} className="w-full accent-pink-500" />
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">Расстояние</span>
            <span className="text-white/60 text-sm">до {distance} км</span>
          </div>
          <input type="range" min={1} max={100} value={distance} onChange={(e) => setDistance(+e.target.value)} className="w-full accent-pink-500" />
        </div>
        <div className="glass-card p-4">
          <span className="text-white font-semibold text-sm block mb-3">Кого ищешь</span>
          <div className="grid grid-cols-3 gap-2">
            {["Девушек", "Парней", "Всех"].map((g) => (
              <button key={g} onClick={() => setGender(g)}
                className="py-2 rounded-xl text-sm font-medium transition-all"
                style={gender === g
                  ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                  : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="glass-card p-4">
          <span className="text-white font-semibold text-sm block mb-3">Интересы</span>
          <div className="flex flex-wrap gap-2">
            {interests.map((t) => (
              <button key={t} onClick={() => toggle(t)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={selected.includes(t)
                  ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                  : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-4">
        <button onClick={onClose} className="btn-grad w-full py-3.5 text-base">Применить фильтры</button>
      </div>
    </div>
  );
}

// ─── Premium ──────────────────────────────────────────────────────────────────
function PremiumScreen({ onClose }: { onClose: () => void }) {
  const plans = [
    { label: "1 месяц", price: "699 ₽", per: "/мес", popular: false, total: "" },
    { label: "3 месяца", price: "449 ₽", per: "/мес", popular: true, total: "1 347 ₽" },
    { label: "12 месяцев", price: "249 ₽", per: "/мес", popular: false, total: "2 988 ₽" },
  ];
  const [selected, setSelected] = useState(1);

  const features = [
    { icon: "Heart", label: "Безлимитные лайки каждый день" },
    { icon: "Eye", label: "Смотри, кто тебя лайкнул" },
    { icon: "Zap", label: "Приоритет в поиске — больше показов" },
    { icon: "RefreshCw", label: "Отмена последнего свайпа" },
    { icon: "Star", label: "Суперлайки каждый день" },
    { icon: "Shield", label: "Режим инкогнито" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "linear-gradient(160deg, #1A1625, #2D1B3D)" }}>
      <div className="flex items-center justify-end px-5 pt-5 pb-2">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><Icon name="X" size={22} /></button>
      </div>
      <div className="flex flex-col items-center px-5 pt-2 pb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 0 40px rgba(255,45,120,0.5)" }}>
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="font-unbounded text-white font-black text-2xl text-center mb-2">SPARK PREMIUM</h2>
        <p className="text-white/50 text-sm text-center">Знакомься быстрее, находи лучшее</p>
      </div>
      <div className="mx-5 glass-card p-4 mb-5">
        <div className="flex flex-col gap-3">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(155,89,182,0.2))" }}>
                <Icon name={f.icon as "Heart" | "Eye" | "Zap" | "RefreshCw" | "Star" | "Shield"} size={15} className="text-pink-400" />
              </div>
              <span className="text-white/80 text-sm">{f.label}</span>
              <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                <Icon name="Check" size={10} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-5 flex flex-col gap-2.5 mb-5">
        {plans.map((p, i) => (
          <button key={p.label} onClick={() => setSelected(i)}
            className="relative p-4 rounded-2xl text-left transition-all"
            style={selected === i
              ? { background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(155,89,182,0.2))", border: "2px solid #FF2D78" }
              : { background: "rgba(255,255,255,0.05)", border: "2px solid rgba(255,255,255,0.1)" }}>
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="premium-badge px-3 py-1">🔥 ВЫГОДНЕЕ ВСЕГО</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{p.label}</p>
                {p.total && <p className="text-white/40 text-xs">{p.total} всего</p>}
              </div>
              <div className="text-right">
                <span className="text-white font-bold text-xl">{p.price}</span>
                <span className="text-white/50 text-sm">{p.per}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="px-5 pb-8">
        <button className="btn-grad w-full py-4 text-base font-bold">Попробовать Premium</button>
        <p className="text-white/30 text-xs text-center mt-3">Автопродление. Отмена в любой момент.</p>
      </div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const items: { screen: Screen; icon: string; label: string; badge?: number }[] = [
    { screen: "discover", icon: "Flame", label: "Поиск" },
    { screen: "matches", icon: "MessageCircle", label: "Чаты", badge: 2 },
    { screen: "likes", icon: "Heart", label: "Лайки", badge: 2 },
    { screen: "profile", icon: "User", label: "Профиль" },
  ];

  return (
    <div className="flex items-center justify-around px-4 py-2 relative z-10"
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(26,22,37,0.95)", backdropFilter: "blur(20px)" }}>
      {items.map((item) => (
        <button key={item.screen}
          className={`nav-item relative ${active === item.screen ? "active" : ""}`}
          onClick={() => onChange(item.screen)}>
          <div className="relative">
            <Icon name={item.icon as "Flame" | "MessageCircle" | "Heart" | "User"} size={22} />
            {item.badge && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                {item.badge}
              </div>
            )}
          </div>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      let result;
      if (mode === "register") {
        if (!name.trim()) { setError("Введи своё имя"); setLoading(false); return; }
        result = await authApi.register(email, password, name);
      } else {
        result = await authApi.login(email, password);
      }
      onAuth(result.user);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full justify-center px-6 gap-6">
      <div className="text-center mb-4">
        <h1 className="font-unbounded text-white text-3xl font-black grad-text mb-2">SPARK</h1>
        <p className="text-white/40 text-sm">Знакомься. Общайся. Влюбляйся.</p>
      </div>

      <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="flex-1 py-2.5 text-sm font-medium transition-all"
              style={mode === m ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white", borderRadius: "16px" } : { color: "rgba(255,255,255,0.5)" }}>
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоё имя"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" type="password"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button onClick={submit} disabled={loading} className="btn-grad py-3.5 text-base font-semibold">
          {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </div>

      <p className="text-white/30 text-xs text-center">Нажимая кнопку, ты соглашаешься с правилами сервиса</p>
    </div>
  );
}

// ─── Real Discover ────────────────────────────────────────────────────────────
function RealDiscoverScreen({ currentUser, onFilter }: { currentUser: User; onFilter: () => void }) {
  const [cards, setCards] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeAnim, setLikeAnim] = useState(false);

  useEffect(() => {
    profilesApi.getDiscover()
      .then((d) => setCards(d.profiles))
      .catch(() => setCards(PROFILES))
      .finally(() => setLoading(false));
  }, []);

  const handleLike = useCallback(async (profile: Profile) => {
    setLikeAnim(true);
    try { await likesApi.send(profile.id); } catch (e) { void e; }
    setTimeout(() => { setLikeAnim(false); setCards((c) => c.slice(1)); }, 400);
  }, []);

  const handleDislike = useCallback(() => {
    setCards((c) => c.slice(1));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        <p className="text-white/40 text-sm">Ищем анкеты...</p>
      </div>
    );
  }

  const profileCards = cards.length > 0 ? cards : PROFILES;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 relative z-10">
        <div>
          <h1 className="font-unbounded text-white text-xl font-black grad-text">SPARK</h1>
          <p className="text-white/40 text-xs">{currentUser.city || "Везде"} · Знакомства</p>
        </div>
        <button onClick={onFilter} className="glass-card px-4 py-2 flex items-center gap-2 text-white/80 text-sm">
          <Icon name="SlidersHorizontal" size={15} />Фильтры
        </button>
      </div>
      <div className="flex-1 relative mx-4" style={{ maxHeight: "calc(100% - 80px)" }}>
        {profileCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-up">
            <div className="text-6xl">🌟</div>
            <p className="text-white/60 text-center text-sm">Анкеты закончились.<br />Расширь критерии поиска!</p>
            <button className="btn-grad px-6 py-3 text-sm" onClick={() => profilesApi.getDiscover().then((d) => setCards(d.profiles)).catch(() => setCards(PROFILES))}>
              Обновить
            </button>
          </div>
        ) : (
          profileCards.slice(0, 3).reverse().map((p, i) => {
            const profile = { ...p, photo: p.photo_url || PROFILES[i % PROFILES.length].photo, distance: "рядом", tags: p.tags || [], online: p.online || false, verified: p.verified || false };
            return (
              <SwipeCard
                key={p.id}
                profile={profile as typeof PROFILES[0]}
                isTop={i === profileCards.slice(0, 3).length - 1}
                offset={profileCards.slice(0, 3).length - 1 - i}
                onLike={() => handleLike(p)}
                onDislike={handleDislike}
              />
            );
          })
        )}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="w-24 h-24 rounded-full flex items-center justify-center animate-heart"
              style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
              <Icon name="Heart" size={44} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Real Matches ─────────────────────────────────────────────────────────────
function RealMatchesScreen({ onChat }: { onChat: (matchId: number) => void }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchesApi.getAll()
      .then((d) => setMatches(d.matches))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );

  if (matches.length === 0) return (
    <div className="flex flex-col h-full items-center justify-center gap-4 px-8">
      <div className="text-5xl">💬</div>
      <p className="text-white/60 text-center text-sm">Пока нет совпадений.<br />Лайкай анкеты — они лайкнут в ответ!</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-golos font-bold text-2xl">Совпадения</h2>
        <p className="text-white/40 text-sm mt-0.5">У тебя {matches.length} совпадений</p>
      </div>
      <div className="px-5 mb-4">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Новые</p>
        <div className="flex gap-3">
          {matches.map((m) => (
            <button key={m.match_id} onClick={() => onChat(m.match_id)} className="flex flex-col items-center gap-2">
              <div className="relative">
                <img src={m.photo_url || PROFILES[0].photo} className="w-16 h-16 rounded-full object-cover" style={{ boxShadow: "0 0 0 2px #FF2D78" }} />
                {m.online && <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--spark-dark)" }} />}
                {m.unread_count > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>{m.unread_count}</div>
                )}
              </div>
              <span className="text-white/80 text-xs">{m.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 flex-1">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Сообщения</p>
        <div className="flex flex-col gap-1">
          {matches.map((m) => (
            <button key={m.match_id} onClick={() => onChat(m.match_id)}
              className="glass-card p-4 flex items-center gap-3 w-full text-left hover:bg-white/10 transition-all">
              <div className="relative flex-shrink-0">
                <img src={m.photo_url || PROFILES[0].photo} className="w-12 h-12 rounded-full object-cover" />
                {m.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--spark-dark)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">{m.name}{m.age ? `, ${m.age}` : ""}</span>
                  <span className="text-white/40 text-xs">{m.last_msg_time ? new Date(m.last_msg_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                </div>
                <p className="text-white/50 text-sm truncate mt-0.5">{m.last_msg || "Совпадение! Напиши первым 👋"}</p>
              </div>
              {m.unread_count > 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>{m.unread_count}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Real Likes ───────────────────────────────────────────────────────────────
function RealLikesScreen({ onPremium }: { onPremium: () => void }) {
  const [likedMe, setLikedMe] = useState<LikedBy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    likesApi.getLikedMe()
      .then((d) => setLikedMe(d.liked_me))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-golos font-bold text-2xl">Ты им понравился</h2>
        <p className="text-white/40 text-sm mt-0.5">{likedMe.length} человек лайкнули тебя</p>
      </div>
      <div className="mx-5 mb-5 p-5 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.25), rgba(155,89,182,0.25))", border: "1px solid rgba(255,45,120,0.3)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-base">Spark Premium</span>
              <span className="premium-badge">GOLD</span>
            </div>
            <p className="text-white/60 text-sm">Смотри, кто тебя лайкнул — без ограничений</p>
          </div>
          <div className="text-3xl">✨</div>
        </div>
        <button onClick={onPremium} className="btn-grad px-5 py-2.5 text-sm w-full">Открыть все лайки</button>
      </div>
      {likedMe.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="text-5xl">❤️</div>
          <p className="text-white/50 text-sm text-center">Пока никто не лайкнул.<br />Заполни профиль и лайкай сам!</p>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3">
          {likedMe.map((p, i) => (
            <div key={p.id} className="relative rounded-2xl overflow-hidden aspect-[3/4]">
              <img src={p.photo_url || PROFILES[i % PROFILES.length].photo} className="w-full h-full object-cover"
                style={{ filter: p.blurred ? "blur(20px) brightness(0.7)" : "none" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
              {p.blurred && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={onPremium} className="glass-card p-3 flex flex-col items-center gap-1">
                    <Icon name="Lock" size={18} className="text-white" />
                    <span className="text-white text-xs">Premium</span>
                  </button>
                </div>
              )}
              <div className="absolute bottom-3 left-3">
                <p className="text-white font-semibold text-sm">{p.name}{p.age ? `, ${p.age}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Real Chat ────────────────────────────────────────────────────────────────
function RealChatScreen({ matchId, currentUserId, onBack }: { matchId: number; currentUserId: number; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [partnerName, setPartnerName] = useState("...");
  const [partnerPhoto, setPartnerPhoto] = useState(PROFILES[0].photo);

  useEffect(() => {
    messagesApi.getByMatch(matchId)
      .then((d) => setMsgs(d.messages))
      .catch(() => {});
    matchesApi.getAll().then((d) => {
      const m = d.matches.find((x) => x.match_id === matchId);
      if (m) { setPartnerName(m.name); setPartnerPhoto(m.photo_url || PROFILES[0].photo); }
    }).catch(() => {});
  }, [matchId]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    try {
      const msg = await messagesApi.send(matchId, text);
      setMsgs((m) => [...m, msg]);
    } catch (e) { void e; }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 relative z-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onBack} className="text-white/70 hover:text-white transition-colors"><Icon name="ChevronLeft" size={24} /></button>
        <img src={partnerPhoto} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{partnerName}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-white/40 text-sm">Начни общение первым! 👋</p>
          </div>
        )}
        {msgs.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.out ? "items-end" : "items-start"}`}>
            <div className={msg.out ? "msg-bubble-out" : "msg-bubble-in"}>{msg.text}</div>
            <span className="text-white/30 text-[11px] mt-1 px-1">
              {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Написать..."
          className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
        <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
          <Icon name="Send" size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Real Profile ─────────────────────────────────────────────────────────────
function RealProfileScreen({ currentUser, onPremium, onLogout }: { currentUser: User; onPremium: () => void; onLogout: () => void }) {
  const settings = [
    { icon: "Bell", label: "Уведомления", value: "Включены", danger: false },
    { icon: "Shield", label: "Приватность", value: "Стандартная", danger: false },
    { icon: "Globe", label: "Язык", value: "Русский", danger: false },
    { icon: "HelpCircle", label: "Поддержка", value: "", danger: false },
    { icon: "LogOut", label: "Выйти", value: "", danger: true, action: onLogout },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-white font-golos font-bold text-2xl">Профиль</h2>
        <button className="text-white/60 hover:text-white transition-colors"><Icon name="Settings" size={22} /></button>
      </div>
      <div className="flex flex-col items-center px-5 mb-5">
        <div className="relative mb-4">
          <img src={currentUser.photo_url || PROFILES[0].photo} className="w-24 h-24 rounded-full object-cover" style={{ boxShadow: "0 0 0 3px #FF2D78" }} />
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center btn-grad">
            <Icon name="Camera" size={13} className="text-white" />
          </button>
        </div>
        <h3 className="text-white font-bold text-xl">{currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ""}</h3>
        <p className="text-white/50 text-sm flex items-center gap-1"><Icon name="MapPin" size={13} />{currentUser.city || "Город не указан"}</p>
        <div className="grid grid-cols-3 gap-3 w-full mt-4">
          {[
            { label: "Лайки", value: "—", icon: "Heart", color: "#FF2D78" },
            { label: "Просмотры", value: "—", icon: "Eye", color: "#9B59B6" },
            { label: "Совпадения", value: "—", icon: "Zap", color: "#FF8C42" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 flex flex-col items-center gap-1">
              <Icon name={s.icon as "Heart" | "Eye" | "Zap"} size={18} style={{ color: s.color }} />
              <span className="text-white font-bold text-lg">{s.value}</span>
              <span className="text-white/50 text-xs">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-5 glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs uppercase tracking-widest">О себе</span>
          <button className="text-white/50 hover:text-white transition-colors"><Icon name="Pencil" size={14} /></button>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{currentUser.bio || "Расскажи о себе — это привлечёт больше симпатий!"}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(currentUser.tags || []).map((t) => <span key={t} className="tag-pill">{t}</span>)}
          <button className="tag-pill border-dashed opacity-50">+ Добавить</button>
        </div>
      </div>
      <div className="mx-5 p-4 rounded-2xl mb-4 cursor-pointer"
        style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }} onClick={onPremium}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold">Spark Premium</span>
              <span className="premium-badge">✨ GOLD</span>
            </div>
            <p className="text-white/80 text-xs">Безлимитные лайки · Приоритет в поиске</p>
          </div>
          <Icon name="ChevronRight" size={20} className="text-white" />
        </div>
      </div>
      <div className="mx-5 glass-card overflow-hidden mb-6">
        {settings.map((s, i) => (
          <button key={s.label}
            onClick={(s as typeof settings[0] & { action?: () => void }).action}
            className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-white/5 transition-colors"
            style={{ borderBottom: i < settings.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <Icon name={s.icon as "Bell" | "Shield" | "Globe" | "HelpCircle" | "LogOut"} size={17} className={s.danger ? "text-red-400" : "text-white/50"} />
            <span className={`${s.danger ? "text-red-400" : "text-white/80"} text-sm flex-1 text-left`}>{s.label}</span>
            {s.value && <span className="text-white/40 text-xs">{s.value}</span>}
            {!s.value && !s.danger && <Icon name="ChevronRight" size={15} className="text-white/30" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [screen, setScreen] = useState<Screen>("discover");
  const [chatId, setChatId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (authApi.isLoggedIn()) {
      authApi.me()
        .then((d) => setCurrentUser(d.user))
        .catch(() => {})
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleAuth = (user: User) => setCurrentUser(user);

  const handleLogout = async () => {
    await authApi.logout();
    setCurrentUser(null);
    setScreen("discover");
  };

  const mainScreens: Screen[] = ["discover", "matches", "likes", "profile"];
  const isMain = mainScreens.includes(screen);

  const openChat = (id: number) => { setChatId(id); setScreen("chat"); };
  const backToMatches = () => { setChatId(null); setScreen("matches"); };

  if (authLoading) {
    return (
      <div className="app-bg flex items-center justify-center" style={{ height: "100dvh" }}>
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-unbounded text-white text-2xl font-black grad-text">SPARK</h1>
          <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="app-bg flex justify-center">
        <div className="w-full max-w-sm relative z-10" style={{ height: "100dvh" }}>
          <AuthScreen onAuth={handleAuth} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg flex justify-center">
      <div className="w-full max-w-sm relative z-10 flex flex-col" style={{ height: "100dvh" }}>
        <div className="flex-1 overflow-hidden relative">
          {screen === "discover" && <RealDiscoverScreen currentUser={currentUser} onFilter={() => setScreen("filter")} />}
          {screen === "matches" && <RealMatchesScreen onChat={openChat} />}
          {screen === "likes" && <RealLikesScreen onPremium={() => setScreen("premium")} />}
          {screen === "profile" && <RealProfileScreen currentUser={currentUser} onPremium={() => setScreen("premium")} onLogout={handleLogout} />}
          {screen === "chat" && chatId && <RealChatScreen matchId={chatId} currentUserId={currentUser.id} onBack={backToMatches} />}
          {screen === "filter" && <FilterScreen onClose={() => setScreen("discover")} />}
          {screen === "premium" && <PremiumScreen onClose={() => setScreen("discover")} />}
        </div>
        {isMain && <BottomNav active={screen} onChange={setScreen} />}
      </div>
    </div>
  );
}