import { type Message, type Profile } from "@/lib/api";
import { haptic, nativeShare } from "@/hooks/useNative";
import { VideoCircleRecorder } from "@/components/chat/VideoCircleRecorder";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import VideoCall from "@/components/VideoCall";
import { ChatContextMenu, ChatVanishPicker, ChatMenu, ChatAwardPicker } from "@/components/chat/ChatModals";
import { CompatibilityGame } from "@/components/screens/CompatibilityGame";
import { profilesApi } from "@/lib/api";

interface ChatScreenModalsProps {
  matchId: number;
  currentUserId: number;
  partnerName: string;
  partnerPhoto: string;
  partnerId: number | null;
  contextMsg: Message | null;
  setContextMsg: (m: Message | null) => void;
  handleDelete: (msg: Message) => Promise<void>;
  showPartnerProfile: boolean;
  setShowPartnerProfile: (v: boolean) => void;
  videoCall: { isInitiator: boolean; offerPayload?: string; earlyIce?: string[] } | null;
  setVideoCall: (v: { isInitiator: boolean; offerPayload?: string; earlyIce?: string[] } | null) => void;
  showVideoCircle: boolean;
  setShowVideoCircle: (v: boolean) => void;
  sendSystem: (text: string) => Promise<void>;
  showVanishPicker: boolean;
  setShowVanishPicker: (v: boolean) => void;
  vanishPhotos: { id: number; photo_url: string }[];
  sendVanishPhoto: (photoUrl: string) => Promise<void>;
  showChatMenu: boolean;
  setShowChatMenu: (v: boolean) => void;
  subscribed: boolean;
  setSubscribed: (v: boolean) => void;
  showAwardPicker: boolean;
  setShowAwardPicker: (v: boolean) => void;
  showCompatibility: boolean;
  setShowCompatibility: (v: boolean) => void;
}

// ─── ChatScreenModals ────────────────────────────────────────────────────────
export function ChatScreenModals({
  matchId, currentUserId, partnerName, partnerPhoto, partnerId,
  contextMsg, setContextMsg, handleDelete,
  showPartnerProfile, setShowPartnerProfile,
  videoCall, setVideoCall,
  showVideoCircle, setShowVideoCircle,
  sendSystem,
  showVanishPicker, setShowVanishPicker, vanishPhotos, sendVanishPhoto,
  showChatMenu, setShowChatMenu, subscribed, setSubscribed,
  showAwardPicker, setShowAwardPicker,
  showCompatibility, setShowCompatibility,
}: ChatScreenModalsProps) {
  return (
    <>
      {contextMsg && (
        <ChatContextMenu
          msg={contextMsg}
          onDelete={handleDelete}
          onClose={() => setContextMsg(null)}
        />
      )}

      {showPartnerProfile && partnerId && partnerName !== 'Полутон' && (
        <DiscoverProfileModal
          profile={{ id: partnerId, name: partnerName, photo_url: partnerPhoto } as Profile}
          onClose={() => setShowPartnerProfile(false)}
          onLike={() => {}}
        />
      )}

      {videoCall && (
        <VideoCall
          matchId={matchId}
          partnerName={partnerName}
          partnerPhoto={partnerPhoto}
          isInitiator={videoCall.isInitiator}
          initialOffer={videoCall.offerPayload}
          earlyIce={videoCall.earlyIce}
          onClose={() => setVideoCall(null)}
        />
      )}

      {showVideoCircle && (
        <VideoCircleRecorder
          onClose={() => setShowVideoCircle(false)}
          onSend={async (blob, mimeType) => {
            setShowVideoCircle(false);
            try {
              const reader = new FileReader();
              reader.onload = async (e) => {
                const base64 = (e.target?.result as string).split(",")[1];
                const up = await profilesApi.uploadVideoCircle(base64, mimeType);
                if (up?.url) await sendSystem(`__VIDEOCIRCLE__${up.url}`);
              };
              reader.readAsDataURL(blob);
            } catch { void 0; }
          }}
        />
      )}

      {showVanishPicker && (
        <ChatVanishPicker
          photos={vanishPhotos}
          onPick={sendVanishPhoto}
          onClose={() => setShowVanishPicker(false)}
        />
      )}

      {showChatMenu && (
        <ChatMenu
          onGrantPhoto={() => { setShowChatMenu(false); sendSystem("__GRANT_PHOTO__"); }}
          onRequestPhoto={() => { setShowChatMenu(false); sendSystem("__REQUEST_PHOTO__"); }}
          onClose={() => setShowChatMenu(false)}
          isBot={partnerName === 'Полутон'}
          subscribed={subscribed}
          onSubscribeToggle={() => {
            if (!partnerId) return;
            const next = !subscribed;
            setSubscribed(next);
            profilesApi.subscribeToggle(partnerId).then(r => setSubscribed(r.subscribed)).catch(() => setSubscribed(!next));
          }}
          onShare={async () => {
            haptic("light");
            await nativeShare({ title: `${partnerName} — Полутон`, text: `Познакомься с ${partnerName} в Полутон!`, url: "https://полуто-н.рф" });
          }}
        />
      )}

      {showAwardPicker && (
        <ChatAwardPicker
          onPick={(emoji) => { sendSystem(`__AWARD__${emoji}`); setShowAwardPicker(false); }}
          onClose={() => setShowAwardPicker(false)}
        />
      )}

      {showCompatibility && partnerId && (
        <CompatibilityGame
          matchId={matchId}
          partnerId={partnerId}
          partnerName={partnerName}
          partnerPhoto={partnerPhoto}
          currentUserId={currentUserId}
          onClose={() => setShowCompatibility(false)}
        />
      )}
    </>
  );
}