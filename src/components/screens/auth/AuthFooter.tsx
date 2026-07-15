import Icon from "@/components/ui/icon";

const LOGO_URL = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/085ca416-a53e-408a-a24a-5534172b3dc9.png";

export function AuthFooter({ onOpenTerms, onOpenPrivacy }: { onOpenTerms: () => void; onOpenPrivacy: () => void }) {
  const year = new Date().getFullYear();

  return (
    <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,5,20,0.4)" }}>
      <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">
        <div className="flex items-start justify-between flex-wrap gap-8">
          <div className="flex flex-col gap-3 max-w-xs">
            <div className="flex items-center gap-2.5">
              <img src={LOGO_URL} className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-unbounded text-white text-lg font-black grad-text">Полутон</span>
            </div>
            <p className="text-white/35 text-xs leading-relaxed">
              Знакомься. Общайся. Влюбляйся. Сервис знакомств для настоящих чувств.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <a href="#" onClick={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <Icon name="Send" size={14} className="text-white/60" />
              </a>
              <a href="#" onClick={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <Icon name="MessageCircle" size={14} className="text-white/60" />
              </a>
            </div>
          </div>

          <div className="flex gap-14 flex-wrap">
            <div className="flex flex-col gap-2.5">
              <span className="text-white/30 text-[11px] font-bold uppercase tracking-wider mb-1">Компания</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-white/55 text-sm hover:text-pink-400 transition-colors">О нас</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-white/55 text-sm hover:text-pink-400 transition-colors">Города</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-white/55 text-sm hover:text-pink-400 transition-colors">Блог</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-white/30 text-[11px] font-bold uppercase tracking-wider mb-1">Поддержка</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-white/55 text-sm hover:text-pink-400 transition-colors">Помощь</a>
              <button onClick={onOpenTerms} className="text-white/55 text-sm hover:text-pink-400 transition-colors text-left">Соглашение</button>
              <button onClick={onOpenPrivacy} className="text-white/55 text-sm hover:text-pink-400 transition-colors text-left">Конфиденциальность</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-white/25 text-xs">© «Полутон» — сервис знакомств и общения. {year}</p>
          <p className="text-white/25 text-xs">
            Продолжая, ты принимаешь{" "}
            <button onClick={onOpenTerms} className="text-white/45 font-semibold hover:text-pink-400 transition-colors">условия</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthFooter;
