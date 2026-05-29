import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminReport, type AdminVerifRequest } from "@/lib/api";
import { Spinner } from "./AdminLogin";

// ─── Shared ───────────────────────────────────────────────────────────────────
function SectionSwitch({ options, value, onChange }: {
  options: { id: string; label: string; dot?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={value === o.id
            ? { background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.2))", color: "white", boxShadow: "inset 0 0 0 1px rgba(255,45,120,0.35)" }
            : { color: "rgba(255,255,255,0.35)" }}>
          {o.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.dot }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
        <Icon name={icon as "Flag"} size={24} className="text-white/15" />
      </div>
      <p className="text-white/25 text-sm">{text}</p>
    </div>
  );
}

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
          { id: "pending",   label: "Новые",      dot: "#F87171" },
          { id: "resolved",  label: "Решённые",   dot: "#4ADE80" },
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

// ─── SupportTab ───────────────────────────────────────────────────────────────
export function SupportTab({ token }: { token: string }) {
  type Ticket = {
    id: number; user_id: number; message: string; reply: string | null;
    status: string; created_at: string; replied_at: string | null;
    user_name: string; user_photo: string | null;
  };

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"open" | "closed">("open");
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replying, setReplying] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);

  const FALLBACK = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

  const load = useCallback(() => {
    setLoading(true);
    adminApi.supportTickets(token, statusFilter).then(r => setTickets(r.tickets)).catch(() => {}).finally(() => setLoading(false));
  }, [token, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const sendReply = async (id: number) => {
    const text = (replyText[id] || "").trim();
    if (!text) return;
    setReplying(id);
    try {
      await adminApi.supportReply(token, id, text);
      setDone(d => [...d, id]);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, reply: text, status: "closed" } : t));
    } catch { void 0; } finally { setReplying(null); }
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={statusFilter}
        onChange={(v) => setStatusFilter(v as "open" | "closed")}
        options={[
          { id: "open",   label: "Открытые",  dot: "#F87171" },
          { id: "closed", label: "Закрытые",  dot: "#4ADE80" },
        ]}
      />

      {loading ? <Spinner /> : tickets.length === 0
        ? <EmptyState icon="MessageCircle" text={statusFilter === "open" ? "Открытых обращений нет" : "Закрытых обращений нет"} />
        : tickets.map(t => (
          <div key={t.id} className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${t.status === "closed" ? "rgba(74,222,128,0.15)" : "rgba(255,45,120,0.15)"}`,
            }}>

            {/* Шапка тикета */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <img src={t.user_photo || FALLBACK} className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm">{t.user_name}</p>
                  <span className="text-white/20 text-xs">#{t.id}</span>
                </div>
                <p className="text-white/25 text-[10px]">{new Date(t.created_at).toLocaleString("ru")}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                style={t.status === "closed"
                  ? { background: "rgba(74,222,128,0.12)", color: "#4ADE80" }
                  : { background: "rgba(255,45,120,0.12)", color: "#FF2D78" }}>
                {t.status === "closed" ? "Закрыт" : "Открыт"}
              </span>
            </div>

            <div className="px-4 py-3 flex flex-col gap-3">
              {/* Сообщение пользователя */}
              <div className="rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white/75 text-sm leading-relaxed">{t.message}</p>
              </div>

              {/* Ответ поддержки */}
              {t.reply && (
                <div className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)" }}>
                  <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Icon name="MessageSquare" size={10} />
                    Ответ поддержки · {t.replied_at ? new Date(t.replied_at).toLocaleDateString("ru") : ""}
                  </p>
                  <p className="text-white/65 text-sm leading-relaxed">{t.reply}</p>
                </div>
              )}

              {/* Форма ответа */}
              {t.status === "open" && !done.includes(t.id) && (
                <div className="flex gap-2">
                  <textarea
                    value={replyText[t.id] || ""}
                    onChange={e => setReplyText(r => ({ ...r, [t.id]: e.target.value }))}
                    placeholder="Написать ответ пользователю..."
                    rows={2}
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
                  />
                  <button
                    disabled={!(replyText[t.id] || "").trim() || replying === t.id}
                    onClick={() => sendReply(t.id)}
                    className="px-4 rounded-xl text-white text-sm font-bold flex-shrink-0 disabled:opacity-40 flex items-center gap-1.5 active:scale-95 transition-all"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                    {replying === t.id
                      ? <Icon name="Loader2" size={14} className="animate-spin" />
                      : <><Icon name="Send" size={14} />Ответить</>}
                  </button>
                </div>
              )}

              {done.includes(t.id) && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                  <Icon name="Check" size={13} className="text-green-400" />
                  <p className="text-green-400 text-xs font-semibold">Ответ отправлен пользователю</p>
                </div>
              )}
            </div>
          </div>
        ))
      }
    </div>
  );
}
