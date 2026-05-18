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
  const stats: { key: StatKey; label: string; value: string; icon: string }[] = [
    { key: "height", label: "Рост",   value: currentUser.height ? `${currentUser.height} см` : "—", icon: "Ruler" },
    { key: "weight", label: "Вес",    value: currentUser.weight ? `${currentUser.weight} кг` : "—", icon: "Weight" },
    { key: "gender", label: "Пол",    value: currentUser.gender === "female" ? "Жен" : currentUser.gender === "male" ? "Муж" : "—", icon: "User" },
    { key: "status", label: "Статус", value: statusLabel(currentUser.relationship_status), icon: "Heart" },
    { key: "city",   label: "Город",  value: currentUser.city || "—", icon: "MapPin" },
  ];

  return (
    <>
      <div className="glass-card w-full mt-4 flex items-center flex-wrap">
        {stats.map(({ key, label, value, icon }, i, arr) => (
          <button key={label} onClick={() => onOpen(key)}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 relative active:bg-white/5 transition-colors rounded-2xl"
            style={{ minWidth: "20%" }}>
            {i < arr.length - 1 && (
              <div className="absolute right-0 top-2 bottom-2 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            )}
            <Icon name={icon as "Ruler"|"Weight"|"User"|"Heart"|"MapPin"} size={13} className="text-white/40" />
            <span className="text-white font-bold text-xs leading-tight text-center truncate w-full px-1">{value}</span>
            <span className="text-white/40 text-[9px]">{label}</span>
          </button>
        ))}
      </div>

      {/* Попап редактирования */}
      {statEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={onClose}>
          <div className="w-full max-w-sm rounded-t-3xl p-5 pb-8 flex flex-col gap-4"
            style={{ background: "var(--spark-dark2,#1a1030)" }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between">
              <h4 className="text-white font-bold text-base">
                {statEdit === "height" && "Рост"}
                {statEdit === "weight" && "Вес"}
                {statEdit === "gender" && "Пол"}
                {statEdit === "status" && "Статус"}
                {statEdit === "city"   && "Город"}
              </h4>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <Icon name="X" size={20} />
              </button>
            </div>

            {(statEdit === "height" || statEdit === "weight") && (
              <input type="number" value={statValue} onChange={e => onValueChange(e.target.value)}
                placeholder={statEdit === "height" ? "Рост в см (напр. 175)" : "Вес в кг (напр. 70)"}
                min={statEdit === "height" ? 100 : 30}
                max={statEdit === "height" ? 250 : 300}
                className="w-full rounded-2xl px-4 py-3 text-white text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors"
                style={{ background: "rgba(255,255,255,0.08)" }}
                autoFocus
              />
            )}

            {statEdit === "gender" && (
              <div className="grid grid-cols-2 gap-2">
                {[{ v: "male", l: "Мужской" }, { v: "female", l: "Женский" }].map(({ v, l }) => (
                  <button key={v} onClick={() => onValueChange(v)}
                    className="py-3 rounded-2xl text-sm font-semibold transition-all"
                    style={statValue === v
                      ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                      : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            {statEdit === "status" && (
              <div className="flex flex-col gap-2">
                {[
                  { v: "hidden",      l: "Не показывать" },
                  { v: "single",      l: "Свободен" },
                  { v: "searching",   l: "В поиске" },
                  { v: "complicated", l: "Всё сложно" },
                  { v: "open",        l: "В свободных отношениях" },
                ].map(({ v, l }) => (
                  <button key={v} onClick={() => onValueChange(v)}
                    className="py-3 px-4 rounded-2xl text-sm font-semibold text-left transition-all"
                    style={statValue === v
                      ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                      : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            {statEdit === "city" && (
              <input type="text" value={statValue} onChange={e => onValueChange(e.target.value)}
                placeholder="Например: Москва" maxLength={60}
                className="w-full rounded-2xl px-4 py-3 text-white text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors"
                style={{ background: "rgba(255,255,255,0.08)" }}
                autoFocus
              />
            )}

            <button onClick={onSave} className="btn-grad py-3 rounded-2xl font-semibold text-sm">
              Сохранить
            </button>
          </div>
        </div>
      )}
    </>
  );
}
