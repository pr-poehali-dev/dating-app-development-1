import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/a87188e5-57d7-4ad4-ac31-0a2c3e3d0e18";

interface Promo {
  id: number;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

async function adminReq(token: string, action: string, body?: object) {
  const res = await fetch(`${ADMIN_URL}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export function AdminPromos({ token }: { token: string }) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: "", discount_percent: "20", max_uses: "100", expires_at: "" });
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    adminReq(token, "promos")
      .then(d => setPromos(d.promos || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.code.trim()) { setFormError("Введи код"); return; }
    if (!form.discount_percent || Number(form.discount_percent) < 1) { setFormError("Укажи скидку"); return; }
    setFormError("");
    setBusy(-1);
    try {
      const res = await adminReq(token, "promo_create", {
        code: form.code.trim().toUpperCase(),
        discount_percent: Number(form.discount_percent),
        max_uses: Number(form.max_uses) || 1,
        expires_at: form.expires_at || null,
      });
      if (res.error) { setFormError(res.error); return; }
      setForm({ code: "", discount_percent: "20", max_uses: "100", expires_at: "" });
      setCreating(false);
      load();
    } finally {
      setBusy(null);
    }
  };

  const handleToggle = async (id: number) => {
    setBusy(id);
    await adminReq(token, "promo_toggle", { id });
    setBusy(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить промокод?")) return;
    setBusy(id);
    await adminReq(token, "promo_delete", { id });
    setBusy(null);
    load();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
    + " bg-white/5 border border-white/10 focus:border-pink-500/50 transition-colors";

  return (
    <div className="flex flex-col gap-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Промокоды</h2>
          <p className="text-white/40 text-xs mt-0.5">Скидки на Premium-подписку</p>
        </div>
        <button onClick={() => { setCreating(v => !v); setFormError(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
          style={{ background: creating ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          <Icon name={creating ? "X" : "Plus"} size={15} className="text-white" />
          {creating ? "Отмена" : "Создать"}
        </button>
      </div>

      {/* Форма создания */}
      {creating && (
        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "rgba(255,45,120,0.07)", border: "1px solid rgba(255,45,120,0.2)" }}>
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Новый промокод</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-[11px]">Код</label>
              <input className={inputCls} placeholder="SUMMER50"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-[11px]">Скидка %</label>
              <input className={inputCls} type="number" min={1} max={100} placeholder="20"
                value={form.discount_percent}
                onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-[11px]">Лимит использований</label>
              <input className={inputCls} type="number" min={1} placeholder="100"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-[11px]">Срок до (необяз.)</label>
              <input className={inputCls} type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 text-sm"
              style={{ background: "rgba(239,68,68,0.1)" }}>
              <Icon name="AlertCircle" size={13} className="flex-shrink-0" />
              {formError}
            </div>
          )}

          <button onClick={handleCreate} disabled={busy === -1}
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            {busy === -1
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Создаём...
                </span>
              : "Создать промокод"}
          </button>
        </div>
      )}

      {/* Список */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Icon name="Loader2" size={28} className="text-white/30 animate-spin" />
        </div>
      ) : promos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <Icon name="Tag" size={36} className="text-white/15" />
          <p className="text-white/30 text-sm">Промокодов пока нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {promos.map(p => {
            const expired = p.expires_at && new Date(p.expires_at) < new Date();
            const exhausted = p.used_count >= p.max_uses;
            const statusColor = !p.active || expired || exhausted
              ? "text-white/30" : "text-emerald-400";
            const statusText = !p.active ? "Выкл" : expired ? "Истёк" : exhausted ? "Исчерпан" : "Активен";
            return (
              <div key={p.id} className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  opacity: (!p.active || expired || exhausted) ? 0.65 : 1,
                }}>
                {/* Код + скидка */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold font-mono text-sm">{p.code}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,45,120,0.18)", color: "#FF2D78" }}>
                      −{p.discount_percent}%
                    </span>
                    <span className={`text-[11px] font-semibold ${statusColor}`}>{statusText}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-white/35 text-[11px]">
                      {p.used_count} / {p.max_uses} использований
                    </span>
                    {p.expires_at && (
                      <span className="text-white/25 text-[11px]">
                        до {new Date(p.expires_at).toLocaleDateString("ru")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleToggle(p.id)} disabled={busy === p.id}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    style={{ background: p.active ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)" }}
                    title={p.active ? "Деактивировать" : "Активировать"}>
                    {busy === p.id
                      ? <Icon name="Loader2" size={13} className="text-white/40 animate-spin" />
                      : <Icon name={p.active ? "ToggleRight" : "ToggleLeft"} size={15}
                          className={p.active ? "text-emerald-400" : "text-white/30"} />}
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={busy === p.id}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    style={{ background: "rgba(239,68,68,0.08)" }}
                    title="Удалить">
                    <Icon name="Trash2" size={13} className="text-red-400/60" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
