import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onClose: () => void;
  onSelectCity: (city: string) => void;
}

const POPULAR_CITIES = [
  { name: "Москва", country: "Россия", emoji: "🏙️", grad: ["#FF2D78", "#9B59B6"] },
  { name: "Санкт-Петербург", country: "Россия", emoji: "🌆", grad: ["#6366f1", "#3b82f6"] },
  { name: "Новосибирск", country: "Россия", emoji: "🌇", grad: ["#f59e0b", "#ef4444"] },
  { name: "Екатеринбург", country: "Россия", emoji: "🏔️", grad: ["#06b6d4", "#3b82f6"] },
  { name: "Казань", country: "Россия", emoji: "🕌", grad: ["#10b981", "#06b6d4"] },
  { name: "Минск", country: "Беларусь", emoji: "🇧🇾", grad: ["#ec4899", "#f43f5e"] },
  { name: "Гомель", country: "Беларусь", emoji: "🏰", grad: ["#f43f5e", "#f59e0b"] },
  { name: "Пхеньян", country: "КНДР", emoji: "🇰🇵", grad: ["#ef4444", "#3b82f6"] },
  { name: "Тегеран", country: "Иран", emoji: "🇮🇷", grad: ["#10b981", "#f59e0b"] },
  { name: "Исфахан", country: "Иран", emoji: "🕌", grad: ["#06b6d4", "#10b981"] },
  { name: "Пекин", country: "Китай", emoji: "🇨🇳", grad: ["#ef4444", "#f59e0b"] },
  { name: "Шанхай", country: "Китай", emoji: "🌃", grad: ["#8b5cf6", "#6366f1"] },
];

export function PeopleExploreWorld({ onClose, onSelectCity }: Props) {
  const [search, setSearch] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const filtered = POPULAR_CITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[70] flex flex-col"
      style={{ background: "var(--spark-dark,#0f0a1a)" }}>

      {/* Шапка */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
        <h2 className="text-white font-bold text-lg flex-1">Исследуй мир</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* Поиск города */}
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск города..."
            className="w-full text-white placeholder-white/30 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none font-golos"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* 2 кнопки действий */}
        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={geoLoading}
            onClick={() => {
              if (!navigator.geolocation) { onSelectCity("__nearby__"); return; }
              setGeoLoading(true);
              navigator.geolocation.getCurrentPosition(
                () => { setGeoLoading(false); onSelectCity("__nearby__"); },
                () => { setGeoLoading(false); onSelectCity("__nearby__"); },
                { timeout: 8000 }
              );
            }}
            className="flex flex-col items-center gap-2.5 py-5 rounded-2xl transition-all disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, rgba(255,45,120,0.18), rgba(155,89,182,0.14))",
              border: "1.5px solid rgba(255,45,120,0.3)",
            }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 14px rgba(255,45,120,0.5)" }}>
              {geoLoading
                ? <Icon name="Loader2" size={22} className="text-white animate-spin" />
                : <Icon name="Navigation" size={22} className="text-white" />}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white font-bold text-sm">Рядом</span>
              <span className="text-white/40 text-xs">{geoLoading ? "Определяем..." : "Люди вокруг"}</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCity("__random__")}
            className="flex flex-col items-center gap-2.5 py-5 rounded-2xl active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(99,179,237,0.15), rgba(79,134,247,0.12))",
              border: "1.5px solid rgba(99,179,237,0.3)",
            }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow: "0 4px 14px rgba(59,130,246,0.45)" }}>
              <Icon name="Globe" size={22} className="text-white" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white font-bold text-sm">Случайный</span>
              <span className="text-white/40 text-xs">Открой новый город</span>
            </div>
          </button>
        </div>

        {/* Популярные города */}
        <div>
          <div className="flex items-center gap-2 mb-3.5">
            <Icon name="Sparkles" size={14} className="text-pink-400" />
            <p className="text-white/50 text-xs font-bold uppercase tracking-[0.15em]">
              {search ? "Результаты поиска" : "Популярные города"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(city => (
              <button
                key={city.name}
                onClick={() => onSelectCity(city.name)}
                className="group relative overflow-hidden rounded-3xl text-left active:scale-[0.96] transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}>
                {/* Цветной градиентный ореол */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-active:opacity-70"
                  style={{ background: `radial-gradient(circle, ${city.grad[0]}, transparent 70%)` }} />

                <div className="relative flex flex-col gap-3 p-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${city.grad[0]}33, ${city.grad[1]}22)`,
                      border: `1px solid ${city.grad[0]}44`,
                      boxShadow: `0 4px 14px ${city.grad[0]}33`,
                    }}>
                    {city.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">{city.name}</p>
                    <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                      <Icon name="MapPin" size={10} className="text-white/30" />
                      {city.country}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 flex flex-col items-center gap-2 py-10">
                <Icon name="SearchX" size={28} className="text-white/20" />
                <p className="text-white/30 text-sm">Город не найден</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}