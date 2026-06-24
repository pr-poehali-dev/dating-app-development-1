import { useState, useCallback } from "react";
import { liveApi, type LiveStream, type LiveMessage } from "@/lib/api";

interface UseLiveActionsParams {
  isStreamingRef: React.MutableRefObject<boolean>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  peerConnsRef: React.MutableRefObject<Map<number, RTCPeerConnection>>;
  activeStreamIdRef: React.MutableRefObject<number | null>;
  pollRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  lastMsgIdRef: React.MutableRefObject<number>;
  lastHeartsCountRef: React.MutableRefObject<number>;
  stopCamera: () => void;
  stopAllPeers: () => void;
  startViewerWebRTC: (streamId: number) => Promise<void>;
  startStreamerSignaling: (streamId: number) => void;
  setActiveStream: React.Dispatch<React.SetStateAction<LiveStream | null>>;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  setChatMsgs: React.Dispatch<React.SetStateAction<LiveMessage[]>>;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  setHeartsAnim: React.Dispatch<React.SetStateAction<number[]>>;
  setLastMsgId: React.Dispatch<React.SetStateAction<number>>;
  setShowStart: React.Dispatch<React.SetStateAction<boolean>>;
  setStreamTitle: React.Dispatch<React.SetStateAction<string>>;
  setStreams: React.Dispatch<React.SetStateAction<LiveStream[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  activeStream: LiveStream | null;
  chatInput: string;
}

export function useLiveActions({
  isStreamingRef,
  streamRef,
  videoRef,
  peerConnsRef,
  activeStreamIdRef,
  pollRef,
  lastMsgIdRef,
  lastHeartsCountRef,
  stopCamera,
  stopAllPeers,
  startViewerWebRTC,
  startStreamerSignaling,
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
}: UseLiveActionsParams) {
  const [leaving, setLeaving] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [streamError, setStreamError] = useState("");

  const loadStreams = useCallback(() => {
    liveApi.list()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setStreams, setLoading]);

  const handleJoin = useCallback(async (stream: LiveStream) => {
    lastHeartsCountRef.current = stream.hearts_count || 0;
    activeStreamIdRef.current = stream.id;
    setActiveStream(stream); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    try { await liveApi.join(stream.id); } catch (e: unknown) { void e; }
    startViewerWebRTC(stream.id);
  }, [activeStreamIdRef, lastHeartsCountRef, lastMsgIdRef, setActiveStream, setChatMsgs, setLastMsgId, startViewerWebRTC]);

  const handleLeave = useCallback(async () => {
    if (!activeStream) return;
    setLeaving(true);
    await new Promise((r) => setTimeout(r, 350));
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    const streamId = activeStream.id;
    activeStreamIdRef.current = null;
    stopCamera();
    stopAllPeers();
    setActiveStream(null); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    setLeaving(false);
    if (isStreamingRef.current) {
      isStreamingRef.current = false;
      setIsStreaming(false);
      try { await liveApi.end(); } catch (e: unknown) { void e; }
    } else {
      try { await liveApi.leave(streamId); } catch (e: unknown) { void e; }
    }
    loadStreams();
  }, [activeStream, activeStreamIdRef, isStreamingRef, lastMsgIdRef, loadStreams, pollRef, setActiveStream, setChatMsgs, setIsStreaming, setLastMsgId, stopAllPeers, stopCamera]);

  const handleToggleMic = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = micMuted; });
    setMicMuted((v) => !v);
  }, [micMuted, streamRef]);

  const handleFlipCamera = useCallback(async () => {
    if (switchingCamera || !streamRef.current) return;
    setSwitchingCamera(true);
    const nextFacing = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing, width: { ideal: 1920, min: 1280 }, height: { ideal: 1080, min: 720 }, frameRate: { ideal: 60, min: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000, channelCount: 2 },
      });
      peerConnsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        newStream.getTracks().forEach((newTrack) => {
          const sender = senders.find((s) => s.track?.kind === newTrack.kind);
          if (sender) sender.replaceTrack(newTrack).catch(() => {});
        });
      });
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
      setFacingMode(nextFacing);
    } catch (e: unknown) { void e; }
    setSwitchingCamera(false);
  }, [facingMode, peerConnsRef, streamRef, switchingCamera, videoRef]);

  const handleStartStream = useCallback(async (streamTitle: string) => {
    if (!streamTitle.trim()) return;
    setStreamError("");

    let mediaStream: MediaStream | null = null;
    const attempts: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: "user",
          width:     { ideal: 1920, min: 1280 },
          height:    { ideal: 1080, min: 720 },
          frameRate: { ideal: 60,   min: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
          channelCount: 2,
        },
      },
      { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: true },
      { video: { facingMode: "user" }, audio: true },
      { video: true, audio: true },
      { video: true, audio: false },
    ];
    for (const constraints of attempts) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (e) { void e; }
    }

    if (!mediaStream) {
      setStreamError("Не удалось открыть камеру. Разреши доступ к камере в браузере (🔒 в адресной строке) и попробуй снова.");
      return;
    }

    try {
      streamRef.current = mediaStream;
      setFacingMode("user");
      const res = await liveApi.start(streamTitle.trim());
      isStreamingRef.current = true;
      activeStreamIdRef.current = res.stream.id;
      setIsStreaming(true);
      setShowStart(false);
      setStreamTitle("");
      setActiveStream(res.stream);
      setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
      lastHeartsCountRef.current = 0;
      startStreamerSignaling(res.stream.id);
    } catch (e: unknown) {
      void e;
      mediaStream.getTracks().forEach(t => t.stop());
      setStreamError("Ошибка запуска трансляции. Попробуй ещё раз.");
    }
  }, [activeStreamIdRef, isStreamingRef, lastHeartsCountRef, lastMsgIdRef, setActiveStream, setChatMsgs, setIsStreaming, setLastMsgId, setShowStart, setStreamTitle, startStreamerSignaling, streamRef]);

  const handleHeart = useCallback(async () => {
    if (!activeStream) return;
    const id = Date.now();
    setHeartsAnim((prev) => [...prev, id]);
    setTimeout(() => setHeartsAnim((prev) => prev.filter((x) => x !== id)), 1500);
    try {
      const res = await liveApi.heart(activeStream.id);
      setActiveStream((prev) => prev ? { ...prev, hearts_count: res.hearts_count } : prev);
    } catch (e: unknown) { void e; }
  }, [activeStream, setActiveStream, setHeartsAnim]);

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || !activeStream) return;
    const text = chatInput.trim(); setChatInput("");
    try {
      const res = await liveApi.chat(activeStream.id, text);
      setChatMsgs((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
    } catch (e: unknown) { void e; }
  }, [activeStream, chatInput, setChatInput, setChatMsgs]);

  return {
    leaving,
    facingMode,
    switchingCamera,
    micMuted,
    streamError,
    loadStreams,
    handleJoin,
    handleLeave,
    handleToggleMic,
    handleFlipCamera,
    handleStartStream,
    handleHeart,
    handleSendChat,
  };
}
