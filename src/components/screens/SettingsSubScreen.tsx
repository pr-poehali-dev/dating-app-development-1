import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type User } from "@/lib/api";

// ─── SettingsSubScreen ────────────────────────────────────────────────────────
export function SettingsSubScreen({ screen, currentUser, onProfileUpdate, onClose }: {
  screen: "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help";
  currentUser: User;
  onProfileUpdate: (data: Partial<User>) => void;
  onClose: () => void;
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

  const [name, setName] = useState(currentUser.name || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [usernameError, setUsernameError] = useState("");
  const [saved, setSaved] = useState(false);

  const [notif, setNotif] = useState({ matches: true, messages: true, likes: true, promo: false });
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [appear, setAppear] = useState({ compactCards: false, showAge: true });
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

  // Приватные фото
  type PrivatePhoto = { id: number; photo_url: string; created_at: string };
  const [privatePhotos, setPrivatePhotos] = useState<PrivatePhoto[]>([]);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [privateUploading, setPrivateUploading] = useState(false);
  const [privateError, setPrivateError] = useState("");
  const privateInputRef = useRef<HTMLInputElement>(null);

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
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200 relative"
      style={{ background: value ? "linear-gradient(90deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }} />
    </button>
  );

  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-white/85 text-sm">{label}</p>
        {sub && <p className="text-white/35 text-xs mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );

  const saveAccount = async () => {
    setUsernameError("");
    if (username && !/^[a-z0-9_.]{3,50}$/.test(username)) {
      setUsernameError("Только латиница, цифры, _ и . (3-50 символов)");
      return;
    }
    try {
      await profilesApi.updateMe({ name, username: username || undefined } as Parameters<typeof profilesApi.updateMe>[0]);
      onProfileUpdate({ name, username: username || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setUsernameError(e instanceof Error ? e.message : "Ошибка сохранения");
    }
  };

  return (
    <div className="flex flex-col h-full">
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
                  { icon: "RotateCcw", label: "Восстановить покупки", danger: false },
                  { icon: "KeyRound",  label: "Сменить пароль",       danger: false },
                  { icon: "LogOut",    label: "Выйти",                danger: false },
                  { icon: "Trash2",    label: "Удалить аккаунт",      danger: true  },
                ].map(({ icon, label, danger }) => (
                  <button key={label} onClick={closeMenu}
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

      <div className="flex-1 overflow-y-auto pb-8">
        {screen === "account" && (
          <div className="px-5 flex flex-col gap-4">
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Имя</p>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-white text-sm outline-none placeholder-white/30"
                  placeholder="Твоё имя" />
              </div>
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Имя пользователя</p>
                <div className="flex items-center gap-1">
                  <span className="text-white/30 text-sm">@</span>
                  <input value={username} onChange={(e) => { setUsername(e.target.value.toLowerCase()); setUsernameError(""); }}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30 font-mono"
                    placeholder="username" maxLength={50} />
                </div>
                {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
                <p className="text-white/25 text-xs mt-1">Только a-z, 0-9, _ и . (3–50 символов)</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Электронная почта</p>
                <input value={currentUser.email || ""} readOnly type="email"
                  className="w-full bg-transparent text-white text-sm outline-none placeholder-white/30 opacity-60" />
              </div>
            </div>
            <button onClick={saveAccount}
              className="btn-grad py-3.5 text-sm font-semibold text-white rounded-2xl flex items-center justify-center gap-2">
              {saved ? <><Icon name="Check" size={16} className="text-white" />Сохранено!</> : "Сохранить изменения"}
            </button>
          </div>
        )}

        {screen === "privacy" && (
          <div className="mx-5 glass-card overflow-hidden">
            <Row label="Показывать онлайн" sub="Другие видят, когда ты в сети">
              <Toggle value={privacy.showOnline} onChange={() => setPrivacy(p => ({ ...p, showOnline: !p.showOnline }))} />
            </Row>
            <Row label="Показывать расстояние" sub="Дистанция в профиле">
              <Toggle value={privacy.showDistance} onChange={() => setPrivacy(p => ({ ...p, showDistance: !p.showDistance }))} />
            </Row>
            <Row label="Прочитано" sub="Отметки о прочтении сообщений">
              <Toggle value={privacy.readReceipts} onChange={() => setPrivacy(p => ({ ...p, readReceipts: !p.readReceipts }))} />
            </Row>
            <Row label="Доступен для поиска" sub="Твой профиль видят в рекомендациях">
              <Toggle value={privacy.searchable} onChange={() => setPrivacy(p => ({ ...p, searchable: !p.searchable }))} />
            </Row>
          </div>
        )}

        {screen === "notifications" && (
          <div className="mx-5 glass-card overflow-hidden">
            <Row label="Новые совпадения" sub="Когда кто-то ответил взаимностью">
              <Toggle value={notif.matches} onChange={() => setNotif(n => ({ ...n, matches: !n.matches }))} />
            </Row>
            <Row label="Сообщения" sub="Входящие сообщения в чатах">
              <Toggle value={notif.messages} onChange={() => setNotif(n => ({ ...n, messages: !n.messages }))} />
            </Row>
            <Row label="Лайки" sub="Кто оценил твой профиль">
              <Toggle value={notif.likes} onChange={() => setNotif(n => ({ ...n, likes: !n.likes }))} />
            </Row>
            <Row label="Акции и новости" sub="Промо и обновления приложения">
              <Toggle value={notif.promo} onChange={() => setNotif(n => ({ ...n, promo: !n.promo }))} />
            </Row>
          </div>
        )}

        {screen === "appearance" && (
          <div className="mx-5 glass-card overflow-hidden">
            <Row label="Тёмная тема" sub="Тёмный фон интерфейса">
              <Toggle value={isDark} onChange={toggleTheme} />
            </Row>
            <Row label="Компактные карточки" sub="Меньше информации на карточке">
              <Toggle value={appear.compactCards} onChange={() => setAppear(a => ({ ...a, compactCards: !a.compactCards }))} />
            </Row>
            <Row label="Показывать возраст" sub="Возраст отображается в профиле">
              <Toggle value={appear.showAge} onChange={() => setAppear(a => ({ ...a, showAge: !a.showAge }))} />
            </Row>
          </div>
        )}

        {screen === "sounds" && (
          <div className="mx-5 glass-card overflow-hidden">
            <Row label="Звук сообщений" sub="Звук при входящем сообщении">
              <Toggle value={sounds.messages} onChange={() => setSounds(s => ({ ...s, messages: !s.messages }))} />
            </Row>
            <Row label="Звук совпадений" sub="Звук при новом совпадении">
              <Toggle value={sounds.matches} onChange={() => setSounds(s => ({ ...s, matches: !s.matches }))} />
            </Row>
            <Row label="Звук уведомлений" sub="Остальные уведомления">
              <Toggle value={sounds.notifications} onChange={() => setSounds(s => ({ ...s, notifications: !s.notifications }))} />
            </Row>
          </div>
        )}

        {screen === "videochat" && (
          <div className="mx-5 glass-card overflow-hidden">
            <Row label="Авто-принятие звонков" sub="Видеозвонки принимаются автоматически">
              <Toggle value={video.autoAccept} onChange={() => setVideo(v => ({ ...v, autoAccept: !v.autoAccept }))} />
            </Row>
            <Row label="Размытый фон" sub="Скрывать фон во время звонка">
              <Toggle value={video.blurBg} onChange={() => setVideo(v => ({ ...v, blurBg: !v.blurBg }))} />
            </Row>
            <Row label="Зеркальная камера" sub="Отразить изображение камеры">
              <Toggle value={video.mirrorCamera} onChange={() => setVideo(v => ({ ...v, mirrorCamera: !v.mirrorCamera }))} />
            </Row>
          </div>
        )}

        {screen === "private_photos" && (
          <div className="px-5 flex flex-col gap-4">
            <div className="glass-card p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,45,120,0.15)" }}>
                  <Icon name="Lock" size={20} className="text-pink-500" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Приватные фото</p>
                  <p className="text-white/50 text-xs">Доступны только по запросу</p>
                </div>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">Добавь фото в приватный альбом. Другие пользователи смогут запросить доступ, и ты решишь — открыть или нет.</p>
            </div>
            <input ref={privateInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePrivateUpload(f); e.target.value = ""; }} />

            {/* Лимит */}
            <div className="glass-card px-4 py-3 flex items-center gap-3">
              <Icon name="Info" size={16} className="text-white/30 flex-shrink-0" />
              <p className="text-white/40 text-xs leading-relaxed">
                {currentUser.premium
                  ? `Подписка: максимум 2 фото (загружено ${privatePhotos.length}/2)`
                  : `Бесплатно: 1 фото (загружено ${privatePhotos.length}/1). Подписка даёт 2 фото`}
              </p>
            </div>

            {privateError && <p className="text-red-400 text-sm text-center px-1">{privateError}</p>}

            {privateLoading ? (
              <div className="flex justify-center py-8"><Icon name="Loader2" size={28} className="text-white/30 animate-spin" /></div>
            ) : privatePhotos.length === 0 ? (
              <div className="glass-card p-8 flex flex-col items-center gap-3 rounded-3xl" style={{ border: "2px dashed rgba(255,255,255,0.1)" }}>
                <Icon name="ImagePlus" size={36} className="text-white/20" />
                <p className="text-white/30 text-sm text-center">У тебя пока нет приватных фото</p>
                <button onClick={() => privateInputRef.current?.click()} disabled={privateUploading}
                  className="btn-grad px-5 py-2 text-sm font-semibold text-white rounded-2xl disabled:opacity-50">
                  {privateUploading ? "Загрузка..." : "Добавить фото"}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {privatePhotos.map(p => (
                    <div key={p.id} className="relative aspect-square rounded-2xl overflow-hidden">
                      <img src={p.photo_url} className="w-full h-full object-cover" />
                      <button onClick={() => handlePrivateDelete(p.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.6)" }}>
                        <Icon name="X" size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                {((currentUser.premium && privatePhotos.length < 2) || (!currentUser.premium && privatePhotos.length < 1)) && (
                  <button onClick={() => privateInputRef.current?.click()} disabled={privateUploading}
                    className="btn-grad py-2.5 text-sm font-semibold text-white rounded-2xl disabled:opacity-50">
                    {privateUploading ? "Загрузка..." : "Добавить ещё фото"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {screen === "blocked" && (
          <div className="px-5 flex flex-col gap-4">
            <div className="glass-card p-8 flex flex-col items-center gap-3">
              <Icon name="Ban" size={40} className="text-white/20" />
              <p className="text-white/30 text-sm text-center">Список заблокированных пуст</p>
              <p className="text-white/20 text-xs text-center leading-relaxed">Заблокированные пользователи не могут видеть твой профиль и писать тебе</p>
            </div>
          </div>
        )}

        {screen === "help" && (
          <div className="px-5 flex flex-col gap-3">
            {[
              { icon: "MessageCircle", title: "Написать в поддержку", sub: "Ответим в течение 24 часов" },
              { icon: "BookOpen", title: "Частые вопросы", sub: "Ответы на популярные вопросы" },
              { icon: "FileText", title: "Правила сообщества", sub: "Как мы обеспечиваем безопасность" },
              { icon: "Shield", title: "Политика конфиденциальности", sub: "Как мы работаем с данными" },
              { icon: "Info", title: "О приложении", sub: "LoveBloom v1.0" },
            ].map((item) => (
              <button key={item.title} className="glass-card flex items-center gap-4 px-4 py-3.5 w-full text-left hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,45,120,0.12)" }}>
                  <Icon name={item.icon as "MessageCircle"|"BookOpen"|"FileText"|"Shield"|"Info"} size={18} className="text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 text-sm">{item.title}</p>
                  <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
                </div>
                <Icon name="ChevronRight" size={15} className="text-white/25 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}