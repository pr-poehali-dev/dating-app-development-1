import Icon from "@/components/ui/icon";
import { AuthLegalContent } from "./AuthLegalContent";

export function AuthLegalSheet({
  rulesTab,
  onTabChange,
  onClose,
}: {
  rulesTab: "terms" | "privacy";
  onTabChange: (tab: "terms" | "privacy") => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full max-h-[92vh] flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,45,120,0.12)" }}>
              <Icon name="Scale" size={19} className="text-pink-400" />
            </div>
            <div>
              <p className="text-white font-bold text-base">Правовые документы</p>
              <p className="text-white/35 text-xs">Редакция от 1 июня 2026 г.</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>

        <div className="flex-shrink-0 px-5 pt-3 pb-0">
          <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {([{ id: "terms", label: "Условия использования" }, { id: "privacy", label: "Политика конфиденциальности" }] as const).map(tab => (
              <button key={tab.id} onClick={() => onTabChange(tab.id)}
                className={`flex-1 py-2 text-[11px] font-semibold transition-all rounded-xl ${rulesTab === tab.id ? "text-white" : "text-white/40"}`}
                style={rulesTab === tab.id ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : undefined}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
          <AuthLegalContent tab={rulesTab} />
          <button onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mt-1"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            Понятно, принимаю
          </button>
        </div>
      </div>
    </div>
  );
}
