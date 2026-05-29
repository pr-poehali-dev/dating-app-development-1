import Icon from "@/components/ui/icon";

export function SectionSwitch({ options, value, onChange }: {
  options: { id: string; label: string; dot?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={value === o.id
            ? { background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.2))", color: "white", boxShadow: "inset 0 0 0 1px rgba(255,45,120,0.35)" }
            : { color: "rgba(255,255,255,0.35)" }}>
          {o.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.dot }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
        <Icon name={icon as "Flag"} size={24} className="text-white/15" />
      </div>
      <p className="text-white/25 text-sm">{text}</p>
    </div>
  );
}
