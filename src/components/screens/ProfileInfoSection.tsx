import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useBackHandler } from "@/hooks/backStack";
import { type Profile, type MyGift } from "@/lib/api";
import { GiftsGrid } from "@/components/gifts/GiftsGrid";
import { ProtectedImage } from "@/components/ui/ProtectedImage";
import { PhotoZoomViewer } from "@/components/ui/PhotoZoomViewer";
import { PublicStreakBadge } from "@/components/screens/profile/PublicStreakBadge";
import { ZodiacBadge } from "@/components/screens/profile/ZodiacBanner";

/** Расстояние человеческим языком: «рядом», «1,2 км», «5 км», «120 км» */
export function formatDistance(km: number): string {
  if (km < 1) return "меньше 1 км";
  if (km < 10) return `${km.toFixed(1).replace(".", ",").replace(",0", "")} км`;
  return `${Math.round(km).toLocaleString("ru")} км`;
}

interface ProfileData {
  bio?: string;
  tags?: string[];
  followers: number;
  following: number;
  created_at?: string;
}

interface ProfileInfoSectionProps {
  currentProfile: Profile;
  profileData: ProfileData;
  userId?: number;
  photoTab: "public" | "private" | "gifts" | null;
  loadingPhotos: boolean;
  galleryPhotos: { id: number; photo_url: string }[];
  privateReqSent: boolean;
  liked: boolean;
  liking: boolean;
  onPhotoTabChange: (tab: "public" | "private" | "gifts" | null) => void;
  onPrivateReqSent: () => void;
  onSkip: () => void;
  onLike: () => void;
  onViewFollowers?: () => void;
  onViewGifts?: () => void;
  onOpenGiftSheet?: () => void;
  userGifts?: MyGift[];
  userGiftsLoading?: boolean;
}

export function ProfileInfoSection({
  currentProfile,
  profileData,
  userId,
  photoTab,
  loadingPhotos,
  galleryPhotos,
  privateReqSent,
  liked,
  liking,
  onPhotoTabChange,
  onPrivateReqSent,
  onSkip,
  onLike,
  onViewFollowers,
  onViewGifts,
  onOpenGiftSheet,
  userGifts = [],
  userGiftsLoading = false,
}: ProfileInfoSectionProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useBackHandler(!!lightboxUrl, () => setLightboxUrl(null));

  return (
    <div className="pb-8 flex flex-col gap-0" style={{ background: "var(--spark-dark)" }}>

      {/* Город + последний визит */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1">
        {(currentProfile.city || currentProfile.distance_km != null) ? (
          <p className="text-white/50 text-xs flex items-center gap-1.5">
            {currentProfile.city && (
              <span className="flex items-center gap-1">
                <Icon name="MapPin" size={11} className="text-white/30" />{currentProfile.city}
              </span>
            )}
            {currentProfile.distance_km != null && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,45,120,0.12)", color: "#FF7AB0" }}>
                <Icon name="Navigation" size={10} style={{ color: "#FF7AB0" }} />
                {formatDistance(currentProfile.distance_km)}
              </span>
            )}
          </p>
        ) : <span />}
        <div className="flex items-center gap-1.5">
          {(() => {
            const iso = currentProfile.last_seen;
            const ts = iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime() : 0;
            const diff = ts ? Date.now() - ts : Infinity;
            const mins = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            // Онлайн = был в сети меньше 5 минут назад (по факту, а не по флагу)
            const isOnline = ts > 0 && mins < 5;
            if (isOnline) {
              return (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs font-medium">онлайн</span>
                </>
              );
            }
            if (!ts) {
              return <span className="text-white/25 text-[11px]">не в сети</span>;
            }
            let label: string;
            if (mins < 60) label = `был(а) ${mins} мин. назад`;
            else if (hours < 24) label = `был(а) ${hours} ч. назад`;
            else if (days < 7) label = `был(а) ${days} дн. назад`;
            else label = "давно не в сети";
            return (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-white/25" />
                <span className="text-white/35 text-[11px]">{label}</span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Вкладки фото */}
      <div className="flex gap-2 px-5 pb-3">
        <button onClick={() => {
            if (photoTab === "public" || photoTab === "private") {
              onPhotoTabChange(null);
            } else {
              onPhotoTabChange("public");
              if (galleryPhotos.length > 0) setLightboxUrl(galleryPhotos[0].photo_url);
            }
          }}
          className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${photoTab === "public" || photoTab === "private" ? "text-white" : "text-white/60"}`}
          style={photoTab === "public" || photoTab === "private"
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
            : { background: "rgba(255,255,255,0.07)" }}>
          📷 Фото
        </button>
        <button onClick={() => { onPhotoTabChange(photoTab === "gifts" ? null : "gifts"); if (photoTab !== "gifts") onViewGifts?.(); }}
          className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${photoTab === "gifts" ? "text-white" : "text-white/60"}`}
          style={photoTab === "gifts"
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
            : { background: "rgba(255,255,255,0.07)" }}>
          🎁 Подарки
        </button>
      </div>

      {/* Стрик активности */}
      {userId && (
        <div className="px-5 pb-3">
          <PublicStreakBadge userId={userId} />
        </div>
      )}

      {/* Вложенный переключатель Публичные / Приватные */}
      {(photoTab === "public" || photoTab === "private") && (
        <div className="flex gap-1 px-5 pb-3">
          <button onClick={() => onPhotoTabChange("public")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${photoTab === "public" ? "text-white" : "text-white/35"}`}
            style={photoTab === "public"
              ? { background: "rgba(255,255,255,0.12)" }
              : { background: "transparent" }}>
            <Icon name="Image" size={12} className={photoTab === "public" ? "text-white" : "text-white/35"} />
            Публичные
          </button>
          <button onClick={() => onPhotoTabChange("private")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${photoTab === "private" ? "text-white" : "text-white/35"}`}
            style={photoTab === "private"
              ? { background: "rgba(255,255,255,0.12)" }
              : { background: "transparent" }}>
            <Icon name="Lock" size={12} className={photoTab === "private" ? "text-white" : "text-white/35"} />
            Приватные
          </button>
        </div>
      )}

      {/* Галерея */}
      {photoTab === null ? null : photoTab === "gifts" ? (
        <div className="px-5 pb-3 flex flex-col gap-3">
          <button
            onClick={onOpenGiftSheet}
            className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 btn-grad active:scale-95 transition-transform">
            🎁 Подарить {currentProfile.name}
          </button>
          <GiftsGrid
            gifts={userGifts}
            loading={userGiftsLoading}
            showSender={true}
            emptyText={`У ${currentProfile.name} пока нет подарков.\nБудь первым — подари что-нибудь!`}
          />
        </div>
      ) : photoTab === "public" ? (
        <div className="px-5 pb-3">
          {loadingPhotos ? (
            <div className="flex justify-center py-6">
              <Icon name="Loader2" size={24} className="text-white/30 animate-spin" />
            </div>
          ) : galleryPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {galleryPhotos.map((ph) => (
                <button key={ph.id} className="aspect-square rounded-xl overflow-hidden active:scale-95 transition-transform"
                  onClick={() => setLightboxUrl(ph.photo_url)}>
                  <ProtectedImage src={ph.photo_url} className="w-full h-full" style={{ objectFit: "cover" }} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-xs text-center py-4">Публичных фото нет</p>
          )}
        </div>
      ) : (
        <div className="px-5 pb-3">
          {!privateReqSent ? (
            <div className="glass-card p-5 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="Lock" size={22} className="text-pink-400" />
              </div>
              <p className="text-white font-semibold text-sm">Приватные фото закрыты</p>
              <p className="text-white/40 text-xs leading-relaxed">
                Отправь запрос — {currentProfile.name} решит, открыть ли тебе доступ
              </p>
              <button onClick={onPrivateReqSent}
                className="btn-grad px-6 py-2.5 text-sm font-semibold w-full">
                Запросить доступ
              </button>
            </div>
          ) : (
            <div className="glass-card p-5 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(74,222,128,0.12)" }}>
                <Icon name="Check" size={20} className="text-green-400" />
              </div>
              <p className="text-white font-semibold text-sm">Запрос отправлен</p>
              <p className="text-white/40 text-xs">Ожидаем ответа от {currentProfile.name}</p>
            </div>
          )}
        </div>
      )}

      {/* О себе — карточка */}
      <div className="px-5 pb-3">
        <div className="w-full rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(155,89,182,0.2)" }}>
              <Icon name="AlignLeft" size={12} className="text-purple-400" />
            </div>
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">О себе</span>
          </div>
          {(profileData.bio || currentProfile.bio) ? (
            <p className="text-white/70 text-sm leading-relaxed">
              {profileData.bio || currentProfile.bio}
            </p>
          ) : (
            <p className="text-white/25 text-sm italic">Нет информации</p>
          )}
          {(profileData.tags || (currentProfile.tags as string[]))?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {((profileData.tags || currentProfile.tags) as string[]).map((tag) => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Знак зодиака — только чтение */}
      {currentProfile.zodiac && (
        <div className="px-5 pb-3">
          <ZodiacBadge zodiac={currentProfile.zodiac} />
        </div>
      )}

      {/* Статы: Рост / Вес / Пол / Статус / Город */}
      {(currentProfile.height || currentProfile.weight || currentProfile.gender || currentProfile.relationship_status || currentProfile.city) && (
        <div className="px-5 pb-3">
          <div className="w-full rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-stretch">
              {([
                { label: "Рост",   value: currentProfile.height ? `${currentProfile.height} см` : null, icon: "Ruler",  color: "#3B82F6" },
                { label: "Вес",    value: currentProfile.weight ? `${currentProfile.weight} кг` : null, icon: "Scale",  color: "#10B981" },
                { label: "Пол",    value: currentProfile.gender === "female" ? "Жен" : currentProfile.gender === "male" ? "Муж" : null, icon: "User", color: "#9B59B6" },
                { label: "Статус", value: (() => { const s = currentProfile.relationship_status; if (!s || s === "hidden") return null; if (s === "single") return "Своб."; if (s === "searching") return "Поиск"; if (s === "complicated") return "Слож."; if (s === "open") return "Откр."; return null; })(), icon: "Heart", color: "#FF2D78" },
                { label: "Город",  value: currentProfile.city || null, icon: "MapPin", color: "#F59E0B" },
              ] as { label: string; value: string | null; icon: string; color: string }[]).filter(s => s.value).map(({ label, value, icon, color }, i, arr) => (
                <div key={label}
                  className="flex-1 flex flex-col items-center py-3.5 gap-1 relative"
                  style={{ minWidth: "20%" }}>
                  {i < arr.length - 1 && (
                    <div className="absolute right-0 top-3 bottom-3 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                  )}
                  <Icon name={icon as "Ruler"|"Scale"|"User"|"Heart"|"MapPin"} size={14} style={{ color }} />
                  <span className="text-white font-bold text-xs leading-tight text-center truncate w-full px-1">{value}</span>
                  <span className="text-white/35 text-[9px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Подписчики — карточки */}
      <div className="px-5 pb-3">
        <div className="flex gap-2">
          <button
            onClick={onViewFollowers}
            className="flex-1 flex flex-col items-center py-4 rounded-2xl active:scale-95 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-white font-black text-2xl leading-none">{profileData.followers}</span>
            <span className="text-white/40 text-xs mt-1.5 font-medium">Подписчики</span>
          </button>
          <div className="flex-1 flex flex-col items-center py-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-white font-black text-2xl leading-none">{profileData.following ?? 0}</span>
            <span className="text-white/40 text-xs mt-1.5 font-medium">Подписки</span>
          </div>
        </div>
      </div>

      {/* Дата регистрации */}
      {profileData.created_at && (
        <div className="px-5 pb-3">
          <div className="flex items-center justify-center gap-1.5 py-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <Icon name="Calendar" size={12} className="text-white/20" />
            <span className="text-white/25 text-xs">
              На Полутон с {new Date(profileData.created_at).toLocaleDateString("ru", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="px-5 pb-6 pt-2 flex gap-3 flex-shrink-0">
        <button onClick={onSkip}
          className="flex-1 glass-card py-3.5 flex items-center justify-center gap-2 text-white/60 font-semibold text-sm">
          <Icon name="ChevronRight" size={18} />Пропустить
        </button>
        <button onClick={onLike} disabled={liking}
          className="flex-1 py-3.5 flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-95 rounded-full"
          style={liked
            ? { background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.2))", border: "1.5px solid rgba(255,45,120,0.5)", color: "#FF2D78", boxShadow: "0 0 20px rgba(255,45,120,0.2)" }
            : { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)", color: "white", border: "none" }}>
          {liking
            ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            : <Icon name="Heart" size={18} className={liked ? "text-pink-400" : "text-white"} style={liked ? { fill: "#FF2D78" } : { fill: "white" }} />}
          {liked ? "Лайкнуто ❤️" : "Лайкнуть"}
        </button>
      </div>

      {/* Lightbox просмотр фото с pinch-zoom */}
      {lightboxUrl && (
        <PhotoZoomViewer
          src={lightboxUrl}
          watermark="Полутон · скриншот запрещён"
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  );
}