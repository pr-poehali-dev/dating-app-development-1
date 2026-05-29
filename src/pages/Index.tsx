import { useState, useEffect, useRef } from "react";
import { authApi, notificationsApi, type User, type LiveStream } from "@/lib/api";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PremiumConfetti } from "@/components/screens/PremiumConfetti";

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
  const openChat = (id: number) => { setPrevScreen(screen); setChatId(id); setScreen("chat"); };
  const goToChats = () => { setPrevScreen(screen); setScreen("matches"); };
  const backToMatches = () => { setChatId(null); setScreen(prevScreen); };

  const handleJoinLive = (s: LiveStream) => {
    setJoinStream(s);
    setScreen("live");
  };


  if (authLoading) {
    return (
      <div className="app-bg flex items-center justify-center" style={{ height: "100dvh" }}>
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-unbounded text-white text-2xl font-black grad-text">LoveBloom</h1>
          <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="app-bg flex justify-center">
        <div className="w-full max-w-sm relative z-10" style={{ height: "100dvh" }}>
          <AuthScreen onAuth={handleAuth} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg flex justify-center">
      {showConfetti && <PremiumConfetti />}
      <div className="w-full max-w-sm relative z-10 flex flex-col" style={{ height: "100dvh" }}>
        <div className="flex-1 overflow-hidden relative">
          {screen === "discover" && <HomeScreen currentUser={currentUser} onGoLive={() => setScreen("live")} onJoinLive={handleJoinLive} onOpenChat={openChat} onGoToChats={goToChats} onPremium={() => setScreen("premium")} />}
          {screen === "photos" && <PeopleScreen onOpenChat={openChat} onGoToChats={goToChats} onPremium={() => setScreen("premium")} isPremium={!!currentUser.premium} currentUserId={currentUser.id} />}
          {screen === "live" && <LiveScreen currentUser={currentUser} initialStream={joinStream} onStreamConsumed={() => setJoinStream(null)} />}
          <div className="h-full" style={{ display: screen === "matches" ? "flex" : "none", flexDirection: "column" }}>
            <RealMatchesScreen onChat={openChat} />
          </div>
          {screen === "likes" && <RealLikesScreen onPremium={() => setScreen("premium")} />}
          {screen === "profile" && <RealProfileScreen currentUser={currentUser} onPremium={() => setScreen("premium")} onLogout={handleLogout} onPhotoUpdate={handlePhotoUpdate} onProfileUpdate={handleProfileUpdate} onVerify={() => setScreen("verify")} />}
          {screen === "chat" && chatId && <RealChatScreen matchId={chatId} currentUserId={currentUser.id} onBack={backToMatches} />}
          {screen === "filter" && (
            <FilterScreen
              initial={{}}
              onApply={() => setScreen("discover")}
              onClose={() => setScreen("discover")}
            />
          )}
          {screen === "premium" && <PremiumScreen onClose={() => setScreen("discover")} currentUser={currentUser} />}
          {screen === "verify" && <VerifyScreen onClose={() => setScreen("profile")} />}
          {screen === "admin_verify" && <AdminVerifyScreen onClose={() => setScreen("profile")} />}
        </div>
        {isMain && <BottomNav active={screen} onChange={setScreen} unreadMessages={unreadMessages} />}
      </div>
    </div>
  );
}