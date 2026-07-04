import { useEffect } from "react";

/**
 * Глобальный стек обработчиков кнопки "Назад".
 *
 * Любой открытый оверлей (чужой профиль, экран настроек, смена пароля,
 * фильтры, лайтбокс и т.п.) регистрирует свою функцию закрытия.
 * При нажатии системной "Назад" вызывается ВЕРХНИЙ обработчик стека —
 * то есть закрывается именно тот слой, который открыт последним.
 * Это даёт «ощущение приложения»: назад возвращает на предыдущий слой,
 * а не выбрасывает на Главную.
 */
type BackHandler = () => void;

interface Entry {
  id: number;
  handler: BackHandler;
}

const stack: Entry[] = [];
let counter = 0;

/** Вызвать верхний обработчик стека. Возвращает true, если что-то закрыли. */
export function popBackHandler(): boolean {
  const top = stack[stack.length - 1];
  if (top) {
    top.handler();
    return true;
  }
  return false;
}

/** Есть ли активные оверлеи. */
export function hasBackHandler(): boolean {
  return stack.length > 0;
}

/**
 * Регистрирует обработчик "назад" пока условие active === true.
 * При active=false или размонтировании — снимает себя со стека.
 */
export function useBackHandler(active: boolean, handler: BackHandler) {
  useEffect(() => {
    if (!active) return;
    const entry: Entry = { id: ++counter, handler };
    stack.push(entry);
    return () => {
      const idx = stack.findIndex((e) => e.id === entry.id);
      if (idx !== -1) stack.splice(idx, 1);
    };
    // handler намеренно не в зависимостях: берём актуальный через замыкание при active-переключении
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Держим handler свежим без пере-регистрации
  useEffect(() => {
    if (!active) return;
    const entry = stack[stack.length - 1];
    if (entry) entry.handler = handler;
  });
}
