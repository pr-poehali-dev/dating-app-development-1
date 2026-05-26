import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

export function ProfilePhotoSection({
  currentUser,
  localPhoto,
  localCover,
  photoUploading,
  coverUploading,
  galleryPhotos,
  galleryLoading,
  galleryUploading,
  galleryDeleteId,
  onCoverUpload,
  onCoverDelete,
  onAvatarUpload,
  onGalleryAdd,
  onGalleryDelete,
  onPremium,
  onSettingsPrivate,
  activeTab,
}: {
  currentUser: User;
  localPhoto: string;
  localCover: string;
  photoUploading: boolean;
  coverUploading: boolean;
  galleryPhotos: { id: number; photo_url: string }[];
  galleryLoading: boolean;
  galleryUploading: boolean;
  galleryDeleteId: number | null;
  onCoverUpload: () => void;
  onCoverDelete: () => void;
  onAvatarUpload: () => void;
  onGalleryAdd: () => void;
  onGalleryDelete: (id: number) => void;
  onPremium: () => void;
  onSettingsPrivate: () => void;
  activeTab: string | null;
}) {
  const displayPhoto = localPhoto || FALLBACK_PHOTO;
  const maxGallery = currentUser.premium ? 5 : 1;

  return (
    <>
      {activeTab === "photos" && (
        <div className="w-full mt-3 flex flex-col gap-3">

          {/* Фото на фон */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Превью обложки */}
            <div className="relative w-full h-28 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              {localCover
                ? <img src={localCover} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                    <Icon name="ImagePlus" size={28} className="text-white/15" />
                    <span className="text-white/20 text-[11px]">Нет фото на фон</span>
                  </div>}
              {coverUploading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.5) 100%)" }} />
              <span className="absolute bottom-2 left-3 text-white/50 text-[10px] uppercase tracking-widest font-medium">
                Фото на фон
              </span>
            </div>
            {/* Кнопки */}
            <div className="flex gap-2 p-3">
              <button onClick={onCoverUpload} disabled={coverUploading}
                className="flex-1 btn-grad py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Icon name="Upload" size={14} className="text-white" />
                {localCover ? "Изменить" : "Загрузить"}
              </button>
              {localCover && (
                <button onClick={onCoverDelete}
                  className="py-2.5 px-4 text-sm text-white/50 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon name="Trash2" size={14} className="text-white/40" />
                  Удалить
                </button>
              )}
            </div>
          </div>

          {/* Фото профиля */}
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="relative flex-shrink-0">
              <img src={displayPhoto} className="w-16 h-16 rounded-2xl object-cover"
                style={{ border: "2px solid rgba(255,45,120,0.45)", boxShadow: "0 4px 16px rgba(255,45,120,0.2)" }} />
              {photoUploading && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-white/50 text-[10px] uppercase tracking-widest">Фото профиля</span>
              <button onClick={onAvatarUpload} disabled={photoUploading}
                className="btn-grad py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Icon name="Camera" size={14} className="text-white" />
                Изменить фото
              </button>
            </div>
          </div>

          {/* Дополнительные фото */}
          <div className="rounded-2xl p-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-[10px] uppercase tracking-widest">Дополнительные фото</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                {galleryPhotos.length} / {maxGallery}
              </span>
            </div>

            {galleryLoading ? (
              <div className="flex justify-center py-6">
                <Icon name="Loader2" size={24} className="text-white/30 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {galleryPhotos.map(photo => (
                  <div key={photo.id} className="aspect-square rounded-xl overflow-hidden relative group">
                    <img src={photo.photo_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.4)" }} />
                    <button
                      onClick={() => onGalleryDelete(photo.id)}
                      disabled={galleryDeleteId === photo.id}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
                      {galleryDeleteId === photo.id
                        ? <Icon name="Loader2" size={11} className="text-white animate-spin" />
                        : <Icon name="X" size={11} className="text-white" />}
                    </button>
                  </div>
                ))}

                {galleryPhotos.length < maxGallery && (
                  <button onClick={onGalleryAdd} disabled={galleryUploading}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      border: "2px dashed rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.04)",
                    }}>
                    {galleryUploading
                      ? <Icon name="Loader2" size={22} className="text-white/30 animate-spin" />
                      : <>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.08)" }}>
                            <Icon name="Plus" size={16} className="text-white/40" />
                          </div>
                          <span className="text-white/30 text-[10px]">Добавить</span>
                        </>}
                  </button>
                )}

                {galleryPhotos.length >= maxGallery && !currentUser.premium && (
                  <button onClick={onPremium}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                    style={{
                      border: "2px dashed rgba(255,45,120,0.35)",
                      background: "linear-gradient(135deg, rgba(255,45,120,0.08), rgba(155,89,182,0.08))",
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 3px 10px rgba(255,45,120,0.4)" }}>
                      <Icon name="Crown" size={15} className="text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-center leading-tight"
                      style={{ color: "#FF2D78" }}>Premium<br/>+4 фото</span>
                  </button>
                )}
              </div>
            )}

            {!currentUser.premium && (
              <p className="text-white/25 text-[10px] mt-2.5 text-center">
                С подпиской можно добавить ещё 4 фото
              </p>
            )}
          </div>
        </div>
      )}

      {/* Приватные фото */}
      {activeTab === "private" && (
        <div className="w-full mt-3 flex flex-col gap-3">
          {/* Баннер */}
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,45,120,0.15), rgba(155,89,182,0.12))",
              border: "1px solid rgba(255,45,120,0.25)",
            }}>
            <div className="relative p-5 flex flex-col items-center gap-3 text-center">
              {/* Декоративные круги */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #FF2D78, transparent)", transform: "translate(30%, -30%)" }} />
              <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-15"
                style={{ background: "radial-gradient(circle, #9B59B6, transparent)", transform: "translate(-30%, 30%)" }} />

              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                  boxShadow: "0 6px 20px rgba(255,45,120,0.45)",
                }}>
                <Icon name="Lock" size={24} className="text-white" />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-white font-bold text-base">Приватный альбом</p>
                <p className="text-white/45 text-xs leading-relaxed px-2">
                  Добавь фото — они будут видны только тем, кому ты откроешь доступ
                </p>
              </div>

              <button onClick={onSettingsPrivate}
                className="btn-grad px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Icon name="Settings" size={14} className="text-white" />
                Настроить доступ
              </button>
            </div>
          </div>

          {/* Инфо-подсказка */}
          <div className="rounded-2xl p-4 flex gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.12)" }}>
              <Icon name="Info" size={15} className="text-pink-400" />
            </div>
            <p className="text-white/35 text-xs leading-relaxed">
              Приватные фото открываются по запросу. Ты сам решаешь, кому показывать свой альбом.
            </p>
          </div>
        </div>
      )}

      {/* Подарки */}
      {activeTab === "gifts" && (
        <div className="w-full mt-3 flex flex-col gap-3">
          <div className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-3">Мои подарки</p>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl flex flex-col items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Icon name="Gift" size={22} className="text-white/10" />
                </div>
              ))}
            </div>
            <p className="text-white/25 text-[11px] mt-3 text-center">
              Здесь будут отображаться подарки, которые тебе дарят
            </p>
          </div>
        </div>
      )}
    </>
  );
}
