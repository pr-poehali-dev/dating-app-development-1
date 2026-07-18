import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { compatibilityApi, type CompatGame, type CompatQuestion } from "@/lib/api";

const SCORE_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  0: { label: "Совсем не совпали", color: "#9ca3af", emoji: "🤔" },
  1: { label: "Почти не совпали", color: "#f97316", emoji: "😅" },
  2: { label: "Немного похожи", color: "#eab308", emoji: "🙂" },
  3: { label: "Неплохое совпадение!", color: "#84cc16", emoji: "😊" },
  4: { label: "Хорошие совпадения!", color: "#22c55e", emoji: "😄" },
  5: { label: "Почти идеально!", color: "#10b981", emoji: "🥰" },
};

interface Props {
  matchId: number;
  partnerId: number;
  partnerName: string;
  partnerPhoto: string;
  currentUserId: number;
  onClose: () => void;
}

export function CompatibilityGame({ matchId, partnerId, partnerName, partnerPhoto, currentUserId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [game, setGame] = useState<CompatGame | null>(null);
  const [questions, setQuestions] = useState<CompatQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [step, setStep] = useState<"intro" | "playing" | "waiting" | "results">("intro");
  const [submitting, setSubmitting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  void currentUserId;

  const load = async () => {
    try {
      const res = await compatibilityApi.get(matchId);
      if (res.game) {
        setGame(res.game);
        setQuestions(res.questions);
        if (res.game.status === "finished") {
          setStep("results");
        } else if (res.game.my_answered) {
          setStep("waiting");
          startPolling(res.game.id);
        } else {
          setStep("playing");
        }
      } else {
        setStep("intro");
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    return () => { if (pollInterval) clearInterval(pollInterval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const startPolling = (gameId: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await compatibilityApi.getById(gameId);
        if (res.game?.status === "finished") {
          setGame(res.game);
          setQuestions(res.questions);
          setStep("results");
          clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 3000);
    setPollInterval(interval);
  };

  const handleStart = async () => {
    setCreating(true);
    try {
      const res = await compatibilityApi.create(matchId, partnerId);
      const gameRes = await compatibilityApi.getById(res.game_id);
      if (gameRes.game) {
        setGame(gameRes.game);
        setQuestions(gameRes.questions);
        if (gameRes.game.my_answered) {
          setStep("waiting");
          startPolling(gameRes.game.id);
        } else {
          setStep("playing");
        }
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleAnswer = (qIdx: number, ansIdx: number) => {
    setAnswers(prev => ({ ...prev, [qIdx]: ansIdx }));
    if (qIdx < questions.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 300);
    }
  };

  const handleSubmit = async () => {
    if (!game) return;
    setSubmitting(true);
    try {
      const res = await compatibilityApi.answer(game.id, answers);
      if (res.finished) {
        const gameRes = await compatibilityApi.getById(game.id);
        if (gameRes.game) { setGame(gameRes.game); setQuestions(gameRes.questions); }
        setStep("results");
      } else {
        setStep("waiting");
        startPolling(game.id);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);
  const score = game?.score_creator ?? 0;
  const scoreInfo = SCORE_LABELS[Math.min(score, 5)];
  const percent = Math.round((score / Math.max(questions.length, 1)) * 100);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full max-h-[92dvh] flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg,#1a0a2e,#120818)" }}
        onClick={e => e.stopPropagation()}>

        {/* Шапка */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              <span className="text-lg">💘</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Испытание совместимости</p>
              <p className="text-white/40 text-xs">с {partnerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

          {/* Загрузка */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Icon name="Loader2" size={32} className="text-pink-400 animate-spin" />
            </div>
          )}

          {/* Интро */}
          {!loading && step === "intro" && (
            <div className="flex flex-col items-center px-6 py-8 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-3"
                  style={{ border: "3px solid rgba(255,45,120,0.5)" }}>
                  <img src={partnerPhoto} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-2xl">💘</div>
              </div>
              <div className="text-center">
                <h2 className="text-white font-black text-xl mb-2">Насколько вы совместимы?</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Ответьте на 5 одинаковых вопросов независимо друг от друга. Чем больше совпадений — тем лучше!
                </p>
              </div>
              <div className="w-full flex flex-col gap-2.5">
                {[
                  { icon: "HelpCircle", text: "5 вопросов о предпочтениях" },
                  { icon: "EyeOff", text: "Ответы скрыты до финала" },
                  { icon: "Percent", text: "Результат — процент совместимости" },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Icon name={item.icon as "HelpCircle"|"EyeOff"|"Percent"} size={16} className="text-pink-400 flex-shrink-0" />
                    <p className="text-white/70 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleStart} disabled={creating}
                className="w-full py-4 rounded-2xl text-white font-bold text-base active:scale-95 transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 4px 24px rgba(255,45,120,0.4)" }}>
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Loader2" size={18} className="animate-spin" />Создаём игру...
                  </span>
                ) : "Начать испытание 💘"}
              </button>
            </div>
          )}

          {/* Игровой экран — вопросы */}
          {!loading && step === "playing" && questions.length > 0 && (
            <div className="px-5 py-6 flex flex-col gap-4">
              {/* Прогресс */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1 flex-1">
                  {questions.map((_, i) => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all"
                      style={{
                        background: answers[i] !== undefined
                          ? "linear-gradient(90deg,#FF2D78,#9B59B6)"
                          : i === currentQ
                            ? "rgba(255,45,120,0.4)"
                            : "rgba(255,255,255,0.1)",
                      }} />
                  ))}
                </div>
                <span className="text-white/40 text-xs flex-shrink-0">{currentQ + 1}/{questions.length}</span>
              </div>

              {/* Вопросы */}
              {questions.map((q, qi) => (
                <div key={qi}
                  className="transition-all duration-300"
                  style={{ display: qi === currentQ ? "block" : "none" }}>
                  <p className="text-white font-bold text-lg leading-snug mb-4">{q.text}</p>
                  <div className="flex flex-col gap-2.5">
                    {q.options.map((opt, oi) => {
                      const selected = answers[qi] === oi;
                      return (
                        <button key={oi} onClick={() => handleAnswer(qi, oi)}
                          className="w-full text-left px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] font-semibold text-sm"
                          style={{
                            background: selected
                              ? "linear-gradient(135deg,#FF2D78,#9B59B6)"
                              : "rgba(255,255,255,0.06)",
                            border: selected
                              ? "none"
                              : "1px solid rgba(255,255,255,0.1)",
                            color: selected ? "#fff" : "rgba(255,255,255,0.7)",
                            boxShadow: selected ? "0 2px 16px rgba(255,45,120,0.35)" : "none",
                          }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Навигация */}
              <div className="flex gap-3 mt-2">
                {currentQ > 0 && (
                  <button onClick={() => setCurrentQ(q => q - 1)}
                    className="px-4 py-3 rounded-2xl text-white/60 text-sm font-semibold"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    ← Назад
                  </button>
                )}
                {currentQ < questions.length - 1 && answers[currentQ] !== undefined && (
                  <button onClick={() => setCurrentQ(q => q + 1)}
                    className="flex-1 py-3 rounded-2xl text-white text-sm font-bold"
                    style={{ background: "rgba(255,45,120,0.3)" }}>
                    Следующий →
                  </button>
                )}
                {allAnswered && (
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-3 rounded-2xl text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 16px rgba(255,45,120,0.4)" }}>
                    {submitting ? "Отправляем..." : "Отправить ответы 🚀"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ожидание партнёра */}
          {!loading && step === "waiting" && (
            <div className="flex flex-col items-center px-6 py-10 gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden"
                  style={{ border: "3px solid rgba(255,45,120,0.4)" }}>
                  <img src={partnerPhoto} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs">⏳</div>
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-1">Ждём {partnerName}</h3>
                <p className="text-white/50 text-sm">Ты уже ответил(а). Как только {partnerName} завершит — увидите результат!</p>
              </div>
              <div className="flex gap-1 mt-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: "#FF2D78", animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)}40%{transform:scale(1)} }`}</style>
            </div>
          )}

          {/* Результаты */}
          {!loading && step === "results" && game && (
            <div className="flex flex-col gap-4 pb-2">
              {/* Hero-блок результата */}
              <div className="relative flex flex-col items-center pt-8 pb-6 px-5 overflow-hidden">
                {/* Фоновое свечение */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${scoreInfo?.color ?? "#FF2D78"}22 0%, transparent 70%)` }} />

                {/* Большое SVG-кольцо */}
                <div className="relative mb-4">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF2D78" />
                        <stop offset="100%" stopColor="#9B59B6" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    {/* Трек */}
                    <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    {/* Прогресс */}
                    <circle cx="80" cy="80" r="66" fill="none"
                      stroke="url(#ringGrad)" strokeWidth="12"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      strokeDasharray={`${2 * Math.PI * 66}`}
                      strokeDashoffset={`${2 * Math.PI * 66 * (1 - percent / 100)}`}
                      transform="rotate(-90 80 80)"
                      style={{ transition: "stroke-dashoffset 1s ease" }} />
                    {/* Центр */}
                    <text x="80" y="72" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" opacity="0.5">совместимость</text>
                    <text x="80" y="96" textAnchor="middle" fill="white" fontSize="32" fontWeight="900">{percent}%</text>
                  </svg>
                  {/* Эмодзи поверх */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ background: "linear-gradient(135deg,#1a0a2e,#2d1b4e)", border: "2px solid rgba(255,255,255,0.1)" }}>
                    {scoreInfo?.emoji ?? "💘"}
                  </div>
                </div>

                {/* Лейбл */}
                <div className="text-center">
                  <p className="text-white font-black text-xl leading-tight">{scoreInfo?.label}</p>
                  <p className="text-white/40 text-sm mt-1">
                    {score} из {questions.length} ответов совпало
                  </p>
                </div>

                {/* Мини-шкала уровней */}
                <div className="flex items-center gap-1 mt-4 w-full max-w-xs">
                  {[0,1,2,3,4,5].map(lvl => (
                    <div key={lvl} className="flex-1 h-1.5 rounded-full transition-all"
                      style={{
                        background: lvl < score
                          ? `linear-gradient(90deg,#FF2D78,#9B59B6)`
                          : lvl === score
                            ? (scoreInfo?.color ?? "#FF2D78") + "88"
                            : "rgba(255,255,255,0.08)",
                      }} />
                  ))}
                </div>
              </div>

              {/* Разбор по вопросам */}
              <div className="px-4">
                <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-3 px-1">Разбор ответов</p>
                <div className="flex flex-col gap-2.5">
                {questions.map((q, i) => {
                  const match = q.creator_answer === q.partner_answer;
                  const myAns = game.is_creator ? q.creator_answer : q.partner_answer;
                  const theirAns = game.is_creator ? q.partner_answer : q.creator_answer;
                  return (
                    <div key={i} className="rounded-2xl overflow-hidden"
                      style={{
                        background: match
                          ? "linear-gradient(135deg,rgba(34,197,94,0.08),rgba(16,185,129,0.04))"
                          : "rgba(255,255,255,0.03)",
                        border: match
                          ? "1px solid rgba(34,197,94,0.2)"
                          : "1px solid rgba(255,255,255,0.06)",
                      }}>
                      {/* Вопрос */}
                      <div className="flex items-center gap-2.5 px-3 py-2.5"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[11px]"
                          style={{
                            background: match ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)",
                            color: match ? "#4ade80" : "#f87171",
                          }}>
                          {match ? "✓" : "✗"}
                        </div>
                        <p className="text-white/70 text-xs font-medium leading-snug flex-1">{q.text}</p>
                      </div>
                      {/* Ответы */}
                      <div className="flex">
                        <div className="flex-1 px-3 py-2 text-center"
                          style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                          <p className="text-[10px] text-white/30 mb-0.5">Ты</p>
                          <p className="text-xs font-bold text-pink-300">
                            {myAns !== null && myAns !== undefined ? q.options[myAns] : "—"}
                          </p>
                        </div>
                        <div className="flex-1 px-3 py-2 text-center">
                          <p className="text-[10px] text-white/30 mb-0.5">{partnerName}</p>
                          <p className="text-xs font-bold text-purple-300">
                            {theirAns !== null && theirAns !== undefined ? q.options[theirAns] : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 px-4 pb-6">
                <button onClick={handleStart}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm active:scale-95 transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Сыграть ещё
                </button>
                <button onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm active:scale-95 transition-all"
                  style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                  Закрыть
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}