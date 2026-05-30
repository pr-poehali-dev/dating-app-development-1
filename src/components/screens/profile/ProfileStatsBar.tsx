import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

type StatKey = "height" | "weight" | "gender" | "status" | "city";

function statusLabel(s: string | undefined): string {
  if (!s) return "—";
  if (s === "single")      return "Своб.";
  if (s === "taken")       return "Занят";
  if (s === "complicated") return "Слож.";
  if (s === "open")        return "Откр.";
  if (s === "hidden")      return "Скрыт";
  if (s === "searching")   return "Поиск";
  return "—";
}

export function ProfileStatsBar({
  currentUser,
  statEdit,
  statValue,
  onOpen,
  onClose,
  onValueChange,
  onSave,
}: {
  currentUser: User;
  statEdit: StatKey | null;
  statValue: string;
  onOpen: (key: StatKey) => void;
  onClose: () => void;
  onValueChange: (v: string) => void;
  onSave: () => void;
}) {
  const stats: { key: StatKey; label: string; value: string; icon: string; color: string }[] = [
    { key: "height", label: "Рост",   value: currentUser.height ? `${currentUser.height} см` : "—", icon: "Ruler",  color: "#3B82F6" },
    { key: "weight", label: "Вес",    value: currentUser.weight ? `${currentUser.weight} кг` : "—", icon: "Scale",  color: "#10B981" },
    { key: "gender", label: "Пол",    value: currentUser.gender === "female" ? "Жен" : currentUser.gender === "male" ? "Муж" : "—", icon: "User", color: "#9B59B6" },
    { key: "status", label: "Статус", value: statusLabel(currentUser.relationship_status), icon: "Heart", color: "#FF2D78" },
    { key: "city",   label: "Город",  value: currentUser.city || "—", icon: "MapPin", color: "#F59E0B" },
  ];

  return (
    <>
      <div className="w-full mt-3 rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-stretch">
          {stats.map(({ key, label, value, icon, color }, i, arr) => (
            <button key={label} onClick={() => onOpen(key)}
              className="flex-1 flex flex-col items-center py-3.5 gap-1 relative active:bg-white/5 transition-colors"
              style={{ minWidth: "20%" }}>
              {i < arr.length - 1 && (
                <div className="absolute right-0 top-3 bottom-3 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              )}
              <Icon name={icon as "Ruler"|"Scale"|"User"|"Heart"|"MapPin"} size={14}
                className={value !== "—" ? undefined : "text-white/25"}
                style={value !== "—" ? { color } : undefined} />
              <span className={`font-bold text-xs leading-tight text-center truncate w-full px-1 ${value !== "—" ? "text-white" : "text-white/30"}`}>
                {value}
              </span>
              <span className="text-white/35 text-[9px]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Попап редактирования */}
      {statEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={onClose}>
          <div className="w-full max-w-sm flex flex-col gap-4"
            style={{
              background: "linear-gradient(180deg, #1e1830 0%, #17112a 100%)",
              borderRadius: "32px 32px 0 0",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
              padding: "20px 20px 36px",
            }}
            onClick={e => e.stopPropagation()}>

            {/* Хэндл */}
            <div className="flex justify-center -mt-1 mb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-white font-bold text-lg">
                {statEdit === "height" && "Рост"}
                {statEdit === "weight" && "Вес"}
                {statEdit === "gender" && "Пол"}
                {statEdit === "status" && "Семейный статус"}
                {statEdit === "city"   && "Город"}
              </h4>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <Icon name="X" size={16} className="text-white/60" />
              </button>
            </div>

            {(statEdit === "height" || statEdit === "weight") && (
              <input type="number" value={statValue} onChange={e => onValueChange(e.target.value)}
                placeholder={statEdit === "height" ? "Рост в см (напр. 175)" : "Вес в кг (напр. 70)"}
                min={statEdit === "height" ? 100 : 30}
                max={statEdit === "height" ? 250 : 300}
                className="w-full rounded-2xl px-4 py-3.5 text-white text-sm outline-none border transition-colors font-golos"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                autoFocus
              />
            )}

            {statEdit === "gender" && (
              <div className="grid grid-cols-2 gap-2">
                {[{ v: "male", l: "Мужской" }, { v: "female", l: "Женский" }].map(({ v, l }) => (
                  <button key={v} onClick={() => onValueChange(v)}
                    className={`py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${statValue === v ? "text-white" : "text-white/60"}`}
                    style={statValue === v
                      ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 16px rgba(255,45,120,0.35)" }
                      : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            {statEdit === "status" && (
              <div className="flex flex-col gap-2">
                {[
                  { v: "hidden",      l: "Не показывать", emoji: "🙈" },
                  { v: "single",      l: "Свободен",       emoji: "💚" },
                  { v: "searching",   l: "В поиске",       emoji: "🔍" },
                  { v: "complicated", l: "Всё сложно",     emoji: "🌀" },
                  { v: "open",        l: "В свободных отношениях", emoji: "💛" },
                ].map(({ v, l, emoji }) => (
                  <button key={v} onClick={() => onValueChange(v)}
                    className={`py-3 px-4 rounded-2xl text-sm font-semibold text-left transition-all active:scale-[0.98] flex items-center gap-3 ${statValue === v ? "text-white" : "text-white/65"}`}
                    style={statValue === v
                      ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 16px rgba(255,45,120,0.3)" }
                      : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span>{emoji}</span><span>{l}</span>
                  </button>
                ))}
              </div>
            )}

            {statEdit === "city" && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Icon name="MapPin" size={16} />
                </span>
                <input type="text" value={statValue} onChange={e => onValueChange(e.target.value)}
                  placeholder="Например: Москва" maxLength={60}
                  className="w-full rounded-2xl pl-10 pr-4 py-3.5 text-white text-sm outline-none border transition-colors font-golos"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                  autoFocus
                />
              </div>
            )}

            <button onClick={onSave}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)" }}>
              Сохранить
            </button>
          </div>
        </div>
      )}
    </>
  );
}