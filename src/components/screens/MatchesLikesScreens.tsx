import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { matchesApi, likesApi, type Match, type LikedBy } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ─── RealMatchesScreen ────────────────────────────────────────────────────────
export function RealMatchesScreen({ onChat }: { onChat: (matchId: number) => void }) {
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
    <div className="flex flex-col h-full items-center justify-center gap-4 px-8 text-center">
      <div className="text-6xl">💬</div>
      <p className="text-white/50 text-sm">Пока нет совпадений.<br />Лайкай анкеты — и скоро появятся!</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white font-golos font-bold text-2xl">Сообщения</h2>
      </div>
      <div className="px-5 flex-1">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Сообщения</p>
        <div className="flex flex-col gap-1">
          {matches.map((m) => (
            <button key={m.match_id} onClick={() => onChat(m.match_id)}
              className="glass-card p-4 flex items-center gap-3 w-full text-left hover:bg-white/10 transition-all">
              <div className="relative flex-shrink-0">
                <img src={m.photo_url || FALLBACK_PHOTO} className="w-12 h-12 rounded-full object-cover" />
                {m.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: "var(--spark-dark)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">{m.name}{m.age ? `, ${m.age}` : ""}</span>
                  <span className="text-white/40 text-xs">{m.last_msg_time ? new Date(m.last_msg_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                </div>
                <p className="text-white/50 text-sm truncate mt-0.5">
                  {!m.last_msg
                    ? "Совпадение! Напиши первым 👋"
                    : m.last_msg.startsWith("__AUDIO__")
                      ? "🎤 Голосовое сообщение"
                      : m.last_msg.startsWith("__VANISH__") || m.last_msg.match(/\.(jpg|jpeg|png|gif|webp)/i)
                        ? "📷 Фото"
                        : m.last_msg === "__REQUEST_PHOTO__"
                          ? "🔐 Запрос доступа к фото"
                          : m.last_msg === "__GRANT_PHOTO__"
                            ? "🖼️ Открыт доступ к фото"
                            : m.last_msg.startsWith("__LOC__")
                              ? "📍 Геолокация"
                              : m.last_msg.startsWith("__GIFT__")
                                ? "🎁 Подарок"
                                : m.last_msg}
                </p>
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

// ─── RealLikesScreen ──────────────────────────────────────────────────────────
export function RealLikesScreen({ onPremium }: { onPremium: () => void }) {
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
              <span className="text-white font-bold text-base">LoveBloom Premium</span>
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
              <img src={p.photo_url || FALLBACK_PHOTO} className="w-full h-full object-cover"
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
              <div style={{ display: "none" }}>{i}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}