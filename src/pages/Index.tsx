import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { authApi, profilesApi, likesApi, matchesApi, messagesApi, postsApi, liveApi, type User, type Profile, type Match, type Message, type LikedBy, type Post, type PostComment, type LiveStream, type LiveMessage, type DiscoverParams } from "@/lib/api";

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
type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live";
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
function FilterScreen({ initial, onApply, onClose }: {
  initial: DiscoverParams;
  onApply: (p: DiscoverParams) => void;
  onClose: () => void;
}) {
  const [ageMin, setAgeMin] = useState(initial.age_min ?? 18);
  const [ageMax, setAgeMax] = useState(initial.age_max ?? 60);
  const [lookingFor, setLookingFor] = useState(initial.looking_for ?? "all");
  const [country, setCountry] = useState(initial.country ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [radius, setRadius] = useState(initial.radius_km ?? 0);
  const [useGeo, setUseGeo] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(
    initial.lat ? { lat: initial.lat, lon: initial.lon! } : null
  );
  const [onlineOnly, setOnlineOnly] = useState(initial.online_only ?? false);

  const genders = [
    { val: "female", label: "Девушек" },
    { val: "male", label: "Парней" },
    { val: "all", label: "Всех" },
  ];

  const requestGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGeoCoords({ lat, lon });
        setUseGeo(true);
        if (radius === 0) setRadius(50);
        // Обратное геокодирование через open API
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const data = await r.json();
          const c = data.address?.country || "";
          const ci = data.address?.city || data.address?.town || data.address?.village || "";
          if (c) setCountry(c);
          if (ci) setCity(ci);
          // Сохраняем в профиль
          profilesApi.updateGeo(lat, lon, c, ci).catch(() => {});
        } catch (e: unknown) { void e; }
        setGeoLoading(false);
      },
      () => setGeoLoading(false)
    );
  };

  const apply = () => {
    const p: DiscoverParams = { age_min: ageMin, age_max: ageMax, looking_for: lookingFor };
    if (city) p.city = city;
    if (country) p.country = country;
    if (onlineOnly) p.online_only = true;
    if (useGeo && geoCoords && radius > 0) {
      p.lat = geoCoords.lat;
      p.lon = geoCoords.lon;
      p.radius_km = radius;
    }
    onApply(p);
  };

  const reset = () => {
    setAgeMin(18); setAgeMax(60); setLookingFor("all");
    setCountry(""); setCity(""); setRadius(0);
    setUseGeo(false); setOnlineOnly(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-white font-golos font-bold text-xl">Фильтры</h2>
        <div className="flex items-center gap-3">
          <button onClick={reset} className="text-white/40 text-xs hover:text-white/70 transition-colors">Сбросить</button>
          <button onClick={onClose} className="text-white/50 hover:text-white"><Icon name="X" size={22} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-4 pb-4">
        {/* Возраст */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Возраст</span>
            <span className="text-white/60 text-sm">{ageMin} – {ageMax} лет</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-xs w-6">от</span>
              <input type="range" min={18} max={ageMax} value={ageMin}
                onChange={(e) => setAgeMin(+e.target.value)} className="flex-1 accent-pink-500" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-xs w-6">до</span>
              <input type="range" min={ageMin} max={80} value={ageMax}
                onChange={(e) => setAgeMax(+e.target.value)} className="flex-1 accent-pink-500" />
            </div>
          </div>
        </div>

        {/* Кого ищешь */}
        <div className="glass-card p-4">
          <span className="text-white font-semibold text-sm block mb-3">Кого ищешь</span>
          <div className="grid grid-cols-3 gap-2">
            {genders.map((g) => (
              <button key={g.val} onClick={() => setLookingFor(g.val)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={lookingFor === g.val
                  ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                  : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Только онлайн */}
        <button onClick={() => setOnlineOnly((v) => !v)}
          className="glass-card p-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-white font-semibold text-sm">Только онлайн</span>
          </div>
          <div className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
            style={{ background: onlineOnly ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
              style={{ left: onlineOnly ? "calc(100% - 22px)" : "2px" }} />
          </div>
        </button>

        {/* Страна и город */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <span className="text-white font-semibold text-sm flex items-center gap-2">
            <Icon name="Globe" size={15} className="text-white/50" />Местоположение
          </span>
          <input value={country} onChange={(e) => setCountry(e.target.value)}
            placeholder="Страна (например: Россия)"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
          <input value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="Город (например: Москва)"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
        </div>

        {/* Геолокация */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <Icon name="LocateFixed" size={15} className="text-white/50" />Рядом со мной
            </span>
            <button onClick={requestGeo} disabled={geoLoading}
              className="btn-grad px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50">
              {geoLoading
                ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Определяем...</>
                : geoCoords
                ? <><Icon name="Check" size={12} className="text-white" />Обновить</>
                : <><Icon name="Navigation" size={12} className="text-white" />Моя геопозиция</>}
            </button>
          </div>
          {geoCoords && (
            <>
              <button onClick={() => setUseGeo((v) => !v)}
                className="flex items-center justify-between w-full">
                <span className="text-white/60 text-xs">Использовать геопозицию</span>
                <div className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: useGeo ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                    style={{ left: useGeo ? "calc(100% - 18px)" : "2px" }} />
                </div>
              </button>
              {useGeo && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/50 text-xs">Радиус поиска</span>
                    <span className="text-white/70 text-xs font-semibold">{radius} км</span>
                  </div>
                  <input type="range" min={5} max={500} step={5} value={radius}
                    onChange={(e) => setRadius(+e.target.value)} className="w-full accent-pink-500" />
                  <div className="flex justify-between text-white/30 text-[10px] mt-1">
                    <span>5 км</span><span>500 км</span>
                  </div>
                </div>
              )}
            </>
          )}
          {!geoCoords && (
            <p className="text-white/30 text-xs">Разреши доступ к геолокации, чтобы искать людей рядом</p>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <button onClick={apply} className="btn-grad w-full py-3.5 text-base font-semibold">
          Применить фильтры
        </button>
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

// ─── Post Detail Modal ────────────────────────────────────────────────────────
function PostDetailModal({ post, currentUserId, onClose, onLike, onAuthorClick }: {
  post: Post; currentUserId: number; onClose: () => void;
  onLike: (post: Post) => void; onAuthorClick: () => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");

  useEffect(() => {
    postsApi.getComments(post.id)
      .then((r) => setComments(r.comments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [post.id]);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim(); setText("");
    try {
      const r = await postsApi.addComment(post.id, t);
      setComments((c) => [...c, r.comment]);
    } catch (e: unknown) { void e; }
  };

  const timeAgo = (dt: string) => {
    const d = (Date.now() - new Date(dt).getTime()) / 1000;
    if (d < 60) return "только что";
    if (d < 3600) return `${Math.floor(d / 60)} мин`;
    if (d < 86400) return `${Math.floor(d / 3600)} ч`;
    return `${Math.floor(d / 86400)} дн`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col" style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0", maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Автор */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onAuthorClick} className="flex items-center gap-3 flex-1">
            <img src={post.author_photo || PROFILES[0].photo} className="w-9 h-9 rounded-full object-cover" style={{ border: "2px solid rgba(255,45,120,0.5)" }} />
            <div className="text-left">
              <p className="text-white font-semibold text-sm">{post.author_name}</p>
              <p className="text-white/40 text-xs">{timeAgo(post.created_at)}</p>
            </div>
          </button>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><Icon name="X" size={20} /></button>
        </div>
        {/* Фото */}
        <img src={post.photo_url} className="w-full object-cover" style={{ maxHeight: 320 }} />
        {/* Лайки */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-4">
          <button onClick={() => onLike(post)} className="flex items-center gap-1.5 transition-all active:scale-90">
            <Icon name="Heart" size={22}
              style={{ color: post.liked_by_me ? "#FF2D78" : "rgba(255,255,255,0.5)", fill: post.liked_by_me ? "#FF2D78" : "transparent" }} />
            <span className="text-white/60 text-sm">{post.likes_count}</span>
          </button>
          <span className="flex items-center gap-1.5 text-white/40 text-sm">
            <Icon name="MessageCircle" size={20} />{comments.length}
          </span>
        </div>
        {post.caption && (
          <div className="px-4 pb-2">
            <span className="text-white font-semibold text-sm">{post.author_name} </span>
            <span className="text-white/70 text-sm">{post.caption}</span>
          </div>
        )}
        {/* Комментарии */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2 min-h-0">
          {loading && <p className="text-white/30 text-xs text-center py-3">Загружаем...</p>}
          {!loading && comments.length === 0 && <p className="text-white/30 text-xs text-center py-3">Пока нет комментариев</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <img src={c.author_photo || PROFILES[0].photo} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              <div className="glass-card px-3 py-1.5 flex-1">
                <span className="text-pink-400 text-xs font-semibold">{c.author_name} </span>
                <span className="text-white/80 text-xs">{c.text}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Ввод */}
        <div className="px-4 pb-5 pt-2 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Комментарий..." className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
          <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Profile Modal ────────────────────────────────────────────────────────
function UserProfileModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [data, setData] = useState<{ profile: Profile; posts: Post[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.getUserProfile(userId)
      .then((r) => setData(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--spark-dark)" }}>
      {/* Header */}
      <div className="flex items-center px-4 pt-5 pb-3">
        <button onClick={onClose} className="glass-card p-2 mr-3">
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
        <h2 className="text-white font-golos font-bold text-lg flex-1">Профиль</h2>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      )}

      {data && (
        <div className="flex-1 overflow-y-auto">
          {/* Шапка профиля */}
          <div className="flex flex-col items-center px-5 pb-5">
            <div className="relative mb-3">
              <img src={data.profile.photo_url || PROFILES[0].photo}
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: "3px solid rgba(255,45,120,0.6)", boxShadow: "0 0 24px rgba(255,45,120,0.25)" }} />
              {data.profile.online && (
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400"
                  style={{ border: "2px solid var(--spark-dark)" }} />
              )}
            </div>
            <h3 className="text-white font-golos font-bold text-xl">
              {data.profile.name}{data.profile.age ? `, ${data.profile.age}` : ""}
            </h3>
            {data.profile.city && <p className="text-white/50 text-sm mt-0.5 flex items-center gap-1"><Icon name="MapPin" size={13} />{data.profile.city}</p>}
            {data.profile.bio && <p className="text-white/70 text-sm mt-3 text-center px-4 leading-relaxed">{data.profile.bio}</p>}
            {data.profile.tags && data.profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {(data.profile.tags as string[]).map((tag) => (
                  <span key={tag} className="glass-card px-3 py-1 text-white/70 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-white font-bold text-lg">{data.posts.length}</p>
                <p className="text-white/40 text-xs">публикаций</p>
              </div>
            </div>
          </div>

          {/* Сетка фото */}
          {data.posts.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5">
              {data.posts.map((post) => (
                <div key={post.id} className="relative aspect-square overflow-hidden">
                  <img src={post.photo_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-end p-1.5 opacity-0 hover:opacity-100">
                    <span className="text-white text-xs flex items-center gap-1">❤️ {post.likes_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.posts.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="text-4xl">📷</div>
              <p className="text-white/30 text-sm">Нет публикаций</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Photos Screen ────────────────────────────────────────────────────────────
function PhotosScreen({ currentUser }: { currentUser: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [showCaptionFor, setShowCaptionFor] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    postsApi.getFeed()
      .then((d) => setPosts(d.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setShowCaptionFor(ev.target?.result as string); setCaption(""); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePublish = async () => {
    if (!showCaptionFor) return;
    setUploading(true);
    try {
      const mimeMatch = showCaptionFor.match(/data:(image\/\w+);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const res = await postsApi.create(showCaptionFor, mime, caption);
      setPosts((prev) => [{ ...res.post, author_name: currentUser.name, author_photo: currentUser.photo_url, likes_count: 0, liked_by_me: false, comments_count: 0 }, ...prev]);
      setShowCaptionFor(null); setCaption("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally { setUploading(false); }
  };

  const handleLike = async (post: Post) => {
    const res = await postsApi.like(post.id);
    const upd = (p: Post) => p.id === post.id ? { ...p, liked_by_me: res.liked, likes_count: res.likes_count } : p;
    setPosts((prev) => prev.map(upd));
    if (selectedPost?.id === post.id) setSelectedPost((p) => p ? upd(p) : p);
  };

  return (
    <>
      {/* Caption modal */}
      {showCaptionFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm animate-slide-up flex flex-col" style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0", maxHeight: "90dvh" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setShowCaptionFor(null)} className="text-white/50 text-sm">Отмена</button>
              <h3 className="text-white font-bold text-sm">Новое фото</h3>
              <button onClick={handlePublish} disabled={uploading} className="btn-grad px-4 py-1.5 text-sm">
                {uploading ? "..." : "Опубликовать"}
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <img src={showCaptionFor} className="w-full rounded-2xl object-cover max-h-64" />
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
                placeholder="Добавь подпись..." rows={3} maxLength={200}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos resize-none" />
            </div>
          </div>
        </div>
      )}

      {/* Post detail */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          currentUserId={currentUser.id}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          onAuthorClick={() => { setViewingUserId(selectedPost.user_id); }}
        />
      )}

      {/* User profile */}
      {viewingUserId && (
        <UserProfileModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-white font-golos font-bold text-2xl">Фото</h2>
            <p className="text-white/40 text-xs mt-0.5">{posts.length > 0 ? `${posts.length} публикаций` : "Лента"}</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="btn-grad w-10 h-10 rounded-full flex items-center justify-center">
            <Icon name="Plus" size={20} className="text-white" />
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-5xl">📸</div>
              <p className="text-white/50 text-sm text-center">Пока нет публикаций.<br />Нажми «+» и добавь первое фото!</p>
            </div>
          )}
          {posts.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => (
                <button key={post.id} onClick={() => setSelectedPost(post)}
                  className="relative aspect-square overflow-hidden group">
                  <img src={post.photo_url} className="w-full h-full object-cover transition-transform group-active:scale-95" />
                  {/* Оверлей при hover/tap */}
                  <div className="absolute inset-0 bg-black/0 group-active:bg-black/30 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-active:opacity-100">
                    <span className="text-white text-xs font-semibold">❤️ {post.likes_count}</span>
                  </div>
                  {/* Автор */}
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-4"
                    style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.55))" }}>
                    <img src={post.author_photo || PROFILES[0].photo} className="w-5 h-5 rounded-full object-cover" style={{ border: "1px solid rgba(255,255,255,0.4)" }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Live Screen ─────────────────────────────────────────────────────────────
function LiveScreen({ currentUser }: { currentUser: User }) {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false); // ведёт ли сам юзер
  const [chatMsgs, setChatMsgs] = useState<LiveMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [heartsAnim, setHeartsAnim] = useState<number[]>([]);
  const [showStart, setShowStart] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [lastMsgId, setLastMsgId] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Загрузка списка стримов
  const loadStreams = () => {
    liveApi.list()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStreams(); }, []);

  // Polling внутри стрима
  useEffect(() => {
    if (!activeStream) { if (pollRef.current) clearInterval(pollRef.current); return; }
    const poll = async () => {
      try {
        const res = await liveApi.poll(activeStream.id, lastMsgId);
        if (res.stream.status === 'ended' && !isStreaming) {
          setActiveStream(null); setChatMsgs([]); setLastMsgId(0);
          loadStreams(); return;
        }
        setActiveStream((prev) => prev ? { ...prev, viewers_count: res.stream.viewers_count, hearts_count: res.stream.hearts_count } : prev);
        if (res.messages.length > 0) {
          setChatMsgs((prev) => [...prev, ...res.messages]);
          setLastMsgId(res.messages[res.messages.length - 1].id);
        }
      } catch (e: unknown) { void e; }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeStream?.id, isStreaming]);

  const handleJoin = async (stream: LiveStream) => {
    setActiveStream(stream); setChatMsgs([]); setLastMsgId(0);
    try { await liveApi.join(stream.id); } catch (e: unknown) { void e; }
  };

  const handleLeave = async () => {
    if (!activeStream) return;
    if (isStreaming) {
      await liveApi.end();
      setIsStreaming(false);
    } else {
      try { await liveApi.leave(activeStream.id); } catch (e: unknown) { void e; }
    }
    setActiveStream(null); setChatMsgs([]); setLastMsgId(0);
    loadStreams();
  };

  const handleStartStream = async () => {
    if (!streamTitle.trim()) return;
    const res = await liveApi.start(streamTitle.trim());
    setIsStreaming(true);
    setActiveStream({ ...res.stream, author_name: currentUser.name, author_photo: currentUser.photo_url });
    setChatMsgs([]); setLastMsgId(0); setShowStart(false); setStreamTitle("");
  };

  const handleHeart = async () => {
    if (!activeStream) return;
    const id = Date.now();
    setHeartsAnim((prev) => [...prev, id]);
    setTimeout(() => setHeartsAnim((prev) => prev.filter((x) => x !== id)), 1500);
    try { const res = await liveApi.heart(activeStream.id); setActiveStream((prev) => prev ? { ...prev, hearts_count: res.hearts_count } : prev); }
    catch (e: unknown) { void e; }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeStream) return;
    const text = chatInput.trim(); setChatInput("");
    try {
      const res = await liveApi.chat(activeStream.id, text);
      setChatMsgs((prev) => [...prev, res.message]);
      setLastMsgId(res.message.id);
    } catch (e: unknown) { void e; }
  };

  // ── Внутри стрима ──────────────────────────────────────────────────────────
  if (activeStream) {
    return (
      <div className="flex flex-col h-full relative" style={{ background: "#0a0a0f" }}>
        {/* Фон стрима (заглушка — градиент) */}
        <div className="absolute inset-0" style={{
          background: isStreaming
            ? "linear-gradient(160deg, #1a0a20, #2d0a3d)"
            : "linear-gradient(160deg, #0a0a20, #0a1a2d)"
        }} />

        {/* Floating hearts */}
        {heartsAnim.map((id) => (
          <div key={id} className="absolute pointer-events-none z-30 text-2xl animate-fade-up"
            style={{ bottom: "30%", right: `${20 + Math.random() * 40}px`, animationDuration: "1.2s" }}>
            ❤️
          </div>
        ))}

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={handleLeave} className="glass-card p-2">
            <Icon name="ChevronLeft" size={20} className="text-white" />
          </button>
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white font-bold text-sm truncate">{activeStream.title}</span>
            </div>
            <p className="text-white/50 text-xs">{activeStream.author_name}</p>
          </div>
          <div className="flex items-center gap-3 text-white/70 text-xs">
            <span className="flex items-center gap-1"><Icon name="Eye" size={14} />{activeStream.viewers_count}</span>
            <span className="flex items-center gap-1">❤️ {activeStream.hearts_count}</span>
          </div>
        </div>

        {isStreaming && (
          <div className="relative z-10 mx-4 mb-2">
            <div className="glass-card px-3 py-1.5 text-center">
              <span className="text-white/60 text-xs">🎥 Ты в эфире · {activeStream.viewers_count} зрителей</span>
            </div>
          </div>
        )}

        {/* Чат */}
        <div className="relative z-10 flex-1 overflow-hidden flex flex-col justify-end px-4 pb-2">
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {chatMsgs.slice(-30).map((msg) => (
              <div key={msg.id} className="flex items-center gap-2">
                <img src={msg.author_photo || PROFILES[0].photo} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                <div className="glass-card px-2.5 py-1 max-w-[80%]">
                  <span className="text-pink-400 text-xs font-semibold">{msg.author_name} </span>
                  <span className="text-white text-xs">{msg.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 px-4 pb-5 flex items-center gap-3">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            placeholder="Написать в чат..."
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/15 focus:border-pink-500/50 font-golos"
          />
          <button onClick={handleSendChat} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={15} className="text-white" />
          </button>
          <button onClick={handleHeart}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl transition-all active:scale-75"
            style={{ background: "rgba(255,45,120,0.2)", border: "1px solid rgba(255,45,120,0.4)" }}>
            ❤️
          </button>
        </div>
      </div>
    );
  }

  // ── Список стримов ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Модал запуска стрима */}
      {showStart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm animate-slide-up flex flex-col"
            style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setShowStart(false)} className="text-white/50 text-sm">Отмена</button>
              <h3 className="text-white font-bold text-sm">Начать трансляцию</h3>
              <button onClick={handleStartStream} className="btn-grad px-4 py-1.5 text-sm">Эфир!</button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Тема трансляции..."
                maxLength={100}
                autoFocus
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos"
              />
              <p className="text-white/30 text-xs text-center">Нажми «Эфир!» и зрители смогут тебя найти</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-white font-golos font-bold text-2xl">Live</h2>
            <p className="text-white/40 text-xs mt-0.5">
              {streams.length > 0 ? `${streams.length} трансляций сейчас` : "Пока никто не в эфире"}
            </p>
          </div>
          <button onClick={() => setShowStart(true)} className="btn-grad px-4 py-2 flex items-center gap-2 text-sm font-semibold">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            В эфир
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-4">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && streams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-6xl">📡</div>
              <p className="text-white/50 text-sm text-center">Нет активных трансляций.<br />Нажми «В эфир» и начни первым!</p>
            </div>
          )}

          {streams.map((stream) => (
            <button key={stream.id} onClick={() => handleJoin(stream)}
              className="glass-card p-4 flex items-center gap-4 w-full text-left hover:bg-white/10 transition-all active:scale-[0.98]">
              {/* Аватар с live-кружком */}
              <div className="relative flex-shrink-0">
                <img src={stream.author_photo || PROFILES[0].photo} className="w-14 h-14 rounded-full object-cover"
                  style={{ boxShadow: "0 0 0 2px #FF2D78" }} />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                  style={{ background: "#FF2D78" }}>LIVE</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{stream.title}</p>
                <p className="text-white/50 text-xs mt-0.5">{stream.author_name}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-white/40 text-xs flex items-center gap-1">
                    <Icon name="Eye" size={12} />{stream.viewers_count}
                  </span>
                  <span className="text-white/40 text-xs">❤️ {stream.hearts_count}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                <Icon name="Play" size={14} className="text-white" style={{ marginLeft: 2 }} />
              </div>
            </button>
          ))}

          {/* Обновить */}
          {!loading && (
            <button onClick={loadStreams} className="text-white/30 text-xs text-center py-2 hover:text-white/60 transition-colors">
              Обновить список
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const items: { screen: Screen; icon: string; label: string }[] = [
    { screen: "discover", icon: "Flame", label: "Поиск" },
    { screen: "photos", icon: "Image", label: "Фото" },
    { screen: "live", icon: "Radio", label: "Live" },
    { screen: "matches", icon: "MessageCircle", label: "Чаты" },
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
            <Icon name={item.icon as "Flame" | "Image" | "Radio" | "MessageCircle" | "User"} size={22} />
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
// ─── Discover Profile Modal ───────────────────────────────────────────────────
function DiscoverProfileModal({ profile, onClose, onLike }: {
  profile: Profile; onClose: () => void; onLike: (p: Profile) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liked || liking) return;
    setLiking(true);
    try { await likesApi.send(profile.id); setLiked(true); } catch (e) { void e; }
    finally { setLiking(false); }
    onLike(profile);
  };

  const photo = profile.photo_url || PROFILES[0].photo;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--spark-dark)" }}>
      {/* Фото-шапка */}
      <div className="relative flex-shrink-0" style={{ height: "55dvh" }}>
        <img src={photo} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.8) 100%)" }} />
        {/* Кнопка назад */}
        <button onClick={onClose} className="absolute top-5 left-4 glass-card p-2">
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
        {/* Имя поверх фото */}
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-white font-golos font-bold text-2xl drop-shadow">
                {profile.name}{profile.age ? `, ${profile.age}` : ""}
                {profile.verified && <span className="ml-2 text-blue-400 text-lg">✓</span>}
              </h2>
              {profile.city && (
                <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
                  <Icon name="MapPin" size={13} />{profile.city}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {profile.online && <div className="w-2.5 h-2.5 rounded-full bg-green-400" />}
              <span className="text-white/60 text-xs">{profile.online ? "онлайн" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {profile.bio && (
          <div className="glass-card p-4">
            <p className="text-white/80 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.tags && (profile.tags as string[]).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(profile.tags as string[]).map((tag) => (
              <span key={tag} className="glass-card px-3 py-1.5 text-white/70 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="px-5 pb-6 pt-3 flex gap-3">
        <button onClick={onClose}
          className="flex-1 glass-card py-3.5 flex items-center justify-center gap-2 text-white/60 font-semibold text-sm">
          <Icon name="X" size={18} />Пропустить
        </button>
        <button onClick={handleLike} disabled={liked}
          className="flex-1 btn-grad py-3.5 flex items-center justify-center gap-2 font-semibold text-sm transition-all"
          style={{ opacity: liked ? 0.7 : 1 }}>
          <Icon name="Heart" size={18} className="text-white" />
          {liked ? "Лайкнуто!" : "Лайкнуть"}
        </button>
      </div>
    </div>
  );
}

function RealDiscoverScreen({ currentUser, onOpenFilter }: {
  currentUser: User;
  onOpenFilter: (filters: DiscoverParams, onApply: (p: DiscoverParams) => void) => void;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DiscoverParams>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((params: DiscoverParams, q?: string) => {
    setLoading(true);
    profilesApi.getDiscover({ ...params, ...(q !== undefined ? { search: q } : {}) })
      .then((d) => setProfiles(d.profiles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load({}); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(filters, val), 400);
  };

  const handleApplyFilters = (p: DiscoverParams) => {
    setFilters(p);
    const cnt = [p.looking_for && p.looking_for !== "all", p.age_min && p.age_min > 18,
      p.age_max && p.age_max < 80, p.country, p.city, p.online_only, p.radius_km].filter(Boolean).length;
    setActiveFiltersCount(cnt);
    load(p, search);
  };

  const handleLike = useCallback((p: Profile) => {
    setLikedIds((prev) => new Set([...prev, p.id]));
  }, []);

  return (
    <>
      {selected && (
        <DiscoverProfileModal profile={selected} onClose={() => setSelected(null)} onLike={handleLike} />
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h1 className="font-unbounded text-white text-xl font-black grad-text">SPARK</h1>
          <button
            onClick={() => onOpenFilter(filters, handleApplyFilters)}
            className="relative glass-card px-3 py-2 flex items-center gap-2 text-white/80 text-sm">
            <Icon name="SlidersHorizontal" size={15} />Фильтры
            {activeFiltersCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
                {activeFiltersCount}
              </div>
            )}
          </button>
        </div>

        {/* Поиск */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Поиск по имени..."
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Активные фильтры-теги */}
        {(filters.city || filters.country || filters.online_only || filters.radius_km) && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {filters.online_only && <span className="glass-card px-2.5 py-1 text-green-400 text-xs flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" />Онлайн</span>}
            {filters.city && <span className="glass-card px-2.5 py-1 text-white/60 text-xs flex items-center gap-1"><Icon name="MapPin" size={10} />{filters.city}</span>}
            {filters.country && !filters.city && <span className="glass-card px-2.5 py-1 text-white/60 text-xs flex items-center gap-1"><Icon name="Globe" size={10} />{filters.country}</span>}
            {filters.radius_km && <span className="glass-card px-2.5 py-1 text-white/60 text-xs flex items-center gap-1"><Icon name="Navigation" size={10} />{filters.radius_km} км</span>}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              <p className="text-white/40 text-sm">Ищем анкеты...</p>
            </div>
          )}
          {!loading && profiles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
              <div className="text-6xl">🔍</div>
              <p className="text-white/60 text-center text-sm">
                {search ? `Никого не найдено по запросу «${search}»` : "Никого не найдено.\nПопробуй изменить фильтры."}
              </p>
              <button className="btn-grad px-6 py-3 text-sm" onClick={() => { setSearch(""); setFilters({}); setActiveFiltersCount(0); load({}); }}>
                Сбросить фильтры
              </button>
            </div>
          )}
          {!loading && profiles.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5">
              {profiles.map((p) => {
                const photo = p.photo_url || PROFILES[0].photo;
                const isLiked = likedIds.has(p.id);
                return (
                  <button key={p.id} onClick={() => setSelected(p)}
                    className="relative aspect-square overflow-hidden group">
                    <img src={photo} className="w-full h-full object-cover transition-transform group-active:scale-95" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.75) 100%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
                      <p className="text-white text-[10px] font-semibold truncate leading-tight">
                        {p.name}{p.age ? `, ${p.age}` : ""}
                      </p>
                      {(p as Profile & { distance_km?: number }).distance_km !== undefined && (
                        <p className="text-white/50 text-[9px]">{(p as Profile & { distance_km?: number }).distance_km} км</p>
                      )}
                    </div>
                    {p.online && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400"
                        style={{ border: "1.5px solid rgba(0,0,0,0.5)" }} />
                    )}
                    {isLiked && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,45,120,0.9)" }}>
                        <Icon name="Heart" size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
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
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesApi.getByMatch(matchId)
      .then((d) => { setMsgs(d.messages); setTimeout(() => bottomRef.current?.scrollIntoView(), 50); })
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
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) { void e; }
  };

  const handleDelete = async (msg: Message) => {
    setContextMsg(null);
    setDeleting(msg.id);
    try {
      await messagesApi.delete(msg.id);
      setMsgs((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (e) { void e; }
    finally { setDeleting(null); }
  };

  // Долгий тап — показываем меню для любого сообщения в чате
  const startHold = (msg: Message) => {
    holdTimer.current = setTimeout(() => {
      setContextMsg(msg);
      navigator.vibrate?.(30);
    }, 450);
  };
  const cancelHold = () => { if (holdTimer.current) clearTimeout(holdTimer.current); };

  return (
    <>
      {/* Контекстное меню удаления */}
      {contextMsg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setContextMsg(null)}>
          <div className="w-full max-w-sm animate-slide-up"
            style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Превью сообщения */}
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/40 text-xs mb-1.5">Сообщение</p>
              <p className="text-white/80 text-sm line-clamp-3">{contextMsg.text}</p>
            </div>
            {/* Действия */}
            <button
              onClick={() => handleDelete(contextMsg)}
              className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,45,78,0.15)" }}>
                <Icon name="Trash2" size={18} style={{ color: "#FF2D4E" }} />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-sm">Удалить сообщение</p>
                <p className="text-white/30 text-xs">Удалится у обоих участников</p>
              </div>
            </button>
            <button
              onClick={() => { navigator.clipboard?.writeText(contextMsg.text); setContextMsg(null); }}
              className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <Icon name="Copy" size={18} className="text-white/60" />
              </div>
              <p className="text-white/80 font-semibold text-sm">Скопировать текст</p>
            </button>
            <div className="px-5 pb-6 pt-1">
              <button onClick={() => setContextMsg(null)}
                className="w-full glass-card py-3 text-white/50 text-sm font-medium">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Шапка */}
        <div className="flex items-center gap-3 px-4 py-3 relative z-10"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
            <Icon name="ChevronLeft" size={24} />
          </button>
          <img src={partnerPhoto} className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{partnerName}</p>
            <p className="text-white/40 text-xs">Удержи сообщение для удаления</p>
          </div>
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-white/40 text-sm">Начни общение первым! 👋</p>
            </div>
          )}
          {msgs.map((msg) => (
            <div key={msg.id}
              className={`flex flex-col ${msg.out ? "items-end" : "items-start"} ${deleting === msg.id ? "opacity-30" : ""} transition-opacity`}
              onMouseDown={() => startHold(msg)}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={() => startHold(msg)}
              onTouchEnd={cancelHold}
              onTouchMove={cancelHold}>
              <div className={`${msg.out ? "msg-bubble-out" : "msg-bubble-in"} select-none`}
                style={{ cursor: "pointer" }}>
                {msg.text}
              </div>
              <span className="text-white/30 text-[11px] mt-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Ввод */}
        <div className="px-4 py-3 flex items-center gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Написать..."
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
          <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={16} className="text-white" />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
const ALL_INTERESTS = ["Путешествия", "Спорт", "Кино", "Музыка", "Кулинария", "Фотография", "Йога", "Искусство", "Книги", "Танцы", "Природа", "IT", "Кофе", "Игры", "Животные", "Фитнес"];

function EditProfileModal({ user, onSave, onClose }: {
  user: User;
  onSave: (updated: Partial<User>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [age, setAge] = useState(String(user.age || ""));
  const [city, setCity] = useState(user.city || "");
  const [bio, setBio] = useState(user.bio || "");
  const [gender, setGender] = useState(user.gender || "other");
  const [tags, setTags] = useState<string[]>(user.tags || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (t: string) =>
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Введи имя"); return; }
    setError("");
    setSaving(true);
    const payload: Partial<User> = {
      name: name.trim(),
      age: age ? Number(age) : undefined,
      city: city.trim(),
      bio: bio.trim(),
      gender,
      tags,
    };
    try {
      await profilesApi.updateMe(payload);
      onSave(payload);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm flex flex-col animate-slide-up"
        style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0", maxHeight: "92dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-sm">Отмена</button>
          <h3 className="text-white font-golos font-bold text-base">Редактировать профиль</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-grad px-4 py-1.5 text-sm"
          >
            {saving ? "..." : "Сохранить"}
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4 pb-8">
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 rounded-2xl py-2 px-4">{error}</div>
          )}

          {/* Имя */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Твоё имя"
              maxLength={50}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos"
            />
          </div>

          {/* Возраст + Город */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Возраст</label>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="25"
                type="number"
                min={18}
                max={99}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Город</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Москва"
                maxLength={60}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos"
              />
            </div>
          </div>

          {/* Пол */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Я</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "female", label: "Девушка" },
                { value: "male", label: "Парень" },
                { value: "other", label: "Другое" },
              ].map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className="py-2.5 rounded-2xl text-sm font-medium transition-all"
                  style={gender === g.value
                    ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* О себе */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">О себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажи о себе — это привлечёт больше симпатий!"
              maxLength={300}
              rows={4}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos resize-none"
            />
            <p className="text-white/30 text-xs text-right mt-1">{bio.length}/300</p>
          </div>

          {/* Интересы */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">
              Интересы <span className="text-white/30 normal-case">(выбрано {tags.length})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={tags.includes(t)
                    ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Real Profile ─────────────────────────────────────────────────────────────
function RealProfileScreen({ currentUser, onPremium, onLogout, onPhotoUpdate, onProfileUpdate }: {
  currentUser: User;
  onPremium: () => void;
  onLogout: () => void;
  onPhotoUpdate: (url: string) => void;
  onProfileUpdate: (data: Partial<User>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [localPhoto, setLocalPhoto] = useState(currentUser.photo_url || "");
  const [editOpen, setEditOpen] = useState(false);

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    if (!file.type.startsWith("image/")) { setPhotoError("Выбери изображение"); return; }
    if (file.size > 10 * 1024 * 1024) { setPhotoError("Файл слишком большой (макс. 10 МБ)"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setLocalPhoto(base64);
      setPhotoUploading(true);
      try {
        const res = await profilesApi.uploadPhoto(base64, file.type);
        setLocalPhoto(res.photo_url);
        onPhotoUpdate(res.photo_url);
      } catch (err: unknown) {
        setPhotoError(err instanceof Error ? err.message : "Ошибка загрузки");
        setLocalPhoto(currentUser.photo_url || "");
      } finally {
        setPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const settings = [
    { icon: "Bell", label: "Уведомления", value: "Включены", danger: false },
    { icon: "Shield", label: "Приватность", value: "Стандартная", danger: false },
    { icon: "Globe", label: "Язык", value: "Русский", danger: false },
    { icon: "HelpCircle", label: "Поддержка", value: "", danger: false },
    { icon: "LogOut", label: "Выйти", value: "", danger: true, action: onLogout },
  ];

  const displayPhoto = localPhoto || PROFILES[0].photo;

  return (
    <>
      {editOpen && (
        <EditProfileModal
          user={currentUser}
          onSave={onProfileUpdate}
          onClose={() => setEditOpen(false)}
        />
      )}

      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-white font-golos font-bold text-2xl">Профиль</h2>
          <button
            onClick={() => setEditOpen(true)}
            className="glass-card px-3 py-1.5 flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors"
          >
            <Icon name="Pencil" size={14} />
            Изменить
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

        <div className="flex flex-col items-center px-5 mb-5">
          <div className="relative mb-3" onClick={handlePhotoClick} style={{ cursor: "pointer" }}>
            <img
              src={displayPhoto}
              className="w-24 h-24 rounded-full object-cover transition-opacity"
              style={{ boxShadow: "0 0 0 3px #FF2D78", opacity: photoUploading ? 0.5 : 1 }}
            />
            {photoUploading ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center btn-grad">
                <Icon name="Camera" size={13} className="text-white" />
              </div>
            )}
          </div>
          {photoError && <p className="text-red-400 text-xs mb-1 text-center">{photoError}</p>}

          <h3 className="text-white font-bold text-xl mt-1">
            {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ""}
          </h3>
          <p className="text-white/50 text-sm flex items-center gap-1 mt-0.5">
            <Icon name="MapPin" size={13} />{currentUser.city || "Город не указан"}
          </p>

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

        {/* О себе */}
        <div className="mx-5 glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-xs uppercase tracking-widest">О себе</span>
            <button onClick={() => setEditOpen(true)} className="text-white/40 hover:text-white transition-colors">
              <Icon name="Pencil" size={14} />
            </button>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            {currentUser.bio || (
              <span className="text-white/30 italic">Расскажи о себе — нажми «Изменить»</span>
            )}
          </p>
          {(currentUser.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(currentUser.tags || []).map((t) => <span key={t} className="tag-pill">{t}</span>)}
            </div>
          )}
          {!(currentUser.tags || []).length && (
            <button onClick={() => setEditOpen(true)} className="tag-pill border-dashed opacity-50 mt-3">
              + Добавить интересы
            </button>
          )}
        </div>

        {/* Premium */}
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

        {/* Settings */}
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
    </>
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

  const handlePhotoUpdate = (url: string) => {
    setCurrentUser((u) => u ? { ...u, photo_url: url } : u);
  };

  const handleProfileUpdate = (data: Partial<User>) => {
    setCurrentUser((u) => u ? { ...u, ...data } : u);
  };

  const mainScreens: Screen[] = ["discover", "photos", "live", "matches", "likes", "profile"];
  const isMain = mainScreens.includes(screen);

  const openChat = (id: number) => { setChatId(id); setScreen("chat"); };
  const backToMatches = () => { setChatId(null); setScreen("matches"); };

  // Фильтры для Discover — передаём через ref чтобы не терять при переходе
  const filterParamsRef = useRef<DiscoverParams>({});
  const filterCallbackRef = useRef<((p: DiscoverParams) => void) | null>(null);
  const handleOpenFilter = (current: DiscoverParams, cb: (p: DiscoverParams) => void) => {
    filterParamsRef.current = current;
    filterCallbackRef.current = cb;
    setScreen("filter");
  };

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
          {screen === "discover" && <RealDiscoverScreen currentUser={currentUser} onOpenFilter={handleOpenFilter} />}
          {screen === "photos" && <PhotosScreen currentUser={currentUser} />}
          {screen === "live" && <LiveScreen currentUser={currentUser} />}
          {screen === "matches" && <RealMatchesScreen onChat={openChat} />}
          {screen === "likes" && <RealLikesScreen onPremium={() => setScreen("premium")} />}
          {screen === "profile" && <RealProfileScreen currentUser={currentUser} onPremium={() => setScreen("premium")} onLogout={handleLogout} onPhotoUpdate={handlePhotoUpdate} onProfileUpdate={handleProfileUpdate} />}
          {screen === "chat" && chatId && <RealChatScreen matchId={chatId} currentUserId={currentUser.id} onBack={backToMatches} />}
          {screen === "filter" && (
            <FilterScreen
              initial={filterParamsRef.current}
              onApply={(p) => { filterCallbackRef.current?.(p); setScreen("discover"); }}
              onClose={() => setScreen("discover")}
            />
          )}
          {screen === "premium" && <PremiumScreen onClose={() => setScreen("discover")} />}
        </div>
        {isMain && <BottomNav active={screen} onChange={setScreen} />}
      </div>
    </div>
  );
}