import { useState } from "react";
import Icon from "@/components/ui/icon";

const EXPORT_URL = "https://functions.poehali.dev/2c66a0fc-d285-4c8d-a3ad-edca0d8330c3";

interface ExportResult {
  url: string;
  tables: number;
  rows: number;
  size_kb: number;
}

export function AdminBackup({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const runExport = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${EXPORT_URL}?token=${encodeURIComponent(token)}`);
      const text = await res.text();
      if (!res.ok) {
        setError(
          res.status === 402
            ? "Достигнут лимит вызовов функций. Обнови подписку — и выгрузка заработает."
            : res.status === 403
            ? "Нет доступа: неверный админ-токен."
            : text.slice(0, 200) || "Не удалось создать выгрузку"
        );
        return;
      }
      setResult(JSON.parse(text));
    } catch {
      setError("Сервер не ответил. Попробуй ещё раз через минуту.");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}
          >
            <Icon name="DatabaseBackup" size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Резервная копия базы</h2>
            <p className="text-white/40 text-sm mt-1">
              Все таблицы и записи проекта в одном файле. Подходит для переноса на свой сервер.
            </p>
          </div>
        </div>

        <button
          onClick={runExport}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Icon name="Loader2" size={16} className="animate-spin" />
              Собираю копию…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Icon name="Download" size={16} />
              Создать копию
            </span>
          )}
        </button>

        {loading && (
          <p className="text-white/30 text-xs text-center mt-3">
            Это занимает до минуты — не закрывай страницу
          </p>
        )}
      </div>

      {error && (
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          <Icon name="TriangleAlert" size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Icon name="CircleCheck" size={18} className="text-green-400" />
            <span className="text-green-200 font-semibold text-sm">Копия готова</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Таблиц", value: result.tables },
              { label: "Записей", value: result.rows.toLocaleString("ru") },
              { label: "Размер", value: `${(result.size_kb / 1024).toFixed(1)} МБ` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 text-center"
                style={{ background: "rgba(0,0,0,0.25)" }}
              >
                <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                <p className="text-white/35 text-[11px] mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={result.url}
              download
              className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}
            >
              <Icon name="Download" size={15} />
              Скачать файл
            </a>
            <button
              onClick={copyUrl}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white/70 text-sm flex items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <Icon name={copied ? "Check" : "Link"} size={15} />
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </button>
          </div>

          <p className="text-white/30 text-[11px] mt-3 leading-relaxed">
            Ссылка одноразовая и у каждой копии своя. Не публикуй её — файл содержит все данные
            пользователей.
          </p>
        </div>
      )}

      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">
          Как залить на свой сервер
        </p>
        <div className="space-y-2 text-white/45 text-sm">
          <p>1. Нажми «Создать копию», затем «Скопировать ссылку».</p>
          <p>2. На своём сервере выполни две команды, подставив ссылку:</p>
        </div>
        <pre
          className="mt-3 p-3 rounded-xl text-[11px] text-white/60 overflow-x-auto"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
{`curl -o dump.sql "ССЫЛКА"
psql -U ПОЛЬЗОВАТЕЛЬ -d БАЗА -f dump.sql`}
        </pre>
      </div>
    </div>
  );
}

export default AdminBackup;
