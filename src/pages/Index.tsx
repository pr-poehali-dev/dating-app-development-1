import { useState, useEffect, useRef, useCallback } from "react";
import { authApi, notificationsApi, type User, type LiveStream } from "@/lib/api";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PremiumConfetti } from "@/components/screens/PremiumConfetti";

import { useBackButton } from "@/hooks/useBackButton";
import { ScreenshotProtection } from "@/components/ScreenshotProtection";

import { AuthScreen, PremiumScreen, BottomNav } from "@/components/screens/AuthPremiumNav";
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

  // Счётчик непрочитанных сообщений
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = () => {
      notificationsApi.unreadCount().then(d => setUnreadMessages(d.messages || 0)).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15_000);
    return () => clearInterval(interval);
  }, [!!currentUser]);

  // Сбрасываем счётчик при открытии чатов
  useEffect(() => {
    if (screen === "matches") setUnreadMessages(0);
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


  if (authLoading) {
    return (
      <div className="app-bg flex items-center justify-center" style={{ height: "100dvh" }}>
        <div className="app-hearts-layer" />
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-unbounded text-white text-2xl font-black grad-text">LoveBloom</h1>
          <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="app-bg flex justify-center" style={{ height: "100dvh", minHeight: "100vh" }}>
        <div className="app-hearts-layer" />
        <div className="w-full max-w-sm relative z-10 h-full">
          <AuthScreen onAuth={handleAuth} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg flex justify-center" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      <div className="app-hearts-layer" />
      <ScreenshotProtection />
      {showConfetti && <PremiumConfetti />}
      <div className="w-full max-w-sm relative z-10 flex flex-col" style={{ height: "100dvh" }}>
        <div className="flex-1 overflow-hidden relative" style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}>
          <div key={animKey}
            className={`h-full w-full ${animDir === "right" ? "screen-enter-right" : animDir === "left" ? "screen-enter-left" : "screen-enter-up"}`}>
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
            {screen === "premium" && <PremiumScreen onClose={() => navigateTo("discover")} currentUser={currentUser} />}
            {screen === "verify" && <VerifyScreen onClose={() => navigateTo("profile")} />}
            {screen === "admin_verify" && <AdminVerifyScreen onClose={() => navigateTo("profile")} />}
          </div>
        </div>
        {isMain && <BottomNav active={screen} onChange={(s) => navigateTo(s as Screen)} unreadMessages={unreadMessages} />}
      </div>
    </div>
  );
}