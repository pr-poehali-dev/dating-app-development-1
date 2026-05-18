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
      {/* ── Секция ФОТО ─────────────────────────────────────────── */}
      {activeTab === "photos" && (
        <div className="w-full mt-3 flex flex-col gap-3">

          {/* Фото на фон (обложка) */}
          <div className="glass-card p-3">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Фото на фон</p>
            <div className="flex gap-2 items-center">
              <div className="w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 relative"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {localCover
                  ? <img src={localCover} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Image" size={20} className="text-white/20" />
                    </div>}
                {coverUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <button onClick={onCoverUpload} disabled={coverUploading}
                  className="btn-grad py-2 text-xs font-semibold rounded-xl disabled:opacity-50">
                  {localCover ? "Изменить фон" : "Загрузить фон"}
                </button>
                {localCover && (
                  <button onClick={onCoverDelete}
                    className="glass-card py-2 text-xs text-white/50 rounded-xl">
                    Удалить фон
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Фото профиля (аватар) */}
          <div className="glass-card p-3">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Фото профиля</p>
            <div className="flex gap-2 items-center">
              <img src={displayPhoto} className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                style={{ border: "2px solid rgba(255,45,120,0.5)" }} />
              <button onClick={onAvatarUpload} disabled={photoUploading}
                className="flex-1 btn-grad py-2 text-xs font-semibold rounded-xl disabled:opacity-50">
                Изменить фото
              </button>
            </div>
          </div>

          {/* Дополнительные фото */}
          <div className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/50 text-xs uppercase tracking-widest">Дополнительные фото</p>
              <span className="text-white/30 text-xs">{galleryPhotos.length}/{maxGallery}</span>
            </div>
            {galleryLoading ? (
              <div className="flex justify-center py-4">
                <Icon name="Loader2" size={24} className="text-white/30 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {galleryPhotos.map(photo => (
                  <div key={photo.id} className="aspect-square rounded-xl overflow-hidden relative group">
                    <img src={photo.photo_url} className="w-full h-full object-cover" />
                    <button onClick={() => onGalleryDelete(photo.id)} disabled={galleryDeleteId === photo.id}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.6)" }}>
                      {galleryDeleteId === photo.id
                        ? <Icon name="Loader2" size={12} className="text-white animate-spin" />
                        : <Icon name="X" size={12} className="text-white" />}
                    </button>
                  </div>
                ))}
                {galleryPhotos.length < maxGallery && (
                  <button onClick={onGalleryAdd} disabled={galleryUploading}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                    style={{ border: "2px dashed rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)" }}>
                    {galleryUploading
                      ? <Icon name="Loader2" size={22} className="text-white/30 animate-spin" />
                      : <><Icon name="Plus" size={22} className="text-white/30" /><span className="text-white/30 text-[10px]">Добавить</span></>}
                  </button>
                )}
                {galleryPhotos.length >= maxGallery && !currentUser.premium && (
                  <button onClick={onPremium}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                    style={{ border: "2px dashed rgba(255,45,120,0.3)", background: "rgba(255,45,120,0.05)" }}>
                    <Icon name="Crown" size={18} className="text-pink-400" />
                    <span className="text-pink-400 text-[9px] font-semibold text-center leading-tight">Premium<br/>+4 фото</span>
                  </button>
                )}
              </div>
            )}
            {!currentUser.premium && (
              <p className="text-white/25 text-[10px] mt-2 text-center">
                С подпиской можно добавить ещё 4 фото
              </p>
            )}
          </div>
        </div>
      )}

      {/* Приватные фото */}
      {activeTab === "private" && (
        <div className="w-full mt-3 glass-card p-5 flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,45,120,0.12)" }}>
            <Icon name="Lock" size={22} className="text-pink-400" />
          </div>
          <p className="text-white font-semibold text-sm">Приватный альбом</p>
          <p className="text-white/40 text-xs">Добавь фото — они будут видны только тем, кому ты откроешь доступ</p>
          <button onClick={onSettingsPrivate} className="btn-grad px-5 py-2 text-xs font-semibold mt-1">
            Настроить доступ
          </button>
        </div>
      )}
    </>
  );
}
