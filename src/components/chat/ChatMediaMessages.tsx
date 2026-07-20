import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ProtectedImage } from "@/components/ui/ProtectedImage";
import { PhotoZoomViewer } from "@/components/ui/PhotoZoomViewer";

// ─── VanishPhoto ──────────────────────────────────────────────────────────────
export function VanishPhoto({ url, out }: { url: string; out: boolean }) {
  const [visible, setVisible] = useState(true);
  const [opened, setOpened] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!opened || out) return;
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timer); setVisible(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [opened, out]);

  if (!visible) {
    return (
      <div className="flex items-center gap-2 px-1 opacity-40">
        <Icon name="Timer" size={14} className="text-white/50" />
        <span className="text-xs text-white/50">Фото исчезло</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {opened || out ? (
          <ProtectedImage src={url} className="rounded-xl cursor-pointer active:scale-95 transition-transform"
            style={{ width: 200, height: 200, objectFit: "cover" }}
            onClick={() => setLightbox(true)} />
        ) : (
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(255,45,120,0.18), rgba(155,89,182,0.15))",
              border: "1.5px solid rgba(255,45,120,0.35)",
              boxShadow: "0 4px 16px rgba(255,45,120,0.12)",
              minWidth: 190,
            }}
            onClick={() => !out && setOpened(true)}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                boxShadow: "0 3px 10px rgba(255,45,120,0.45)",
              }}>
              <Icon name="Lock" size={16} className="text-white" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-[13px] font-semibold leading-tight">
                Приватное фото
              </span>
              <span className="text-[11px]" style={{ color: "rgba(255,45,120,0.9)" }}>
                {out ? "Ожидает просмотра" : "Нажми, чтобы открыть →"}
              </span>
            </div>
          </div>
        )}
        {opened && !out && (
          <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full text-white text-[11px] font-bold"
            style={{ background: "rgba(0,0,0,0.65)" }}>
            🔥 {secondsLeft}с
          </div>
        )}
      </div>

      {lightbox && (
        <PhotoZoomViewer
          src={url}
          watermark="Полутон · скриншот запрещён"
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}

// ─── VideoCircleMessage ───────────────────────────────────────────────────────
export function VideoCircleMessage({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="relative cursor-pointer active:scale-95 transition-transform" style={{ width: 160, height: 160 }}
      onClick={toggle}>
      <video ref={videoRef} src={url} loop playsInline
        className="w-full h-full object-cover rounded-full"
        style={{ border: "2.5px solid rgba(255,45,120,0.6)" }}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{ background: "rgba(0,0,0,0.35)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,45,120,0.85)" }}>
            <Icon name="Play" size={22} className="text-white" style={{ marginLeft: 3 }} />
          </div>
        </div>
      )}
    </div>
  );
}