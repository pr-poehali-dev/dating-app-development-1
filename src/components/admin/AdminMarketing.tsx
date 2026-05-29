import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";

type Banner = { id: number; title: string; subtitle: string; color_from: string; color_to: string; active: boolean; created_at: string };

function SectionSwitch({ options, value, onChange }: {
  options: { id: string; label: string; icon: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={value === o.id
            ? { background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.18))", color: "white", boxShadow: "inset 0 0 0 1px rgba(255,45,120,0.3)" }
            : { color: "rgba(255,255,255,0.35)" }}>
          <Icon name={o.icon as "Bell"} size={12} />{o.label}
        </button>
      ))}
    </div>
  );
}

export function MarketingTab({ token }: { token: string }) {
  const [section, setSection] = useState<"push" | "banners">("push");

  // ── Push ─────────────────────────────────────────────────────────────────────
  const [pushTitle, setPushTitle] = useState("");
  const [pushMsg, setPushMsg] = useState("");
  const [pushSegment, setPushSegment] = useState("all");
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ sent_to: number } | null>(null);

  const handlePush = async () => {
    if (!pushTitle.trim() || !pushMsg.trim()) return;
    setPushing(true); setPushResult(null);
    try {
      const r = await adminApi.pushBroadcast(token, pushTitle.trim(), pushMsg.trim(), pushSegment);
      setPushResult(r); setPushTitle(""); setPushMsg("");
    } catch { void 0; } finally { setPushing(false); }
  };

  // ── Баннеры ──────────────────────────────────────────────────────────────────
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [editBanner, setEditBanner] = useState<Partial<Banner> | null>(null);
  const [saving, setSaving] = useState(false);

  const loadBanners = () => {
    setBannersLoading(true);
    adminApi.banners(token).then(d => setBanners(d.banners)).catch(() => {}).finally(() => setBannersLoading(false));
  };

  const handleSaveBanner = async () => {
    if (!editBanner?.title?.trim()) return;
    setSaving(true);
    try { await adminApi.bannerSave(token, editBanner as Record<string, unknown>); setEditBanner(null); loadBanners(); }
    catch { void 0; } finally { setSaving(false); }
  };

  const handleDeleteBanner = async (id: number) => {
    await adminApi.bannerDelete(token, id).catch(() => {}); loadBanners();
  };

  const handleToggleBanner = async (b: Banner) => {
    await adminApi.bannerSave(token, { ...b, active: !b.active }).catch(() => {}); loadBanners();
  };

  useEffect(() => { if (section === "banners") loadBanners(); }, [section]);

  const segments = [
    { id: "all",      label: "Все",          icon: "Users" },
    { id: "premium",  label: "Premium",      icon: "Crown" },
    { id: "new_week", label: "Новые 7 дней", icon: "Sparkles" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={section} onChange={v => setSection(v as "push" | "banners")}
        options={[
          { id: "push",    label: "Push-рассылка", icon: "Bell" },
          { id: "banners", label: "Баннеры",        icon: "Image" },
        ]}
      />

      {/* ══ PUSH ══ */}
      {section === "push" && (
        <div className="flex flex-col gap-4">
          {/* Сегмент */}
          <div className="flex flex-col gap-2">
            <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest px-1">Аудитория</p>
            <div className="grid grid-cols-3 gap-2">
              {segments.map(s => (
                <button key={s.id} onClick={() => setPushSegment(s.id)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-all"
                  style={pushSegment === s.id
                    ? { background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.18))", color: "white", border: "1px solid rgba(255,45,120,0.3)" }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Icon name={s.icon as "Bell"} size={16} style={{ color: pushSegment === s.id ? "#FF2D78" : undefined }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Форма */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Содержание</p>

            <input value={pushTitle} onChange={e => setPushTitle(e.target.value)}
              placeholder="Заголовок уведомления" maxLength={60}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />

            <div>
              <textarea value={pushMsg} onChange={e => setPushMsg(e.target.value)}
                placeholder="Текст сообщения..." rows={3} maxLength={200}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
              <div className="flex justify-end mt-1">
                <span className="text-white/20 text-xs">{pushMsg.length}/200</span>
              </div>
            </div>

            {/* Превью */}
            {(pushTitle || pushMsg) && (
              <div className="rounded-2xl p-3 flex items-start gap-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  <Icon name="Heart" size={17} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{pushTitle || "Заголовок"}</p>
                  <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{pushMsg || "Текст сообщения"}</p>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30 mt-1.5 flex-shrink-0" />
              </div>
            )}

            <button onClick={handlePush} disabled={pushing || !pushTitle.trim() || !pushMsg.trim()}
              className="py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              {pushing
                ? <><Icon name="Loader2" size={15} className="animate-spin" />Отправляю...</>
                : <><Icon name="Send" size={15} />Отправить рассылку</>}
            </button>
          </div>

          {pushResult && (
            <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(74,222,128,0.15)" }}>
                <Icon name="CheckCircle" size={16} style={{ color: "#4ADE80" }} />
              </div>
              <div>
                <p className="text-green-300 font-bold text-sm">Рассылка отправлена</p>
                <p className="text-green-400/60 text-xs">{pushResult.sent_to} пользователей получили уведомление</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ БАННЕРЫ ══ */}
      {section === "banners" && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setEditBanner({ title: "", subtitle: "", color_from: "#FF2D78", color_to: "#9B59B6", active: true })}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            <Icon name="Plus" size={16} />Создать баннер
          </button>

          {/* Форма редактирования */}
          {editBanner && (
            <div className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,45,120,0.2)" }}>
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-sm">{editBanner.id ? "Редактировать баннер" : "Новый баннер"}</p>
                <button onClick={() => setEditBanner(null)} className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <Icon name="X" size={13} className="text-white/50" />
                </button>
              </div>

              {/* Превью баннера */}
              {(editBanner.title || editBanner.subtitle) && (
                <div className="rounded-2xl px-4 py-3"
                  style={{ background: `linear-gradient(135deg,${editBanner.color_from || "#FF2D78"},${editBanner.color_to || "#9B59B6"})` }}>
                  <p className="text-white font-bold text-sm">{editBanner.title || "Заголовок"}</p>
                  {editBanner.subtitle && <p className="text-white/75 text-xs mt-0.5">{editBanner.subtitle}</p>}
                </div>
              )}

              {[
                { key: "title",    ph: "Заголовок баннера" },
                { key: "subtitle", ph: "Подзаголовок (необязательно)" },
              ].map(f => (
                <input key={f.key}
                  value={(editBanner as Record<string, string>)[f.key] || ""}
                  onChange={e => setEditBanner(b => ({ ...b, [f.key]: e.target.value }))}
                  placeholder={f.ph}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
              ))}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "color_from", label: "Цвет от" },
                  { key: "color_to",   label: "Цвет до" },
                ].map(f => (
                  <div key={f.key} className="flex flex-col gap-1">
                    <label className="text-white/30 text-[10px]">{f.label}</label>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                      <input type="color"
                        value={(editBanner as Record<string, string>)[f.key] || "#FF2D78"}
                        onChange={e => setEditBanner(b => ({ ...b, [f.key]: e.target.value }))}
                        className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent" />
                      <span className="text-white/50 text-xs font-mono">
                        {(editBanner as Record<string, string>)[f.key] || "#FF2D78"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditBanner(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/40"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  Отмена
                </button>
                <button onClick={handleSaveBanner} disabled={saving || !editBanner.title?.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : "Сохранить"}
                </button>
              </div>
            </div>
          )}

          {/* Список баннеров */}
          {bannersLoading ? <Spinner /> : (
            <div className="flex flex-col gap-3">
              {banners.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <Icon name="Image" size={22} className="text-white/15" />
                  </div>
                  <p className="text-white/25 text-sm">Баннеров нет</p>
                </div>
              ) : banners.map(b => (
                <div key={b.id} className="rounded-2xl overflow-hidden"
                  style={{ opacity: b.active ? 1 : 0.5, border: "1px solid rgba(255,255,255,0.07)" }}>
                  {/* Превью */}
                  <div className="px-4 py-3"
                    style={{ background: `linear-gradient(135deg,${b.color_from},${b.color_to})` }}>
                    <p className="text-white font-bold text-sm">{b.title}</p>
                    {b.subtitle && <p className="text-white/75 text-xs mt-0.5">{b.subtitle}</p>}
                  </div>
                  {/* Действия */}
                  <div className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-white/20 text-[10px] flex-1">
                      {new Date(b.created_at).toLocaleDateString("ru")}
                    </span>
                    <button onClick={() => handleToggleBanner(b)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                      style={b.active
                        ? { background: "rgba(74,222,128,0.12)", color: "#4ADE80" }
                        : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                      {b.active ? "Активен" : "Скрыт"}
                    </button>
                    <button onClick={() => setEditBanner(b)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                      style={{ background: "rgba(255,255,255,0.07)" }}>
                      <Icon name="Pencil" size={12} className="text-white/40" />
                    </button>
                    <button onClick={() => handleDeleteBanner(b.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                      style={{ background: "rgba(239,68,68,0.1)" }}>
                      <Icon name="Trash2" size={12} style={{ color: "#F87171" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MarketingTab;
