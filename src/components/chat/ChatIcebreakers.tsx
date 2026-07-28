import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { messagesApi } from "@/lib/api";

// Показывает ИИ-подсказки для начала разговора, когда переписки ещё нет.
export function ChatIcebreakers({ matchId, onPick }: { matchId: number; onPick: (text: string) => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    messagesApi.icebreakers(matchId)
      .then(d => { if (alive) setLines(d.icebreakers || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [matchId]);

  if (hidden || (!loading && lines.length === 0)) return null;

  return (
    <div className="px-3 pb-2 pt-1">
      <div className="rounded-2xl p-3"
        style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.1),rgba(155,89,182,0.1))", border: "1px solid rgba(255,45,120,0.22)" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Icon name="Sparkles" size={14} className="text-pink-400" />
          <span className="text-white/80 text-xs font-bold flex-1">С чего начать разговор</span>
          <button onClick={() => setHidden(true)} className="text-white/35 hover:text-white/60">
            <Icon name="X" size={14} />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-1.5">
            <Icon name="Loader2" size={14} className="animate-spin text-white/40" />
            <span className="text-white/40 text-xs">ИИ подбирает фразы...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {lines.map((l, i) => (
              <button key={i} onClick={() => onPick(l)}
                className="text-left rounded-xl px-3 py-2 text-white/90 text-[13px] leading-snug active:scale-[0.98] transition-all flex items-center gap-2"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="flex-1">{l}</span>
                <Icon name="ArrowUp" size={13} className="text-pink-400/70 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatIcebreakers;
