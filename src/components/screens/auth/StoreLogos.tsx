// ── Официальный логотип RuStore (синий значок) ──────────────────────────────
export function RuStoreLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#2B7FFF,#0A5CE5)", boxShadow: "0 4px 14px rgba(43,127,255,0.4)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="7" width="3.6" height="14" rx="1.8" fill="#fff" transform="skewX(-12)" />
          <rect x="10" y="4" width="3.6" height="17" rx="1.8" fill="#fff" transform="skewX(-12)" />
          <rect x="16" y="9" width="3.6" height="12" rx="1.8" fill="#fff" transform="skewX(-12)" />
        </svg>
      </div>
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
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#FF3B5C,#C81E45)", boxShadow: "0 4px 14px rgba(255,59,92,0.4)" }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path d="M5 19V5l14 14V5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
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
