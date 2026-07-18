import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";
import { Spinner } from "./AdminLogin";
import { InputRow } from "./SecurityShared";
import { useState, useEffect } from "react";

type Stopword = { id: number; word: string; created_at: string };

export function SecurityStopwords({ token }: { token: string }) {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadWords(); }, []);

  return (
    <div className="flex flex-col gap-4">
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
  );
}

export default SecurityStopwords;