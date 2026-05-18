import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type User } from "@/lib/api";

// Re-exports
export { EditProfileModal } from "@/components/screens/EditProfileModal";
export { VerifyScreen, AdminVerifyScreen } from "@/components/screens/VerifyScreens";

import { EditProfileModal } from "@/components/screens/EditProfileModal";
import { SettingsSubScreen } from "@/components/screens/SettingsSubScreen";
import { ProfileTopBar, ProfileHeader } from "@/components/screens/profile/ProfileHeader";
import { ProfilePhotoSection } from "@/components/screens/profile/ProfilePhotoSection";
import { ProfileStatsBar } from "@/components/screens/profile/ProfileStatsBar";
import { FollowersModal } from "@/components/screens/profile/FollowersModal";

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help";
type ActiveTab = null | "settings" | "stats" | "shop" | "photos" | "private";
type StatKey = "height" | "weight" | "gender" | "status" | "city";
type FollowTab = "followers" | "following";

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

  const [galleryPhotos, setGalleryPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDeleteId, setGalleryDeleteId] = useState<number | null>(null);

  const [photoUploadMode, setPhotoUploadMode] = useState<"cover" | "avatar" | "gallery">("avatar");

  useEffect(() => {
    if (activeTab === "photos") {
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
  const [followModal, setFollowModal] = useState<FollowTab | null>(null);
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

      <div className="flex flex-col h-full overflow-y-auto">

        {/* Шапка с меню */}
        <ProfileTopBar
          activeTab={activeTab}
          currentUser={currentUser}
          onEditOpen={() => setEditOpen(true)}
          onTabChange={setActiveTab}
          onSettingsScreen={(s) => setSettingsScreen(s)}
          onLogout={onLogout}
          onVerify={onVerify}
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
          onAvatarClick={() => fileInputRef.current?.click()}
          onCoverClick={() => { setPhotoUploadMode("cover"); coverInputRef.current?.click(); }}
          onTabChange={setActiveTab}
          onSettingsScreen={(s) => setSettingsScreen(s)}
          onLogout={onLogout}
          onVerify={onVerify}
          onPremium={onPremium}
        />

        <div className="flex flex-col items-center px-5">
          {/* Секция Фото / Приватные фото */}
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

          {/* Рост / Вес / Пол / Статус / Город */}
          <ProfileStatsBar
            currentUser={currentUser}
            statEdit={statEdit}
            statValue={statValue}
            onOpen={openStat}
            onClose={() => setStatEdit(null)}
            onValueChange={setStatValue}
            onSave={saveStat}
          />

          {/* Подписчики и подписки */}
          <div className="glass-card w-full mt-3 flex items-center">
            <button onClick={() => setFollowModal("followers")}
              className="flex-1 flex flex-col items-center py-3 active:bg-white/5 transition-colors rounded-l-2xl">
              <span className="text-white font-bold text-xl">{currentUser.followers ?? 0}</span>
              <span className="text-white/40 text-xs mt-0.5">Подписчики</span>
            </button>
            <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.08)" }} />
            <button onClick={() => setFollowModal("following")}
              className="flex-1 flex flex-col items-center py-3 active:bg-white/5 transition-colors rounded-r-2xl">
              <span className="text-white font-bold text-xl">{currentUser.following ?? 0}</span>
              <span className="text-white/40 text-xs mt-0.5">Подписки</span>
            </button>
          </div>

          {followModal && (
            <FollowersModal initialTab={followModal} onClose={() => setFollowModal(null)} />
          )}

          {/* Панель: Статистика */}
          {activeTab === "stats" && (
            <div className="w-full mt-3 glass-card p-4 flex flex-col gap-3">
              {[
                { label: "Просмотры профиля за неделю", value: "—", icon: "Eye",           color: "#9B59B6" },
                { label: "Лайки получено",              value: "—", icon: "Heart",         color: "#FF2D78" },
                { label: "Совпадения",                  value: "—", icon: "Zap",           color: "#FF8C42" },
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
                { icon: "Crown", label: "Premium подписка",  desc: "Безлимитные лайки и приоритет",  price: "от 249 ₽/мес", action: onPremium, grad: true },
                { icon: "Star",  label: "Суперлайки × 10",   desc: "Выдели себя среди остальных",    price: "199 ₽",         action: onPremium, grad: false },
                { icon: "Zap",   label: "Буст профиля",      desc: "Топ показов на 30 минут",        price: "99 ₽",          action: onPremium, grad: false },
                { icon: "Eye",   label: "Режим инкогнито",   desc: "Просматривай анонимно",          price: "149 ₽",         action: onPremium, grad: false },
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

        {/* О себе */}
        <div className="mx-5 glass-card p-4 mb-4 mt-3">
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
                const d = new Date(currentUser.created_at!);
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