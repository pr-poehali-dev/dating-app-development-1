import { useEffect, useRef, useState } from "react";
import { StoryViewer, type StoryGroup } from "./StoryViewer";
import Icon from "@/components/ui/icon";

const STORIES_URL = "https://functions.poehali.dev/bb965e64-26b6-440e-9d6d-c746aa07b497";
const CARD_W = 104;
const CARD_H = 168;

export function StoriesBar({ currentUserId, currentUserPhoto, onAddStory, refreshKey }: {
  currentUserId?: number;
  currentUserPhoto?: string | null;
  onAddStory?: () => void;
  refreshKey?: number;
}) {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(STORIES_URL)
      .then(r => r.json())
      .then(d => setGroups(d.groups || []))
      .catch(() => {});
    const saved = JSON.parse(localStorage.getItem("seen_stories") || "[]");
    setSeen(new Set(saved));
  }, [refreshKey]);

  const markSeen = (groupIdx: number) => {
    const g = groups[groupIdx];
    if (!g) return;
    const ids = g.stories.map(s => s.id);
    setSeen(prev => {
      const next = new Set([...prev, ...ids]);
      localStorage.setItem("seen_stories", JSON.stringify([...next]));
      return next;
    });
  };

  const isSeen = (g: StoryGroup) => g.stories.every(s => seen.has(s.id));

  if (groups.length === 0 && !onAddStory) return null;

  return (
    <>
      <div ref={scrollRef}
        className="flex gap-3 px-4 pt-4 pb-3 overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}>

        {/* Добавить свою историю */}
        {onAddStory && (
          <button
            onClick={onAddStory}
            className="relative flex-shrink-0 rounded-2xl overflow-hidden active:scale-95 transition-transform"
            style={{ width: CARD_W, height: CARD_H, scrollSnapAlign: "start" }}>
            {currentUserPhoto ? (
              <img src={currentUserPhoto} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#2a2338,#1a1625)" }} />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.3) 100%)" }} />
            <div className="absolute top-2.5 left-2.5 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF6B35,#FF2D78)", border: "2.5px solid #1a1625", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }}>
              <Icon name="Camera" size={17} className="text-white" />
            </div>
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <p className="text-white text-[12px] font-bold truncate">Моя история</p>
            </div>
          </button>
        )}

        {/* Истории пользователей */}
        {groups.map((g, i) => {
          const wasSeen = isSeen(g);
          return (
            <button
              key={g.user_id}
              onClick={() => { setViewIdx(i); markSeen(i); }}
              className="relative flex-shrink-0 rounded-2xl overflow-hidden active:scale-95 transition-transform"
              style={{ width: CARD_W, height: CARD_H, scrollSnapAlign: "start" }}>
              {g.avatar ? (
                <img src={g.avatar} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl">
                  {g.user_name[0]}
                </div>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.22) 100%)" }} />

              {/* Аватар с кольцом в углу */}
              <div className="absolute top-2.5 left-2.5 w-9 h-9 rounded-xl"
                style={{
                  padding: 2,
                  background: wasSeen ? "rgba(255,255,255,0.25)" : "linear-gradient(135deg,#FF2D78,#FF6B35,#FFD700,#9B59B6)",
                  boxShadow: wasSeen ? "none" : "0 0 10px rgba(255,45,120,0.5)",
                }}>
                <div className="w-full h-full rounded-[9px] overflow-hidden" style={{ border: "1.5px solid #1a1625" }}>
                  {g.avatar
                    ? <img src={g.avatar} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-[11px]">{g.user_name[0]}</div>
                  }
                </div>
              </div>

              {/* Счётчик историй */}
              {g.stories.length > 1 && (
                <div className="absolute top-2.5 right-2.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)", fontSize: 9, fontWeight: 800, color: "white" }}>
                  {g.stories.length}
                </div>
              )}

              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <p className={`text-[12px] font-bold truncate ${wasSeen ? "text-white/50" : "text-white"}`}>{g.user_name}</p>
              </div>
            </button>
          );
        })}
      </div>

      {(groups.length > 0 || onAddStory) && (
        <div className="mx-4 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />
      )}

      {viewIdx !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewIdx}
          currentUserId={currentUserId}
          onClose={() => setViewIdx(null)}
        />
      )}
    </>
  );
}
