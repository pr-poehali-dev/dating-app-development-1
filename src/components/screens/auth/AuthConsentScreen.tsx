import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { AuthLegalContent } from "./AuthLegalContent";

export function AuthConsentScreen({
  pendingUser,
  consentTab,
  onTabChange,
  onAccept,
}: {
  pendingUser: User;
  consentTab: "terms" | "privacy";
  onTabChange: (tab: "terms" | "privacy") => void;
  onAccept: () => void;
}) {
  void pendingUser;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "linear-gradient(160deg,#0f0820,#1a0f35)" }}>

      <div className="flex-shrink-0 flex items-center gap-3 pt-8 pb-4 px-5">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,45,120,0.12)", border: "1px solid rgba(255,45,120,0.2)" }}>
          <Icon name="Scale" size={17} className="text-pink-400" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Правовые документы</p>
          <p className="text-white/40 text-xs leading-tight mt-0.5">Прими условия, чтобы продолжить</p>
        </div>
      </div>

      <div className="flex-shrink-0 px-5 pb-3">
        <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {([{ id: "terms", label: "Условия использования" }, { id: "privacy", label: "Конфиденциальность" }] as const).map(tab => (
            <button key={tab.id} onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-all rounded-xl ${consentTab === tab.id ? "text-white" : "text-white/40"}`}
              style={consentTab === tab.id ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : undefined}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-4 pb-4" style={{ scrollbarWidth: "none" }}>
        <AuthLegalContent tab={consentTab} />
      </div>

      <div className="flex-shrink-0 px-5 pt-3 pb-10 flex flex-col gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,5,25,0.6)", backdropFilter: "blur(20px)" }}>
        <p className="text-white/35 text-[11px] text-center leading-relaxed">
          Нажимая «Принять и продолжить», ты подтверждаешь, что ознакомился с документами и соглашаешься с ними
        </p>
        <button
          onClick={onAccept}
          className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 24px rgba(255,45,120,0.45)" }}>
          Принять и продолжить
        </button>
      </div>
    </div>
  );
}