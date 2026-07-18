import Icon from "@/components/ui/icon";

interface Feature {
  icon: string;
  title: string;
  items: { bold: string; text: string }[];
}

const FEATURES: Feature[] = [
  {
    icon: "Heart",
    title: "Присоединиться",
    items: [
      { bold: "Присоединяйся", text: "к тысячам людей на Полутон по всей стране" },
      { bold: "Знакомься", text: "с кем угодно в любое время — всегда кто-то онлайн" },
      { bold: "Общайся", text: "в удобном чате с быстрыми ответами и голосовыми" },
    ],
  },
  {
    icon: "Compass",
    title: "Открыть для себя",
    items: [
      { bold: "Просмотр", text: "ленты, чтобы быть в курсе новых анкет рядом" },
      { bold: "Фильтры", text: "помогут найти именно того, кого ты ищешь" },
      { bold: "Прямые эфиры", text: "смотри и общайся с людьми в реальном времени" },
    ],
  },
  {
    icon: "Share2",
    title: "Поделиться",
    items: [
      { bold: "Лента", text: "посты от людей, на которых ты подписан и тех, с кем захочешь познакомиться" },
      { bold: "Истории", text: "отражают тебя и твои интересы — покажи себя настоящего" },
    ],
  },
  {
    icon: "ShieldCheck",
    title: "Безопасность",
    items: [
      { bold: "Конфиденциальность", text: "в основе Полутон — общение без лишних глаз" },
      { bold: "Модерация", text: "следит за тем, чтобы сообщество оставалось безопасным" },
      { bold: "Поддержка", text: "доступна и всегда готова помочь" },
    ],
  },
];

export function AuthFeaturesGrid() {
  return (
    <div id="features" className="w-full max-w-5xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-12">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,45,120,0.14)", border: "1.5px solid rgba(255,45,120,0.4)" }}>
                <Icon name={f.icon} size={18} className="text-pink-400" />
              </div>
              <h3 className="text-white text-xl font-bold font-unbounded">{f.title}</h3>
            </div>
            <ul className="flex flex-col gap-2 pl-1">
              {f.items.map((it, i) => (
                <li key={i} className="text-white/50 text-sm leading-relaxed flex gap-2">
                  <span className="text-pink-400 flex-shrink-0">•</span>
                  <span><span className="text-white font-semibold">{it.bold}</span> {it.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AuthFeaturesGrid;
