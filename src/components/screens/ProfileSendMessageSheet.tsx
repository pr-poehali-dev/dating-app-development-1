import Icon from "@/components/ui/icon";

interface ProfileSendMessageSheetProps {
  profileName: string;
  profilePhoto: string;
  msgText: string;
  sendingMsg: boolean;
  msgSent: boolean;
  onClose: () => void;
  onMsgChange: (val: string) => void;
  onSend: () => void;
}

export function ProfileSendMessageSheet({
  profileName,
  profilePhoto,
  msgText,
  sendingMsg,
  msgSent,
  onClose,
  onMsgChange,
  onSend,
}: ProfileSendMessageSheetProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm px-4 pb-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="rounded-3xl p-5 flex flex-col gap-4"
          style={{ background: "var(--spark-card)", border: "1px solid var(--spark-input-border)" }}>
          <div className="flex items-center gap-3">
            <img src={profilePhoto || ""} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
              style={{ border: "2px solid rgba(255,45,120,0.4)" }} />
            <div>
              <p className="text-white font-semibold text-sm">{profileName}</p>
              <p className="text-white/40 text-xs">Первое сообщение</p>
            </div>
          </div>
          {msgSent ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <Icon name="Check" size={18} className="text-green-400" />
              <span className="text-white text-sm font-semibold">Сообщение отправлено!</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                value={msgText}
                onChange={e => onMsgChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSend()}
                placeholder={`Напиши ${profileName}...`}
                className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos"
              />
              <button onClick={onSend} disabled={sendingMsg || !msgText.trim()}
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                {sendingMsg
                  ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <Icon name="Send" size={18} className="text-white" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}