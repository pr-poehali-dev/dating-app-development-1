import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

export function ProfilePhotosScreen({
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
  onClose,
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
  onClose: () => void;
}) {
  const [subTab, setSubTab] = useState<"public" | "private">("public");
  const maxGallery = currentUser.premium ? 5 : 1;

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "var(--spark-dark, #0d0d0d)", animation: "slideUp 0.28s ease" }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {/* Шапка */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-11 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ChevronLeft" size={18} className="text-white" />
        </button>
        <h2 className="text-white font-bold text-base flex-1">Мои фото</h2>
      </div>

      {/* Вкладки */}
      <div className="flex-shrink-0 px-4 pt-2 pb-1.5">
        <div className="flex rounded-xl gap-0.5 p-0.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {([
            { id: "public", icon: "Image", label: "Публичные" },
            { id: "private", icon: "Lock", label: "Приватные" },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setSubTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] transition-all active:scale-[0.97]"
              style={subTab === tab.id
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 8px rgba(255,45,120,0.35)" }
                : { background: "transparent" }}>
              <Icon name={tab.icon} size={13} className={subTab === tab.id ? "text-white" : "text-white/35"} />
              <span className={`text-xs font-semibold ${subTab === tab.id ? "text-white" : "text-white/35"}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>

        {/* ── ПРИВАТНЫЕ ── */}
        {subTab === "private" && (
          <>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.12),rgba(155,89,182,0.1))", border: "1px solid rgba(255,45,120,0.2)" }}>
              <div className="relative px-4 py-4 flex items-center gap-3">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-15"
                  style={{ background: "radial-gradient(circle,#FF2D78,transparent)", transform: "translate(30%,-30%)" }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 14px rgba(255,45,120,0.4)" }}>
                  <Icon name="Lock" size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">Приватный альбом</p>
                  <p className="text-white/40 text-xs leading-snug mt-0.5">Только тем, кому ты откроешь доступ</p>
                </div>
                <button onClick={onSettingsPrivate}
                  className="btn-grad px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0">
                  <Icon name="Settings" size={12} className="text-white" />
                  Настроить
                </button>
              </div>
            </div>
            <div className="rounded-xl px-3 py-2.5 flex gap-2.5 items-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon name="Info" size={14} className="text-pink-400 flex-shrink-0" />
              <p className="text-white/35 text-xs leading-relaxed">
                Приватные фото открываются по запросу. Ты сам решаешь, кому показывать альбом.
              </p>
            </div>
          </>
        )}

        {/* ── ПУБЛИЧНЫЕ ── */}
        {subTab === "public" && (
          <>
            {/* Фото на фон + Фото профиля — горизонтально рядом */}
            <div className="grid grid-cols-2 gap-2">

              {/* Фото на фон */}
              <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="relative overflow-hidden" style={{ height: 80 }}>
                  {localCover
                    ? <img src={localCover} className="w-full h-full object-cover object-top" />
                    : <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.07),rgba(155,89,182,0.07))" }}>
                        <Icon name="ImagePlus" size={22} className="text-white/15" />
                      </div>}
                  {coverUploading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
                  <span className="absolute bottom-1.5 left-2 text-white/55 text-[9px] uppercase tracking-widest font-medium">Фон</span>
                </div>
                <div className="flex gap-1 p-1.5">
                  <button onClick={onCoverUpload} disabled={coverUploading}
                    className="flex-1 btn-grad py-1.5 text-[11px] font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1">
                    <Icon name="Upload" size={11} className="text-white" />
                    {localCover ? "Изменить" : "Загрузить"}
                  </button>
                  {localCover && (
                    <button onClick={onCoverDelete}
                      className="py-1.5 px-2 rounded-lg flex items-center transition-all active:scale-95"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Icon name="Trash2" size={12} className="text-white/40" />
                    </button>
                  )}
                </div>
              </div>

              {/* Фото профиля */}
              <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 80 }}>
                  {localPhoto
                    ? <img src={localPhoto} className="w-full h-full object-cover object-top" />
                    : <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.07),rgba(155,89,182,0.07))" }}>
                        <Icon name="User" size={22} className="text-white/15" />
                      </div>
                  }
                  <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 30%, rgba(0,0,0,0.65) 100%)" }} />
                  {photoUploading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-2 text-white/55 text-[9px] uppercase tracking-widest font-medium">Профиль</span>
                </div>
                <div className="flex gap-1 p-1.5">
                  <button onClick={onAvatarUpload} disabled={photoUploading}
                    className="flex-1 btn-grad py-1.5 text-[11px] font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1">
                    <Icon name="Camera" size={11} className="text-white" />
                    Изменить
                  </button>
                  {localPhoto && (
                    <button onClick={onPhotoDelete} disabled={photoUploading}
                      className="py-1.5 px-2 rounded-lg flex items-center transition-all active:scale-95 disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Icon name="Trash2" size={12} className="text-white/40" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Дополнительные фото */}
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-white/50 text-[10px] uppercase tracking-widest">Доп. фото</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                  {galleryPhotos.length} / {maxGallery}
                </span>
              </div>

              {galleryLoading ? (
                <div className="flex justify-center py-4">
                  <Icon name="Loader2" size={20} className="text-white/30 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {galleryPhotos.map((photo, idx) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1/1" }}>
                      <img src={photo.photo_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.55) 100%)" }} />
                      <span className="absolute bottom-1 left-1.5 text-white/50 text-[9px] font-medium">{idx + 1}</span>
                      <button
                        onClick={() => onGalleryDelete(photo.id)}
                        disabled={galleryDeleteId === photo.id}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all active:scale-90"
                        style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {galleryDeleteId === photo.id
                          ? <Icon name="Loader2" size={10} className="text-white animate-spin" />
                          : <Icon name="X" size={10} className="text-white" />}
                      </button>
                    </div>
                  ))}

                  {galleryPhotos.length < maxGallery && (
                    <button onClick={onGalleryAdd} disabled={galleryUploading}
                      className="rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                      style={{ aspectRatio: "1/1", border: "1.5px dashed rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}>
                      {galleryUploading
                        ? <Icon name="Loader2" size={18} className="text-white/25 animate-spin" />
                        : <>
                            <Icon name="Plus" size={16} className="text-white/30" />
                            <span className="text-white/25 text-[9px]">Добавить</span>
                          </>}
                    </button>
                  )}

                  {galleryPhotos.length >= maxGallery && !currentUser.premium && (
                    <button onClick={onPremium}
                      className="rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                      style={{ aspectRatio: "1/1", border: "1.5px dashed rgba(255,45,120,0.3)", background: "linear-gradient(135deg, rgba(255,45,120,0.07), rgba(155,89,182,0.07))" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                        <Icon name="Crown" size={13} className="text-white" />
                      </div>
                      <span className="text-[9px] font-bold" style={{ color: "#FF2D78" }}>Premium</span>
                    </button>
                  )}
                </div>
              )}

              {!currentUser.premium && (
                <p className="text-white/20 text-[10px] mt-2 text-center">С подпиской можно добавить ещё 4 фото</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}