import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";

export function MarketingPush({ token }: { token: string }) {
  const [channel, setChannel] = useState<"internal" | "onesignal">("internal");
  const [pushTitle, setPushTitle] = useState("");
  const [pushMsg, setPushMsg] = useState("");
  const [pushUrl, setPushUrl] = useState("");
  const [pushSegment, setPushSegment] = useState("all");
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ sent_to: number } | null>(null);
  const [pushError, setPushError] = useState("");

  const handlePush = async () => {
    if (!pushTitle.trim() || !pushMsg.trim()) return;
    setPushing(true); setPushResult(null); setPushError("");
    try {
      if (channel === "onesignal") {
        const r = await adminApi.oneSignalSend(token, pushTitle.trim(), pushMsg.trim(), pushUrl.trim());
        setPushResult({ sent_to: r.result?.recipients ?? 0 });
      } else {
        const r = await adminApi.pushBroadcast(token, pushTitle.trim(), pushMsg.trim(), pushSegment);
        setPushResult(r);
      }
      setPushTitle(""); setPushMsg(""); setPushUrl("");
    } catch (e) {
      setPushError(e instanceof Error ? e.message : "Не удалось отправить");
    } finally { setPushing(false); }
  };

  const segments = [
    { id: "all",      label: "Все",          icon: "Users" },
    { id: "premium",  label: "Premium",      icon: "Crown" },
    { id: "new_week", label: "Новые 7 дней", icon: "Sparkles" },
  ];

  const channels = [
    { id: "internal",  label: "Свои пуши",  icon: "Bell" },
    { id: "onesignal", label: "OneSignal",  icon: "Send" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Канал отправки */}
      <div className="flex flex-col gap-2">
        <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest px-1">Канал</p>
        <div className="grid grid-cols-2 gap-2">
          {channels.map(c => (
            <button key={c.id} onClick={() => setChannel(c.id as "internal" | "onesignal")}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold transition-all"
              style={channel === c.id
                ? { background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.18))", color: "white", border: "1px solid rgba(255,45,120,0.3)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon name={c.icon as "Bell"} size={16} style={{ color: channel === c.id ? "#FF2D78" : undefined }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Сегмент — только для своих пушей */}
      {channel === "internal" && (
      <div className="flex flex-col gap-2">
        <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest px-1">Аудитория</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {segments.map(s => (
            <button key={s.id} onClick={() => setPushSegment(s.id)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-all"
              style={pushSegment === s.id
                ? { background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.18))", color: "white", border: "1px solid rgba(255,45,120,0.3)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon name={s.icon as "Bell"} size={16} style={{ color: pushSegment === s.id ? "#FF2D78" : undefined }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {channel === "onesignal" && (
        <p className="text-white/40 text-xs px-1 leading-relaxed">
          Уведомление уйдёт всем подписчикам OneSignal (сегмент «Subscribed Users»).
        </p>
      )}

      {/* Форма */}
      <div className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Содержание</p>

        <input value={pushTitle} onChange={e => setPushTitle(e.target.value)}
          placeholder="Заголовок уведомления" maxLength={60}
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />

        <div>
          <textarea value={pushMsg} onChange={e => setPushMsg(e.target.value)}
            placeholder="Текст сообщения..." rows={3} maxLength={200}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
          <div className="flex justify-end mt-1">
            <span className="text-white/20 text-xs">{pushMsg.length}/200</span>
          </div>
        </div>

        {channel === "onesignal" && (
          <input value={pushUrl} onChange={e => setPushUrl(e.target.value)}
            placeholder="Ссылка при клике (необязательно), напр. /premium"
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
        )}

        {/* Превью */}
        {(pushTitle || pushMsg) && (
          <div className="rounded-2xl p-3 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              <Icon name="Heart" size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{pushTitle || "Заголовок"}</p>
              <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{pushMsg || "Текст сообщения"}</p>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/30 mt-1.5 flex-shrink-0" />
          </div>
        )}

        <button onClick={handlePush} disabled={pushing || !pushTitle.trim() || !pushMsg.trim()}
          className="py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          {pushing
            ? <><Icon name="Loader2" size={15} className="animate-spin" />Отправляю...</>
            : <><Icon name="Send" size={15} />Отправить рассылку</>}
        </button>
      </div>

      {pushResult && (
        <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(74,222,128,0.15)" }}>
            <Icon name="CheckCircle" size={16} style={{ color: "#4ADE80" }} />
          </div>
          <div>
            <p className="text-green-300 font-bold text-sm">Рассылка отправлена</p>
            <p className="text-green-400/60 text-xs">{pushResult.sent_to} пользователей получили уведомление</p>
          </div>
        </div>
      )}

      {pushError && (
        <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(248,113,113,0.15)" }}>
            <Icon name="AlertCircle" size={16} style={{ color: "#F87171" }} />
          </div>
          <div>
            <p className="text-red-300 font-bold text-sm">Не отправлено</p>
            <p className="text-red-400/60 text-xs break-all">{pushError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingPush;