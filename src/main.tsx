import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initAppTheme } from '@/hooks/useAppTheme'
import { initAppIcon } from '@/hooks/useAppIcon'
import '@/i18n'

initAppTheme();
initAppIcon();

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
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}