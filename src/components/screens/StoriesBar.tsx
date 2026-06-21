import { useEffect, useRef, useState } from "react";
import { StoryViewer, type StoryGroup } from "./StoryViewer";
import Icon from "@/components/ui/icon";

const STORIES_URL = "https://functions.poehali.dev/bb965e64-26b6-440e-9d6d-c746aa07b497";

export function StoriesBar({ currentUserId, onAddStory, refreshKey }: {
  currentUserId?: number;
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
        className="flex gap-4 px-4 pt-4 pb-3 overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}>

        {/* Добавить свою историю */}
        {onAddStory && (
          <button
            disabled
            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-not-allowed"
            style={{ scrollSnapAlign: "start" }}>
            <div className="relative opacity-50">
              <div className="w-[62px] h-[62px] rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  padding: "2px",
                }}>
                <div className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ background: "#1a1625" }}>
                  <Icon name="Clock" size={22} className="text-white/60" />
                </div>
              </div>
            </div>
            <span className="text-white/40 text-[10px] font-medium w-[64px] text-center leading-tight">Скоро в обновлении</span>
          </button>
        )}

        {/* Истории пользователей */}
        {groups.map((g, i) => {
          const wasSeen = isSeen(g);
          return (
            <button
              key={g.user_id}
              onClick={() => { setViewIdx(i); markSeen(i); }}
              className="flex-shrink-0 flex flex-col items-center gap-2"
              style={{ scrollSnapAlign: "start" }}>
              <div className="relative">
                {/* Кольцо вокруг аватара */}
                <div className="w-[62px] h-[62px] rounded-full"
                  style={{
                    padding: "2.5px",
                    background: wasSeen
                      ? "rgba(255,255,255,0.12)"
                      : "linear-gradient(135deg, #FF2D78, #FF6B35, #FFD700, #9B59B6)",
                    boxShadow: wasSeen ? "none" : "0 0 12px rgba(255,45,120,0.35)",
                  }}>
                  <div className="w-full h-full rounded-full overflow-hidden"
                    style={{ border: "2px solid #1a1625" }}>
                    {g.avatar
                      ? <img src={g.avatar} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-base">
                          {g.user_name[0]}
                        </div>
                    }
                  </div>
                </div>
                {/* Счётчик историй */}
                <div className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                  style={{
                    background: wasSeen ? "rgba(255,255,255,0.18)" : "linear-gradient(135deg,#FF2D78,#9B59B6)",
                    border: "2px solid #1a1625",
                    fontSize: 8,
                    fontWeight: 800,
                    color: "white",
                  }}>
                  {g.stories.length}
                </div>
              </div>
              <span className={`text-[10px] font-medium w-[62px] text-center truncate leading-tight ${wasSeen ? "text-white/35" : "text-white/80"}`}>
                {g.user_name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Разделитель */}
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