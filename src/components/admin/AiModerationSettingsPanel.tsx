import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminReq } from "./SecurityShared";
import { Spinner } from "./AdminLogin";

function ConnectionTest({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [message, setMessage] = useState("");

  const test = async () => {
    setState("loading");
    try {
      const d = await adminReq(token, "ai_test_connection");
      if (d.ok) {
        setState("ok");
        setMessage(`Соединение с RouterAI работает (тестовый score: ${d.sample_score})`);
      } else {
        setState("fail");
        setMessage(d.error || "Не удалось подключиться");
      }
    } catch {
      setState("fail");
      setMessage("Ошибка сети");
    }
  };

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-white text-sm font-semibold">Проверка подключения к RouterAI</p>
          <p className="text-white/35 text-xs mt-0.5">Отправит тестовый запрос и покажет результат</p>
        </div>
        <button onClick={test} disabled={state === "loading"}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          {state === "loading" ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Zap" size={13} />}
          Тест
        </button>
      </div>
      {state === "ok" && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: "#4ADE80" }}>
          <Icon name="CheckCircle2" size={13} /> {message}
        </p>
      )}
      {state === "fail" && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: "#F87171" }}>
          <Icon name="XCircle" size={13} /> {message}
        </p>
      )}
    </div>
  );
}

export function AiModerationSettingsPanel({ token }: { token: string }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminReq(token, "ai_settings").then(d => setSettings(d.settings || {})).catch(() => {}).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const toggle = async (key: string) => {
    const next = settings[key] === "true" ? "false" : "true";
    setSettings(s => ({ ...s, [key]: next }));
    setSaving(true);
    await adminReq(token, "ai_settings_update", { settings: { [key]: next } }).catch(() => {});
    setSaving(false);
  };

  const updateThreshold = async (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }));
  };

  const saveThreshold = async (key: string) => {
    setSaving(true);
    await adminReq(token, "ai_settings_update", { settings: { [key]: settings[key] } }).catch(() => {});
    setSaving(false);
  };

  if (loading) return <Spinner />;

  const toggles: { key: string; label: string; desc: string }[] = [
    { key: "text_moderation_enabled", label: "Проверка текста", desc: "Сообщения проверяются на спам и оскорбления" },
    { key: "photo_moderation_enabled", label: "Проверка фото", desc: "Посты и фото профиля проверяются на NSFW-контент" },
    { key: "selfie_verification_enabled", label: "Проверка селфи", desc: "Сверка селфи с фото профиля при верификации" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <ConnectionTest token={token} />
      {toggles.map(t => (
        <div key={t.key} className="rounded-2xl p-4 flex items-center justify-between gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <p className="text-white text-sm font-semibold">{t.label}</p>
            <p className="text-white/35 text-xs mt-0.5">{t.desc}</p>
          </div>
          <button onClick={() => toggle(t.key)} disabled={saving}
            className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
            style={{ background: settings[t.key] === "true" ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.15)" }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: settings[t.key] === "true" ? "22px" : "2px" }} />
          </button>
        </div>
      ))}

      <div className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <p className="text-white text-sm font-semibold">Порог автоблокировки</p>
          <p className="text-white/35 text-xs mt-0.5">При уверенности ИИ выше этого % контент блокируется сразу ({settings.auto_block_threshold || "85"}%)</p>
        </div>
        <input type="range" min="50" max="100" value={settings.auto_block_threshold || "85"}
          onChange={e => updateThreshold("auto_block_threshold", e.target.value)}
          onMouseUp={() => saveThreshold("auto_block_threshold")}
          onTouchEnd={() => saveThreshold("auto_block_threshold")}
          className="w-full accent-pink-500" />
      </div>

      <div className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <p className="text-white text-sm font-semibold">Порог отправки на проверку</p>
          <p className="text-white/35 text-xs mt-0.5">При уверенности выше этого % — контент попадает в очередь модератору ({settings.review_threshold || "40"}%)</p>
        </div>
        <input type="range" min="10" max="80" value={settings.review_threshold || "40"}
          onChange={e => updateThreshold("review_threshold", e.target.value)}
          onMouseUp={() => saveThreshold("review_threshold")}
          onTouchEnd={() => saveThreshold("review_threshold")}
          className="w-full accent-pink-500" />
      </div>
    </div>
  );
}

export default AiModerationSettingsPanel;
