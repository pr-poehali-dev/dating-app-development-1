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

    try {
      const token = localStorage.getItem("spark_token") || "";
      const duration = videoRef.current?.duration || 0;

      // Шаг 1: получаем ссылку для прямой загрузки
      setProgress(8);
      const presignRes = await fetch(STORIES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ action: "presign", content_type: file.type }),
      });
      if (!presignRes.ok) {
        const d = await presignRes.json().catch(() => ({}));
        setError(d.error || "Ошибка подготовки загрузки");
        return;
      }
      const { upload_url, key, content_type } = await presignRes.json();
      setProgress(15);

      // Шаг 2: грузим файл напрямую в хранилище (Content-Type включён в подпись)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", content_type || file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(15 + Math.round((e.loaded / e.total) * 75));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Ошибка загрузки файла (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Ошибка загрузки файла"));
        xhr.send(file);
      });
      setProgress(92);

      // Шаг 3: создаём запись истории
      const createRes = await fetch(STORIES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ action: "create", key, duration: Math.round(duration) }),
      });
      if (!createRes.ok) {
        const d = await createRes.json().catch(() => ({}));
        setError(d.error || "Ошибка публикации");
        return;
      }

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