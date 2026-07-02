import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { matchesApi, messagesApi, postsApi, profilesApi, type Message, type Profile } from "@/lib/api";
import { haptic, nativeShare } from "@/hooks/useNative";
import { queueAction } from "@/hooks/useOffline";
import { VideoCircleRecorder } from "@/components/chat/VideoCircleRecorder";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import VideoCall from "@/components/VideoCall";
import { renderMsgContent, getTimezoneByCity } from "@/components/chat/ChatMessageContent";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { ChatContextMenu, ChatVanishPicker, ChatMenu, ChatAwardPicker } from "@/components/chat/ChatModals";
import { CompatibilityGame } from "@/components/screens/CompatibilityGame";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ─── RealChatScreen ────────────────────────────────────────────────────────────
export function RealChatScreen({ matchId, currentUserId, onBack }: { matchId: number; currentUserId: number; onBack: () => void }) {
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const up = await profilesApi.uploadAudio(base64, mr.mimeType);
            if (up?.url) await sendSystem(`__AUDIO__${up.url}`);
          } catch { void 0; }
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } catch {
      alert("Нет доступа к микрофону. Разреши в настройках браузера.");
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

  return (
    <>
      {contextMsg && (
        <ChatContextMenu
          msg={contextMsg}
          onDelete={handleDelete}
          onClose={() => setContextMsg(null)}
        />
      )}

      <div className="flex flex-col h-full" style={{ overscrollBehaviorX: "none" }}>
        <ChatHeader
          partnerName={partnerName}
          partnerPhoto={partnerPhoto}
          subscribed={subscribed}
          isBot={partnerName === 'LoveBloom'}
          onBack={onBack}
          onProfileClick={() => setShowPartnerProfile(true)}
          onSubscribeToggle={() => {
            if (!partnerId) return;
            const next = !subscribed;
            setSubscribed(next);
            profilesApi.subscribeToggle(partnerId).then(r => setSubscribed(r.subscribed)).catch(() => setSubscribed(!next));
          }}
          onVideoCall={() => setVideoCall({ isInitiator: true })}
          onMenuOpen={() => setShowChatMenu(true)}
          onCompatibility={() => setShowCompatibility(true)}
        />

        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1.5"
          style={{ background: "linear-gradient(180deg, rgba(15,10,26,0) 0%, rgba(10,5,20,0.3) 100%)", overscrollBehaviorX: "none", touchAction: "pan-y" }}>
          {msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                👋
              </div>
              <p className="text-white/40 text-sm">Напиши первым — начни общение!</p>
            </div>
          )}
          {msgs.map((msg) => {
            const timeStr = new Date(
              msg.created_at.endsWith("Z") ? msg.created_at : msg.created_at + "Z"
            ).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });

            const isSpecial = msg.text.startsWith("__GIFT__")
              || msg.text.startsWith("__AWARD__")
              || msg.text.startsWith("__VIDEOCIRCLE__")
              || msg.text.startsWith("__PREMIUM__")
              || msg.text.startsWith("__STICKER__");

            const isSwiping = swipeId === msg.id && swipeDx < 0;
            const willDelete = swipeDx <= -90;

            return (
              <div key={msg.id} className="relative" style={{ marginBottom: 2 }}>
                {isSwiping && (
                  <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-3 pointer-events-none"
                    style={{ width: Math.min(-swipeDx, 120) }}>
                    <div className="flex items-center justify-center rounded-full transition-colors"
                      style={{
                        width: 36, height: 36,
                        background: willDelete ? "#FF2D78" : "rgba(255,45,120,0.25)",
                      }}>
                      <Icon name="Trash2" size={18} className="text-white" />
                    </div>
                  </div>
                )}
              <div
                className={`flex flex-col ${msg.out ? "items-end" : "items-start"} ${deleting === msg.id ? "opacity-30" : ""}`}
                style={{
                  transform: isSwiping ? `translateX(${swipeDx}px)` : undefined,
                  transition: swipeId === msg.id ? "none" : "transform 0.2s ease, opacity 0.2s",
                }}
                onMouseDown={() => startHold(msg)}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={(e) => onMsgTouchStart(e, msg)}
                onTouchMove={(e) => onMsgTouchMove(e, msg)}
                onTouchEnd={() => onMsgTouchEnd(msg)}>

                {isSpecial ? (
                  /* Спец. сообщения без пузыря */
                  <div className="flex flex-col items-center select-none" style={{ cursor: "pointer" }}>
                    {renderMsgContent(msg.text, msg.out, partnerId ?? undefined, msg.out ? undefined : () => sendSystem("__GRANT_PHOTO__"))}
                    <span className="text-white/25 text-[10px] mt-1">{timeStr}</span>
                  </div>
                ) : (
                  /* Обычные пузыри */
                  <div className={`flex flex-col gap-0.5 ${msg.out ? "items-end" : "items-start"}`} style={{ maxWidth: "80%" }}>
                    <div className={`${msg.out ? "msg-bubble-out" : "msg-bubble-in"} select-none`}
                      style={{ cursor: "pointer" }}>
                      {renderMsgContent(msg.text, msg.out, partnerId ?? undefined, msg.out ? undefined : () => sendSystem("__GRANT_PHOTO__"))}
                    </div>
                    <span className={`text-[10px] mt-0.5 px-1 ${msg.out ? "text-right text-white/35" : "text-white/30"}`}>
                      {timeStr}
                    </span>
                  </div>
                )}
              </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <ChatInputBar
          input={input}
          recording={recording}
          recordSecs={recordSecs}
          showPlus={showPlus}
          showEmoji={showEmoji}
          showStickers={showStickers}
          geoLoading={geoLoading}
          inputRef={inputRef}
          fileRef={fileRef}
          cameraRef={cameraRef}
          onInputChange={setInput}
          onSend={send}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onTogglePlus={() => { setShowPlus(v => !v); setShowEmoji(false); setShowStickers(false); }}
          onToggleEmoji={() => { setShowEmoji(v => !v); setShowPlus(false); setShowStickers(false); }}
          onToggleStickers={() => { setShowStickers(v => !v); setShowPlus(false); setShowEmoji(false); }}
          onEmojiPick={(em) => { setInput(v => v + em); inputRef.current?.focus(); }}
          onSendSticker={(url) => { sendSystem(`__STICKER__${url}`); setShowStickers(false); }}
          onFileSelect={handleFileSelect}
          onOpenVanishPicker={openVanishPicker}
          onSendLocation={sendLocation}
          onOpenVideoCall={() => { setShowPlus(false); setVideoCall({ isInitiator: true }); }}
          onOpenAwardPicker={() => { setShowAwardPicker(true); setShowPlus(false); }}
          onOpenVideoCircle={() => { setShowVideoCircle(true); setShowPlus(false); }}
        />
      </div>

      {showPartnerProfile && partnerId && (
        <DiscoverProfileModal
          profile={{ id: partnerId, name: partnerName, photo_url: partnerPhoto } as Profile}
          onClose={() => setShowPartnerProfile(false)}
          onLike={() => {}}
        />
      )}

      {videoCall && (
        <VideoCall
          matchId={matchId}
          partnerName={partnerName}
          partnerPhoto={partnerPhoto}
          isInitiator={videoCall.isInitiator}
          initialOffer={videoCall.offerPayload}
          earlyIce={videoCall.earlyIce}
          onClose={() => setVideoCall(null)}
        />
      )}

      {showVideoCircle && (
        <VideoCircleRecorder
          onClose={() => setShowVideoCircle(false)}
          onSend={async (blob, mimeType) => {
            setShowVideoCircle(false);
            try {
              const reader = new FileReader();
              reader.onload = async (e) => {
                const base64 = (e.target?.result as string).split(",")[1];
                const up = await profilesApi.uploadVideoCircle(base64, mimeType);
                if (up?.url) await sendSystem(`__VIDEOCIRCLE__${up.url}`);
              };
              reader.readAsDataURL(blob);
            } catch { void 0; }
          }}
        />
      )}

      {showVanishPicker && (
        <ChatVanishPicker
          photos={vanishPhotos}
          onPick={sendVanishPhoto}
          onClose={() => setShowVanishPicker(false)}
        />
      )}

      {showChatMenu && (
        <ChatMenu
          onGrantPhoto={() => { setShowChatMenu(false); sendSystem("__GRANT_PHOTO__"); }}
          onRequestPhoto={() => { setShowChatMenu(false); sendSystem("__REQUEST_PHOTO__"); }}
          onClose={() => setShowChatMenu(false)}
        />
      )}

      {showAwardPicker && (
        <ChatAwardPicker
          onPick={(emoji) => { sendSystem(`__AWARD__${emoji}`); setShowAwardPicker(false); }}
          onClose={() => setShowAwardPicker(false)}
        />
      )}

      {showCompatibility && partnerId && (
        <CompatibilityGame
          matchId={matchId}
          partnerId={partnerId}
          partnerName={partnerName}
          partnerPhoto={partnerPhoto}
          currentUserId={currentUserId}
          onClose={() => setShowCompatibility(false)}
        />
      )}
    </>
  );
}