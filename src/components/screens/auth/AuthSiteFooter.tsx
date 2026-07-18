export function AuthSiteFooter({ onOpenTerms, onOpenPrivacy }: { onOpenTerms: () => void; onOpenPrivacy: () => void }) {
  const year = new Date().getFullYear();

  return (
    <div className="w-full" style={{ background: "#161022", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between flex-wrap gap-4">
        <p className="text-white/70 text-lg font-semibold">© «Полутон» — сервис знакомств и общения. {year}</p>

        <div className="flex items-center gap-6 flex-wrap">
          <a href="https://poehali.dev/help" target="_blank" rel="noreferrer" className="text-white/45 text-sm hover:text-pink-400 transition-colors">Поддержка</a>
          <button onClick={onOpenTerms} className="text-white/45 text-sm hover:text-pink-400 transition-colors">Условия использования</button>
          <button onClick={onOpenPrivacy} className="text-white/45 text-sm hover:text-pink-400 transition-colors">Политика конфиденциальности</button>
        </div>
      </div>
    </div>
  );
}

export default AuthSiteFooter;