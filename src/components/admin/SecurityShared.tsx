/* eslint-disable react-refresh/only-export-components */
import Icon from "@/components/ui/icon";

export const ADMIN_URL = "https://functions.poehali.dev/a87188e5-57d7-4ad4-ac31-0a2c3e3d0e18";

export async function adminReq(token: string, action: string, body?: object) {
  const res = await fetch(`${ADMIN_URL}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export function SectionSwitch({ options, value, onChange }: {
  options: { id: string; label: string; icon: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={value === o.id
            ? { background: "linear-gradient(135deg,rgba(239,68,68,0.2),rgba(185,28,28,0.2))", color: "#F87171", boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.3)" }
            : { color: "rgba(255,255,255,0.35)" }}>
          <Icon name={o.icon as "Shield"} size={12} />{o.label}
        </button>
      ))}
    </div>
  );
}

export function InputRow({ value, onChange, placeholder, onAction, actionLabel, saving, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  onAction: () => void; actionLabel: string; saving: boolean; type?: string;
}) {
  return (
    <div className="flex gap-2">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        onKeyDown={e => e.key === "Enter" && onAction()}
        className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
      <button onClick={onAction} disabled={saving || !value.trim()}
        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#EF4444,#B91C1C)" }}>
        {saving ? <Icon name="Loader2" size={13} className="animate-spin" /> : actionLabel}
      </button>
    </div>
  );
}