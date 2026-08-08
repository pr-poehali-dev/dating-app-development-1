import { useEffect, useState, useCallback } from "react";

/**
 * Обёртка для внутренних страниц (настройки, верификация, подписки).
 * Даёт нативный переход: страница въезжает справа и уезжает вправо при закрытии.
 *
 * Использование: оборачиваем содержимое и вызываем close() вместо onClose —
 * анимация проигрывается, и только потом страница реально закрывается.
 */
export function usePagePush(onClose: () => void, duration = 240) {
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [closing, onClose, duration]);

  return { closing, close };
}

export function PagePush({
  closing,
  className = "",
  style,
  children,
}: {
  closing: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={`${closing ? "page-push-out" : "page-push-in"} ${className}`} style={style}>
      {children}
    </div>
  );
}

export default PagePush;
