import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const STORIES_URL = "https://functions.poehali.dev/bb965e64-26b6-440e-9d6d-c746aa07b497";

export interface StoryGroup {
  user_id: number;
  user_name: string;
  avatar: string | null;
  stories: { id: number; video_url: string; duration: number; views: number; created_at: string; expires_at: string }[];
}

export function StoryViewer({ groups, initialGroupIndex = 0, onClose, currentUserId }: {
  groups: StoryGroup[];
  initialGroupIndex?: number;
  onClose: () => void;
  currentUserId?: number;
}) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 15000;

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  useEffect(() => {
    if (!story) return;
    setProgress(0);
    fetch(`${STORIES_URL}?view=${story.id}`).catch(() => {});
  }, [groupIdx, storyIdx]);

  useEffect(() => {
    if (!story || paused) { clearInterval(intervalRef.current!); return; }
    const start = Date.now() - (progress / 100) * DURATION;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) goNext();
    }, 50);
    return () => clearInterval(intervalRef.current!);
  }, [groupIdx, storyIdx, paused]);

  const goNext = () => {
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(i => i - 1);
      setStoryIdx(0);
    }
  };

  if (!group || !story) return null;

  const isOwn = currentUserId === group.user_id;
  const timeLeft = (() => {
    const exp = new Date(story.expires_at);
    const diff = exp.getTime() - Date.now();
    const h = Math.floor(diff / 3600000);
    return h > 0 ? `${h} ч` : `${Math.floor(diff / 60000)} мин`;
  })();

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" style={{ touchAction: "none" }}>
      {/* Прогресс-бары */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-3">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Шапка */}
      <div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-4 pt-2">
        <div className="flex items-center gap-3">
          {group.avatar
            ? <img src={group.avatar} className="w-9 h-9 rounded-full object-cover border-2 border-white/50" />
            : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{group.user_name[0]}</div>
          }
          <div>
            <p className="text-white font-semibold text-sm leading-none">{group.user_name}</p>
            <p className="text-white/60 text-xs mt-0.5">осталось {timeLeft}</p>
          </div>
          {story.views > 0 && (
            <div className="flex items-center gap-1 text-white/50 text-xs ml-1">
              <Icon name="Eye" size={12} />
              <span>{story.views}</span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white p-1">
          <Icon name="X" size={22} />
        </button>
      </div>

      {/* Видео */}
      <video
        ref={videoRef}
        key={story.video_url}
        src={story.video_url}
        autoPlay
        muted={false}
        playsInline
        loop={false}
        onEnded={goNext}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className="w-full h-full object-cover"
        style={{ background: "#000" }}
      />

      {/* Зоны тапа */}
      <div className="absolute inset-0 z-20 flex">
        <div className="flex-1 h-full" onPointerDown={goPrev} />
        <div className="flex-1 h-full" onPointerDown={goNext} />
      </div>

      {/* Пауза по зажатию */}
      <div
        className="absolute inset-0 z-30"
        onPointerDown={() => { setPaused(true); videoRef.current?.pause(); }}
        onPointerUp={() => { setPaused(false); videoRef.current?.play(); }}
        onPointerLeave={() => { setPaused(false); videoRef.current?.play(); }}
        style={{ pointerEvents: "none" }}
      />

      {/* Кнопка удалить (своя история) */}
      {isOwn && (
        <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center">
          <button
            onClick={async () => {
              const token = localStorage.getItem("spark_token");
              await fetch(STORIES_URL, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
                body: JSON.stringify({ story_id: story.id }),
              });
              onClose();
            }}
            className="flex items-center gap-2 bg-black/60 text-white/70 text-sm px-4 py-2 rounded-full border border-white/10"
          >
            <Icon name="Trash2" size={15} />
            Удалить историю
          </button>
        </div>
      )}
    </div>
  );
}