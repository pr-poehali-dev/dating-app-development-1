import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, authApi, blocksApi, notifSettingsApi, type User, type BlockedUser } from "@/lib/api";
import { SettingsScreenContent } from "@/components/screens/SettingsScreenContent";
import { PasswordModal, DeleteAccountModal } from "@/components/screens/SettingsModals";
import { SecurityPanel } from "@/components/screens/settings/SecurityPanel";

// ─── SettingsSubScreen ────────────────────────────────────────────────────────
export function SettingsSubScreen({ screen, currentUser, onProfileUpdate, onClose, onLogout, onPremium, onNavigate }: {
  screen: "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help" | "security";
  currentUser: User;
  onProfileUpdate: (data: Partial<User>) => void;
  onClose: () => void;
  onLogout?: () => void;
  onPremium?: () => void;
  onNavigate?: (s: "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help" | "security") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, closeMenu]);

  const [pwModal, setPwModal] = useState(false);
  const [pwSent, setPwSent] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [menuMsg, setMenuMsg] = useState("");

  // ── Блокировки ──────────────────────────────────────────────────────────────
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [unblocking, setUnblocking] = useState<number | null>(null);

  useEffect(() => {
    if (screen !== "blocked") return;
    setBlocksLoading(true);
    blocksApi.list()
      .then(d => setBlocks(d.blocks))
      .catch(e => console.error("blocks_list error:", e))
      .finally(() => setBlocksLoading(false));
  }, [screen]);

  const handleUnblock = async (userId: number) => {
    setUnblocking(userId);
    try {
      await blocksApi.unblock(userId);
      setBlocks(prev => prev.filter(b => b.id !== userId));
    } catch (e) { console.error(e); }
    finally { setUnblocking(null); }
  };

  const handleResetPassword = async () => {
    if (!currentUser.email) return;
    setPwLoading(true);
    try {
      await authApi.resetPassword(currentUser.email);
      setPwSent(true);
    } catch { setMenuMsg("Ошибка отправки письма"); }
    finally { setPwLoading(false); }
  };

  const handleLogout = async () => {
    closeMenu();
    await authApi.logout();
    onLogout?.();
  };

  const handleDeleteAccount = async () => {
    closeMenu();
    setDeleteConfirm(false);
    await authApi.logout();
    onLogout?.();
  };

  const [name, setName] = useState(currentUser.name || "");
  const [email] = useState(currentUser.email || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [usernameError, setUsernameError] = useState("");
  const [saved, setSaved] = useState(false);

  const [notif, setNotif] = useState({ matches: true, messages: true, likes: true, promo: false });

  useEffect(() => {
    notifSettingsApi.get().then(s => setNotif(s)).catch(() => {});
  }, []);

  const handleNotifToggle = (key: keyof typeof notif) => {
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next);
    notifSettingsApi.update({ [key]: next[key] }).catch(() => {});
  };
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [appear, setAppear] = useState(() => {
    try {
      const saved = localStorage.getItem("appear_settings");
      const base = saved ? JSON.parse(saved) : { compactCards: false, showAge: true };
      // show_age берём с сервера если есть
      if (currentUser.show_age !== undefined) base.showAge = currentUser.show_age;
      return base;
    } catch { return { compactCards: false, showAge: currentUser.show_age ?? true }; }
  });

  const handleAppearToggle = (key: keyof typeof appear) => {
    const next = { ...appear, [key]: !appear[key] };
    setAppear(next);
    localStorage.setItem("appear_settings", JSON.stringify(next));
    if (key === "showAge") {
      profilesApi.updateMe({ show_age: next.showAge }).catch(() => {});
    }
  };
  const [sounds, setSounds] = useState({ messages: true, matches: true, notifications: true });

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

  const [video, setVideo] = useState({ autoAccept: false, blurBg: true, mirrorCamera: true });
  const [privacy, setPrivacy] = useState({ showOnline: true, showDistance: true, readReceipts: true, searchable: true });

  const [incognito, setIncognito] = useState(currentUser.incognito ?? false);
  const [incognitoLoading, setIncognitoLoading] = useState(false);

  useEffect(() => {
    if (screen === "privacy") {
      profilesApi.getIncognito().then(r => setIncognito(r.incognito)).catch(() => {});
    }
  }, [screen]);

  const handleIncognitoToggle = async () => {
    if (!currentUser.premium) return;
    setIncognitoLoading(true);
    try {
      const r = await profilesApi.toggleIncognito();
      setIncognito(r.incognito);
    } catch { /* ignore */ }
    finally { setIncognitoLoading(false); }
  };

  // Приватные фото
  type PrivatePhoto = { id: number; photo_url: string; created_at: string };
  const [privatePhotos, setPrivatePhotos] = useState<PrivatePhoto[]>([]);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [privateUploading, setPrivateUploading] = useState(false);
  const [privateError, setPrivateError] = useState("");

  useEffect(() => {
    if (screen === "private_photos") {
      setPrivateLoading(true);
      profilesApi.listPrivatePhotos().then(r => setPrivatePhotos(r.photos)).finally(() => setPrivateLoading(false));
    }
  }, [screen]);

  const handlePrivateUpload = async (file: File) => {
    setPrivateError("");
    setPrivateUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const r = await profilesApi.addPrivatePhoto(dataUrl, file.type);
        if (r.error === "limit") {
          setPrivateError(r.premium ? "Достигнут лимит: максимум 2 фото с подпиской" : "Бесплатный лимит: 1 фото. Оформи подписку для 2 фото");
        } else if (r.ok && r.photo) {
          setPrivatePhotos(prev => [r.photo, ...prev]);
        }
      } finally {
        setPrivateUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrivateDelete = async (id: number) => {
    await profilesApi.deletePrivatePhoto(id);
    setPrivatePhotos(prev => prev.filter(p => p.id !== id));
  };

  void email;

  const titles: Record<string, string> = {
    account: "Настройки аккаунта",
    privacy: "Конфиденциальность",
    notifications: "Уведомления",
    appearance: "Внешний вид",
    sounds: "Звуки",
    videochat: "Видеочат",
    private_photos: "Приватные фото",
    blocked: "Заблокированные",
    help: "Помощь и поддержка",
    security: "Безопасность",
  };

  const saveAccount = async () => {
    setUsernameError("");
    if (currentUser.premium && username && !/^[a-z0-9_.]{3,50}$/.test(username)) {
      setUsernameError("Только латиница, цифры, _ и . (3-50 символов)");
      return;
    }
    try {
      const updateData = currentUser.premium
        ? { name, username: username || undefined }
        : { name };
      await profilesApi.updateMe(updateData as Parameters<typeof profilesApi.updateMe>[0]);
      onProfileUpdate(updateData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setUsernameError(e instanceof Error ? e.message : "Ошибка сохранения");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Хедер */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 flex-shrink-0">
        <button onClick={onClose} className="glass-card p-2">
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
        <h2 className="text-white font-golos font-bold text-xl flex-1">{titles[screen]}</h2>
        {screen === "account" && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)} className="glass-card p-2">
              <Icon name="MoreVertical" size={20} className="text-white" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50 shadow-xl"
                style={{ background: "var(--spark-card)", border: "1px solid var(--spark-divider)" }}>
                {[
                  { icon: "RotateCcw", label: "Восстановить покупки", danger: false, action: () => { closeMenu(); onPremium?.(); } },
                  { icon: "KeyRound",  label: "Сменить пароль",       danger: false, action: () => { closeMenu(); setPwSent(false); setMenuMsg(""); setPwModal(true); } },
                  { icon: "LogOut",    label: "Выйти",                danger: false, action: handleLogout },
                  { icon: "Trash2",    label: "Удалить аккаунт",      danger: true,  action: () => { closeMenu(); setDeleteConfirm(true); } },
                ].map(({ icon, label, danger, action }) => (
                  <button key={label} onClick={action}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 border-b border-white/5 last:border-0"
                    style={{ color: danger ? "#EF4444" : "var(--spark-text, white)" }}>
                    <Icon name={icon} size={16} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Контент */}
      {screen === "security" && (
        <div className="flex-1 overflow-y-auto pb-8">
          <SecurityPanel onLogout={onLogout} />
        </div>
      )}
      {screen !== "security" && <SettingsScreenContent
        screen={screen}
        currentUser={currentUser}
        onPremium={onPremium}
        name={name}
        username={username}
        usernameError={usernameError}
        saved={saved}
        onNameChange={setName}
        onUsernameChange={(v) => { setUsername(v); setUsernameError(""); }}
        onSaveAccount={saveAccount}
        privacy={privacy}
        onPrivacyToggle={(key) => setPrivacy(p => ({ ...p, [key]: !p[key] }))}
        notif={notif}
        onNotifToggle={handleNotifToggle}
        isDark={isDark}
        appear={appear}
        onToggleTheme={toggleTheme}
        onAppearToggle={handleAppearToggle}
        sounds={sounds}
        onSoundsToggle={(key) => setSounds(s => ({ ...s, [key]: !s[key] }))}
        video={video}
        onVideoToggle={(key) => setVideo(v => ({ ...v, [key]: !v[key] }))}
        privatePhotos={privatePhotos}
        privateLoading={privateLoading}
        privateUploading={privateUploading}
        privateError={privateError}
        onPrivateUpload={handlePrivateUpload}
        onPrivateDelete={handlePrivateDelete}
        blocks={blocks}
        blocksLoading={blocksLoading}
        unblocking={unblocking}
        onUnblock={handleUnblock}
        incognito={incognito}
        incognitoLoading={incognitoLoading}
        onIncognitoToggle={handleIncognitoToggle}
        onOpenBlocked={() => onNavigate?.("blocked")}
      />}

      {/* Модалы */}
      {pwModal && (
        <PasswordModal
          email={currentUser.email || ""}
          pwSent={pwSent}
          pwLoading={pwLoading}
          menuMsg={menuMsg}
          onClose={() => setPwModal(false)}
          onSend={handleResetPassword}
        />
      )}
      {deleteConfirm && (
        <DeleteAccountModal
          onClose={() => setDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}