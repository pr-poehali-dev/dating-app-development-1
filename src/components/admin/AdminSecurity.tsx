import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";

type BlockedIp = { id: number; ip_address: string; reason: string; created_at: string };
type Stopword  = { id: number; word: string; created_at: string };
type GovRequest = {
  id: number; request_number: string; authority: string; subject: string;
  user_id: number | null; user_email: string | null; status: string;
  notes: string | null; admin_notes: string | null; data_exported_at: string | null; created_at: string;
};

function SectionSwitch({ options, value, onChange }: {
  options: { id: string; label: string; icon: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={value === o.id
            ? { background: "linear-gradient(135deg,rgba(239,68,68,0.2),rgba(185,28,28,0.2))", color: "#F87171", boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.3)" }
            : { color: "rgba(255,255,255,0.35)" }}>
          <Icon name={o.icon as "Shield"} size={12} />{o.label}
        </button>
      ))}
    </div>
  );
}

function InputRow({ value, onChange, placeholder, onAction, actionLabel, saving, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  onAction: () => void; actionLabel: string; saving: boolean; type?: string;
}) {
  return (
    <div className="flex gap-2">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        onKeyDown={e => e.key === "Enter" && onAction()}
        className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
      <button onClick={onAction} disabled={saving || !value.trim()}
        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#EF4444,#B91C1C)" }}>
        {saving ? <Icon name="Loader2" size={13} className="animate-spin" /> : actionLabel}
      </button>
    </div>
  );
}

const ADMIN_URL = "https://functions.poehali.dev/a87188e5-57d7-4ad4-ac31-0a2c3e3d0e18";

async function adminReq(token: string, action: string, body?: object) {
  const res = await fetch(`${ADMIN_URL}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Получен", exported: "Данные выгружены", closed: "Закрыт", rejected: "Отклонён",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#FBBF24", exported: "#60A5FA", closed: "#4ADE80", rejected: "#F87171",
};

export function SecurityTab({ token }: { token: string }) {
  const [section, setSection] = useState<"ips" | "words" | "gov">("ips");

  // ── IP ──────────────────────────────────────────────────────────────────────
  const [ips, setIps] = useState<BlockedIp[]>([]);
  const [ipsLoading, setIpsLoading] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newIpReason, setNewIpReason] = useState("");
  const [ipSaving, setIpSaving] = useState(false);

  const loadIps = () => {
    setIpsLoading(true);
    adminApi.blockedIps(token).then(d => setIps(d.ips)).catch(() => {}).finally(() => setIpsLoading(false));
  };

  const handleBlockIp = async () => {
    if (!newIp.trim()) return;
    setIpSaving(true);
    try {
      await adminApi.blockIp(token, newIp.trim(), newIpReason.trim() || "Ручная блокировка");
      setNewIp(""); setNewIpReason(""); loadIps();
    } catch { void 0; } finally { setIpSaving(false); }
  };

  const handleUnblockIp = async (id: number) => {
    await adminApi.unblockIp(token, id).catch(() => {});
    loadIps();
  };

  // ── Стоп-слова ───────────────────────────────────────────────────────────────
  const [words, setWords] = useState<Stopword[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [wordSaving, setWordSaving] = useState(false);

  const loadWords = () => {
    setWordsLoading(true);
    adminApi.stopwords(token).then(d => setWords(d.words)).catch(() => {}).finally(() => setWordsLoading(false));
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    setWordSaving(true);
    try { await adminApi.addStopword(token, newWord.trim()); setNewWord(""); loadWords(); }
    catch { void 0; } finally { setWordSaving(false); }
  };

  const handleDeleteWord = async (id: number) => {
    await adminApi.deleteStopword(token, id).catch(() => {});
    loadWords();
  };

  // ── Запросы от органов власти ────────────────────────────────────────────
  const [govReqs, setGovReqs] = useState<GovRequest[]>([]);
  const [govLoading, setGovLoading] = useState(false);
  const [govForm, setGovForm] = useState({ request_number: "", authority: "", subject: "", user_email: "", notes: "" });
  const [govCreating, setGovCreating] = useState(false);
  const [govSaving, setGovSaving] = useState(false);
  const [govExporting, setGovExporting] = useState<number | null>(null);
  const [govExportData, setGovExportData] = useState<{ id: number; data: object } | null>(null);

  const loadGovReqs = () => {
    setGovLoading(true);
    adminReq(token, "gov_requests")
      .then(d => setGovReqs(d.requests || []))
      .finally(() => setGovLoading(false));
  };

  const handleGovCreate = async () => {
    if (!govForm.authority.trim() || !govForm.subject.trim()) return;
    setGovSaving(true);
    try {
      await adminReq(token, "gov_request_create", govForm);
      setGovForm({ request_number: "", authority: "", subject: "", user_email: "", notes: "" });
      setGovCreating(false);
      loadGovReqs();
    } finally { setGovSaving(false); }
  };

  const handleGovExport = async (req: GovRequest) => {
    setGovExporting(req.id);
    try {
      const res = await adminReq(token, "gov_request_export", { id: req.id });
      // Сохраняем данные для показа
      setGovExportData({ id: req.id, data: res.user_data || {} });
      // Скачиваем JSON-файл
      const blob = new Blob([JSON.stringify(res.user_data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gov_request_${req.id}_${req.request_number || req.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      loadGovReqs();
    } finally { setGovExporting(null); }
  };

  const handleGovStatus = async (id: number, status: string) => {
    await adminReq(token, "gov_request_update", { id, status });
    loadGovReqs();
  };

  useEffect(() => {
    if (section === "ips") loadIps();
    else if (section === "words") loadWords();
    else loadGovReqs();
  }, [section]);

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={section}
        onChange={v => setSection(v as "ips" | "words" | "gov")}
        options={[
          { id: "ips",   label: "Блокировка IP",  icon: "Shield" },
          { id: "words", label: "Стоп-слова",      icon: "AlertTriangle" },
          { id: "gov",   label: "Запросы",         icon: "FileText" },
        ]}
      />

      {/* ── IP ── */}
      {section === "ips" && (
        <div className="flex flex-col gap-4">
          {/* Форма */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.12)" }}>
                <Icon name="Shield" size={13} style={{ color: "#F87171" }} />
              </div>
              <p className="text-white font-semibold text-sm">Заблокировать IP-адрес</p>
            </div>
            <InputRow
              value={newIp} onChange={setNewIp}
              placeholder="192.168.1.1"
              onAction={() => {}} actionLabel="" saving={false}
            />
            <InputRow
              value={newIpReason} onChange={setNewIpReason}
              placeholder="Причина блокировки (необязательно)"
              onAction={handleBlockIp} actionLabel="Заблокировать"
              saving={ipSaving}
            />
          </div>

          {/* Список */}
          {ipsLoading ? <Spinner /> : (
            <>
              {ips.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.08)" }}>
                    <Icon name="ShieldCheck" size={22} style={{ color: "#4ADE80" }} />
                  </div>
                  <p className="text-white/25 text-sm">Заблокированных IP нет</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-white/30 text-xs px-1">{ips.length} заблокировано</p>
                  {ips.map(ip => (
                    <div key={ip.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(239,68,68,0.1)" }}>
                        <Icon name="WifiOff" size={13} style={{ color: "#F87171" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-mono text-sm">{ip.ip_address}</p>
                        <p className="text-white/35 text-xs truncate">{ip.reason}</p>
                      </div>
                      <p className="text-white/20 text-[10px] flex-shrink-0">{new Date(ip.created_at).toLocaleDateString("ru")}</p>
                      <button onClick={() => handleUnblockIp(ip.id)}
                        className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)" }}>
                        Снять
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Стоп-слова ── */}
      {section === "words" && (
        <div className="flex flex-col gap-4">
          {/* Форма */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.12)" }}>
                <Icon name="AlertTriangle" size={13} style={{ color: "#F87171" }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Добавить стоп-слово</p>
                <p className="text-white/30 text-xs">Автофильтрация из профилей и сообщений</p>
              </div>
            </div>
            <InputRow
              value={newWord} onChange={setNewWord}
              placeholder="Слово или фраза..."
              onAction={handleAddWord} actionLabel="Добавить"
              saving={wordSaving}
            />
          </div>

          {/* Список */}
          {wordsLoading ? <Spinner /> : (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-white/30 text-xs">{words.length} стоп-слов</p>
              </div>
              {words.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Icon name="CheckCircle" size={28} className="text-white/15" />
                  <p className="text-white/25 text-sm">Стоп-слов нет</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {words.map(w => (
                    <div key={w.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                      <span className="text-red-300 text-xs font-mono">{w.word}</span>
                      <button onClick={() => handleDeleteWord(w.id)}
                        className="text-white/25 hover:text-red-400 transition-colors">
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Запросы от органов власти ── */}
      {section === "gov" && (
        <div className="flex flex-col gap-4">
          {/* Заголовок + кнопка */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Запросы от органов власти</p>
              <p className="text-white/35 text-xs mt-0.5">Реестр официальных запросов на предоставление данных</p>
            </div>
            <button onClick={() => setGovCreating(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ background: govCreating ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#3B82F6,#1D4ED8)", color: "white" }}>
              <Icon name={govCreating ? "X" : "Plus"} size={13} />
              {govCreating ? "Отмена" : "Зарегистрировать"}
            </button>
          </div>

          {/* Форма создания */}
          {govCreating && (
            <div className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Новый запрос</p>
              {[
                { key: "request_number", label: "Номер запроса / дела", placeholder: "№ 12345 от 01.06.2026" },
                { key: "authority",      label: "Орган власти *",        placeholder: "МВД России, ФСБ, Прокуратура..." },
                { key: "subject",        label: "Предмет запроса *",     placeholder: "Сведения об аккаунте пользователя..." },
                { key: "user_email",     label: "Email пользователя",    placeholder: "user@example.com" },
                { key: "notes",          label: "Примечания",            placeholder: "Дополнительная информация..." },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-white/40 text-[11px]">{f.label}</label>
                  <input
                    value={govForm[f.key as keyof typeof govForm]}
                    onChange={e => setGovForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              ))}
              <button onClick={handleGovCreate} disabled={govSaving || !govForm.authority.trim() || !govForm.subject.trim()}
                className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)" }}>
                {govSaving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Сохраняем...</span> : "Зарегистрировать запрос"}
              </button>
            </div>
          )}

          {/* Список запросов */}
          {govLoading ? <Spinner /> : govReqs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.08)" }}>
                <Icon name="FileText" size={22} className="text-blue-400" />
              </div>
              <p className="text-white/25 text-sm">Запросов не поступало</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-white/30 text-xs px-1">{govReqs.length} запросов в реестре</p>
              {govReqs.map(req => (
                <div key={req.id} className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {/* Шапка */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">{req.authority}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${STATUS_COLOR[req.status] || "#9CA3AF"}22`, color: STATUS_COLOR[req.status] || "#9CA3AF" }}>
                          {STATUS_LABEL[req.status] || req.status}
                        </span>
                      </div>
                      {req.request_number && <p className="text-white/40 text-xs mt-0.5">№ {req.request_number}</p>}
                    </div>
                    <p className="text-white/25 text-[10px] flex-shrink-0">{new Date(req.created_at).toLocaleDateString("ru")}</p>
                  </div>

                  <p className="text-white/60 text-xs leading-relaxed">{req.subject}</p>

                  {req.user_email && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <Icon name="User" size={12} className="text-white/40" />
                      <span className="text-white/60 text-xs">{req.user_email}</span>
                      {req.data_exported_at && <span className="ml-auto text-emerald-400 text-[10px] font-semibold">Выгружено {new Date(req.data_exported_at).toLocaleDateString("ru")}</span>}
                    </div>
                  )}

                  {/* Данные после экспорта */}
                  {govExportData?.id === req.id && (
                    <div className="rounded-xl p-3 flex flex-col gap-2"
                      style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-400 text-[11px] font-bold">Выгруженные данные</p>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(govExportData.data, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url; a.download = `gov_${req.id}.json`; a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-1 text-blue-400 text-[10px] font-bold hover:text-blue-300">
                          <Icon name="Download" size={11} />Скачать снова
                        </button>
                      </div>
                      <pre className="text-white/55 text-[10px] leading-relaxed overflow-auto max-h-52 whitespace-pre-wrap rounded-lg p-2"
                        style={{ background: "rgba(0,0,0,0.3)" }}>
                        {JSON.stringify(govExportData.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Заметки администратора */}
                  {req.admin_notes && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <Icon name="StickyNote" size={12} className="text-white/30 mt-0.5 flex-shrink-0" />
                      <p className="text-white/50 text-xs">{req.admin_notes}</p>
                    </div>
                  )}

                  {/* Действия */}
                  <div className="flex gap-2 flex-wrap">
                    {req.status !== "closed" && (
                      <button onClick={() => handleGovExport(req)} disabled={govExporting === req.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.3)" }}>
                        {govExporting === req.id
                          ? <><span className="w-3 h-3 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />Выгрузка...</>
                          : <><Icon name="Download" size={12} />{req.data_exported_at ? "Выгрузить снова" : "Выгрузить данные"}</>}
                      </button>
                    )}
                    {req.status !== "exported" && req.status !== "closed" && (
                      <button onClick={() => handleGovStatus(req.id, "exported")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.2)" }}>
                        <Icon name="Send" size={12} />Данные переданы
                      </button>
                    )}
                    {req.status !== "closed" && (
                      <button onClick={() => handleGovStatus(req.id, "closed")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)" }}>
                        <Icon name="CheckCheck" size={12} />Закрыть
                      </button>
                    )}
                    {req.status !== "rejected" && req.status !== "closed" && (
                      <button onClick={() => handleGovStatus(req.id, "rejected")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Icon name="XCircle" size={12} />Отклонить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SecurityTab;