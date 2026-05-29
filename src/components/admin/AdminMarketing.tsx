import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";

type Banner = { id: number; title: string; subtitle: string; color_from: string; color_to: string; active: boolean; created_at: string };

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
    setPushing(true);
    setPushResult(null);
    try {
      const r = await adminApi.pushBroadcast(token, pushTitle.trim(), pushMsg.trim(), pushSegment);
      setPushResult(r);
      setPushTitle(""); setPushMsg("");
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
    try {
      await adminApi.bannerSave(token, editBanner as Record<string, unknown>);
      setEditBanner(null);
      loadBanners();
    } catch { void 0; } finally { setSaving(false); }
  };

  const handleDeleteBanner = async (id: number) => {
    await adminApi.bannerDelete(token, id).catch(() => {});
    loadBanners();
  };

  const handleToggleBanner = async (b: Banner) => {
    await adminApi.bannerSave(token, { ...b, active: !b.active }).catch(() => {});
    loadBanners();
  };

  useEffect(() => {
    if (section === "banners") loadBanners();
  }, [section]);

  const sections = [
    { id: "push"    as const, label: "Push-рассылка", icon: "Bell" },
    { id: "banners" as const, label: "Баннеры",        icon: "Image" },
  ];

  const segments = [
    { id: "all",      label: "Все пользователи" },
    { id: "premium",  label: "Premium" },
    { id: "new_week", label: "Новые (7 дней)" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={section === s.id
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
              : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
            <Icon name={s.icon as "Bell"} size={13} />{s.label}
          </button>
        ))}
      </div>

      {/* ── Push ── */}
      {section === "push" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white font-semibold text-sm">Создать рассылку</p>

            <div className="flex flex-col gap-1.5">
              <p className="text-white/40 text-xs">Сегмент</p>
              <div className="flex gap-2 flex-wrap">
                {segments.map(s => (
                  <button key={s.id} onClick={() => setPushSegment(s.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={pushSegment === s.id
                      ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                      : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <input value={pushTitle} onChange={e => setPushTitle(e.target.value)}
              placeholder="Заголовок уведомления..."
              maxLength={60}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />

            <textarea value={pushMsg} onChange={e => setPushMsg(e.target.value)}
              placeholder="Текст сообщения..."
              rows={3}
              maxLength={200}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />

            <div className="flex justify-end">
              <p className="text-white/25 text-xs">{pushMsg.length}/200</p>
            </div>

            {/* Превью */}
            {(pushTitle || pushMsg) && (
              <div className="rounded-2xl p-3 flex items-start gap-3"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  <Icon name="Heart" size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{pushTitle || "Заголовок"}</p>
                  <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{pushMsg || "Текст сообщения"}</p>
                </div>
              </div>
            )}

            <button onClick={handlePush} disabled={pushing || !pushTitle.trim() || !pushMsg.trim()}
              className="py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              {pushing
                ? <><Icon name="Loader2" size={15} className="animate-spin" />Отправляю...</>
                : <><Icon name="Send" size={15} />Отправить рассылку</>}
            </button>

            {pushResult && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <Icon name="CheckCircle" size={16} style={{ color: "#4ADE80" }} />
                <p className="text-green-400 text-sm font-semibold">Отправлено {pushResult.sent_to} пользователям</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Баннеры ── */}
      {section === "banners" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setEditBanner({ title: "", subtitle: "", color_from: "#FF2D78", color_to: "#9B59B6", active: true })}
            className="py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            <Icon name="Plus" size={15} />Создать баннер
          </button>

          {bannersLoading ? <Spinner /> : (
            <div className="flex flex-col gap-3">
              {banners.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="Image" size={32} className="text-white/15 mx-auto mb-2" />
                  <p className="text-white/30 text-sm">Баннеров нет</p>
                </div>
              ) : banners.map(b => (
                <div key={b.id} className="rounded-2xl overflow-hidden"
                  style={{ opacity: b.active ? 1 : 0.5 }}>
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ background: `linear-gradient(135deg, ${b.color_from}, ${b.color_to})` }}>
                    <div>
                      <p className="text-white font-bold text-sm">{b.title}</p>
                      {b.subtitle && <p className="text-white/75 text-xs mt-0.5">{b.subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleBanner(b)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: "rgba(0,0,0,0.25)", color: "white" }}>
                        {b.active ? "Вкл" : "Выкл"}
                      </button>
                      <button onClick={() => setEditBanner(b)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.25)" }}>
                        <Icon name="Pencil" size={12} className="text-white" />
                      </button>
                      <button onClick={() => handleDeleteBanner(b.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.25)" }}>
                        <Icon name="Trash2" size={12} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Редактор баннера */}
          {editBanner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
              <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
                style={{ background: "#1a1030", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-white font-bold">{editBanner.id ? "Редактировать" : "Новый"} баннер</p>
                  <button onClick={() => setEditBanner(null)} className="text-white/40">
                    <Icon name="X" size={18} />
                  </button>
                </div>

                <input value={editBanner.title || ""} onChange={e => setEditBanner(b => ({ ...b!, title: e.target.value }))}
                  placeholder="Заголовок"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />

                <input value={editBanner.subtitle || ""} onChange={e => setEditBanner(b => ({ ...b!, subtitle: e.target.value }))}
                  placeholder="Подзаголовок (необязательно)"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-white/40 text-xs mb-1">Цвет от</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={editBanner.color_from || "#FF2D78"}
                        onChange={e => setEditBanner(b => ({ ...b!, color_from: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer" />
                      <span className="text-white/50 text-xs font-mono">{editBanner.color_from}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white/40 text-xs mb-1">Цвет до</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={editBanner.color_to || "#9B59B6"}
                        onChange={e => setEditBanner(b => ({ ...b!, color_to: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer" />
                      <span className="text-white/50 text-xs font-mono">{editBanner.color_to}</span>
                    </div>
                  </div>
                </div>

                {/* Превью */}
                <div className="rounded-2xl px-4 py-3"
                  style={{ background: `linear-gradient(135deg, ${editBanner.color_from || "#FF2D78"}, ${editBanner.color_to || "#9B59B6"})` }}>
                  <p className="text-white font-bold text-sm">{editBanner.title || "Заголовок"}</p>
                  {editBanner.subtitle && <p className="text-white/75 text-xs mt-0.5">{editBanner.subtitle}</p>}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setEditBanner(null)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/50"
                    style={{ background: "rgba(255,255,255,0.07)" }}>
                    Отмена
                  </button>
                  <button onClick={handleSaveBanner} disabled={saving || !editBanner.title?.trim()}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                    {saving ? "Сохраняю..." : "Сохранить"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MarketingTab;
