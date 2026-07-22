import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { liveApi } from "@/lib/api";

const CHECK_INTERVAL_MS = 15000;

/**
 * Периодическая AI-модерация видео эфира на стороне стримера.
 * Каждые CHECK_INTERVAL_MS захватывает кадр из <video> и отправляет на проверку.
 * При грубом нарушении бэкенд завершает эфир — тут вызываем onBlocked (стоп эфира).
 */
export function useStreamFrameModeration(params: {
  enabled: boolean;
  streamId: number | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onBlocked: () => void;
}) {
  const { enabled, streamId, videoRef, onBlocked } = params;
  const busyRef = useRef(false);
  const blockedRef = useRef(false);
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  useEffect(() => {
    if (!enabled || !streamId) return;
    blockedRef.current = false;

    const captureFrame = (): string | null => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return null;
      const maxW = 640;
      const scale = Math.min(1, maxW / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, w, h);
      try {
        return canvas.toDataURL("image/jpeg", 0.7);
      } catch {
        return null;
      }
    };

    const tick = async () => {
      if (busyRef.current || blockedRef.current) return;
      const frame = captureFrame();
      if (!frame) return;
      busyRef.current = true;
      try {
        const res = await liveApi.checkFrame(streamId, frame);
        if (res.action === "blocked") {
          blockedRef.current = true;
          toast.error("Эфир остановлен модерацией", {
            description: res.reason || "В кадре обнаружен запрещённый контент",
          });
          onBlockedRef.current();
        } else if (res.action === "warn") {
          toast.warning("Предупреждение модерации", {
            description: res.reason || "Возможно запрещённый контент в кадре",
          });
        }
      } catch {
        /* сеть/ИИ недоступны — не мешаем эфиру */
      } finally {
        busyRef.current = false;
      }
    };

    const id = setInterval(tick, CHECK_INTERVAL_MS);
    const first = setTimeout(tick, 5000);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, [enabled, streamId, videoRef]);
}

export default useStreamFrameModeration;
