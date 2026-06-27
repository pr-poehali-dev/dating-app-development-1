import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { type User, verifyApi } from "@/lib/api";

type PrivatePhoto = { id: number; photo_url: string; created_at: string };

interface Props {
  currentUser: User;
  onPremium?: () => void;
  name: string;
  username: string;
  usernameError: string;
  saved: boolean;
  onNameChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  onSaveAccount: () => void;
  privatePhotos: PrivatePhoto[];
  privateLoading: boolean;
  privateUploading: boolean;
  privateError: string;
  onPrivateUpload: (file: File) => void;
  onPrivateDelete: (id: number) => void;
}

export function SettingsPanelAccount({
  currentUser,
  onPremium,
  name,
  username,
  usernameError,
  saved,
  onNameChange,
  onUsernameChange,
  onSaveAccount,
  privatePhotos,
  privateUploading,
  privateError,
  onPrivateUpload,
  onPrivateDelete,
}: Props) {
  const privateInputRef = useRef<HTMLInputElement>(null);

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

      {/* Приватные фото */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/jpeg,image/png,image/webp";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) onPrivateUpload(file);
            };
            input.click();
          }}
          disabled={privateUploading}
          className="w-full flex items-center justify-between px-4 py-3.5 active:bg-white/5 transition-colors"
          style={{ borderBottom: privatePhotos.length > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,45,120,0.12)" }}>
              {privateUploading
                ? <Icon name="Loader2" size={14} className="text-pink-400 animate-spin" />
                : <Icon name="Lock" size={14} className="text-pink-400" />}
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium text-left">Приватные фото</p>
              <p className="text-white/35 text-xs text-left">{privatePhotos.length > 0 ? `${privatePhotos.length} фото` : "Добавить закрытые фото"}</p>
            </div>
          </div>
          <Icon name="Plus" size={16} className="text-white/30" />
        </button>
        {privateError && <p className="text-red-400 text-xs px-4 pb-2">{privateError}</p>}
        {privatePhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-1 p-2">
            {privatePhotos.map(ph => (
              <div key={ph.id} className="relative" style={{ aspectRatio: "1" }}>
                <img src={ph.photo_url} className="w-full h-full object-cover rounded-xl" />
                <button
                  onClick={() => onPrivateDelete(ph.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.65)" }}>
                  <Icon name="X" size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <input ref={privateInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onPrivateUpload(f); e.target.value = ""; }} />
    </div>
  );
}
