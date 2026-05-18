import { useState } from "react";
import { profilesApi, type User } from "@/lib/api";

const ALL_INTERESTS = ["Путешествия", "Спорт", "Кино", "Музыка", "Кулинария", "Фотография", "Йога", "Искусство", "Книги", "Танцы", "Природа", "IT", "Кофе", "Игры", "Животные", "Фитнес"];

// ─── EditProfileModal ─────────────────────────────────────────────────────────
export function EditProfileModal({ user, onSave, onClose }: {
  user: User;
  onSave: (updated: Partial<User>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [age, setAge] = useState(String(user.age || ""));
  const [city, setCity] = useState(user.city || "");
  const [bio, setBio] = useState(user.bio || "");
  const [gender, setGender] = useState(user.gender || "other");
  const [tags, setTags] = useState<string[]>(user.tags || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (t: string) =>
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Введи имя"); return; }
    setError("");
    setSaving(true);
    const payload: Partial<User> = {
      name: name.trim(),
      username: user.premium ? username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || undefined : undefined,
      age: age ? Number(age) : undefined,
      city: city.trim(),
      bio: bio.trim(),
      gender,
      tags,
    };
    try {
      await profilesApi.updateMe(payload);
      onSave(payload);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm flex flex-col animate-slide-up"
        style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0", maxHeight: "92dvh" }}>

        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-sm">Отмена</button>
          <h3 className="text-white font-golos font-bold text-base">Редактировать профиль</h3>
          <button onClick={handleSave} disabled={saving} className="btn-grad px-4 py-1.5 text-sm">
            {saving ? "..." : "Сохранить"}
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4 pb-8">
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 rounded-2xl py-2 px-4">{error}</div>
          )}

          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Имя</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоё имя" maxLength={50}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/50 text-xs uppercase tracking-widest">Ник</label>
              {!user.premium && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }}>
                  ✨ Premium
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">@</span>
              <input
                value={username}
                onChange={(e) => user.premium && setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                placeholder={user.username || "username"}
                maxLength={30}
                disabled={!user.premium}
                className="w-full pl-8 pr-4 py-3 rounded-2xl text-sm font-mono outline-none border transition-colors"
                style={user.premium
                  ? { background: "rgba(255,255,255,0.1)", color: "white", borderColor: "rgba(255,255,255,0.1)" }
                  : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)", borderColor: "rgba(255,255,255,0.06)", cursor: "not-allowed" }}
              />
            </div>
            {!user.premium && (
              <p className="text-white/25 text-[11px] mt-1.5">Смена ника доступна с Premium-подпиской</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Возраст</label>
              <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="25" type="number" min={18} max={99}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Город</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" maxLength={60}
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">Я</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ value: "female", label: "Девушка" }, { value: "male", label: "Парень" }, { value: "other", label: "Другое" }].map((g) => (
                <button key={g.value} onClick={() => setGender(g.value)}
                  className="py-2.5 rounded-2xl text-sm font-medium transition-all"
                  style={gender === g.value
                    ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">О себе</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажи о себе — это привлечёт больше симпатий!" maxLength={300} rows={4}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos resize-none" />
            <p className="text-white/30 text-xs text-right mt-1">{bio.length}/300</p>
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">
              Интересы <span className="text-white/30 normal-case">(выбрано {tags.length})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map((t) => (
                <button key={t} onClick={() => toggleTag(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={tags.includes(t)
                    ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", color: "white" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}