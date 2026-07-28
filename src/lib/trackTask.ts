import { gamificationApi } from "@/lib/api";

// Отправляет прогресс по ежедневному заданию и уведомляет виджет об обновлении.
// Тихо игнорирует ошибки — геймификация не должна ломать основной сценарий.
export function trackTask(taskKey: string, step = 1) {
  gamificationApi.progress(taskKey, step)
    .then(() => {
      window.dispatchEvent(new CustomEvent("gamification:update"));
    })
    .catch(() => {});
}
