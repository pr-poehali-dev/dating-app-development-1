const AVATARS = [
  "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/94d621ea-1e20-414c-87fc-b5f3318386ef.jpg",
  "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a4b84984-31e4-47b3-bdb3-5a6214e0ce77.jpg",
  "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c033435f-1ec1-4dc5-93eb-5d05d873e8ad.jpg",
  "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1a8a3c50-ac6c-4f04-aae3-1396b6539c28.jpg",
];

const ANDROID_ICON = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/bd79ba47-bac6-4874-8d3b-f42cbc8e79a3.jpg";
const IOS_ICON = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/f98b371c-e8c1-4aba-922c-519ce66bf462.jpg";

// ── Официальный логотип RuStore (синий значок) ──────────────────────────────
function RuStoreLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#2B7FFF,#0A5CE5)", boxShadow: "0 4px 14px rgba(43,127,255,0.4)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="4"  y="7"  width="3.6" height="14" rx="1.8" fill="#fff" transform="skewX(-12)" />
          <rect x="10" y="4"  width="3.6" height="17" rx="1.8" fill="#fff" transform="skewX(-12)" />
          <rect x="16" y="9"  width="3.6" height="12" rx="1.8" fill="#fff" transform="skewX(-12)" />
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
function NashStoreLogo() {
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

function StoreButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="px-5 py-3 rounded-2xl transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

// ── Кнопка скачивания приложения (Android / iOS) ────────────────────────────
function PlatformButton({ icon, platform, sub }: { icon: string; platform: string; sub: string }) {
  return (
    <button
      className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
      onClick={(e) => e.preventDefault()}
    >
      <img src={icon} alt={platform} className="w-11 h-11 rounded-full object-cover flex-shrink-0"
        style={{ border: "1.5px solid rgba(255,255,255,0.15)" }} />
      <div className="flex flex-col items-start leading-tight">
        <span className="text-white/45 text-[10px]">{sub}</span>
        <span className="text-white text-base font-bold">{platform}</span>
      </div>
    </button>
  );
}

export function AuthDownloadSection() {
  const year = new Date().getFullYear();

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-16 text-center flex flex-col items-center gap-10">

      {/* Заголовок */}
      <div className="flex flex-col items-center gap-3">
        <h2 className="font-unbounded text-white text-2xl font-black">Скачай приложение Полутон</h2>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-white font-black text-2xl">&gt; 40 тыс</span>
          <span className="text-white/40 text-xs -mt-1">пользователей уже с нами</span>
          <div className="flex items-center -space-x-3 mt-2">
            {AVATARS.map((src, i) => (
              <img key={i} src={src}
                className="w-10 h-10 rounded-full object-cover"
                style={{ border: "2.5px solid #1a1625", zIndex: AVATARS.length - i }} />
            ))}
          </div>
        </div>
      </div>

      {/* Кнопки скачивания на телефон */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <PlatformButton icon={ANDROID_ICON} platform="Android" sub="Скачать для" />
        <PlatformButton icon={IOS_ICON} platform="iPhone · iOS" sub="Скачать для" />
      </div>

      {/* Магазины приложений */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <StoreButton><RuStoreLogo /></StoreButton>
        <StoreButton><NashStoreLogo /></StoreButton>
      </div>

      {/* Описание */}
      <p className="text-white/45 text-sm leading-relaxed max-w-2xl mx-auto">
        Полутон — сервис знакомств нового поколения. Каждый день здесь рождаются сотни симпатий
        и тёплых переписок. Умный поиск, честные анкеты и никакого спама — просто выбирай,
        с кем хочешь познакомиться сегодня, а совпадения найдутся сами.
      </p>

      {/* Крупный копирайт */}
      <p className="text-white/70 text-lg font-semibold mt-2">
        © «Полутон» — сервис знакомств и общения. {year}
      </p>
    </div>
  );
}

export default AuthDownloadSection;
