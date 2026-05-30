import Icon from "@/components/ui/icon";
import { useState } from "react";

interface ProfilePhotoSectionProps {
  currentPhoto: string;
  photos: string[];
  photoIdx: number;
  totalPhotos: number;
  loadingPhotos: boolean;
  liked: boolean;
  profileName: string;
  profileAge?: number;
  profileUsername?: string;
  profileVerified?: boolean;
  profilePremium?: boolean;
  profileOnline?: boolean;
  coverUrl?: string;
  profileGender?: string;
  onClose: () => void;
  onShowMenu: () => void;
  onPhotoIdx: (updater: (i: number) => number) => void;
  onLike: () => void;
  onOpenChat: () => void;
  onOpenGiftSheet: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function ProfilePhotoSection({
  currentPhoto,
  photos,
  photoIdx,
  totalPhotos,
  loadingPhotos,
  liked,
  profileName,
  profileAge,
  profileUsername,
  profileVerified,
  profilePremium,
  profileOnline,
  coverUrl,
  profileGender,
  onClose,
  onShowMenu,
  onPhotoIdx,
  onLike,
  onOpenChat,
  onOpenGiftSheet,
  onTouchStart,
  onTouchEnd,
}: ProfilePhotoSectionProps) {
  const [burst, setBurst] = useState(false);

  const coverGradient =
    profileGender === "male"
      ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #3b82f6 100%)"
      : profileGender === "female"
      ? "linear-gradient(135deg, #be185d 0%, #ec4899 45%, #f472b6 100%)"
      : "linear-gradient(135deg, #6d28d9 0%, #9333ea 45%, #a855f7 100%)";
  const coverHearts = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='46' height='46' viewBox='0 0 24 24' fill='rgba(255,255,255,0.18)'><path d='M12 21s-6.7-4.35-9.33-8.07C.9 10.3 1.4 7 4.1 5.6c1.9-.98 4.1-.4 5.4 1.1L12 9.2l2.5-2.5c1.3-1.5 3.5-2.08 5.4-1.1 2.7 1.4 3.2 4.7 1.43 7.33C18.7 16.65 12 21 12 21z'/></svg>`
  )}")`;

  const handleLikeClick = () => {
    if (liked) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    onLike();
  };

  return (
    <div className="flex-shrink-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── Обложка ── */}
      <div className="relative w-full" style={{ marginBottom: 52 }}>
        <div className="w-full overflow-hidden relative" style={{ height: 150 }}>
          {coverUrl ? (
            <>
              <img src={coverUrl} className="w-full h-full object-cover" />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(10,6,20,0.55) 100%)" }} />
            </>
          ) : (
            <div className="w-full h-full relative overflow-hidden" style={{ background: coverGradient }}>
              <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full blur-2xl opacity-60"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)" }} />
              <div className="absolute inset-0"
                style={{ backgroundImage: coverHearts, backgroundSize: "46px 46px" }} />
              <Icon name="Heart" size={72} className="absolute -right-3 -top-3 text-white/20" fallback="Heart" />
              <Icon name="Heart" size={40} className="absolute left-6 bottom-2 text-white/20" fallback="Heart" />
            </div>
          )}

          {/* Кнопки навигации */}
          <button onClick={onClose}
            className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-full z-10"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <Icon name="ChevronLeft" size={20} className="text-white" />
          </button>
          <button onClick={onShowMenu}
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full z-10"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <Icon name="MoreVertical" size={18} className="text-white/80" />
          </button>
        </div>

        {/* ── Аватар ── */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -48 }}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full"
              style={{
                padding: 3,
                background: profilePremium
                  ? "linear-gradient(135deg,#FF2D78,#FFD700,#9B59B6)"
                  : "linear-gradient(135deg,#FF2D78,#9B59B6)",
                boxShadow: "0 4px 20px rgba(255,45,120,0.45)",
              }}>
              <div className="w-full h-full rounded-full overflow-hidden bg-[var(--spark-dark)]">
                <img src={currentPhoto} className="w-full h-full object-cover" />
              </div>
            </div>
            {profileOnline && (
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center"
                style={{ border: "2px solid var(--spark-dark)", boxShadow: "0 0 8px #4ADE80" }}>
                <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Имя и бейджи ── */}
      <div className="flex flex-col items-center gap-1 px-5 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-xl leading-tight">
            {profileName}{profileAge ? `, ${profileAge}` : ""}
          </h3>
          {profileVerified && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.2)" }}>
              <Icon name="BadgeCheck" size={14} className="text-blue-400" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profileUsername && (
            <span className="text-white/35 text-xs font-mono">@{profileUsername}</span>
          )}
          {profilePremium && (
            <span className="relative overflow-hidden text-[10px] px-2.5 py-0.5 rounded-full font-black leading-none tracking-wide select-none"
              style={{
                background: "linear-gradient(120deg,#B8860B,#FFD700,#FFF0A0,#FFD700,#B8860B)",
                backgroundSize: "200% 100%",
                color: "#1a1000",
                boxShadow: "0 0 8px rgba(255,215,0,0.6), 0 0 2px rgba(255,215,0,0.9)",
                animation: "goldShimmer 2.5s linear infinite",
                border: "1px solid rgba(255,215,0,0.5)",
              }}>
              ✦ PREMIUM
            </span>
          )}
        </div>

        {/* Фото-индикаторы */}
        {totalPhotos > 1 && (
          <div className="flex gap-1.5 mt-1">
            {photos.map((_, i) => (
              <button key={i} onClick={() => onPhotoIdx(() => i)}
                className="h-1 rounded-full transition-all"
                style={{
                  background: i === photoIdx ? "#FF2D78" : "rgba(255,255,255,0.25)",
                  width: i === photoIdx ? 20 : 6,
                }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Кнопки действий ── */}
      <div className="flex items-center justify-center gap-4 px-5 pb-4">
        {/* Лайк */}
        <button onClick={handleLikeClick} disabled={liked}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-visible transition-all active:scale-90"
          style={{
            background: liked ? "linear-gradient(135deg,#FF2D78,#FF6B6B)" : "rgba(255,255,255,0.08)",
            border: liked ? "none" : "1.5px solid rgba(255,45,120,0.45)",
            boxShadow: liked ? "0 6px 24px rgba(255,45,120,0.55)" : "0 4px 16px rgba(255,45,120,0.2)",
            transform: burst ? "scale(1.22)" : "scale(1)",
          }}>
          <Icon name="Heart" size={22}
            style={{
              color: liked ? "white" : "#FF2D78",
              fill: liked ? "white" : "transparent",
              transition: "transform 0.25s cubic-bezier(.36,.07,.19,.97)",
              transform: burst ? "scale(1.35)" : "scale(1)",
            }} />
          {burst && [0,60,120,180,240,300].map((deg) => (
            <span key={deg} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
              style={{
                background: deg % 120 === 0 ? "#FF2D78" : "#FFB3CC",
                top: "50%", left: "50%",
                transform: `rotate(${deg}deg) translateY(-22px) translate(-50%,-50%)`,
                animation: "heartParticle 0.6s ease-out forwards",
              }} />
          ))}
        </button>

        {/* Сообщение */}
        <button onClick={onOpenChat}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "linear-gradient(135deg, rgba(99,179,237,0.2), rgba(79,134,247,0.15))",
            border: "1.5px solid rgba(99,179,237,0.4)",
            boxShadow: "0 4px 18px rgba(79,134,247,0.2)",
          }}>
          <Icon name="MessageCircle" size={20} style={{ color: "#93C5FD" }} />
        </button>

        {/* Подарок */}
        <button onClick={onOpenGiftSheet}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "linear-gradient(135deg, rgba(255,215,0,0.18), rgba(255,160,0,0.14))",
            border: "1.5px solid rgba(255,200,0,0.45)",
            boxShadow: "0 4px 18px rgba(255,180,0,0.22)",
          }}>
          <Icon name="Gift" size={20} style={{ color: "#FCD34D" }} />
        </button>
      </div>

    </div>
  );
}