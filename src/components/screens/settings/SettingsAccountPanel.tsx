import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { type User, type BlockedUser, verifyApi } from "@/lib/api";
import { Toggle, Row } from "@/components/screens/SettingsUIKit";

type PrivatePhoto = { id: number; photo_url: string; created_at: string };

interface Props {
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
  onPrivacyToggle: (key: keyof Props["privacy"]) => void;

  // notifications
  notif: { matches: boolean; messages: boolean; likes: boolean; promo: boolean };
  onNotifToggle: (key: keyof Props["notif"]) => void;

  // appearance
  isDark: boolean;
  appear: { compactCards: boolean; showAge: boolean };
  onToggleTheme: () => void;
  onAppearToggle: (key: keyof Props["appear"]) => void;

  // sounds
  sounds: { messages: boolean; matches: boolean; notifications: boolean };
  onSoundsToggle: (key: keyof Props["sounds"]) => void;

  // videochat
  video: { autoAccept: boolean; blurBg: boolean; mirrorCamera: boolean };
  onVideoToggle: (key: keyof Props["video"]) => void;

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

export function SettingsAccountPanel({
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
}: Props) {
  const privateInputRef = useRef<HTMLInputElement>(null);

  // Email verification state
  const [emailStep, setEmailStep] = useState<"idle" | "sent" | "done">("idle");
  const [emailSending, setEmailSending] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailConfirming, setEmailConfirming] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleSendCode = async () => {
    if (!currentUser.email) return;
    setEmailSending(true); setEmailError("");
    try {
      await verifyApi.sendEmailCode(currentUser.email);
      setEmailStep("sent");
    } catch { setEmailError("Ошибка отправки. Попробуй снова."); }
    finally { setEmailSending(false); }
  };

  const handleConfirmCode = async () => {
    if (!emailCode.trim() || !currentUser.email) return;
    setEmailConfirming(true); setEmailError("");
    try {
      await verifyApi.confirmEmailCode(currentUser.email, emailCode.trim());
      setEmailStep("done");
    } catch { setEmailError("Неверный или истёкший код."); }
    finally { setEmailConfirming(false); }
  };

  return (
    <>
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
                  <span className="text-white/50 text-sm font-mono">@{username || currentUser.username || "—"}</span>
                  <button onClick={onPremium} className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                    style={{ background: "rgba(255,45,120,0.15)", color: "#FF2D78" }}>
                    Изменить
                  </button>
                </div>
              )}
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-xs uppercase tracking-widest">Электронная почта</p>
                {(currentUser.email_verified || emailStep === "done") ? (
                  <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                    <Icon name="CheckCircle" size={12} />Подтверждена
                  </span>
                ) : (
                  <span className="text-xs text-white/30">Не подтверждена</span>
                )}
              </div>
              <input value={currentUser.email || ""} readOnly type="email"
                className="w-full bg-transparent text-white text-sm outline-none placeholder-white/30 opacity-70" />

              {/* Блок подтверждения */}
              {!currentUser.email_verified && emailStep !== "done" && (
                <div className="mt-3">
                  {emailStep === "idle" && (
                    <button
                      onClick={handleSendCode}
                      disabled={emailSending}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                      style={{ background: "rgba(255,45,120,0.12)", color: "#FF2D78" }}>
                      {emailSending
                        ? <><Icon name="Loader2" size={12} className="animate-spin" />Отправка...</>
                        : <><Icon name="Mail" size={12} />Подтвердить почту</>}
                    </button>
                  )}
                  {emailStep === "sent" && (
                    <div className="flex flex-col gap-2">
                      <p className="text-white/50 text-xs">Код отправлен на {currentUser.email}</p>
                      <div className="flex gap-2">
                        <input
                          value={emailCode}
                          onChange={e => { setEmailCode(e.target.value); setEmailError(""); }}
                          placeholder="Введи 6-значный код"
                          maxLength={6}
                          type="number"
                          className="flex-1 bg-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none border border-white/15 focus:border-pink-500/60 font-mono tracking-widest placeholder-white/30"
                        />
                        <button
                          onClick={handleConfirmCode}
                          disabled={emailConfirming || emailCode.length < 6}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 flex items-center gap-1"
                          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                          {emailConfirming
                            ? <Icon name="Loader2" size={13} className="animate-spin" />
                            : "OK"}
                        </button>
                      </div>
                      <button onClick={() => setEmailStep("idle")} className="text-white/30 text-xs text-left">
                        Отправить снова
                      </button>
                    </div>
                  )}
                  {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
                </div>
              )}
              {emailStep === "done" && (
                <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                  <Icon name="CheckCircle" size={12} />Почта успешно подтверждена!
                </p>
              )}
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
    </>
  );
}

export default SettingsAccountPanel;