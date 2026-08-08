import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Toggle } from "@/components/screens/SettingsUIKit";
import { openNativeAppSettings } from "@/hooks/useOneSignal";

/**
 * Локация — включение/выключение определения местоположения.
 * При включении запрашивает системное разрешение телефона и сохраняет координаты,
 * при выключении стирает их с сервера.
 */
export function LocationCard() {
  const [enabled, setEnabled] = useState<boolean>(() => localStorage.getItem("geo_enabled") !== "0");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "denied" | "ok" | "unavailable">("idle");

  useEffect(() => {
    if (!navigator.geolocation) { setStatus("unavailable"); return; }
    navigator.permissions?.query?.({ name: "geolocation" as PermissionName })
      .then(s => {
        if (s.state === "denied") setStatus("denied");
        else if (s.state === "granted") setStatus("ok");
      })
      .catch(() => {});
  }, []);

  const handleToggle = async () => {
    if (loading) return;

    // Выключаем — стираем координаты, расстояние больше не показывается
    if (enabled) {
      setEnabled(false);
      localStorage.setItem("geo_enabled", "0");
      localStorage.removeItem("geo_sync_at");
      setStatus("idle");
      const { profilesApi } = await import("@/lib/api");
      profilesApi.clearGeo().catch(() => {});
      return;
    }

    // Включаем — просим системное разрешение и сразу сохраняем позицию
    if (!navigator.geolocation) { setStatus("unavailable"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { profilesApi } = await import("@/lib/api");
        profilesApi.updateGeo(pos.coords.latitude, pos.coords.longitude, "", "").catch(() => {});
        localStorage.setItem("geo_enabled", "1");
        localStorage.setItem("geo_sync_at", String(Date.now()));
        setEnabled(true);
        setStatus("ok");
        setLoading(false);
      },
      () => {
        setStatus("denied");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const sub = loading
    ? "Определяем местоположение..."
    : status === "unavailable"
    ? "Устройство не поддерживает геолокацию"
    : status === "denied"
    ? "Доступ запрещён — включи в настройках телефона"
    : enabled
    ? "Расстояние до людей рядом показывается"
    : "Выключено — расстояние не определяется";

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: enabled ? "rgba(74,222,128,0.09)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${enabled ? "rgba(74,222,128,0.28)" : "rgba(255,255,255,0.08)"}`,
        transition: "all 0.3s",
      }}>
      <div className="px-4 py-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: enabled ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.08)" }}>
          <Icon name={enabled ? "MapPin" : "MapPinOff"} size={17}
            style={{ color: enabled ? "#4ADE80" : "rgba(255,255,255,0.45)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Локация</p>
          <p className="text-white/45 text-xs mt-0.5">{sub}</p>
        </div>
        {loading ? (
          <Icon name="Loader2" size={18} className="animate-spin text-white/50 flex-shrink-0" />
        ) : status === "denied" ? (
          <button onClick={() => openNativeAppSettings()}
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
            style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}>
            Настройки
          </button>
        ) : (
          <Toggle value={enabled} onChange={handleToggle} />
        )}
      </div>
    </div>
  );
}

export default LocationCard;
