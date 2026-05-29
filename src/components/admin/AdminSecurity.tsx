import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";

type BlockedIp = { id: number; ip_address: string; reason: string; created_at: string };
type Stopword  = { id: number; word: string; created_at: string };

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

export function SecurityTab({ token }: { token: string }) {
  const [section, setSection] = useState<"ips" | "words">("ips");

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

  useEffect(() => {
    if (section === "ips") loadIps();
    else loadWords();
  }, [section]);

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={section}
        onChange={v => setSection(v as "ips" | "words")}
        options={[
          { id: "ips",   label: "Блокировка IP",  icon: "Shield" },
          { id: "words", label: "Стоп-слова",      icon: "AlertTriangle" },
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
    </div>
  );
}

export default SecurityTab;
