import { useState } from "react";
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
  onPhotoDelete,
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
  onPhotoDelete: () => void;
  onGalleryAdd: () => void;
  onGalleryDelete: (id: number) => void;
  onPremium: () => void;
  onSettingsPrivate: () => void;
  activeTab: string | null;
}) {
  const displayPhoto = localPhoto || FALLBACK_PHOTO;
  const maxGallery = currentUser.premium ? 5 : 1;
  const [photoSubTab, setPhotoSubTab] = useState<"public" | "private">("public");

  return (
    <>
      {activeTab === "photos" && (
        <div className="w-full mt-3 flex flex-col gap-3">

          {/* Вложенный переключатель Публичные / Приватные */}
          <div className="flex rounded-2xl gap-1 p-1"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <button onClick={() => setPhotoSubTab("public")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-[0.97]"
              style={photoSubTab === "public"
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.35)" }
                : { background: "transparent" }}>
              <Icon name="Image" size={13} className={photoSubTab === "public" ? "text-white" : "text-white/35"} />
              <span className={`text-xs font-semibold ${photoSubTab === "public" ? "text-white" : "text-white/35"}`}>Публичные</span>
            </button>
            <button onClick={() => setPhotoSubTab("private")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-[0.97]"
              style={photoSubTab === "private"
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.35)" }
                : { background: "transparent" }}>
              <Icon name="Lock" size={13} className={photoSubTab === "private" ? "text-white" : "text-white/35"} />
              <span className={`text-xs font-semibold ${photoSubTab === "private" ? "text-white" : "text-white/35"}`}>Приватные</span>
            </button>
          </div>

          {/* Контент приватных — встроен прямо сюда */}
          {photoSubTab === "private" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.15),rgba(155,89,182,0.12))", border: "1px solid rgba(255,45,120,0.25)" }}>
                <div className="relative p-5 flex flex-col items-center gap-3 text-center">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle,#FF2D78,transparent)", transform: "translate(30%,-30%)" }} />
                  <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-15"
                    style={{ background: "radial-gradient(circle,#9B59B6,transparent)", transform: "translate(-30%,30%)" }} />
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 6px 20px rgba(255,45,120,0.45)" }}>
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

          {/* Публичные фото */}
          {photoSubTab === "public" && (<>

          {/* Фото на фон */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Превью обложки */}
            <div className="relative w-full h-28 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              {localCover
                ? <img src={localCover} className="w-full h-full object-cover" />
                : <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                    <img src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/6edc6c8d-3e28-4f1a-b881-05852bc47b49.jpg"
                      className="absolute inset-0 w-full h-full object-cover" />
                    <span className="relative text-white/75 text-[11px] font-medium px-2 py-0.5 rounded-md"
                      style={{ background: "rgba(0,0,0,0.45)" }}>Стандартный фон</span>
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
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="relative w-full h-32">
              <img src={displayPhoto} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 30%, rgba(0,0,0,0.75) 100%)" }} />
              {photoUploading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                <span className="text-white/60 text-[10px] uppercase tracking-widest">Фото профиля</span>
                <div className="flex items-center gap-2">
                  {localPhoto && (
                    <button onClick={onPhotoDelete} disabled={photoUploading}
                      className="px-3 py-2 text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center gap-1.5 transition-all active:scale-95"
                      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.14)" }}>
                      <Icon name="Trash2" size={13} className="text-white/70" />
                      Удалить
                    </button>
                  )}
                  <button onClick={onAvatarUpload} disabled={photoUploading}
                    className="btn-grad px-4 py-2 text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center gap-1.5">
                    <Icon name="Camera" size={13} className="text-white" />
                    Изменить
                  </button>
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-2">
                {galleryPhotos.map((photo, idx) => (
                  <div key={photo.id} className="relative rounded-2xl overflow-hidden"
                    style={{ aspectRatio: "4/5" }}>
                    <img src={photo.photo_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0"
                      style={{ background: "linear-gradient(transparent 55%, rgba(0,0,0,0.6) 100%)" }} />
                    <span className="absolute bottom-2 left-2.5 text-white/50 text-[10px] font-medium">
                      Фото {idx + 1}
                    </span>
                    <button
                      onClick={() => onGalleryDelete(photo.id)}
                      disabled={galleryDeleteId === photo.id}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {galleryDeleteId === photo.id
                        ? <Icon name="Loader2" size={12} className="text-white animate-spin" />
                        : <Icon name="X" size={12} className="text-white" />}
                    </button>
                  </div>
                ))}

                {galleryPhotos.length < maxGallery && (
                  <button onClick={onGalleryAdd} disabled={galleryUploading}
                    className="rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      aspectRatio: "4/5",
                      border: "2px dashed rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.03)",
                    }}>
                    {galleryUploading
                      ? <Icon name="Loader2" size={24} className="text-white/25 animate-spin" />
                      : <>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.08)" }}>
                            <Icon name="Plus" size={18} className="text-white/35" />
                          </div>
                          <span className="text-white/30 text-xs">Добавить</span>
                        </>}
                  </button>
                )}

                {galleryPhotos.length >= maxGallery && !currentUser.premium && (
                  <button onClick={onPremium}
                    className="rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{
                      aspectRatio: "4/5",
                      border: "2px dashed rgba(255,45,120,0.3)",
                      background: "linear-gradient(135deg, rgba(255,45,120,0.07), rgba(155,89,182,0.07))",
                    }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 12px rgba(255,45,120,0.4)" }}>
                      <Icon name="Crown" size={17} className="text-white" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-bold" style={{ color: "#FF2D78" }}>Premium</span>
                      <span className="text-[10px] text-white/35">ещё +4 фото</span>
                    </div>
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
          </>)}
        </div>
      )}

      {/* Подарки */}
      {activeTab === "gifts" && (
        <div className="w-full mt-3">
          <div className="rounded-2xl py-8 px-5 flex flex-col items-center gap-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.1)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.12),rgba(155,89,182,0.12))", border: "1px solid rgba(255,45,120,0.2)" }}>
              <span className="text-2xl">🎁</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-white/60 text-sm font-semibold">Подарков пока нет</p>
              <p className="text-white/25 text-xs leading-relaxed">
                Здесь появятся подарки,<br />которые тебе отправят
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}