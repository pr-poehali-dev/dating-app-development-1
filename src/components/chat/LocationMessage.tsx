import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  lat: string;
  lon: string;
}

const tileFor = (lat: string, lon: string, zoom = 14, w = 320, h = 180) =>
  `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${w}x${h}&maptype=mapnik&markers=${lat},${lon},red-dot`;

export default function LocationMessage({ lat, lon }: Props) {
  const [address, setAddress] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru&zoom=14`)
      .then((r) => r.json())
      .then((d) => {
        if (cancel) return;
        const a = d?.address || {};
        const parts = [a.road, a.house_number, a.city || a.town || a.village, a.country]
          .filter(Boolean);
        setAddress(parts.join(", ") || d?.display_name || "");
      })
      .catch(() => {});
    return () => { cancel = true; };
  }, [lat, lon]);

  const gmaps = `https://www.google.com/maps?q=${lat},${lon}`;
  const ymaps = `https://yandex.ru/maps/?pt=${lon},${lat}&z=15&l=map`;
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;

  return (
    <>
      <div className="flex flex-col gap-2" style={{ width: 240 }}>
        <button
          onClick={() => setOpen(true)}
          className="relative rounded-2xl overflow-hidden block group"
          style={{
            padding: 2,
            background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
          }}>
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ width: "100%", height: 140, background: "rgba(20,10,40,0.7)" }}>
            {!imgError ? (
              <img
                src={tileFor(lat, lon)}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#1a0030,#2d0050)" }}>
                <Icon name="MapPin" size={28} className="text-pink-400" />
                <span className="text-white/60 text-[11px]">Карта недоступна</span>
              </div>
            )}

            {/* Затемнение снизу для читаемости */}
            <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />

            {/* Пульсирующий пин по центру */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: "rgba(255,45,120,0.4)", width: 28, height: 28, left: -14, top: -14 }} />
                <div className="relative w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                    border: "2px solid white",
                    boxShadow: "0 4px 14px rgba(255,45,120,0.6)",
                    transform: "translate(-50%, -50%)",
                  }}>
                  <Icon name="MapPin" size={14} className="text-white" />
                </div>
              </div>
            </div>

            {/* Бейдж "Локация" */}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-white text-[10px] font-semibold">Локация</span>
            </div>

            {/* Кнопка-приглашение тапнуть */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
              <Icon name="Maximize2" size={11} className="text-white/80" />
              <span className="text-white text-[10px] font-medium">Увеличить</span>
            </div>
          </div>
        </button>

        {/* Адрес */}
        <div className="flex items-start gap-1.5 px-1">
          <Icon name="MapPin" size={11} className="text-pink-400 mt-0.5 flex-shrink-0" />
          <span className="text-white/75 text-[11px] leading-snug line-clamp-2">
            {address || `${lat.slice(0, 7)}, ${lon.slice(0, 7)}`}
          </span>
        </div>

        {/* Кнопки навигации */}
        <div className="flex gap-1.5">
          <a href={gmaps} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold text-white active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Icon name="Navigation" size={10} className="text-white/80" />
            Google
          </a>
          <a href={ymaps} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold text-white active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Icon name="Navigation" size={10} className="text-white/80" />
            Yandex
          </a>
          <a href={osm} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold text-white active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Icon name="ExternalLink" size={10} className="text-white/80" />
            OSM
          </a>
        </div>
      </div>

      {open && <LocationLightbox lat={lat} lon={lon} address={address} onClose={() => setOpen(false)} />}
    </>
  );
}

function LocationLightbox({ lat, lon, address, onClose }: { lat: string; lon: string; address: string; onClose: () => void }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (canceled || !mapEl.current) return;

      const map = L.map(mapEl.current, { zoomControl: false, attributionControl: false })
        .setView([parseFloat(lat), parseFloat(lon)], 15);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#FF2D78,#9B59B6);
          border:3px solid white;
          box-shadow:0 6px 20px rgba(255,45,120,0.7);
          display:flex;align-items:center;justify-content:center;
          transform:translate(-50%,-100%);
        "><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/><circle cx='12' cy='10' r='3'/></svg></div>`,
        iconSize: [0, 0],
      });
      L.marker([parseFloat(lat), parseFloat(lon)], { icon }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
    })();

    return () => {
      canceled = true;
      if (mapRef.current) {
        try { (mapRef.current as { remove: () => void }).remove(); } catch { /* ignore */ }
        mapRef.current = null;
      }
    };
  }, [lat, lon]);

  const gmaps = `https://www.google.com/maps?q=${lat},${lon}`;
  const ymaps = `https://yandex.ru/maps/?pt=${lon},${lat}&z=15&l=map`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}>
      {/* Заголовок */}
      <div className="flex items-center gap-3 px-4 py-3 relative z-10"
        style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <Icon name="X" size={18} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Локация</p>
          <p className="text-white/50 text-xs truncate">{address || `${lat}, ${lon}`}</p>
        </div>
      </div>

      {/* Карта */}
      <div ref={mapEl} className="flex-1" style={{ background: "#1a0030" }} />

      {/* Нижняя панель с кнопками маршрута */}
      <div className="px-4 pt-3 pb-6 flex gap-2"
        style={{ background: "rgba(0,0,0,0.7)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <a href={gmaps} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          <Icon name="Navigation" size={16} className="text-white" />
          Google Maps
        </a>
        <a href={ymaps} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <Icon name="Navigation" size={16} className="text-white/90" />
          Yandex
        </a>
      </div>
    </div>
  );
}
