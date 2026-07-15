import Icon from "@/components/ui/icon";

const AVATARS = [
  "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/94d621ea-1e20-414c-87fc-b5f3318386ef.jpg",
  "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/a4b84984-31e4-47b3-bdb3-5a6214e0ce77.jpg",
  "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/c033435f-1ec1-4dc5-93eb-5d05d873e8ad.jpg",
  "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1a8a3c50-ac6c-4f04-aae3-1396b6539c28.jpg",
];

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.4;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && hasHalf);
        return (
          <Icon key={i} name="Star" size={16}
            className={filled ? "text-pink-400" : "text-white/15"}
            style={filled ? { fill: "currentColor" } : undefined} />
        );
      })}
    </div>
  );
}

function StoreBadge({ store }: { store: "rustore" | "nashstore" }) {
  const isRuStore = store === "rustore";
  return (
    <button
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all hover:-translate-y-0.5 hover:brightness-110"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
      onClick={(e) => e.preventDefault()}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: isRuStore ? "linear-gradient(135deg,#1E88E5,#1565C0)" : "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
        <Icon name={isRuStore ? "Store" : "ShoppingBag"} size={14} className="text-white" />
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-white/50 text-[9px]">Доступно в</span>
        <span className="text-white text-[13px] font-bold">{isRuStore ? "RuStore" : "NashStore"}</span>
      </div>
    </button>
  );
}

export function AuthDownloadSection() {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-14 text-center">
      <h2 className="font-unbounded text-white text-2xl font-black mb-8">Скачай приложение Полутон</h2>

      <div className="flex items-center justify-center gap-10 flex-wrap mb-8">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-white font-black text-2xl">4,7</span>
          <Stars value={4.7} />
          <StoreBadge store="rustore" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-white font-black text-2xl">4,8</span>
          <Stars value={4.8} />
          <StoreBadge store="nashstore" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-white font-black text-2xl">&gt; 40 тыс</span>
          <span className="text-white/40 text-xs -mt-1">пользователей</span>
          <div className="flex items-center -space-x-3 mt-1">
            {AVATARS.map((src, i) => (
              <img key={i} src={src}
                className="w-10 h-10 rounded-full object-cover"
                style={{ border: "2.5px solid #1a1625", zIndex: AVATARS.length - i }} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-white/45 text-sm leading-relaxed max-w-2xl mx-auto">
        Полутон — сервис знакомств нового поколения. Каждый день здесь рождаются сотни симпатий
        и тёплых переписок. Умный поиск, честные анкеты и никакого спама — просто выбирай,
        с кем хочешь познакомиться сегодня, а совпадения найдутся сами.
      </p>
    </div>
  );
}

export default AuthDownloadSection;
