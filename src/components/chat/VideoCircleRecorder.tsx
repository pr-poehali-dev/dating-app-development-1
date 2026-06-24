import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const MAX_SECS = 60;

interface Props {
  onSend: (blob: Blob, mimeType: string) => void;
  onClose: () => void;
}

export function VideoCircleRecorder({ onSend, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<"preview" | "recording" | "done">("preview");
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultMime, setResultMime] = useState("video/webm");

  // Запускаем камеру сразу
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width:  { ideal: 1920, min: 720 },
            height: { ideal: 1920, min: 720 },
            frameRate: { ideal: 60, min: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000,
            channelCount: 2,
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch {
        setError("Нет доступа к камере или микрофону");
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;

    // Выбираем лучший доступный кодек
    const mimeType = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/mp4;codecs=h264,aac",
      "video/webm",
      "video/mp4",
    ].find(t => MediaRecorder.isTypeSupported(t)) ?? "video/webm";

    setResultMime(mimeType.split(";")[0]);
    chunksRef.current = [];

    // Максимальный битрейт: 8 Мбит/с видео + 192 кбит/с аудио
    const mr = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
      audioBitsPerSecond: 192_000,
    });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] });
      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setPreviewUrl(url);
      setPhase("done");
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    mr.start(250);
    mediaRecorderRef.current = mr;
    setPhase("recording");
    setSecs(0);
    timerRef.current = setInterval(() => {
      setSecs(s => {
        if (s + 1 >= MAX_SECS) {
          stopRecording();
          return MAX_SECS;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
  };

  const handleSend = () => {
    if (resultBlob) onSend(resultBlob, resultMime);
  };

  const progress = (secs / MAX_SECS) * 283; // circumference ≈ 283

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}>

      {/* Кружок с видео */}
      <div className="relative" style={{ width: 260, height: 260 }}>
        {/* Прогресс-кольцо */}
        {phase === "recording" && (
          <svg className="absolute inset-0" width="260" height="260" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="130" cy="130" r="125" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle cx="130" cy="130" r="125" fill="none" stroke="#FF2D78" strokeWidth="4"
              strokeDasharray="785" strokeDashoffset={785 - (secs / MAX_SECS) * 785}
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
        )}

        {/* Круглое видео */}
        <div className="absolute inset-2 rounded-full overflow-hidden bg-black">
          {phase !== "done" ? (
            <video ref={videoRef} muted playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} />
          ) : previewUrl ? (
            <video src={previewUrl} loop autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} />
          ) : null}
        </div>

        {/* Таймер */}
        {phase === "recording" && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-mono">
              {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      {/* Кнопки управления */}
      <div className="flex items-center gap-6 mt-8">
        {/* Отмена */}
        <button onClick={onClose}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)" }}>
          <Icon name="X" size={22} className="text-white" />
        </button>

        {/* Главная кнопка */}
        {phase === "preview" && (
          <button onClick={startRecording}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 0 30px rgba(255,45,120,0.5)" }}>
            <Icon name="Video" size={30} className="text-white" />
          </button>
        )}
        {phase === "recording" && (
          <button onClick={stopRecording}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.9)", boxShadow: "0 0 30px rgba(239,68,68,0.5)" }}>
            <div className="w-8 h-8 rounded-md bg-white" />
          </button>
        )}
        {phase === "done" && (
          <button onClick={handleSend}
            className="w-20 h-20 rounded-full flex items-center justify-center btn-grad"
            style={{ boxShadow: "0 0 30px rgba(255,45,120,0.5)" }}>
            <Icon name="Send" size={28} className="text-white" />
          </button>
        )}

        {/* Переснять */}
        {phase === "done" ? (
          <button onClick={() => { setPhase("preview"); setPreviewUrl(null); setResultBlob(null); setSecs(0); }}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <Icon name="RotateCcw" size={20} className="text-white" />
          </button>
        ) : (
          <div className="w-14 h-14" />
        )}
      </div>

      <p className="text-white/30 text-xs mt-4">
        {phase === "preview" && "Нажми для записи"}
        {phase === "recording" && `Нажми ■ чтобы остановить · макс. ${MAX_SECS} сек`}
        {phase === "done" && "Нажми ▶ чтобы отправить"}
      </p>
    </div>
  );
}

export default VideoCircleRecorder;