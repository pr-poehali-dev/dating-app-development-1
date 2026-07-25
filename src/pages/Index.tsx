import { useIndexController } from "./index/useIndexController";
import { IndexAuthView } from "./index/IndexAuthView";
import { IndexShell } from "./index/IndexShell";

// ─── Root ─────────────────────────────────────────────────────────────────────
// Корневой экран: собирает всю логику (useIndexController) и три подкомпонента:
//  • IndexAuthView — ранние состояния (сплэш / загрузка / блокировка / вход);
//  • IndexShell    — основной каркас приложения после входа;
//  • IndexScreens  — содержимое вкладок (используется внутри IndexShell).
// Поведение полностью идентично прежнему монолитному Index.tsx.
export default function Index() {
  const c = useIndexController();

  // IndexAuthView показывает ранние состояния; если пользователь вошёл и
  // разблокирован — рендерит переданный children (основной каркас).
  return (
    <IndexAuthView c={c}>
      {c.currentUser && <IndexShell c={c} currentUser={c.currentUser} />}
    </IndexAuthView>
  );
}
