import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type DiscoverParams } from "@/lib/api";

interface Props {
  filters: DiscoverParams;
  onApply: (p: DiscoverParams) => void;
  onClose: () => void;
}

export function PeopleFilterSheet({ filters, onApply, onClose }: Props) {
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
    { val: "female", label: "Девушки" },
    { val: "male", label: "Парни" },
    { val: "all", label: "Все" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0", maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />

        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-white font-bold text-base">Основные фильтры</h3>
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-white/40 text-xs hover:text-white/70 transition-colors">Сбросить</button>
            <button onClick={onClose}><Icon name="X" size={20} className="text-white/50" /></button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5 pb-4">
          {/* Возраст */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Возраст</span>
              <span className="text-white/50 text-sm">{ageMin} – {ageMax} лет</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs w-6">от</span>
                <input type="range" min={18} max={80} value={ageMin}
                  onChange={(e) => { const v = +e.target.value; setAgeMin(Math.min(v, ageMax - 1)); }} className="flex-1 accent-pink-500" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs w-6">до</span>
                <input type="range" min={18} max={80} value={ageMax}
                  onChange={(e) => { const v = +e.target.value; setAgeMax(Math.max(v, ageMin + 1)); }} className="flex-1 accent-pink-500" />
              </div>
            </div>
          </div>

          {/* Кого ищешь */}
          <div>
            <span className="text-white font-semibold text-sm block mb-3">Кого ищешь</span>
            <div className="grid grid-cols-3 gap-2">
              {genders.map((g) => (
                <button key={g.val} onClick={() => setLookingFor(g.val)}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={lookingFor === g.val
                    ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Только онлайн */}
          <button onClick={() => setOnlineOnly((v) => !v)}
            className="flex items-center justify-between w-full glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-white font-semibold text-sm">Только онлайн</span>
            </div>
            <div className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: onlineOnly ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
                style={{ left: onlineOnly ? "calc(100% - 22px)" : "2px" }} />
            </div>
          </button>

          {/* Город */}
          <div>
            <span className="text-white font-semibold text-sm block mb-2">Город</span>
            <div className="flex gap-2">
              <input value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Например: Москва"
                className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
              <button
                disabled={geoLoading}
                onClick={() => {
                  setGeoError("");
                  if (!navigator.geolocation) {
                    setGeoError("Геолокация не поддерживается");
                    return;
                  }
                  setGeoLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      try {
                        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=ru`);
                        const d = await r.json();
                        const detected = d.address?.city || d.address?.town || d.address?.village || d.address?.county || "";
                        if (detected) setCity(detected);
                        else setGeoError("Город не найден");
                      } catch {
                        setGeoError("Ошибка запроса");
                      } finally {
                        setGeoLoading(false);
                      }
                    },
                    () => {
                      setGeoError("Доступ запрещён");
                      setGeoLoading(false);
                    },
                    { timeout: 8000 }
                  );
                }}
                title="Определить город автоматически"
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-50"
                style={{ background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.3)" }}>
                {geoLoading
                  ? <Icon name="Loader2" size={18} className="text-pink-400 animate-spin" />
                  : <Icon name="Navigation" size={18} className="text-pink-400" />}
              </button>
            </div>
            {geoError && (
              <p className="text-red-400 text-xs mt-1.5">
                {geoError === "Доступ запрещён"
                  ? "Разреши доступ к геолокации в настройках браузера (🔒 слева от адресной строки)"
                  : geoError}
              </p>
            )}
          </div>
        </div>

        <div className="px-5 pb-8 pt-2">
          <button onClick={apply} className="btn-grad w-full py-3.5 text-sm font-semibold">
            Применить фильтры
          </button>
        </div>
      </div>
    </div>
  );
}

export default PeopleFilterSheet;