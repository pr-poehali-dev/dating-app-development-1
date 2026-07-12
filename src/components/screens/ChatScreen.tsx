import { profilesApi } from "@/lib/api";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { ChatMessagesList } from "@/components/chat/ChatMessagesList";
import { ChatScreenModals } from "@/components/chat/ChatScreenModals";
import { useChatScreenLogic } from "@/components/chat/useChatScreenLogic";

// ─── RealChatScreen ────────────────────────────────────────────────────────────
export function RealChatScreen({ matchId, currentUserId, onBack }: { matchId: number; currentUserId: number; onBack: () => void }) {
  const c = useChatScreenLogic(matchId, currentUserId);

  return (
    <>
      <ChatScreenModals
        matchId={matchId}
        currentUserId={currentUserId}
        partnerName={c.partnerName}
        partnerPhoto={c.partnerPhoto}
        partnerId={c.partnerId}
        contextMsg={c.contextMsg}
        setContextMsg={c.setContextMsg}
        handleDelete={c.handleDelete}
        showPartnerProfile={c.showPartnerProfile}
        setShowPartnerProfile={c.setShowPartnerProfile}
        videoCall={c.videoCall}
        setVideoCall={c.setVideoCall}
        showVideoCircle={c.showVideoCircle}
        setShowVideoCircle={c.setShowVideoCircle}
        sendSystem={c.sendSystem}
        showVanishPicker={c.showVanishPicker}
        setShowVanishPicker={c.setShowVanishPicker}
        vanishPhotos={c.vanishPhotos}
        sendVanishPhoto={c.sendVanishPhoto}
        showChatMenu={c.showChatMenu}
        setShowChatMenu={c.setShowChatMenu}
        subscribed={c.subscribed}
        setSubscribed={c.setSubscribed}
        showAwardPicker={c.showAwardPicker}
        setShowAwardPicker={c.setShowAwardPicker}
        showCompatibility={c.showCompatibility}
        setShowCompatibility={c.setShowCompatibility}
      />

      <div className="flex flex-col h-full" style={{ overscrollBehaviorX: "none" }}>
        <ChatHeader
          partnerName={c.partnerName}
          partnerPhoto={c.partnerPhoto}
          subscribed={c.subscribed}
          isBot={c.partnerName === 'Полутон'}
          onBack={onBack}
          onProfileClick={() => c.setShowPartnerProfile(true)}
          onSubscribeToggle={() => {
            if (!c.partnerId) return;
            const next = !c.subscribed;
            c.setSubscribed(next);
            profilesApi.subscribeToggle(c.partnerId).then(r => c.setSubscribed(r.subscribed)).catch(() => c.setSubscribed(!next));
          }}
          onVideoCall={() => c.setVideoCall({ isInitiator: true })}
          onMenuOpen={() => c.setShowChatMenu(true)}
          onCompatibility={() => c.setShowCompatibility(true)}
        />

        <ChatMessagesList
          msgs={c.msgs}
          partnerId={c.partnerId}
          deleting={c.deleting}
          swipeId={c.swipeId}
          swipeDx={c.swipeDx}
          bottomRef={c.bottomRef}
          timeAgoRu={c.timeAgoRu}
          startHold={c.startHold}
          cancelHold={c.cancelHold}
          onMsgTouchStart={c.onMsgTouchStart}
          onMsgTouchMove={c.onMsgTouchMove}
          onMsgTouchEnd={c.onMsgTouchEnd}
          sendSystem={c.sendSystem}
        />

        <ChatInputBar
          input={c.input}
          recording={c.recording}
          recordSecs={c.recordSecs}
          showPlus={c.showPlus}
          showEmoji={c.showEmoji}
          showStickers={c.showStickers}
          geoLoading={c.geoLoading}
          inputRef={c.inputRef}
          fileRef={c.fileRef}
          cameraRef={c.cameraRef}
          onInputChange={c.setInput}
          onSend={c.send}
          onStartRecording={c.startRecording}
          onStopRecording={c.stopRecording}
          onTogglePlus={() => { c.setShowPlus(v => !v); c.setShowEmoji(false); c.setShowStickers(false); }}
          onToggleEmoji={() => { c.setShowEmoji(v => !v); c.setShowPlus(false); c.setShowStickers(false); }}
          onToggleStickers={() => { c.setShowStickers(v => !v); c.setShowPlus(false); c.setShowEmoji(false); }}
          onEmojiPick={(em) => { c.setInput(v => v + em); c.inputRef.current?.focus(); }}
          onSendSticker={(url) => { c.sendSystem(`__STICKER__${url}`); c.setShowStickers(false); }}
          onFileSelect={c.handleFileSelect}
          onOpenVanishPicker={c.openVanishPicker}
          onSendLocation={c.sendLocation}
          onOpenVideoCall={() => { c.setShowPlus(false); c.setVideoCall({ isInitiator: true }); }}
          onOpenAwardPicker={() => { c.setShowAwardPicker(true); c.setShowPlus(false); }}
          onOpenVideoCircle={() => { c.setShowVideoCircle(true); c.setShowPlus(false); }}
        />
      </div>
    </>
  );
}
