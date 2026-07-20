import { useEffect, useRef, useState, useCallback } from "react";
import { messagesApi } from "@/lib/api";
import { checkMediaPrereqs, describeMediaError } from "@/lib/mediaAccess";
import { ICE_SERVERS, AUDIO_CONSTRAINTS, type CallState, type VideoCallProps } from "./constants";

export function useVideoCall({ matchId, isInitiator, initialOffer, earlyIce, onClose }: VideoCallProps) {
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

  const callLoggedRef = useRef(false);

  // Записывает результат звонка в чат («принят» / «пропущен»), чтобы собеседник
  // увидел его, даже если был не в сети во время вызова. Логирует только
  // инициатор звонка — иначе оба участника вставили бы дублирующее сообщение.
  const logCallResult = useCallback((status: "accepted" | "missed") => {
    if (!isInitiator || callLoggedRef.current) return;
    callLoggedRef.current = true;
    messagesApi.send(matchId, `__VCALL__${status}`).catch(() => {});
  }, [isInitiator, matchId]);

  const handleClose = useCallback(() => {
    if (isInitiator && !connectedRef.current) logCallResult("missed");
    stopAll();
    messagesApi.signalSend(matchId, "hangup", "bye").catch(() => {});
    onClose();
  }, [stopAll, matchId, onClose, isInitiator, logCallResult]);

  const buildVideoConstraints = (): MediaTrackConstraints => ({
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: facingModeRef.current,
  });
  const VIDEO_CONSTRAINTS = buildVideoConstraints();

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
    const prereq = checkMediaPrereqs("микрофону и камере");
    if (prereq) {
      setMediaError(prereq);
      throw new Error(prereq);
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: AUDIO_CONSTRAINTS });
    } catch {
      // Попробовать только аудио если нет камеры
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: AUDIO_CONSTRAINTS });
        setMediaError("Камера недоступна — звонок только с аудио");
      } catch (e) {
        setMediaError(await describeMediaError(e, "микрофону и камере", "camera"));
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
    logCallResult("accepted");
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
            if (isInitiator && !connectedRef.current) logCallResult("missed");
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

    // Если собеседник долго не отвечает — сами завершаем звонок, чтобы не
    // держать микрофон/камеру захваченными бесконечно и не оставлять
    // «зависший» offer-сигнал висеть в системе.
    const noAnswerTimer = isInitiator
      ? setTimeout(() => {
          if (!connectedRef.current) {
            logCallResult("missed");
            messagesApi.signalSend(matchId, "hangup", "no-answer").catch(() => {});
            stopAll();
            setCallState("ended");
            setTimeout(onClose, 1500);
          }
        }, 45000)
      : null;

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (noAnswerTimer) clearTimeout(noAnswerTimer);
      stopRingtone();
      // Если инициатор просто закрыл/свернул экран звонка, не дозвонившись —
      // тоже фиксируем пропущенный звонок (handleClose делает то же самое, но
      // на случай ухода без кнопки «положить трубку» логируем и здесь).
      if (isInitiator && !connectedRef.current) logCallResult("missed");
      // Всегда освобождаем микрофон/камеру при размонтировании компонента —
      // даже если пользователь ушёл с экрана свайпом/навигацией, а не кнопкой
      // «положить трубку». Иначе устройство остаётся «занятым» и следующий
      // звонок падает с ошибкой NotReadableError.
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
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

  return {
    callState,
    micOn,
    camOn,
    duration,
    mediaError,
    switchingCam,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    handleClose,
    acceptCall,
    toggleMic,
    toggleCam,
    switchCamera,
  };
}
