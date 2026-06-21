import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { getViewerLabel } from "@/lib/api";

interface ProtectedImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: MouseEvent) => void;
  /** Текст водяного знака поверх фото (например, имя смотрящего) */
  watermark?: string;
  /** Скрывать фото при уходе с вкладки (анти-скриншот) */
  hideOnBlur?: boolean;
  /** Затемнять фото при попытке скриншота на мобильных */
  protect?: boolean;
}

const noSelectStyle: CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  pointerEvents: "none",
};

export function ProtectedImage({
  src,
  alt = "",
  className,
  style,
  onClick,
  watermark,
  hideOnBlur = true,
  protect = true,
}: ProtectedImageProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hideOnBlur || !protect) return;
    const onVisibility = () => setHidden(document.visibilityState !== "visible");
    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(false);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [hideOnBlur, protect]);

  const objectFit = (style?.objectFit as CSSProperties["objectFit"]) || "cover";
  const isContain = objectFit === "contain";

  const viewerLabel = watermark ? getViewerLabel() : "";
  const watermarkText = watermark
    ? viewerLabel
      ? `${watermark} · ${viewerLabel}`
      : watermark
    : "";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        display: isContain ? "inline-flex" : "block",
        ...style,
      }}
      onClick={onClick}
      onContextMenu={protect ? (e) => e.preventDefault() : undefined}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={isContain ? "" : "w-full h-full"}
        style={{
          objectFit,
          display: "block",
          ...(isContain
            ? { maxWidth: "100%", maxHeight: "90dvh", width: "auto", height: "auto" }
            : {}),
          ...(protect ? noSelectStyle : {}),
          filter: hidden ? "blur(28px) brightness(0.35)" : undefined,
          transition: "filter 0.15s ease",
        }}
      />

      {watermark && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "flex",
            flexWrap: "wrap",
            alignContent: "center",
            justifyContent: "center",
            gap: "28px 22px",
            transform: "rotate(-24deg) scale(1.4)",
            opacity: 0.16,
            mixBlendMode: "overlay",
          }}
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      )}

      {protect && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "auto",
            background: "transparent",
          }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
}

export default ProtectedImage;