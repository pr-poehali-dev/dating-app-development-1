import { PremiumScreen, PremiumScreenDesktop } from "@/components/screens/AuthPremiumNav";
import { FilterScreen } from "@/components/screens/SwipeScreens";
import { LiveScreen, RealMatchesScreen, RealLikesScreen, RealChatScreen } from "@/components/screens/SocialScreens";
import { PeopleScreen } from "@/components/screens/PeopleScreen";
import { RealProfileScreen, VerifyScreen, AdminVerifyScreen } from "@/components/screens/ProfileScreens";
import { HomeScreen } from "@/components/screens/HomeScreen";
import type { User } from "@/lib/api";
import type { IndexController } from "./useIndexController";

// ─── IndexScreens ───────────────────────────────────────────────────────────────
// Содержимое экранов (screensContent) — вынесено из Index.tsx один-в-один.
export function IndexScreens({ c, currentUser }: { c: IndexController; currentUser: User }) {
  const { screen, chatId, isDesktop, joinStream, setJoinStream, navigateTo, openChat, goToChats, backToMatches, handleJoinLive, handleLogout, handlePhotoUpdate, handleProfileUpdate } = c;

  return (
    <>
      {screen === "discover" && <HomeScreen currentUser={currentUser} onGoLive={() => navigateTo("live")} onJoinLive={handleJoinLive} onOpenChat={openChat} onGoToChats={goToChats} onPremium={() => navigateTo("premium")} />}
      {screen === "photos" && <PeopleScreen onOpenChat={openChat} onGoToChats={goToChats} onPremium={() => navigateTo("premium")} onOpenSelf={() => navigateTo("profile")} isPremium={!!currentUser.premium} currentUserId={currentUser.id} />}
      {screen === "live" && <LiveScreen currentUser={currentUser} initialStream={joinStream} onStreamConsumed={() => setJoinStream(null)} />}
      <div className="h-full" style={{ display: screen === "matches" ? "flex" : "none", flexDirection: "column" }}>
        <RealMatchesScreen onChat={openChat} />
      </div>
      {screen === "likes" && <RealLikesScreen isPremium={!!currentUser.premium} onPremium={() => navigateTo("premium")} onOpenChat={openChat} onGoToChats={goToChats} />}
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
}

export default IndexScreens;