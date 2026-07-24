import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { SectionSwitch, EmptyState } from "./AdminModerationShared";

type Ticket = {
  id: number; user_id: number; message: string; reply: string | null;
  status: string; created_at: string; replied_at: string | null;
  user_name: string; user_photo: string | null;
  guest_name?: string | null; guest_login?: string | null;
  guest_email?: string | null; image_url?: string | null; source?: string | null;
};

const FALLBACK = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1ce048c9-36f3-4eb8-a0bc-4117b2b48365.jpg";

// ─── SupportTab ───────────────────────────────────────────────────────────────
export function SupportTab({ token }: { token: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"open" | "closed">("open");
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

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={statusFilter}
        onChange={(v) => setStatusFilter(v as "open" | "closed")}
        options={[
          { id: "open",   label: "Открытые", dot: "#F87171" },
          { id: "closed", label: "Закрытые", dot: "#4ADE80" },
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm">{t.user_name || t.guest_name || "Гость"}</p>
                  <span className="text-white/20 text-xs">#{t.id}</span>
                  {t.source === "site" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(255,140,0,0.14)", color: "#FF9F45" }}>САЙТ</span>
                  )}
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
              {/* Контакты гостя */}
              {(t.guest_email || t.guest_login) && (
                <div className="flex flex-wrap gap-2">
                  {t.guest_login && (
                    <span className="flex items-center gap-1 text-[11px] text-white/50 px-2 py-1 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.05)" }}>
                      <Icon name="AtSign" size={11} />{t.guest_login}
                    </span>
                  )}
                  {t.guest_email && (
                    <a href={`mailto:${t.guest_email}`}
                      className="flex items-center gap-1 text-[11px] text-pink-300 px-2 py-1 rounded-lg hover:underline"
                      style={{ background: "rgba(255,45,120,0.08)" }}>
                      <Icon name="Mail" size={11} />{t.guest_email}
                    </a>
                  )}
                </div>
              )}

              {/* Сообщение пользователя */}
              <div className="rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap">{t.message}</p>
              </div>

              {/* Прикреплённое изображение */}
              {t.image_url && (
                <a href={t.image_url} target="_blank" rel="noreferrer" className="block">
                  <img src={t.image_url} alt="Вложение"
                    className="w-full max-h-64 object-contain rounded-xl"
                    style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </a>
              )}

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