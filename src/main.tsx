import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initAppTheme } from '@/hooks/useAppTheme'
import { initAppIcon } from '@/hooks/useAppIcon'
import '@/i18n'

initAppTheme();
initAppIcon();

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