import { useState, useRef, useEffect } from "react";
import { matchesApi, messagesApi, postsApi, profilesApi, type Message, type Profile } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import VideoCall from "@/components/VideoCall";
import { renderMsgContent, getTimezoneByCity } from "@/components/chat/ChatMessageContent";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { ChatContextMenu, ChatVanishPicker, ChatMenu, ChatAwardPicker } from "@/components/chat/ChatModals";

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
  const [showVanishPicker, setShowVanishPicker] = useState(false);
  const [vanishPhotos, setVanishPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [showAwardPicker, setShowAwardPicker] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [videoCall, setVideoCall] = useState<{ isInitiator: boolean } | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
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
    const interval = setInterval(async () => {
      try {
        const { signals } = await messagesApi.signalPoll(matchId);
        if (signals.some(s => s.signal_type === "offer")) {
          setVideoCall({ isInitiator: false });
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
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
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setShowPlus(false);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const res = await messagesApi.uploadChatPhoto(matchId, base64, file.type);
        await sendSystem(`__VANISH__${res.photo_url}`);
      } catch { /* ignore */ }
    };
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
        sendSystem("📍 Доступ к геолокации запрещён. Разреши в настройках браузера (🔒 в адресной строке).");
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

  return (
    <>
      {contextMsg && (
        <ChatContextMenu
          msg={contextMsg}
          onDelete={handleDelete}
          onClose={() => setContextMsg(null)}
        />
      )}

      <div className="flex flex-col h-full">
        <ChatHeader
          partnerName={partnerName}
          partnerPhoto={partnerPhoto}
          subscribed={subscribed}
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
        />

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-white/40 text-sm">Начни общение первым! 👋</p>
            </div>
          )}
          {msgs.map((msg) => (
            <div key={msg.id}
              className={`flex flex-col ${msg.out ? "items-end" : "items-start"} ${deleting === msg.id ? "opacity-30" : ""} transition-opacity`}
              onMouseDown={() => startHold(msg)}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={() => startHold(msg)}
              onTouchEnd={cancelHold}
              onTouchMove={cancelHold}>
              <div className={`${msg.out ? "msg-bubble-out" : "msg-bubble-in"} select-none`}
                style={{ cursor: "pointer" }}>
                {renderMsgContent(msg.text, msg.out)}
              </div>
              <span className="text-white/30 text-[11px] mt-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <ChatInputBar
          input={input}
          recording={recording}
          recordSecs={recordSecs}
          showPlus={showPlus}
          showEmoji={showEmoji}
          geoLoading={geoLoading}
          inputRef={inputRef}
          fileRef={fileRef}
          cameraRef={cameraRef}
          onInputChange={setInput}
          onSend={send}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onTogglePlus={() => { setShowPlus(v => !v); setShowEmoji(false); }}
          onToggleEmoji={() => { setShowEmoji(v => !v); setShowPlus(false); }}
          onEmojiPick={(em) => { setInput(v => v + em); inputRef.current?.focus(); }}
          onFileSelect={handleFileSelect}
          onOpenVanishPicker={openVanishPicker}
          onSendLocation={sendLocation}
          onOpenVideoCall={() => { setShowPlus(false); setVideoCall({ isInitiator: true }); }}
          onOpenAwardPicker={() => { setShowAwardPicker(true); setShowPlus(false); }}
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
          onClose={() => setVideoCall(null)}
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
    </>
  );
}