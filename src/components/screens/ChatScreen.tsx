import { profilesApi } from "@/lib/api";
import Icon from "@/components/ui/icon";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { PhotoCapture } from "@/components/chat/PhotoCapture";
import { ChatMessagesList } from "@/components/chat/ChatMessagesList";
import { ChatIcebreakers } from "@/components/chat/ChatIcebreakers";
import { ChatScreenModals } from "@/components/chat/ChatScreenModals";
import { useChatScreenLogic } from "@/components/chat/useChatScreenLogic";
import { isVideoBlocked } from "@/lib/videoBlocks";
import { toast } from "@/hooks/use-toast";

// ─── RealChatScreen ────────────────────────────────────────────────────────────
export function RealChatScreen({ matchId, currentUserId, onBack }: { matchId: number; currentUserId: number; onBack: () => void }) {
  const c = useChatScreenLogic(matchId, currentUserId);

  const startVideoCall = () => {
    if (isVideoBlocked(c.partnerId)) {
      toast({ title: "Видеозвонки заблокированы", description: `Вы запретили видеочаты с ${c.partnerName || "этим пользователем"}. Разрешите их в меню чата.` });
      return;
    }
    c.setVideoCall({ isInitiator: true });
  };

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
          isBot={c.isBot}
          onBack={onBack}
          onProfileClick={() => { if (!c.isBot) c.setShowPartnerProfile(true); }}
          onSubscribeToggle={() => {
            if (!c.partnerId) return;
            const next = !c.subscribed;
            c.setSubscribed(next);
            profilesApi.subscribeToggle(c.partnerId).then(r => c.setSubscribed(r.subscribed)).catch(() => c.setSubscribed(!next));
          }}
          onVideoCall={startVideoCall}
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
          reactions={c.reactions}
          popReactionId={c.popReactionId}
          onReact={c.react}
        />

        {!c.isBot && c.micError && (
          <div className="mx-3 mb-2 px-3.5 py-2.5 rounded-2xl flex items-start gap-2.5"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)" }}>
            <Icon name="MicOff" size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-red-400 text-xs leading-relaxed flex-1">{c.micError}</span>
            <button onClick={() => c.setMicError(null)} className="flex-shrink-0">
              <Icon name="X" size={15} className="text-red-400/60" />
            </button>
          </div>
        )}

        {c.isBot ? (
          <div className="px-4 py-4 flex items-center justify-center gap-2 text-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon name="Info" size={15} className="text-white/40 flex-shrink-0" />
            <span className="text-white/45 text-xs leading-relaxed">
              Это официальный аккаунт Полутон. Отвечать на сообщения нельзя.
            </span>
          </div>
        ) : (
          <>
          {c.msgs.filter(m => !(m.text || "").startsWith("__")).length === 0 && (
            <ChatIcebreakers matchId={matchId} onPick={(t) => { c.setInput(t); c.inputRef.current?.focus(); }} />
          )}
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
            onOpenVideoCall={() => { c.setShowPlus(false); startVideoCall(); }}
            onOpenAwardPicker={() => { c.setShowAwardPicker(true); c.setShowPlus(false); }}
            onOpenVideoCircle={() => { c.setShowVideoCircle(true); c.setShowPlus(false); }}
            onOpenCamera={() => { c.setShowCamera(true); c.setShowPlus(false); }}
          />
          {c.showCamera && (
            <PhotoCapture
              onCapture={c.sendCapturedPhoto}
              onClose={() => c.setShowCamera(false)}
              onFallback={() => { c.setShowCamera(false); c.fileRef.current?.click(); }}
            />
          )}
          </>
        )}
      </div>
    </>
  );
}