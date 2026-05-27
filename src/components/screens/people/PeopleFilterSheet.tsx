import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type DiscoverParams } from "@/lib/api";

interface Props {
  filters: DiscoverParams;
  onApply: (p: DiscoverParams) => void;
  onClose: () => void;
  onAdvancedFilter?: () => void;
  onExploreWorld?: () => void;
  onTravelMode?: () => void;
}

export function PeopleFilterSheet({ filters, onApply, onClose, onAdvancedFilter, onExploreWorld, onTravelMode }: Props) {
  const [ageMin, setAgeMin] = useState(filters.age_min ?? 18);
  const [ageMax, setAgeMax] = useState(filters.age_max ?? 60);
  const [lookingFor, setLookingFor] = useState(filters.looking_for ?? "all");
  const [onlineOnly, setOnlineOnly] = useState(filters.online_only ?? false);
  const [city, setCity] = useState(filters.city ?? "");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const apply = () => {
    const p: DiscoverParams = { age_min: ageMin, age_max: ageMax, looking_for: lookingFor };
    if (onlineOnly) p.online_only = true;
    if (city.trim()) p.city = city.trim();
    onApply(p);
  };

  const reset = () => {
    setAgeMin(18); setAgeMax(60); setLookingFor("all");
    setOnlineOnly(false); setCity("");
  };

  const genders = [
    { val: "female", label: "Девушки", icon: "🌸" },
    { val: "male",   label: "Парни",   icon: "⚡" },
    { val: "all",    label: "Все",     icon: "✨" },
  ];

  const AGE_PRESETS = [[18,25],[25,35],[35,50],[50,80]] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "#120d1e", borderRadius: "28px 28px 0 0", maxHeight: "90dvh" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: "rgba(255,255,255,0.15)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Основные фильтры</h3>
            <p className="text-white/30 text-xs mt-0.5">Настрой поиск под себя</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reset}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Сбросить
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 flex flex-col gap-5">

          {/* Возраст */}
          <div className="rounded-2xl p-4 flex flex-col gap-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎂</span>
                <span className="text-white font-semibold text-sm">Возраст</span>
              </div>
              <span className="text-pink-400 font-bold text-sm">{ageMin} – {ageMax} лет</span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-white/35 text-xs">от {ageMin}</span>
                </div>
                <input type="range" min={18} max={80} value={ageMin}
                  onChange={e => setAgeMin(Math.min(+e.target.value, ageMax - 1))}
                  className="w-full accent-pink-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-white/35 text-xs">до {ageMax}</span>
                </div>
                <input type="range" min={18} max={80} value={ageMax}
                  onChange={e => setAgeMax(Math.max(+e.target.value, ageMin + 1))}
                  className="w-full accent-pink-500" />
              </div>
            </div>

            {/* Быстрые диапазоны */}
            <div className="flex gap-1.5 flex-wrap">
              {AGE_PRESETS.map(([a, b]) => (
                <button key={`${a}-${b}`}
                  onClick={() => { setAgeMin(a); setAgeMax(b); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={ageMin === a && ageMax === b
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white", boxShadow: "0 2px 8px rgba(255,45,120,0.4)" }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {a}–{b}
                </button>
              ))}
            </div>
          </div>

          {/* Кого ищешь */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2">
              <span className="text-base">👥</span>
              <span className="text-white font-semibold text-sm">Кого ищешь</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {genders.map(g => (
                <button key={g.val} onClick={() => setLookingFor(g.val)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                  style={lookingFor === g.val
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white", boxShadow: "0 3px 12px rgba(255,45,120,0.4)" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-lg">{g.icon}</span>
                  <span className="text-xs">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Только онлайн */}
          <button onClick={() => setOnlineOnly(v => !v)}
            className="flex items-center justify-between w-full rounded-2xl p-4 transition-all active:scale-[0.98]"
            style={{
              background: onlineOnly
                ? "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,197,94,0.08))"
                : "rgba(255,255,255,0.04)",
              border: onlineOnly ? "1.5px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)",
            }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: onlineOnly ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)",
                  border: onlineOnly ? "1px solid rgba(74,222,128,0.4)" : "none",
                }}>
                <div className="w-2.5 h-2.5 rounded-full"
                  style={{ background: onlineOnly ? "#4ADE80" : "rgba(255,255,255,0.25)", boxShadow: onlineOnly ? "0 0 8px #4ADE80" : "none" }} />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">Только онлайн</p>
                <p className="text-white/35 text-xs">Сейчас в сети</p>
              </div>
            </div>
            <div className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: onlineOnly ? "linear-gradient(135deg,#4ADE80,#22c55e)" : "rgba(255,255,255,0.12)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
                style={{ left: onlineOnly ? "calc(100% - 22px)" : "2px" }} />
            </div>
          </button>

          {/* Город */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span className="text-white font-semibold text-sm">Город</span>
            </div>
            <div className="flex gap-2">
              <input value={city} onChange={e => setCity(e.target.value)}
                placeholder="Например: Москва"
                className="flex-1 text-white placeholder-white/25 rounded-xl px-4 py-2.5 text-sm outline-none border font-golos transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={e => (e.target.style.borderColor = "rgba(255,45,120,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <button
                disabled={geoLoading}
                onClick={() => {
                  setGeoError("");
                  if (!navigator.geolocation) { setGeoError("Геолокация не поддерживается"); return; }
                  setGeoLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    async pos => {
                      try {
                        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=ru`);
                        const d = await r.json();
                        const detected = d.address?.city || d.address?.town || d.address?.village || d.address?.county || "";
                        if (detected) setCity(detected); else setGeoError("Город не найден");
                      } catch { setGeoError("Ошибка запроса"); }
                      finally { setGeoLoading(false); }
                    },
                    () => { setGeoError("Доступ запрещён"); setGeoLoading(false); },
                    { timeout: 8000 }
                  );
                }}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 3px 12px rgba(255,45,120,0.4)" }}>
                {geoLoading
                  ? <Icon name="Loader2" size={17} className="text-white animate-spin" />
                  : <Icon name="Navigation" size={17} className="text-white" />}
              </button>
            </div>
            {geoError && (
              <p className="text-red-400 text-xs">
                {geoError === "Доступ запрещён"
                  ? "Разреши доступ в настройках браузера (🔒 в адресной строке)"
                  : geoError}
              </p>
            )}
          </div>

          {/* Дополнительные секции */}
          {(onAdvancedFilter || onExploreWorld || onTravelMode) && (
            <div className="flex flex-col gap-1.5">
              <p className="text-white/30 text-[11px] uppercase tracking-wider font-semibold px-1 mb-0.5">Ещё возможности</p>

              {onAdvancedFilter && (
                <button onClick={() => { onClose(); onAdvancedFilter(); }}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,45,120,0.15)" }}>
                      <Icon name="SlidersHorizontal" size={16} className="text-pink-400" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-white text-sm font-semibold">Фильтры включены</span>
                      <span className="text-white/35 text-[11px]">Возраст, верификация и другое</span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-white/25" />
                </button>
              )}

              {onExploreWorld && (
                <button onClick={() => { onClose(); onExploreWorld(); }}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(59,130,246,0.15)" }}>
                      <Icon name="Globe" size={16} className="text-blue-400" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-white text-sm font-semibold">Исследуй мир</span>
                      <span className="text-white/35 text-[11px]">Найди людей в любом городе</span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-white/25" />
                </button>
              )}

              {onTravelMode && (
                <button onClick={() => { onClose(); onTravelMode(); }}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,107,53,0.15)" }}>
                      <Icon name="Plane" size={16} className="text-orange-400" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-white text-sm font-semibold">Режим путешествия</span>
                      <span className="text-white/35 text-[11px]">Смени свою локацию</span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-white/25" />
                </button>
              )}
            </div>
          )}

        </div>

        {/* Кнопка применить */}
        <div className="px-5 pb-10 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={apply}
            className="btn-grad w-full py-4 text-base font-bold rounded-2xl flex items-center justify-center gap-2">
            <Icon name="Check" size={18} className="text-white" />
            Применить фильтры
          </button>
        </div>

      </div>
    </div>
  );
}

export default PeopleFilterSheet;