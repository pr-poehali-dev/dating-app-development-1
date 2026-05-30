import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type User, type MyGift } from "@/lib/api";

// Re-exports
export { EditProfileModal } from "@/components/screens/EditProfileModal";
export { VerifyScreen, AdminVerifyScreen } from "@/components/screens/VerifyScreens";

import { EditProfileModal } from "@/components/screens/EditProfileModal";
import { SettingsSubScreen } from "@/components/screens/SettingsSubScreen";
import { ProfileTopBar, ProfileHeader } from "@/components/screens/profile/ProfileHeader";
import { ProfilePhotoSection } from "@/components/screens/profile/ProfilePhotoSection";
import { ProfileLightbox } from "@/components/screens/profile/ProfileLightbox";
import { ProfileBioSection } from "@/components/screens/profile/ProfileBioSection";
import { ProfileTabPanels } from "@/components/screens/profile/ProfileTabPanels";

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help";
type ActiveTab = null | "settings" | "stats" | "shop" | "photos" | "private" | "gifts";
type StatKey = "height" | "weight" | "gender" | "status" | "city";

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
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  const [settingsScreen, setSettingsScreen] = useState<null | SettingsScreen>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") !== "light");
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  };

  const [galleryPhotos, setGalleryPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDeleteId, setGalleryDeleteId] = useState<number | null>(null);

  const [myGifts, setMyGifts] = useState<MyGift[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);

  const [photoUploadMode, setPhotoUploadMode] = useState<"cover" | "avatar" | "gallery">("avatar");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Все фото для лайтбокса: аватар + галерея
  const allPhotos = [
    ...(localPhoto ? [localPhoto] : []),
    ...galleryPhotos.map(p => p.photo_url),
  ];

  useEffect(() => {
    if (activeTab === "photos") {
      setGalleryLoading(true);
      profilesApi.listProfilePhotos().then(r => { setGalleryPhotos(r.photos); }).finally(() => setGalleryLoading(false));
    }
    if (activeTab === "gifts") {
      setGiftsLoading(true);
      profilesApi.myGifts().then(r => { setMyGifts(r.gifts); }).finally(() => setGiftsLoading(false));
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
        setGalleryUploading(true);
        try {
          const res = await profilesApi.addProfilePhoto(base64, file.type);
          setGalleryPhotos(prev => [res.photo, ...prev]);
        } finally { setGalleryUploading(false); }
      }
    };
    reader.readAsDataURL(file);
  };

  // Загрузка аватара по клику прямо на фото
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

  // Редактирование статов
  const [statEdit, setStatEdit] = useState<StatKey | null>(null);
  const [statValue, setStatValue] = useState("");

  const openStat = (key: StatKey) => {
    if (key === "height") setStatValue(String(currentUser.height || ""));
    else if (key === "weight") setStatValue(String(currentUser.weight || ""));
    else if (key === "gender") setStatValue(currentUser.gender || "");
    else if (key === "status") setStatValue(currentUser.relationship_status || "");
    else if (key === "city") setStatValue(currentUser.city || "");
    setStatEdit(key);
  };

  const saveStat = async () => {
    if (!statEdit) return;
    const payload: Partial<User> = {};
    if (statEdit === "height") payload.height = statValue ? Number(statValue) : undefined;
    else if (statEdit === "weight") payload.weight = statValue ? Number(statValue) : undefined;
    else if (statEdit === "gender") payload.gender = statValue || undefined;
    else if (statEdit === "status") payload.relationship_status = statValue || undefined;
    else if (statEdit === "city") payload.city = statValue.trim() || undefined;
    try {
      await profilesApi.updateMe(payload);
      onProfileUpdate(payload);
    } catch { /* ignore */ }
    setStatEdit(null);
  };

  return (
    <>
      {editOpen && (
        <EditProfileModal user={currentUser} onSave={onProfileUpdate} onClose={() => setEditOpen(false)} />
      )}

      {/* ── Лайтбокс фото ── */}
      {lightboxIdx !== null && allPhotos.length > 0 && (
        <ProfileLightbox
          photos={allPhotos}
          idx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onSetIdx={(updater) => setLightboxIdx(updater(lightboxIdx) as number)}
        />
      )}

      <div className="relative flex flex-col h-full overflow-y-auto">

        {/* Декоративные сердечки на тёмном фоне профиля */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <Icon name="Heart" size={120} className="absolute -right-8 top-[34%] text-white/[0.03]" fallback="Heart" />
          <Icon name="Heart" size={64} className="absolute left-4 top-[46%] text-white/[0.04]" fallback="Heart" />
          <Icon name="Heart" size={28} className="absolute right-10 top-[40%] text-white/[0.05]" fallback="Heart" />
          <Icon name="Heart" size={90} className="absolute -left-6 top-[64%] text-white/[0.03]" fallback="Heart" />
          <Icon name="Heart" size={36} className="absolute right-6 top-[72%] text-white/[0.04]" fallback="Heart" />
          <Icon name="Heart" size={22} className="absolute left-10 top-[58%] text-white/[0.05]" fallback="Heart" />
          <Icon name="Heart" size={50} className="absolute right-1/3 top-[86%] text-white/[0.03]" fallback="Heart" />
          <Icon name="Heart" size={20} className="absolute left-1/3 top-[80%] text-white/[0.04]" fallback="Heart" />
        </div>

        {/* Шапка с меню */}
        <ProfileTopBar
          menuOpen={menuOpen}
          currentUser={currentUser}
          onEditOpen={() => setEditOpen(true)}
          onMenuToggle={setMenuOpen}
          onSettingsScreen={(s) => setSettingsScreen(s)}
          onLogout={onLogout}
          onVerify={onVerify}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        {/* Скрытые инпуты */}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarDirectUpload} />
        <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSectionFile} />
        <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSectionFile} />

        {/* Обложка, аватар, ник, имя, кнопки фото, Premium-баннер */}
        <ProfileHeader
          currentUser={currentUser}
          localPhoto={localPhoto}
          localCover={localCover}
          photoUploading={photoUploading}
          coverUploading={coverUploading}
          photoError={photoError}
          activeTab={activeTab}
          onEditOpen={() => setEditOpen(true)}
          onAvatarClick={() => {
            // Загружаем галерею если ещё не загружали
            if (galleryPhotos.length === 0 && !galleryLoading) {
              setGalleryLoading(true);
              profilesApi.listProfilePhotos().then(r => setGalleryPhotos(r.photos)).finally(() => setGalleryLoading(false));
            }
            setLightboxIdx(0);
          }}
          onCoverClick={() => { setPhotoUploadMode("cover"); coverInputRef.current?.click(); }}
          onTabChange={setActiveTab}
          onSettingsScreen={(s) => setSettingsScreen(s)}
          onLogout={onLogout}
          onVerify={onVerify}
          onPremium={onPremium}
        />

        <div className="flex flex-col items-center px-5">

          {/* 1. Фото / Приватные фото */}
          <ProfilePhotoSection
            currentUser={currentUser}
            localPhoto={localPhoto}
            localCover={localCover}
            photoUploading={photoUploading}
            coverUploading={coverUploading}
            galleryPhotos={galleryPhotos}
            galleryLoading={galleryLoading}
            galleryUploading={galleryUploading}
            galleryDeleteId={galleryDeleteId}
            onCoverUpload={() => { setPhotoUploadMode("cover"); coverInputRef.current?.click(); }}
            onCoverDelete={() => {
              setLocalCover("");
              onProfileUpdate({ cover_url: "" });
              profilesApi.updateMe({ cover_url: "" } as never).catch(() => {});
            }}
            onAvatarUpload={() => { setPhotoUploadMode("avatar"); coverInputRef.current?.click(); }}
            onGalleryAdd={() => { setPhotoUploadMode("gallery"); galleryInputRef.current?.click(); }}
            onGalleryDelete={handleGalleryDelete}
            onPremium={onPremium}
            onSettingsPrivate={() => setSettingsScreen("private_photos")}
            activeTab={activeTab as string | null}
          />

          {/* 2. Premium баннер */}
          {!currentUser.premium && (
            <button className="w-full mt-3 rounded-2xl overflow-hidden active:scale-[0.98] transition-all text-left"
              onClick={onPremium}
              style={{
                background: "linear-gradient(135deg, #FF2D78 0%, #C061FF 50%, #9B59B6 100%)",
                boxShadow: "0 4px 24px rgba(255,45,120,0.4)",
              }}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-base">LoveBloom Premium</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                      style={{ background: "rgba(255,255,255,0.25)", color: "white" }}>✨ GOLD</span>
                  </div>
                  <p className="text-white/80 text-xs">Безлимитные лайки · Приоритет · Инкогнито</p>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.2)" }}>
                  <Icon name="ChevronRight" size={18} className="text-white" />
                </div>
              </div>
            </button>
          )}

          {/* 3. О себе + статы + подписчики + дата */}
          <ProfileBioSection
            currentUser={currentUser}
            statEdit={statEdit}
            statValue={statValue}
            onEditOpen={() => setEditOpen(true)}
            onOpenStat={openStat}
            onCloseStat={() => setStatEdit(null)}
            onStatValueChange={setStatValue}
            onSaveStat={saveStat}
          />

          {/* 4. Вкладки: Статистика / Магазин / Подарки */}
          <ProfileTabPanels
            activeTab={activeTab}
            myGifts={myGifts}
            giftsLoading={giftsLoading}
            onPremium={onPremium}
          />

        </div>

        <div style={{ height: "calc(2rem + env(safe-area-inset-bottom, 0px))" }} className="flex-shrink-0" />
      </div>

      {settingsScreen && (
        <div className="absolute inset-0 z-20 flex flex-col" style={{ background: "var(--spark-dark, #0f0a1a)" }}>
          <SettingsSubScreen
            screen={settingsScreen}
            currentUser={currentUser}
            onProfileUpdate={onProfileUpdate}
            onClose={() => setSettingsScreen(null)}
            onLogout={onLogout}
            onPremium={onPremium}
          />
        </div>
      )}
    </>
  );
}