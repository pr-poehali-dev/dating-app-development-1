import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initAppTheme } from '@/hooks/useAppTheme'
import '@/i18n'

initAppTheme();

// Гасим необработанные ошибки OneSignal SDK, чтобы они не всплывали в интерфейсе
window.addEventListener("unhandledrejection", (e) => {
  const src = String(e.reason?.stack || e.reason?.message || e.reason || "");
  if (src.includes("OneSignal")) {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);

const splash = document.getElementById("app-splash");
if (splash) {
  const hideSplash = () => {
    splash.classList.add("splash-hidden");
    setTimeout(() => splash.remove(), 500);
  };
  setTimeout(hideSplash, 600);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Проверяем обновление сразу и раз в час — чтобы новая сборка
      // подхватывалась даже внутри APK без переустановки.
      reg.update().catch(() => {});
      setInterval(() => { reg.update().catch(() => {}); }, 60 * 60 * 1000);
    }).catch(() => {});

    // Когда активировался новый service worker — один раз перезагружаем
    // страницу, чтобы приложение заработало на свежем коде.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}