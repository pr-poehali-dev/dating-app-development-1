import { useRef, useCallback } from "react";
import { liveApi } from "@/lib/api";

// STUN + TURN. TURN нужен, чтобы соединение устанавливалось у зрителей за
// строгим NAT/мобильным оператором — без него трансляция часто «висит»/лагает.
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// Лимиты битрейта (bps)
const VIDEO_MAX_BITRATE = 1_500_000;  // 1.5 Mbps — чёткое 720p без перегруза сети
const AUDIO_MAX_BITRATE = 96_000;     // 96 kbps

async function applyBitrateLimit(pc: RTCPeerConnection) {
  const senders = pc.getSenders();
  for (const sender of senders) {
    if (!sender.track) continue;
    try {
      const params = sender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }
      if (sender.track.kind === "video") {
        params.encodings[0].maxBitrate = VIDEO_MAX_BITRATE;
        params.encodings[0].scaleResolutionDownBy = 1.0;
        // При слабой сети жертвуем разрешением, но сохраняем плавность —
        // это убирает рывки/лаги в кадре.
        params.degradationPreference = "maintain-framerate";
      } else if (sender.track.kind === "audio") {
        params.encodings[0].maxBitrate = AUDIO_MAX_BITRATE;
      }
      await sender.setParameters(params);
    } catch (_) { void _; }
  }
}

export function useLiveWebRTC(currentUserId: number) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStreamingRef = useRef(false);
  const peerConnsRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const lastSignalIdRef = useRef(0);
  const signalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeStreamIdRef = useRef<number | null>(null);
  const pendingViewerIceRef = useRef<Map<number, RTCIceCandidateInit[]>>(new Map());
  // Флаги для защиты от параллельных поллинг-вызовов
  const viewerPollingRef = useRef(false);
  const streamerPollingRef = useRef(false);

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

  const startViewerWebRTC = useCallback(async (streamId: number) => {
    if (viewerPcRef.current) {
      viewerPcRef.current.close();
      viewerPcRef.current = null;
    }
    if (signalPollRef.current) {
      clearInterval(signalPollRef.current);
      signalPollRef.current = null;
    }

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });
    viewerPcRef.current = pc;
    let streamerId: number | null = null;
    const pendingIce: RTCIceCandidateInit[] = [];

    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

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

    // Получаем текущий максимальный signal id
    let startSignalId = 0;
    try {
      const probe = await liveApi.signalPoll(streamId, 0);
      if (probe.signals.length > 0) {
        startSignalId = probe.signals[probe.signals.length - 1].id;
      }
    } catch (e) { void e; }
    lastSignalIdRef.current = startSignalId;

    // Сообщаем стримеру что зритель готов
    try {
      await liveApi.signalSend(streamId, "viewer_ready", JSON.stringify({ user_id: currentUserId }));
    } catch (e) { void e; }

    // Поллинг сигналов с защитой от параллельных вызовов
    signalPollRef.current = setInterval(async () => {
      if (!activeStreamIdRef.current || !viewerPcRef.current) return;
      if (viewerPollingRef.current) return; // предыдущий запрос ещё не завершился
      viewerPollingRef.current = true;
      try {
        const res = await liveApi.signalPoll(activeStreamIdRef.current, lastSignalIdRef.current);
        for (const sig of res.signals) {
          lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);
          if (sig.to_user_id !== null && sig.to_user_id !== currentUserId) continue;

          if (sig.signal_type === "offer") {
            if (viewerPcRef.current.remoteDescription) continue;
            streamerId = sig.from_user_id;
            try {
              const offer = JSON.parse(sig.payload) as RTCSessionDescriptionInit;
              await viewerPcRef.current.setRemoteDescription(offer);

              for (const c of pendingIce) {
                try { await viewerPcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch (_) { void _; }
              }
              pendingIce.length = 0;

              const answer = await viewerPcRef.current.createAnswer();
              await viewerPcRef.current.setLocalDescription(answer);

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
            } catch (_) { void _; }
          }
        }
      } catch (e) { void e; }
      finally { viewerPollingRef.current = false; }
    }, 800);
  }, [currentUserId]);

  const startStreamerSignaling = useCallback((streamId: number) => {
    lastSignalIdRef.current = 0;

    liveApi.signalPoll(streamId, 0).then(res => {
      if (res.signals.length > 0) {
        lastSignalIdRef.current = res.signals[res.signals.length - 1].id;
      }
    }).catch(() => {});

    signalPollRef.current = setInterval(async () => {
      if (!isStreamingRef.current || !activeStreamIdRef.current) return;
      if (streamerPollingRef.current) return; // защита от параллельных запросов
      streamerPollingRef.current = true;
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
            pendingViewerIceRef.current.delete(viewerId);

            const pc = new RTCPeerConnection({
              iceServers: ICE_SERVERS,
              iceTransportPolicy: "all",
              bundlePolicy: "max-bundle",
              rtcpMuxPolicy: "require",
            });
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
            if (pc && pc.signalingState === "have-local-offer") {
              try {
                const answer = JSON.parse(sig.payload) as RTCSessionDescriptionInit;
                await pc.setRemoteDescription(answer);

                // Применяем битрейт-лимит после установки соединения
                await applyBitrateLimit(pc);

                const pending = pendingViewerIceRef.current.get(viewerId) || [];
                for (const c of pending) {
                  try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) { void _; }
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
            } catch (_) { void _; }
          }
        }
      } catch (e) { void e; }
      finally { streamerPollingRef.current = false; }
    }, 800);

  }, []);

  return {
    videoRef,
    streamRef,
    isStreamingRef,
    peerConnsRef,
    activeStreamIdRef,
    stopCamera,
    stopAllPeers,
    startViewerWebRTC,
    startStreamerSignaling,
  };
}