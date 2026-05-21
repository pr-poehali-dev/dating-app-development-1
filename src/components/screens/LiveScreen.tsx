import { useState, useRef, useEffect, useCallback } from "react";
import { liveApi, type User, type LiveStream, type LiveMessage } from "@/lib/api";
import { LiveActiveStream } from "@/components/screens/LiveActiveStream";
import { LiveStreamList } from "@/components/screens/LiveStreamList";

export function LiveScreen({ currentUser }: { currentUser: User }) {
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
  const [activeTab, setActiveTab] = useState("popular");
  const [tabSearch, setTabSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadStreams = () => {
    liveApi.list()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStreams(); }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  useEffect(() => {
    if (!activeStream) { if (pollRef.current) clearInterval(pollRef.current); return; }
    const poll = async () => {
      try {
        const res = await liveApi.poll(activeStream.id, lastMsgIdRef.current);
        if (res.stream.status === 'ended' && !isStreaming) {
          setActiveStream(null); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
          loadStreams(); return;
        }
        setActiveStream((prev) => prev ? { ...prev, viewers_count: res.stream.viewers_count, hearts_count: res.stream.hearts_count } : prev);
        if (res.messages.length > 0) {
          const newId = res.messages[res.messages.length - 1].id;
          lastMsgIdRef.current = newId;
          setLastMsgId(newId);
          setChatMsgs((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = res.messages.filter((m: LiveMessage) => !existingIds.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
      } catch (e: unknown) { void e; }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeStream?.id, isStreaming]);

  void lastMsgId;

  const handleJoin = async (stream: LiveStream) => {
    setActiveStream(stream); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    try { await liveApi.join(stream.id); } catch (e: unknown) { void e; }
  };

  const handleLeave = async () => {
    if (!activeStream) return;
    setLeaving(true);
    await new Promise((r) => setTimeout(r, 350));
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    const streamId = activeStream.id;
    stopCamera();
    setActiveStream(null); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    setLeaving(false);
    if (isStreaming) {
      setIsStreaming(false);
      try { await liveApi.end(); } catch (e: unknown) { void e; }
    } else {
      try { await liveApi.leave(streamId); } catch (e: unknown) { void e; }
    }
    loadStreams();
  };

  const handleToggleMic = () => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = micMuted; });
    setMicMuted((v) => !v);
  };

  const handleFlipCamera = async () => {
    if (switchingCamera || !streamRef.current) return;
    setSwitchingCamera(true);
    const nextFacing = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: nextFacing }, audio: true });
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
      setFacingMode(nextFacing);
    } catch (e: unknown) { void e; }
    setSwitchingCamera(false);
  };

  const handleStartStream = async () => {
    if (!streamTitle.trim()) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = mediaStream;
      setFacingMode("user");
      const res = await liveApi.start(streamTitle.trim());
      setIsStreaming(true);
      setShowStart(false);
      setStreamTitle("");
      setActiveStream(res.stream);
      setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    } catch (e: unknown) { void e; }
  };

  const handleHeart = async () => {
    if (!activeStream) return;
    const id = Date.now();
    setHeartsAnim((prev) => [...prev, id]);
    setTimeout(() => setHeartsAnim((prev) => prev.filter((x) => x !== id)), 1500);
    try { const res = await liveApi.heart(activeStream.id); setActiveStream((prev) => prev ? { ...prev, hearts_count: res.hearts_count } : prev); }
    catch (e: unknown) { void e; }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeStream) return;
    const text = chatInput.trim(); setChatInput("");
    try {
      const res = await liveApi.chat(activeStream.id, text);
      lastMsgIdRef.current = res.message.id;
      setLastMsgId(res.message.id);
      setChatMsgs((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
    } catch (e: unknown) { void e; }
  };

  if (activeStream) {
    return (
      <LiveActiveStream
        activeStream={activeStream}
        isStreaming={isStreaming}
        leaving={leaving}
        facingMode={facingMode}
        micMuted={micMuted}
        switchingCamera={switchingCamera}
        heartsAnim={heartsAnim}
        chatMsgs={chatMsgs}
        chatInput={chatInput}
        videoRef={videoRef}
        streamRef={streamRef}
        onLeave={handleLeave}
        onToggleMic={handleToggleMic}
        onFlipCamera={handleFlipCamera}
        onHeart={handleHeart}
        onSendChat={handleSendChat}
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
      onJoin={handleJoin}
      onShowSettings={setShowSettings}
      onShowTools={setShowTools}
      onShowStart={setShowStart}
      onStreamTitleChange={setStreamTitle}
      onStartStream={handleStartStream}
    />
  );
}
