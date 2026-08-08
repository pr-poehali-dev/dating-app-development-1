import { useState, useEffect, useRef, useCallback } from "react";
import { authApi, notificationsApi, matchesApi, messagesApi, postsApi, profilesApi, isBanError, clearAllAuth, type User, type LiveStream, type Profile } from "@/lib/api";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { loginOneSignal, logoutOneSignal } from "@/hooks/useOneSignal";
import { useOffline, cacheMatches, registerSyncHandler, removePendingAction } from "@/hooks/useOffline";
import { setAppBadge } from "@/hooks/useNative";
import { useBackButton } from "@/hooks/useBackButton";
import { popBackHandler } from "@/hooks/backStack";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { isPinEnabled, getPinUserId } from "@/hooks/usePinLock";
import { isBiometricRegistered } from "@/hooks/useBiometrics";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import { syncVideoBlocks } from "@/lib/videoBlocks";
import type { Screen } from "./types";

// ─── useIndexController ─────────────────────────────────────────────────────────
// Содержит ВСЮ логику корневого экрана: состояние, эффекты и колбэки.
// Вынесено из Index.tsx один-в-один, без изменения поведения.
export function useIndexController() {
  const [screen, setScreen] = useState<Screen>("discover");
  const [chatId, setChatId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  // Экран блокировки (PIN/биометрия) при запуске приложения — только если
  // для этого пользователя на этом устройстве включён хотя бы один способ
  const [locked, setLocked] = useState(false);
  // Сообщение о бане: показывается на экране входа, если аккаунт заблокирован
  const [banMessage, setBanMessage] = useState<string | null>(null);

  // Принудительный выход при бане (во время активной сессии)
  const forceBanLogout = useCallback((reason: string) => {
    clearAllAuth();
    logoutOneSignal();
    setCurrentUser(null);
    setLocked(false);
    setScreen("discover");
    setBanMessage(reason);
  }, []);

  useEffect(() => {
    if (authApi.isLoggedIn()) {
      authApi.me()
        .then((d) => {
          setCurrentUser(d.user);
          const hasPin = isPinEnabled() && getPinUserId() === d.user.id;
          const hasBio = isBiometricRegistered(d.user.id);
          if (hasPin || hasBio) setLocked(true);
        })
        .catch((e) => { if (isBanError(e)) forceBanLogout(e.message); })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, [forceBanLogout]);

  const handleAuth = (user: User) => { setBanMessage(null); setCurrentUser(user); };

  // Переход к заданиям (виджет монет на профиле) по глобальному событию
  useEffect(() => {
    const goTasks = () => { setScreen("profile"); window.dispatchEvent(new Event("profile:open-tasks")); };
    window.addEventListener("app:navigate-tasks", goTasks);
    return () => window.removeEventListener("app:navigate-tasks", goTasks);
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    logoutOneSignal();
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

  // Связываем пользователя с OneSignal для адресных пушей
  useEffect(() => {
    if (currentUser?.id) void loginOneSignal(currentUser.id);
  }, [currentUser?.id]);

  // Подтягиваем блокировки видеозвонков с сервера (чтобы работали на любом устройстве)
  useEffect(() => {
    if (currentUser?.id) void syncVideoBlocks();
  }, [currentUser?.id]);

  // Глобальный входящий видеозвонок — виден на любой вкладке приложения.
  // Открытый вручную звонок (activeCall) подавляет глобальный поллинг.
  const [activeCall, setActiveCall] = useState<null | {
    matchId: number; isInitiator: boolean; offer?: string; earlyIce?: string[]; name: string; photo: string;
  }>(null);
  const { incoming, dismiss: dismissIncoming } = useIncomingCall(!!currentUser, !!activeCall);

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

  const hasUser = !!currentUser;

  // Кэшируем матчи и сообщения при загрузке (офлайн-доступ)
  useEffect(() => {
    if (!currentUser || !navigator.onLine) return;
    matchesApi.getAll()
      .then((d) => cacheMatches(d.matches))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser, offlineState.isOnline]);

  // Счётчик непрочитанных сообщений и новых лайков + нативный бейдж на иконке
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadLikes, setUnreadLikes] = useState(0);
  useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = () => {
      notificationsApi.unreadCount().then(d => {
        const count = d.messages || 0;
        setUnreadMessages(count);
        setUnreadLikes(d.likes || 0);
        setAppBadge(count); // нативный бейдж на иконке приложения
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser]);

  // Сбрасываем счётчики при открытии соответствующих экранов
  useEffect(() => {
    if (screen === "matches") { setUnreadMessages(0); setAppBadge(0); }
    if (screen === "likes") { setUnreadLikes(0); }
  }, [screen]);

  // Heartbeat — обновляем online/last_seen каждые 60 сек
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    const beat = () => authApi.heartbeat().catch((e) => { if (isBanError(e)) forceBanLogout(e.message); });
    beat();
    heartbeatRef.current = setInterval(beat, 60_000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      // При закрытии вкладки ставим офлайн
      authApi.logout().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser]);

  // Тихо обновляем геолокацию — чтобы в анкетах показывалось расстояние.
  // Разрешение уже выданное браузером используется молча; если его нет — ничего не спрашиваем.
  useEffect(() => {
    if (!currentUser || !navigator.geolocation) return;
    // Пользователь выключил локацию в настройках — не трогаем геолокацию
    if (localStorage.getItem("geo_enabled") === "0") return;
    const KEY = "geo_sync_at";
    const last = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - last < 6 * 3600_000) return;
    const save = () => navigator.geolocation.getCurrentPosition(
      (pos) => {
        localStorage.setItem(KEY, String(Date.now()));
        profilesApi.updateGeo(pos.coords.latitude, pos.coords.longitude, "", "").catch(() => {});
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "geolocation" as PermissionName })
        .then(s => { if (s.state === "granted") save(); })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser]);

  const mainScreens: Screen[] = ["discover", "photos", "live", "matches", "likes", "profile"];
  const isMain = mainScreens.includes(screen);
  const isDesktop = useIsDesktop();

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

  // Deep-link на профиль по ссылке ?user=ID («Поделиться профилем»)
  const [deepLinkProfile, setDeepLinkProfile] = useState<Profile | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    const params = new URLSearchParams(window.location.search);
    const uid = parseInt(params.get("user") || "", 10);
    if (!uid || uid === currentUser.id) return;
    window.history.replaceState({}, "", window.location.pathname);
    postsApi.getUserProfile(uid)
      .then((d) => { if (d.profile) setDeepLinkProfile(d.profile); })
      .catch(() => {});
  }, [currentUser]);

  // Deep-link ?call=matchId (клик по push «Входящий видеозвонок») — просто
  // очищаем URL; сам входящий звонок подхватит глобальный поллинг useIncomingCall.
  useEffect(() => {
    if (!currentUser) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("call")) {
      const clean = window.location.pathname + window.location.search.replace(/[?&]call=\d+/, "").replace(/^&/, "?");
      window.history.replaceState({}, "", clean.endsWith("?") ? window.location.pathname : clean);
    }
  }, [currentUser]);

  // Обработка редиректа после оплаты Premium
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    if (path === "/pay/fail") {
      window.history.replaceState({}, "", "/");
      return;
    }
    if (params.get("payment") === "success" || path === "/pay/success") {
      // Убираем параметр из URL
      window.history.replaceState({}, "", "/");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, prevScreen, showExitHint]);

  useBackButton(currentUser ? screen : "auth", handleBackButton);

  return {
    // состояние
    screen,
    chatId,
    currentUser,
    authLoading,
    showSplash, setShowSplash,
    locked, setLocked,
    banMessage, setBanMessage,
    activeCall, setActiveCall,
    incoming, dismissIncoming,
    offlineState,
    unreadMessages,
    unreadLikes,
    isMain,
    isDesktop,
    navVisible,
    animDir,
    animKey,
    joinStream, setJoinStream,
    showConfetti,
    deepLinkProfile, setDeepLinkProfile,
    // колбэки
    handleAuth,
    handleLogout,
    handlePhotoUpdate,
    handleProfileUpdate,
    navigateTo,
    openChat,
    goToChats,
    backToMatches,
    handleJoinLive,
  };
}

export type IndexController = ReturnType<typeof useIndexController>;