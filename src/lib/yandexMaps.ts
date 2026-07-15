import { configApi } from "@/lib/api";

declare global {
  interface Window {
    ymaps?: YMaps;
  }
}

// Минимальный набор типов Яндекс.Карт JS API, которого хватает проекту.
export interface YMapsGeoObjectAddress {
  getAddressLine: () => string;
  getCountry: () => string;
  getLocalities: () => string[];
  getAdministrativeAreas: () => string[];
}
export interface YMapsGeoObject {
  properties: { get: (key: string) => unknown };
  geometry: { getCoordinates: () => [number, number] };
}
export interface YMapsGeocodeResult {
  geoObjects: {
    get: (i: number) => YMapsGeoObject | undefined;
    getLength: () => number;
  };
}
export interface YMapsPlacemark {
  events: { add: (event: string, cb: () => void) => void };
  geometry: { setCoordinates: (c: [number, number]) => void; getCoordinates: () => [number, number] };
}
export interface YMapsMap {
  setCenter: (c: [number, number], zoom?: number) => void;
  geoObjects: { add: (obj: unknown) => void; removeAll: () => void };
  events: { add: (event: string, cb: (e: { get: (k: string) => unknown }) => void) => void };
  destroy: () => void;
  behaviors: { disable: (b: string) => void };
  controls: { remove: (c: string) => void };
}
export interface YMaps {
  ready: (cb: () => void) => void;
  Map: new (el: HTMLElement, opts: { center: [number, number]; zoom: number; controls?: string[] }) => YMapsMap;
  Placemark: new (
    coords: [number, number],
    props?: Record<string, unknown>,
    opts?: Record<string, unknown>
  ) => YMapsPlacemark;
  Circle: new (
    geometry: [[number, number], number],
    props?: Record<string, unknown>,
    opts?: Record<string, unknown>
  ) => { geometry: { setCoordinates: (c: [number, number]) => void; setRadius: (r: number) => void } };
  geocode: (request: string | [number, number], opts?: Record<string, unknown>) => Promise<YMapsGeocodeResult>;
}

let loadPromise: Promise<YMaps> | null = null;

/** Загружает Яндекс.Карты JS API один раз и переиспользует между компонентами. */
export function loadYandexMaps(): Promise<YMaps> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (window.ymaps) {
      return new Promise<YMaps>((resolve) => window.ymaps!.ready(() => resolve(window.ymaps!)));
    }

    const { api_key } = await configApi.yandexMapsKey();

    return new Promise<YMaps>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${api_key ? `&apikey=${api_key}` : ""}`;
      script.async = true;
      script.onload = () => {
        if (!window.ymaps) { reject(new Error("Яндекс.Карты не загрузились")); return; }
        window.ymaps.ready(() => resolve(window.ymaps!));
      };
      script.onerror = () => reject(new Error("Не удалось загрузить Яндекс.Карты"));
      document.head.appendChild(script);
    });
  })();

  return loadPromise;
}

export interface GeocodeAddress {
  displayName: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

/** Обратное геокодирование: координаты → адрес (замена Nominatim reverse). */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeAddress | null> {
  const ymaps = await loadYandexMaps();
  const res = await ymaps.geocode([lat, lon], { results: 1 });
  const obj = res.geoObjects.get(0);
  if (!obj) return null;
  const address = obj.properties.get("metaDataProperty") as { GeocoderMetaData?: { text?: string; Address?: { Components?: { kind: string; name: string }[] } } } | undefined;
  const meta = address?.GeocoderMetaData;
  const components = meta?.Address?.Components || [];
  const city = components.find((c) => c.kind === "locality")?.name
    || components.find((c) => c.kind === "province")?.name || "";
  const country = components.find((c) => c.kind === "country")?.name || "";
  return {
    displayName: meta?.text || "",
    city,
    country,
    lat,
    lon,
  };
}

/** Прямое геокодирование: строка адреса/города → список результатов (замена Nominatim search). */
export async function searchGeocode(query: string, limit = 5): Promise<GeocodeAddress[]> {
  const ymaps = await loadYandexMaps();
  const res = await ymaps.geocode(query, { results: limit });
  const out: GeocodeAddress[] = [];
  const len = res.geoObjects.getLength();
  for (let i = 0; i < len; i++) {
    const obj = res.geoObjects.get(i);
    if (!obj) continue;
    const [lat, lon] = obj.geometry.getCoordinates();
    const address = obj.properties.get("metaDataProperty") as { GeocoderMetaData?: { text?: string; Address?: { Components?: { kind: string; name: string }[] } } } | undefined;
    const meta = address?.GeocoderMetaData;
    const components = meta?.Address?.Components || [];
    const city = components.find((c) => c.kind === "locality")?.name
      || components.find((c) => c.kind === "province")?.name || "";
    const country = components.find((c) => c.kind === "country")?.name || "";
    out.push({ displayName: meta?.text || "", city, country, lat, lon });
  }
  return out;
}
