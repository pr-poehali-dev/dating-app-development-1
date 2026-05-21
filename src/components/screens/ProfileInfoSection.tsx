import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type Profile } from "@/lib/api";

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
  photoTab: "public" | "private";
  loadingPhotos: boolean;
  galleryPhotos: { id: number; photo_url: string }[];
  privateReqSent: boolean;
  liked: boolean;
  liking: boolean;
  onPhotoTabChange: (tab: "public" | "private") => void;
  onPrivateReqSent: () => void;
  onSkip: () => void;
  onLike: () => void;
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
          {currentProfile.city && (
            <p className="text-white/60 text-sm flex items-center gap-1 mt-0.5">
              <Icon name="MapPin" size={13} />{currentProfile.city}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {currentProfile.online && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ADE80]" />}
          <span className="text-white/50 text-xs">{currentProfile.online ? "онлайн" : ""}</span>
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
        <button onClick={() => onPhotoTabChange("public")}
          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
          style={photoTab === "public"
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
            : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
          📷 Фото
        </button>
        <button onClick={() => onPhotoTabChange("private")}
          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
          style={photoTab === "private"
            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
            : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
          🔒 Приватное
        </button>
      </div>

      {/* Галерея */}
      {photoTab === "public" ? (
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

      {/* О себе */}
      <div className="px-5 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-white/40 text-xs uppercase tracking-widest mt-3 mb-2">О себе</p>
        {(profileData.bio || currentProfile.bio) ? (
          <p className="text-white/80 text-sm leading-relaxed">
            {profileData.bio || currentProfile.bio}
          </p>
        ) : (
          <p className="text-white/25 text-sm italic">Нет информации</p>
        )}
        {(profileData.tags || (currentProfile.tags as string[]))?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {((profileData.tags || currentProfile.tags) as string[]).map((tag) => (
              <span key={tag} className="glass-card px-3 py-1 text-white/60 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Подписчики */}
      <div className="px-5 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex justify-center gap-8 mt-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white font-bold text-lg">{profileData.followers}</span>
            <span className="text-white/40 text-xs">Подписчики</span>
          </div>
          <div className="w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white font-bold text-lg">{profileData.following}</span>
            <span className="text-white/40 text-xs">Подписки</span>
          </div>
        </div>
      </div>

      {/* Дата регистрации */}
      {profileData.created_at && (
        <div className="px-5 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white/25 text-xs mt-3 flex items-center gap-1.5">
            <Icon name="Calendar" size={12} />
            На LoveBloom с {new Date(profileData.created_at).toLocaleDateString("ru", { month: "long", year: "numeric" })}
          </p>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="px-5 pb-6 pt-2 flex gap-3 flex-shrink-0">
        <button onClick={onSkip}
          className="flex-1 glass-card py-3.5 flex items-center justify-center gap-2 text-white/60 font-semibold text-sm">
          <Icon name="ChevronRight" size={18} />Пропустить
        </button>
        <button onClick={onLike} disabled={liked || liking}
          className="flex-1 btn-grad py-3.5 flex items-center justify-center gap-2 font-semibold text-sm transition-all"
          style={{ opacity: liked ? 0.7 : 1 }}>
          {liking
            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Icon name="Heart" size={18} className="text-white" />}
          {liked ? "Лайкнуто!" : "Лайкнуть"}
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