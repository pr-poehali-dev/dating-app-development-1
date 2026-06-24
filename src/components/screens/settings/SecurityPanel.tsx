import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { authApi, type SessionInfo } from "@/lib/api";

function DeviceIcon({ ua }: { ua: string }) {
  const low = ua.toLowerCase();
  if (low.includes("mobile") || low.includes("android") || low.includes("iphone")) return <Icon name="Smartphone" size={15} className="text-white/50" />;
  if (low.includes("tablet") || low.includes("ipad")) return <Icon name="Tablet" size={15} className="text-white/50" />;
  return <Icon name="Monitor" size={15} className="text-white/50" />;
}

function parseBrowser(ua: string): string {
  if (!ua) return "Неизвестный браузер";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  return ua.slice(0, 30);
}

function parseOS(ua: string): string {
  if (!ua) return "";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "";
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("ru", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function SecurityPanel({ onLogout }: { onLogout?: () => void }) {
  // ── Смена пароля ────────────────────────────────────────────────────────────
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!pwOld || !pwNew) { setPwMsg({ text: "Заполни все поля", ok: false }); return; }
    if (pwNew !== pwNew2) { setPwMsg({ text: "Новые пароли не совпадают", ok: false }); return; }
    if (pwNew.length < 6) { setPwMsg({ text: "Минимум 6 символов", ok: false }); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword(pwOld, pwNew);
      setPwMsg({ text: "Пароль успешно изменён. Другие устройства отключены.", ok: true });
      setPwOld(""); setPwNew(""); setPwNew2("");
      loadSessions();
    } catch (e: unknown) {
      setPwMsg({ text: e instanceof Error ? e.message : "Ошибка", ok: false });
    } finally { setPwLoading(false); }
  };

  // ── Сессии ──────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessLoading, setSessLoading] = useState(false);
  const [endingId, setEndingId] = useState<number | null>(null);
  const [endingAll, setEndingAll] = useState(false);

  const loadSessions = () => {
    setSessLoading(true);
    authApi.listSessions()
      .then(d => setSessions(d.sessions))
      .catch(() => {})
      .finally(() => setSessLoading(false));
  };

  useEffect(() => { loadSessions(); }, []);

  const handleEndSession = async (id: number) => {
    setEndingId(id);
    try {
      await authApi.endSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch { void 0; }
    finally { setEndingId(null); }
  };

  const handleEndAll = async () => {
    setEndingAll(true);
    try {
      await authApi.endAllSessions();
      setSessions(prev => prev.filter(s => s.is_current));
    } catch { void 0; }
    finally { setEndingAll(false); }
  };

  const otherSessions = sessions.filter(s => !s.is_current);

  return (
    <div className="flex flex-col gap-6 px-4">

      {/* ── Смена пароля ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pt-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,45,120,0.12)" }}>
            <Icon name="KeyRound" size={14} style={{ color: "#FF2D78" }} />
          </div>
          <p className="text-white font-bold text-sm">Смена пароля</p>
        </div>

        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            { label: "Текущий пароль", value: pwOld, set: setPwOld },
            { label: "Новый пароль",    value: pwNew,  set: setPwNew },
            { label: "Повтори новый",   value: pwNew2, set: setPwNew2 },
          ].map(f => (
            <div key={f.label} className="flex flex-col gap-1.5">
              <label className="text-white/35 text-[11px] font-semibold uppercase tracking-wide">{f.label}</label>
              <input
                type="password"
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
              />
            </div>
          ))}

          {pwMsg && (
            <div className="px-3 py-2 rounded-xl text-xs font-semibold text-center"
              style={{
                background: pwMsg.ok ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                color: pwMsg.ok ? "#4ADE80" : "#F87171",
              }}>
              {pwMsg.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={pwLoading || !pwOld || !pwNew || !pwNew2}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            {pwLoading
              ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Сохраняем...</>
              : <><Icon name="ShieldCheck" size={15} />Изменить пароль</>}
          </button>

          <p className="text-white/25 text-xs text-center leading-relaxed">
            После смены пароля все другие устройства будут автоматически отключены
          </p>
        </div>
      </div>

      {/* ── Активные сессии ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(96,165,250,0.12)" }}>
              <Icon name="MonitorSmartphone" size={14} style={{ color: "#60A5FA" }} />
            </div>
            <p className="text-white font-bold text-sm">Активные устройства</p>
          </div>
          <button onClick={loadSessions} className="p-1.5 rounded-xl text-white/30 hover:text-white/60 transition-colors">
            <Icon name="RefreshCw" size={13} />
          </button>
        </div>

        {sessLoading ? (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <Icon name="MonitorOff" size={28} className="text-white/15" />
            <p className="text-white/25 text-sm">Нет активных сессий</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: s.is_current ? "rgba(96,165,250,0.06)" : "rgba(255,255,255,0.03)",
                  border: s.is_current ? "1px solid rgba(96,165,250,0.2)" : "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: s.is_current ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.06)" }}>
                  <DeviceIcon ua={s.user_agent} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-semibold">
                      {parseBrowser(s.user_agent)}
                      {parseOS(s.user_agent) ? ` · ${parseOS(s.user_agent)}` : ""}
                    </span>
                    {s.is_current && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(96,165,250,0.15)", color: "#60A5FA" }}>
                        это устройство
                      </span>
                    )}
                  </div>
                  <p className="text-white/30 text-[11px] font-mono mt-0.5">{s.ip}</p>
                  <p className="text-white/20 text-[10px] mt-0.5">
                    Активность: {fmtDate(s.last_active || s.created_at)}
                  </p>
                </div>
                {!s.is_current && (
                  <button
                    onClick={() => handleEndSession(s.id)}
                    disabled={endingId === s.id}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-90 disabled:opacity-40"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {endingId === s.id
                      ? <span className="w-3 h-3 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin inline-block" />
                      : "Закрыть"}
                  </button>
                )}
              </div>
            ))}

            {otherSessions.length > 1 && (
              <button
                onClick={handleEndAll}
                disabled={endingAll}
                className="w-full py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "rgba(239,68,68,0.08)", color: "#F87171", border: "1px solid rgba(239,68,68,0.18)" }}>
                {endingAll
                  ? <><span className="w-4 h-4 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />Закрываем...</>
                  : <><Icon name="LogOut" size={14} />Закрыть все другие устройства ({otherSessions.length})</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Выход со всех устройств ── */}
      {onLogout && (
        <div className="flex flex-col gap-2 pb-4">
          <button
            onClick={async () => { await authApi.logout(); onLogout(); }}
            className="w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "rgba(239,68,68,0.08)", color: "#F87171", border: "1px solid rgba(239,68,68,0.15)" }}>
            <Icon name="LogOut" size={15} />
            Выйти из аккаунта
          </button>
        </div>
      )}
    </div>
  );
}

export default SecurityPanel;
