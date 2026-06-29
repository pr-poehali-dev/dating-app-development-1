import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "../AdminLogin";
import type { Banner } from "./marketingShared";

export function MarketingBanners({ token }: { token: string }) {
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

  useEffect(() => {
    loadBanners();
  }, []);

  return (
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
  );
}

export default MarketingBanners;
