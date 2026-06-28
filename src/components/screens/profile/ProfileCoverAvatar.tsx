import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { getStreakReward } from "@/lib/streakRewards";

function DefaultCover() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.08),rgba(155,89,182,0.08))", border: "none" }}>
      <Icon name="ImagePlus" size={28} className="text-white/15" />
      <span className="text-white/20 text-xs font-medium">Добавить обложку</span>
    </div>
  );
}

export function ProfileCoverAvatar({
  currentUser,
  localPhoto,
  localCover,
  photoUploading,
  coverUploading,
  onAvatarClick,
  onCoverClick,
  onCoverOpen,
  streakDays = 0,
}: {
  currentUser: User;
  localPhoto: string;
  localCover: string;
  photoUploading: boolean;
  coverUploading: boolean;
  onAvatarClick: () => void;
  onCoverClick: () => void;
  onCoverOpen?: () => void;
  streakDays?: number;
}) {
  const streakReward = getStreakReward(streakDays);

  return (
    <div className="relative w-full" style={{ marginBottom: 52 }}>
      {/* Обложка */}
      <div
        className="w-full overflow-hidden relative"
        style={{ height: 320, cursor: localCover ? "pointer" : "default" }}
        onClick={localCover && onCoverOpen ? onCoverOpen : undefined}
      >
        {localCover ? (
          <img
            src={localCover}
            className="w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: "center top",
              opacity: coverUploading ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          />
        ) : (
          <DefaultCover />
        )}

        {/* Градиент снизу */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 45%, rgba(10,6,20,0.85) 100%)" }} />

        {coverUploading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}

        {/* Кнопка смены фона */}
        {!coverUploading && (
          <button
            onClick={e => { e.stopPropagation(); onCoverClick(); }}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white/85 text-xs font-semibold transition-all active:scale-95"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <Icon name="ImagePlus" size={12} />Фон
          </button>
        )}
      </div>

      {/* Аватар */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -48, zIndex: 1 }}>
        <div className="relative" onClick={onAvatarClick} style={{ cursor: "pointer" }}>
          <div className="w-24 h-24 rounded-full"
            style={{
              padding: 3,
              background: streakReward
                ? streakReward.ringColor
                : currentUser.premium
                  ? "linear-gradient(135deg,#FF2D78,#FFD700,#9B59B6)"
                  : "linear-gradient(135deg,#FF2D78,#9B59B6)",
              boxShadow: streakReward
                ? streakReward.glow
                : "0 4px 20px rgba(255,45,120,0.45)",
            }}>
            <div className="w-full h-full rounded-full overflow-hidden bg-[var(--spark-dark)] flex items-center justify-center">
              {localPhoto
                ? <img src={localPhoto} className="w-full h-full object-cover" style={{ opacity: photoUploading ? 0.5 : 1 }} />
                : <Icon name="User" size={36} className="text-white/20" />
              }
            </div>
          </div>
          {/* Значок стрика на аватаре */}
          {streakReward && (
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-base z-10"
              style={{
                background: streakReward.ringColor,
                boxShadow: `${streakReward.glow}, 0 0 0 2px var(--spark-dark)`,
              }}>
              {streakReward.badge}
            </div>
          )}
          {photoUploading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                boxShadow: "0 2px 8px rgba(255,45,120,0.5)",
                outline: "2px solid var(--spark-dark)",
              }}>
              <Icon name="Camera" size={11} className="text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}