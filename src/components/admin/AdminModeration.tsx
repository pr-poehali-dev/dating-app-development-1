import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminReport, type AdminVerifRequest } from "@/lib/api";
import { Spinner } from "./AdminLogin";

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
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "#1a1030", border: "1px solid rgba(239,68,68,0.3)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.15)" }}>
            <Icon name="XCircle" size={20} style={{ color: "#F87171" }} />
          </div>
          <div>
            <p className="text-white font-bold">Отклонить верификацию</p>
            <p className="text-white/40 text-xs">{req.name}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-white/50 text-xs">Выбери причину или напиши свою:</p>
          {presets.map(p => (
            <button key={p} onClick={() => setReason(p)}
              className="text-left px-3 py-2 rounded-xl text-sm transition-all"
              style={reason === p
                ? { background: "rgba(239,68,68,0.2)", color: "#F87171", border: "1px solid rgba(239,68,68,0.4)" }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {p}
            </button>
          ))}
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Или введи свою причину..."
            rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/50"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            Отмена
          </button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
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
    adminApi.verifRequests(token).then((d) => setRequests(d.requests)).catch(() => {}).finally(() => setLoading(false));
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

  if (requests.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="text-5xl">✅</div>
      <p className="text-white/40 text-sm">Нет заявок на верификацию</p>
    </div>
  );

  return (
    <>
      {rejectTarget && (
        <RejectDialog req={rejectTarget} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} />
      )}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-full max-h-full rounded-2xl object-contain" style={{ maxWidth: "95vw", maxHeight: "90vh" }} />
          <button className="absolute top-4 right-4 text-white/60 hover:text-white">
            <Icon name="X" size={28} />
          </button>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <p className="text-white/50 text-sm">{requests.length} заявок ожидают проверки</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Селфи — кликабельное */}
            <div className="relative cursor-zoom-in" onClick={() => setLightbox(r.selfie_url)}>
              <img src={r.selfie_url} className="w-full object-cover" style={{ maxHeight: 280 }} />
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-semibold text-white"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                <Icon name="ZoomIn" size={12} className="inline mr-1" />Увеличить
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Инфо о пользователе */}
              <div className="flex items-center gap-3">
                {r.photo_url && (
                  <img src={r.photo_url} className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    style={{ border: "2px solid rgba(255,255,255,0.15)" }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{r.name}{r.age ? `, ${r.age}` : ""}</p>
                  <p className="text-white/40 text-xs truncate">{r.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {r.email_verified
                      ? <span className="text-green-400 text-xs flex items-center gap-1"><Icon name="CheckCircle" size={11} />email подтверждён</span>
                      : <span className="text-white/30 text-xs">email не подтверждён</span>}
                  </div>
                </div>
              </div>

              <p className="text-white/25 text-xs">{new Date(r.created_at).toLocaleString("ru")}</p>

              {/* Кнопки */}
              <div className="flex gap-2">
                <button onClick={() => approve(r)} disabled={actionId === r.id}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
                  {actionId === r.id
                    ? <Icon name="Loader2" size={15} className="animate-spin text-white" />
                    : <><Icon name="Check" size={15} className="text-white" />Одобрить</>}
                </button>
                <button onClick={() => setRejectTarget(r)} disabled={actionId === r.id}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <Icon name="X" size={15} />Отклонить
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
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "#1a1030", border: "1px solid rgba(255,45,120,0.25)" }}>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,45,120,0.15)" }}>
            <Icon name="ShieldCheck" size={20} style={{ color: "#FF2D78" }} />
          </div>
          <div>
            <p className="text-white font-bold">Принять меры</p>
            <p className="text-white/40 text-xs">На: {report.reported_name}</p>
          </div>
        </div>

        {/* Действие с постом */}
        <div className="flex flex-col gap-2">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Действие с постом</p>
          {([
            { v: "delete_post", label: "Удалить пост из ленты", icon: "Trash2", color: "#EF4444" },
            { v: "keep_post",   label: "Оставить пост в ленте", icon: "Check",  color: "#22C55E" },
          ] as const).map(({ v, label, icon, color }) => (
            <button key={v} onClick={() => setPostAction(v)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-left transition-all active:scale-[0.98]"
              style={postAction === v
                ? { background: `${color}22`, color, border: `1px solid ${color}55` }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Icon name={icon} size={15} style={{ color: postAction === v ? color : undefined }} />
              {label}
            </button>
          ))}
        </div>

        {/* Бан */}
        <button onClick={() => setBanUser(b => !b)}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={banUser
            ? { background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.4)" }
            : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon name={banUser ? "UserX" : "User"} size={15} />
          {banUser ? "🚫 Заблокировать пользователя" : "Не блокировать пользователя"}
        </button>

        <div className="flex gap-2 mt-1">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/50"
            style={{ background: "rgba(255,255,255,0.07)" }}>
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
    adminApi.reports(token, s).then((d) => setReports(d.reports)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter); }, [token, statusFilter]);

  const resolve = async (r: AdminReport, status: string, banUser = false, postAction = '') => {
    setActionId(r.id);
    setActionsTarget(null);
    try {
      await adminApi.resolveReport(token, r.id, status, banUser, postAction);
      load(statusFilter);
    } catch (e) { void e; }
    finally { setActionId(null); }
  };

  const REASONS: Record<string, string> = {
    spam: "Спам", fake: "Фейк", abuse: "Оскорбления", photo: "Неприемлемое фото", other: "Другое"
  };

  const REASON_COLORS: Record<string, string> = {
    spam: "#F59E0B", fake: "#8B5CF6", abuse: "#EF4444", photo: "#EC4899", other: "#6B7280"
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {["pending", "resolved", "dismissed"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={statusFilter === s
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
              : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            {s === "pending" ? "🔴 Новые" : s === "resolved" ? "✅ Решённые" : "⚪ Отклонённые"}
          </button>
        ))}
      </div>

      {/* Диалог принятия мер */}
      {actionsTarget && (
        <ActionsDialog
          report={actionsTarget}
          onConfirm={(postAction, banUser) => resolve(actionsTarget, "resolved", banUser, postAction)}
          onCancel={() => setActionsTarget(null)}
        />
      )}

      {loading ? <Spinner /> : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-5xl">🏳️</div>
          <p className="text-white/40 text-sm">Жалоб нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">
                    На: <span className="text-pink-400">{r.reported_name}</span>
                    <span className="text-white/30 text-xs ml-2 truncate">{r.reported_email}</span>
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">
                    От: <span className="text-white/70">{r.reporter_name}</span> · {new Date(r.created_at).toLocaleString("ru")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0 font-semibold"
                  style={{ background: `${REASON_COLORS[r.reason] || "#6B7280"}22`, color: REASON_COLORS[r.reason] || "#9CA3AF" }}>
                  {REASONS[r.reason] || r.reason}
                </span>
              </div>
              {r.comment && (
                <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <p className="text-white/60 text-sm">«{r.comment}»</p>
                </div>
              )}
              {statusFilter === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => setActionsTarget(r)} disabled={actionId === r.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                    {actionId === r.id
                      ? <Icon name="Loader2" size={13} className="animate-spin" />
                      : <><Icon name="ShieldCheck" size={13} />Принять меры</>}
                  </button>
                  <button onClick={() => resolve(r, "dismissed")} disabled={actionId === r.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 active:scale-95 transition-all"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    Отклонить жалобу
                  </button>
                </div>
              )}
              {statusFilter !== "pending" && (
                <p className="text-white/20 text-xs text-right">
                  {r.status === "resolved" ? "✅ Меры приняты" : "⚪ Отклонена"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SupportTab ───────────────────────────────────────────────────────────────
export function SupportTab({ token }: { token: string }) {
  type Ticket = { id: number; user_id: number; message: string; reply: string | null; status: string; created_at: string; replied_at: string | null; user_name: string; user_photo: string | null };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"open"|"closed">("open");
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replying, setReplying] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);

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

  const FALLBACK = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">Обращения в поддержку</h3>
        <div className="flex gap-2">
          {(["open","closed"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={statusFilter === s
                ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              {s === "open" ? "🔴 Открытые" : "✅ Закрытые"}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin"/></div>}
      {!loading && tickets.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12">
          <Icon name="MessageCircle" size={36} className="text-white/15" />
          <p className="text-white/30 text-sm">{statusFilter === "open" ? "Открытых обращений нет" : "Закрытых обращений нет"}</p>
        </div>
      )}
      {!loading && tickets.map(t => (
        <div key={t.id} className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${t.status === "closed" ? "rgba(74,222,128,0.2)" : "rgba(255,45,120,0.2)"}` }}>
          <div className="flex items-start gap-3">
            <img src={t.user_photo || FALLBACK} className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid rgba(255,255,255,0.1)" }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-semibold text-sm">{t.user_name}</p>
                <span className="text-white/30 text-xs">#{t.id}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={t.status === "closed"
                    ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80" }
                    : { background: "rgba(255,45,120,0.15)", color: "#FF2D78" }}>
                  {t.status === "closed" ? "✅ Закрыт" : "🔴 Открыт"}
                </span>
              </div>
              <p className="text-white/30 text-xs">{new Date(t.created_at).toLocaleString("ru")}</p>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-white/80 text-sm leading-relaxed">{t.message}</p>
          </div>

          {t.reply && (
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <p className="text-green-400 text-xs font-semibold mb-1 flex items-center gap-1">
                <Icon name="MessageSquare" size={11} />Ответ поддержки · {t.replied_at ? new Date(t.replied_at).toLocaleString("ru") : ""}
              </p>
              <p className="text-white/70 text-sm leading-relaxed">{t.reply}</p>
            </div>
          )}

          {t.status === "open" && !done.includes(t.id) && (
            <div className="flex gap-2">
              <textarea
                value={replyText[t.id] || ""}
                onChange={e => setReplyText(r => ({ ...r, [t.id]: e.target.value }))}
                placeholder="Написать ответ пользователю..."
                rows={2}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                disabled={!(replyText[t.id] || "").trim() || replying === t.id}
                onClick={() => sendReply(t.id)}
                className="px-4 rounded-xl text-white text-sm font-semibold flex-shrink-0 disabled:opacity-40 flex items-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                {replying === t.id
                  ? <Icon name="Loader2" size={15} className="animate-spin"/>
                  : <><Icon name="Send" size={15}/>Ответить</>}
              </button>
            </div>
          )}
          {done.includes(t.id) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(74,222,128,0.12)" }}>
              <Icon name="Check" size={14} className="text-green-400"/>
              <p className="text-green-400 text-xs font-semibold">Ответ отправлен пользователю</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}