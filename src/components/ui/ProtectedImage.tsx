import { type CSSProperties, type MouseEvent } from "react";

interface ProtectedImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: MouseEvent) => void;
  watermark?: string;
  hideOnBlur?: boolean;
  protect?: boolean;
}

export function ProtectedImage({
  src,
  alt = "",
  className,
  style,
  onClick,
}: ProtectedImageProps) {
  const objectFit = (style?.objectFit as CSSProperties["objectFit"]) || "cover";
  const isContain = objectFit === "contain";

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
    >
      <img
        src={src}
        alt={alt}
        className={isContain ? "" : "w-full h-full"}
        style={{
          objectFit,
          display: "block",
          ...(isContain ? { maxWidth: "100%", maxHeight: "90dvh", width: "auto", height: "auto" } : {}),
        }}
      />
    </div>
  );
}

export default ProtectedImage;
