import { useEffect, useRef, useState, useCallback } from "react";
import { messagesApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
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

  // Записывает результат звонка в чат («принят» / «пропущен»), чтобы обе стороны
  // видели его даже если были не в сети во время вызова.
  //  • «accepted» пишет только инициатор — иначе была бы дублирующая запись.
  //  • «missed» может записать любая из сторон (инициатор не дозвонился ИЛИ
  //    получатель отклонил/не успел ответить). От дублей защищает бэкенд:
  //    он не вставляет повторный __VCALL__ в том же матче в течение минуты.
  const logCallResult = useCallback((status: "accepted" | "missed") => {
    if (callLoggedRef.current) return;
    if (status === "accepted" && !isInitiator) return;
    callLoggedRef.current = true;
    messagesApi.send(matchId, `__VCALL__${status}`).catch(() => {});
  }, [isInitiator, matchId]);

  const handleClose = useCallback(() => {
    // Звонок закрыт без соединения — фиксируем пропущенный (от любой стороны).
    if (!connectedRef.current) logCallResult("missed");
    stopAll();
    messagesApi.signalSend(matchId, "hangup", "bye").catch(() => {});
    onClose();
  }, [stopAll, matchId, onClose, logCallResult]);

  const buildVideoConstraints = (): MediaTrackConstraints => ({
    // Просим Full HD как идеал — камера отдаст максимум, что умеет,
    // а адаптация битрейта/разрешения происходит уже в WebRTC при слабой сети.
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
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
      // contentHint="motion" — подсказка кодеку сохранять плавность и детализацию
      // движущегося лица в разговоре (важно для чёткости видео).
      if (t.kind === "video") { try { t.contentHint = "motion"; } catch { /* ignore */ } }
      const sender = pc.addTrack(t, stream);
      if (t.kind === "video") {
        const params = sender.getParameters();
        if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
        // Full HD требует более высокого потолка битрейта для чёткой картинки.
        params.encodings[0].maxBitrate = 4_000_000;
        params.encodings[0].maxFramerate = 30;
        // Не масштабируем разрешение вниз без необходимости — отдаём максимум.
        params.encodings[0].scaleResolutionDownBy = 1;
        // При слабой сети сохраняем чёткость картинки (жертвуя плавностью),
        // чтобы лицо оставалось детализированным.
        params.degradationPreference = "maintain-resolution";
        sender.setParameters(params).catch(() => {});
      }
    });

    // Предпочитаем современные кодеки (VP9 / H264) — заметно лучше картинка
    // при том же битрейте, чем у устаревшего VP8.
    try {
      const caps = RTCRtpReceiver.getCapabilities?.("video");
      const tr = pc.getTransceivers().find(x => x.sender.track?.kind === "video");
      if (caps && tr && tr.setCodecPreferences) {
        const preferred = ["video/VP9", "video/H264", "video/VP8"];
        const sorted = [...caps.codecs].sort((a, b) => {
          const ia = preferred.indexOf(a.mimeType); const ib = preferred.indexOf(b.mimeType);
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });
        tr.setCodecPreferences(sorted);
      }
    } catch { /* ignore — не все браузеры поддерживают */ }

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
      const err = e as Error & { blocked?: boolean };
      const msg = err?.message || "";
      if (err?.blocked || msg.includes("заблокировал") || msg.includes("запретил видеозвонки")) {
        toast({
          title: "Звонок невозможен",
          description: msg || "Пользователь вас заблокировал — вы не можете ему позвонить.",
        });
        onClose?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, onClose]);

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
            // Собеседник запретил видеочаты — его устройство сбросило вызов автоматически.
            // Объясняем звонящему причину, иначе он видит просто «звонок завершён».
            if (sig.payload === "blocked" && isInitiator) {
              toast({
                title: "Звонок невозможен",
                description: "Пользователь запретил видеозвонки от вас.",
              });
            }
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
      // Если экран звонка закрыт/свёрнут без соединения — фиксируем пропущенный
      // (для любой стороны: инициатор не дозвонился или получатель не ответил).
      // handleClose делает то же самое; здесь — на случай ухода свайпом/навигацией.
      if (!connectedRef.current) logCallResult("missed");
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