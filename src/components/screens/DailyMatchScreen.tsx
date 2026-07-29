import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, likesApi, type DailyMatch } from "@/lib/api";
import { trackTask } from "@/lib/trackTask";

const DEFAULT_AVATAR = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png";

export function DailyMatchScreen({ onClose, onOpenChat }: { onClose: () => void; onOpenChat?: (matchId: number) => void }) {
  const [matches, setMatches] = useState<DailyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [liking, setLiking] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    profilesApi.dailyMatch()
      .then(d => setMatches(d.matches || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    trackTask("open_daily_match");
  }, []);

  const current = matches[idx];

  const handleLike = async () => {
    if (!current || liking || likedIds.has(current.id)) return;
    setLiking(true);
    try {
      const res = await likesApi.send(current.id);
      trackTask("send_likes");
      setLikedIds(prev => new Set([...prev, current.id]));
      if (res.match && res.match_id && onOpenChat) {
        window.dispatchEvent(new CustomEvent("app:match"));
      }
    } catch { /* ignore */ } finally { setLiking(false); }
    setTimeout(() => { if (idx < matches.length - 1) setIdx(i => i + 1); }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "linear-gradient(180deg,#1a0f2e 0%,#140b22 60%,#0e0818 100%)" }}>
      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-lg leading-tight flex items-center gap-1.5">
            <Icon name="Sparkles" size={17} className="text-amber-300" /> Знакомство дня
          </h1>
          <p className="text-white/45 text-xs">Подобрано для тебя искусственным интеллектом</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Icon name="Loader2" size={30} className="animate-spin text-white/40" />
        </div>
      ) : !current ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5 animate-in fade-in duration-500">
          <div className="relative">
            {/* Мягкое свечение */}
            <div className="absolute inset-0 rounded-full blur-2xl opacity-60"
              style={{ background: "radial-gradient(circle,#FF2D78,transparent 70%)" }} />
            {/* Пульсирующее кольцо */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }} />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.18))",
                border: "1px solid rgba(255,45,120,0.35)",
                boxShadow: "0 8px 32px rgba(255,45,120,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}>
              <Icon name="Sparkles" size={38} style={{ color: "#fff" }} />
            </div>
            {/* Искорки */}
            <Icon name="Star" size={16} className="absolute -top-1 -right-1 text-pink-400 animate-pulse" />
            <Icon name="Heart" size={12} className="absolute bottom-1 -left-2 text-purple-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base">На сегодня всё</p>
            <p className="text-white/40 text-sm mt-1">Возвращайся завтра — ИИ подберёт<br />новых людей специально для тебя</p>
          </div>
          <button onClick={onClose} className="px-6 py-2.5 rounded-2xl text-white text-sm font-bold active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>Хорошо</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-4 pb-5 overflow-y-auto">
          {/* Индикатор */}
          {matches.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {matches.map((_, i) => (
                <span key={i} className="h-1 rounded-full transition-all"
                  style={{ width: i === idx ? 22 : 7, background: i === idx ? "#FF2D78" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
          )}

          {/* Карточка */}
          <div className="relative rounded-3xl overflow-hidden flex-1 min-h-[380px]"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
            <img src={current.photo_url || DEFAULT_AVATAR} alt={current.name}
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,rgba(10,6,18,0.5) 70%,rgba(10,6,18,0.96) 100%)" }} />

            {/* Бейдж совместимости */}
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-2xl flex items-center gap-1.5"
              style={{ background: "rgba(255,45,120,0.9)", backdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(255,45,120,0.5)" }}>
              <Icon name="Heart" size={13} className="text-white" />
              <span className="text-white font-black text-sm">{current.score}%</span>
            </div>

            {/* Инфо */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="text-white font-black text-2xl leading-none">{current.name}{current.age ? `, ${current.age}` : ""}</h2>
                {current.verified && <Icon name="BadgeCheck" size={20} className="text-sky-400" />}
              </div>
              {current.city && (
                <p className="text-white/70 text-sm flex items-center gap-1 mb-2">
                  <Icon name="MapPin" size={13} /> {current.city}
                </p>
              )}
              {/* Почему подобрали */}
              <div className="rounded-2xl px-3 py-2 mb-2 flex items-start gap-2"
                style={{ background: "rgba(255,193,7,0.14)", border: "1px solid rgba(255,193,7,0.3)" }}>
                <Icon name="Sparkles" size={14} className="text-amber-300 mt-0.5 flex-shrink-0" />
                <p className="text-white/90 text-xs font-medium leading-snug">{current.reason}</p>
              </div>
              {current.tags && current.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {current.tags.slice(0, 4).map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
                      style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => { if (idx < matches.length - 1) setIdx(i => i + 1); else onClose(); }}
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              <Icon name="X" size={22} className="text-white/70" />
            </button>
            <button onClick={handleLike} disabled={liking || likedIds.has(current.id)}
              className="flex-1 h-14 rounded-full flex items-center justify-center gap-2 text-white font-black active:scale-[0.98] transition-all disabled:opacity-70"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 6px 24px rgba(255,45,120,0.5)" }}>
              {likedIds.has(current.id)
                ? <><Icon name="Check" size={20} /> Лайк отправлен</>
                : liking ? <Icon name="Loader2" size={20} className="animate-spin" />
                : <><Icon name="Heart" size={20} /> Нравится</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyMatchScreen;