// ─── Shared UI primitives for Settings screens ────────────────────────────────

export function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200 relative"
      style={{ background: value ? "linear-gradient(90deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }} />
    </button>
  );
}

export function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-white/85 text-sm">{label}</p>
        {sub && <p className="text-white/35 text-xs mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
