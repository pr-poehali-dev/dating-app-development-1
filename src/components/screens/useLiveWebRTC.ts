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

    lastSignalIdRef.current = 0;

    signalPollRef.current = setInterval(async () => {
      if (!activeStreamIdRef.current || !viewerPcRef.current) return;
      try {
        const res = await liveApi.signalPoll(activeStreamIdRef.current, lastSignalIdRef.current);
        for (const sig of res.signals) {
          lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);
          if (sig.to_user_id !== null && sig.to_user_id !== currentUserId) continue;

          if (sig.signal_type === "offer") {
            streamerId = sig.from_user_id;
            try {
              const offer = JSON.parse(sig.payload) as RTCSessionDescriptionInit;
              await viewerPcRef.current.setRemoteDescription(offer);
              const answer = await viewerPcRef.current.createAnswer();
              await viewerPcRef.current.setLocalDescription(answer);

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

    try {
      await liveApi.signalSend(streamId, "viewer_ready", JSON.stringify({ user_id: currentUserId }));
    } catch (e) { void e; }
  }, [currentUserId]);

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
                const sender = pc.addTrack(track, streamRef.current!);
                if (track.kind === "video") {
                  const params = sender.getParameters();
                  if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
                  params.encodings[0].maxBitrate = 8_000_000;
                  params.encodings[0].maxFramerate = 60;
                  sender.setParameters(params).catch(() => {});
                } else if (track.kind === "audio") {
                  const params = sender.getParameters();
                  if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
                  params.encodings[0].maxBitrate = 192_000;
                  sender.setParameters(params).catch(() => {});
                }
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
