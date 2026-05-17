import { useState } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi, type DiscoverParams } from "@/lib/api";

// ─── FilterScreen ─────────────────────────────────────────────────────────────
export function FilterScreen({ initial, onApply, onClose }: {
  initial: DiscoverParams;
  onApply: (p: DiscoverParams) => void;
  onClose: () => void;
}) {
  const [ageMin, setAgeMin] = useState(initial.age_min ?? 18);
  const [ageMax, setAgeMax] = useState(initial.age_max ?? 60);
  const [lookingFor, setLookingFor] = useState(initial.looking_for ?? "all");
  const [country, setCountry] = useState(initial.country ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [radius, setRadius] = useState(initial.radius_km ?? 0);
  const [useGeo, setUseGeo] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(
    initial.lat ? { lat: initial.lat, lon: initial.lon! } : null
  );
  const [onlineOnly, setOnlineOnly] = useState(initial.online_only ?? false);

  const genders = [
    { val: "female", label: "Девушек" },
    { val: "male", label: "Парней" },
    { val: "all", label: "Всех" },
  ];

  const requestGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGeoCoords({ lat, lon });
        setUseGeo(true);
        if (radius === 0) setRadius(50);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const data = await r.json();
          const c = data.address?.country || "";
          const ci = data.address?.city || data.address?.town || data.address?.village || "";
          if (c) setCountry(c);
          if (ci) setCity(ci);
          profilesApi.updateGeo(lat, lon, c, ci).catch(() => {});
        } catch (e: unknown) { void e; }
        setGeoLoading(false);
      },
      () => setGeoLoading(false)
    );
  };

  const apply = () => {
    const p: DiscoverParams = { age_min: ageMin, age_max: ageMax, looking_for: lookingFor };
    if (city) p.city = city;
    if (country) p.country = country;
    if (onlineOnly) p.online_only = true;
    if (useGeo && geoCoords && radius > 0) {
      p.lat = geoCoords.lat;
      p.lon = geoCoords.lon;
      p.radius_km = radius;
    }
    onApply(p);
  };

  const reset = () => {
    setAgeMin(18); setAgeMax(60); setLookingFor("all");
    setCountry(""); setCity(""); setRadius(0);
    setUseGeo(false); setOnlineOnly(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-white font-golos font-bold text-xl">Фильтры</h2>
        <div className="flex items-center gap-3">
          <button onClick={reset} className="text-white/40 text-xs hover:text-white/70 transition-colors">Сбросить</button>
          <button onClick={onClose} className="text-white/50 hover:text-white"><Icon name="X" size={22} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-4 pb-4">
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Возраст</span>
            <span className="text-white/60 text-sm">{ageMin} – {ageMax} лет</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-xs w-6">от</span>
              <input type="range" min={18} max={ageMax} value={ageMin}
                onChange={(e) => setAgeMin(+e.target.value)} className="flex-1 accent-pink-500" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-xs w-6">до</span>
              <input type="range" min={ageMin} max={80} value={ageMax}
                onChange={(e) => setAgeMax(+e.target.value)} className="flex-1 accent-pink-500" />
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <span className="text-white font-semibold text-sm block mb-3">Кого ищешь</span>
          <div className="grid grid-cols-3 gap-2">
            {genders.map((g) => (
              <button key={g.val} onClick={() => setLookingFor(g.val)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={lookingFor === g.val
                  ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                  : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setOnlineOnly((v) => !v)}
          className="glass-card p-4 flex items-center justify-between w-full">
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

        <div className="glass-card p-4 flex flex-col gap-3">
          <span className="text-white font-semibold text-sm flex items-center gap-2">
            <Icon name="Globe" size={15} className="text-white/50" />Местоположение
          </span>
          <input value={country} onChange={(e) => setCountry(e.target.value)}
            placeholder="Страна (например: Россия)"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
          <input value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="Город (например: Москва)"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-golos" />
        </div>

        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <Icon name="LocateFixed" size={15} className="text-white/50" />Рядом со мной
            </span>
            <button onClick={requestGeo} disabled={geoLoading}
              className="btn-grad px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50">
              {geoLoading
                ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Определяем...</>
                : geoCoords
                ? <><Icon name="Check" size={12} className="text-white" />Обновить</>
                : <><Icon name="Navigation" size={12} className="text-white" />Моя геопозиция</>}
            </button>
          </div>
          {geoCoords && (
            <>
              <button onClick={() => setUseGeo((v) => !v)}
                className="flex items-center justify-between w-full">
                <span className="text-white/60 text-xs">Использовать геопозицию</span>
                <div className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: useGeo ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.12)" }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                    style={{ left: useGeo ? "calc(100% - 18px)" : "2px" }} />
                </div>
              </button>
              {useGeo && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/50 text-xs">Радиус поиска</span>
                    <span className="text-white/70 text-xs font-semibold">{radius} км</span>
                  </div>
                  <input type="range" min={5} max={500} step={5} value={radius}
                    onChange={(e) => setRadius(+e.target.value)} className="w-full accent-pink-500" />
                  <div className="flex justify-between text-white/30 text-[10px] mt-1">
                    <span>5 км</span><span>500 км</span>
                  </div>
                </div>
              )}
            </>
          )}
          {!geoCoords && (
            <p className="text-white/30 text-xs">Разреши доступ к геолокации, чтобы искать людей рядом</p>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <button onClick={apply} className="btn-grad w-full py-3.5 text-base font-semibold">
          Применить фильтры
        </button>
      </div>
    </div>
  );
}
