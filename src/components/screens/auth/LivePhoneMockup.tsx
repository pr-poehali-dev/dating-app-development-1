import Icon from "@/components/ui/icon";

const SCREEN = "/live-phone/screen.jpg";
const HOST_AVATAR = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/94d621ea-1e20-414c-87fc-b5f3318386ef.jpg";

// ── Мокап смартфона с прямым эфиром внутри (чистый CSS, без «вырезанных» краёв)
export function LivePhoneMockup() {
  const W = 300;
  const H = Math.round(W * 2.05);

  return (
    <div className="relative flex items-center justify-center" style={{ width: W + 90, height: H + 60 }}>
      {/* Мягкое розовое свечение позади телефона — сливается с фоном страницы */}
      <div className="absolute rounded-full"
        style={{
          width: W + 220, height: W + 220,
          background: "radial-gradient(circle, rgba(255,45,120,0.28) 0%, rgba(155,89,182,0.16) 45%, transparent 72%)",
          filter: "blur(40px)",
        }} />

      {/* Корпус телефона */}
      <div className="relative" style={{
        width: W, height: H,
        borderRadius: 46,
        background: "linear-gradient(160deg,#2a2438,#151022)",
        padding: 9,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,45,120,0.35)",
      }}>
        {/* Экран */}
        <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: 38 }}>
          <img src={SCREEN} alt="Прямой эфир" className="w-full h-full object-cover" />

          {/* Затемнения сверху и снизу для читаемости интерфейса */}
          <div className="absolute inset-x-0 top-0 h-24" style={{ background: "linear-gradient(to bottom, rgba(10,6,20,0.75), transparent)" }} />
          <div className="absolute inset-x-0 bottom-0 h-52" style={{ background: "linear-gradient(to top, rgba(10,6,20,0.9), transparent)" }} />

          {/* Верхняя панель: Live · зрители · закрыть */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-unbounded font-black text-lg leading-none">Live</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-white/90 text-xs font-semibold">
                <Icon name="Eye" size={13} /> 1.2K
              </div>
              <Icon name="X" size={17} className="text-white/80" />
            </div>
          </div>

          {/* Хост + подписка */}
          <div className="absolute top-14 inset-x-4 flex items-center gap-2">
            <img src={HOST_AVATAR} alt="" className="w-9 h-9 rounded-full object-cover" style={{ border: "1.5px solid rgba(255,255,255,0.6)" }} />
            <div className="flex flex-col leading-tight">
              <span className="text-white text-sm font-bold">Алина</span>
              <span className="text-white/70 text-[10px] flex items-center gap-0.5"><Icon name="Star" size={9} className="text-pink-400" style={{ fill: "currentColor" }} /> 25.3K</span>
            </div>
            <button className="ml-1 px-3 py-1.5 rounded-full text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              + Подписаться
            </button>
          </div>

          {/* Комментарии */}
          <div className="absolute left-4 right-14 bottom-16 flex flex-col gap-2">
            {[
              { n: "Марина", t: "Привет! Ты прекрасна! 💕" },
              { n: "Сергей", t: "Какая уютная атмосфера 😍" },
              { n: "Olya", t: "Где купила свитер?" },
            ].map((c, i) => (
              <div key={i} className="text-[11px] leading-tight">
                <span className="text-pink-300 font-bold">{c.n} </span>
                <span className="text-white/90">{c.t}</span>
              </div>
            ))}
          </div>

          {/* Летящие сердечки */}
          <div className="absolute right-3 bottom-16 flex flex-col items-center gap-1.5">
            {["#FF2D78", "#FF6BA0", "#9B59B6", "#FF2D78"].map((c, i) => (
              <Icon key={i} name="Heart" size={16 + (i % 2) * 3} style={{ color: c, fill: c, opacity: 0.9 - i * 0.15 }} />
            ))}
          </div>

          {/* Поле ввода */}
          <div className="absolute bottom-4 inset-x-4 flex items-center gap-2">
            <div className="flex-1 rounded-full px-3 py-2 text-white/50 text-xs"
              style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.15)" }}>
              Напишите сообщение...
            </div>
            <Icon name="Gift" size={18} className="text-pink-300" />
            <Icon name="Heart" size={18} className="text-pink-400" style={{ fill: "currentColor" }} />
          </div>
        </div>

        {/* Notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2.5" style={{ width: 96, height: 17, background: "#151022", borderRadius: 12 }} />
      </div>
    </div>
  );
}

export default LivePhoneMockup;
