import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { matchesApi, messagesApi, type Message, type Profile } from "@/lib/api";
import { DiscoverProfileModal } from "@/components/screens/SwipeScreens";
import VideoCall from "@/components/VideoCall";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ─── Исчезающее фото ──────────────────────────────────────────────────────────
function VanishPhoto({ url, out }: { url: string; out: boolean }) {
  const [visible, setVisible] = useState(true);
  const [opened, setOpened] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!opened || out) return;
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timer); setVisible(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [opened, out]);

  if (!visible) {
    return (
      <div className="flex items-center gap-2 px-1 opacity-40">
        <Icon name="Timer" size={14} className="text-white/50" />
        <span className="text-xs text-white/50">Фото исчезло</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {opened || out ? (
          <img src={url} className="rounded-xl object-cover cursor-pointer active:scale-95 transition-transform"
            style={{ maxWidth: 200, maxHeight: 200 }}
            onClick={() => setLightbox(true)} />
        ) : (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all"
            style={{ background: "rgba(255,45,120,0.15)", border: "1.5px solid rgba(255,45,120,0.4)" }}
            onClick={() => !out && setOpened(true)}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,45,120,0.3)", border: "1.5px solid rgba(255,45,120,0.5)" }}>
              <Icon name="Timer" size={20} className="text-pink-400" />
            </div>
            <span className="text-white text-xs font-medium">
              {out ? "Нажми чтобы посмотреть" : "Нажми чтобы открыть"}
            </span>
          </div>
        )}
        {opened && !out && (
          <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full text-white text-[11px] font-bold"
            style={{ background: "rgba(0,0,0,0.65)" }}>
            🔥 {secondsLeft}с
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(14px)" }}
          onClick={() => setLightbox(false)}>
          <button className="absolute top-5 right-5 glass-card p-2.5"
            onClick={() => setLightbox(false)}>
            <Icon name="X" size={20} className="text-white" />
          </button>
          <img src={url} className="rounded-2xl object-contain"
            style={{ maxWidth: "95vw", maxHeight: "90dvh" }}
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

// ─── renderMsgContent ──────────────────────────────────────────────────────────
export function renderMsgContent(text: string, out: boolean) {
  if (text.startsWith("__VANISH__")) {
    const url = text.slice(10);
    return <VanishPhoto url={url} out={out} />;
  }
  if (text.startsWith("__LOC__")) {
    const coords = text.slice(7);
    const [lat, lon] = coords.split(",");
    const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
    const tileUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=14&size=300x180&maptype=mapnik&markers=${lat},${lon},red-dot`;
    return (
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1">
        <div className="rounded-xl overflow-hidden relative" style={{ width: 200, height: 120, background: "rgba(255,255,255,0.08)" }}>
          <img src={tileUrl} className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              const parent = img.parentElement;
              if (parent) parent.innerHTML = `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:rgba(255,255,255,0.5);font-size:12px"><svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='#FF2D78' stroke-width='2'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg><span>${lat.slice(0,7)}, ${lon.slice(0,7)}</span></div>`;
            }}
          />
          <div className="absolute inset-0 flex items-end p-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.55)" }}>
              <Icon name="MapPin" size={11} className="text-pink-400" />
              <span className="text-white text-[11px] font-medium">Открыть карту</span>
            </div>
          </div>
        </div>
      </a>
    );
  }
  if (text.startsWith("__VCALL__")) {
    const status = text.slice(9);
    return (
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: status === "accepted" ? "rgba(74,222,128,0.2)" : "rgba(255,45,120,0.2)" }}>
          <Icon name="Video" size={16} className={status === "accepted" ? "text-green-400" : "text-pink-400"} />
        </div>
        <span className="text-sm">{status === "accepted" ? "Видеозвонок принят ✓" : "Запрос видеозвонка 📹"}</span>
      </div>
    );
  }
  if (text.startsWith("__AWARD__")) {
    const emoji = text.slice(9);
    return (
      <div className="flex flex-col items-center gap-1 py-1 px-3">
        <span className="text-4xl">{emoji}</span>
        <span className="text-xs text-white/60">{out ? "Ты отправил награду" : "Тебе вручена награда!"}</span>
      </div>
    );
  }
  return <span>{text}</span>;
}

// ─── RealChatScreen ────────────────────────────────────────────────────────────
export function RealChatScreen({ matchId, currentUserId, onBack }: { matchId: number; currentUserId: number; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [partnerName, setPartnerName] = useState("...");
  const [partnerPhoto, setPartnerPhoto] = useState(FALLBACK_PHOTO);
  const [partnerId, setPartnerId] = useState<number | null>(null);
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
      if (m) { setPartnerName(m.name); setPartnerPhoto(m.photo_url || FALLBACK_PHOTO); setPartnerId(m.partner_id); }
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
    import("@/lib/api").then(({ profilesApi }) => {
      profilesApi.listProfilePhotos().then(r => setVanishPhotos(r.photos));
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
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setContextMsg(null)}>
          <div className="w-full max-w-sm animate-slide-up"
            style={{ background: "var(--spark-dark2)", borderRadius: "28px 28px 0 0" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/40 text-xs mb-1.5">Сообщение</p>
              <p className="text-white/80 text-sm line-clamp-3">{contextMsg.text}</p>
            </div>
            <button
              onClick={() => handleDelete(contextMsg)}
              className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,45,78,0.15)" }}>
                <Icon name="Trash2" size={18} style={{ color: "#FF2D4E" }} />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-sm">Удалить сообщение</p>
                <p className="text-white/30 text-xs">Удалится у обоих участников</p>
              </div>
            </button>
            <button
              onClick={() => { navigator.clipboard?.writeText(contextMsg.text); setContextMsg(null); }}
              className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <Icon name="Copy" size={18} className="text-white/60" />
              </div>
              <p className="text-white/80 font-semibold text-sm">Скопировать текст</p>
            </button>
            <div className="px-5 pb-6 pt-1">
              <button onClick={() => setContextMsg(null)}
                className="w-full glass-card py-3 text-white/50 text-sm font-medium">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 relative z-10"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
            <Icon name="ChevronLeft" size={24} />
          </button>
          <button onClick={() => setShowPartnerProfile(true)} className="flex items-center gap-3 flex-1 text-left">
            <img src={partnerPhoto} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="text-white font-semibold text-sm">{partnerName}</p>
              <p className="text-white/40 text-xs">Нажми для просмотра профиля</p>
            </div>
          </button>
        </div>

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

        {showPlus && (
          <div className="px-4 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="grid grid-cols-3 gap-2 pt-3 pb-1">
              {[
                { icon: "Camera", label: "Камера", action: () => { cameraRef.current?.click(); setShowPlus(false); } },
                { icon: "Image", label: "Галерея", action: () => { fileRef.current?.click(); setShowPlus(false); } },
                { icon: "Timer", label: "Исчезающее", action: openVanishPicker },
                { icon: "MapPin", label: "Локация", action: sendLocation, loading: geoLoading },
                { icon: "Video", label: "Видеочат", action: () => { setShowPlus(false); setVideoCall({ isInitiator: true }); } },
                { icon: "Trophy", label: "Награда", action: () => { setShowAwardPicker(true); setShowPlus(false); } },
              ].map(({ icon, label, action, loading }) => (
                <button key={label} onClick={action} disabled={loading}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.2),rgba(155,89,182,0.2))" }}>
                    {loading
                      ? <Icon name="Loader2" size={20} className="animate-spin" style={{ color: "#FF2D78" }} />
                      : <Icon name={icon} size={20} style={{ color: "#FF2D78" }} />}
                  </div>
                  <span className="text-white/60 text-[11px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

        {showEmoji && (
          <div className="px-3 pb-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              ["😍","🥰","❤️","🔥","😘","💋","🫦","💕"],
              ["😂","🤣","😭","🥺","😅","🙈","😏","🤤"],
              ["👋","🤙","💪","🙏","👅","💦","🥵","🫠"],
              ["🎉","🏆","💎","🌹","🍓","🦋","✨","💯"],
            ].map((row, i) => (
              <div key={i} className="flex justify-between mb-1">
                {row.map(em => (
                  <button key={em} onClick={() => {
                    setInput(v => v + em);
                    inputRef.current?.focus();
                  }}
                    className="text-2xl w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-75 hover:bg-white/10">
                    {em}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: (showPlus || showEmoji) ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => { setShowPlus(v => !v); setShowEmoji(false); }}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{
              background: showPlus ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.15)"
            }}>
            <Icon name={showPlus ? "X" : "Plus"} size={18} className="text-white" />
          </button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            onFocus={() => { setShowPlus(false); setShowEmoji(false); }}
            placeholder="Написать..."
            className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-pink-500/50 transition-colors font-golos" />
          <button onClick={() => { setShowEmoji(v => !v); setShowPlus(false); }}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 text-xl"
            style={{ background: showEmoji ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
            {showEmoji ? <Icon name="X" size={16} className="text-white" /> : "😊"}
          </button>
          <button onClick={send} className="w-10 h-10 rounded-full flex items-center justify-center btn-grad flex-shrink-0">
            <Icon name="Send" size={16} className="text-white" />
          </button>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
          onClick={() => setShowVanishPicker(false)}>
          <div className="w-full max-w-sm animate-slide-up pb-6 px-4"
            style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between py-4">
              <p className="text-white font-semibold">Выбери исчезающее фото</p>
              <button onClick={() => setShowVanishPicker(false)}>
                <Icon name="X" size={20} className="text-white/50" />
              </button>
            </div>
            {vanishPhotos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Icon name="Image" size={32} className="text-white/20" />
                <p className="text-white/40 text-sm text-center">В галерее нет фото. Добавь фото в профиле.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 pb-2">
                {vanishPhotos.map(p => (
                  <button key={p.id} onClick={() => sendVanishPhoto(p.photo_url)}
                    className="aspect-square rounded-xl overflow-hidden active:scale-95 transition-all">
                    <img src={p.photo_url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAwardPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
          onClick={() => setShowAwardPicker(false)}>
          <div className="w-full max-w-sm animate-slide-up pb-6 px-4"
            style={{ background: "var(--spark-dark2,#1a1625)", borderRadius: "24px 24px 0 0" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between py-4">
              <p className="text-white font-semibold">Вручить награду</p>
              <button onClick={() => setShowAwardPicker(false)}>
                <Icon name="X" size={20} className="text-white/50" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 pb-2">
              {["🏆","🥇","🎖️","👑","💎","🌟","🔥","💝","🦋","🌹","🎁","✨"].map(emoji => (
                <button key={emoji} onClick={() => { sendSystem(`__AWARD__${emoji}`); setShowAwardPicker(false); }}
                  className="aspect-square rounded-2xl flex items-center justify-center text-3xl active:scale-90 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}