import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { loadYandexMaps, searchGeocode, type YMapsMap } from "@/lib/yandexMaps";

const AGE_MIN = 18;
const AGE_MAX = 80;

const ZODIACS = [
  { id: "aries",       label: "Овен",      emoji: "♈", grad: "linear-gradient(135deg,#FF6B6B,#FF2D55)" },
  { id: "taurus",      label: "Телец",     emoji: "♉", grad: "linear-gradient(135deg,#56C271,#2E9E5B)" },
  { id: "gemini",      label: "Близнецы",  emoji: "♊", grad: "linear-gradient(135deg,#FFD66B,#F5A623)" },
  { id: "cancer",      label: "Рак",       emoji: "♋", grad: "linear-gradient(135deg,#7FB3FF,#4F8EF7)" },
  { id: "leo",         label: "Лев",       emoji: "♌", grad: "linear-gradient(135deg,#FFA94D,#FF6B2D)" },
  { id: "virgo",       label: "Дева",      emoji: "♍", grad: "linear-gradient(135deg,#A0D468,#7CB342)" },
  { id: "libra",       label: "Весы",      emoji: "♎", grad: "linear-gradient(135deg,#FF9FC7,#FF5C9D)" },
  { id: "scorpio",     label: "Скорпион",  emoji: "♏", grad: "linear-gradient(135deg,#C56BFF,#8E2DE2)" },
  { id: "sagittarius", label: "Стрелец",   emoji: "♐", grad: "linear-gradient(135deg,#FF8A8A,#E0245E)" },
  { id: "capricorn",   label: "Козерог",   emoji: "♑", grad: "linear-gradient(135deg,#8D99AE,#5C677D)" },
  { id: "aquarius",    label: "Водолей",   emoji: "♒", grad: "linear-gradient(135deg,#6BE5FF,#2D9CDB)" },
  { id: "pisces",      label: "Рыбы",      emoji: "♓", grad: "linear-gradient(135deg,#9B8CFF,#6C5CE7)" },
];

function AgeRangeSlider({ min, max, onChange }: { min: number; max: number; onChange: (a: number, b: number) => void }) {
  const span = AGE_MAX - AGE_MIN;
  const minPct = ((min - AGE_MIN) / span) * 100;
  const maxPct = ((max - AGE_MIN) / span) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-white/40 text-xs font-medium">Возраст</span>
        <span className="text-white font-semibold text-sm">{min}–{max} лет</span>
      </div>
      <div className="relative h-7 flex items-center">
        {/* Трек */}
        <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
        {/* Активный диапазон */}
        <div className="absolute h-1.5 rounded-full"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%`, background: "linear-gradient(90deg,#FF2D78,#9B59B6)" }} />
        {/* Ползунок «От» */}
        <input
          type="range" min={AGE_MIN} max={AGE_MAX} value={min}
          onChange={e => onChange(Math.min(+e.target.value, max - 1), max)}
          className="age-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: min > AGE_MAX - 10 ? 5 : 3 }}
        />
        {/* Ползунок «До» */}
        <input
          type="range" min={AGE_MIN} max={AGE_MAX} value={max}
          onChange={e => onChange(min, Math.max(+e.target.value, min + 1))}
          className="age-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}



const RADIUS_PRESETS = [5, 10, 25, 50, 100];

interface CityResult { display_name: string; lat: number; lon: number; }

function RadiusMap({ radius, onChange }: { radius: number; onChange: (r: number) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const yandexMap = useRef<YMapsMap | null>(null);
  const circleRef = useRef<{ geometry: { setCoordinates: (c: [number, number]) => void; setRadius: (r: number) => void } } | null>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [globalMode, setGlobalMode] = useState(false);

  const moveMap = useCallback((lat: number, lon: number) => {
    if (!yandexMap.current || !circleRef.current) return;
    yandexMap.current.setCenter([lat, lon], 10);
    circleRef.current.geometry.setCoordinates([lat, lon]);
  }, []);

  useEffect(() => {
    if (!mapRef.current || yandexMap.current) return;
    let canceled = false;
    (async () => {
      const ymaps = await loadYandexMaps();
      if (canceled || !mapRef.current || yandexMap.current) return;
      const map = new ymaps.Map(mapRef.current, {
        center: [55.751244, 37.618423], zoom: 9,
        controls: [],
      });
      const circle = new ymaps.Circle(
        [[55.751244, 37.618423], radius * 1000],
        {},
        { fillColor: "#FF2D7822", strokeColor: "#FF2D78", strokeWidth: 2 }
      );
      map.geoObjects.add(circle);
      map.events.add("click", (e) => {
        const coords = e.get("coords") as [number, number] | undefined;
        if (coords) circle.geometry.setCoordinates(coords);
      });
      yandexMap.current = map;
      circleRef.current = circle;
    })();
    return () => { canceled = true; };
  }, []);

  useEffect(() => { circleRef.current?.geometry.setRadius(radius * 1000); }, [radius]);

  const handleCityInput = (q: string) => {
    setCityQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setCityResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchGeocode(q, 5);
        setCityResults(results.map((r) => ({ display_name: r.displayName, lat: r.lat, lon: r.lon })));
      } catch { setCityResults([]); }
      setSearching(false);
    }, 400);
  };

  const selectCity = (city: CityResult) => {
    setCityQuery(city.display_name.split(",")[0]);
    setCityResults([]);
    moveMap(city.lat, city.lon);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Поиск города */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name={searching ? "Loader2" : "Search"} size={14} className={`text-white/40 flex-shrink-0 ${searching ? "animate-spin" : ""}`} />
          <input
            value={cityQuery}
            onChange={e => handleCityInput(e.target.value)}
            placeholder="Поиск города..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
          />
          {cityQuery && <button onClick={() => { setCityQuery(""); setCityResults([]); }} className="text-white/30 active:text-white/60"><Icon name="X" size={13} /></button>}
        </div>
        {cityResults.length > 0 && (
          <div className="absolute inset-x-0 top-full mt-1 z-20 rounded-xl overflow-hidden"
            style={{ background: "#1a0d2e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            {cityResults.map((c, i) => (
              <button key={i} onClick={() => selectCity(c)}
                className="w-full text-left px-3 py-2.5 text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2"
                style={{ borderBottom: i < cityResults.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,45,120,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <Icon name="MapPin" size={13} className="text-pink-400 flex-shrink-0" />
                <span className="truncate">{c.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Карта */}
      {!globalMode && (
        <div ref={mapRef} className="w-full rounded-xl overflow-hidden" style={{ height: 130 }} />
      )}

      {/* Глобальный режим */}
      <button onClick={() => setGlobalMode(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
        style={{
          border: `1px solid ${globalMode ? "rgba(255,45,120,0.4)" : "rgba(255,255,255,0.08)"}`,
          background: globalMode ? "rgba(255,45,120,0.07)" : "rgba(255,255,255,0.04)",
        }}>
        <div className="flex items-center gap-2">
          <Icon name="Globe" size={15} className={globalMode ? "text-pink-400" : "text-white/40"} />
          <span className={`text-sm font-medium ${globalMode ? "text-white" : "text-white/60"}`}>Глобальный поиск</span>
        </div>
        <div className="relative w-10 h-6 rounded-full transition-all flex-shrink-0"
          style={{ background: globalMode ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.15)" }}>
          <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
            style={{ left: globalMode ? "calc(100% - 22px)" : "2px" }} />
        </div>
      </button>

      {/* Радиус */}
      {!globalMode && (
        <>
          <div className="flex items-center justify-between px-1">
            <span className="text-white/40 text-xs">Радиус поиска</span>
            <span className="text-white font-semibold text-sm">{radius} км</span>
          </div>
          <input type="range" min={1} max={200} value={radius}
            onChange={e => onChange(+e.target.value)}
            className="w-full accent-pink-500" />
          <div className="flex gap-1.5 flex-wrap">
            {RADIUS_PRESETS.map(r => (
              <button key={r} onClick={() => onChange(r)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={radius === r
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white", boxShadow: "0 2px 10px rgba(255,45,120,0.3)" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {r} км
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface Props {
  boostPaying: boolean;
  promoCode: string | null;
  promoDiscount: number;
  promoInput: string;
  promoChecking: boolean;
  promoError: string | null;
  onClose: () => void;
  onBuy: (ageMin: number, ageMax: number, radius: number, photoOnly: boolean, zodiac: string) => void;
  onPromoInputChange: (val: string) => void;
  onApplyPromo: () => void;
  onResetPromo: () => void;
}

export function PeopleSuperPicker({
  boostPaying,
  promoCode, promoDiscount, promoInput, promoChecking, promoError,
  onClose, onBuy,
  onPromoInputChange, onApplyPromo, onResetPromo,
}: Props) {
  const [superAgeMin, setSuperAgeMin] = useState(18);
  const [superAgeMax, setSuperAgeMax] = useState(60);
  const [superRadius, setSuperRadius] = useState(50);
  const [superPhotoOnly, setSuperPhotoOnly] = useState(false);
  const [superAgeOpen, setSuperAgeOpen] = useState(false);
  const [superZodiac, setSuperZodiac] = useState("");
  const [superZodiacOpen, setSuperZodiacOpen] = useState(false);

  const discountedPrice = (amount: number) =>
    promoDiscount > 0 ? Math.round(amount * (1 - promoDiscount / 100) * 100) / 100 : amount;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl flex flex-col pb-5 overflow-hidden"
        style={{ background: "linear-gradient(180deg,#1a0a1e 0%,#120818 100%)", boxShadow: "0 -4px 40px rgba(155,89,182,0.2)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-2 pb-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="flex items-center justify-between px-5 pt-2.5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#9B59B6,#FF2D78)", boxShadow: "0 4px 14px rgba(155,89,182,0.5)" }}>
              <Icon name="Star" size={15} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Супер подъём</p>
              <p className="text-white/35 text-[11px]">Настрой под свою аудиторию</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="X" size={14} className="text-white/60" />
          </button>
        </div>

        <div className="mx-5 mb-2.5" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(155,89,182,0.4),transparent)" }} />

        <div className="px-4 pb-1">
          <p className="text-white/50 text-[11px] uppercase tracking-widest font-semibold mb-2 px-1">Выбери фильтры</p>
          <div className="flex flex-col gap-2">

            {/* Возраст */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: superAgeOpen ? "1px solid rgba(255,45,120,0.35)" : "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
              <button
                onClick={() => setSuperAgeOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 transition-all active:scale-[0.98]"
                style={{ background: superAgeOpen ? "rgba(255,45,120,0.06)" : "transparent" }}>
                <span className="text-white font-medium text-sm">Возраст</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm">{superAgeMin}–{superAgeMax} лет</span>
                  <Icon name={superAgeOpen ? "ChevronUp" : "ChevronRight"} size={18} className="text-white/60" />
                </div>
              </button>
              {superAgeOpen && (
                <div className="px-4 pb-3 pt-3 flex flex-col gap-0"
                  style={{ background: "rgba(0,0,0,0.35)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <AgeRangeSlider min={superAgeMin} max={superAgeMax} onChange={(a, b) => { setSuperAgeMin(a); setSuperAgeMax(b); }} />
                  <div className="flex gap-1.5 flex-wrap pt-3 pb-1">
                    {([[18,25],[25,35],[35,45],[45,60]] as const).map(([a,b]) => {
                      const active = superAgeMin === a && superAgeMax === b;
                      return (
                        <button key={`${a}-${b}`} onClick={() => { setSuperAgeMin(a); setSuperAgeMax(b); }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                          style={active
                            ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white", boxShadow: "0 2px 10px rgba(255,45,120,0.4)" }
                            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {a}–{b}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Карта + радиус */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Icon name="MapPin" size={14} className="text-pink-400" />
                <span className="text-white font-medium text-sm">Местоположение и радиус</span>
              </div>
              <div className="px-4 py-2.5">
                <RadiusMap radius={superRadius} onChange={setSuperRadius} />
              </div>
            </div>

            {/* Знак зодиака */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: superZodiacOpen ? "1px solid rgba(255,45,120,0.35)" : "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
              <button
                onClick={() => setSuperZodiacOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 transition-all active:scale-[0.98]"
                style={{ background: superZodiacOpen ? "rgba(255,45,120,0.06)" : "transparent" }}>
                <span className="text-white font-medium text-sm">Знак зодиака</span>
                <div className="flex items-center gap-2">
                  {superZodiac ? (
                    <span className="flex items-center gap-1.5 text-white text-sm font-semibold">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm leading-none"
                        style={{ background: ZODIACS.find(z => z.id === superZodiac)?.grad }}>
                        {ZODIACS.find(z => z.id === superZodiac)?.emoji}
                      </span>
                      {ZODIACS.find(z => z.id === superZodiac)?.label}
                    </span>
                  ) : (
                    <span className="text-white/50 text-sm">Любой</span>
                  )}
                  <Icon name={superZodiacOpen ? "ChevronUp" : "ChevronRight"} size={18} className="text-white/60" />
                </div>
              </button>
              {superZodiacOpen && (
                <div className="px-3 pb-3 pt-2.5 flex flex-col gap-2"
                  style={{ background: "rgba(0,0,0,0.35)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ZODIACS.map(z => {
                      const active = superZodiac === z.id;
                      return (
                        <button key={z.id} onClick={() => setSuperZodiac(active ? "" : z.id)}
                          className="relative flex flex-col items-center gap-1 py-2 rounded-2xl text-[10px] font-semibold transition-all active:scale-95 overflow-hidden"
                          style={active
                            ? { background: z.grad, color: "white", boxShadow: "0 4px 14px rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.25)" }
                            : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-base leading-none transition-all"
                            style={active
                              ? { background: "rgba(255,255,255,0.22)" }
                              : { background: z.grad, opacity: 0.85 }}>
                            {z.emoji}
                          </span>
                          {z.label}
                          {active && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                              style={{ background: "rgba(255,255,255,0.95)" }}>
                              <Icon name="Check" size={9} style={{ color: "#1a0d2e" }} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {superZodiac && (
                    <button onClick={() => setSuperZodiac("")}
                      className="self-center text-pink-400 text-[11px] font-semibold active:scale-95 pt-0.5">
                      Сбросить выбор
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Только фото */}
            <button
              onClick={() => setSuperPhotoOnly(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
              style={{ border: `1.5px solid ${superPhotoOnly ? "rgba(255,45,120,0.5)" : "rgba(255,255,255,0.18)"}`, background: superPhotoOnly ? "rgba(255,45,120,0.08)" : "transparent" }}>
              <span className="text-white font-medium text-sm">Только фото</span>
              <div className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                style={{ background: superPhotoOnly ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.2)" }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: superPhotoOnly ? "calc(100% - 22px)" : "2px" }} />
              </div>
            </button>
          </div>
        </div>

        <div className="px-4 pt-3">
          {promoCode ? (
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="BadgeCheck" size={18} className="text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm font-semibold truncate">Промокод {promoCode} · −{promoDiscount}%</p>
              </div>
              <button onClick={onResetPromo} className="text-white/30 flex-shrink-0">
                <Icon name="X" size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => onPromoInputChange(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && onApplyPromo()}
                  placeholder="Промокод"
                  className="flex-1 text-white placeholder-white/25 rounded-2xl px-4 py-3 text-sm outline-none uppercase tracking-wide"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button onClick={onApplyPromo} disabled={promoChecking || !promoInput.trim()}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 12px rgba(255,45,120,0.35)" }}>
                  {promoChecking ? <Icon name="Loader2" size={16} className="animate-spin" /> : "Применить"}
                </button>
              </div>
              {promoError && <p className="text-red-400 text-xs mt-2 px-1">{promoError}</p>}
            </>
          )}
        </div>

        <div className="px-4 pt-3">
          <button
            disabled={boostPaying}
            onClick={() => onBuy(superAgeMin, superAgeMax, superRadius, superPhotoOnly, superZodiac)}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#9B59B6,#FF2D78)", boxShadow: "0 4px 20px rgba(155,89,182,0.4)" }}>
            {boostPaying
              ? <Icon name="Loader2" size={20} className="animate-spin text-white" />
              : <>
                  <Icon name="Star" size={18} className="text-white" />
                  <span>Продолжить · {discountedPrice(550).toLocaleString("ru")} ₽</span>
                </>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default PeopleSuperPicker;