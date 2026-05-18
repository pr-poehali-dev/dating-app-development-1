import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

type TabType = "followers" | "following";
type UserItem = { id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean };

export function FollowersModal({
  initialTab,
  onClose,
}: {
  initialTab: TabType;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabType>(initialTab);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const req = tab === "followers" ? profilesApi.getFollowers() : profilesApi.getFollowing();
    req.then(r => {
      if (tab === "followers") setFollowers(r.users);
      else setFollowing(r.users);
    }).finally(() => setLoading(false));
  }, [tab]);

  const list = tab === "followers" ? followers : following;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1030)", maxHeight: "80dvh" }}
        onClick={e => e.stopPropagation()}>

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex gap-1 rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)" }}>
            {(["followers", "following"] as TabType[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={tab === t
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                  : { color: "rgba(255,255,255,0.4)" }}>
                {t === "followers" ? "Подписчики" : "Подписки"}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Список */}
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2 pb-8">
          {loading ? (
            <div className="flex justify-center py-10">
              <Icon name="Loader2" size={28} className="text-white/30 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Icon name={tab === "followers" ? "Users" : "UserCheck"} size={36} className="text-white/15" />
              <p className="text-white/30 text-sm">
                {tab === "followers" ? "Пока нет подписчиков" : "Ты ни на кого не подписан"}
              </p>
            </div>
          ) : (
            list.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="relative flex-shrink-0">
                  <img src={user.photo_url || FALLBACK_PHOTO}
                    className="w-12 h-12 rounded-full object-cover"
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
                    {user.verified && <Icon name="BadgeCheck" size={14} className="text-blue-400 flex-shrink-0" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
