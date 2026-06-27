import { useEffect, useRef } from "react";

/**
 * Делает рабочей системную кнопку "Назад" на Android (и в PWA).
 *
 * Каждый раз когда меняется screen, в историю браузера добавляется запись.
 * Когда пользователь жмёт системную "Назад", срабатывает popstate —
 * и мы вызываем onBack() вместо закрытия приложения.
 *
 * onBack должен вернуть true, если переход назад обработан внутри приложения
 * (тогда выход блокируется), или false, если уходить уже некуда
 * (тогда приложение закрывается штатно).
 */
export function useBackButton(screen: string, onBack: () => boolean) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const prevScreen = useRef<string | null>(null);
  const ignoreNext = useRef(false);

  // При каждой смене экрана кладём новую запись в историю
  useEffect(() => {
    if (prevScreen.current === null) {
      // Самый первый рендер — ставим базовую запись
      window.history.replaceState({ ptr: true, screen }, "");
      prevScreen.current = screen;
      return;
    }
    if (prevScreen.current !== screen) {
      window.history.pushState({ ptr: true, screen }, "");
      prevScreen.current = screen;
    }
  }, [screen]);

  useEffect(() => {
    const onPopState = () => {
      if (ignoreNext.current) {
        ignoreNext.current = false;
        return;
      }
      const handled = onBackRef.current();
      if (handled) {
        // Переход обработан внутри приложения — восстанавливаем запись,
        // чтобы кнопка "Назад" продолжала работать
        ignoreNext.current = true;
        window.history.pushState({ ptr: true }, "");
      }
      // если не обработан — ничего не делаем, браузер закроет вкладку/приложение
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
