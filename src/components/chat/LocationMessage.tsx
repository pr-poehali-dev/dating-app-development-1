import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { loadYandexMaps, reverseGeocode } from "@/lib/yandexMaps";

interface Props {
  lat: string;
  lon: string;
}

const tileFor = (lat: string, lon: string, zoom = 15, w = 320, h = 180) =>
  `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=${zoom}&size=${w},${h}&l=map&pt=${lon},${lat},pm2rdm`;

export default function LocationMessage({ lat, lon }: Props) {
  const [address, setAddress] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancel = false;
    reverseGeocode(parseFloat(lat), parseFloat(lon))
      .then((res) => {
        if (cancel || !res) return;
        setAddress(res.displayName || [res.city, res.country].filter(Boolean).join(", "));
      })
      .catch(() => {});
    return () => { cancel = true; };
  }, [lat, lon]);

  const ymaps = `https://yandex.ru/maps/?pt=${lon},${lat}&z=15&l=map`;

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

        {/* Кнопка навигации */}
        <a href={ymaps} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-white active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <Icon name="Navigation" size={11} className="text-white/80" />
          Открыть в Яндекс.Картах
        </a>
      </div>

      {open && <LocationLightbox lat={lat} lon={lon} address={address} onClose={() => setOpen(false)} />}
    </>
  );
}

function LocationLightbox({ lat, lon, address, onClose }: { lat: string; lon: string; address: string; onClose: () => void }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const ymaps = await loadYandexMaps();
      if (canceled || !mapEl.current) return;

      const latN = parseFloat(lat);
      const lonN = parseFloat(lon);

      const map = new ymaps.Map(mapEl.current, {
        center: [latN, lonN],
        zoom: 15,
        controls: ["zoomControl"],
      });

      const placemark = new ymaps.Placemark(
        [latN, lonN],
        {},
        { preset: "islands#pinkDotIcon" }
      );
      map.geoObjects.add(placemark);

      mapRef.current = map;
    })();

    return () => {
      canceled = true;
      if (mapRef.current) {
        try { mapRef.current.destroy(); } catch { /* ignore */ }
        mapRef.current = null;
      }
    };
  }, [lat, lon]);

  const ymapsUrl = `https://yandex.ru/maps/?pt=${lon},${lat}&z=15&l=map`;

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

      {/* Нижняя панель с кнопкой маршрута */}
      <div className="px-4 pt-3 pb-6 flex gap-2"
        style={{ background: "rgba(0,0,0,0.7)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <a href={ymapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          <Icon name="Navigation" size={16} className="text-white" />
          Открыть в Яндекс.Картах
        </a>
      </div>
    </div>
  );
}