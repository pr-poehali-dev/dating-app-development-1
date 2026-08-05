import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ProtectedImage } from "@/components/ui/ProtectedImage";
import { PhotoZoomViewer } from "@/components/ui/PhotoZoomViewer";
import { SparkleVeil } from "@/components/chat/SparkleVeil";

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
      <div className="relative rounded-2xl overflow-hidden"
        style={{ width: 200, height: 200, background: "#000", border: "1px solid rgba(255,255,255,0.06)" }}>
        <SparkleVeil width={200} height={200} density={0.02} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <Icon name="EyeOff" size={22} className="text-white/40" />
          <span className="text-white/40 text-[12px]">Фото исчезло</span>
        </div>
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
            className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
            style={{
              width: 200,
              height: 200,
              background: "#000",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={() => !out && setOpened(true)}>
            <SparkleVeil width={200} height={200} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(4px)" }}>
                <Icon name="Flame" size={22} className="text-white" />
              </div>
              <span className="text-white/85 text-[12px] font-medium">
                {out ? "Ожидает просмотра" : "Нажми, чтобы открыть"}
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