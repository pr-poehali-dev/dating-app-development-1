import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { verifyApi, type VerifyStatus, type AdminVerifyRequest } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1ce048c9-36f3-4eb8-a0bc-4117b2b48365.jpg";

// ─── VerifyScreen ─────────────────────────────────────────────────────────────
export function VerifyScreen({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"main" | "selfie">("main");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ b64: string; type: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    verifyApi.getStatus()
      .then((s) => { setStatus(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setPreview(b64);
      setPendingFile({ b64, type: file.type });
      setMsg("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!pendingFile) return;
    setUploading(true); setMsg("");
    try {
      await verifyApi.uploadSelfie(pendingFile.b64, pendingFile.type);
      setMsg("Селфи отправлено на проверку!");
      setPreview(null); setPendingFile(null);
      const s = await verifyApi.getStatus(); setStatus(s); setStep("main");
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка загрузки"); }
    finally { setUploading(false); }
  };

  const statusBadge = () => {
    if (status?.verified) return { text: "Верифицирован ✓", color: "#3B82F6" };
    if (status?.selfie_status === "pending") return { text: "На проверке...", color: "#F59E0B" };
    if (status?.selfie_status === "rejected") return { text: "Отклонено", color: "#EF4444" };
    return null;
  };
  const badge = statusBadge();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={onClose} className="glass-card p-2"><Icon name="ChevronLeft" size={20} className="text-white" /></button>
        <h2 className="text-white font-golos font-bold text-xl flex-1">Верификация</h2>
        {badge && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: badge.color + "25", color: badge.color }}>
            {badge.text}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      ) : step === "main" ? (
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-6">
          <div className="glass-card p-4 flex flex-col gap-2">
            <p className="text-white font-semibold text-sm">Зачем нужна верификация?</p>
            <p className="text-white/60 text-xs leading-relaxed">Значок ✓ на твоём профиле показывает другим пользователям, что ты реальный человек. Это повышает доверие и количество совпадений.</p>
          </div>

          <div className="glass-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: status?.selfie_status === "approved" ? "rgba(59,130,246,0.2)" : status?.selfie_status === "pending" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.1)",
                  color: status?.selfie_status === "approved" ? "#3B82F6" : status?.selfie_status === "pending" ? "#F59E0B" : "white"
                }}>
                {status?.selfie_status === "approved" ? "✓" : status?.selfie_status === "pending" ? "⏳" : "📸"}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Селфи с жестом</p>
                <p className="text-white/50 text-xs">
                  {status?.selfie_status === "pending" ? "Ожидает проверки администратором"
                    : status?.selfie_status === "rejected" ? `Отклонено: ${status.reject_reason || "без причины"}`
                    : status?.selfie_status === "approved" ? "Одобрено"
                    : "Фото с поднятым большим пальцем"}
                </p>
              </div>
              {(!status?.selfie_status || status.selfie_status === "rejected") && (
                <button onClick={() => { setStep("selfie"); setMsg(""); }}
                  className="btn-grad px-3 py-1.5 text-xs font-semibold">Загрузить</button>
              )}
            </div>
          </div>

          {status?.verified && (
            <div className="p-4 rounded-2xl text-center" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <p className="text-blue-400 font-bold text-lg">✓ Профиль верифицирован</p>
              <p className="text-white/50 text-xs mt-1">Значок отображается на твоём профиле</p>
            </div>
          )}

          {msg && <p className="text-center text-sm" style={{ color: msg.includes("!") ? "#4ADE80" : "#FB7185" }}>{msg}</p>}
        </div>

      ) : (
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-6">
          <div className="glass-card p-5 flex flex-col gap-4 items-center">
            {preview ? (
              <>
                <p className="text-white font-semibold text-center">Проверь фото</p>
                <img src={preview} className="w-full max-w-xs rounded-2xl object-cover"
                  style={{ maxHeight: 320 }} />
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => { setPreview(null); setPendingFile(null); }}
                    disabled={uploading}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.08)" }}>
                    Переснять
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={uploading}
                    className="flex-1 btn-grad py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                    {uploading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправляем...</>
                      : <><Icon name="Send" size={16} className="text-white" />Отправить</>}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl">🤳</div>
                <p className="text-white font-semibold text-center">Сделай селфи с жестом</p>
                <div className="flex flex-col gap-2 w-full">
                  {["Смотри в камеру", "Покажи большой палец вверх 👍", "Лицо должно быть чётко видно", "Хорошее освещение"].map((tip) => (
                    <div key={tip} className="flex items-center gap-2 text-white/60 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />{tip}
                    </div>
                  ))}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfie} />
                <button onClick={() => fileRef.current?.click()}
                  className="btn-grad w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
                  <Icon name="Camera" size={18} className="text-white" />Сделать фото
                </button>
              </>
            )}
            {msg && <p className="text-center text-xs" style={{ color: msg.includes("!") ? "#4ADE80" : "#FB7185" }}>{msg}</p>}
          </div>
          <button onClick={() => { setStep("main"); setPreview(null); setPendingFile(null); }}
            className="text-white/40 text-sm text-center">← Назад</button>
        </div>
      )}
    </div>
  );
}

// ─── AdminVerifyScreen ────────────────────────────────────────────────────────
export function AdminVerifyScreen({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [requests, setRequests] = useState<AdminVerifyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const login = async () => {
    setLoading(true);
    try {
      const res = await verifyApi.adminList(token);
      setRequests(res.requests); setAuthed(true);
    } catch { setMsg("Неверный токен"); }
    finally { setLoading(false); }
  };

  const approve = async (req: AdminVerifyRequest) => {
    try { await verifyApi.adminApprove(token, req.id); setRequests((r) => r.filter((x) => x.id !== req.id)); }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
  };

  const reject = async (req: AdminVerifyRequest) => {
    const reason = prompt("Причина отклонения (необязательно):") || "";
    try { await verifyApi.adminReject(token, req.id, reason); setRequests((r) => r.filter((x) => x.id !== req.id)); }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={onClose} className="glass-card p-2"><Icon name="ChevronLeft" size={20} className="text-white" /></button>
        <h2 className="text-white font-golos font-bold text-xl flex-1">Админ: Верификация</h2>
      </div>

      {!authed ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <Icon name="ShieldCheck" size={48} className="text-blue-400" />
          <p className="text-white/60 text-sm text-center">Введи admin-токен для доступа к заявкам</p>
          <input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="Admin token"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-blue-500/50 font-golos" />
          <button onClick={login} disabled={loading} className="btn-grad w-full py-3.5 text-sm font-semibold disabled:opacity-50">
            {loading ? "Проверяем..." : "Войти"}
          </button>
          {msg && <p className="text-red-400 text-xs">{msg}</p>}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-6">
          {requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-5xl">✅</div>
              <p className="text-white/50 text-sm">Нет заявок на проверку</p>
            </div>
          )}
          {msg && <p className="text-center text-xs text-red-400">{msg}</p>}
          {requests.map((req) => (
            <div key={req.id} className="glass-card overflow-hidden flex flex-col gap-0">
              <img src={req.selfie_url} className="w-full object-cover" style={{ maxHeight: 280 }} />
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img src={req.photo_url || FALLBACK_PHOTO} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-white font-semibold text-sm">{req.name}{req.age ? `, ${req.age}` : ""}</p>
                    <p className="text-white/40 text-xs flex items-center gap-1">
                      {req.email_verified ? <span className="text-green-400">✓ Email подтверждён</span> : <span className="text-white/30">Email не подтверждён</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve(req)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                    style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
                    <Icon name="Check" size={16} className="text-white" />Одобрить
                  </button>
                  <button onClick={() => reject(req)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-400 flex items-center justify-center gap-1.5"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <Icon name="X" size={16} />Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}