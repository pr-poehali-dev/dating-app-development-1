// ── Официальный логотип RuStore ──────────────────────────────────────────────
export function RuStoreLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/stores/rustore.png" alt="RuStore" className="w-10 h-10 rounded-2xl flex-shrink-0 object-cover"
        style={{ boxShadow: "0 4px 14px rgba(43,127,255,0.35)" }} />
      <div className="flex flex-col items-start leading-none">
        <span className="text-white/45 text-[10px]">Скачать в</span>
        <span className="text-white text-[15px] font-bold">RuStore</span>
      </div>
    </div>
  );
}

// ── Логотип NashStore ───────────────────────────────────────────────────────
export function NashStoreLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/stores/nashstore.png" alt="NashStore" className="w-10 h-10 rounded-2xl flex-shrink-0 object-cover"
        style={{ background: "#fff", boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }} />
      <div className="flex flex-col items-start leading-none">
        <span className="text-white/45 text-[10px]">Скачать в</span>
        <span className="text-white text-[15px] font-bold">NashStore</span>
      </div>
    </div>
  );
}

export function StoreButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      className={"px-4 py-2.5 rounded-2xl transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-95 " + className}
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}