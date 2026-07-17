import { useState, useRef, useEffect } from "react";
import { matchesApi, messagesApi, postsApi, profilesApi, type Message } from "@/lib/api";
import { haptic } from "@/hooks/useNative";
import { queueAction } from "@/hooks/useOffline";
import { useAppRefresh } from "@/hooks/useAppRefresh";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1ce048c9-36f3-4eb8-a0bc-4117b2b48365.jpg";

const AUDIO_MIME_CANDIDATES = [
  "audio/mp4",
  "audio/aac",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function pickAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  for (const type of AUDIO_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

// ─── useChatScreenLogic ─────────────────────────────────────────────────────────
export function useChatScreenLogic(matchId: number, currentUserId: number) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [partnerName, setPartnerName] = useState("...");
  const [partnerPhoto, setPartnerPhoto] = useState(FALLBACK_PHOTO);
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [partnerCity, setPartnerCity] = useState<string | null>(null);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showPlus, setShowPlus] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showVanishPicker, setShowVanishPicker] = useState(false);
  const [vanishPhotos, setVanishPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [showAwardPicker, setShowAwardPicker] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [videoCall, setVideoCall] = useState<{ isInitiator: boolean; offerPayload?: string; earlyIce?: string[] } | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showVideoCircle, setShowVideoCircle] = useState(false);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Свайп влево для удаления сообщения
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [swipeId, setSwipeId] = useState<number | null>(null);
  const [swipeDx, setSwipeDx] = useState(0);

  void currentUserId;

  useEffect(() => {
    messagesApi.getByMatch(matchId)
      .then((d) => { setMsgs(d.messages); setTimeout(() => bottomRef.current?.scrollIntoView(), 50); })
      .catch(() => {});
    matchesApi.getAll().then((d) => {
      const m = d.matches.find((x) => x.match_id === matchId);
      if (m) {
        setPartnerName(m.name);
        setPartnerPhoto(m.photo_url || FALLBACK_PHOTO);
        setPartnerId(m.partner_id);
        profilesApi.subscriptionStatus(m.partner_id)
          .then(r => setSubscribed(r.subscribed))
          .catch(() => {});
        postsApi.getUserProfile(m.partner_id)
          .then(r => setPartnerCity(r.profile?.city || null))
          .catch(() => {});
      }
    }).catch(() => {});
  }, [matchId]);

  useAppRefresh(() => {
    messagesApi.getByMatch(matchId).then((d) => setMsgs(d.messages)).catch(() => {});
  });

  useEffect(() => {
    if (videoCall) return;
    let stopped = false;
    const interval = setInterval(async () => {
      if (stopped) return;
      try {
        const { signals } = await messagesApi.signalPoll(matchId);
        const offerSig = signals.find(s => s.signal_type === "offer");
        if (offerSig) {
          // буферизуем ICE, пришедшие вместе с offer, чтобы не потерять их
          const earlyIce = signals.filter(s => s.signal_type === "ice").map(s => s.payload);
          stopped = true;
          clearInterval(interval);
          setVideoCall({ isInitiator: false, offerPayload: offerSig.payload, earlyIce });
        }
      } catch { /* ignore */ }
    }, 1200);
    return () => { stopped = true; clearInterval(interval); };
  }, [matchId, videoCall]);

  const startRecording = async () => {
    setMicError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError("Запись голосовых сообщений не поддерживается в этом браузере.");
      setTimeout(() => setMicError(null), 5000);
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setMicError("Запись голосовых сообщений не поддерживается в этом браузере.");
      setTimeout(() => setMicError(null), 5000);
      return;
    }

    const mimeType = pickAudioMimeType();
    if (!mimeType) {
      setMicError("Устройство не поддерживает ни один формат записи звука.");
      setTimeout(() => setMicError(null), 5000);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const err = e as { name?: string };
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setMicError("Нет доступа к микрофону. Разреши доступ в настройках телефона: Приложения → Полутон → Разрешения → Микрофон.");
      } else if (err?.name === "NotReadableError") {
        setMicError("Микрофон занят другим приложением. Закрой его и попробуй снова.");
      } else if (err?.name === "NotFoundError") {
        setMicError("Микрофон не найден на устройстве.");
      } else {
        setMicError("Не удалось включить микрофон. Попробуй ещё раз.");
      }
      setTimeout(() => setMicError(null), 5000);
      return;
    }

    try {
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const up = await profilesApi.uploadAudio(base64, mr.mimeType);
            if (up?.url) await sendSystem(`__AUDIO__${up.url}`);
            else setMicError("Не удалось отправить голосовое. Попробуй ещё раз.");
          } catch {
            setMicError("Не удалось отправить голосовое. Проверь соединение и попробуй снова.");
            setTimeout(() => setMicError(null), 5000);
          }
        };
        reader.readAsDataURL(blob);
      };
      mr.onerror = () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setMicError("Ошибка записи звука. Попробуй ещё раз.");
        setTimeout(() => setMicError(null), 5000);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } catch {
      stream.getTracks().forEach(t => t.stop());
      setMicError("Не удалось начать запись. Попробуй ещё раз.");
      setTimeout(() => setMicError(null), 5000);
    }
  };

  const stopRecording = (cancel = false) => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecording(false);
    setRecordSecs(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      if (cancel) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = () => { mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop()); };
      }
      mediaRecorderRef.current.stop();
    }
  };

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    haptic("light");
    if (!navigator.onLine) {
      // Офлайн — кладём в очередь, показываем локально
      const tempMsg: Message = { id: Date.now(), sender_id: 0, text, created_at: new Date().toISOString(), out: true };
      setMsgs((m) => [...m, tempMsg]);
      await queueAction({ type: "send-message", payload: { match_id: matchId, text } });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      return;
    }
    try {
      const msg = await messagesApi.send(matchId, text);
      setMsgs((m) => [...m, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) { void e; }
  };

  const sendSystem = async (text: string) => {
    setShowPlus(false);
    try {
      const msg = await messagesApi.send(matchId, text);
      setMsgs((m) => [...m, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) { void e; }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setShowPlus(false);

    const fileType = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      if (!base64) { input.value = ""; return; }
      try {
        const res = await messagesApi.uploadChatPhoto(matchId, base64, fileType);
        await sendSystem(`__VANISH__${res.photo_url}`);
      } catch { /* ignore */ }
      finally { input.value = ""; }
    };
    reader.onerror = () => { input.value = ""; };
    reader.readAsDataURL(file);
  };

  const openVanishPicker = () => {
    import("@/lib/api").then(({ profilesApi: pApi }) => {
      pApi.listProfilePhotos().then(r => setVanishPhotos(r.photos));
    });
    setShowVanishPicker(true);
    setShowPlus(false);
  };

  const sendVanishPhoto = async (photoUrl: string) => {
    setShowVanishPicker(false);
    await sendSystem(`__VANISH__${photoUrl}`);
  };

  const sendLocation = () => {
    setShowPlus(false);
    if (!navigator.geolocation) {
      sendSystem("📍 Геолокация недоступна");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await sendSystem(`__LOC__${pos.coords.latitude},${pos.coords.longitude}`);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        sendSystem("__GEO_DENIED__");
      },
      { timeout: 8000 }
    );
  };

  const handleDelete = async (msg: Message) => {
    setContextMsg(null);
    setDeleting(msg.id);
    try {
      await messagesApi.delete(msg.id);
      setMsgs((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (e) { void e; }
    finally { setDeleting(null); }
  };

  const startHold = (msg: Message) => {
    holdTimer.current = setTimeout(() => {
      setContextMsg(msg);
      navigator.vibrate?.(30);
    }, 450);
  };
  const cancelHold = () => { if (holdTimer.current) clearTimeout(holdTimer.current); };

  const timeAgoRu = (dateStr: string) => {
    const d = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
    const diff = Math.max(0, Date.now() - new Date(d).getTime());
    const min = Math.floor(diff / 60000);
    if (min < 1) return "только что";
    if (min < 60) return `${min} ${min === 1 ? "минуту" : min < 5 ? "минуты" : "минут"} назад`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ${h === 1 ? "час" : h < 5 ? "часа" : "часов"} назад`;
    const days = Math.floor(h / 24);
    return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} назад`;
  };

  const SWIPE_DELETE_THRESHOLD = 90;

  const onMsgTouchStart = (e: React.TouchEvent, msg: Message) => {
    startHold(msg);
    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwipeId(msg.id);
    setSwipeDx(0);
  };

  const onMsgTouchMove = (e: React.TouchEvent, msg: Message) => {
    if (!swipeStart.current) { cancelHold(); return; }
    const dx = e.touches[0].clientX - swipeStart.current.x;
    const dy = e.touches[0].clientY - swipeStart.current.y;

    // Вертикальное движение или свайп вправо — это скролл, отменяем
    if (Math.abs(dy) > Math.abs(dx) || dx > 0) {
      cancelHold();
      swipeStart.current = null;
      setSwipeId(null);
      setSwipeDx(0);
      return;
    }

    cancelHold();
    if (swipeId === msg.id) {
      setSwipeDx(Math.max(dx, -120));
    }
  };

  const onMsgTouchEnd = (msg: Message) => {
    cancelHold();
    const reached = swipeDx <= -SWIPE_DELETE_THRESHOLD;
    swipeStart.current = null;
    setSwipeId(null);
    setSwipeDx(0);
    if (reached) handleDelete(msg);
  };

  return {
    msgs, input, setInput,
    partnerName, partnerPhoto, partnerId, partnerCity,
    showPartnerProfile, setShowPartnerProfile,
    contextMsg, setContextMsg,
    deleting,
    showPlus, setShowPlus,
    showEmoji, setShowEmoji,
    showStickers, setShowStickers,
    showVanishPicker, setShowVanishPicker,
    vanishPhotos,
    showAwardPicker, setShowAwardPicker,
    geoLoading,
    videoCall, setVideoCall,
    showChatMenu, setShowChatMenu,
    showVideoCircle, setShowVideoCircle,
    showCompatibility, setShowCompatibility,
    subscribed, setSubscribed,
    recording, recordSecs, micError, setMicError,
    inputRef, bottomRef, fileRef, cameraRef,
    swipeId, swipeDx,
    startRecording, stopRecording,
    send, sendSystem,
    handleFileSelect,
    openVanishPicker, sendVanishPhoto, sendLocation,
    handleDelete,
    startHold, cancelHold,
    timeAgoRu,
    onMsgTouchStart, onMsgTouchMove, onMsgTouchEnd,
  };
}