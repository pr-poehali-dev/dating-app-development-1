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
  onPremium?: () => void;
  isPremium?: boolean;
}

export function PeopleFilterSheet({ filters, onApply, onClose, onAdvancedFilter, onExploreWorld, onTravelMode, onPremium, isPremium }: Props) {
  const [ageMin, setAgeMin] = useState(filters.age_min ?? 18);
  const [ageMax, setAgeMax] = useState(filters.age_max ?? 60);
  const [lookingFor, setLookingFor] = useState(filters.looking_for ?? "all");
  const [onlineOnly, setOnlineOnly] = useState(filters.online_only ?? false);
  const [city, setCity] = useState(filters.city ?? "");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [cityOpen, setCityOpen] = useState(false);

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
    { val: "female", label: "Девушки", icon: "Venus",  grad: "linear-gradient(135deg,#FF6B9D,#FF2D78)", glow: "rgba(255,45,120,0.5)" },
    { val: "male",   label: "Парни",   icon: "Mars",   grad: "linear-gradient(135deg,#4F8EF7,#7B5CF5)", glow: "rgba(79,142,247,0.5)" },
    { val: "all",    label: "Все",     icon: "Sparkles", grad: "linear-gradient(135deg,#F59E0B,#EF4444)", glow: "rgba(245,158,11,0.5)" },
  ] as const;

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

          {/* Город */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,45,120,0.2)", boxShadow: "0 4px 20px rgba(255,45,120,0.08)" }}>
            {/* Баннер-кнопка */}
            <button onClick={() => setCityOpen(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.99] relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.15) 0%, rgba(155,89,182,0.12) 100%)" }}>
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,45,120,0.2), transparent 70%)" }} />
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 8px rgba(255,45,120,0.4)" }}>
                <Icon name="MapPin" size={15} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-sm leading-tight">Город</p>
                <p className="text-white/45 text-[11px] leading-tight">{city || "Где ищем пару"}</p>
              </div>
              <Icon name={cityOpen ? "ChevronUp" : "ChevronDown"} size={15} className="text-white/40 flex-shrink-0" />
            </button>

            {/* Раскрывающееся поле */}
            {cityOpen && (
              <div className="px-3 pb-3 pt-2 flex flex-col gap-2"
                style={{ background: "rgba(0,0,0,0.15)" }}>
                <div className="flex gap-2">
                  <input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Например: Москва"
                    autoFocus
                    className="flex-1 text-white placeholder-white/25 rounded-xl px-3.5 py-2 text-sm outline-none border font-golos transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(255,45,120,0.6)")}
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.35)" }}>
                    {geoLoading
                      ? <Icon name="Loader2" size={15} className="text-white animate-spin" />
                      : <Icon name="Navigation" size={15} className="text-white" />}
                  </button>
                </div>
                {geoError && (
                  <p className="text-red-400 text-[11px]">
                    {geoError === "Доступ запрещён"
                      ? "Разреши доступ в настройках браузера"
                      : geoError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Кого ищешь */}
          <div className="flex flex-col gap-2">
            <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold px-1 flex items-center gap-1.5">
              <Icon name="Users" size={11} className="text-pink-500" />
              Кого ищешь
            </p>
            <div className="flex gap-2">
              {genders.map(g => {
                const active = lookingFor === g.val;
                return (
                  <button key={g.val} onClick={() => setLookingFor(g.val)}
                    className="flex-1 flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all active:scale-95"
                    style={active
                      ? { background: "rgba(255,255,255,0.07)", border: `1.5px solid ${g.glow.replace("0.5","0.6")}`, boxShadow: `0 6px 20px ${g.glow}` }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                      style={{
                        background: active ? g.grad : "rgba(255,255,255,0.08)",
                        boxShadow: active ? `0 4px 14px ${g.glow}` : "none",
                      }}>
                      <Icon name={g.icon} size={18} className="text-white" />
                    </div>
                    <span className="text-[11px] font-semibold"
                      style={{ color: active ? "white" : "rgba(255,255,255,0.4)" }}>{g.label}</span>
                  </button>
                );
              })}
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

          {/* Дополнительные секции */}
          <div className="flex flex-col gap-1.5">
            <p className="text-white/30 text-[11px] uppercase tracking-wider font-semibold px-1 mb-0.5">Ещё возможности</p>

            {/* Фильтры включены */}
            <button onClick={() => { onClose(); setTimeout(() => onAdvancedFilter?.(), 50); }}
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

            {/* Исследуй мир */}
            <button onClick={() => { onClose(); setTimeout(() => onExploreWorld?.(), 50); }}
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

            {/* Режим путешествия — только Premium */}
            <button
              onClick={() => {
                if (!isPremium) { onClose(); setTimeout(() => onPremium?.(), 50); return; }
                onClose(); setTimeout(() => onTravelMode?.(), 50);
              }}
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-all"
              style={{
                background: isPremium
                  ? "rgba(255,255,255,0.04)"
                  : "linear-gradient(135deg,rgba(255,45,120,0.07),rgba(155,89,182,0.07))",
                border: isPremium
                  ? "1px solid rgba(255,255,255,0.07)"
                  : "1px solid rgba(255,45,120,0.2)",
              }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isPremium ? "rgba(255,107,53,0.15)" : "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: isPremium ? "none" : "0 2px 8px rgba(255,45,120,0.3)" }}>
                  <Icon name="Plane" size={16} className="text-white" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">Режим путешествия</span>
                    {!isPremium && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none"
                        style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <span className="text-white/35 text-[11px]">
                    {isPremium ? "Смени свою локацию" : "Доступно с подпиской"}
                  </span>
                </div>
              </div>
              {isPremium
                ? <Icon name="ChevronRight" size={16} className="text-white/25" />
                : <Icon name="Crown" size={16} className="text-pink-400" />}
            </button>
          </div>

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