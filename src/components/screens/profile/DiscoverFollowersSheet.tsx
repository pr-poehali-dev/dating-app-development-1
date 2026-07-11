import Icon from "@/components/ui/icon";
import { type Profile } from "@/lib/api";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface FollowersSheetProps {
  visible: boolean;
  profileName: string;
  loading: boolean;
  followers: { id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean }[];
  onClose: () => void;
  onSelectUser: (user: Profile) => void;
}

export function DiscoverFollowersSheet({ visible, profileName, loading, followers, onClose, onSelectUser }: FollowersSheetProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1030)", maxHeight: "75dvh" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-white font-bold text-base">Подписчики {profileName}</p>
          <button onClick={onClose} className="text-white/40">
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2 pb-8">
          {loading ? (
            <div className="flex justify-center py-10">
              <Icon name="Loader2" size={28} className="text-white/30 animate-spin" />
            </div>
          ) : followers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Icon name="Users" size={36} className="text-white/15" />
              <p className="text-white/30 text-sm">Пока нет подписчиков</p>
            </div>
          ) : (
            followers.map(user => (
              <button key={user.id}
                onClick={() => { onSelectUser(user as Profile); onClose(); }}
                className="flex items-center gap-3 p-2 rounded-2xl w-full text-left transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="relative flex-shrink-0">
                  <UserAvatar src={user.photo_url}
                    className="w-12 h-12 rounded-full"
                    style={{ border: "2px solid rgba(255,45,120,0.3)" }} />
                  {user.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2"
                      style={{ borderColor: "var(--spark-dark2,#1a1030)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-semibold text-sm truncate">
                      {user.name}{user.age ? `, ${user.age}` : ""}
                    </p>
                    {user.verified && (
                      <div className="flex-shrink-0 flex items-center justify-center"
                        style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#FF2D78,#C061FF)", boxShadow: "0 0 0 1.5px rgba(255,45,120,0.3), 0 2px 6px rgba(255,45,120,0.45)" }}>
                        <Icon name="BadgeCheck" size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-white/25 flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}