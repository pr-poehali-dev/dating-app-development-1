import { useEffect, useRef, useState } from "react";
import { StoryViewer, type StoryGroup } from "./StoryViewer";
import Icon from "@/components/ui/icon";

const STORIES_URL = "https://functions.poehali.dev/bb965e64-26b6-440e-9d6d-c746aa07b497";

export function StoriesBar({ currentUserId, onAddStory }: {
  currentUserId?: number;
  onAddStory?: () => void;
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
  }, []);

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
      <div ref={scrollRef} className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
        {/* Кнопка добавить свою историю */}
        {onAddStory && (
          <button
            onClick={onAddStory}
            className="flex-shrink-0 flex flex-col items-center gap-1.5"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", padding: "2px" }}>
              <div className="w-full h-full rounded-full bg-[#1a1625] flex items-center justify-center">
                <Icon name="Plus" size={22} className="text-white" />
              </div>
            </div>
            <span className="text-white/60 text-[10px] font-medium w-16 text-center truncate">Моя история</span>
          </button>
        )}

        {/* Истории пользователей */}
        {groups.map((g, i) => {
          const seen_ = isSeen(g);
          return (
            <button
              key={g.user_id}
              onClick={() => { setViewIdx(i); markSeen(i); }}
              className="flex-shrink-0 flex flex-col items-center gap-1.5"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="relative w-16 h-16 rounded-full"
                style={{
                  padding: "2px",
                  background: seen_
                    ? "rgba(255,255,255,0.15)"
                    : "linear-gradient(135deg,#FF2D78,#FF6B35,#FFD700,#9B59B6)",
                }}>
                {g.avatar
                  ? <img src={g.avatar} className="w-full h-full rounded-full object-cover" />
                  : <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">{g.user_name[0]}</div>
                }
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#FF2D78] border-2 border-[#1a1625] flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">{g.stories.length}</span>
                </div>
              </div>
              <span className="text-white/80 text-[10px] font-medium w-16 text-center truncate">{g.user_name}</span>
            </button>
          );
        })}
      </div>

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
