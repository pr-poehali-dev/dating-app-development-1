import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { loadYandexMaps, reverseGeocode, searchGeocode, type YMapsMap, type YMapsPlacemark } from "@/lib/yandexMaps";

interface Props {
  onClose: () => void;
  onApply: (city: string) => void;
}

export function PeopleTravelMode({ onClose, onApply }: Props) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const yandexMap = useRef<YMapsMap | null>(null);
  const marker = useRef<YMapsPlacemark | null>(null);
  const [coords, setCoords] = useState<[number, number]>([55.7558, 37.6176]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Загружаем Яндекс.Карты
  useEffect(() => {
    let canceled = false;
    (async () => {
      const ymaps = await loadYandexMaps();
      if (canceled || !mapRef.current || yandexMap.current) return;

      const map = new ymaps.Map(mapRef.current, {
        center: coords,
        zoom: 10,
        controls: [],
      });

      const m = new ymaps.Placemark(
        coords,
        {},
        { preset: "islands#pinkDotIcon", draggable: true }
      );
      m.events.add("dragend", async () => {
        const [lat, lon] = m.geometry.getCoordinates();
        setCoords([lat, lon]);
        try {
          const res = await reverseGeocode(lat, lon);
          const found = res?.city || "";
          setQuery(found);
          setCity(found);
        } catch { /* ignore */ }
      });
      map.geoObjects.add(m);

      marker.current = m;
      yandexMap.current = map;
      setMapLoaded(true);
    })();
    return () => { canceled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Геокодинг при вводе
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchGeocode(val, 5);
        setSuggestions(results.map((r) => r.displayName));
      } catch { /* ignore */ }
    }, 400);
  };

  const selectSuggestion = async (name: string) => {
    setQuery(name);
    setCity(name.split(",")[0].trim());
    setSuggestions([]);
    try {
      const results = await searchGeocode(name, 1);
      const found = results[0];
      if (found) {
        setCoords([found.lat, found.lon]);
        yandexMap.current?.setCenter([found.lat, found.lon], 10);
        marker.current?.geometry.setCoordinates([found.lat, found.lon]);
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col"
      style={{ background: "#000" }}>

      {/* Шапка */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4 flex-shrink-0 relative z-10"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
        <h2 className="text-white font-bold text-lg flex-1">Режим путешествия</h2>
      </div>

      {/* Поиск */}
      <div className="px-4 pt-3 pb-2 relative z-10 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Локация"
            className="w-full text-white placeholder-white/40 rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none font-golos"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <Icon name="Navigation" size={15} className="text-white/60" />
          </button>
        </div>

        {/* Подсказки */}
        {suggestions.length > 0 && (
          <div className="mt-1 rounded-2xl overflow-hidden" style={{ background: "rgba(20,14,35,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => selectSuggestion(s)}
                className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2"
                style={{ borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <Icon name="MapPin" size={13} className="text-pink-400 flex-shrink-0" />
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}

        {/* Подсказка */}
        <div className="mt-2 px-1 py-2 rounded-xl text-white/50 text-xs leading-relaxed"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          Знакомься с ребятами в новых местах или перенеси свой профиль в другую локацию
        </div>
      </div>

      {/* Карта */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: "rgba(0,0,0,0.8)" }}>
            {/* Декоративный круг с pin */}
            <div className="relative flex items-center justify-center"
              style={{
                width: 280, height: 280,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(155,89,182,0.15) 0%, rgba(255,45,120,0.05) 60%, transparent 100%)",
                border: "2px solid",
                borderImage: "linear-gradient(135deg,#FF2D78,#9B59B6) 1",
                boxShadow: "0 0 60px rgba(155,89,182,0.2), inset 0 0 60px rgba(255,45,120,0.05)",
              }}>
              <div className="absolute inset-0 rounded-full"
                style={{ border: "1.5px solid rgba(255,45,120,0.3)", borderRadius: "50%" }} />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "#FF2D78", boxShadow: "0 6px 20px rgba(255,45,120,0.6)" }}>
                  <Icon name="MapPin" size={24} className="text-white" style={{ fill: "white" }} />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              </div>
            </div>
            <div className="absolute" style={{ bottom: 100 }}>
              <Icon name="Loader2" size={20} className="text-white/30 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Кнопки снизу */}
      <div className="px-4 pb-10 pt-3 flex flex-col gap-2.5 flex-shrink-0 relative z-10"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
        <button
          onClick={() => city && onApply(city)}
          disabled={!city}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
          <Icon name="Plane" size={18} className="text-white" />
          Поехать сюда
        </button>
        <button
          onClick={() => city && onApply(city)}
          disabled={!city}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#FF6B35,#FF2D78)", boxShadow: "0 4px 20px rgba(255,107,53,0.5)" }}>
          <Icon name="Globe" size={18} className="text-white" />
          Исследовать локацию
        </button>
      </div>
    </div>
  );
}