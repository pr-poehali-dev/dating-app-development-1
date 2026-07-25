import { useTranslation } from "react-i18next";
import { AuthScreen } from "@/components/screens/AuthPremiumNav";
import { AuthNavbar } from "@/components/screens/auth/AuthNavbar";
import { LivePhoneMockup } from "@/components/screens/auth/LivePhoneMockup";
import { AuthFeaturesGrid } from "@/components/screens/auth/AuthFeaturesGrid";
import { AuthSiteFooter } from "@/components/screens/auth/AuthSiteFooter";
import SplashScreen from "@/components/screens/SplashScreen";
import CookieConsent from "@/components/CookieConsent";
import StarField from "@/components/StarField";
import { LockScreen } from "@/components/screens/LockScreen";
import type { IndexController } from "./useIndexController";

// ─── IndexAuthView ───────────────────────────────────────────────────────────────
// Ранние состояния корневого экрана до входа в приложение: сплэш, загрузка,
// экран блокировки и экран авторизации (десктоп + мобайл). Вынесено из
// Index.tsx один-в-один. Если пользователь уже вошёл и разблокирован —
// рендерит children (основной каркас приложения).
export function IndexAuthView({ c, children }: { c: IndexController; children: React.ReactNode }): JSX.Element {
  const { t } = useTranslation();
  const { showSplash, setShowSplash, authLoading, currentUser, locked, setLocked, isDesktop, handleAuth, handleLogout } = c;

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (authLoading) {
    return (
      <div className="app-bg flex items-center justify-center" style={{ height: "100dvh" }}>
        <div className="app-hearts-layer" />
        <StarField />
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-unbounded text-white text-2xl font-black grad-text">Полутон</h1>
          <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (currentUser && locked) {
    return (
      <LockScreen
        userId={currentUser.id}
        onUnlock={() => setLocked(false)}
        onLogout={() => { setLocked(false); handleLogout(); }}
      />
    );
  }

  if (!currentUser) {
    if (isDesktop) {
      return (
        <div className="app-bg app-bg-scrollable">
          <div className="app-hearts-layer" />
          <StarField count={160} />

          <AuthNavbar onLoginClick={() => document.getElementById("auth-card")?.scrollIntoView({ behavior: "smooth", block: "center" })} />

          {/* Hero: телефоны слева, форма регистрации справа */}
          <div className="relative flex items-center justify-center px-10 py-16" style={{ minHeight: "calc(100vh - 72px)" }}>
            <div className="flex items-center gap-16 flex-wrap justify-center">
              <div className="hidden lg:flex flex-col items-center gap-6 max-w-lg">
                <LivePhoneMockup />
                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="font-unbounded text-white text-4xl font-black leading-tight" style={{ textShadow: "0 2px 30px rgba(255,45,120,0.35)" }}>
                    {t("hero.title1")}{" "}
                    <span className="grad-text">{t("hero.title2")}</span>
                  </h2>
                  <p className="text-white/50 text-base">{t("hero.subtitle")}</p>
                </div>
              </div>

              <div id="auth-card">
                <AuthScreen onAuth={handleAuth} variant="card" />
              </div>
            </div>
          </div>

          <AuthFeaturesGrid />

          <AuthSiteFooter />

          <CookieConsent />
        </div>
      );
    }

    return (
      <div className="app-bg flex justify-center" style={{ height: "100dvh", minHeight: "100vh" }}>
        <div className="app-hearts-layer" />
        <StarField count={70} />
        <div className="app-screen-container h-full">
          <AuthScreen onAuth={handleAuth} />
        </div>
        <CookieConsent />
      </div>
    );
  }

  return <>{children}</>;
}

export default IndexAuthView;