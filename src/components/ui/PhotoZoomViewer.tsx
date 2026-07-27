import { createPortal } from "react-dom";
import Icon from "@/components/ui/icon";
import { ProtectedImage } from "@/components/ui/ProtectedImage";
import { PinchZoom } from "@/components/ui/PinchZoom";

interface Props {
  src: string;
  onClose: () => void;
  watermark?: string;
}

/**
 * Единый полноэкранный просмотрщик одного фото с pinch-to-zoom.
 * Двумя пальцами — увеличение, двойной тап — быстрый зум, свайп вниз/клик по фону — закрыть.
 */
export function PhotoZoomViewer({ src, onClose, watermark }: Props) {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(14px)", zIndex: 2147483000 }}
      onClick={onClose}
    >
      <button
        className="absolute right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 18px)", background: "rgba(255,255,255,0.12)" }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <Icon name="X" size={20} className="text-white" />
      </button>

      <PinchZoom>
        <ProtectedImage
          src={src}
          watermark={watermark}
          className="rounded-2xl"
          style={{ maxWidth: "100vw", maxHeight: "100dvh", objectFit: "contain", display: "block" }}
          onClick={(e) => e.stopPropagation()}
        />
      </PinchZoom>
    </div>,
    document.body
  );
}

export default PhotoZoomViewer;