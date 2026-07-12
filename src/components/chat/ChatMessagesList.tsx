import Icon from "@/components/ui/icon";
import { type Message } from "@/lib/api";
import { renderMsgContent } from "@/components/chat/ChatMessageContent";

interface ChatMessagesListProps {
  msgs: Message[];
  partnerId: number | null;
  deleting: number | null;
  swipeId: number | null;
  swipeDx: number;
  bottomRef: React.RefObject<HTMLDivElement>;
  timeAgoRu: (dateStr: string) => string;
  startHold: (msg: Message) => void;
  cancelHold: () => void;
  onMsgTouchStart: (e: React.TouchEvent, msg: Message) => void;
  onMsgTouchMove: (e: React.TouchEvent, msg: Message) => void;
  onMsgTouchEnd: (msg: Message) => void;
  sendSystem: (text: string) => Promise<void>;
}

// ─── ChatMessagesList ────────────────────────────────────────────────────────
export function ChatMessagesList({
  msgs, partnerId, deleting, swipeId, swipeDx, bottomRef,
  timeAgoRu, startHold, cancelHold,
  onMsgTouchStart, onMsgTouchMove, onMsgTouchEnd,
  sendSystem,
}: ChatMessagesListProps) {
  return (
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
      {msgs.map((msg, msgIdx) => {
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

        const prevMsg = msgs[msgIdx - 1];
        const showTimeSeparator = !prevMsg || (
          new Date(msg.created_at.endsWith("Z") ? msg.created_at : msg.created_at + "Z").getTime()
          - new Date(prevMsg.created_at.endsWith("Z") ? prevMsg.created_at : prevMsg.created_at + "Z").getTime()
        ) > 15 * 60 * 1000;

        const isLastOut = msg.out && (msgIdx === msgs.length - 1 || !msgs.slice(msgIdx + 1).some(m => m.out));

        return (
          <div key={msg.id} className="relative" style={{ marginBottom: 2 }}>
            {showTimeSeparator && (
              <div className="flex justify-center my-2">
                <span className="text-white/45 text-[12px] px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {timeAgoRu(msg.created_at)}
                </span>
              </div>
            )}
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
                <div className="relative">
                  <div className={`${msg.out ? "msg-bubble-out" : "msg-bubble-in"} select-none`}
                    style={{ cursor: "pointer" }}>
                    {renderMsgContent(msg.text, msg.out, partnerId ?? undefined, msg.out ? undefined : () => sendSystem("__GRANT_PHOTO__"))}
                  </div>
                  {isLastOut && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "#FF6A3D", border: "2px solid #0f0a1a" }}>
                      <Icon name="Check" size={9} className="text-white" />
                    </div>
                  )}
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
  );
}
