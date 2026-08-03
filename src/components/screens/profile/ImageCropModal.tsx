import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Icon from "@/components/ui/icon";

type Area = { x: number; y: number; width: number; height: number };

// Обрезает изображение по выбранной области и возвращает base64 (jpeg)
async function getCroppedBase64(src: string, area: Area, outW: number, outH: number): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function ImageCropModal({
  src,
  aspect,
  round = false,
  title,
  outW,
  outH,
  onCancel,
  onDone,
}: {
  src: string;
  aspect: number;
  round?: boolean;
  title: string;
  outW: number;
  outH: number;
  onCancel: () => void;
  onDone: (base64: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const handleDone = async () => {
    if (!areaPixels || busy) return;
    setBusy(true);
    try {
      const result = await getCroppedBase64(src, areaPixels, outW, outH);
      onDone(result);
    } catch {
      onDone(src);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "#000" }}>
      <div className="text-center pt-4 pb-3 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
        <h2 className="text-white font-black text-lg">{title}</h2>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={round ? "round" : "rect"}
          showGrid={!round}
          restrictPosition
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex-shrink-0 px-6 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        {/* Ползунок масштаба */}
        <div className="flex items-center gap-3 mb-5">
          <Icon name="ImageMinus" size={18} className="text-white/50 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#FF2D78] h-1"
          />
          <Icon name="ImagePlus" size={18} className="text-white/50 flex-shrink-0" />
        </div>

        {/* Кнопки */}
        <div className="flex items-center gap-3">
          <button onClick={onCancel} disabled={busy}
            className="flex-1 h-14 rounded-full text-white font-bold active:scale-[0.98] transition-all disabled:opacity-60"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            Отменить
          </button>
          <button onClick={handleDone} disabled={busy || !areaPixels}
            className="flex-1 h-14 rounded-full text-white font-black active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#FF6A3D,#FF2D78)", boxShadow: "0 6px 24px rgba(255,45,120,0.4)" }}>
            {busy ? <Icon name="Loader2" size={20} className="animate-spin" /> : "Продолжить"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
