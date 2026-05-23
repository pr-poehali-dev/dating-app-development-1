import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, type AdminReport, type AdminVerifRequest } from "@/lib/api";
import { Spinner } from "./AdminLogin";

// ─── Verif Tab ────────────────────────────────────────────────────────────────
export function VerifTab({ token }: { token: string }) {
  const [requests, setRequests] = useState<AdminVerifRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

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

  const reject = async (req: AdminVerifRequest) => {
    const reason = prompt("Причина отклонения (необязательно):") || "";
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
    <div className="grid gap-4 md:grid-cols-2">
      {requests.map((r) => (
        <div key={r.id} className="rounded-2xl overflow-hidden flex flex-col"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <img src={r.selfie_url} className="w-full object-cover" style={{ maxHeight: 260 }} />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {r.photo_url && <img src={r.photo_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />}
              <div>
                <p className="text-white font-semibold text-sm">{r.name}{r.age ? `, ${r.age}` : ""}</p>
                <p className="text-white/40 text-xs">{r.email}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {r.email_verified ? <span className="text-green-400">✓ email подтверждён</span> : "email не подтверждён"}
                </p>
              </div>
            </div>
            <p className="text-white/30 text-xs">{new Date(r.created_at).toLocaleString("ru")}</p>
            <div className="flex gap-2">
              <button onClick={() => approve(r)} disabled={actionId === r.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
                <Icon name="Check" size={15} className="text-white" />Одобрить
              </button>
              <button onClick={() => reject(r)} disabled={actionId === r.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-400 flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <Icon name="X" size={15} />Отклонить
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
export function ReportsTab({ token }: { token: string }) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionId, setActionId] = useState<number | null>(null);

  const load = (s: string) => {
    setLoading(true);
    adminApi.reports(token, s).then((d) => setReports(d.reports)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter); }, [token, statusFilter]);

  const resolve = async (r: AdminReport, status: string) => {
    setActionId(r.id);
    try { await adminApi.resolveReport(token, r.id, status); load(statusFilter); } catch (e) { void e; }
    finally { setActionId(null); }
  };

  const REASONS: Record<string, string> = {
    spam: "Спам", fake: "Фейк", abuse: "Оскорбления", photo: "Неприемлемое фото", other: "Другое"
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {["pending", "resolved", "dismissed"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={statusFilter === s
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
              : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            {s === "pending" ? "Новые" : s === "resolved" ? "Решённые" : "Отклонённые"}
          </button>
        ))}
      </div>

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
                <div>
                  <p className="text-white font-semibold text-sm">
                    На: <span className="text-pink-400">{r.reported_name}</span>
                    <span className="text-white/30 text-xs ml-2">{r.reported_email}</span>
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">
                    От: {r.reporter_name} · {new Date(r.created_at).toLocaleString("ru")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: "rgba(255,45,120,0.15)", color: "#FF2D78" }}>
                  {REASONS[r.reason] || r.reason}
                </span>
              </div>
              {r.comment && <p className="text-white/60 text-sm bg-white/5 rounded-xl px-3 py-2">«{r.comment}»</p>}
              {statusFilter === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => resolve(r, "resolved")} disabled={actionId === r.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
                    Принять меры
                  </button>
                  <button onClick={() => resolve(r, "dismissed")} disabled={actionId === r.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    Отклонить
                  </button>
                </div>
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
              {s === "open" ? "Открытые" : "Закрытые"}
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
            <img src={t.user_photo || FALLBACK} className="w-9 h-9 rounded-full object-cover flex-shrink-0"/>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-semibold text-sm">{t.user_name}</p>
                <span className="text-white/30 text-xs">#{t.id}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={t.status === "closed"
                    ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80" }
                    : { background: "rgba(255,45,120,0.15)", color: "#FF2D78" }}>
                  {t.status === "closed" ? "Закрыт" : "Открыт"}
                </span>
              </div>
              <p className="text-white/30 text-xs">{new Date(t.created_at).toLocaleString("ru")}</p>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-white/80 text-sm leading-relaxed">{t.message}</p>
          </div>

          {t.reply && (
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <p className="text-green-400 text-xs font-semibold mb-1">Ответ поддержки</p>
              <p className="text-white/70 text-sm leading-relaxed">{t.reply}</p>
            </div>
          )}

          {t.status === "open" && !done.includes(t.id) && (
            <div className="flex gap-2">
              <textarea
                value={replyText[t.id] || ""}
                onChange={e => setReplyText(r => ({ ...r, [t.id]: e.target.value }))}
                placeholder="Написать ответ..."
                rows={2}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                disabled={!(replyText[t.id] || "").trim() || replying === t.id}
                onClick={() => sendReply(t.id)}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold flex-shrink-0 disabled:opacity-40 flex items-center gap-1.5"
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
              <p className="text-green-400 text-xs font-semibold">Ответ отправлен</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default VerifTab;
