import { TrendingBadge } from "@/components/screens/HomeFeedWidgets";
import { PostCard } from "@/components/screens/HomePostCard";
import { NearbyUsersBanner } from "@/components/screens/home/NearbyUsersBanner";
import { StoriesBar } from "@/components/screens/StoriesBar";
import { type Post, type LiveStream, type Profile } from "@/lib/api";

const BANNER_AFTER = 2; // показывать баннер после N-го поста

interface Props {
  loading: boolean;
  posts: Post[];
  streams: LiveStream[];
  currentUserId: number;
  isPremium: boolean;
  onJoinLive: (s: LiveStream) => void;
  onLike: (post: Post) => void;
  onComment: (post: Post) => void;
  onDelete: (post: Post) => void;
  onProfileClick: (profile: Profile) => void;
  onPremium: () => void;
  onOpenNewUsers: () => void;
  onAddStory?: () => void;
}

export function HomeFeedContent({
  loading, posts, streams, currentUserId, isPremium,
  onJoinLive, onLike, onComment, onDelete, onProfileClick, onPremium, onOpenNewUsers, onAddStory,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Сторис — всегда вверху */}
      <StoriesBar currentUserId={currentUserId} onAddStory={onAddStory} />

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
        </>
      )}
    </div>
  );
}

export default HomeFeedContent;