import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { messagesApi } from "@/lib/api";

type CallState = "calling" | "incoming" | "connected" | "ended";

interface Props {
  matchId: number;
  partnerName: string;
  partnerPhoto: string;
  isInitiator: boolean;
  initialOffer?: string;
  onClose: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function VideoCall({ matchId, partnerName, partnerPhoto, isInitiator, initialOffer, onClose }: Props) {
  const [callState, setCallState] = useState<CallState>(isInitiator ? "calling" : "incoming");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingOfferRef = useRef<string | null>(initialOffer ?? null);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, []);

  const stopAll = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    stopAll();
    messagesApi.signalSend(matchId, "hangup", "bye").catch(() => {});
    onClose();
  }, [stopAll, matchId, onClose]);

  const getMedia = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      // Попробовать только аудио если нет камеры
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setMediaError("Камера недоступна — звонок только с аудио");
      } catch (e) {
        const err = e as { name?: string };
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          setMediaError("Разреши доступ к микрофону в настройках браузера");
        } else {
          setMediaError("Не удалось получить доступ к микрофону или камере");
        }
        throw e;
      }
    }
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const buildPeer = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      setCallState("connected");
      startTimer();
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        messagesApi.signalSend(matchId, "ice", JSON.stringify(e.candidate)).catch(() => {});
      }
    };
    return pc;
  };

  const startCall = useCallback(async () => {
    try {
      const stream = await getMedia();
      const pc = buildPeer(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await messagesApi.signalSend(matchId, "offer", JSON.stringify(offer));
    } catch (e) {
      console.error("[VideoCall] startCall error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const acceptCall = useCallback(async () => {
    const offerPayload = pendingOfferRef.current;
    if (!offerPayload) {
      console.warn("[VideoCall] acceptCall: no offer payload");
      return;
    }
    try {
      const stream = await getMedia();
      const pc = buildPeer(stream);
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerPayload)));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await messagesApi.signalSend(matchId, "answer", JSON.stringify(answer));
      setCallState("connected");
      startTimer();
    } catch (e) {
      console.error("[VideoCall] acceptCall error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, startTimer]);

  useEffect(() => {
    const poll = async () => {
      try {
        const { signals } = await messagesApi.signalPoll(matchId);
        for (const sig of signals) {
          if (sig.signal_type === "offer" && !pendingOfferRef.current) {
            pendingOfferRef.current = sig.payload;
          }
          if (sig.signal_type === "answer" && pcRef.current) {
            try {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(sig.payload)));
            } catch { /* ignore */ }
          }
          if (sig.signal_type === "ice" && pcRef.current) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(sig.payload)));
            } catch { /* ignore */ }
          }
          if (sig.signal_type === "hangup") {
            stopAll();
            setCallState("ended");
            setTimeout(onClose, 2000);
          }
        }
      } catch { /* ignore */ }
    };

    pollRef.current = setInterval(poll, 1500);
    if (isInitiator) startCall();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, isInitiator]);

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(v => !v);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(v => !v);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#0d0b14" }}>
      <div className="flex-1 relative overflow-hidden">
        {callState === "connected" ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-6">
            <img src={partnerPhoto} className="w-28 h-28 rounded-full object-cover border-4 border-white/20" />
            <p className="text-white text-xl font-semibold">{partnerName}</p>
            <p className="text-white/50 text-sm animate-pulse">
              {callState === "calling" && "Вызов..."}
              {callState === "incoming" && "Входящий видеозвонок"}
              {callState === "ended" && "Звонок завершён"}
            </p>
            {mediaError && (
              <div className="mt-2 px-4 py-3 rounded-2xl text-center max-w-xs"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <p className="text-red-300 text-sm leading-relaxed">{mediaError}</p>
                <p className="text-white/30 text-xs mt-1">Проверь разрешения в браузере и попробуй снова</p>
              </div>
            )}
          </div>
        )}

        {callState === "connected" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-sm font-mono"
            style={{ background: "rgba(0,0,0,0.4)" }}>
            {formatDuration(duration)}
          </div>
        )}

        <div className="absolute bottom-4 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
              <Icon name="VideoOff" size={20} className="text-white/50" />
            </div>
          )}
        </div>
      </div>

      <div className="pb-12 pt-6 flex items-center justify-center gap-6"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}>
        {callState === "incoming" ? (
          <>
            <button onClick={handleClose}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{ background: "#ef4444" }}>
              <Icon name="PhoneOff" size={26} className="text-white" />
            </button>
            <button onClick={acceptCall}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{ background: "#22c55e" }}>
              <Icon name="Video" size={26} className="text-white" />
            </button>
          </>
        ) : (
          <>
            <button onClick={toggleMic}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: micOn ? "rgba(255,255,255,0.15)" : "rgba(255,45,120,0.4)" }}>
              <Icon name={micOn ? "Mic" : "MicOff"} size={22} className="text-white" />
            </button>
            <button onClick={handleClose}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{ background: "#ef4444" }}>
              <Icon name="PhoneOff" size={26} className="text-white" />
            </button>
            <button onClick={toggleCam}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: camOn ? "rgba(255,255,255,0.15)" : "rgba(255,45,120,0.4)" }}>
              <Icon name={camOn ? "Video" : "VideoOff"} size={22} className="text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}