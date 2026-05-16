import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, verifyApi, type User, type VerifyStatus, type AdminVerifyRequest } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";
const ALL_INTERESTS = ["Путешествия", "Спорт", "Кино", "Музыка", "Кулинария", "Фотография", "Йога", "Искусство", "Книги", "Танцы", "Природа", "IT", "Кофе", "Игры", "Животные", "Фитнес"];

// ─── EditProfileModal ─────────────────────────────────────────────────────────
export function EditProfileModal({ user, onSave, onClose }: {
  user: User;
  onSave: (updated: Partial<User>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [age, setAge] = useState(String(user.age || ""));
  const [city, setCity] = useState(user.city || "");
  const [bio, setBio] = useState(user.bio || "");
  const [gender, setGender] = useState(user.gender || "other");
  const [tags, setTags] = useState<string[]>(user.tags || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (t: string) =>
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Введи имя"); return; }
    setError("");
    setSaving(true);
    const payload: Partial<User> = {
      name: name.trim(),
      age: age ? Number(age) : undefined,
      city: city.trim(),
      bio: bio.trim(),
      gender,
      tags,
    };
    try {
      await profilesApi.updateMe(payload);
      onSave(payload);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm flex flex-col animate-slide-up"
        style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0", maxHeight: "92dvh" }}>

        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-sm">Отмена</button>
          <h3 className="text-white font-golos font-bold text-base">Редактировать профиль</h3>
          <button onClick={handleSave} disabled={saving} className="btn-grad px-4 py-1.5 text-sm">
            {saving ? "..." : "Сохранить"}
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4 pb-8">
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 rounded-2xl py-2 px-4">{error}</div>
          )}

          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Имя</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоё имя" maxLength={50}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Возраст</label>
              <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="25" type="number" min={18} max={99}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Город</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" maxLength={60}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Я</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ value: "female", label: "Девушка" }, { value: "male", label: "Парень" }, { value: "other", label: "Другое" }].map((g) => (
                <button key={g.value} onClick={() => setGender(g.value)}
                  className="py-2.5 rounded-2xl text-sm font-medium transition-all"
                  style={gender === g.value
                    ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">О себе</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажи о себе — это привлечёт больше симпатий!" maxLength={300} rows={4}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos resize-none" />
            <p className="text-white/30 text-xs text-right mt-1">{bio.length}/300</p>
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">
              Интересы <span className="text-white/30 normal-case">(выбрано {tags.length})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map((t) => (
                <button key={t} onClick={() => toggleTag(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={tags.includes(t)
                    ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SettingsSubScreen ────────────────────────────────────────────────────────
function SettingsSubScreen({ screen, currentUser, onProfileUpdate, onClose }: {
  screen: "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help";
  currentUser: User;
  onProfileUpdate: (data: Partial<User>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentUser.name || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [usernameError, setUsernameError] = useState("");
  const [saved, setSaved] = useState(false);

  const [notif, setNotif] = useState({ matches: true, messages: true, likes: true, promo: false });
  const [appear, setAppear] = useState({ darkMode: true, compactCards: false, showAge: true });
  const [sounds, setSounds] = useState({ messages: true, matches: true, notifications: true });
  const [video, setVideo] = useState({ autoAccept: false, blurBg: true, mirrorCamera: true });
  const [privacy, setPrivacy] = useState({ showOnline: true, showDistance: true, readReceipts: true, searchable: true });

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
              <Toggle value={appear.darkMode} onChange={() => setAppear(a => ({ ...a, darkMode: !a.darkMode }))} />
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
            <div className="glass-card p-8 flex flex-col items-center gap-3 rounded-3xl" style={{ border: "2px dashed rgba(255,255,255,0.1)" }}>
              <Icon name="ImagePlus" size={36} className="text-white/20" />
              <p className="text-white/30 text-sm text-center">У тебя пока нет приватных фото</p>
              <button className="btn-grad px-5 py-2 text-sm font-semibold text-white rounded-2xl">Добавить фото</button>
            </div>
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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [localPhoto, setLocalPhoto] = useState(currentUser.photo_url || "");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (currentUser.photo_url && !photoUploading) {
      setLocalPhoto(currentUser.photo_url);
    }
  }, [currentUser.photo_url, photoUploading]);

  const [settingsScreen, setSettingsScreen] = useState<
    null | "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help"
  >(null);
  const [activeTab, setActiveTab] = useState<null | "settings" | "stats" | "shop">(null);

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const freshUrl = `${res.photo_url}?t=${Date.now()}`;
        setLocalPhoto(freshUrl);
        onPhotoUpdate(res.photo_url);
      } catch (err: unknown) {
        setPhotoError(err instanceof Error ? err.message : "Ошибка загрузки");
        setLocalPhoto(currentUser.photo_url || "");
      } finally {
        setPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const settingsGroups = [
    {
      title: "Аккаунт",
      items: [
        { icon: "BadgeCheck", label: "Верификация", value: currentUser.verified ? "✓ Верифицирован" : "Получить значок", action: onVerify, accent: currentUser.verified ? "blue" : "" },
        { icon: "User", label: "Настройки аккаунта", value: "", action: () => setSettingsScreen("account"), accent: "" },
        { icon: "Shield", label: "Конфиденциальность", value: "", action: () => setSettingsScreen("privacy"), accent: "" },
        { icon: "Lock", label: "Приватные фото", value: "", action: () => setSettingsScreen("private_photos"), accent: "" },
        { icon: "Ban", label: "Заблокированные", value: "", action: () => setSettingsScreen("blocked"), accent: "" },
      ],
    },
    {
      title: "Уведомления и интерфейс",
      items: [
        { icon: "Bell", label: "Уведомления", value: "", action: () => setSettingsScreen("notifications"), accent: "" },
        { icon: "Palette", label: "Внешний вид", value: "", action: () => setSettingsScreen("appearance"), accent: "" },
        { icon: "Volume2", label: "Звуки", value: "", action: () => setSettingsScreen("sounds"), accent: "" },
        { icon: "Video", label: "Видеочат", value: "", action: () => setSettingsScreen("videochat"), accent: "" },
      ],
    },
    {
      title: "Помощь",
      items: [
        { icon: "HelpCircle", label: "Помощь и поддержка", value: "", action: () => setSettingsScreen("help"), accent: "" },
      ],
    },
    {
      title: "",
      items: [
        { icon: "LogOut", label: "Выйти", value: "", action: onLogout, accent: "danger" },
      ],
    },
  ];

  const displayPhoto = localPhoto || FALLBACK_PHOTO;

  return (
    <>
      {editOpen && (
        <EditProfileModal user={currentUser} onSave={onProfileUpdate} onClose={() => setEditOpen(false)} />
      )}

      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
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

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

        <div className="flex flex-col items-center px-5 mb-5">
          <div className="relative mb-3" onClick={handlePhotoClick} style={{ cursor: "pointer" }}>
            <img src={displayPhoto} className="w-24 h-24 rounded-full object-cover transition-opacity"
              style={{ boxShadow: "0 0 0 3px #FF2D78", opacity: photoUploading ? 0.5 : 1 }} />
            {photoUploading ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center btn-grad">
                <Icon name="Camera" size={13} className="text-white" />
              </div>
            )}
          </div>
          {photoError && <p className="text-red-400 text-xs mb-1 text-center">{photoError}</p>}

          <h3 className="text-white font-bold text-xl mt-1">
            {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ""}
            {currentUser.verified && <span className="ml-1.5 text-blue-400 text-base">✓</span>}
          </h3>
          {currentUser.username && (
            <p className="text-white/40 text-sm font-mono mt-0.5">@{currentUser.username}</p>
          )}
          <p className="text-white/50 text-sm flex items-center gap-1 mt-0.5">
            <Icon name="MapPin" size={13} />{currentUser.city || "Город не указан"}
          </p>

          <div className="grid grid-cols-3 gap-3 w-full mt-4">
            {[
              { label: "Лайки", value: "—", icon: "Heart", color: "#FF2D78" },
              { label: "Просмотры", value: "—", icon: "Eye", color: "#9B59B6" },
              { label: "Совпадения", value: "—", icon: "Zap", color: "#FF8C42" },
            ].map((s) => (
              <div key={s.label} className="glass-card p-3 flex flex-col items-center gap-1">
                <Icon name={s.icon as "Heart" | "Eye" | "Zap"} size={18} style={{ color: s.color }} />
                <span className="text-white font-bold text-lg">{s.value}</span>
                <span className="text-white/50 text-xs">{s.label}</span>
              </div>
            ))}
          </div>

          {/* 3 кнопки действий */}
          <div className="grid grid-cols-3 gap-2 w-full mt-4">
            {[
              { icon: "BarChart2",  label: "Статистика",        action: () => setActiveTab(v => v === "stats" ? null : "stats"),   tab: "stats" },
              { icon: "ShoppingBag",label: "Магазин",           action: () => setActiveTab(v => v === "shop" ? null : "shop"),     tab: "shop" },
              { icon: "Shield",     label: "Конфиденц.",        action: () => setSettingsScreen("privacy"),                        tab: "privacy" },
            ].map(({ icon, label, action, tab }) => (
              <button key={label} onClick={action}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
                style={activeTab === tab
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
                  : { background: "rgba(255,255,255,0.08)" }}>
                <Icon name={icon as "BarChart2"|"ShoppingBag"|"Shield"} size={20}
                  className={activeTab === tab ? "text-white" : "text-white/60"} />
                <span className={`text-[10px] font-medium ${activeTab === tab ? "text-white" : "text-white/50"}`}>{label}</span>
              </button>
            ))}
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

        <div className="mx-5 p-4 rounded-2xl mb-4 cursor-pointer"
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

// ─── VerifyScreen ─────────────────────────────────────────────────────────────
export function VerifyScreen({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"main" | "email" | "selfie">("main");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    verifyApi.getStatus()
      .then((s) => { setStatus(s); if (s.email) setEmail(s.email); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sendCode = async () => {
    if (!email.includes("@")) return setMsg("Введи корректный email");
    setSending(true); setMsg("");
    try { await verifyApi.sendEmailCode(email); setCodeSent(true); setMsg("Код отправлен на " + email); }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSending(false); }
  };

  const confirmCode = async () => {
    if (code.length < 6) return setMsg("Введи 6-значный код");
    setSending(true); setMsg("");
    try {
      await verifyApi.confirmEmailCode(email, code);
      setMsg("Email подтверждён!");
      const s = await verifyApi.getStatus();
      setStatus(s); setStep("main");
    }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Неверный код"); }
    finally { setSending(false); }
  };

  const handleSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = ev.target?.result as string;
      setUploading(true); setMsg("");
      try {
        await verifyApi.uploadSelfie(b64, file.type);
        setMsg("Селфи отправлено на проверку!");
        const s = await verifyApi.getStatus(); setStatus(s); setStep("main");
      } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка загрузки"); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const statusBadge = () => {
    if (status?.verified) return { text: "Верифицирован ✓", color: "#3B82F6" };
    if (status?.selfie_status === "pending") return { text: "На проверке...", color: "#F59E0B" };
    if (status?.selfie_status === "rejected") return { text: "Отклонено", color: "#EF4444" };
    return null;
  };
  const badge = statusBadge();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={onClose} className="glass-card p-2"><Icon name="ChevronLeft" size={20} className="text-white" /></button>
        <h2 className="text-white font-golos font-bold text-xl flex-1">Верификация</h2>
        {badge && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: badge.color + "25", color: badge.color }}>
            {badge.text}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      ) : step === "main" ? (
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-6">
          <div className="glass-card p-4 flex flex-col gap-2">
            <p className="text-white font-semibold text-sm">Зачем нужна верификация?</p>
            <p className="text-white/60 text-xs leading-relaxed">Значок ✓ на твоём профиле показывает другим пользователям, что ты реальный человек. Это повышает доверие и количество совпадений.</p>
          </div>

          <div className="glass-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: status?.email_verified ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.1)", color: status?.email_verified ? "#3B82F6" : "white" }}>
                {status?.email_verified ? "✓" : "1"}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Подтверди email</p>
                <p className="text-white/50 text-xs">{status?.email_verified ? `${status.email} — подтверждён` : "Получи код на почту"}</p>
              </div>
              {!status?.email_verified && (
                <button onClick={() => { setStep("email"); setMsg(""); }}
                  className="btn-grad px-3 py-1.5 text-xs font-semibold">Начать</button>
              )}
            </div>
          </div>

          <div className="glass-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: status?.selfie_status === "approved" ? "rgba(59,130,246,0.2)" : status?.selfie_status === "pending" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.1)",
                  color: status?.selfie_status === "approved" ? "#3B82F6" : status?.selfie_status === "pending" ? "#F59E0B" : "white"
                }}>
                {status?.selfie_status === "approved" ? "✓" : status?.selfie_status === "pending" ? "⏳" : "2"}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Селфи с жестом</p>
                <p className="text-white/50 text-xs">
                  {status?.selfie_status === "pending" ? "Ожидает проверки администратором"
                    : status?.selfie_status === "rejected" ? `Отклонено: ${status.reject_reason || "без причины"}`
                    : status?.selfie_status === "approved" ? "Одобрено"
                    : "Фото с поднятым большим пальцем"}
                </p>
              </div>
              {(!status?.selfie_status || status.selfie_status === "rejected") && (
                <button onClick={() => { setStep("selfie"); setMsg(""); }}
                  className="glass-card px-3 py-1.5 text-xs text-white/70">Загрузить</button>
              )}
            </div>
          </div>

          {status?.verified && (
            <div className="p-4 rounded-2xl text-center" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <p className="text-blue-400 font-bold text-lg">✓ Профиль верифицирован</p>
              <p className="text-white/50 text-xs mt-1">Значок отображается на твоём профиле</p>
            </div>
          )}

          {msg && <p className="text-center text-sm" style={{ color: msg.includes("!") ? "#4ADE80" : "#FB7185" }}>{msg}</p>}
        </div>

      ) : step === "email" ? (
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-6">
          <div className="glass-card p-4 flex flex-col gap-4">
            <p className="text-white font-semibold text-sm">Введи email для подтверждения</p>
            <input value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="example@mail.com" type="email"
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
            {!codeSent ? (
              <button onClick={sendCode} disabled={sending}
                className="btn-grad py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {sending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправляем...</> : "Отправить код"}
              </button>
            ) : (
              <>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-значный код"
                  maxLength={6} inputMode="numeric"
                  className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos text-center text-xl tracking-widest" />
                <button onClick={confirmCode} disabled={sending}
                  className="btn-grad py-3 text-sm font-semibold disabled:opacity-50">
                  {sending ? "Проверяем..." : "Подтвердить"}
                </button>
                <button onClick={sendCode} className="text-white/40 text-xs text-center">Отправить повторно</button>
              </>
            )}
            {msg && <p className="text-center text-xs" style={{ color: msg.includes("отправлен") || msg.includes("!") ? "#4ADE80" : "#FB7185" }}>{msg}</p>}
          </div>
          <button onClick={() => setStep("main")} className="text-white/40 text-sm text-center">← Назад</button>
        </div>

      ) : (
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-6">
          <div className="glass-card p-5 flex flex-col gap-4 items-center">
            <div className="text-5xl">🤳</div>
            <p className="text-white font-semibold text-center">Сделай селфи с жестом</p>
            <div className="flex flex-col gap-2 w-full">
              {["Смотри в камеру", "Покажи большой палец вверх 👍", "Лицо должно быть чётко видно", "Хорошее освещение"].map((tip) => (
                <div key={tip} className="flex items-center gap-2 text-white/60 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />{tip}
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfie} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="btn-grad w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {uploading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Загружаем...</>
                : <><Icon name="Camera" size={18} className="text-white" />Сделать фото</>}
            </button>
            {msg && <p className="text-center text-xs" style={{ color: msg.includes("!") ? "#4ADE80" : "#FB7185" }}>{msg}</p>}
          </div>
          <button onClick={() => setStep("main")} className="text-white/40 text-sm text-center">← Назад</button>
        </div>
      )}
    </div>
  );
}

// ─── AdminVerifyScreen ────────────────────────────────────────────────────────
export function AdminVerifyScreen({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [requests, setRequests] = useState<AdminVerifyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const login = async () => {
    setLoading(true);
    try {
      const res = await verifyApi.adminList(token);
      setRequests(res.requests); setAuthed(true);
    } catch { setMsg("Неверный токен"); }
    finally { setLoading(false); }
  };

  const approve = async (req: AdminVerifyRequest) => {
    try { await verifyApi.adminApprove(token, req.id); setRequests((r) => r.filter((x) => x.id !== req.id)); }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
  };

  const reject = async (req: AdminVerifyRequest) => {
    const reason = prompt("Причина отклонения (необязательно):") || "";
    try { await verifyApi.adminReject(token, req.id, reason); setRequests((r) => r.filter((x) => x.id !== req.id)); }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={onClose} className="glass-card p-2"><Icon name="ChevronLeft" size={20} className="text-white" /></button>
        <h2 className="text-white font-golos font-bold text-xl flex-1">Админ: Верификация</h2>
      </div>

      {!authed ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <Icon name="ShieldCheck" size={48} className="text-blue-400" />
          <p className="text-white/60 text-sm text-center">Введи admin-токен для доступа к заявкам</p>
          <input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="Admin token"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-blue-500/50 font-golos" />
          <button onClick={login} disabled={loading} className="btn-grad w-full py-3.5 text-sm font-semibold disabled:opacity-50">
            {loading ? "Проверяем..." : "Войти"}
          </button>
          {msg && <p className="text-red-400 text-xs">{msg}</p>}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-6">
          {requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-5xl">✅</div>
              <p className="text-white/50 text-sm">Нет заявок на проверку</p>
            </div>
          )}
          {msg && <p className="text-center text-xs text-red-400">{msg}</p>}
          {requests.map((req) => (
            <div key={req.id} className="glass-card overflow-hidden flex flex-col gap-0">
              <img src={req.selfie_url} className="w-full object-cover" style={{ maxHeight: 280 }} />
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img src={req.photo_url || FALLBACK_PHOTO} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-white font-semibold text-sm">{req.name}{req.age ? `, ${req.age}` : ""}</p>
                    <p className="text-white/40 text-xs flex items-center gap-1">
                      {req.email_verified ? <span className="text-green-400">✓ Email подтверждён</span> : <span className="text-white/30">Email не подтверждён</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve(req)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                    style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
                    <Icon name="Check" size={16} className="text-white" />Одобрить
                  </button>
                  <button onClick={() => reject(req)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-400 flex items-center justify-center gap-1.5"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <Icon name="X" size={16} />Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}