import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onClose: () => void;
  onSelectCity: (city: string) => void;
}

const POPULAR_CITIES = [
  { name: "Москва", country: "Россия", emoji: "🏙️" },
  { name: "Санкт-Петербург", country: "Россия", emoji: "🌆" },
  { name: "Новосибирск", country: "Россия", emoji: "🌇" },
  { name: "Екатеринбург", country: "Россия", emoji: "🏔️" },
  { name: "Казань", country: "Россия", emoji: "🕌" },
  { name: "Минск", country: "Беларусь", emoji: "🇧🇾" },
  { name: "Алматы", country: "Казахстан", emoji: "🇰🇿" },
  { name: "Ташкент", country: "Узбекистан", emoji: "🇺🇿" },
  { name: "Тбилиси", country: "Грузия", emoji: "🇬🇪" },
  { name: "Баку", country: "Азербайджан", emoji: "🇦🇿" },
  { name: "Ереван", country: "Армения", emoji: "🇦🇲" },
  { name: "Берлин", country: "Германия", emoji: "🇩🇪" },
];

export function PeopleExploreWorld({ onClose, onSelectCity }: Props) {
  const [search, setSearch] = useState("");

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
            onClick={() => onSelectCity("__nearby__")}
            className="flex flex-col items-center gap-2.5 py-5 rounded-2xl active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(255,45,120,0.18), rgba(155,89,182,0.14))",
              border: "1.5px solid rgba(255,45,120,0.3)",
            }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 14px rgba(255,45,120,0.5)" }}>
              <Icon name="Navigation" size={22} className="text-white" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white font-bold text-sm">Рядом</span>
              <span className="text-white/40 text-xs">Люди вокруг</span>
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
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
            {search ? "Результаты поиска" : "Популярные"}
          </p>
          <div className="flex flex-col gap-1">
            {filtered.map(city => (
              <button
                key={city.name}
                onClick={() => onSelectCity(city.name)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left active:scale-[0.98] transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-2xl flex-shrink-0">{city.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{city.name}</p>
                  <p className="text-white/35 text-xs">{city.country}</p>
                </div>
                <Icon name="ChevronRight" size={16} className="text-white/20 flex-shrink-0" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">Город не найден</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
