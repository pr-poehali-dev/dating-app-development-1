import { useState, useEffect, useRef, useCallback } from "react";
import { authApi, notificationsApi, matchesApi, messagesApi, type User, type LiveStream } from "@/lib/api";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PremiumConfetti } from "@/components/screens/PremiumConfetti";
import SplashScreen from "@/components/screens/SplashScreen";
import OfflineBanner from "@/components/OfflineBanner";
import { useOffline, cacheMatches, cacheMessages, registerSyncHandler, removePendingAction } from "@/hooks/useOffline";
import { setAppBadge } from "@/hooks/useNative";

import { useBackButton } from "@/hooks/useBackButton";
import { popBackHandler } from "@/hooks/backStack";

import { AuthScreen, PremiumScreen, PremiumScreenDesktop, BottomNav, DesktopSidebar } from "@/components/screens/AuthPremiumNav";
import { AuthDownloadSection } from "@/components/screens/auth/AuthDownloadSection";
import { AuthFooter } from "@/components/screens/auth/AuthFooter";
import { AuthLegalSheet } from "@/components/screens/auth/AuthLegalSheet";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { FilterScreen } from "@/components/screens/SwipeScreens";
import { LiveScreen, RealMatchesScreen, RealLikesScreen, RealChatScreen } from "@/components/screens/SocialScreens";
import { PeopleScreen } from "@/components/screens/PeopleScreen";
import { RealProfileScreen, VerifyScreen, AdminVerifyScreen } from "@/components/screens/ProfileScreens";
import { HomeScreen } from "@/components/screens/HomeScreen";

type Screen = "discover" | "matches" | "likes" | "profile" | "chat" | "filter" | "premium" | "photos" | "live" | "verify" | "admin_verify";

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [screen, setScreen] = useState<Screen>("discover");
  const [chatId, setChatId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (authApi.isLoggedIn()) {
      authApi.me()
        .then((d) => setCurrentUser(d.user))
        .catch(() => {})
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleAuth = (user: User) => setCurrentUser(user);

  const handleLogout = async () => {
    await authApi.logout();
    setCurrentUser(null);
    setScreen("discover");
  };

  const handlePhotoUpdate = (url: string) => {
    setCurrentUser((u) => u ? { ...u, photo_url: url } : u);
  };

  const handleProfileUpdate = (data: Partial<User>) => {
    setCurrentUser((u) => u ? { ...u, ...data } : u);
  };

  // Подключаем push-уведомления сразу после авторизации
  usePushNotifications(!!currentUser);

  // Офлайн-режим
  const offlineState = useOffline();

  // Регистрируем обработчик синхронизации отложенных действий
  useEffect(() => {
    registerSyncHandler(async (actions) => {
      for (const action of actions) {
        try {
          if (action.type === "send-message") {
            const { match_id, text } = action.payload as { match_id: number; text: string };
            await messagesApi.send(match_id, text);
            await removePendingAction(action.id);
          }
        } catch { /* оставляем в очереди */ }
      }
    });
  }, []);

  // Кэшируем матчи и сообщения при загрузке (офлайн-доступ)
  useEffect(() => {
    if (!currentUser || !navigator.onLine) return;
    matchesApi.getAll()
      .then((d) => cacheMatches(d.matches))
      .catch(() => {});
  }, [!!currentUser, offlineState.isOnline]);

  // Счётчик непрочитанных сообщений + нативный бейдж на иконке
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = () => {
      notificationsApi.unreadCount().then(d => {
        const count = d.messages || 0;
        setUnreadMessages(count);
        setAppBadge(count); // нативный бейдж на иконке приложения
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15_000);
    return () => clearInterval(interval);
  }, [!!currentUser]);

  // Сбрасываем счётчик при открытии чатов
  useEffect(() => {
    if (screen === "matches") { setUnreadMessages(0); setAppBadge(0); }
  }, [screen]);

  // Heartbeat — обновляем online/last_seen каждые 60 сек
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    authApi.heartbeat().catch(() => {});
    heartbeatRef.current = setInterval(() => {
      authApi.heartbeat().catch(() => {});
    }, 60_000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      // При закрытии вкладки ставим офлайн
      authApi.logout().catch(() => {});
    };
  }, [!!currentUser]);

  const mainScreens: Screen[] = ["discover", "photos", "live", "matches", "likes", "profile"];
  const isMain = mainScreens.includes(screen);
  const isDesktop = useIsDesktop();
  const [showFooterTerms, setShowFooterTerms] = useState(false);
  const [showFooterPrivacy, setShowFooterPrivacy] = useState(false);

  // Плавное скрытие/появление нижней панели при скролле ленты (на любом экране)
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollMap = useRef(new WeakMap<EventTarget, number>());
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || typeof target.scrollTop !== "number") return;
      const scrollTop = target.scrollTop;
      const last = lastScrollMap.current.get(target) ?? 0;
      const delta = scrollTop - last;
      if (scrollTop <= 4) {
        setNavVisible(true);
      } else if (delta > 6) {
        setNavVisible(false);
      } else if (delta < -6) {
        setNavVisible(true);
      }
      lastScrollMap.current.set(target, scrollTop);
    };
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);
  useEffect(() => { setNavVisible(true); }, [screen]);

  const [prevScreen, setPrevScreen] = useState<Screen>("matches");
  const [animDir, setAnimDir] = useState<"left" | "right" | "up">("right");
  const [animKey, setAnimKey] = useState(0);
  const [joinStream, setJoinStream] = useState<LiveStream | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Обработка редиректа после оплаты Premium
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      // Убираем параметр из URL
      window.history.replaceState({}, "", window.location.pathname);
      // Обновляем данные пользователя (теперь premium=true)
      if (authApi.isLoggedIn()) {
        authApi.me().then((d) => {
          setCurrentUser(d.user);
          // Небольшая задержка — вебхук мог ещё не дойти
          setTimeout(() => setShowConfetti(true), 400);
          setTimeout(() => setShowConfetti(false), 5000);
        }).catch(() => {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        });
      }
    }
  }, []);
  // Навигация с анимацией
  const navigateTo = useCallback((next: Screen) => {
    const fromIdx = mainScreens.indexOf(screen);
    const toIdx   = mainScreens.indexOf(next);
    if (fromIdx !== -1 && toIdx !== -1) {
      setAnimDir(toIdx > fromIdx ? "right" : "left");
    } else {
      setAnimDir("up");
    }
    setAnimKey(k => k + 1);
    setScreen(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const openChat = (id: number) => { setPrevScreen(screen); setChatId(id); navigateTo("chat"); };
  const goToChats = () => { setPrevScreen(screen); navigateTo("matches"); };
  const backToMatches = () => { setChatId(null); setScreen(prevScreen); };

  const handleJoinLive = (s: LiveStream) => {
    setJoinStream(s);
    setScreen("live");
  };

  // Подтверждение выхода: "нажмите Назад ещё раз"
  const lastBackPress = useRef(0);
  const showExitHint = useCallback(() => {
    let el = document.getElementById("__exit_hint__");
    if (!el) {
      el = document.createElement("div");
      el.id = "__exit_hint__";
      el.textContent = "Нажмите «Назад» ещё раз для выхода";
      el.style.cssText = `
        position: fixed;
        left: 50%;
        bottom: calc(86px + env(safe-area-inset-bottom, 0px));
        transform: translateX(-50%) translateY(10px);
        z-index: 99999;
        padding: 10px 20px;
        border-radius: 999px;
        background: rgba(20,12,32,0.96);
        border: 1px solid rgba(255,255,255,0.12);
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        font-family: system-ui, sans-serif;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        box-shadow: 0 8px 30px rgba(0,0,0,0.45);
      `;
      document.body.appendChild(el);
    }
    requestAnimationFrame(() => {
      if (el) { el.style.opacity = "1"; el.style.transform = "translateX(-50%) translateY(0)"; }
    });
    setTimeout(() => {
      if (el) { el.style.opacity = "0"; el.style.transform = "translateX(-50%) translateY(10px)"; }
    }, 1800);
  }, []);

  // Системная кнопка "Назад" (Android) — навигация внутри приложения
  const handleBackButton = useCallback((): boolean => {
    // 1) Сначала закрываем открытые оверлеи (чужой профиль, настройки,
    //    смена пароля, фильтры, лайтбокс) — по одному слою за нажатие.
    if (popBackHandler()) {
      return true;
    }
    if (screen === "chat") {
      setChatId(null);
      setScreen(prevScreen);
      return true;
    }
    if (screen !== "discover") {
      navigateTo("discover");
      return true;
    }
    // На главном экране — требуем второе нажатие в течение 2 секунд
    const now = Date.now();
    if (now - lastBackPress.current < 2000) {
      return false; // второе нажатие — выходим из приложения
    }
    lastBackPress.current = now;
    showExitHint();
    navigator.vibrate?.(20);
    return true; // блокируем выход, ждём подтверждения
  }, [screen, prevScreen, showExitHint]);

  useBackButton(currentUser ? screen : "auth", handleBackButton);


  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (authLoading) {
    return (
      <div className="app-bg flex items-center justify-center" style={{ height: "100dvh" }}>
        <div className="app-hearts-layer" />
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-unbounded text-white text-2xl font-black grad-text">Полутон</h1>
          <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (isDesktop) {
      return (
        <div className="app-bg" style={{ minHeight: "100vh" }}>
          <div className="app-hearts-layer" />
          {showFooterTerms && <AuthLegalSheet tab="terms" onClose={() => setShowFooterTerms(false)} />}
          {showFooterPrivacy && <AuthLegalSheet tab="privacy" onClose={() => setShowFooterPrivacy(false)} />}

          <div className="relative flex items-center justify-center px-10 py-16" style={{ minHeight: "100vh" }}>
            <div className="flex items-center gap-16">
              <div className="hidden lg:flex flex-col gap-4 max-w-md">
                <h2 className="font-unbounded text-white text-5xl font-black leading-tight" style={{ textShadow: "0 2px 30px rgba(255,45,120,0.35)" }}>
                  Знакомься.<br />Общайся.<br />
                  <span className="grad-text">Влюбляйся.</span>
                </h2>
                <p className="text-white/50 text-base mt-2">Полутон — место, где начинаются настоящие истории.</p>
              </div>
              <div className="relative rounded-[32px] overflow-hidden flex-shrink-0"
                style={{ width: 400, height: 780, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <AuthScreen onAuth={handleAuth} />
              </div>
            </div>
          </div>

          <div className="relative">
            <AuthDownloadSection />
            <AuthFooter onOpenTerms={() => setShowFooterTerms(true)} onOpenPrivacy={() => setShowFooterPrivacy(true)} />
          </div>
        </div>
      );
    }

    return (
      <div className="app-bg flex justify-center" style={{ height: "100dvh", minHeight: "100vh" }}>
        <div className="app-hearts-layer" />
        <div className="app-screen-container h-full">
          <AuthScreen onAuth={handleAuth} />
        </div>
      </div>
    );
  }

  const screensContent = (
    <>
      {screen === "discover" && <HomeScreen currentUser={currentUser} onGoLive={() => navigateTo("live")} onJoinLive={handleJoinLive} onOpenChat={openChat} onGoToChats={goToChats} onPremium={() => navigateTo("premium")} />}
      {screen === "photos" && <PeopleScreen onOpenChat={openChat} onGoToChats={goToChats} onPremium={() => navigateTo("premium")} onOpenSelf={() => navigateTo("profile")} isPremium={!!currentUser.premium} currentUserId={currentUser.id} />}
      {screen === "live" && <LiveScreen currentUser={currentUser} initialStream={joinStream} onStreamConsumed={() => setJoinStream(null)} />}
      <div className="h-full" style={{ display: screen === "matches" ? "flex" : "none", flexDirection: "column" }}>
        <RealMatchesScreen onChat={openChat} />
      </div>
      {screen === "likes" && <RealLikesScreen onPremium={() => navigateTo("premium")} />}
      {screen === "profile" && <RealProfileScreen currentUser={currentUser} onPremium={() => navigateTo("premium")} onLogout={handleLogout} onPhotoUpdate={handlePhotoUpdate} onProfileUpdate={handleProfileUpdate} onVerify={() => navigateTo("verify")} />}
      {screen === "chat" && chatId && <RealChatScreen matchId={chatId} currentUserId={currentUser.id} onBack={backToMatches} />}
      {screen === "filter" && (
        <FilterScreen
          initial={{}}
          onApply={() => navigateTo("discover")}
          onClose={() => navigateTo("discover")}
        />
      )}
      {screen === "premium" && (isDesktop
        ? <PremiumScreenDesktop onClose={() => navigateTo("discover")} currentUser={currentUser} />
        : <PremiumScreen onClose={() => navigateTo("discover")} currentUser={currentUser} />)}
      {screen === "verify" && <VerifyScreen onClose={() => navigateTo("profile")} />}
      {screen === "admin_verify" && <AdminVerifyScreen onClose={() => navigateTo("profile")} />}
    </>
  );

  // ── Десктопная версия: боковая навигация вместо нижнего меню ──
  if (isDesktop) {
    // Экранам с постами/лентой — узкая центрированная колонка (как в соцсетях),
    // экранам с сеткой людей/чатами — вся доступная ширина.
    const narrowScreens: Screen[] = ["discover", "profile"];
    const contentMaxWidth = narrowScreens.includes(screen) ? 640 : undefined;
    // Открытый чат — тоже показываем сайдбар (на десктопе места достаточно)
    const showSidebar = isMain || screen === "chat";

    return (
      <div className="app-bg flex justify-center">
        <div className="app-hearts-layer" />
        <OfflineBanner offlineState={offlineState} />
        {showConfetti && <PremiumConfetti />}
        <div className="app-screen-container desktop-mode" style={{ height: "100dvh" }}>
          {showSidebar && (
            <DesktopSidebar
              active={screen === "chat" ? "matches" : screen}
              onChange={(s) => navigateTo(s as Screen)}
              unreadMessages={unreadMessages}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
          <div className="flex-1 overflow-hidden relative" style={{ maxWidth: contentMaxWidth, margin: contentMaxWidth ? "0 auto" : undefined }}>
            <div key={animKey} className="h-full w-full">
              {screensContent}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg flex justify-center">
      <div className="app-hearts-layer" />
      <OfflineBanner offlineState={offlineState} />
      {showConfetti && <PremiumConfetti />}
      <div className="app-screen-container flex flex-col" style={{ height: "100dvh" }}>
        <div className="flex-1 overflow-hidden relative">
          <div key={animKey}
            className={`h-full w-full ${animDir === "right" ? "screen-enter-right" : animDir === "left" ? "screen-enter-left" : "screen-enter-up"}`}>
            {screensContent}
          </div>
        </div>
        {isMain && (
          <div style={{
            transform: navVisible ? "translateY(0)" : "translateY(120%)",
            opacity: navVisible ? 1 : 0,
            transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease",
          }}>
            <BottomNav active={screen} onChange={(s) => navigateTo(s as Screen)} unreadMessages={unreadMessages} />
          </div>
        )}
      </div>
    </div>
  );
}