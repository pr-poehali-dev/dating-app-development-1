import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const STORIES_URL = "https://functions.poehali.dev/bb965e64-26b6-440e-9d6d-c746aa07b497";

export function StoryUploadSheet({ onClose, onUploaded }: {
  onClose: () => void;
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) { setError("Только видео файлы"); return; }
    if (f.size > 50 * 1024 * 1024) { setError("Файл слишком большой (макс 50 МБ)"); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");

    const post = async (body: object) => {
      const token = localStorage.getItem("spark_token") || "";
      const res = await fetch(STORIES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Ошибка ${res.status}`);
      return d;
    };

    const toBase64 = (blob: Blob): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Ошибка чтения файла"));
        reader.readAsDataURL(blob);
      });

    try {
      const duration = videoRef.current?.duration || 0;
      const CHUNK = 3 * 1024 * 1024; // 3 МБ

      // Шаг 1: инициализация
      setProgress(5);
      const { upload_id, key } = await post({ action: "upload_init", content_type: file.type });

      // Шаг 2: чанки
      const totalChunks = Math.ceil(file.size / CHUNK);
      const parts: { etag: string; part_number: number }[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * CHUNK, (i + 1) * CHUNK);
        const data = await toBase64(chunk);
        const part = await post({ action: "upload_chunk", upload_id, key, part_number: i + 1, data });
        parts.push({ etag: part.etag, part_number: part.part_number });
        setProgress(5 + Math.round(((i + 1) / totalChunks) * 85));
      }

      // Шаг 3: завершение
      setProgress(92);
      await post({ action: "upload_complete", upload_id, key, parts, duration: Math.round(duration) });

      setProgress(100);
      onUploaded?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка соединения");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm animate-slide-up flex flex-col"
        style={{ background: "#1a1625", borderRadius: "24px 24px 0 0", maxHeight: "92dvh" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <Icon name="X" size={20} />
          </button>
          <h3 className="text-white font-bold text-sm">Новая видеоистория</h3>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-grad px-4 py-1.5 text-sm font-semibold disabled:opacity-40"
          >
            {uploading ? `${progress}%` : "Опубликовать"}
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5 overflow-y-auto">
          {!previewUrl ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-72 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 hover:border-pink-500/50 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                <Icon name="Film" size={28} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Выбрать видео</p>
                <p className="text-white/40 text-xs mt-1">MP4, MOV, WebM · макс 50 МБ</p>
              </div>
            </button>
          ) : (
            <div className="relative w-full aspect-[9/16] max-h-72 rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                src={previewUrl}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
              {!uploading && (
                <button
                  onClick={() => { setFile(null); setPreviewUrl(null); setProgress(0); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                >
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
          )}

          {/* Прогресс-бар */}
          {uploading && (
            <div className="flex flex-col gap-2">
              <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg,#FF2D78,#9B59B6)" }} />
              </div>
              <p className="text-white/40 text-xs text-center">
                {progress < 20 ? "Подготовка..." : progress < 90 ? "Загрузка видео..." : "Публикация..."}
              </p>
            </div>
          )}

          <div className="glass-card p-3 flex items-start gap-3">
            <Icon name="Info" size={16} className="text-pink-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/50 text-xs leading-relaxed">
              История будет видна всем пользователям в течение <span className="text-white/70 font-semibold">24 часов</span>, после чего автоматически удалится.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}