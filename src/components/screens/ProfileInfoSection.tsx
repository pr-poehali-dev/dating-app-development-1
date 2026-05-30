import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type Profile, type MyGift } from "@/lib/api";
import { GiftsGrid } from "@/components/gifts/GiftsGrid";

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
  isOwnProfile?: boolean;
  onViewSubscriptions?: () => void;
}

const RS_LABEL: Record<string, string> = {
  single: "Свободен",
  searching: "В поиске",
  complicated: "Всё сложно",
  open: "Своб. отношения",
};

export function ProfileInfoSection({
  currentProfile,
  profileData,
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
  isOwnProfile = false,
  onViewSubscriptions,
}: ProfileInfoSectionProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto pb-4 flex flex-col gap-0">

      {/* Имя и онлайн */}
      <div className="flex items-start justify-between px-5 pt-3 pb-2">
        <div>
          <h2 className="text-white font-golos font-bold text-2xl flex items-center gap-2">
            {currentProfile.name}{currentProfile.age ? `, ${currentProfile.age}` : ""}
            {currentProfile.verified && <span className="text-blue-400 text-base">✓</span>}
          </h2>
          {currentProfile.username && (
            <p className="text-white/40 text-xs mt-0.5">@{currentProfile.username}</p>
          )}
          {currentProfile.city && (
            <p className="text-white/60 text-sm flex items-center gap-1 mt-0.5">
              <Icon name="MapPin" size={13} />{currentProfile.city}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {currentProfile.online ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ADE80] animate-pulse" />
              <span className="text-green-400 text-xs font-medium">онлайн</span>
            </>
          ) : currentProfile.last_seen ? (
            <span className="text-white/35 text-xs">
              {(() => {
                const iso = currentProfile.last_seen!;
                const ts = new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime();
                const diff = Date.now() - ts;
                const mins = Math.floor(diff / 60000);
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                if (mins < 5) return "недавно в сети";
                if (mins < 60) return `была в сети ${mins} мин. назад`;
                if (hours < 24) return `была в сети ${hours} ч. назад`;
                return `была в сети ${days} дн. назад`;
              })()}
            </span>
          ) : null}
        </div>
      </div>

      {/* Рост / Вес / Статус */}
      {(currentProfile.height || currentProfile.weight || (currentProfile.relationship_status && currentProfile.relationship_status !== "hidden")) && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {currentProfile.height && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white/75"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <Icon name="Ruler" size={11} className="text-white/50" />{currentProfile.height} см
            </span>
          )}
          {currentProfile.weight && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white/75"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <Icon name="Weight" size={11} className="text-white/50" />{currentProfile.weight} кг
            </span>
          )}
          {currentProfile.relationship_status && currentProfile.relationship_status !== "hidden" && RS_LABEL[currentProfile.relationship_status] && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white/75"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <Icon name="Heart" size={11} className="text-white/50" />
              {RS_LABEL[currentProfile.relationship_status]}
            </span>
          )}
        </div>
      )}

      {/* Вкладки фото */}
      <div className="flex gap-2 px-5 pb-3">
        <button onClick={() => onPhotoTabChange(photoTab === "public" || photoTab === "private" ? null : "public")}
          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
          style={photoTab === "public" || photoTab === "private"
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
            : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
          📷 Фото
        </button>
        <button onClick={() => { onPhotoTabChange(photoTab === "gifts" ? null : "gifts"); if (photoTab !== "gifts") onViewGifts?.(); }}
          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
          style={photoTab === "gifts"
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
            : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
          🎁 Подарки
        </button>
      </div>

      {/* Вложенный переключатель Публичные / Приватные */}
      {(photoTab === "public" || photoTab === "private") && (
        <div className="flex gap-1 px-5 pb-3">
          <button onClick={() => onPhotoTabChange("public")}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
            style={photoTab === "public"
              ? { background: "rgba(255,255,255,0.12)", color: "white" }
              : { background: "transparent", color: "rgba(255,255,255,0.35)" }}>
            <Icon name="Image" size={12} className={photoTab === "public" ? "text-white" : "text-white/35"} />
            Публичные
          </button>
          <button onClick={() => onPhotoTabChange("private")}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
            style={photoTab === "private"
              ? { background: "rgba(255,255,255,0.12)", color: "white" }
              : { background: "transparent", color: "rgba(255,255,255,0.35)" }}>
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
                  <img src={ph.photo_url} className="w-full h-full object-cover" />
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
              На LoveBloom с {new Date(profileData.created_at).toLocaleDateString("ru", { month: "long", year: "numeric" })}
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

      {/* Lightbox просмотр фото */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
          onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-5 right-5 glass-card p-2.5 z-10"
            onClick={() => setLightboxUrl(null)}>
            <Icon name="X" size={20} className="text-white" />
          </button>
          <img src={lightboxUrl} className="max-w-full max-h-full object-contain rounded-2xl"
            style={{ maxWidth: "95vw", maxHeight: "90dvh" }}
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}