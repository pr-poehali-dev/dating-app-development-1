import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminVerifRequest } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { EmptyState } from "./AdminModerationShared";

// ─── Диалог отклонения верификации ────────────────────────────────────────────
function RejectDialog({ req, onConfirm, onCancel }: {
  req: AdminVerifRequest;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const presets = [
    "Лицо не видно на фото",
    "Фото не соответствует профилю",
    "Жест не распознан",
    "Плохое освещение",
    "Используется чужое фото",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-5 flex flex-col gap-4"
        style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.12)" }}>
            <Icon name="XCircle" size={20} style={{ color: "#F87171" }} />
          </div>
          <div>
            <p className="text-white font-bold">Отклонить верификацию</p>
            <p className="text-white/40 text-xs">{req.name}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-wider">Причина</p>
          {presets.map(p => (
            <button key={p} onClick={() => setReason(p)}
              className="text-left px-3 py-2 rounded-xl text-sm transition-all"
              style={reason === p
                ? { background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.35)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {p}
            </button>
          ))}
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Или введи свою причину..."
            rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            Отмена
          </button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#DC2626,#991B1B)" }}>
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Verif Tab ────────────────────────────────────────────────────────────────
export function VerifTab({ token }: { token: string }) {
  const [requests, setRequests] = useState<AdminVerifRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminVerifRequest | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.verifRequests(token).then(d => setRequests(d.requests)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const approve = async (req: AdminVerifRequest) => {
    setActionId(req.id);
    try { await adminApi.verifApprove(token, req.id); load(); } catch (e) { void e; }
    finally { setActionId(null); }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    const req = rejectTarget;
    setRejectTarget(null);
    setActionId(req.id);
    try { await adminApi.verifReject(token, req.id, reason); load(); } catch (e) { void e; }
    finally { setActionId(null); }
  };

  if (loading) return <Spinner />;
  if (requests.length === 0) return <EmptyState icon="BadgeCheck" text="Нет заявок на верификацию" />;

  return (
    <>
      {rejectTarget && <RejectDialog req={rejectTarget} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} />}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="rounded-2xl object-contain" style={{ maxWidth: "95vw", maxHeight: "90vh" }} />
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <Icon name="X" size={20} className="text-white" />
          </button>
        </div>
      )}

      {/* Счётчик */}
      <div className="flex items-center gap-2 px-1 mb-1">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <p className="text-white/50 text-sm">{requests.length} заявок ожидают проверки</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Селфи */}
            <div className="relative cursor-zoom-in overflow-hidden" onClick={() => setLightbox(r.selfie_url)}
              style={{ background: "rgba(0,0,0,0.3)" }}>
              <img src={r.selfie_url} className="w-full object-cover" style={{ maxHeight: 260 }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/80"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                <Icon name="ZoomIn" size={11} />Увеличить
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {r.photo_url
                  ? <img src={r.photo_url} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0"
                      style={{ border: "2px solid rgba(255,255,255,0.12)" }} />
                  : <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.3),rgba(155,89,182,0.3))" }}>
                      <span className="text-white font-bold">{r.name[0]}</span>
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{r.name}{r.age ? `, ${r.age}` : ""}</p>
                  <p className="text-white/35 text-xs truncate">{r.email}</p>
                  <p className="mt-0.5">
                    {r.email_verified
                      ? <span className="text-green-400 text-[10px] flex items-center gap-1"><Icon name="CheckCircle" size={10} />email подтверждён</span>
                      : <span className="text-white/25 text-[10px]">email не подтверждён</span>}
                  </p>
                </div>
                <p className="text-white/20 text-[10px] flex-shrink-0">{new Date(r.created_at).toLocaleDateString("ru")}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => approve(r)} disabled={actionId === r.id}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
                  {actionId === r.id
                    ? <Icon name="Loader2" size={14} className="animate-spin" />
                    : <><Icon name="Check" size={14} />Одобрить</>}
                </button>
                <button onClick={() => setRejectTarget(r)} disabled={actionId === r.id}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <Icon name="X" size={14} />Отклонить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
