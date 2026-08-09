import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { checkMediaPrereqs, describeMediaError } from "@/lib/mediaAccess";

interface Props {
  onCapture: (dataUrl: string, mimeType: string) => void;
  onClose: () => void;
  onFallback?: () => void;
}

export function PhotoCapture({ onCapture, onClose, onFallback }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState("");
  const [shot, setShot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prereq = checkMediaPrereqs("микрофону и камере");
      if (prereq) { setError(prereq); return; }

      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
        { video: { facingMode: facing }, audio: false },
        { video: true, audio: false },
      ];
      let stream: MediaStream | null = null;
      let lastErr: unknown = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (e) { lastErr = e; }
      }
      if (cancelled) { stream?.getTracks().forEach(t => t.stop()); return; }
      if (!stream) {
        setError(await describeMediaError(lastErr, "микрофону и камере", "camera"));
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  const takeShot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShot(canvas.toDataURL("image/jpeg", 0.9));
  };

  const send = () => { if (shot) onCapture(shot, "image/jpeg"); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      <div className="flex-1 relative overflow-hidden">
        {shot ? (
          <img src={shot} alt="" className="w-full h-full object-contain" />
        ) : (
          <video ref={videoRef} muted playsInline
            className="w-full h-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }} />
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Icon name="CameraOff" size={40} className="text-white/40" />
            <p className="text-white/70 text-sm">{error}</p>
            {onFallback && (
              <button onClick={onFallback}
                className="px-5 py-3 rounded-2xl text-white text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                Открыть галерею
              </button>
            )}
          </div>
        )}

        <button onClick={onClose}
          className="absolute top-5 left-5 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}>
          <Icon name="X" size={20} className="text-white" />
        </button>

        {!shot && !error && (
          <button onClick={() => setFacing(f => (f === "user" ? "environment" : "user"))}
            className="absolute top-5 right-5 w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)" }}>
            <Icon name="SwitchCamera" size={20} className="text-white" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-8 py-8"
        style={{ background: "rgba(0,0,0,0.9)", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        {shot ? (
          <>
            <button onClick={() => setShot(null)}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <Icon name="RotateCcw" size={20} className="text-white" />
            </button>
            <button onClick={send}
              className="w-20 h-20 rounded-full flex items-center justify-center btn-grad"
              style={{ boxShadow: "0 0 30px rgba(255,45,120,0.5)" }}>
              <Icon name="Send" size={28} className="text-white" />
            </button>
            <div className="w-14 h-14" />
          </>
        ) : (
          <button onClick={takeShot} disabled={!!error}
            className="w-20 h-20 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: "#fff", boxShadow: "0 0 0 4px rgba(255,255,255,0.25)" }}>
            <div className="w-16 h-16 rounded-full" style={{ background: "#fff", border: "2px solid #000" }} />
          </button>
        )}
      </div>
    </div>
  );
}

export default PhotoCapture;
