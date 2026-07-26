import { useEffect, useRef } from "react";
import { TrendingBadge } from "@/components/screens/HomeFeedWidgets";
import { PostCard } from "@/components/screens/HomePostCard";
import { NearbyUsersBanner } from "@/components/screens/home/NearbyUsersBanner";
import { StoriesBar } from "@/components/screens/StoriesBar";
import Icon from "@/components/ui/icon";
import { type Post, type LiveStream, type Profile } from "@/lib/api";

const BANNER_AFTER = 2; // показывать баннер после N-го поста

interface Props {
  loading: boolean;
  posts: Post[];
  streams: LiveStream[];
  currentUserId: number;
  currentUserPhoto?: string | null;
  isPremium: boolean;
  onJoinLive: (s: LiveStream) => void;
  onLike: (post: Post) => void;
  onComment: (post: Post) => void;
  onDelete: (post: Post) => void;
  onProfileClick: (profile: Profile) => void;
  onPremium: () => void;
  onOpenNewUsers: () => void;
  onAddStory?: () => void;
  storiesRefreshKey?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function HomeFeedContent({
  loading, posts, streams, currentUserId, currentUserPhoto, isPremium,
  onJoinLive, onLike, onComment, onDelete, onProfileClick, onPremium, onOpenNewUsers, onAddStory, storiesRefreshKey,
  hasMore, loadingMore, onLoadMore,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore || !onLoadMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onLoadMore();
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, onLoadMore, posts.length]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Сторис — всегда вверху */}
      <StoriesBar currentUserId={currentUserId} currentUserPhoto={currentUserPhoto} onAddStory={onAddStory} refreshKey={storiesRefreshKey} />

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* Trending — топ посты + live стримеры */}
          {(posts.length > 0 || streams.length > 0) && (
            <TrendingBadge posts={posts} streams={streams} onJoinLive={onJoinLive} />
          )}

          {/* Feed */}
          {posts.length === 0 ? (
            <>
              <div className="flex flex-col items-center justify-center py-10 gap-4 px-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-1"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>📸</div>
                <p className="text-white/45 text-sm text-center leading-relaxed">
                  Лента пока пуста.<br />Публикуй фото — они появятся здесь!
                </p>
              </div>
              {/* Баннер если постов нет — показываем сразу */}
              <NearbyUsersBanner
                isPremium={isPremium}
                onProfile={onProfileClick}
                onPremium={onPremium}
                onOpenGrid={onOpenNewUsers}
              />
            </>
          ) : (
            posts.map((post, idx) => (
              <div key={post.id}>
                <PostCard
                  post={post}
                  currentUserId={currentUserId}
                  onLike={onLike}
                  onComment={onComment}
                  onDelete={onDelete}
                  onProfileClick={onProfileClick}
                />
                {/* Баннер после 2-го поста */}
                {idx === BANNER_AFTER - 1 && (
                  <NearbyUsersBanner
                    isPremium={isPremium}
                    onProfile={onProfileClick}
                    onPremium={onPremium}
                    onOpenGrid={onOpenNewUsers}
                  />
                )}
              </div>
            ))
          )}

          {posts.length > 0 && (
            <>
              <div ref={sentinelRef} className="h-1" />
              {loadingMore && (
                <div className="flex items-center justify-center py-6">
                  <Icon name="Loader2" size={22} className="animate-spin text-pink-500" />
                </div>
              )}
              {!hasMore && !loadingMore && (
                <p className="text-center text-white/25 text-xs py-6">Это все посты 🎉</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default HomeFeedContent;