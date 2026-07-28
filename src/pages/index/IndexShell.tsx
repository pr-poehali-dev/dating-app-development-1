import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import { PremiumConfetti } from "@/components/screens/PremiumConfetti";
import OfflineBanner from "@/components/OfflineBanner";
import StarField from "@/components/StarField";
import { EnableNotificationsBanner } from "@/components/EnableNotificationsBanner";
import { BottomNav, DesktopSidebar } from "@/components/screens/AuthPremiumNav";
import VideoCall from "@/components/VideoCall";
import type { User } from "@/lib/api";
import type { Screen } from "./types";
import type { IndexController } from "./useIndexController";
import { IndexScreens } from "./IndexScreens";

// ─── IndexShell ───────────────────────────────────────────────────────────────
// Основной каркас приложения после входа: десктопная и мобильная раскладки
// вместе с оверлеями (профиль по ссылке, входящий видеозвонок). Вынесено из
// Index.tsx один-в-один.
export function IndexShell({ c, currentUser }: { c: IndexController; currentUser: User }) {
  const {
    screen, isMain, isDesktop, navVisible, animDir, animKey,
    offlineState, showConfetti, unreadMessages, unreadLikes,
    activeCall, setActiveCall, incoming, dismissIncoming,
    deepLinkProfile, setDeepLinkProfile,
    navigateTo, openChat, goToChats, handleLogout,
  } = c;

  const screensContent = <IndexScreens c={c} currentUser={currentUser} />;

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
        <StarField count={140} />
        <OfflineBanner offlineState={offlineState} />
        <EnableNotificationsBanner />
        {showConfetti && <PremiumConfetti />}
        <div className="app-screen-container desktop-mode" style={{ height: "100dvh" }}>
          {showSidebar && (
            <DesktopSidebar
              active={screen === "chat" ? "matches" : screen}
              onChange={(s) => navigateTo(s as Screen)}
              unreadMessages={unreadMessages}
              likesCount={unreadLikes}
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
        {deepLinkProfile && (
          <DiscoverProfileModal
            profile={deepLinkProfile}
            onClose={() => setDeepLinkProfile(null)}
            onLike={() => {}}
            onOpenChat={(id) => { setDeepLinkProfile(null); openChat(id); }}
            onGoToChats={() => { setDeepLinkProfile(null); goToChats(); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-bg flex justify-center">
      <div className="app-hearts-layer" />
      <StarField count={90} />
      <OfflineBanner offlineState={offlineState} />
      <EnableNotificationsBanner />
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
            <BottomNav active={screen} onChange={(s) => navigateTo(s as Screen)} unreadMessages={unreadMessages} likesCount={unreadLikes} />
          </div>
        )}
      </div>
      {deepLinkProfile && (
        <DiscoverProfileModal
          profile={deepLinkProfile}
          onClose={() => setDeepLinkProfile(null)}
          onLike={() => {}}
          onOpenChat={(id) => { setDeepLinkProfile(null); openChat(id); }}
          onGoToChats={() => { setDeepLinkProfile(null); goToChats(); }}
        />
      )}

      {/* Глобальный входящий видеозвонок — поверх любой вкладки */}
      {activeCall && (
        <VideoCall
          matchId={activeCall.matchId}
          partnerName={activeCall.name}
          partnerPhoto={activeCall.photo}
          isInitiator={activeCall.isInitiator}
          initialOffer={activeCall.offer}
          earlyIce={activeCall.earlyIce}
          onClose={() => setActiveCall(null)}
        />
      )}
      {!activeCall && incoming && (
        <VideoCall
          matchId={incoming.matchId}
          partnerName={incoming.callerName}
          partnerPhoto={incoming.callerPhoto}
          isInitiator={false}
          initialOffer={incoming.offer}
          earlyIce={incoming.earlyIce}
          onClose={dismissIncoming}
        />
      )}
    </div>
  );
}

export default IndexShell;