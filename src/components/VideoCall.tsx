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
  earlyIce?: string[];
  onClose: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
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
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoCall({ matchId, partnerName, partnerPhoto, isInitiator, initialOffer, earlyIce, onClose }: Props) {
  const [callState, setCallState] = useState<CallState>(isInitiator ? "calling" : "incoming");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [switchingCam, setSwitchingCam] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingOfferRef = useRef<string | null>(initialOffer ?? null);
  const iceBufferRef = useRef<RTCIceCandidateInit[]>(
    (earlyIce || []).map(p => { try { return JSON.parse(p); } catch { return null; } }).filter(Boolean) as RTCIceCandidateInit[]
  );
  const remoteDescSetRef = useRef(false);
  const facingModeRef = useRef<"user" | "environment">("user");

  const ringCtxRef = useRef<AudioContext | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRingtone = useCallback(() => {
    if (ringTimerRef.current) { clearInterval(ringTimerRef.current); ringTimerRef.current = null; }
    if (ringCtxRef.current) { ringCtxRef.current.close().catch(() => {}); ringCtxRef.current = null; }
  }, []);

  const startRingtone = useCallback(() => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ringCtxRef.current = ctx;
      const playBeep = () => {
        if (!ringCtxRef.current) return;
        const now = ctx.currentTime;
        [0, 0.4].forEach(offset => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 480;
          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.05);
          gain.gain.linearRampToValueAtTime(0, now + offset + 0.3);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.3);
        });
      };
      playBeep();
      ringTimerRef.current = setInterval(playBeep, 2000);
    } catch { /* ignore */ }
  }, []);

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
    stopRingtone();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
  }, [stopRingtone]);

  const handleClose = useCallback(() => {
    stopAll();
    messagesApi.signalSend(matchId, "hangup", "bye").catch(() => {});
    onClose();
  }, [stopAll, matchId, onClose]);

  const buildVideoConstraints = (): MediaTrackConstraints => ({
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: facingModeRef.current,
  });
  const VIDEO_CONSTRAINTS = buildVideoConstraints();
  const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 },
    // @ts-expect-error — нестандартные, но поддерживаемые браузерами параметры подавления эха
    latency: { ideal: 0.01 },
    googEchoCancellation: true,
    googEchoCancellation2: true,
    googAutoGainControl: true,
    googNoiseSuppression: true,
    googNoiseSuppression2: true,
    googHighpassFilter: true,
    googTypingNoiseDetection: true,
    googAudioMirroring: false,
  };

  const applyEchoConstraints = async (stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    try {
      await audioTrack.applyConstraints({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    } catch { /* ignore */ }
  };

  const getMedia = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: AUDIO_CONSTRAINTS });
    } catch {
      // Попробовать только аудио если нет камеры
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: AUDIO_CONSTRAINTS });
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
    await applyEchoConstraints(stream);
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const remoteStreamRef = useRef<MediaStream | null>(null);
  const connectedRef = useRef(false);

  const markConnected = () => {
    if (connectedRef.current) return;
    connectedRef.current = true;
    stopRingtone();
    setCallState("connected");
    startTimer();
  };

  const buildPeer = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach(t => {
      const sender = pc.addTrack(t, stream);
      if (t.kind === "video") {
        const params = sender.getParameters();
        if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
        params.encodings[0].maxBitrate = 2_500_000;
        params.encodings[0].maxFramerate = 30;
        sender.setParameters(params).catch(() => {});
      }
    });

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach(t => {
        if (!remoteStream.getTracks().some(x => x.id === t.id)) remoteStream.addTrack(t);
      });
      // Видео — без звука (muted), чтобы не дублировать аудио и не было эха
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.play().catch(() => {});
      }
      // Звук собеседника воспроизводим ТОЛЬКО через audio-элемент
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        // Чуть ниже максимума — динамики меньше «фонят» в микрофон, меньше эха
        remoteAudioRef.current.volume = 0.85;
        remoteAudioRef.current.play().catch(() => {});
      }
      markConnected();
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        messagesApi.signalSend(matchId, "ice", JSON.stringify(e.candidate)).catch(() => {});
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") markConnected();
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setMediaError("Соединение прервано");
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
    stopRingtone();
    try {
      const stream = await getMedia();
      const pc = buildPeer(stream);
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerPayload)));
      remoteDescSetRef.current = true;
      // применяем буферизованные ICE-кандидаты
      for (const c of iceBufferRef.current) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
      }
      iceBufferRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await messagesApi.signalSend(matchId, "answer", JSON.stringify(answer));
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
              remoteDescSetRef.current = true;
              for (const c of iceBufferRef.current) {
                try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
              }
              iceBufferRef.current = [];
            } catch { /* ignore */ }
          }
          if (sig.signal_type === "ice") {
            const cand = JSON.parse(sig.payload);
            if (pcRef.current && remoteDescSetRef.current) {
              try { await pcRef.current.addIceCandidate(new RTCIceCandidate(cand)); } catch { /* ignore */ }
            } else {
              // буферизуем пока не установлен remoteDescription
              iceBufferRef.current.push(cand);
            }
          }
          if (sig.signal_type === "hangup") {
            stopAll();
            setCallState("ended");
            setTimeout(onClose, 2000);
          }
        }
      } catch { /* ignore */ }
    };

    pollRef.current = setInterval(poll, 1000);
    if (isInitiator) startCall();
    if (!isInitiator) startRingtone();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      stopRingtone();
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

  const switchCamera = async () => {
    if (switchingCam) return;
    setSwitchingCam(true);
    const next = facingModeRef.current === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { ...buildVideoConstraints(), facingMode: { ideal: next } },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) throw new Error("no video track");

      // Заменяем трек в исходящем соединении без пересоздания звонка
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newVideoTrack);

      // Обновляем локальный поток: убираем старый видеотрек, добавляем новый
      const oldTrack = localStreamRef.current?.getVideoTracks()[0];
      if (oldTrack && localStreamRef.current) {
        localStreamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
        localStreamRef.current.addTrack(newVideoTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

      newVideoTrack.enabled = camOn;
      facingModeRef.current = next;
    } catch {
      setMediaError("Не удалось переключить камеру");
      setTimeout(() => setMediaError(null), 2500);
    } finally {
      setSwitchingCam(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#0d0b14" }}>
      <div className="flex-1 relative overflow-hidden">
        {/* Remote video — всегда в DOM чтобы srcObject успел установиться */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: callState === "connected" ? "block" : "none" }}
        />
        {/* Звук собеседника — только здесь, чтобы не было эха */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Экран ожидания */}
        {callState !== "connected" && (
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

        {/* Своё видео — всегда в DOM */}
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
            <button onClick={switchCamera} disabled={switchingCam}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <Icon name={switchingCam ? "Loader" : "SwitchCamera"} size={22}
                className={`text-white ${switchingCam ? "animate-spin" : ""}`} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}