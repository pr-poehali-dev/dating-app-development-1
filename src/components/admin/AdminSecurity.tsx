import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";

type BlockedIp = { id: number; ip_address: string; reason: string; created_at: string };
type Stopword  = { id: number; word: string; created_at: string };

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
      setNewIp(""); setNewIpReason("");
      loadIps();
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
    try {
      await adminApi.addStopword(token, newWord.trim());
      setNewWord("");
      loadWords();
    } catch { void 0; } finally { setWordSaving(false); }
  };

  const handleDeleteWord = async (id: number) => {
    await adminApi.deleteStopword(token, id).catch(() => {});
    loadWords();
  };

  useEffect(() => {
    if (section === "ips") loadIps();
    else loadWords();
  }, [section]);

  const sections = [
    { id: "ips"   as const, label: "Блокировка IP", icon: "Shield" },
    { id: "words" as const, label: "Стоп-слова",    icon: "AlertTriangle" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={section === s.id
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", color: "white" }
              : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
            <Icon name={s.icon as "Shield"} size={13} />{s.label}
          </button>
        ))}
      </div>

      {/* ── IP ── */}
      {section === "ips" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white font-semibold text-sm">Заблокировать IP</p>
            <input value={newIp} onChange={e => setNewIp(e.target.value)}
              placeholder="IP-адрес (напр. 192.168.1.1)"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <input value={newIpReason} onChange={e => setNewIpReason(e.target.value)}
              placeholder="Причина блокировки"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <button onClick={handleBlockIp} disabled={ipSaving || !newIp.trim()}
              className="py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#EF4444,#B91C1C)" }}>
              {ipSaving ? "Блокирую..." : "Заблокировать"}
            </button>
          </div>

          {ipsLoading ? <Spinner /> : (
            <div className="flex flex-col gap-2">
              {ips.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="ShieldCheck" size={32} className="text-white/15 mx-auto mb-2" />
                  <p className="text-white/30 text-sm">Заблокированных IP нет</p>
                </div>
              ) : ips.map(ip => (
                <div key={ip.id} className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <Icon name="Shield" size={16} style={{ color: "#F87171" }} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-mono text-sm">{ip.ip_address}</p>
                    <p className="text-white/40 text-xs truncate">{ip.reason}</p>
                  </div>
                  <p className="text-white/25 text-[10px] flex-shrink-0">{new Date(ip.created_at).toLocaleDateString("ru")}</p>
                  <button onClick={() => handleUnblockIp(ip.id)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95"
                    style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.25)" }}>
                    Снять
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Стоп-слова ── */}
      {section === "words" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white font-semibold text-sm">Добавить стоп-слово</p>
            <p className="text-white/35 text-xs">Слова и фразы, которые будут автоматически фильтроваться из профилей и сообщений</p>
            <div className="flex gap-2">
              <input value={newWord} onChange={e => setNewWord(e.target.value)}
                placeholder="Слово или фраза..."
                onKeyDown={e => e.key === "Enter" && handleAddWord()}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <button onClick={handleAddWord} disabled={wordSaving || !newWord.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                {wordSaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : "Добавить"}
              </button>
            </div>
          </div>

          {wordsLoading ? <Spinner /> : (
            <div>
              <p className="text-white/40 text-xs mb-2">{words.length} стоп-слов</p>
              <div className="flex flex-wrap gap-2">
                {words.length === 0 ? (
                  <p className="text-white/25 text-sm py-4">Стоп-слов нет</p>
                ) : words.map(w => (
                  <div key={w.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <span className="text-red-300 text-xs font-mono">{w.word}</span>
                    <button onClick={() => handleDeleteWord(w.id)}
                      className="text-white/30 hover:text-red-400 transition-colors">
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SecurityTab;
