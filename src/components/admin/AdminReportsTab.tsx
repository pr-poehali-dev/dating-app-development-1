import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminReport } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { SectionSwitch, EmptyState } from "./AdminModerationShared";

// ─── Диалог принятия мер ──────────────────────────────────────────────────────
function ActionsDialog({ report, onConfirm, onCancel }: {
  report: AdminReport;
  onConfirm: (postAction: string, banUser: boolean) => void;
  onCancel: () => void;
}) {
  const [postAction, setPostAction] = useState<"delete_post" | "keep_post">("keep_post");
  const [banUser, setBanUser] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-5 flex flex-col gap-4"
        style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,45,120,0.2)" }}>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,45,120,0.12)" }}>
            <Icon name="ShieldCheck" size={20} style={{ color: "#FF2D78" }} />
          </div>
          <div>
            <p className="text-white font-bold">Принять меры</p>
            <p className="text-white/40 text-xs">На пользователя: {report.reported_name}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Действие с постом</p>
          {([
            { v: "delete_post", label: "Удалить пост из ленты", icon: "Trash2", color: "#EF4444" },
            { v: "keep_post",   label: "Оставить пост в ленте", icon: "Check",  color: "#22C55E" },
          ] as const).map(({ v, label, icon, color }) => (
            <button key={v} onClick={() => setPostAction(v)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-left transition-all"
              style={postAction === v
                ? { background: `${color}15`, color, border: `1px solid ${color}40` }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon name={icon} size={15} style={{ color: postAction === v ? color : undefined }} />
              {label}
            </button>
          ))}
        </div>

        <button onClick={() => setBanUser(b => !b)}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
          style={banUser
            ? { background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.35)" }
            : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Icon name={banUser ? "UserX" : "User"} size={15} />
          {banUser ? "Заблокировать пользователя" : "Не блокировать пользователя"}
        </button>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            Отмена
          </button>
          <button onClick={() => onConfirm(postAction, banUser)}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
export function ReportsTab({ token }: { token: string }) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionsTarget, setActionsTarget] = useState<AdminReport | null>(null);

  const load = (s: string) => {
    setLoading(true);
    adminApi.reports(token, s).then(d => setReports(d.reports)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter); }, [token, statusFilter]);

  const resolve = async (r: AdminReport, status: string, banUser = false, postAction = '') => {
    setActionId(r.id);
    setActionsTarget(null);
    try { await adminApi.resolveReport(token, r.id, status, banUser, postAction); load(statusFilter); }
    catch (e) { void e; } finally { setActionId(null); }
  };

  const REASONS: Record<string, string> = {
    spam: "Спам", fake: "Фейк", abuse: "Оскорбления", photo: "Неприемлемое фото", other: "Другое"
  };
  const REASON_COLORS: Record<string, string> = {
    spam: "#F59E0B", fake: "#8B5CF6", abuse: "#EF4444", photo: "#EC4899", other: "#6B7280"
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={statusFilter}
        onChange={(v) => setStatusFilter(v)}
        options={[
          { id: "pending",   label: "Новые",       dot: "#F87171" },
          { id: "resolved",  label: "Решённые",    dot: "#4ADE80" },
          { id: "dismissed", label: "Отклонённые", dot: "#6B7280" },
        ]}
      />

      {actionsTarget && (
        <ActionsDialog
          report={actionsTarget}
          onConfirm={(postAction, banUser) => resolve(actionsTarget, "resolved", banUser, postAction)}
          onCancel={() => setActionsTarget(null)}
        />
      )}

      {loading ? <Spinner /> : reports.length === 0
        ? <EmptyState icon="Flag" text="Жалоб нет" />
        : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => {
              const rColor = REASON_COLORS[r.reason] || "#6B7280";
              return (
                <div key={r.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>

                  {/* Превью поста */}
                  {r.post_photo_url && (
                    <div className="flex items-center gap-3 px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <img src={r.post_photo_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/50 text-xs font-semibold">Жалоба на пост #{r.post_id}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-xl font-bold flex-shrink-0"
                        style={{ background: `${rColor}18`, color: rColor }}>
                        {REASONS[r.reason] || r.reason}
                      </span>
                    </div>
                  )}

                  <div className="px-4 py-3 flex flex-col gap-3">
                    {/* Участники */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white/35 text-xs">На:</span>
                          <span className="text-pink-300 font-semibold text-sm">{r.reported_name}</span>
                          <span className="text-white/20 text-xs truncate">{r.reported_email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-white/25 text-xs">От:</span>
                          <span className="text-white/50 text-xs">{r.reporter_name}</span>
                          <span className="text-white/20 text-[10px]">· {new Date(r.created_at).toLocaleDateString("ru")}</span>
                        </div>
                      </div>
                      {!r.post_photo_url && (
                        <span className="text-xs px-2.5 py-1 rounded-xl font-bold flex-shrink-0"
                          style={{ background: `${rColor}18`, color: rColor }}>
                          {REASONS[r.reason] || r.reason}
                        </span>
                      )}
                    </div>

                    {r.comment && (
                      <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white/50 text-sm italic">«{r.comment}»</p>
                      </div>
                    )}

                    {statusFilter === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => setActionsTarget(r)} disabled={actionId === r.id}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                          {actionId === r.id
                            ? <Icon name="Loader2" size={12} className="animate-spin" />
                            : <><Icon name="ShieldCheck" size={12} />Принять меры</>}
                        </button>
                        <button onClick={() => resolve(r, "dismissed")} disabled={actionId === r.id}
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40 active:scale-95 transition-all"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          Отклонить
                        </button>
                      </div>
                    ) : (
                      <p className="text-white/20 text-xs text-right">
                        {r.status === "resolved" ? "✅ Меры приняты" : "⚪ Отклонена"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
