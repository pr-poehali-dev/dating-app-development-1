import Icon from "@/components/ui/icon";

// ─── Модал смены пароля ────────────────────────────────────────────────────────
interface PasswordModalProps {
  email: string;
  pwSent: boolean;
  pwLoading: boolean;
  menuMsg: string;
  onClose: () => void;
  onSend: () => void;
}

export function PasswordModal({ email, pwSent, pwLoading, menuMsg, onClose, onSend }: PasswordModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "var(--spark-card)", border: "1px solid var(--spark-divider)" }}>
        <div className="flex items-center justify-between">
          <p className="text-white font-bold text-lg">Сменить пароль</p>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={20} /></button>
        </div>
        {pwSent ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Icon name="MailCheck" size={40} className="text-green-400" />
            <p className="text-white/80 text-sm text-center">
              Письмо со ссылкой для сброса пароля отправлено на{" "}
              <span className="text-white font-semibold">{email}</span>
            </p>
          </div>
        ) : (
          <>
            <p className="text-white/50 text-sm leading-relaxed">
              Мы отправим письмо на <span className="text-white/80">{email}</span> со ссылкой для сброса пароля.
            </p>
            {menuMsg && <p className="text-red-400 text-xs text-center">{menuMsg}</p>}
            <button onClick={onSend} disabled={pwLoading}
              className="btn-grad py-3 text-sm font-semibold text-white rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
              {pwLoading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправляем...</>
                : "Отправить письмо"}
            </button>
          </>
        )}
        <button onClick={onClose} className="text-white/40 text-sm text-center">Закрыть</button>
      </div>
    </div>
  );
}

// ─── Модал подтверждения удаления аккаунта ────────────────────────────────────
interface DeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({ onClose, onConfirm }: DeleteModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "var(--spark-card)", border: "1px solid var(--spark-divider)" }}>
        <div className="flex items-center justify-between">
          <p className="text-white font-bold text-lg">Удалить аккаунт?</p>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={20} /></button>
        </div>
        <p className="text-white/50 text-sm leading-relaxed">
          Все твои данные, совпадения и сообщения будут безвозвратно удалены. Это действие нельзя отменить.
        </p>
        <button onClick={onConfirm}
          className="py-3 text-sm font-semibold rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
          Да, удалить аккаунт
        </button>
        <button onClick={onClose} className="text-white/40 text-sm text-center">Отмена</button>
      </div>
    </div>
  );
}
