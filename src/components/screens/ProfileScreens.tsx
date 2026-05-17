import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type User } from "@/lib/api";

// Re-exports
export { EditProfileModal } from "@/components/screens/EditProfileModal";
export { VerifyScreen, AdminVerifyScreen } from "@/components/screens/VerifyScreens";

import { EditProfileModal } from "@/components/screens/EditProfileModal";
import { SettingsSubScreen } from "@/components/screens/SettingsSubScreen";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ─── RealProfileScreen ────────────────────────────────────────────────────────
export function RealProfileScreen({ currentUser, onPremium, onLogout, onPhotoUpdate, onProfileUpdate, onVerify }: {
  currentUser: User;
  onPremium: () => void;
  onLogout: () => void;
  onPhotoUpdate: (url: string) => void;
  onProfileUpdate: (data: Partial<User>) => void;
  onVerify: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [localPhoto, setLocalPhoto] = useState(currentUser.photo_url || "");
  const [localCover, setLocalCover] = useState(currentUser.cover_url || "");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (currentUser.photo_url && !photoUploading) setLocalPhoto(currentUser.photo_url);
  }, [currentUser.photo_url, photoUploading]);

  useEffect(() => {
    if (currentUser.cover_url && !coverUploading) setLocalCover(currentUser.cover_url);
  }, [currentUser.cover_url, coverUploading]);

  const [settingsScreen, setSettingsScreen] = useState<
    null | "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help"
  >(null);
  const [activeTab, setActiveTab] = useState<null | "settings" | "stats" | "shop" | "photos" | "private">(null);

  const [galleryPhotos, setGalleryPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDeleteId, setGalleryDeleteId] = useState<number | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Тип загружаемого фото в секции «Фото»: cover | avatar | gallery
  const [photoUploadMode, setPhotoUploadMode] = useState<"cover" | "avatar" | "gallery">("avatar");

  useEffect(() => {
    if ((activeTab as string) === "photos") {
      setGalleryLoading(true);
      profilesApi.listProfilePhotos().then(r => { setGalleryPhotos(r.photos); }).finally(() => setGalleryLoading(false));
    }
  }, [activeTab]);

  const handleGalleryDelete = async (id: number) => {
    setGalleryDeleteId(id);
    try {
      await profilesApi.deleteProfilePhoto(id);
      setGalleryPhotos(prev => prev.filter(p => p.id !== id));
    } finally {
      setGalleryDeleteId(null);
    }
  };

  // Универсальный обработчик выбора фото в секции «Фото»
  const handlePhotoSectionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      if (photoUploadMode === "cover") {
        setCoverUploading(true);
        setLocalCover(base64);
        try {
          const res = await profilesApi.uploadCover(base64, file.type);
          setLocalCover(`${res.cover_url}?t=${Date.now()}`);
          onProfileUpdate({ cover_url: res.cover_url });
        } catch { setLocalCover(currentUser.cover_url || ""); }
        finally { setCoverUploading(false); }
      } else if (photoUploadMode === "avatar") {
        setPhotoUploading(true);
        setLocalPhoto(base64);
        try {
          const res = await profilesApi.uploadPhoto(base64, file.type);
          setLocalPhoto(`${res.photo_url}?t=${Date.now()}`);
          onPhotoUpdate(res.photo_url);
        } catch { setLocalPhoto(currentUser.photo_url || ""); }
        finally { setPhotoUploading(false); }
      } else {
        // gallery
        setGalleryUploading(true);
        try {
          const res = await profilesApi.addProfilePhoto(base64, file.type);
          setGalleryPhotos(prev => [res.photo, ...prev]);
        } finally { setGalleryUploading(false); }
      }
    };
    reader.readAsDataURL(file);
  };

  // Загрузка аватара по клику прямо на фото (без открытия секции Фото)
  const handleAvatarDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    if (!file.type.startsWith("image/")) { setPhotoError("Выбери изображение"); return; }
    if (file.size > 10 * 1024 * 1024) { setPhotoError("Файл слишком большой (макс. 10 МБ)"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setLocalPhoto(base64);
      setPhotoUploading(true);
      try {
        const res = await profilesApi.uploadPhoto(base64, file.type);
        setLocalPhoto(`${res.photo_url}?t=${Date.now()}`);
        onPhotoUpdate(res.photo_url);
      } catch (err: unknown) {
        setPhotoError(err instanceof Error ? err.message : "Ошибка загрузки");
        setLocalPhoto(currentUser.photo_url || "");
      } finally { setPhotoUploading(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const displayPhoto = localPhoto || FALLBACK_PHOTO;

  // Максимум доп. фото: 1 бесплатно + 4 с подпиской
  const maxGallery = currentUser.premium ? 5 : 1;

  return (
    <>
      {editOpen && (
        <EditProfileModal user={currentUser} onSave={onProfileUpdate} onClose={() => setEditOpen(false)} />
      )}

      <div className="flex flex-col h-full overflow-y-auto">
        {/* Шапка */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-golos font-bold text-2xl">Профиль</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditOpen(true)}
              className="glass-card px-3 py-1.5 flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors">
              <Icon name="Pencil" size={14} />Изменить
            </button>
            <div className="relative">
              <button onClick={() => setActiveTab(v => v === "settings" ? null : "settings")}
                className="glass-card p-2 flex items-center justify-center transition-colors"
                style={activeTab === "settings" ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : {}}>
                <Icon name="MoreVertical" size={18} className="text-white/70" />
              </button>
              {activeTab === "settings" && (
                <div className="absolute right-0 top-10 z-50 rounded-2xl overflow-hidden shadow-2xl min-w-[220px]"
                  style={{ background: "rgba(22,16,36,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {[
                    { icon: "BadgeCheck", label: currentUser.verified ? "✓ Верифицирован" : "Верификация", action: () => { onVerify(); setActiveTab(null); }, accent: currentUser.verified ? "blue" : "" },
                    { icon: "User",       label: "Настройки аккаунта",   action: () => { setSettingsScreen("account"); setActiveTab(null); } },
                    { icon: "Shield",     label: "Конфиденциальность",   action: () => { setSettingsScreen("privacy"); setActiveTab(null); } },
                    { icon: "Lock",       label: "Приватные фото",       action: () => { setSettingsScreen("private_photos"); setActiveTab(null); } },
                    { icon: "Ban",        label: "Заблокированные",      action: () => { setSettingsScreen("blocked"); setActiveTab(null); } },
                    { icon: "Bell",       label: "Уведомления",          action: () => { setSettingsScreen("notifications"); setActiveTab(null); } },
                    { icon: "Palette",    label: "Внешний вид",          action: () => { setSettingsScreen("appearance"); setActiveTab(null); } },
                    { icon: "Volume2",    label: "Звуки",                action: () => { setSettingsScreen("sounds"); setActiveTab(null); } },
                    { icon: "Video",      label: "Видеочат",             action: () => { setSettingsScreen("videochat"); setActiveTab(null); } },
                    { icon: "HelpCircle", label: "Помощь и поддержка",  action: () => { setSettingsScreen("help"); setActiveTab(null); } },
                    { icon: "LogOut",     label: "Выйти",                action: () => { onLogout(); setActiveTab(null); }, danger: true },
                  ].map(({ icon, label, action, danger, accent }, i, arr) => (
                    <button key={label} onClick={action}
                      className="flex items-center gap-3 px-4 py-3 w-full hover:bg-white/5 transition-colors text-left"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <Icon name={icon as "BadgeCheck"|"User"|"Shield"|"Lock"|"Ban"|"Bell"|"Palette"|"Volume2"|"Video"|"HelpCircle"|"LogOut"} size={16}
                        className={danger ? "text-red-400" : accent === "blue" ? "text-blue-400" : "text-white/50"} />
                      <span className={`${danger ? "text-red-400" : accent === "blue" ? "text-blue-400" : "text-white/80"} text-sm flex-1`}>{label}</span>
                      {!danger && <Icon name="ChevronRight" size={13} className="text-white/20" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Скрытые инпуты */}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarDirectUpload} />
        <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSectionFile} />
        <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSectionFile} />

        <div className="flex flex-col items-center px-5 mb-5">

          {/* Фото профиля + аватар */}
          <div className="relative mb-3 w-full">
            {/* Фон / обложка */}
            <div className="w-full h-32 rounded-2xl overflow-hidden relative"
              style={{ background: localCover ? undefined : "linear-gradient(135deg,#1a0030,#3d0060)" }}>
              {localCover && (
                <img src={localCover} className="w-full h-full object-cover"
                  style={{ opacity: coverUploading ? 0.5 : 1 }} />
              )}
              {coverUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
              {!coverUploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 glass-card px-2 py-1.5 flex items-center gap-1.5 text-white/70 text-xs"
                  style={{ backdropFilter: "blur(8px)" }}>
                  <Icon name="ImagePlus" size={13} />
                  Фон
                </button>
              )}
            </div>

            {/* Аватар поверх обложки */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="relative" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer" }}>
                <img src={displayPhoto} className="w-24 h-24 rounded-full object-cover transition-opacity"
                  style={{ boxShadow: "0 0 0 3px #FF2D78", border: "3px solid var(--spark-dark,#0f0a1a)", opacity: photoUploading ? 0.5 : 1 }} />
                {photoUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full">
                    <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center btn-grad shadow-lg">
                    <Icon name="Camera" size={12} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Отступ под аватар */}
          <div className="h-12" />
          {photoError && <p className="text-red-400 text-xs mb-1 text-center">{photoError}</p>}

          <h3 className="text-white font-bold text-xl mt-1">
            {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ""}
            {currentUser.verified && <span className="ml-1.5 text-blue-400 text-base">✓</span>}
          </h3>
          {currentUser.username && (
            <p className="text-white/40 text-sm font-mono mt-0.5">@{currentUser.username}</p>
          )}

          {/* Кнопки Фото / Приватное фото */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <button onClick={() => setActiveTab(v => v === "photos" ? null : "photos" as never)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-95"
              style={(activeTab as string) === "photos"
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                : { background: "rgba(255,255,255,0.08)" }}>
              <Icon name="Image" size={18} className={(activeTab as string) === "photos" ? "text-white" : "text-white/60"} />
              <span className={`text-sm font-semibold ${(activeTab as string) === "photos" ? "text-white" : "text-white/60"}`}>Фото</span>
            </button>
            <button onClick={() => setActiveTab(v => v === "private" ? null : "private" as never)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-95"
              style={(activeTab as string) === "private"
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                : { background: "rgba(255,255,255,0.08)" }}>
              <Icon name="Lock" size={18} className={(activeTab as string) === "private" ? "text-white" : "text-white/60"} />
              <span className={`text-sm font-semibold ${(activeTab as string) === "private" ? "text-white" : "text-white/60"}`}>Приватное фото</span>
            </button>
          </div>

          {/* Premium баннер */}
          <div className="w-full mt-3 p-4 rounded-2xl cursor-pointer"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }} onClick={onPremium}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold">LoveBloom Premium</span>
                  <span className="premium-badge">✨ GOLD</span>
                </div>
                <p className="text-white/80 text-xs">Безлимитные лайки · Приоритет в поиске</p>
              </div>
              <Icon name="ChevronRight" size={20} className="text-white" />
            </div>
          </div>

          {/* ── Секция ФОТО ─────────────────────────────────────────── */}
          {(activeTab as string) === "photos" && (
            <div className="w-full mt-3 flex flex-col gap-3">

              {/* Фото на фон (обложка) */}
              <div className="glass-card p-3">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Фото на фон</p>
                <div className="flex gap-2 items-center">
                  {/* Превью обложки */}
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
                    <button
                      onClick={() => { setPhotoUploadMode("cover"); coverInputRef.current?.click(); }}
                      disabled={coverUploading}
                      className="btn-grad py-2 text-xs font-semibold rounded-xl disabled:opacity-50">
                      {localCover ? "Изменить фон" : "Загрузить фон"}
                    </button>
                    {localCover && (
                      <button
                        onClick={() => { setLocalCover(""); onProfileUpdate({ cover_url: "" }); profilesApi.updateMe({ cover_url: "" } as never).catch(() => {}); }}
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
                  <button
                    onClick={() => { setPhotoUploadMode("avatar"); coverInputRef.current?.click(); }}
                    disabled={photoUploading}
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
                        <button
                          onClick={() => handleGalleryDelete(photo.id)}
                          disabled={galleryDeleteId === photo.id}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "rgba(0,0,0,0.6)" }}>
                          {galleryDeleteId === photo.id
                            ? <Icon name="Loader2" size={12} className="text-white animate-spin" />
                            : <Icon name="X" size={12} className="text-white" />}
                        </button>
                      </div>
                    ))}
                    {galleryPhotos.length < maxGallery && (
                      <button
                        onClick={() => { setPhotoUploadMode("gallery"); galleryInputRef.current?.click(); }}
                        disabled={galleryUploading}
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
          {(activeTab as string) === "private" && (
            <div className="w-full mt-3 glass-card p-5 flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="Lock" size={22} className="text-pink-400" />
              </div>
              <p className="text-white font-semibold text-sm">Приватный альбом</p>
              <p className="text-white/40 text-xs">Добавь фото — они будут видны только тем, кому ты откроешь доступ</p>
              <button onClick={() => setSettingsScreen("private_photos")}
                className="btn-grad px-5 py-2 text-xs font-semibold mt-1">
                Настроить доступ
              </button>
            </div>
          )}

          {/* Рост, вес, пол, статус, город */}
          <div className="glass-card w-full mt-4 flex items-center flex-wrap">
            {[
              { label: "Рост",   value: currentUser.height ? `${currentUser.height} см` : "—", icon: "Ruler" },
              { label: "Вес",    value: currentUser.weight ? `${currentUser.weight} кг` : "—", icon: "Weight" },
              { label: "Пол",    value: currentUser.gender === "female" ? "Жен" : currentUser.gender === "male" ? "Муж" : "—", icon: "User" },
              { label: "Статус", value: currentUser.relationship_status === "single" ? "Своб." : currentUser.relationship_status === "taken" ? "Занят" : currentUser.relationship_status === "complicated" ? "Слож." : "—", icon: "Heart" },
              { label: "Город",  value: currentUser.city || "—", icon: "MapPin" },
            ].map(({ label, value, icon }, i, arr) => (
              <div key={label} className="flex-1 flex flex-col items-center py-3 gap-0.5 relative" style={{ minWidth: "20%" }}>
                {i < arr.length - 1 && <div className="absolute right-0 top-2 bottom-2 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />}
                <Icon name={icon as "Ruler"|"Weight"|"User"|"Heart"|"MapPin"} size={13} className="text-white/40" />
                <span className="text-white font-bold text-xs leading-tight text-center truncate w-full px-1">{value}</span>
                <span className="text-white/40 text-[9px]">{label}</span>
              </div>
            ))}
          </div>

          {/* Подписчики и подписки */}
          <div className="glass-card w-full mt-3 flex items-center">
            <div className="flex-1 flex flex-col items-center py-3">
              <span className="text-white font-bold text-xl">{currentUser.followers ?? 0}</span>
              <span className="text-white/40 text-xs mt-0.5">Подписчики</span>
            </div>
            <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex-1 flex flex-col items-center py-3">
              <span className="text-white font-bold text-xl">{currentUser.following ?? 0}</span>
              <span className="text-white/40 text-xs mt-0.5">Подписки</span>
            </div>
          </div>

          {/* Панель: Статистика */}
          {activeTab === "stats" && (
            <div className="w-full mt-3 glass-card p-4 flex flex-col gap-3">
              {[
                { label: "Просмотры профиля за неделю", value: "—", icon: "Eye", color: "#9B59B6" },
                { label: "Лайки получено",              value: "—", icon: "Heart", color: "#FF2D78" },
                { label: "Совпадения",                  value: "—", icon: "Zap", color: "#FF8C42" },
                { label: "Сообщений отправлено",        value: "—", icon: "MessageCircle", color: "#3B82F6" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}22` }}>
                    <Icon name={icon as "Eye"|"Heart"|"Zap"|"MessageCircle"} size={18} style={{ color }} />
                  </div>
                  <span className="text-white/70 text-sm flex-1">{label}</span>
                  <span className="text-white font-bold">{value}</span>
                </div>
              ))}
              <p className="text-white/20 text-xs text-center mt-1">Статистика обновляется раз в сутки</p>
            </div>
          )}

          {/* Панель: Магазин */}
          {activeTab === "shop" && (
            <div className="w-full mt-3 flex flex-col gap-2">
              {[
                { icon: "Crown",  label: "Premium подписка",  desc: "Безлимитные лайки и приоритет",  price: "от 249 ₽/мес", action: onPremium, grad: true },
                { icon: "Star",   label: "Суперлайки × 10",   desc: "Выдели себя среди остальных",    price: "199 ₽",         action: onPremium, grad: false },
                { icon: "Zap",    label: "Буст профиля",      desc: "Топ показов на 30 минут",        price: "99 ₽",          action: onPremium, grad: false },
                { icon: "Eye",    label: "Режим инкогнито",   desc: "Просматривай анонимно",          price: "149 ₽",         action: onPremium, grad: false },
              ].map(({ icon, label, desc, price, action, grad }) => (
                <button key={label} onClick={action}
                  className="glass-card p-4 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: grad ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.08)" }}>
                    <Icon name={icon as "Crown"|"Star"|"Zap"|"Eye"} size={20} className={grad ? "text-white" : "text-white/60"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                  </div>
                  <span className="text-pink-400 font-bold text-sm flex-shrink-0">{price}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-5 glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-xs uppercase tracking-widest">О себе</span>
            <button onClick={() => setEditOpen(true)} className="text-white/40 hover:text-white transition-colors">
              <Icon name="Pencil" size={14} />
            </button>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            {currentUser.bio || (
              <span className="text-white/30 italic">Расскажи о себе — нажми «Изменить»</span>
            )}
          </p>
          {(currentUser.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(currentUser.tags || []).map((t) => <span key={t} className="tag-pill">{t}</span>)}
            </div>
          )}
          {!(currentUser.tags || []).length && (
            <button onClick={() => setEditOpen(true)} className="tag-pill border-dashed opacity-50 mt-3">
              + Добавить интересы
            </button>
          )}
        </div>

        {/* Дата регистрации */}
        {currentUser.created_at && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <Icon name="Calendar" size={13} className="text-white/25" />
            <span className="text-white/25 text-xs">
              Присоединился {(() => {
                const d = new Date(currentUser.created_at);
                const now = new Date();
                const months = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
                if (months === 0) return "менее месяца назад";
                if (months === 1) return "1 месяц назад";
                if (months < 5) return `${months} месяца назад`;
                if (months < 12) return `${months} месяцев назад`;
                const years = Math.floor(months / 12);
                return years === 1 ? "1 год назад" : `${years} года назад`;
              })()}
            </span>
          </div>
        )}

        <div className="h-6" />
      </div>

      {settingsScreen && (
        <div className="absolute inset-0 z-20 flex flex-col" style={{ background: "var(--spark-dark, #0f0a1a)" }}>
          <SettingsSubScreen
            screen={settingsScreen}
            currentUser={currentUser}
            onProfileUpdate={onProfileUpdate}
            onClose={() => setSettingsScreen(null)}
          />
        </div>
      )}
    </>
  );
}
