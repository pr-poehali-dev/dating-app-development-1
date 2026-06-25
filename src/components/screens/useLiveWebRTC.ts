import { useRef, useCallback } from "react";
import { liveApi } from "@/lib/api";

export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
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
    // Закрываем предыдущее соединение если есть
    if (viewerPcRef.current) {
      viewerPcRef.current.close();
      viewerPcRef.current = null;
    }
    if (signalPollRef.current) {
      clearInterval(signalPollRef.current);
      signalPollRef.current = null;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
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

    // Получаем текущий максимальный signal id перед отправкой viewer_ready
    // чтобы не подхватить старые offer от предыдущих зрителей
    let startSignalId = 0;
    try {
      const probe = await liveApi.signalPoll(streamId, 0);
      if (probe.signals.length > 0) {
        startSignalId = probe.signals[probe.signals.length - 1].id;
      }
    } catch (e) { void e; }
    lastSignalIdRef.current = startSignalId;

    // Отправляем viewer_ready — стример начнёт создавать offer
    try {
      await liveApi.signalSend(streamId, "viewer_ready", JSON.stringify({ user_id: currentUserId }));
    } catch (e) { void e; }

    // Запускаем поллинг сигналов
    signalPollRef.current = setInterval(async () => {
      if (!activeStreamIdRef.current || !viewerPcRef.current) return;
      try {
        const res = await liveApi.signalPoll(activeStreamIdRef.current, lastSignalIdRef.current);
        for (const sig of res.signals) {
          lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);
          if (sig.to_user_id !== null && sig.to_user_id !== currentUserId) continue;

          if (sig.signal_type === "offer") {
            // Если уже есть remoteDescription — игнорируем повторный offer
            if (viewerPcRef.current.remoteDescription) continue;
            streamerId = sig.from_user_id;
            try {
              const offer = JSON.parse(sig.payload) as RTCSessionDescriptionInit;
              await viewerPcRef.current.setRemoteDescription(offer);

              // Применяем накопленные ICE кандидаты
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
    }, 500);
  }, [currentUserId]);

  const startStreamerSignaling = useCallback((streamId: number) => {
    lastSignalIdRef.current = 0;

    // Инициализируем last_id до начала поллинга, чтобы не подхватить старые сигналы
    liveApi.signalPoll(streamId, 0).then(res => {
      if (res.signals.length > 0) {
        lastSignalIdRef.current = res.signals[res.signals.length - 1].id;
      }
    }).catch(() => {});

    signalPollRef.current = setInterval(async () => {
      if (!isStreamingRef.current || !activeStreamIdRef.current) return;
      try {
        const res = await liveApi.signalPoll(activeStreamIdRef.current, lastSignalIdRef.current);
        for (const sig of res.signals) {
          lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);

          if (sig.signal_type === "viewer_ready") {
            const viewerId = sig.from_user_id;
            // Закрываем старое соединение с этим зрителем если есть
            if (peerConnsRef.current.has(viewerId)) {
              peerConnsRef.current.get(viewerId)!.close();
              peerConnsRef.current.delete(viewerId);
            }
            pendingViewerIceRef.current.delete(viewerId);

            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
            peerConnsRef.current.set(viewerId, pc);

            // Добавляем треки без setParameters — параметры нельзя менять до negotiation
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
                // Применяем накопленные ICE кандидаты от зрителя
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
    }, 500);

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