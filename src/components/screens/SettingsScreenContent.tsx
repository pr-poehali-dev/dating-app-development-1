import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { type User, type BlockedUser } from "@/lib/api";
import { Toggle, Row } from "@/components/screens/SettingsUIKit";

type PrivatePhoto = { id: number; photo_url: string; created_at: string };

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden transition-all">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
        <p className="text-white/85 text-sm font-medium flex-1">{q}</p>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/30 flex-shrink-0" />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-white/55 text-xs leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

interface SettingsScreenContentProps {
  screen: string;
  currentUser: User;
  onPremium?: () => void;

  // account
  name: string;
  username: string;
  usernameError: string;
  saved: boolean;
  onNameChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  onSaveAccount: () => void;

  // privacy
  privacy: { showOnline: boolean; showDistance: boolean; readReceipts: boolean; searchable: boolean };
  onPrivacyToggle: (key: keyof SettingsScreenContentProps["privacy"]) => void;

  // notifications
  notif: { matches: boolean; messages: boolean; likes: boolean; promo: boolean };
  onNotifToggle: (key: keyof SettingsScreenContentProps["notif"]) => void;

  // appearance
  isDark: boolean;
  appear: { compactCards: boolean; showAge: boolean };
  onToggleTheme: () => void;
  onAppearToggle: (key: keyof SettingsScreenContentProps["appear"]) => void;

  // sounds
  sounds: { messages: boolean; matches: boolean; notifications: boolean };
  onSoundsToggle: (key: keyof SettingsScreenContentProps["sounds"]) => void;

  // videochat
  video: { autoAccept: boolean; blurBg: boolean; mirrorCamera: boolean };
  onVideoToggle: (key: keyof SettingsScreenContentProps["video"]) => void;

  // private_photos
  privatePhotos: PrivatePhoto[];
  privateLoading: boolean;
  privateUploading: boolean;
  privateError: string;
  onPrivateUpload: (file: File) => void;
  onPrivateDelete: (id: number) => void;

  // blocked
  blocks: BlockedUser[];
  blocksLoading: boolean;
  unblocking: number | null;
  onUnblock: (id: number) => void;
}

export function SettingsScreenContent({
  screen,
  currentUser,
  onPremium,
  name,
  username,
  usernameError,
  saved,
  onNameChange,
  onUsernameChange,
  onSaveAccount,
  privacy,
  onPrivacyToggle,
  notif,
  onNotifToggle,
  isDark,
  appear,
  onToggleTheme,
  onAppearToggle,
  sounds,
  onSoundsToggle,
  video,
  onVideoToggle,
  privatePhotos,
  privateLoading,
  privateUploading,
  privateError,
  onPrivateUpload,
  onPrivateDelete,
  blocks,
  blocksLoading,
  unblocking,
  onUnblock,
}: SettingsScreenContentProps) {
  const privateInputRef = useRef<HTMLInputElement>(null);
  const [helpSub, setHelpSub] = useState<"" | "support" | "faq" | "rules" | "privacy">("");
  // Сбрасываем подэкран при смене основного экрана
  const prevScreen = useRef(screen);
  if (prevScreen.current !== screen) { prevScreen.current = screen; if (helpSub !== "") setHelpSub(""); }

  return (
    <div className="flex-1 overflow-y-auto pb-8">

      {/* ── Аккаунт ── */}
      {screen === "account" && (
        <div className="px-5 flex flex-col gap-4">
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Имя</p>
              <input value={name} onChange={(e) => onNameChange(e.target.value)}
                className="w-full bg-transparent text-white text-sm outline-none placeholder-white/30"
                placeholder="Твоё имя" />
            </div>
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-xs uppercase tracking-widest">Имя пользователя</p>
                {!currentUser.premium && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                    Premium
                  </span>
                )}
              </div>
              {currentUser.premium ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-white/30 text-sm">@</span>
                    <input value={username} onChange={(e) => onUsernameChange(e.target.value.toLowerCase())}
                      className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30 font-mono"
                      placeholder="username" maxLength={50} />
                  </div>
                  {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
                  <p className="text-white/25 text-xs mt-1">Только a-z, 0-9, _ и . (3–50 символов)</p>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm font-mono">@lovebloom_1</span>
                  <button onClick={onPremium} className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                    style={{ background: "rgba(255,45,120,0.15)", color: "#FF2D78" }}>
                    Изменить
                  </button>
                </div>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Электронная почта</p>
              <input value={currentUser.email || ""} readOnly type="email"
                className="w-full bg-transparent text-white text-sm outline-none placeholder-white/30 opacity-60" />
            </div>
          </div>
          <button onClick={onSaveAccount}
            className="btn-grad py-3.5 text-sm font-semibold text-white rounded-2xl flex items-center justify-center gap-2">
            {saved ? <><Icon name="Check" size={16} className="text-white" />Сохранено!</> : "Сохранить изменения"}
          </button>
        </div>
      )}

      {/* ── Конфиденциальность ── */}
      {screen === "privacy" && (
        <div className="mx-5 glass-card overflow-hidden">
          <Row label="Показывать онлайн" sub="Другие видят, когда ты в сети">
            <Toggle value={privacy.showOnline} onChange={() => onPrivacyToggle("showOnline")} />
          </Row>
          <Row label="Показывать расстояние" sub="Дистанция в профиле">
            <Toggle value={privacy.showDistance} onChange={() => onPrivacyToggle("showDistance")} />
          </Row>
          <Row label="Прочитано" sub="Отметки о прочтении сообщений">
            <Toggle value={privacy.readReceipts} onChange={() => onPrivacyToggle("readReceipts")} />
          </Row>
          <Row label="Доступен для поиска" sub="Твой профиль видят в рекомендациях">
            <Toggle value={privacy.searchable} onChange={() => onPrivacyToggle("searchable")} />
          </Row>
        </div>
      )}

      {/* ── Уведомления ── */}
      {screen === "notifications" && (
        <div className="mx-5 glass-card overflow-hidden">
          <Row label="Новые совпадения" sub="Когда кто-то ответил взаимностью">
            <Toggle value={notif.matches} onChange={() => onNotifToggle("matches")} />
          </Row>
          <Row label="Сообщения" sub="Входящие сообщения в чатах">
            <Toggle value={notif.messages} onChange={() => onNotifToggle("messages")} />
          </Row>
          <Row label="Лайки" sub="Кто оценил твой профиль">
            <Toggle value={notif.likes} onChange={() => onNotifToggle("likes")} />
          </Row>
          <Row label="Акции и новости" sub="Промо и обновления приложения">
            <Toggle value={notif.promo} onChange={() => onNotifToggle("promo")} />
          </Row>
        </div>
      )}

      {/* ── Внешний вид ── */}
      {screen === "appearance" && (
        <div className="mx-5 glass-card overflow-hidden">
          <Row label="Тёмная тема" sub="Тёмный фон интерфейса">
            <Toggle value={isDark} onChange={onToggleTheme} />
          </Row>
          <Row label="Компактные карточки" sub="Меньше информации на карточке">
            <Toggle value={appear.compactCards} onChange={() => onAppearToggle("compactCards")} />
          </Row>
          <Row label="Показывать возраст" sub="Возраст отображается в профиле">
            <Toggle value={appear.showAge} onChange={() => onAppearToggle("showAge")} />
          </Row>
        </div>
      )}

      {/* ── Звуки ── */}
      {screen === "sounds" && (
        <div className="mx-5 glass-card overflow-hidden">
          <Row label="Звук сообщений" sub="Звук при входящем сообщении">
            <Toggle value={sounds.messages} onChange={() => onSoundsToggle("messages")} />
          </Row>
          <Row label="Звук совпадений" sub="Звук при новом совпадении">
            <Toggle value={sounds.matches} onChange={() => onSoundsToggle("matches")} />
          </Row>
          <Row label="Звук уведомлений" sub="Остальные уведомления">
            <Toggle value={sounds.notifications} onChange={() => onSoundsToggle("notifications")} />
          </Row>
        </div>
      )}

      {/* ── Видеочат ── */}
      {screen === "videochat" && (
        <div className="mx-5 glass-card overflow-hidden">
          <Row label="Авто-принятие звонков" sub="Видеозвонки принимаются автоматически">
            <Toggle value={video.autoAccept} onChange={() => onVideoToggle("autoAccept")} />
          </Row>
          <Row label="Размытый фон" sub="Скрывать фон во время звонка">
            <Toggle value={video.blurBg} onChange={() => onVideoToggle("blurBg")} />
          </Row>
          <Row label="Зеркальная камера" sub="Отразить изображение камеры">
            <Toggle value={video.mirrorCamera} onChange={() => onVideoToggle("mirrorCamera")} />
          </Row>
        </div>
      )}

      {/* ── Приватные фото ── */}
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
            onChange={e => { const f = e.target.files?.[0]; if (f) onPrivateUpload(f); e.target.value = ""; }} />

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
                    <button onClick={() => onPrivateDelete(p.id)}
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

      {/* ── Заблокированные ── */}
      {screen === "blocked" && (
        <div className="px-5 flex flex-col gap-3">
          <p className="text-white/40 text-xs">Заблокированные не могут видеть твой профиль и писать тебе</p>
          {blocksLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
            </div>
          ) : blocks.length === 0 ? (
            <div className="glass-card p-8 flex flex-col items-center gap-3 mt-2">
              <Icon name="Ban" size={40} className="text-white/20" />
              <p className="text-white/30 text-sm text-center">Список заблокированных пуст</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {blocks.map(user => (
                <div key={user.id} className="glass-card px-4 py-3 flex items-center gap-3">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt={user.name}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.08)" }}>
                      <Icon name="User" size={20} className="text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                    {user.age && <p className="text-white/40 text-xs">{user.age} лет</p>}
                  </div>
                  <button
                    disabled={unblocking === user.id}
                    onClick={() => onUnblock(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
                    {unblocking === user.id
                      ? <><Icon name="Loader2" size={13} className="animate-spin" />Ждите</>
                      : <><Icon name="UserCheck" size={13} />Разблокировать</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Помощь ── */}
      {screen === "help" && helpSub === "" && (
        <div className="px-5 flex flex-col gap-3">
          {([
            { icon: "MessageCircle", title: "Написать в поддержку",      sub: "Ответим в течение 24 часов",         id: "support"  },
            { icon: "BookOpen",      title: "Частые вопросы",             sub: "Ответы на популярные вопросы",       id: "faq"      },
            { icon: "FileText",      title: "Правила сообщества",         sub: "Как мы обеспечиваем безопасность",   id: "rules"    },
            { icon: "Shield",        title: "Политика конфиденциальности",sub: "Как мы работаем с данными",          id: "privacy"  },
            { icon: "Info",          title: "О приложении",               sub: "LoveBloom v1.0",                     id: ""         },
          ] as const).map((item) => (
            <button key={item.title}
              onClick={() => item.id && setHelpSub(item.id as typeof helpSub)}
              className="glass-card flex items-center gap-4 px-4 py-3.5 w-full text-left active:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name={item.icon} size={18} className="text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-sm">{item.title}</p>
                <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
              </div>
              {item.id && <Icon name="ChevronRight" size={15} className="text-white/25 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {/* ── Написать в поддержку ── */}
      {screen === "help" && helpSub === "support" && (
        <div className="px-5 flex flex-col gap-4">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          <div className="glass-card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="MessageCircle" size={24} className="text-pink-400" />
              </div>
              <div>
                <p className="text-white font-bold">Поддержка LoveBloom</p>
                <p className="text-white/40 text-xs">Ответим в течение 24 часов</p>
              </div>
            </div>
            <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Email</p>
              <a href="mailto:support@lovebloom.app" className="text-pink-400 font-semibold">support@lovebloom.app</a>
            </div>
            <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Telegram</p>
              <a href="https://t.me/lovebloom_support" target="_blank" rel="noopener noreferrer" className="text-pink-400 font-semibold">@lovebloom_support</a>
            </div>
            <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Время работы</p>
              <p className="text-white/80 text-sm">Пн–Пт: 9:00 – 21:00 МСК</p>
              <p className="text-white/80 text-sm">Сб–Вс: 10:00 – 18:00 МСК</p>
            </div>
            <a href="mailto:support@lovebloom.app"
              className="btn-grad w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2">
              <Icon name="Send" size={16} />
              Написать письмо
            </a>
          </div>
        </div>
      )}

      {/* ── Частые вопросы ── */}
      {screen === "help" && helpSub === "faq" && (
        <div className="px-5 flex flex-col gap-3">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          {([
            { q: "Как работает система совпадений?", a: "Совпадение (матч) происходит когда вы оба поставили друг другу лайк. После этого открывается чат и вы можете общаться." },
            { q: "Как изменить фото профиля?", a: "Перейдите в раздел Профиль → нажмите на своё фото → выберите новое из галереи или сделайте снимок. Размер до 10 МБ." },
            { q: "Что такое приватные фото?", a: "Приватные фото видны только тем, кому вы открыли доступ. Запросить доступ можно через меню в чате — кнопка «…»." },
            { q: "Как получить Премиум?", a: "Нажмите кнопку 💎 Премиум в профиле. Премиум даёт безлимитные лайки, суперлайки, невидимый режим и приоритет в поиске." },
            { q: "Как отправить голосовое сообщение?", a: "В чате нажмите на иконку микрофона справа от поля ввода. Держите кнопку — запись идёт, отпустите — отправится." },
            { q: "Мой профиль могут видеть все?", a: "Нет. Настройте видимость в Настройки → Конфиденциальность: можно скрыть онлайн-статус, расстояние и убрать профиль из поиска." },
            { q: "Как пожаловаться на пользователя?", a: "Откройте профиль пользователя → нажмите «…» в правом верхнем углу → Пожаловаться. Жалобы рассматриваются в течение 48 часов." },
            { q: "Как удалить аккаунт?", a: "Настройки → Аккаунт → Удалить аккаунт. Данные удаляются необратимо в течение 30 дней." },
          ] as const).map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      )}

      {/* ── Правила сообщества ── */}
      {screen === "help" && helpSub === "rules" && (
        <div className="px-5 flex flex-col gap-4">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          <div className="glass-card p-5 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="FileText" size={22} className="text-pink-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Правила сообщества</p>
                <p className="text-white/40 text-xs">Обновлено: январь 2025</p>
              </div>
            </div>
            {([
              { icon: "Heart", title: "Уважение и вежливость", text: "Общайтесь так, как хотите, чтобы общались с вами. Оскорбления, харассмент и агрессивное поведение ведут к немедленной блокировке." },
              { icon: "Shield", title: "Достоверность профиля", text: "Используйте только свои реальные фотографии. Запрещены чужие фото, фото знаменитостей, аниме и персонажей. Профиль должен отражать реальный облик." },
              { icon: "Lock", title: "Запрещённый контент", text: "Строго запрещены: материалы 18+ в публичных постах, насилие, экстремизм, пропаганда ненависти, спам и реклама сторонних сервисов." },
              { icon: "UserCheck", title: "Один аккаунт", text: "Создание нескольких аккаунтов для обхода блокировок запрещено. Мультиаккаунты удаляются без предупреждения." },
              { icon: "MessageSquare", title: "Честное общение", text: "Не вводите людей в заблуждение относительно своих намерений, внешности или личных данных. Мошенничество и манипуляции недопустимы." },
              { icon: "AlertTriangle", title: "Нарушения и последствия", text: "За нарушения: предупреждение → временная блокировка → перманентный бан. Тяжкие нарушения (мошенничество, CSAM) — бан без предупреждения с уведомлением властей." },
            ] as const).map((rule) => (
              <div key={rule.title} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,45,120,0.1)" }}>
                  <Icon name={rule.icon as "Heart"|"Shield"|"Lock"|"UserCheck"|"MessageSquare"|"AlertTriangle"} size={15} className="text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{rule.title}</p>
                  <p className="text-white/55 text-xs leading-relaxed mt-1">{rule.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Политика конфиденциальности ── */}
      {screen === "help" && helpSub === "privacy" && (
        <div className="px-5 flex flex-col gap-4">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          <div className="glass-card p-5 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,179,237,0.12)" }}>
                <Icon name="Shield" size={22} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Политика конфиденциальности</p>
                <p className="text-white/40 text-xs">Редакция от 1 января 2025 г.</p>
              </div>
            </div>
            {([
              { title: "1. Какие данные мы собираем", text: "При регистрации: имя, дата рождения, номер телефона или email, фотографии. В процессе использования: геолокация (приблизительная), логи активности, переписка, фото и видео которые вы публикуете." },
              { title: "2. Как мы используем данные", text: "Данные нужны для: показа подходящих анкет, работы чата и уведомлений, верификации личности, предотвращения мошенничества. Мы не продаём данные третьим лицам." },
              { title: "3. Хранение и защита", text: "Все данные хранятся на серверах в России. Соединение защищено TLS 1.3. Пароли хранятся в виде хешей (bcrypt). Фотографии хранятся в зашифрованном облачном хранилище." },
              { title: "4. Геолокация", text: "Геолокация используется только для расчёта расстояния между пользователями. Точные координаты никогда не передаются другим пользователям — только округлённое расстояние (например, «в 2 км»)." },
              { title: "5. Передача данных", text: "Данные могут передаваться: платёжным системам (только для проведения транзакций), органам власти по официальному запросу. Аналитика — только в обезличенном виде." },
              { title: "6. Ваши права", text: "Вы вправе: запросить копию своих данных, исправить неточные данные, удалить аккаунт со всеми данными (срок исполнения — 30 дней), отозвать согласие на обработку данных." },
              { title: "7. Файлы cookie", text: "Мы используем технические cookie для авторизации и сессий. Аналитические cookie используются только с вашего согласия и могут быть отключены в настройках браузера." },
              { title: "8. Контакты", text: "По вопросам обработки персональных данных: privacy@lovebloom.app. Ответ предоставляется в течение 10 рабочих дней." },
            ] as const).map((section) => (
              <div key={section.title}>
                <p className="text-white font-semibold text-sm mb-1">{section.title}</p>
                <p className="text-white/55 text-xs leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}