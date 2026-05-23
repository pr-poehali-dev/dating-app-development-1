import { LiveBadge, TrendingBadge } from "@/components/screens/HomeFeedWidgets";
import { PostCard } from "@/components/screens/HomePostCard";
import { type Post, type LiveStream, type Profile } from "@/lib/api";

interface Props {
  loading: boolean;
  posts: Post[];
  streams: LiveStream[];
  currentUserId: number;
  onGoLive: () => void;
  onLike: (post: Post) => void;
  onComment: (post: Post) => void;
  onDelete: (post: Post) => void;
  onProfileClick: (profile: Profile) => void;
}

export function HomeFeedContent({
  loading, posts, streams, currentUserId,
  onGoLive, onLike, onComment, onDelete, onProfileClick,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* Live streams */}
          <LiveBadge streams={streams} onJoin={() => onGoLive()} />

          {/* Trending */}
          {posts.length > 0 && <TrendingBadge posts={posts} />}

          {/* Divider */}
          {(streams.length > 0 || posts.length > 0) && (
            <div className="mx-4 mb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
          )}

          {/* Feed */}
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 px-8">
              <div className="text-6xl">📸</div>
              <p className="text-white/50 text-sm text-center">
                Лента пока пуста.<br />Публикуй фото во вкладке «Фото» — они появятся здесь!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onLike={onLike}
                onComment={onComment}
                onDelete={onDelete}
                onProfileClick={onProfileClick}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}

export default HomeFeedContent;
