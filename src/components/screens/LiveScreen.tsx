import { useState, useRef, useEffect, useCallback } from "react";
import { liveApi, type User, type LiveStream, type LiveMessage } from "@/lib/api";
import { LiveActiveStream } from "@/components/screens/LiveActiveStream";
import { LiveStreamList } from "@/components/screens/LiveStreamList";
import { useLiveWebRTC } from "@/components/screens/useLiveWebRTC";
import { useLivePoll } from "@/components/screens/useLivePoll";
import { useLiveActions } from "@/components/screens/useLiveActions";
import { useAppRefresh } from "@/hooks/useAppRefresh";

export function LiveScreen({ currentUser, initialStream = null, onStreamConsumed }: {
  currentUser: User;
  initialStream?: LiveStream | null;
  onStreamConsumed?: () => void;
}) {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<LiveMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [heartsAnim, setHeartsAnim] = useState<number[]>([]);
  const [showStart, setShowStart] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [lastMsgId, setLastMsgId] = useState(0);
  const lastMsgIdRef = useRef(0);
  const lastHeartsCountRef = useRef(0);
  const [activeTab, setActiveTab] = useState("popular");
  const [tabSearch, setTabSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const webrtc = useLiveWebRTC(currentUser.id);

  const loadStreams = useCallback(() => {
    liveApi.list()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { pollRef } = useLivePoll({
    activeStream,
    isStreamingRef: webrtc.isStreamingRef,
    lastMsgIdRef,
    lastHeartsCountRef,
    setActiveStream,
    setChatMsgs,
    setLastMsgId,
    setHeartsAnim,
    stopAllPeers: webrtc.stopAllPeers,
    loadStreams,
  });

  const actions = useLiveActions({
    isStreamingRef: webrtc.isStreamingRef,
    streamRef: webrtc.streamRef,
    videoRef: webrtc.videoRef,
    peerConnsRef: webrtc.peerConnsRef,
    activeStreamIdRef: webrtc.activeStreamIdRef,
    pollRef,
    lastMsgIdRef,
    lastHeartsCountRef,
    stopCamera: webrtc.stopCamera,
    stopAllPeers: webrtc.stopAllPeers,
    startViewerWebRTC: webrtc.startViewerWebRTC,
    startStreamerSignaling: webrtc.startStreamerSignaling,
    setActiveStream,
    setIsStreaming,
    setChatMsgs,
    setChatInput,
    setHeartsAnim,
    setLastMsgId,
    setShowStart,
    setStreamTitle,
    setStreams,
    setLoading,
    activeStream,
    chatInput,
  });

  useEffect(() => { loadStreams(); }, []);

  useAppRefresh(() => { if (!activeStream) loadStreams(); });

  useEffect(() => {
    return () => { webrtc.stopCamera(); webrtc.stopAllPeers(); };
  }, [webrtc.stopCamera, webrtc.stopAllPeers]);

  useEffect(() => {
    if (initialStream) {
      actions.handleJoin(initialStream);
      onStreamConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  void lastMsgId;

  if (activeStream) {
    return (
      <LiveActiveStream
        activeStream={activeStream}
        isStreaming={isStreaming}
        leaving={actions.leaving}
        facingMode={actions.facingMode}
        micMuted={actions.micMuted}
        switchingCamera={actions.switchingCamera}
        heartsAnim={heartsAnim}
        chatMsgs={chatMsgs}
        chatInput={chatInput}
        videoRef={webrtc.videoRef}
        streamRef={webrtc.streamRef}
        onLeave={actions.handleLeave}
        onToggleMic={actions.handleToggleMic}
        onFlipCamera={actions.handleFlipCamera}
        onHeart={actions.handleHeart}
        onSendChat={actions.handleSendChat}
        onChatInputChange={setChatInput}
      />
    );
  }

  return (
    <LiveStreamList
      currentUser={currentUser}
      streams={streams}
      loading={loading}
      activeTab={activeTab}
      tabSearch={tabSearch}
      showSettings={showSettings}
      showTools={showTools}
      showStart={showStart}
      streamTitle={streamTitle}
      onTabChange={setActiveTab}
      onTabSearchChange={setTabSearch}
      onJoin={actions.handleJoin}
      onShowSettings={setShowSettings}
      onShowTools={setShowTools}
      onShowStart={setShowStart}
      onStreamTitleChange={setStreamTitle}
      onStartStream={() => actions.handleStartStream(streamTitle)}
      streamError={actions.streamError}
    />
  );
}