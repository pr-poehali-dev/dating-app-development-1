import { useState, useEffect } from "react";

const GEO_CHECK_URL = "https://functions.poehali.dev/771855ea-7331-4dd4-a471-60d27d607738";
const CACHE_KEY = "geo_gate_v1";

type GeoStatus = "checking" | "allowed" | "blocked";

/**
 * Проверяет по IP, разрешён ли доступ к приложению.
 * Блокирует Украину и страны НАТО. Fail-open: при ошибке доступ разрешается.
 */
export function useGeoGate(): GeoStatus {
  const [status, setStatus] = useState<GeoStatus>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached === "blocked") return "blocked";
      if (cached === "allowed") return "allowed";
    } catch { /* ignore */ }
    return "checking";
  });

  useEffect(() => {
    if (status !== "checking") return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(GEO_CHECK_URL, { method: "GET" });
        const data = (await res.json()) as { blocked?: boolean };
        if (cancelled) return;
        const blocked = data.blocked === true;
        const next: GeoStatus = blocked ? "blocked" : "allowed";
        try { sessionStorage.setItem(CACHE_KEY, next); } catch { /* ignore */ }
        setStatus(next);
      } catch {
        // Fail-open: не блокируем при сетевой ошибке
        if (!cancelled) setStatus("allowed");
      }
    };

    check();
    return () => { cancelled = true; };
  }, [status]);

  return status;
}
