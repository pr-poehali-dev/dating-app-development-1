import { useState, useRef, useEffect, useCallback } from "react";
import { liveApi, type User, type LiveStream, type LiveMessage } from "@/lib/api";
import { LiveActiveStream } from "@/components/screens/LiveActiveStream";
import { LiveStreamList } from "@/components/screens/LiveStreamList";

// ICE серверы для WebRTC (STUN + публичные TURN для обхода NAT)
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  // Публичные TURN серверы (open-relay) — помогают при строгом NAT
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

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
  const [leaving, setLeaving] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [streamError, setStreamError] = useState("");

  // WebRTC refs
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStreamingRef = useRef(false);
  // Стример: map peer connections для каждого зрителя
  const peerConnsRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  // Зритель: одно соединение со стримером
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const lastSignalIdRef = useRef(0);
  const signalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeStreamIdRef = useRef<number | null>(null);

  const loadStreams = () => {
    liveApi.list()
      .then((d) => setStreams(d.streams))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStreams(); }, []);

  // Cleanup
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopAllPeers = useCallback(() => {
    peerConnsRef.current.forEach((pc) => pc.close());
    peerConnsRef.current.clear();
    if (viewerPcRef.current) { viewerPcRef.current.close(); viewerPcRef.current = null; }
    if (signalPollRef.current) { clearInterval(signalPollRef.current); signalPollRef.current = null; }
  }, []);

  useEffect(() => {
    return () => { stopCamera(); stopAllPeers(); };
  }, [stopCamera, stopAllPeers]);

  // ── Создаём WebRTC-соединение для зрителя ────────────────────────────────
  const startViewerWebRTC = useCallback(async (streamId: number) => {
    // Создаём peer connection ЗАРАНЕЕ — до отправки viewer_ready
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    viewerPcRef.current = pc;
    let streamerId: number | null = null;
    const pendingIce: RTCIceCandidateInit[] = [];

    pc.ontrack = (e) => {
      if (videoRef.current && e.streams[0]) {
        videoRef.current.srcObject = e.streams[0];
        videoRef.current.play().catch(() => {});
      }
    };

    pc.onicecandidate = async (e) => {
      if (e.candidate && activeStreamIdRef.current && streamerId) {
        await liveApi.signalSend(
          activeStreamIdRef.current,
          "ice_viewer",
          JSON.stringify(e.candidate),
          streamerId
        ).catch(() => {});
      }
    };

    // Стартуем с last_id = 0, но фильтр на бэке `from_user_id != me` отсеет наши
    lastSignalIdRef.current = 0;

    // Запускаем polling ДО отправки viewer_ready, чтобы не пропустить ответ
    signalPollRef.current = setInterval(async () => {
      if (!activeStreamIdRef.current || !viewerPcRef.current) return;
      try {
        const res = await liveApi.signalPoll(activeStreamIdRef.current, lastSignalIdRef.current);
        for (const sig of res.signals) {
          lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);
          // Нас интересуют ТОЛЬКО сигналы адресованные нам
          if (sig.to_user_id !== null && sig.to_user_id !== currentUser.id) continue;

          if (sig.signal_type === "offer") {
            streamerId = sig.from_user_id;
            try {
              const offer = JSON.parse(sig.payload) as RTCSessionDescriptionInit;
              await viewerPcRef.current.setRemoteDescription(offer);
              const answer = await viewerPcRef.current.createAnswer();
              await viewerPcRef.current.setLocalDescription(answer);

              // Применяем ожидавшие ICE кандидаты
              for (const c of pendingIce) {
                try { await viewerPcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { void e; }
              }
              pendingIce.length = 0;

              await liveApi.signalSend(
                activeStreamIdRef.current!,
                "answer",
                JSON.stringify(viewerPcRef.current.localDescription),
                streamerId
              ).catch(() => {});
            } catch (e) { console.warn("viewer offer error", e); }
          } else if (sig.signal_type === "ice_streamer") {
            try {
              const candidate = JSON.parse(sig.payload);
              if (viewerPcRef.current.remoteDescription) {
                await viewerPcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              } else {
                pendingIce.push(candidate);
              }
            } catch (e) { void e; }
          }
        }
      } catch (e) { void e; }
    }, 600);

    // Шлём viewer_ready ПОСЛЕ запуска полла
    try {
      await liveApi.signalSend(streamId, "viewer_ready", JSON.stringify({ user_id: currentUser.id }));
    } catch (e) { void e; }
  }, [currentUser.id]);

  // ── Стример: обрабатываем входящие сигналы от зрителей ───────────────────
  const pendingViewerIceRef = useRef<Map<number, RTCIceCandidateInit[]>>(new Map());

  const startStreamerSignaling = useCallback((streamId: number) => {
    lastSignalIdRef.current = 0;

    signalPollRef.current = setInterval(async () => {
      if (!isStreamingRef.current || !activeStreamIdRef.current) return;
      try {
        const res = await liveApi.signalPoll(activeStreamIdRef.current, lastSignalIdRef.current);
        for (const sig of res.signals) {
          lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);

          if (sig.signal_type === "viewer_ready") {
            const viewerId = sig.from_user_id;
            if (peerConnsRef.current.has(viewerId)) {
              peerConnsRef.current.get(viewerId)!.close();
              peerConnsRef.current.delete(viewerId);
            }
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
            peerConnsRef.current.set(viewerId, pc);

            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, streamRef.current!);
              });
            }

            pc.onicecandidate = async (e) => {
              if (e.candidate && activeStreamIdRef.current) {
                await liveApi.signalSend(
                  activeStreamIdRef.current,
                  "ice_streamer",
                  JSON.stringify(e.candidate),
                  viewerId
                ).catch(() => {});
              }
            };

            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await liveApi.signalSend(
                activeStreamIdRef.current!,
                "offer",
                JSON.stringify(pc.localDescription),
                viewerId
              ).catch(() => {});
            } catch (e) { console.warn("offer create error", e); }

          } else if (sig.signal_type === "answer") {
            const viewerId = sig.from_user_id;
            const pc = peerConnsRef.current.get(viewerId);
            if (pc) {
              try {
                const answer = JSON.parse(sig.payload) as RTCSessionDescriptionInit;
                await pc.setRemoteDescription(answer);
                const pending = pendingViewerIceRef.current.get(viewerId) || [];
                for (const c of pending) {
                  try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { void e; }
                }
                pendingViewerIceRef.current.delete(viewerId);
              } catch (e) { console.warn("answer error", e); }
            }
          } else if (sig.signal_type === "ice_viewer") {
            const viewerId = sig.from_user_id;
            const pc = peerConnsRef.current.get(viewerId);
            try {
              const candidate = JSON.parse(sig.payload);
              if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } else {
                const arr = pendingViewerIceRef.current.get(viewerId) || [];
                arr.push(candidate);
                pendingViewerIceRef.current.set(viewerId, arr);
              }
            } catch (e) { void e; }
          }
        }
      } catch (e) { void e; }
    }, 600);

    void streamId;
  }, []);

  // ── Chat + viewers poll ───────────────────────────────────────────────────
  useEffect(() => {
    if (!activeStream) { if (pollRef.current) clearInterval(pollRef.current); return; }
    const poll = async () => {
      try {
        const res = await liveApi.poll(activeStream.id, lastMsgIdRef.current);
        if (res.stream.status === "ended" && !isStreamingRef.current) {
          setActiveStream(null); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
          stopAllPeers(); loadStreams(); return;
        }
        setActiveStream((prev) => prev ? { ...prev, viewers_count: res.stream.viewers_count, hearts_count: res.stream.hearts_count } : prev);
        if (res.stream.hearts_count > lastHeartsCountRef.current) {
          const diff = res.stream.hearts_count - lastHeartsCountRef.current;
          for (let i = 0; i < Math.min(diff, 5); i++) {
            const id = Date.now() + i;
            setHeartsAnim((prev) => [...prev, id]);
            setTimeout(() => setHeartsAnim((prev) => prev.filter((x) => x !== id)), 1500);
          }
        }
        lastHeartsCountRef.current = res.stream.hearts_count;
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
  }, [activeStream?.id, stopAllPeers]);

  void lastMsgId;

  // ── Зритель входит в трансляцию ──────────────────────────────────────────
  const handleJoin = async (stream: LiveStream) => {
    lastHeartsCountRef.current = stream.hearts_count || 0;
    activeStreamIdRef.current = stream.id;
    setActiveStream(stream); setChatMsgs([]); setLastMsgId(0); lastMsgIdRef.current = 0;
    try { await liveApi.join(stream.id); } catch (e: unknown) { void e; }
    // Запускаем WebRTC для получения видео
    startViewerWebRTC(stream.id);
  };

  useEffect(() => {
    if (initialStream) {
      handleJoin(initialStream);
      onStreamConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Выход ─────────────────────────────────────────────────────────────────
  const handleLeave = async () => {
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
      // Заменяем треки в существующих peer-соединениях
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
  };

  // ── Стартуем трансляцию ───────────────────────────────────────────────────
  const handleStartStream = async () => {
    if (!streamTitle.trim()) return;
    setStreamError("");

    // Пробуем получить поток с разными ограничениями (от идеальных к минимальным)
    let mediaStream: MediaStream | null = null;
    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true },
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
      streamError={streamError}
    />
  );
}